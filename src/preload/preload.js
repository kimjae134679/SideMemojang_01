const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sideMemo', {
  getState: () => ipcRenderer.invoke('state:get'),
  setState: (state) => ipcRenderer.invoke('state:set', state),
  expandPanel: (expanded) => ipcRenderer.invoke('panel:expand', expanded),
  togglePanel: () => ipcRenderer.invoke('panel:toggle'),
  hidePanel: () => ipcRenderer.invoke('panel:hide'),
  setVerticalPosition: (screenY, grabOffset, commit = false) => ipcRenderer.invoke('panel:set-vertical-position', screenY, grabOffset, commit),
  setPanelSize: (width, height, commit = false) => ipcRenderer.invoke('panel:set-size', width, height, commit),

  updateSettings: (settings) => ipcRenderer.invoke('settings:updateSettings', settings),
  onSettingsChanged: (callback) => {
    const listener = (_event, patch, state) => callback(patch, state);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  },
  updateSetting: (key, value) => ipcRenderer.invoke('settings:updateSetting', key, value),
  openSettings: () => ipcRenderer.invoke('settings:open'),
  openLink: (url) => ipcRenderer.invoke('link:open', url),
  listDisplays: () => ipcRenderer.invoke('display:list'),
  moveDisplay: (direction) => ipcRenderer.invoke('display:move', direction),
  toggleDockSide: () => ipcRenderer.invoke('display:toggle-dock-side'),
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
  resetData: () => ipcRenderer.invoke('data:reset'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  getUpdateStatus: () => ipcRenderer.invoke('update:getStatus'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('update:status', listener);
    return () => ipcRenderer.removeListener('update:status', listener);
  },
  exportMemoFile: (title, content) => ipcRenderer.invoke('memo:export-single', { title, content }),
  onStateChanged: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('state:changed', listener);
    return () => ipcRenderer.removeListener('state:changed', listener);
  },
  onExpanded: (callback) => {
    const listener = (_event, expanded) => callback(expanded);
    ipcRenderer.on('panel:expanded', listener);
    return () => ipcRenderer.removeListener('panel:expanded', listener);
  }
});
