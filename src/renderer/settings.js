



const colorSaturationSlider = document.getElementById('colorSaturationSlider');
const colorSaturationValue = document.getElementById('colorSaturationValue');
const collapsedLengthSlider = document.getElementById('collapsedLengthSlider');
const collapsedLengthValue = document.getElementById('collapsedLengthValue');
const api = window.sideMemo;
let state;
let autoSaveTimer = null;
let isRendering = false;

const fields = {
  alwaysOnTop: document.getElementById('alwaysOnTop'),
  collapseOnBlur: document.getElementById('collapseOnBlur'),
  collapsedFlatMode: document.getElementById('collapsedFlatMode'),
  spellcheck: document.getElementById('spellcheck'),
  launchAtStartup: document.getElementById('launchAtStartup'),
  position: document.getElementById('position'),
  width: document.getElementById('width'),
  height: document.getElementById('height'),
  colorSaturation: document.getElementById('colorSaturationSlider'),
  collapsedLengthScale: document.getElementById('collapsedLengthSlider')
};



function normalizeColorSaturation(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 100;
  return Math.max(0, Math.min(200, number));
}

function normalizeCollapsedLengthScale(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 100;
  return Math.max(20, Math.min(200, number));
}

function render() {
  if (!state) return;
  isRendering = true;
  const s = state.settings;
  fields.alwaysOnTop.checked = Boolean(s.alwaysOnTop);
  fields.collapseOnBlur.checked = s.collapseOnBlur !== false;
  fields.collapsedFlatMode.checked = Boolean(s.collapsedFlatMode);
  fields.spellcheck.checked = Boolean(s.spellcheck);
  fields.launchAtStartup.checked = Boolean(s.launchAtStartup);
  fields.position.value = s.position || 'right';
  fields.width.value = s.width || 600;
  fields.height.value = s.height || 820;
  const saturation = normalizeColorSaturation(s.colorSaturation);
  if (fields.colorSaturation) fields.colorSaturation.value = String(saturation);
  if (colorSaturationValue) colorSaturationValue.textContent = `${saturation}%`;
  const collapsedLength = normalizeCollapsedLengthScale(s.collapsedLengthScale);
  if (fields.collapsedLengthScale) fields.collapsedLengthScale.value = String(collapsedLength);
  if (collapsedLengthValue) collapsedLengthValue.textContent = `${collapsedLength}%`;
  isRendering = false;
}

function collect() {
  state.settings = {
    ...state.settings,
    alwaysOnTop: fields.alwaysOnTop.checked,
    collapseOnBlur: fields.collapseOnBlur.checked,
    collapsedFlatMode: fields.collapsedFlatMode.checked,
    spellcheck: fields.spellcheck.checked,
    launchAtStartup: fields.launchAtStartup.checked,
    position: fields.position.value,
    width: Number(fields.width.value) || 600,
    height: Number(fields.height.value) || 820,
    colorSaturation: normalizeColorSaturation(fields.colorSaturation?.value),
    collapsedLengthScale: normalizeCollapsedLengthScale(fields.collapsedLengthScale?.value)
  };
}

async function saveNow({ rerender = false } = {}) {
  if (!state) return;
  collect();
  state = await api.setState(state);
  if (rerender) render();
  if (typeof syncColorSaturationControl === 'function') syncColorSaturationControl(state?.settings || {});
}

function scheduleSave(delay = 250) {
  if (isRendering) return;
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => saveNow({ rerender: false }), delay);
}

Object.values(fields).forEach((field) => {
  if (!field) return;
  const applyImmediately = field.type === 'checkbox' || field.tagName === 'SELECT' || field.type === 'number' || field.type === 'range';
  field.addEventListener('change', () => saveNow({ rerender: false }));
  field.addEventListener('input', () => {
    if (isRendering) return;
    if (applyImmediately) saveNow({ rerender: false });
    else saveNow({ rerender: false });
  });
});


if (fields.colorSaturation) {
  fields.colorSaturation.addEventListener('input', () => {
    if (isRendering) return;
    if (colorSaturationValue) colorSaturationValue.textContent = `${normalizeColorSaturation(fields.colorSaturation.value)}%`;
    saveNow({ rerender: false });
  });
  fields.colorSaturation.addEventListener('change', () => saveNow({ rerender: false }));
}

if (fields.collapsedLengthScale) {
  fields.collapsedLengthScale.addEventListener('input', () => {
    if (isRendering) return;
    const value = normalizeCollapsedLengthScale(fields.collapsedLengthScale.value);
    if (collapsedLengthValue) collapsedLengthValue.textContent = `${value}%`;
    saveNow({ rerender: false });
  });
  fields.collapsedLengthScale.addEventListener('change', () => saveNow({ rerender: false }));
}

