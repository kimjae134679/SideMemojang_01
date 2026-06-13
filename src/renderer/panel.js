const api = window.sideMemo;
let state;
let expanded = false;
let saveTimer = null;
let deletedMemo = null;
let deletedMemos = null;
let deletedIndex = 0;
let toastTimer = null;
let appearanceOpen = false;
let menuMemoId = null;

const app = document.getElementById('app');
const collapsedStack = document.getElementById('collapsedStack');
const closeButton = document.getElementById('closeButton');
const hidePanelButton = document.getElementById('hidePanelButton');
const settingsButton = document.getElementById('settingsButton');
const addMemoButton = document.getElementById('addMemoButton');
const listButtonTop = document.getElementById('listButtonTop');
const memoTabs = document.getElementById('memoTabs');
const memoEditor = document.getElementById('memoEditor');
const memoColor = document.getElementById('memoColor');
const colorPalette = document.getElementById('colorPalette');
const saturationSlider = document.getElementById('saturationSlider');
const saturationValue = document.getElementById('saturationValue');
const appearanceCard = document.getElementById('appearanceCard');
const toggleAppearanceButton = document.getElementById('toggleAppearanceButton');
const boldButton = document.getElementById('boldButton');
const italicButton = document.getElementById('italicButton');
const underlineButton = document.getElementById('underlineButton');
const strikeButton = document.getElementById('strikeButton');
const textColorButton = document.getElementById('textColorButton');
const textColorMenu = document.getElementById('textColorMenu');
const textAppearanceCard = document.getElementById('textAppearanceCard');
const textColorInlinePalette = document.getElementById('textColorInlinePalette');
const customTextColor = document.getElementById('customTextColor');
let savedEditorRange = null;
const listButton = document.getElementById('listButton');
const memoMenu = document.getElementById('memoMenu');
const renameMemoButton = document.getElementById('renameMemoButton');
const deleteFromMenuButton = document.getElementById('deleteFromMenuButton');
const renameInline = document.getElementById('renameInline');
const menuActions = document.getElementById('menuActions');
const renameInput = document.getElementById('renameInput');
const cancelRenameButton = document.getElementById('cancelRenameButton');
const saveRenameButton = document.getElementById('saveRenameButton');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
const undoDeleteButton = document.getElementById('undoDeleteButton');
const closeToastButton = document.getElementById('closeToastButton');
const listModal = document.getElementById('listModal');
const closeListButton = document.getElementById('closeListButton');
const memoListItems = document.getElementById('memoListItems');
const selectAllMemosButton = document.getElementById('selectAllMemosButton');
const deleteSelectedMemosButton = document.getElementById('deleteSelectedMemosButton');
const moveDisplayLeft = document.getElementById('moveDisplayLeft');
const moveDisplayRight = document.getElementById('moveDisplayRight');
const dockSideButton = document.getElementById('dockSideButton');
const resizeHandle = document.getElementById('resizeHandle');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const alignLeftButton = document.getElementById('alignLeftButton');
const alignCenterButton = document.getElementById('alignCenterButton');
const alignRightButton = document.getElementById('alignRightButton');
const checklistButton = document.getElementById('checklistButton');
const findBar = document.getElementById('findBar');
const findInput = document.getElementById('findInput');
const findPrevButton = document.getElementById('findPrevButton');
const findNextButton = document.getElementById('findNextButton');
const findCountEl = document.getElementById('findCount');
const findCloseButton = document.getElementById('findCloseButton');
const copyMemoButton = document.getElementById('copyMemoButton');
const exportMemoButton = document.getElementById('exportMemoButton');
const charCount = document.getElementById('charCount');
let selectedListIds = new Set();
const editorHistory = new Map();
let applyingHistory = false;
let pendingBoldInput = false;
let editorTypingGuard = false;
let editorTypingTimer = null;
let collapsedDrag = null;
let dragFrame = null;
let latestDragEvent = null;
let suppressCollapsedClick = false;
let reorderDrag = null;
let findMatches = [];
let findIndex = -1;
let findActive = false;
let panelResize = null;
let resizeFrame = null;
let latestResizeEvent = null;

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const COLOR_MAP = {
  purple: [151, 129, 214], violet: [139, 118, 196], indigo: [129, 137, 208],
  pink: [208, 143, 210], magenta: [210, 128, 171], rose: [213, 138, 151],
  red: [210, 124, 124], peach: [214, 154, 123], orange: [218, 151, 100],
  amber: [210, 166, 90], yellow: [217, 190, 107], lime: [184, 215, 112],
  green: [112, 190, 136], emerald: [95, 178, 151], mint: [126, 205, 174],
  teal: [99, 180, 171], cyan: [121, 196, 205], sky: [107, 173, 209],
  blue: [139, 173, 214], navy: [102, 137, 190], lavender: [177, 160, 220],
  slate: [150, 160, 174], gray: [196, 202, 210], dark: [69, 78, 94]
};
const COLOR_LABELS = {
  purple: '보라', violet: '진보라', indigo: '인디고', pink: '분홍', magenta: '마젠타',
  rose: '장미', red: '빨강', peach: '피치', orange: '주황', amber: '호박',
  yellow: '노랑', lime: '라임', green: '초록', emerald: '에메랄드',
  mint: '민트', teal: '청록', cyan: '민트블루', sky: '하늘',
  blue: '파랑', navy: '네이비', lavender: '라벤더', slate: '슬레이트',
  gray: '회색', dark: '다크'
};


function setAppearancePanel(open) {
  appearanceOpen = Boolean(open);
  if (appearanceCard) appearanceCard.classList.toggle('collapsed-appearance', !appearanceOpen);
  if (toggleAppearanceButton) toggleAppearanceButton.classList.toggle('active', appearanceOpen);
}
function setTextColorPanel(open) {
  if (!textAppearanceCard) return;
  textAppearanceCard.hidden = !open;
  textAppearanceCard.classList.toggle('collapsed-appearance', !open);
  if (textColorButton) textColorButton.classList.toggle('active', open);
}
function closeTextColorPanel() { setTextColorPanel(false); }


function markEditorTyping() {
  editorTypingGuard = true;
  clearTimeout(editorTypingTimer);
  editorTypingTimer = setTimeout(() => {
    editorTypingGuard = false;
  }, 900);
}
function shouldSkipEditorSync() {
  return editorTypingGuard && document.activeElement === memoEditor;
}


function currentSaturation() {
  const value = Number(state?.settings?.colorSaturation);
  if (Number.isFinite(value)) return Math.max(0, Math.min(200, value));
  return 100;
}
function applySaturationSetting(value = null) {
  const nextValue = value === null || value === undefined ? currentSaturation() : Math.max(0, Math.min(200, Number(value)));
  app.style.setProperty('--theme-saturation', `${nextValue}%`);
  const wash = Math.max(0, Math.min(72, Math.round((100 - Math.min(nextValue, 100)) * 0.72)));
  app.style.setProperty('--theme-wash', `${wash}%`);
}

function currentCollapsedLengthScale() {
  const value = Number(state?.settings?.collapsedLengthScale);
  if (Number.isFinite(value)) return Math.max(20, Math.min(200, value));
  return 100;
}
function applyCollapsedLengthSetting(value = null) {
  const nextValue = value === null || value === undefined ? currentCollapsedLengthScale() : Math.max(20, Math.min(200, Number(value)));
  app.style.setProperty('--collapsed-length-scale', String(nextValue / 100));
}

