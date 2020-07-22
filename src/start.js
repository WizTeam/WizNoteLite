const {
  app, BrowserWindow, nativeTheme,
  shell, Menu, nativeImage,
} = require('electron');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');

const { unregisterWindow } = require('./main/api');
const { registerWizProtocol } = require('./main/db/resource_loader');

const { i18nInit, getCurrentLang } = require('./main/i18n');
const { getMainMenuTemplate, getMacDockMenuTemplate } = require('./main/settings/menu_options');

const isMac = process.platform === 'darwin';
const electronVersion = process.versions.electron;
console.log(`electron version: ${electronVersion}`);


app.on('ready', async () => {
  await i18nInit();
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
    show: isMac,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#101115' : '#fff',
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, './web/preload.js'),
    },
    icon: nativeImage.createFromPath(path.join(__dirname, '/icons/wiznote.icns')),
  };
  //
  if (process.platform === 'darwin') {
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
    pathname: path.join(__dirname, '/../web-app/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  const lang = getCurrentLang();
  mainWindow.loadURL(`${mainUrl}?lang=${lang}`);

  // mainWindow.webContents.openDevTools();

  if (!isMac) {
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
  }
  //
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !forceQuit) {
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else if (process.platform === 'darwin') {
    if (mainWindow) {
      mainWindow.show();
    }
  }
});