const checkUpdatesButton = document.getElementById('checkUpdates');
const updateStatusText = document.getElementById('updateStatusText');

function setUpdateStatus(message, type = 'neutral') {
  if (!updateStatusText) return;
  updateStatusText.textContent = message;
  updateStatusText.dataset.status = type;
}

function applyUpdateStatus(result) {
  if (!result) return;
  if (result.status === 'checking') {
    setUpdateStatus('업데이트 확인 중...\nGitHub Releases에서 최신 버전을 자동 확인하고 있습니다.', 'checking');
  } else if (result.status === 'available') {
    setUpdateStatus(`업데이트가 있습니다.\n현재 버전: ${result.currentVersion || ''}\n최신 버전: ${result.version || ''}`, 'available');
  } else if (result.status === 'latest') {
    setUpdateStatus(`최신 버전입니다.\n현재 버전: ${result.currentVersion || ''}\n확인된 최신 버전: ${result.version || result.currentVersion || ''}`, 'latest');
  } else if (result.status === 'downloaded') {
    setUpdateStatus(`업데이트 다운로드가 완료되었습니다.\n최신 버전: ${result.version || ''}`, 'available');
  } else if (result.status === 'ignored') {
    setUpdateStatus(`업데이트가 있지만 이번 버전은 알리지 않음 상태입니다.\n최신 버전: ${result.version || ''}`, 'ignored');
  } else if (result.status === 'development') {
    setUpdateStatus('개발 실행 상태입니다.\n설치된 빌드에서 자동 업데이트 확인이 작동합니다.', 'neutral');
  } else if (result.status === 'error') {
    setUpdateStatus(`업데이트 확인에 실패했습니다.${result.reason ? `\n${result.reason}` : ''}\n잠시 후 다시 확인해 주세요.`, 'error');
  } else if (result.status === 'idle') {
    setUpdateStatus('앱 실행 후 자동으로 업데이트를 확인합니다.', 'neutral');
  } else {
    setUpdateStatus('업데이트 상태를 확인하지 못했습니다.', 'error');
  }
}

if (checkUpdatesButton) {
  checkUpdatesButton.addEventListener('click', async () => {
    checkUpdatesButton.disabled = true;
    setUpdateStatus('업데이트 확인 중...\nGitHub Releases에서 최신 버전을 확인하고 있습니다.', 'checking');
    try {
      const result = await api.checkForUpdates();
      if (result?.status === 'available') {
        setUpdateStatus(`업데이트가 있습니다.\n현재 버전: ${result.currentVersion || ''}\n최신 버전: ${result.version || ''}`, 'available');
      } else if (result?.status === 'latest') {
        setUpdateStatus(`최신 버전입니다.\n현재 버전: ${result.currentVersion || ''}\n확인된 최신 버전: ${result.version || result.currentVersion || ''}`, 'latest');
      } else if (result?.status === 'ignored') {
        setUpdateStatus(`업데이트가 있지만 이번 버전은 알리지 않음 상태입니다.\n최신 버전: ${result.version || ''}`, 'ignored');
      } else if (result?.reason === 'development mode') {
        setUpdateStatus('개발 모드에서는 업데이트 확인이 제한됩니다.\n설치된 빌드에서 다시 확인하세요.', 'error');
      } else {
        applyUpdateStatus(result);
      }
    } catch (error) {
      setUpdateStatus('업데이트 확인에 실패했습니다.\n잠시 후 다시 확인해 주세요.', 'error');
    } finally {
      checkUpdatesButton.disabled = false;
    }
  });
}


const contactEmail = document.getElementById('contactEmail');
if (contactEmail) {
  contactEmail.addEventListener('click', (event) => {
    event.preventDefault();
    api.openLink('mailto:kjseokryu@gmail.com');
  });
}
document.getElementById('exportData').addEventListener('click', () => api.exportData());
document.getElementById('importData').addEventListener('click', async () => {
  const imported = await api.importData();
  if (imported) {
    state = imported;
    render();
  }
});
document.getElementById('resetData').addEventListener('click', async () => {
  if (!confirm('모든 메모와 설정을 초기화할까요?')) return;
  state = await api.resetData();
  render();
});

if (api.onUpdateStatus) {
  api.onUpdateStatus((payload) => {
    applyUpdateStatus(payload);
  });
}

api.onStateChanged((next) => {
  state = next;
  const active = document.activeElement;
  const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'SELECT');
  if (!isTyping) render();
});

(async function init() {
  state = await api.getState();
  if (api.getUpdateStatus) {
    try {
      const updateStatus = await api.getUpdateStatus();
      applyUpdateStatus(updateStatus);
    } catch (_) {}
  }

  const versionLabel = document.getElementById('appVersionLabel');
  if (versionLabel && state?.appVersion) versionLabel.textContent = `사이드메모장 v${state.appVersion}`;
  render();
})();