function activeMemo() {
  return state.memos.find((memo) => memo.id === state.activeMemoId) || state.memos[0];
}
function normalizeStateMemoColors(nextState = state) {
  if (!nextState?.memos) return;
  nextState.memos.forEach((memo) => {
    memo.color = normalizeMemoColor(memo.color || 'purple');
  });
}
function normalizeMemoColor(color) {
  if (COLOR_MAP[color]) return color;
  return ['charcoal', 'midnight', 'espresso', 'graphite'].includes(color) ? 'dark' : 'purple';
}
function rgb(color) { return COLOR_MAP[normalizeMemoColor(color)] || COLOR_MAP.purple; }
function colorToRgba(color, opacity = 1) {
  const [r, g, b] = rgb(color);
  return `rgba(${r}, ${g}, ${b}, ${Number(opacity || 1)})`;
}
function textColor(color) {
  return normalizeMemoColor(color) === 'dark' ? '#f9fafb' : '#17171f';
}
function setThemeVars(memo = activeMemo()) {
  const color = normalizeMemoColor(memo.color || 'purple');
  if (memo.color !== color) memo.color = color;
  const isDarkTheme = color === 'dark';
  app.style.setProperty('--memo-bg', colorToRgba(color, 1));
  app.style.setProperty('--memo-strong', colorToRgba(color, 1));
  app.style.setProperty('--memo-soft', colorToRgba(color, isDarkTheme ? 0.32 : 0.24));
  app.style.setProperty('--memo-softer', colorToRgba(color, isDarkTheme ? 0.18 : 0.11));
  app.style.setProperty('--memo-wash', colorToRgba(color, isDarkTheme ? 0.12 : 0.055));
  app.style.setProperty('--memo-text', textColor(color));
  app.style.setProperty('--editor-text', textColor(color));
  app.classList.toggle('dark-theme', isDarkTheme);
  app.dataset.theme = color;
  app.dataset.themeTone = isDarkTheme ? 'dark' : 'light';
  app.dataset.position = state?.settings?.position || 'right';
}

function closeAllFloatingUi() {
  appearanceOpen = false;
  menuMemoId = null;
  if (memoMenu) memoMenu.hidden = true;
  if (renameInline) renameInline.hidden = true;
  if (textColorMenu) textColorMenu.hidden = true;
  closeTextColorPanel();
  if (listModal) listModal.hidden = true;
  if (toast) {
    toast.hidden = true;
    clearTimeout(toastTimer);
  }
  selectedListIds = new Set();
}
async function collapseCleanly() {
  closeAllFloatingUi();
  await api.expandPanel(false);
}

function setExpandedUi(next) {
  expanded = Boolean(next);
  app.classList.toggle('collapsed', !expanded);
  app.classList.toggle('expanded', expanded);
  app.classList.toggle('flat-collapsed', Boolean(state?.settings?.collapsedFlatMode));
  closeMemoMenu();
  closeRenameInline();
  if (!expanded) closeAllFloatingUi();
}
function titleFor(memo, index) {
  return memo.title?.trim() || `메모 ${index + 1}`;
}
function contentIsEmpty(html) {
  return !String(html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
}
function applySpellcheckSetting() {
  if (!memoEditor) return;
  const enabled = Boolean(state?.settings?.spellcheck);
  memoEditor.spellcheck = enabled;
  memoEditor.setAttribute('spellcheck', enabled ? 'true' : 'false');
}

function historyFor(id) {
  if (!editorHistory.has(id)) editorHistory.set(id, { undo: [], redo: [] });
  return editorHistory.get(id);
}
function ensureEditorHistory(memo = activeMemo()) {
  const h = historyFor(memo.id);
  const html = memo.content || '';
  if (!h.undo.length) h.undo.push(html);
  else if (h.undo[h.undo.length - 1] !== html && !applyingHistory) h.undo.push(html);
  if (h.undo.length > 100) h.undo.splice(0, h.undo.length - 100);
}
function recordEditorHistory(memo = activeMemo()) {
  if (applyingHistory) return;
  const h = historyFor(memo.id);
  const html = memo.content || '';
  if (!h.undo.length || h.undo[h.undo.length - 1] !== html) {
    h.undo.push(html);
    if (h.undo.length > 100) h.undo.splice(0, h.undo.length - 100);
  }
  h.redo = [];
}
function placeCaretAtEnd(el) {
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (_) {}
}
async function applyEditorHtml(html) {
  applyingHistory = true;
  activeMemo().content = sanitizeHtml(html);
  memoEditor.innerHTML = activeMemo().content;
  memoEditor.classList.toggle('empty', contentIsEmpty(activeMemo().content));
  placeCaretAtEnd(memoEditor);
  applyingHistory = false;
  await persistNow();
}
async function undoEditor() {
  const memo = activeMemo();
  const h = historyFor(memo.id);
  ensureEditorHistory(memo);
  if (h.undo.length <= 1) return;
  const current = h.undo.pop();
  h.redo.push(current);
  await applyEditorHtml(h.undo[h.undo.length - 1] || '');
}
async function redoEditor() {
  const memo = activeMemo();
  const h = historyFor(memo.id);
  if (!h.redo.length) return;
  const next = h.redo.pop();
  h.undo.push(next);
  await applyEditorHtml(next);
}

function bindCollapsedVerticalDrag() {
  const flushDragMove = () => {
    dragFrame = null;
    if (!collapsedDrag || !latestDragEvent) return;
    api.setVerticalPosition(latestDragEvent.screenY, collapsedDrag.offsetY, false).then((next) => {
      if (next) state = next;
    }).catch(() => {});
  };

  collapsedStack.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const handle = event.target.closest('.collapsed-drag-handle');
    if (!handle) return;
    event.preventDefault();
    event.stopPropagation();
    collapsedDrag = {
      pointerId: event.pointerId,
      startX: event.screenX,
      startY: event.screenY,
      offsetY: event.clientY,
      moved: false
    };
    latestDragEvent = null;
    suppressCollapsedClick = false;
    document.body.classList.add('is-dragging-position');
    handle.setPointerCapture?.(event.pointerId);
  });

  collapsedStack.addEventListener('pointermove', (event) => {
    if (!collapsedDrag || event.pointerId !== collapsedDrag.pointerId) return;
    const dx = Math.abs(event.screenX - collapsedDrag.startX);
    const dy = Math.abs(event.screenY - collapsedDrag.startY);
    if (dx + dy <= 3) return;
    collapsedDrag.moved = true;
    suppressCollapsedClick = true;
    event.preventDefault();
    latestDragEvent = { screenY: event.screenY };
    if (!dragFrame) dragFrame = requestAnimationFrame(flushDragMove);
  });

  const endDrag = (event) => {
    if (!collapsedDrag || event.pointerId !== collapsedDrag.pointerId) return;
    event.target.releasePointerCapture?.(event.pointerId);
    const finalScreenY = event.screenY;
    const finalOffsetY = collapsedDrag.offsetY;
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = null;
    latestDragEvent = null;
    document.body.classList.remove('is-dragging-position');
    api.setVerticalPosition(finalScreenY, finalOffsetY, true).then((next) => {
      if (next) state = next;
    }).catch(() => {});
    collapsedDrag = null;
    setTimeout(() => { suppressCollapsedClick = false; }, 80);
  };
  collapsedStack.addEventListener('pointerup', endDrag);
  collapsedStack.addEventListener('pointercancel', endDrag);
}


