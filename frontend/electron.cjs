const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,      // Adjust based on your security needs
      contextIsolation: false,    // Adjust based on your security needs
      webviewTag: true            // Enables the <webview> tag
    }
  });

  // Load your custom browser UI from a local HTML file
  win.loadFile(path.join(__dirname, 'browser.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
