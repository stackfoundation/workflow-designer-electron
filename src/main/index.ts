import { app, BrowserWindow } from 'electron';
import { enableLiveReload } from 'electron-compile';

import { initMenu } from './menu';

let mainWindow: Electron.BrowserWindow | null = null;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) {
  // enableLiveReload({strategy: 'react-hmr'});
}

const createWindow = async () => {
  initMenu();

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 600,
    titleBarStyle: 'hidden-inset'
  });
  mainWindow.setMaximumSize(10000, 10000);
  mainWindow.setMinimumSize(400, 400);
  mainWindow.maximize();

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
