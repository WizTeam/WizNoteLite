require('./wrapper');
const {
  app, BrowserWindow, nativeTheme,
  shell, Menu, nativeImage,
} = require('electron');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const log = require('electron-log');
const sdk = require('wiznote-sdk-js');

const i18nResources = require('./i18n');
const { unregisterWindow } = require('./api');
const { registerWizProtocol } = require('./db/resource_loader');
const { getMainMenuTemplate, getMacDockMenuTemplate } = require('./settings/menu_options');

Object.assign(console, log.functions);

const electronVersion = process.versions.electron;
console.log(`electron version: ${electronVersion}`);

const isMac = process.platform === 'darwin';

app.on('ready', async () => {
  sdk.i18nInit(i18nResources);
  const menu = Menu.buildFromTemplate(getMainMenuTemplate());
  Menu.setApplicationMenu(menu);
  //
  if (isMac) {
    const dockMenu = Menu.buildFromTemplate(getMacDockMenuTemplate());
    app.dock.setMenu(dockMenu);
  }
  //
  try {
    registerWizProtocol();
  } catch (err) {
    console.error(err);
  }
});

let mainWindow;
let forceQuit;

function createWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 640,
  });

  const options = {
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    resizable: true,
    show: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#101115' : '#fff',
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, '../web/preload.js'),
    },
    icon: nativeImage.createFromPath(path.join(__dirname, '../icons/wiznote.icns')),
  };
  //
  if (isMac) {
    // mac
    options.titleBarStyle = 'hidden';
  } else {
    options.frame = process.env.SHOW_TITLE_BAR === '1';
  }
  //
  //
  //
  mainWindow = new BrowserWindow(options);
  mainWindow.isMainWindow = true;
  mainWindowState.manage(mainWindow);
  //
  const mainUrl = process.env.ELECTRON_START_URL
    || url.format({
      pathname: path.join(__dirname, '../../web-app/index.html'),
      protocol: 'file:',
      slashes: true,
    });

  const lang = sdk.getCurrentLang();
  mainWindow.loadURL(`${mainUrl}?lang=${lang}`);

  // mainWindow.webContents.openDevTools();

  // Windows 10 延迟显示会导致 输入法窗口位置异常
  // if (!isMac) {
  //   mainWindow.once('ready-to-show', () => {
  //     mainWindow.show();
  //   });
  // }
  //
  mainWindow.on('close', (event) => {
    if (!forceQuit) {
      event.preventDefault(); // This will cancel the close
      mainWindow.hide();
    } else {
      unregisterWindow(mainWindow);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('new-window', (event, linkUrl) => {
    event.preventDefault();
    shell.openExternal(linkUrl);
  });
}

app.on('ready', createWindow);

app.on('before-quit', () => {
  forceQuit = true;
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

if (!isMac) {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