function getCollapsedDropIndex(tabs, clientY) {
  for (let i = 0; i < tabs.length; i++) {
    const rect = tabs[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return tabs.length - 1;
}

function updateCollapsedReorderVisual(tabs, fromIndex, toIndex) {
  tabs.forEach((t) => t.classList.remove('reorder-dragging', 'reorder-above', 'reorder-below'));
  if (tabs[fromIndex]) tabs[fromIndex].classList.add('reorder-dragging');
  if (toIndex !== fromIndex && tabs[toIndex]) {
    tabs[toIndex].classList.add(toIndex < fromIndex ? 'reorder-above' : 'reorder-below');
  }
}

function clearCollapsedReorderVisual() {
  collapsedStack.querySelectorAll('.reorder-dragging, .reorder-above, .reorder-below')
    .forEach((el) => el.classList.remove('reorder-dragging', 'reorder-above', 'reorder-below'));
}

function bindCollapsedReorderDrag() {
  collapsedStack.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const tab = event.target.closest('.collapsed-memo-tab');
    if (!tab) return;
    const tabs = [...collapsedStack.querySelectorAll('.collapsed-memo-tab')];
    const fromIndex = tabs.indexOf(tab);
    if (fromIndex < 0) return;
    reorderDrag = { pointerId: event.pointerId, fromIndex, toIndex: fromIndex, startY: event.clientY, startX: event.clientX, moved: false };
    suppressCollapsedClick = false;
    tab.setPointerCapture?.(event.pointerId);
  });

  collapsedStack.addEventListener('pointermove', (event) => {
    if (!reorderDrag || event.pointerId !== reorderDrag.pointerId) return;
    const dx = Math.abs(event.clientX - reorderDrag.startX);
    const dy = Math.abs(event.clientY - reorderDrag.startY);
    if (dx + dy <= 5 && !reorderDrag.moved) return;
    if (!reorderDrag.moved) document.body.classList.add('is-reordering-collapsed');
    reorderDrag.moved = true;
    suppressCollapsedClick = true;
    event.preventDefault();
    const tabs = [...collapsedStack.querySelectorAll('.collapsed-memo-tab')];
    const toIndex = getCollapsedDropIndex(tabs, event.clientY);
    if (toIndex !== reorderDrag.toIndex) {
      reorderDrag.toIndex = toIndex;
      updateCollapsedReorderVisual(tabs, reorderDrag.fromIndex, toIndex);
    }
  });

  const endReorderDrag = async (event) => {
    if (!reorderDrag || event.pointerId !== reorderDrag.pointerId) return;
    event.target.releasePointerCapture?.(event.pointerId);
    document.body.classList.remove('is-reordering-collapsed');
    clearCollapsedReorderVisual();
    const { fromIndex, toIndex, moved } = reorderDrag;
    reorderDrag = null;
    setTimeout(() => { suppressCollapsedClick = false; }, 80);
    if (moved && toIndex !== fromIndex) {
      const [memo] = state.memos.splice(fromIndex, 1);
      state.memos.splice(toIndex, 0, memo);
      render();
      await persistNow();
    }
  };
  collapsedStack.addEventListener('pointerup', endReorderDrag);
  collapsedStack.addEventListener('pointercancel', endReorderDrag);
}

function updateCharCount() {
  if (!charCount) return;
  const memo = activeMemo();
  const raw = String(memo?.content || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  const count = raw.replace(/[\n\r]/g, '').length;
  charCount.textContent = count > 0 ? `${count}자` : '';
}

function runFontSize(pt) {
  restoreEditorSelection();
  memoEditor.focus();
  if (!hasNonEmptyEditorSelection()) return;
  document.execCommand('styleWithCSS', false, true);
  document.execCommand('fontSize', false, '7');
  memoEditor.querySelectorAll('[style*="xxx-large"]').forEach((el) => {
    el.style.fontSize = `${pt}pt`;
  });
  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  updateFormatStates();
}

function runAlignment(command) {
  restoreEditorSelection();
  memoEditor.focus();
  document.execCommand('styleWithCSS', false, true);
  document.execCommand(command, false, null);
  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  updateFormatStates();
}

function runChecklist() {
  restoreEditorSelection();
  memoEditor.focus();
  const info = getEditorSelection();
  const span = document.createElement('span');
  span.className = 'cb';
  span.setAttribute('contenteditable', 'false');
  span.setAttribute('data-checked', 'false');
  span.textContent = '☐';
  if (info) {
    const { selection, range } = info;
    range.deleteContents();
    const space = document.createTextNode(' ');
    range.insertNode(space);
    range.insertNode(span);
    const newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  } else {
    placeCaretAtEnd(memoEditor);
    document.execCommand('insertText', false, '☐ ');
    markEditorTyping();
    updateMemoContent();
    saveEditorSelection();
    return;
  }
  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  updateFormatStates();
}

function clearFindHighlights() {
  if (!findActive) return;
  findMatches.forEach((mark) => {
    if (mark.parentNode) {
      const text = document.createTextNode(mark.textContent);
      mark.parentNode.replaceChild(text, mark);
    }
  });
  findMatches = [];
  findIndex = -1;
  findActive = false;
  try { memoEditor.normalize(); } catch (_) {}
}

function closeFindBar() {
  if (!findBar || findBar.hidden) return;
  findBar.hidden = true;
  clearFindHighlights();
  if (findCountEl) findCountEl.textContent = '';
}

function highlightFindMatches(query) {
  clearFindHighlights();
  findMatches = [];
  findIndex = -1;
  if (!query) { if (findCountEl) findCountEl.textContent = ''; return; }
  const lower = query.toLowerCase();

  function walkAndHighlight(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || '';
      const lowerText = text.toLowerCase();
      if (!lowerText.includes(lower)) return;
      const parent = node.parentNode;
      if (!parent) return;
      const parts = [];
      let lastIdx = 0;
      let searchFrom = 0;
      let matchIdx;
      while ((matchIdx = lowerText.indexOf(lower, searchFrom)) >= 0) {
        if (matchIdx > lastIdx) parts.push(document.createTextNode(text.slice(lastIdx, matchIdx)));
        const mark = document.createElement('mark');
        mark.className = 'find-highlight';
        mark.textContent = text.slice(matchIdx, matchIdx + query.length);
        parts.push(mark);
        lastIdx = matchIdx + query.length;
        searchFrom = lastIdx;
      }
      if (lastIdx < text.length) parts.push(document.createTextNode(text.slice(lastIdx)));
      parts.forEach((part) => parent.insertBefore(part, node));
      parent.removeChild(node);
      parts.filter((p) => p.tagName === 'MARK').forEach((m) => findMatches.push(m));
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'MARK') {
      [...node.childNodes].forEach(walkAndHighlight);
    }
  }

  walkAndHighlight(memoEditor);
  findActive = true;

  if (findMatches.length > 0) {
    findIndex = 0;
    findMatches[0].classList.add('find-current');
    findMatches[0].scrollIntoView({ block: 'nearest' });
    if (findCountEl) findCountEl.textContent = `1 / ${findMatches.length}`;
  } else {
    if (findCountEl) findCountEl.textContent = '없음';
  }
}

function navigateFind(direction) {
  if (!findMatches.length) return;
  findMatches[findIndex]?.classList.remove('find-current');
  findIndex = (findIndex + direction + findMatches.length) % findMatches.length;
  findMatches[findIndex].classList.add('find-current');
  findMatches[findIndex].scrollIntoView({ block: 'nearest' });
  if (findCountEl) findCountEl.textContent = `${findIndex + 1} / ${findMatches.length}`;
}

