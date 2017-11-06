import { app, BrowserWindow, ipcMain } from 'electron';
import { enableLiveReload } from 'electron-compile';

import { initMenu } from './menu';

let mainWindow: Electron.BrowserWindow | null = null;

let fileDirty = false;

import { IS_DEV_MODE } from './constants';

if (IS_DEV_MODE) {
  // enableLiveReload({strategy: 'react-hmr'});
}

app.setName('StackFoundation Workflow Designer');

const createWindow = async () => {
  initMenu();

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 600,
    title: "StackFoundation Workflow Designer"
  });
  mainWindow.setMaximumSize(10000, 10000);
  mainWindow.setMinimumSize(400, 400);
  mainWindow.maximize();
  
  (mainWindow as any).args = process.argv;

  let url = IS_DEV_MODE
    ? 'http://localhost:9080'
    : `file://${__dirname}/index.html`;

  mainWindow.loadURL(url);
  mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.show();
  });

  if (IS_DEV_MODE) {
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
