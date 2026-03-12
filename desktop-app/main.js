const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    // Use frameless window or custom styling if desired, but default is fine for now
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC messages
ipcMain.on('open-external-url', (event, url) => {
  shell.openExternal(url);
});