function openFindBar() {
  if (!findBar) return;
  clearFindHighlights();
  findBar.hidden = false;
  if (findInput) { findInput.value = ''; findInput.focus(); }
  if (findCountEl) findCountEl.textContent = '';
}

async function duplicateMemo() {
  const src = state.memos.find((m) => m.id === menuMemoId) || activeMemo();
  if (!src) return;
  const copy = { ...src, id: `memo-${Date.now()}`, title: `${src.title || '메모'} 복사본` };
  const srcIdx = state.memos.findIndex((m) => m.id === src.id);
  state.memos.splice(srcIdx + 1, 0, copy);
  state.activeMemoId = copy.id;
  closeMemoMenu();
  render();
  await persistNow();
}

async function exportCurrentMemo() {
  const memo = state.memos.find((m) => m.id === menuMemoId) || activeMemo();
  if (!memo) return;
  closeMemoMenu();
  await api.exportMemoFile(memo.title || '메모', memo.content || '');
}

function bindPanelResize() {
  if (!resizeHandle) return;
  const flushResizeMove = () => {
    resizeFrame = null;
    if (!panelResize || !latestResizeEvent) return;
    const dx = latestResizeEvent.screenX - panelResize.startX;
    const dy = latestResizeEvent.screenY - panelResize.startY;
    const fromRight = (state?.settings?.position || 'right') === 'right';
    const nextWidth = fromRight ? panelResize.startWidth - dx : panelResize.startWidth + dx;
    const nextHeight = panelResize.startHeight + dy;
    api.setPanelSize(nextWidth, nextHeight, false).then((next) => {
      if (next) state = next;
    }).catch(() => {});
  };

  resizeHandle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    panelResize = {
      pointerId: event.pointerId,
      startX: event.screenX,
      startY: event.screenY,
      startWidth: Number(state?.settings?.width || window.innerWidth),
      startHeight: Number(state?.settings?.height || window.innerHeight)
    };
    latestResizeEvent = null;
    document.body.classList.add('is-resizing-panel');
    resizeHandle.setPointerCapture?.(event.pointerId);
  });

  resizeHandle.addEventListener('pointermove', (event) => {
    if (!panelResize || event.pointerId !== panelResize.pointerId) return;
    event.preventDefault();
    latestResizeEvent = { screenX: event.screenX, screenY: event.screenY };
    if (!resizeFrame) resizeFrame = requestAnimationFrame(flushResizeMove);
  });

  const endResize = (event) => {
    if (!panelResize || event.pointerId !== panelResize.pointerId) return;
    resizeHandle.releasePointerCapture?.(event.pointerId);
    const dx = event.screenX - panelResize.startX;
    const dy = event.screenY - panelResize.startY;
    const fromRight = (state?.settings?.position || 'right') === 'right';
    const nextWidth = fromRight ? panelResize.startWidth - dx : panelResize.startWidth + dx;
    const nextHeight = panelResize.startHeight + dy;
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
    latestResizeEvent = null;
    document.body.classList.remove('is-resizing-panel');
    api.setPanelSize(nextWidth, nextHeight, true).then((next) => {
      if (next) {
        state = next;
        render();
      }
    }).catch(() => {});
    panelResize = null;
  };
  resizeHandle.addEventListener('pointerup', endResize);
  resizeHandle.addEventListener('pointercancel', endResize);
}

function sanitizeHtml(html) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = String(html || '');

  const blockedTags = 'script, style, iframe, object, embed, svg, math, link, meta, base, form, input, button, textarea, select, option, video, audio, canvas';
  wrapper.querySelectorAll(blockedTags).forEach((node) => node.remove());

  wrapper.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || '').trim();

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }

      if (name === 'style') {
        const colorMatch = value.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|[a-zA-Z]+)\s*(?:;|$)/);
        const fontSizeMatch = value.match(/(?:^|;)\s*font-size\s*:\s*(\d+(?:\.\d+)?pt)\s*(?:;|$)/);
        const textAlignMatch = value.match(/(?:^|;)\s*text-align\s*:\s*(-webkit-)?(left|center|right|justify)\s*(?:;|$)/);
        const parts = [];
        if (colorMatch) parts.push(`color: ${colorMatch[1]}`);
        if (fontSizeMatch) parts.push(`font-size: ${fontSizeMatch[1]}`);
        if (textAlignMatch) parts.push(`text-align: ${textAlignMatch[2]}`);
        if (parts.length) el.setAttribute('style', parts.join('; ') + ';');
        else el.removeAttribute(attr.name);
        return;
      }

      if (name === 'href') {
        try {
          const url = new URL(value, window.location.href);
          const allowed = ['http:', 'https:', 'mailto:'];
          if (!allowed.includes(url.protocol.toLowerCase())) {
            el.removeAttribute(attr.name);
          } else {
            el.setAttribute('href', url.toString());
            el.setAttribute('rel', 'noopener noreferrer');
          }
        } catch {
          el.removeAttribute(attr.name);
        }
        return;
      }

      const allowedAttributes = ['class', 'title', 'contenteditable', 'data-checked'];
      if (!allowedAttributes.includes(name)) el.removeAttribute(attr.name);
    });
  });
  // Unwrap <mark> elements (find highlights) — keep text, strip the mark tag
  wrapper.querySelectorAll('mark').forEach((el) => {
    while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
    el.remove();
  });
  return wrapper.innerHTML;
}
function syncEditorFromMemo() {
  if (shouldSkipEditorSync()) return;
  const memo = activeMemo();
  ensureEditorHistory(memo);
  const html = memo.content || '';
  if (memoEditor.innerHTML !== html) memoEditor.innerHTML = html;
  memoEditor.classList.toggle('empty', contentIsEmpty(html));
  updateCharCount();
}
function updateMemoContent() {
  if (applyingHistory) return;
  markEditorTyping();
  const memo = activeMemo();
  if (!memo) return;
  memo.content = sanitizeHtml(memoEditor.innerHTML);
  memoEditor.classList.toggle('empty', contentIsEmpty(memo.content));
  recordEditorHistory(memo);
  persistSoon();
}
function makeMemoButton(memo, index, className) {
  const button = document.createElement('button');
  button.className = className + (memo.id === state.activeMemoId ? ' active' : '');
  button.title = titleFor(memo, index);
  const tabColor = normalizeMemoColor(memo.color || 'purple');
  const tabBackground = colorToRgba(tabColor, 1);
  button.style.setProperty('--tab-bg', tabBackground);
  button.style.setProperty('--tab-outline', colorToRgba(tabColor, 1));
  button.style.setProperty('--tab-border', colorToRgba(tabColor, 1));
  button.style.background = tabBackground;
  button.style.color = textColor(tabColor);

  if (className.includes('collapsed')) {
    const collapsedTitle = document.createElement('span');
    collapsedTitle.textContent = titleFor(memo, index);
    button.appendChild(collapsedTitle);
    button.addEventListener('click', (event) => {
      if (suppressCollapsedClick) { event.preventDefault(); event.stopPropagation(); return; }
      pendingBoldInput = false;
      editorTypingGuard = false;
      state.activeMemoId = memo.id;
      render();
      persistSoon();
      api.expandPanel(true);
    });
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMemoMenu({ right: event.clientX + 190, bottom: event.clientY - 8 }, memo.id);
    });
    return button;
  }

  const title = document.createElement('span');
  title.className = 'memo-tab-title';
  title.textContent = titleFor(memo, index);
  const menu = document.createElement('button');
  menu.type = 'button';
  menu.className = 'memo-tab-menu';
  menu.title = '이름 변경 / 삭제';
  menu.textContent = '•••';
  menu.addEventListener('click', (event) => {
    event.stopPropagation();
    openMemoMenu(menu, memo.id);
  });
  button.append(title, menu);
  button.addEventListener('click', () => {
    closeMemoMenu();
    pendingBoldInput = false;
    editorTypingGuard = false;
    state.activeMemoId = memo.id;
    render();
    persistSoon();
  });
  return button;
}
function openMemoMenu(anchorOrRect, memoId) {
  menuMemoId = memoId;
  const rect = anchorOrRect?.getBoundingClientRect ? anchorOrRect.getBoundingClientRect() : anchorOrRect;
  const menuWidth = 190;
  const menuHeight = 220;
  let left = (rect?.right || 140) - menuWidth;
  let top = (rect?.bottom || 80) + 8;
  left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));
  top = Math.max(10, Math.min(top, window.innerHeight - menuHeight - 10));
  memoMenu.style.left = `${left}px`;
  memoMenu.style.top = `${top}px`;
  menuActions.hidden = false;
  renameInline.hidden = true;
  memoMenu.hidden = false;
}
function closeMemoMenu() {
  memoMenu.hidden = true;
  renameInline.hidden = true;
  menuActions.hidden = false;
}
function openRenamePanel() {
  const memo = state.memos.find((item) => item.id === menuMemoId) || activeMemo();
  renameInput.value = memo.title || '';
  menuActions.hidden = true;
  renameInline.hidden = false;
  memoMenu.hidden = false;
  setTimeout(() => { renameInput.focus(); renameInput.select(); }, 0);
}
function closeRenameInline() {
  renameInline.hidden = true;
  menuActions.hidden = false;
}
async function saveRename() {
  const value = renameInput.value.trim();
  const memo = state.memos.find((item) => item.id === menuMemoId);
  if (memo && value) memo.title = value;
  closeMemoMenu();
  render();
  await persistNow();
}
function renderCollapsedStack() {
  collapsedStack.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'collapsed-list';
  state.memos.forEach((memo, index) => list.appendChild(makeMemoButton(memo, index, 'collapsed-memo-tab')));
  collapsedStack.appendChild(list);
  const add = document.createElement('button');
  add.className = 'collapsed-add-tab';
  add.textContent = '+';
  add.title = '메모 추가';
  add.addEventListener('click', (event) => { event.stopPropagation(); if (suppressCollapsedClick) return; addMemo(); });
  collapsedStack.appendChild(add);
  const dragHandle = document.createElement('button');
  dragHandle.className = 'collapsed-drag-handle';
  dragHandle.type = 'button';
  dragHandle.title = '위아래 위치 조절';
  dragHandle.setAttribute('aria-label', '위아래 위치 조절');
  dragHandle.innerHTML = '<span></span><span></span><span></span>';
  collapsedStack.appendChild(dragHandle);
}
function renderTabs() {
  memoTabs.innerHTML = '';
  state.memos.forEach((memo, index) => memoTabs.appendChild(makeMemoButton(memo, index, 'memo-tab')));
}
function renderPalette() {
  colorPalette.innerHTML = '';
  const current = normalizeMemoColor(activeMemo().color || 'purple');
  Object.keys(COLOR_MAP).forEach((key) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-swatch' + (key === current ? ' selected' : '');
    swatch.title = COLOR_LABELS[key] || key;
    swatch.style.background = colorToRgba(key, 1);
    swatch.addEventListener('click', () => {
      activeMemo().color = key;
      memoColor.value = key;
      setThemeVars(activeMemo());
      render();
      persistSoon();
    });
    colorPalette.appendChild(swatch);
  });
}





