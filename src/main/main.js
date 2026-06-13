const { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, Menu, Tray, dialog, nativeImage } = require('electron');
const path = require('path');
const { fileURLToPath } = require('url');
const fs = require('fs');

let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch (error) {
  autoUpdater = null;
}

const APP_NAME = '사이드메모장';
const APP_DEVELOPER = 'Seokryu';
const APP_CONTACT = 'kjseokryu@gmail.com';
const DATA_FILE = 'side-memojang-data.json';
const CURRENT_APP_VERSION = app.getVersion();

const TRUSTED_RENDERER_DIR = path.join(__dirname, '../renderer');
const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

function isTrustedRendererUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'file:') return false;
    const filePath = path.normalize(fileURLToPath(parsed));
    const trustedPath = path.normalize(TRUSTED_RENDERER_DIR);
    const relative = path.relative(trustedPath, filePath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  } catch {
    return false;
  }
}

function isTrustedIpcEvent(event) {
  const senderUrl = event?.senderFrame?.url || event?.sender?.getURL?.() || '';
  return isTrustedRendererUrl(senderUrl);
}

function guardIpc(event) {
  if (!isTrustedIpcEvent(event)) {
    throw new Error('Blocked IPC call from untrusted renderer.');
  }
}

function lockDownWindowNavigation(win) {
  if (!win) return;
  win.webContents.setWindowOpenHandler(({ url }) => {
    safeOpenExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedRendererUrl(url)) {
      event.preventDefault();
      safeOpenExternal(url);
    }
  });
}


let panelWindow = null;
let settingsWindow = null;
let tray = null;
let appState = null;
let isExpanded = true;
let isQuitting = false;
let verticalSaveTimer = null;
let resizeSaveTimer = null;

const DEFAULT_MEMO = { id: 'memo-1', title: '메모 1', content: '', color: 'purple' };

