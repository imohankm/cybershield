const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

const { spawn } = require('node:child_process');
let backendProcess;

function startBackend() {
    const backendPath = path.join(__dirname, '..', 'backend', 'app.py');
    console.log(`Starting backend at: ${backendPath}`);
    
    // Spawn python as a background process
    backendProcess = spawn('python', [backendPath], {
        stdio: 'inherit',
        shell: true
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (backendProcess) {
      console.log('Killing backend process...');
      backendProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC messages
ipcMain.on('open-external-url', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('run-installer', async () => {
    const { exec } = require('child_process');
    const scriptPath = path.join(__dirname, 'install-extension.ps1');
    
    return new Promise((resolve, reject) => {
        exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                reject(error.message);
            }
            resolve(stdout || "Registry signals processed.");
        });
    });
});