function renderListModal() {
  if (!memoListItems) return;
  memoListItems.innerHTML = '';

  state.memos.forEach((memo, index) => {
    const row = document.createElement('div');
    row.className = 'memo-list-row' + (memo.id === state.activeMemoId ? ' active' : '');
    row.dataset.id = memo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.id = memo.id;
    checkbox.checked = selectedListIds.has(memo.id);
    checkbox.addEventListener('click', (event) => event.stopPropagation());
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedListIds.add(memo.id);
      else selectedListIds.delete(memo.id);
    });

    const dot = document.createElement('span');
    dot.className = 'memo-list-color';
    dot.style.background = colorToRgba(memo.color || 'purple', 1);

    const text = document.createElement('button');
    text.className = 'memo-list-title';
    text.textContent = titleFor(memo, index);
    text.title = '이 메모 열기';
    text.addEventListener('click', () => {
      pendingBoldInput = false;
      editorTypingGuard = false;
      state.activeMemoId = memo.id;
      closeListModal();
      render();
      persistSoon();
    });

    const orderBox = document.createElement('div');
    orderBox.className = 'memo-list-order-box';

    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'memo-list-order up';
    up.textContent = '↑';
    up.title = '위로 이동';
    up.disabled = index === 0;
    up.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await moveMemoByButton(memo.id, -1);
    });

    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'memo-list-order down';
    down.textContent = '↓';
    down.title = '아래로 이동';
    down.disabled = index === state.memos.length - 1;
    down.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await moveMemoByButton(memo.id, 1);
    });

    orderBox.append(up, down);

    const rename = document.createElement('button');
    rename.className = 'memo-list-rename';
    rename.textContent = '변경';
    rename.type = 'button';
    rename.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await renameMemoFromList(memo.id);
    });

    const del = document.createElement('button');
    del.className = 'memo-list-delete';
    del.textContent = '삭제';
    del.type = 'button';
    del.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await deleteMemosByIds([memo.id]);
    });

    row.append(checkbox, dot, text, orderBox, rename, del);
    memoListItems.appendChild(row);
  });
}

async function moveMemoByButton(id, direction) {
  const index = state.memos.findIndex((memo) => memo.id === id);
  if (index < 0) return;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= state.memos.length) return;

  const [memo] = state.memos.splice(index, 1);
  state.memos.splice(nextIndex, 0, memo);

  await persistNow();
  render();
  openListModal();
}

async function renameMemoFromList(id) {
  const memo = state.memos.find((item) => item.id === id);
  if (!memo) return;

  const currentName = memo.title || '제목 없음';
  const nextName = prompt('메모 이름 변경', currentName);
  if (nextName === null) return;

  const trimmed = nextName.trim();
  if (!trimmed) return;

  memo.title = trimmed;
  await persistNow();
  render();
  openListModal();
}


function openListModal() {
  selectedListIds = new Set();
  closeMemoMenu();
  closeRenameInline();
  if (textColorMenu) textColorMenu.hidden = true;
  appearanceOpen = false;
  renderListModal();
  listModal.hidden = false;
}
function closeListModal() {
  listModal.hidden = true;
  selectedListIds = new Set();
}
async function deleteMemosByIds(ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  const targets = uniqueIds.filter((id) => state.memos.some((memo) => memo.id === id));
  if (!targets.length) {
    showToast('선택된 메모가 없습니다.');
    return;
  }
  if (state.memos.length - targets.length < 1) {
    showToast('마지막 메모는 삭제할 수 없습니다. 최소 1개는 남겨야 해요.');
    return;
  }

  const before = state.memos.map((memo, index) => ({ memo: { ...memo }, index }));
  const removed = before.filter((item) => targets.includes(item.memo.id));
  const activeDeleted = targets.includes(state.activeMemoId);

  state.memos = state.memos.filter((memo) => !targets.includes(memo.id));
  if (activeDeleted) state.activeMemoId = state.memos[0]?.id;

  deletedMemo = null;
  deletedMemos = removed;
  deletedIndex = removed[0]?.index || 0;
  selectedListIds = new Set([...selectedListIds].filter((id) => !targets.includes(id)));

  render();
  if (!listModal.hidden) renderListModal();
  await persistNow();
  showToast(`${targets.length}개 메모가 삭제되었습니다.`);
}