const DEFAULT_STATE = {
  version: 2,
  appVersion: CURRENT_APP_VERSION,
  settings: {
    alwaysOnTop: true,
    collapseOnBlur: true,
    spellcheck: false,
    position: 'right',
    monitorMode: 'auto',
    fixedDisplayId: null,
    width: 600,
    collapsedWidth: 84,
    collapsedLengthScale: 100,
    collapsedFlatMode: true,
    height: 820,
    verticalRatio: 0.22,
    launchAtStartup: true,
    ignoredUpdateCoreVersion: null
  },
  memos: [DEFAULT_MEMO],
  activeMemoId: 'memo-1'
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function dataPath() {
  return path.join(app.getPath('userData'), DATA_FILE);
}

function normalizeMemo(memo, index) {
  const base = index === 0 ? clone(DEFAULT_MEMO) : { ...clone(DEFAULT_MEMO), id: `memo-${Date.now()}-${index}`, title: `메모 ${index + 1}` };
  return {
    ...base,
    ...memo,
    id: String(memo?.id || base.id),
    title: memo?.title || base.title,
    content: memo?.content || '',
    color: memo?.color || memo?.theme || 'purple'
  };
}

function normalizeState(raw) {
  const base = clone(DEFAULT_STATE);
  const memos = Array.isArray(raw?.memos) && raw.memos.length
    ? raw.memos.map(normalizeMemo)
    : clone(base.memos);
  const activeMemoId = memos.some((memo) => memo.id === raw?.activeMemoId) ? raw.activeMemoId : memos[0].id;
  return {
    ...base,
    ...(raw || {}),
    version: 2,
    appVersion: CURRENT_APP_VERSION,
    settings: {
      ...base.settings,
      ...(raw?.settings || {}),
      width: Math.max(360, Number(raw?.settings?.width || base.settings.width)),
      height: Math.max(420, Number(raw?.settings?.height || base.settings.height)),
      collapsedWidth: Math.max(84, Number(raw?.settings?.collapsedWidth || base.settings.collapsedWidth)),
      collapsedLengthScale: Math.min(200, Math.max(20, Number(raw?.settings?.collapsedLengthScale ?? base.settings.collapsedLengthScale))),
      verticalRatio: Math.min(1, Math.max(0, Number(raw?.settings?.verticalRatio ?? base.settings.verticalRatio))),
      spellcheck: Boolean(raw?.settings?.spellcheck ?? base.settings.spellcheck),
      ignoredUpdateCoreVersion: raw?.settings?.ignoredUpdateCoreVersion || null
    },
    memos,
    activeMemoId
  };
}

function loadState() {
  try {
    const file = dataPath();
    if (!fs.existsSync(file)) return normalizeState(DEFAULT_STATE);
    return normalizeState(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch (error) {
    console.error('Failed to load state:', error);
    return normalizeState(DEFAULT_STATE);
  }
}

function saveState() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(dataPath(), JSON.stringify(appState, null, 2), 'utf8');
}

function getTargetDisplay() {
  const displays = screen.getAllDisplays();
  if (appState.settings.monitorMode === 'fixed' && appState.settings.fixedDisplayId) {
    const fixed = displays.find((display) => String(display.id) === String(appState.settings.fixedDisplayId));
    if (fixed) return fixed;
  }
  const cursor = screen.getCursorScreenPoint();
  return screen.getDisplayNearestPoint(cursor) || screen.getPrimaryDisplay();
}

function panelBounds(expanded = isExpanded) {
  const display = getTargetDisplay();
  const area = display.workArea;
  const maxExpandedWidth = Math.max(360, area.width - 16);
  const maxExpandedHeight = Math.max(420, area.height - 16);
  const flatCollapsed = Boolean(appState.settings.collapsedFlatMode);
  const collapsedScale = Math.min(200, Math.max(20, Number(appState.settings.collapsedLengthScale ?? 100))) / 100;
  // 접힌 탭은 투명도를 자르는 방식이 아니라 실제 창 폭과 탭 폭을 같이 늘린다.
  // 오른쪽/왼쪽 도킹 모두 둥근 끝은 유지하고 가운데 평평한 영역만 자연스럽게 길어진다.
  const collapsedBaseWidth = flatCollapsed ? 44 : 82;
  const collapsedVisualWidth = Math.round(Math.min(190, Math.max(flatCollapsed ? 24 : 34, collapsedBaseWidth * collapsedScale)));
  const collapsedSidePadding = 10;
  const collapsedWidth = collapsedVisualWidth + collapsedSidePadding;
  const width = expanded ? Math.min(maxExpandedWidth, Math.max(360, appState.settings.width)) : collapsedWidth;
  const memoCount = Math.max(1, appState.memos.length);
  // 접힌 상태의 창 높이는 CSS의 실제 탭 높이와 버튼 높이에 맞춰 계산한다.
  // 이전 계산이 작아서 작은 접힘 모드에서 ... 버튼이 잘리는 문제가 있었다.
  const collapsedHeightRaw = flatCollapsed
    ? (memoCount * 58) + 104
    : (memoCount * 52) + 104;
  const collapsedHeight = Math.min(area.height - 24, Math.max(flatCollapsed ? 178 : 158, collapsedHeightRaw));
  const height = expanded ? Math.min(maxExpandedHeight, Math.max(420, appState.settings.height)) : collapsedHeight;
  const x = appState.settings.position === 'left' ? area.x : area.x + area.width - width;
  const maxY = Math.max(area.y, area.y + area.height - height - 8);
  const minY = area.y + 8;
  const ratio = Math.min(1, Math.max(0, Number(appState.settings.verticalRatio ?? 0.22)));
  const y = Math.round(minY + (maxY - minY) * ratio);
  return { x, y: Math.min(maxY, Math.max(minY, y)), width, height };
}

function setVerticalPositionFromPointer(screenY, grabOffset, commit = false) {
  if (!panelWindow || !appState) return appState;
  const display = getTargetDisplay();
  const area = display.workArea;
  const bounds = panelBounds(isExpanded);
  const height = bounds.height;
  const minY = area.y + 8;
  const maxY = Math.max(minY, area.y + area.height - height - 8);
  const nextY = Math.min(maxY, Math.max(minY, Math.round(Number(screenY) - Number(grabOffset || 0))));
  const ratio = maxY === minY ? 0 : (nextY - minY) / (maxY - minY);
  appState.settings.verticalRatio = Math.min(1, Math.max(0, ratio));
  panelWindow.setBounds({ ...bounds, y: nextY }, false);

  // 드래그 중에는 매 프레임 렌더러를 다시 그리지 않는다.
  // 이전 버전의 끊김은 pointermove마다 저장+broadcast를 하면서 창이 재렌더링돼서 생겼다.
  clearTimeout(verticalSaveTimer);
  if (commit) {
    saveState();
    broadcastState();
  } else {
    verticalSaveTimer = setTimeout(() => saveState(), 180);
  }
  return appState;
}


function setPanelSize(width, height, commit = false) {
  if (!panelWindow || !appState) return appState;
  const display = getTargetDisplay();
  const area = display.workArea;
  const current = panelWindow.getBounds();
  const nextWidth = Math.min(Math.max(280, Math.round(Number(width) || appState.settings.width)), Math.max(280, area.width - 4));
  const nextHeight = Math.min(Math.max(260, Math.round(Number(height) || appState.settings.height)), Math.max(260, area.height - 4));
  appState.settings.width = nextWidth;
  appState.settings.height = nextHeight;

  // 크기 조절 때는 상단 y를 고정한다. 아래쪽만 늘어나고 줄어든다.
  // 좌/우 붙임 상태에 따라 화면 가장자리도 고정한다.
  const x = appState.settings.position === 'left' ? area.x : area.x + area.width - nextWidth;
  const minY = area.y + 4;
  const maxY = Math.max(minY, area.y + area.height - nextHeight - 4);
  const y = Math.min(maxY, Math.max(minY, current.y));
  const ratio = maxY === minY ? 0 : (y - minY) / (maxY - minY);
  appState.settings.verticalRatio = Math.min(1, Math.max(0, ratio));
  panelWindow.setBounds({ x, y, width: nextWidth, height: nextHeight }, false);
  panelWindow.setOpacity(1);
  panelWindow.setAlwaysOnTop(Boolean(appState.settings.alwaysOnTop), 'screen-saver');

  clearTimeout(resizeSaveTimer);
  if (commit) {
    saveState();
    broadcastState();
  } else {
    resizeSaveTimer = setTimeout(() => saveState(), 180);
  }
  return appState;
}

function applyPanelBounds() {
  if (!panelWindow) return;
  panelWindow.setBounds(panelBounds(), false);
  panelWindow.setOpacity(1);
  panelWindow.setAlwaysOnTop(Boolean(appState.settings.alwaysOnTop), 'screen-saver');
}

function setExpanded(next) {
  isExpanded = Boolean(next);
  applyPanelBounds();
  if (panelWindow && !panelWindow.isVisible()) panelWindow.showInactive();
  if (panelWindow) panelWindow.webContents.send('panel:expanded', isExpanded);
}

function hidePanelWindow() {
  if (!panelWindow || panelWindow.isDestroyed()) return false;
  panelWindow.hide();
  return true;
}

function forceShowPanelOnStartup() {
  if (!panelWindow || panelWindow.isDestroyed()) return;

  const restoreAlwaysOnTop = Boolean(appState?.settings?.alwaysOnTop);
  try {
    isExpanded = true;
    applyPanelBounds();
    panelWindow.show();
    panelWindow.moveTop();
    panelWindow.focus();
    panelWindow.setAlwaysOnTop(true, 'screen-saver');
    setTimeout(() => {
      if (!panelWindow || panelWindow.isDestroyed()) return;
      panelWindow.setAlwaysOnTop(restoreAlwaysOnTop, 'screen-saver');
    }, 1200);
    panelWindow.webContents.send('panel:expanded', true);
  } catch (_) {}
}

function createPanelWindow() {
  panelWindow = new BrowserWindow({
    ...panelBounds(isExpanded),
    frame: false,
    resizable: false,
    movable: false,
    show: false,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    alwaysOnTop: appState.settings.alwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  panelWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  lockDownWindowNavigation(panelWindow);
  panelWindow.once('ready-to-show', forceShowPanelOnStartup);
  panelWindow.on('blur', () => {
    if (!appState.settings.collapseOnBlur) return;
    setExpanded(false);
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 620,
    title: `${APP_NAME} 설정`,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));
  lockDownWindowNavigation(settingsWindow);
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function registerShortcut() {
  // 단축키 기능은 제거했다. 이전 버전에서 등록된 단축키가 남지 않도록 해제만 한다.
  globalShortcut.unregisterAll();
}


function getVersionCore(version) {
  const text = String(version || '').trim().replace(/^v/i, '');
  const match = text.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function getVersionCoreKey(version) {
  const core = getVersionCore(version);
  return core ? core.join('.') : null;
}

function compareVersionCore(a, b) {
  const aa = getVersionCore(a);
  const bb = getVersionCore(b);
  if (!aa || !bb) return 0;
  for (let i = 0; i < 3; i += 1) {
    if (aa[i] > bb[i]) return 1;
    if (aa[i] < bb[i]) return -1;
  }
  return 0;
}

function isRealUpdateVersion(latestVersion) {
  // v1.0.0.01 같은 세부 빌드는 앞 3자리(1.0.0)가 같으므로 업데이트 알림을 띄우지 않는다.
  return compareVersionCore(latestVersion, CURRENT_APP_VERSION) > 0;
}

function markUpdateCoreIgnored(version) {
  if (!appState) return;
  appState.settings.ignoredUpdateCoreVersion = getVersionCoreKey(version);
  saveState();
  broadcastState();
}

function clearIgnoredUpdateIfNeeded(latestVersion) {
  if (!appState?.settings?.ignoredUpdateCoreVersion) return;
  const latestCore = getVersionCoreKey(latestVersion);
  if (latestCore && latestCore !== appState.settings.ignoredUpdateCoreVersion) {
    appState.settings.ignoredUpdateCoreVersion = null;
    saveState();
    broadcastState();
  }
}


async function showUpdateDialogOnTop(options) {
  const parent = (
    settingsWindow && !settingsWindow.isDestroyed() && settingsWindow.isVisible()
      ? settingsWindow
      : panelWindow && !panelWindow.isDestroyed()
        ? panelWindow
        : null
  );

  let previousAlwaysOnTop = false;

  try {
    if (parent) {
      previousAlwaysOnTop = parent.isAlwaysOnTop();
      if (parent.isMinimized()) parent.restore();
      parent.show();
      parent.focus();
      parent.setAlwaysOnTop(true, 'screen-saver');
    }

    if (parent) {
      return await dialog.showMessageBox(parent, options);
    }

    return await dialog.showMessageBox(options);
  } finally {
    try {
      if (parent && !parent.isDestroyed()) {
        parent.setAlwaysOnTop(previousAlwaysOnTop);
      }
    } catch {
      // ignore restore errors
    }
  }
}


let lastUpdateStatus = null;

function broadcastUpdateStatus(payload) {
  const message = {
    checkedAt: new Date().toISOString(),
    currentVersion: CURRENT_APP_VERSION,
    ...(payload || {})
  };
  lastUpdateStatus = message;
  BrowserWindow.getAllWindows().forEach((win) => {
    try { win.webContents.send('update:status', message); } catch (_) {}
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientUpdateError(error) {
  const text = String(error?.message || error || '').toLowerCase();
  return text.includes('504')
    || text.includes('timeout')
    || text.includes('timed out')
    || text.includes('gateway')
    || text.includes('econnreset')
    || text.includes('enetunreach')
    || text.includes('eai_again')
    || text.includes('network')
    || text.includes('fetch failed');
}

function summarizeUpdateError(error) {
  const text = String(error?.message || error || '').replace(/\r?\n/g, ' ').trim();
  if (!text) return '알 수 없는 오류';
  if (text.includes('504') || /gateway\s*time-?out/i.test(text)) {
    return 'GitHub 응답 지연 또는 504 Gateway Time-out';
  }
  if (/timeout|timed out/i.test(text)) return 'GitHub 응답 시간 초과';
  if (/network|fetch failed|econnreset|enetunreach|eai_again/i.test(text)) return '네트워크 연결 문제';
  return text.length > 220 ? `${text.slice(0, 220)}...` : text;
}

function setupAutoUpdater() {
  if (!autoUpdater) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowDowngrade = false;
  // 개인/미서명 빌드에서 업데이트 설치 시 서명 검증 오류를 막기 위한 설정
  // electron-updater는 false 값을 무시하므로, 항상 정상(null)을 반환하는 함수로 덮어쓴다.
  autoUpdater.verifyUpdateCodeSignature = async () => null;

  autoUpdater.on('update-available', async (info) => {
    const latestVersion = info?.version || info?.tag || '';
    const latestCore = getVersionCoreKey(latestVersion);
    clearIgnoredUpdateIfNeeded(latestVersion);

    if (!isRealUpdateVersion(latestVersion)) return;
    if (latestCore && appState?.settings?.ignoredUpdateCoreVersion === latestCore) {
      broadcastUpdateStatus({ status: 'ignored', version: latestVersion, message: '업데이트가 있지만 이번 버전은 알리지 않음 상태입니다.' });
      return;
    }

    broadcastUpdateStatus({ status: 'available', version: latestVersion, message: '업데이트가 있습니다.' });

    const result = await showUpdateDialogOnTop({
      type: 'info',
      title: '업데이트 발견',
      message: `사이드메모장 ${latestVersion} 업데이트가 있습니다.`,
      detail: `현재 버전: ${CURRENT_APP_VERSION}\n새 버전: ${latestVersion}\n\n업데이트를 받을까요?`,
      buttons: ['업데이트', '다음 버전까지 알리지 않음', '나중에'],
      defaultId: 0,
      cancelId: 2,
      noLink: true
    });

    if (result.response === 1) {
      markUpdateCoreIgnored(latestVersion);
      return;
    }
    if (result.response !== 0) return;

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      showUpdateDialogOnTop({
        type: 'error',
        title: '업데이트 실패',
        message: '업데이트 다운로드에 실패했습니다.',
        detail: String(error?.message || error),
        buttons: ['확인']
      });
    }
  });

  autoUpdater.on('update-downloaded', async (info) => {
    const latestVersion = info?.version || '';
    broadcastUpdateStatus({ status: 'downloaded', version: latestVersion, message: '업데이트 다운로드가 완료되었습니다.' });
    const result = await showUpdateDialogOnTop({
      type: 'info',
      title: '업데이트 준비 완료',
      message: `사이드메모장 ${latestVersion || ''} 업데이트 다운로드가 완료되었습니다.`,
      detail: '지금 재시작하면 업데이트가 설치됩니다.',
      buttons: ['지금 재시작해서 설치', '나중에'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });
    if (result.response === 0) {
      isQuitting = true;
      autoUpdater.quitAndInstall(false, true);
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto update error:', error);
    broadcastUpdateStatus({
      status: 'error',
      reason: summarizeUpdateError(error),
      rawReason: String(error?.message || error),
      message: '업데이트 확인에 실패했습니다.'
    });
  });
}

async function checkForUpdates({ manual = false } = {}) {
  broadcastUpdateStatus({ status: 'checking', message: manual ? '수동으로 업데이트를 확인 중입니다.' : '앱 실행 후 자동으로 업데이트를 확인 중입니다.' });

  if (!autoUpdater) {
    const payload = { ok: false, status: 'error', reason: 'electron-updater is not installed', currentVersion: CURRENT_APP_VERSION };
    broadcastUpdateStatus({ ...payload, message: '업데이트 기능을 사용할 수 없습니다.' });
    if (manual) {
      showUpdateDialogOnTop({
        type: 'warning',
        title: '업데이트 확인 불가',
        message: 'electron-updater가 설치되어 있지 않습니다.',
        detail: 'npm install 후 다시 실행하거나 빌드하세요.',
        buttons: ['확인']
      });
    }
    return payload;
  }

  if (!app.isPackaged) {
    const payload = { ok: false, status: 'development', reason: 'development mode', currentVersion: CURRENT_APP_VERSION };
    broadcastUpdateStatus({ ...payload, message: '개발 실행 상태라 자동 업데이트 확인을 건너뜁니다.' });
    if (manual) {
      showUpdateDialogOnTop({
        type: 'info',
        title: '개발 모드',
        message: '개발 모드에서는 자동 업데이트를 확인하지 않습니다.',
        detail: 'Setup.exe로 설치한 빌드에서 작동합니다.',
        buttons: ['확인']
      });
    }
    return payload;
  }

  const maxAttempts = manual ? 3 : 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (attempt > 1) {
        broadcastUpdateStatus({
          status: 'checking',
          attempt,
          maxAttempts,
          message: `GitHub 응답이 불안정해서 다시 확인 중입니다. (${attempt}/${maxAttempts})`
        });
      }

      const result = await autoUpdater.checkForUpdates();
      const latestVersion = result?.updateInfo?.version || '';
      const latestCore = getVersionCoreKey(latestVersion);
      const isAvailable = latestVersion && isRealUpdateVersion(latestVersion);
      const isIgnored = isAvailable && latestCore && appState?.settings?.ignoredUpdateCoreVersion === latestCore;

      if (isIgnored) {
        const payload = { ok: true, status: 'ignored', version: latestVersion, currentVersion: CURRENT_APP_VERSION };
        broadcastUpdateStatus({ ...payload, message: '업데이트가 있지만 이번 버전은 알리지 않음 상태입니다.' });
        return payload;
      }

      if (isAvailable) {
        const payload = { ok: true, status: 'available', version: latestVersion, currentVersion: CURRENT_APP_VERSION };
        broadcastUpdateStatus({ ...payload, message: '업데이트가 있습니다.' });
        return payload;
      }

      const payload = { ok: true, status: 'latest', version: latestVersion || CURRENT_APP_VERSION, currentVersion: CURRENT_APP_VERSION };
      broadcastUpdateStatus({ ...payload, message: '최신 버전입니다.' });

      if (manual) {
        showUpdateDialogOnTop({
          type: 'info',
          title: '업데이트 확인',
          message: '현재 최신 버전입니다.',
          detail: `현재 버전: ${CURRENT_APP_VERSION}${latestVersion ? `\n확인된 최신 버전: ${latestVersion}` : ''}`,
          buttons: ['확인']
        });
      }

      return payload;
    } catch (error) {
      lastError = error;
      const transient = isTransientUpdateError(error);
      const reason = summarizeUpdateError(error);

      if (attempt < maxAttempts && transient) {
        broadcastUpdateStatus({
          ok: false,
          status: 'checking',
          reason,
          attempt,
          maxAttempts,
          message: `GitHub 응답 지연. 잠시 후 다시 확인합니다. (${attempt}/${maxAttempts})`
        });
        await wait(2500 * attempt);
        continue;
      }

      const payload = {
        ok: false,
        status: 'error',
        reason,
        rawReason: String(error?.message || error),
        currentVersion: CURRENT_APP_VERSION
      };
      broadcastUpdateStatus({ ...payload, message: '업데이트 확인에 실패했습니다.' });

      if (manual) {
        showUpdateDialogOnTop({
          type: 'warning',
          title: '업데이트 확인 실패',
          message: '업데이트 정보를 확인하지 못했습니다.',
          detail: `${reason}\n\nGitHub 서버가 잠시 응답하지 않을 수 있습니다. 잠시 후 다시 눌러보세요.`,
          buttons: ['확인']
        });
      }
      return payload;
    }
  }

  const reason = summarizeUpdateError(lastError);
  const payload = { ok: false, status: 'error', reason, currentVersion: CURRENT_APP_VERSION };
  broadcastUpdateStatus({ ...payload, message: '업데이트 확인에 실패했습니다.' });
  return payload;
}

function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, '../../assets/icon.ico');
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) {
    trayIcon = nativeImage.createFromPath(path.join(__dirname, '../../assets/trayTemplate.png'));
  }

  tray = new Tray(trayIcon);
  tray.setToolTip(`${APP_NAME} v${CURRENT_APP_VERSION}\nDeveloped by ${APP_DEVELOPER}\n${APP_CONTACT}`);

  const rebuildMenu = () => {
    const template = [
      {
        label: isExpanded ? '접기' : '펼치기',
        click: () => {
          if (panelWindow && !panelWindow.isVisible()) setExpanded(true);
          else setExpanded(!isExpanded);
          rebuildMenu();
        }
      },
      {
        label: '설정 열기',
        click: () => createSettingsWindow()
      },
      { type: 'separator' },
      {
        label: '업데이트 확인',
        click: () => checkForUpdates({ manual: true })
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ];
    tray.setContextMenu(Menu.buildFromTemplate(template));
  };

  tray.on('click', () => {
    if (panelWindow && !panelWindow.isVisible()) setExpanded(true);
    else setExpanded(!isExpanded);
    rebuildMenu();
  });
  tray.on('double-click', () => {
    setExpanded(true);
    rebuildMenu();
  });

  rebuildMenu();
}


function toggleDockSide() {
  appState.settings.position = appState.settings.position === 'left' ? 'right' : 'left';
  saveState();
  applyPanelBounds();
  broadcastState();
  return appState;
}

function moveToAdjacentDisplay(direction) {
  const displays = screen.getAllDisplays().sort((a, b) => a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y);
  if (displays.length <= 1) return { moved: false, displayCount: displays.length };
  const current = getTargetDisplay();
  let index = displays.findIndex((display) => String(display.id) === String(current.id));
  if (index < 0) index = 0;
  const step = direction === 'left' ? -1 : 1;
  const next = displays[(index + step + displays.length) % displays.length];
  appState.settings.monitorMode = 'fixed';
  appState.settings.fixedDisplayId = next.id;
  saveState();
  applyPanelBounds();
  broadcastState();
  return { moved: true, displayCount: displays.length, displayId: next.id };
}

function safeOpenExternal(rawUrl) {
  try {
    if (typeof rawUrl !== 'string') return false;
    const trimmed = rawUrl.trim();
    if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return false;
    const url = new URL(trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed);
    const protocol = url.protocol.toLowerCase();
    const allowed = ['http:', 'https:', 'mailto:'];
    if (!allowed.includes(protocol)) return false;
    if ((protocol === 'http:' || protocol === 'https:') && !url.hostname) return false;
    shell.openExternal(url.toString());
    return true;
  } catch {
    return false;
  }
}

function syncLaunchAtStartup(enabled) {
  app.setLoginItemSettings({ openAtLogin: Boolean(enabled), path: process.execPath });
}

function broadcastState() {
  if (panelWindow) panelWindow.webContents.send('state:changed', appState);
  if (settingsWindow) settingsWindow.webContents.send('state:changed', appState);
}

ipcMain.handle('state:get', (event) => { guardIpc(event); return appState; });
ipcMain.handle('state:set', (event, nextState) => {
  guardIpc(event);
  appState = normalizeState({
    ...appState,
    ...nextState,
    settings: { ...appState.settings, ...(nextState.settings || {}) },
    memos: Array.isArray(nextState.memos) ? nextState.memos : appState.memos
  });
  saveState();
  syncLaunchAtStartup(appState.settings.launchAtStartup);
  registerShortcut();
  applyPanelBounds();
  broadcastState();
  return appState;
});
ipcMain.handle('panel:expand', (event, expanded) => { guardIpc(event); return setExpanded(expanded); });
ipcMain.handle('panel:toggle', (event) => { guardIpc(event); return setExpanded(!isExpanded); });
ipcMain.handle('panel:hide', (event) => { guardIpc(event); return hidePanelWindow(); });
ipcMain.handle('panel:set-vertical-position', (event, screenY, grabOffset, commit) => { guardIpc(event); return setVerticalPositionFromPointer(screenY, grabOffset, commit); });
ipcMain.handle('panel:set-size', (event, width, height, commit) => { guardIpc(event); return setPanelSize(width, height, commit); });
ipcMain.handle('settings:open', (event) => { guardIpc(event); return createSettingsWindow(); });
ipcMain.handle('display:move', (event, direction) => { guardIpc(event); return moveToAdjacentDisplay(direction); });
ipcMain.handle('display:toggle-dock-side', (event) => { guardIpc(event); return toggleDockSide(); });
ipcMain.handle('link:open', (event, url) => { guardIpc(event); return safeOpenExternal(url); });
ipcMain.handle('display:list', (event) => { guardIpc(event); return screen.getAllDisplays().map((d) => ({ id: d.id, bounds: d.bounds, workArea: d.workArea })); });
ipcMain.handle('data:export', async (event) => {
  guardIpc(event);
  const result = await dialog.showSaveDialog({
    title: '사이드메모장 데이터 내보내기',
    defaultPath: 'side-memojang-data.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return false;
  fs.writeFileSync(result.filePath, JSON.stringify(appState, null, 2), 'utf8');
  return true;
});
ipcMain.handle('data:import', async (event) => {
  guardIpc(event);
  const result = await dialog.showOpenDialog({
    title: '사이드메모장 데이터 가져오기',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const stat = fs.statSync(result.filePaths[0]);
  if (stat.size > MAX_IMPORT_FILE_BYTES) throw new Error('Import file is too large.');
  const imported = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
  appState = normalizeState(imported);
  saveState();
  registerShortcut();
  applyPanelBounds();
  broadcastState();
  return appState;
});
ipcMain.handle('data:reset', (event) => {
  guardIpc(event);
  appState = normalizeState(DEFAULT_STATE);
  saveState();
  registerShortcut();
  applyPanelBounds();
  broadcastState();
  return appState;
});

ipcMain.handle('update:check', (event) => { guardIpc(event); return checkForUpdates({ manual: true }); });
ipcMain.handle('update:getStatus', (event) => { guardIpc(event); return lastUpdateStatus || { status: 'idle', currentVersion: CURRENT_APP_VERSION, message: '아직 업데이트 확인 전입니다.' }; });

ipcMain.handle('memo:export-single', async (event, { title, content }) => {
  guardIpc(event);
  const safeName = String(title || '메모').replace(/[<>:"/\\|?*]/g, '_').trim() || '메모';
  const result = await dialog.showSaveDialog({
    title: '메모 내보내기',
    defaultPath: `${safeName}.txt`,
    filters: [
      { name: '텍스트', extensions: ['txt'] },
      { name: 'Markdown', extensions: ['md'] }
    ]
  });
  if (result.canceled || !result.filePath) return false;
  const plainText = String(content || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
  fs.writeFileSync(result.filePath, plainText, 'utf8');
  return true;
});


ipcMain.handle('settings:updateSetting', async (event, key, value) => {
  guardIpc(event);
  appState.settings[key] = value;
  saveState();
  const state = appState;
  BrowserWindow.getAllWindows().forEach((win) => {
    try { win.webContents.send('settings:changed', { [key]: value }, state); } catch (_) {}
  });
  return state;
});

ipcMain.handle('settings:updateSettings', async (event, settings) => {
  guardIpc(event);
  appState.settings = { ...appState.settings, ...(settings || {}) };
  saveState();
  const state = appState;
  BrowserWindow.getAllWindows().forEach((win) => {
    try { win.webContents.send('settings:changed', settings || {}, state); } catch (_) {}
  });
  return state;
});

app.whenReady().then(() => {
  app.setName(APP_NAME);
  appState = loadState();
  // 앱을 새로 켤 때는 트레이에 숨어 있는 것처럼 보이지 않도록 항상 화면 위쪽에 펼쳐서 띄운다.
  // 사용 중 위/아래 이동은 그대로 가능하지만, 다음 실행 때 다시 위쪽으로 정렬된다.
  isExpanded = true;
  appState.settings.verticalRatio = 0.02;
  syncLaunchAtStartup(appState.settings.launchAtStartup);
  setupAutoUpdater();
  createPanelWindow();
  createTray();
  registerShortcut();
  // 앱 실행 후 창/트레이가 안정적으로 뜬 다음 자동 업데이트를 확인한다.
  setTimeout(() => checkForUpdates({ manual: false }), 3000);

  screen.on('display-added', applyPanelBounds);
  screen.on('display-removed', applyPanelBounds);
  screen.on('display-metrics-changed', applyPanelBounds);
});

app.on('before-quit', () => { isQuitting = true; });
app.on('window-all-closed', (event) => {
  if (!isQuitting) event.preventDefault();
});
app.on('will-quit', () => globalShortcut.unregisterAll());
