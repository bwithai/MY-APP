const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openNewTab: (url) => ipcRenderer.send("open-new-tab", url),
});