function render() {
  const memo = activeMemo();
  app.classList.toggle('flat-collapsed', Boolean(state?.settings?.collapsedFlatMode));
  setThemeVars(memo);
  applySaturationSetting();
  applyCollapsedLengthSetting();
  applySpellcheckSetting();
  renderCollapsedStack();
  renderTabs();
  renderPalette();
  syncEditorFromMemo();
  memoColor.value = memo.color || 'purple';
  const sat = currentSaturation();
  if (saturationSlider) saturationSlider.value = sat;
  if (saturationValue) saturationValue.textContent = `${sat}%`;
  setAppearancePanel(appearanceOpen);
  renderTextColorInlinePalette();
  updateCharCount();
  if (!expanded) closeAllFloatingUi();
  else if (listModal && !listModal.hidden) renderListModal();
}
async function persistNow() {
  clearTimeout(saveTimer);
  state = await api.setState(state);
}
function persistSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 180);
}
function newMemo() {
  const now = Date.now();
  return { id: `memo-${now}`, title: `메모 ${state.memos.length + 1}`, content: '', color: ['purple','yellow','mint','blue','pink'][state.memos.length % 5] };
}
async function addMemo() {
  const memo = newMemo();
  state.memos.push(memo);
  pendingBoldInput = false;
  editorTypingGuard = false;
  state.activeMemoId = memo.id;
  appearanceOpen = false;
  render();
  await persistNow();
  api.expandPanel(true);
}
function showToast(message) {
  if (!expanded) {
    if (toast) toast.hidden = true;
    clearTimeout(toastTimer);
    return;
  }
  toastText.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; deletedMemo = null; deletedMemos = null; }, 5000);
}
async function undoDelete() {
  if (deletedMemos && deletedMemos.length) {
    deletedMemos
      .slice()
      .sort((a, b) => a.index - b.index)
      .forEach((item) => {
        state.memos.splice(Math.min(item.index, state.memos.length), 0, item.memo);
      });
    state.activeMemoId = deletedMemos[0].memo.id;
    deletedMemos = null;
    deletedMemo = null;
    toast.hidden = true;
    render();
    await persistNow();
    return;
  }
  if (!deletedMemo) return;
  state.memos.splice(Math.min(deletedIndex, state.memos.length), 0, deletedMemo);
  state.activeMemoId = deletedMemo.id;
  deletedMemo = null;
  deletedMemos = null;
  toast.hidden = true;
  render();
  await persistNow();
}
async function deleteSelectedMemo() {
  if (state.memos.length <= 1) {
    showToast('마지막 메모는 삭제할 수 없습니다.');
    memoMenu.hidden = true;
    return;
  }
  const targetId = menuMemoId;
  const index = state.memos.findIndex((item) => item.id === targetId);
  if (index < 0) {
    memoMenu.hidden = true;
    return;
  }
  memoMenu.hidden = true;
  const memo = state.memos[index];
  const wasActive = state.activeMemoId === memo.id;
  deletedMemo = { ...memo };
  deletedMemos = null;
  deletedIndex = index;
  state.memos = state.memos.filter((item) => item.id !== memo.id);
  if (wasActive) state.activeMemoId = state.memos[Math.max(0, index - 1)]?.id || state.memos[0].id;
  render();
  await persistNow();
  showToast(`${memo.title || '메모'}가 삭제되었습니다.`);
}


function normalizeTextColorPreviewSwatches() {
  if (!textColorInlinePalette) return;
  textColorInlinePalette.querySelectorAll('button[data-color]').forEach((button) => {
    const color = button.dataset.color;
    if (!color) return;
    button.style.setProperty('--text-swatch-color', color);
    button.style.backgroundColor = color;
    button.textContent = '';
    button.setAttribute('aria-label', button.title || color);
  });
}

function renderTextColorInlinePalette() {
  normalizeTextColorPreviewSwatches();
  if (!textColorInlinePalette || textColorInlinePalette.dataset.bound === '1') return;
  textColorInlinePalette.querySelectorAll('button[data-color]').forEach((button) => {
    button.addEventListener('mousedown', (event) => {
      event.preventDefault(); event.stopPropagation(); saveEditorSelection();
    });
    button.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation(); runTextColor(button.dataset.color);
    });
  });
  textColorInlinePalette.dataset.bound = '1';
}

function saveEditorSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (memoEditor.contains(range.commonAncestorContainer)) {
    savedEditorRange = range.cloneRange();
  }
}
function restoreEditorSelection() {
  if (!savedEditorRange) return;
  const selection = window.getSelection();
  if (!selection) return;
  memoEditor.focus();
  selection.removeAllRanges();
  selection.addRange(savedEditorRange);
}

function wrapSelectionWithTag(tagName) {
  restoreEditorSelection();
  memoEditor.focus();
  const info = getEditorSelection();
  if (!info || info.range.collapsed) return false;

  const { selection, range } = info;
  const wrapper = document.createElement(tagName);
  try {
    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);

    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    return true;
  } catch (_) {
    try {
      document.execCommand(tagName.toLowerCase() === 'b' ? 'bold' : tagName, false, null);
      return true;
    } catch (_) {
      return false;
    }
  }
}

function toggleBoldExplicit() {
  restoreEditorSelection();
  memoEditor.focus();

  pendingBoldInput = false;
  try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
  try { document.execCommand('bold', false, null); } catch (_) {}

  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  updateFormatStates();
}

function runFormat(command, value = null) {
  restoreEditorSelection();
  memoEditor.focus();

  if (command === 'insertUnorderedList') {
    insertTextWithPendingFormat('• ');
    updateFormatStates();
    return;
  }

  document.execCommand(command, false, value);
  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  updateFormatStates();
}
function runTextColor(color) {
  if (!savedEditorRange || savedEditorRange.collapsed) return;
  restoreEditorSelection();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) return;
  memoEditor.focus();
  document.execCommand('foreColor', false, color);
  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  updateFormatStates();
}


function getEditorSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!memoEditor.contains(range.commonAncestorContainer)) return null;
  return { selection, range };
}

function hasNonEmptyEditorSelection() {
  const info = getEditorSelection();
  return Boolean(info && !info.range.collapsed && info.selection.toString().length > 0);
}

function insertHtmlAtSelection(html) {
  restoreEditorSelection();
  memoEditor.focus();
  const info = getEditorSelection();
  if (!info) return false;
  const { selection, range } = info;
  range.deleteContents();

  const template = document.createElement('template');
  template.innerHTML = sanitizeHtml(html);
  const fragment = template.content;
  const lastNode = fragment.lastChild;

  range.insertNode(fragment);

  if (lastNode) {
    const nextRange = document.createRange();
    nextRange.setStartAfter(lastNode);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  }

  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  updateFormatStates();
  return true;
}

