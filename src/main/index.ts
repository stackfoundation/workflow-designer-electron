import { app, BrowserWindow, ipcMain } from 'electron';
import { enableLiveReload } from 'electron-compile';

import { initMenu } from './menu';

let mainWindow: Electron.BrowserWindow | null = null;

let fileDirty = false;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) {
  // enableLiveReload({strategy: 'react-hmr'});
}

app.setName('StackFoundation Designer');

const createWindow = async () => {
  initMenu();

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 600,
    title: "Workflow Editor"
  });
  mainWindow.setMaximumSize(10000, 10000);
  mainWindow.setMinimumSize(400, 400);
  mainWindow.maximize();
  
  (mainWindow as any).args = process.argv;

  let url = isDevMode
    ? 'http://localhost:9080'
    : `file://${__dirname}/index.html`;

  mainWindow.loadURL(url);
  mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.show();
  });

  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

ipcMain.on('quit', (event:any) => {
  app.quit();
})

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