function insertTextWithPendingFormat(text) {
  insertEditorText(text);
  return true;
}

function updateFormatStates() {
  const states = [
    [boldButton, 'bold'],
    [italicButton, 'italic'],
    [underlineButton, 'underline'],
    [strikeButton, 'strikeThrough']
  ];
  states.forEach(([button, command]) => {
    if (!button) return;
    let active = false;
    try { active = document.queryCommandState(command); } catch (_) {}
    button.classList.toggle('format-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const alignStates = [
    [alignLeftButton, 'justifyLeft'],
    [alignCenterButton, 'justifyCenter'],
    [alignRightButton, 'justifyRight']
  ];
  alignStates.forEach(([button, command]) => {
    if (!button) return;
    let active = false;
    try { active = document.queryCommandState(command); } catch (_) {}
    button.classList.toggle('format-active', active);
  });
}
function editorHasFocusOrSelection() {
  const selection = window.getSelection();
  if (document.activeElement === memoEditor) return true;
  if (selection && selection.rangeCount) return memoEditor.contains(selection.getRangeAt(0).commonAncestorContainer);
  return Boolean(savedEditorRange);
}
function insertEditorText(text) {
  restoreEditorSelection();
  memoEditor.focus();
  document.execCommand('insertText', false, text);
  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
}
function handleEditorShortcut(event) {
  const key = event.key.toLowerCase();
  const mod = event.ctrlKey || event.metaKey;
  if (!mod) return false;
  if (key === 'b') { event.preventDefault(); event.stopPropagation(); toggleBoldExplicit(); return true; }
  if (key === 'i') { event.preventDefault(); event.stopPropagation(); runFormat('italic'); return true; }
  if (key === 'u') { event.preventDefault(); event.stopPropagation(); runFormat('underline'); return true; }
  if (event.shiftKey && key === 'x') { event.preventDefault(); runFormat('strikeThrough'); return true; }
  return false;
}


function getCurrentTextNodeInfo() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  let node = range.startContainer;
  let offset = range.startOffset;

  // contenteditable 빈 줄/블록에서는 TEXT_NODE가 아닐 수 있으므로 텍스트 노드를 만들어준다.
  if (node === memoEditor || node.nodeType === Node.ELEMENT_NODE) {
    const textNode = document.createTextNode('');
    const element = node === memoEditor ? memoEditor : node;
    const child = element.childNodes[offset] || null;
    element.insertBefore(textNode, child);
    node = textNode;
    offset = 0;

    const nextRange = document.createRange();
    nextRange.setStart(node, offset);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  }

  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  return { selection, range: selection.getRangeAt(0), node, offset, text: node.nodeValue || '' };
}

function replaceTextBeforeCaret(length, replacement) {
  const info = getCurrentTextNodeInfo();
  if (!info || info.offset < length) return false;

  const { selection, node, offset, text } = info;
  node.nodeValue = text.slice(0, offset - length) + replacement + text.slice(offset);

  const nextRange = document.createRange();
  nextRange.setStart(node, offset - length + replacement.length);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);

  markEditorTyping();
  updateMemoContent();
  saveEditorSelection();
  return true;
}

function lineTextBeforeCaret() {
  const info = getCurrentTextNodeInfo();
  if (!info) return '';
  const before = info.text.slice(0, info.offset);
  const lastBreak = Math.max(before.lastIndexOf('\\n'), before.lastIndexOf('\\r'));
  return before.slice(lastBreak + 1);
}

function isLineStartDashOnly() {
  return lineTextBeforeCaret() === '-';
}

function handleEditorInputRules(event) {
  // Tab은 절대 포커스 이동으로 나가지 않고, 하나의 입력 묶음처럼 공백 3칸 삽입
  if (event.key === 'Tab') {
    event.preventDefault();
    event.stopPropagation();
    insertTextWithPendingFormat('   ');
    return true;
  }

  // -> 를 입력하는 순간 → 로 변환
  if (event.key === '>') {
    const info = getCurrentTextNodeInfo();
    if (info && info.offset >= 1 && info.text.slice(info.offset - 1, info.offset) === '-') {
      event.preventDefault();
      event.stopPropagation();
      replaceTextBeforeCaret(1, '→');
      return true;
    }
  }

  // 빈 줄 시작에서 "- " 입력 시 점 목록으로 변환
  if (event.key === ' ' || event.key === 'Spacebar') {
    if (isLineStartDashOnly()) {
      event.preventDefault();
      event.stopPropagation();
      restoreEditorSelection();
      memoEditor.focus();

      // 빈 줄에서 '-' 뒤에 Space를 누르면 줄이 사라지지 않도록
      // '-'를 보이는 점 목록 문자로 바꾼다.
      replaceTextBeforeCaret(1, '• ');
      markEditorTyping();
      updateMemoContent();
      saveEditorSelection();
      return true;
    }
  }

  return false;
}


function handleGlobalEditorTab(event) {
  if (event.key !== 'Tab') return;
  if (document.activeElement === memoEditor || editorHasFocusOrSelection()) {
    handleEditorInputRules(event);
  }
}


async function refreshStateFromDiskForSettings() {
  try {
    if (!api?.getState && !api?.loadState) return;
    const nextState = await (api.getState?.() || api.loadState?.());
    if (!nextState?.settings) return;
    state.settings = { ...(state.settings || {}), ...nextState.settings };
    applySaturationSetting();
  } catch (_) {}
}

function bind() {

  api.onSettingsChanged?.((patch, nextState) => {
    if (nextState?.settings) {
      state.settings = { ...(state.settings || {}), ...nextState.settings };
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'colorSaturation')) {
      state.settings = state.settings || {};
      state.settings.colorSaturation = patch.colorSaturation;
      applySaturationSetting(patch.colorSaturation);
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'collapsedLengthScale')) {
      state.settings = state.settings || {};
      state.settings.collapsedLengthScale = patch.collapsedLengthScale;
      applyCollapsedLengthSetting(patch.collapsedLengthScale);
      renderCollapsedStack();
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'collapsedFlatMode')) {
      app.classList.toggle('flat-collapsed', Boolean(patch.collapsedFlatMode));
      applyCollapsedLengthSetting();
      renderCollapsedStack();
    }
  });

  window.addEventListener('focus', refreshStateFromDiskForSettings);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshStateFromDiskForSettings(); });
  document.addEventListener('keydown', handleGlobalEditorTab, true);
  bindCollapsedVerticalDrag();
  bindCollapsedReorderDrag();
  bindPanelResize();
  hidePanelButton?.addEventListener('click', () => api.hidePanel());
  closeButton.addEventListener('click', collapseCleanly);
  moveDisplayLeft?.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); api.moveDisplay('left'); });
  moveDisplayRight?.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); api.moveDisplay('right'); });
  dockSideButton?.addEventListener('click', async (event) => { event.preventDefault(); event.stopPropagation(); const next = await api.toggleDockSide(); if (next) { state = next; render(); } });
  settingsButton.addEventListener('click', () => api.openSettings());
  listButtonTop.addEventListener('click', openListModal);
  closeListButton.addEventListener('click', closeListModal);
  listModal.addEventListener('click', (event) => { if (event.target === listModal) closeListModal(); });
  selectAllMemosButton.addEventListener('click', () => {
    const allSelected = state.memos.every((memo) => selectedListIds.has(memo.id));
    selectedListIds = allSelected ? new Set() : new Set(state.memos.map((memo) => memo.id));
    renderListModal();
  });
  deleteSelectedMemosButton.addEventListener('click', async () => {
    const checkedIds = [...memoListItems.querySelectorAll('input[type=checkbox]:checked')].map((input) => input.dataset.id);
    await deleteMemosByIds(checkedIds.length ? checkedIds : [...selectedListIds]);
  });
  addMemoButton.addEventListener('click', addMemo);

  toggleAppearanceButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); const next = !appearanceOpen; closeTextColorPanel(); appearanceOpen = next; render(); });
  boldButton.addEventListener('click', () => toggleBoldExplicit());
  italicButton.addEventListener('click', () => runFormat('italic'));
  underlineButton.addEventListener('click', () => runFormat('underline'));
  strikeButton?.addEventListener('click', () => runFormat('strikeThrough'));
  textColorButton?.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    saveEditorSelection();
  });
  textColorButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    saveEditorSelection();
    const willOpen = !textAppearanceCard || textAppearanceCard.hidden;
    appearanceOpen = false;
    setAppearancePanel(false);
    renderTextColorInlinePalette();
    setTextColorPanel(willOpen);
  });

  listButton?.addEventListener('click', () => runFormat('insertUnorderedList'));
  renameMemoButton.addEventListener('click', openRenamePanel);
  deleteFromMenuButton.addEventListener('click', deleteSelectedMemo);
  cancelRenameButton.addEventListener('click', closeRenameInline);
  saveRenameButton.addEventListener('click', saveRename);
  renameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') saveRename(); if (event.key === 'Escape') closeRenameInline(); });
  undoDeleteButton.addEventListener('click', undoDelete);
  closeToastButton.addEventListener('click', () => { toast.hidden = true; deletedMemo = null; deletedMemos = null; });
  memoEditor.addEventListener('input', () => {
    if (findBar && !findBar.hidden) { clearFindHighlights(); findBar.hidden = true; if (findCountEl) findCountEl.textContent = ''; }
    updateMemoContent();
    updateCharCount();
  });
  memoEditor.addEventListener('click', (event) => {
    const cb = event.target.closest('.cb');
    if (cb && memoEditor.contains(cb)) {
      event.preventDefault();
      const checked = cb.getAttribute('data-checked') === 'true';
      cb.setAttribute('data-checked', String(!checked));
      cb.textContent = !checked ? '☑' : '☐';
      updateMemoContent();
      return;
    }
    const link = event.target.closest('a[href]');
    if (link && memoEditor.contains(link)) {
      event.preventDefault();
      const url = link.getAttribute('href');
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) api.openLink(url);
    }
  });

  memoEditor.addEventListener('beforeinput', () => {
    // 굵게 입력은 브라우저/Electron 기본 편집 엔진에 맡긴다.
    // 커스텀 삽입을 끼우면 글자 중간에서 Ctrl+B를 눌렀을 때 커서가 튀는 문제가 생긴다.
  });

  memoEditor.addEventListener('keydown', (event) => {
    if (handleEditorShortcut(event)) return;
    handleEditorInputRules(event);
  }, true);
  memoEditor.addEventListener('keyup', () => { saveEditorSelection(); updateFormatStates(); });
  memoEditor.addEventListener('mouseup', () => { saveEditorSelection(); updateFormatStates(); });
  memoEditor.addEventListener('focus', () => { saveEditorSelection(); updateFormatStates(); });
  memoEditor.addEventListener('blur', () => { editorTypingGuard = false; });
  memoEditor.addEventListener('paste', (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    if (urlPattern.test(text)) {
      const html = text.replace(/(https?:\/\/[^\s]+)/g, (url) => `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(url)}</a>`);
      document.execCommand('insertHTML', false, sanitizeHtml(html));
    } else {
      document.execCommand('insertText', false, text);
    }
    markEditorTyping();
    updateMemoContent();
    updateCharCount();
  });
  memoColor.addEventListener('change', () => {
    activeMemo().color = memoColor.value;
    render();
    persistSoon();
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.memo-menu') && !event.target.closest('.memo-tab-menu')) {
      memoMenu.hidden = true;
      closeRenameInline();
    }
    if (!event.target.closest('#textColorMenu') && !event.target.closest('#textColorButton') && textColorMenu) textColorMenu.hidden = true;
  });
  document.addEventListener('keydown', (event) => {
    if (editorHasFocusOrSelection() && handleEditorShortcut(event)) return;
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;
    if (document.activeElement === memoEditor && mod && (key === 'z' || key === 'y')) {
      return;
    }
    if (event.key === 'Escape' && findBar && !findBar.hidden) { closeFindBar(); return; }
    if (event.key === 'Escape' && !listModal.hidden) { closeListModal(); return; }
    if (event.key === 'Escape') collapseCleanly();
    if (mod && key === 'f') { event.preventDefault(); if (expanded) openFindBar(); return; }
    if (mod && key === 'z' && !event.shiftKey) { event.preventDefault(); undoEditor(); return; }
    if ((mod && key === 'y') || (mod && event.shiftKey && key === 'z')) { event.preventDefault(); redoEditor(); return; }
    if (mod && key === 'n') { event.preventDefault(); addMemo(); }
    if (mod && key === 'b') { event.preventDefault(); runFormat('bold'); }
    if (mod && key === 'i') { event.preventDefault(); runFormat('italic'); }
    if (mod && key === 'u') { event.preventDefault(); runFormat('underline'); }
    if (mod && event.shiftKey && key === 'x') { event.preventDefault(); runFormat('strikeThrough'); }
  });
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('mousedown', () => saveEditorSelection());
    fontSizeSelect.addEventListener('change', () => {
      const pt = Number(fontSizeSelect.value);
      if (pt) runFontSize(pt);
      fontSizeSelect.value = '';
      memoEditor.focus();
    });
  }
  alignLeftButton?.addEventListener('click', () => runAlignment('justifyLeft'));
  alignCenterButton?.addEventListener('click', () => runAlignment('justifyCenter'));
  alignRightButton?.addEventListener('click', () => runAlignment('justifyRight'));
  checklistButton?.addEventListener('click', () => runChecklist());
  copyMemoButton?.addEventListener('click', duplicateMemo);
  exportMemoButton?.addEventListener('click', exportCurrentMemo);

  if (findBar) {
    findInput?.addEventListener('input', () => highlightFindMatches(findInput.value));
    findInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); navigateFind(event.shiftKey ? -1 : 1); }
      if (event.key === 'Escape') { event.preventDefault(); closeFindBar(); }
    });
    findPrevButton?.addEventListener('click', () => navigateFind(-1));
    findNextButton?.addEventListener('click', () => navigateFind(1));
    findCloseButton?.addEventListener('click', closeFindBar);
  }

  if (saturationSlider) {
    saturationSlider.addEventListener('input', () => {
      const value = Number(saturationSlider.value);
      applySaturationSetting(value);
      if (saturationValue) saturationValue.textContent = `${value}%`;
    });
    saturationSlider.addEventListener('change', () => {
      if (!state.settings) state.settings = {};
      state.settings.colorSaturation = Number(saturationSlider.value);
      persistSoon();
    });
  }

  api.onStateChanged((next) => { state = next; normalizeStateMemoColors(state); render(); });
  api.onExpanded(setExpandedUi);
}
(async function init() {
  state = await api.getState();
  normalizeStateMemoColors(state);
  bind();
  render();
  setExpandedUi(false);
})();
