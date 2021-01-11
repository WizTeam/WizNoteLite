const {
  BrowserWindow, nativeTheme,
  nativeImage,
} = require('electron');
const path = require('path');
const url = require('url');

class ImageViewer {
  static _obj = undefined;

  static createdImageViewer() {
    if (!ImageViewer._obj) {
      ImageViewer._obj = new ImageViewer();
    }
    return ImageViewer._obj;
  }

  win = undefined

  constructor() {
    this.win = new BrowserWindow({
      show: false,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#101115' : '#fff',
      icon: nativeImage.createFromPath(path.join(__dirname, '../icons/wiznote.icns')),
      webPreferences: {
        nodeIntegration: false,
        preload: path.join(__dirname, '../web/preload.js'),
      },
    });
    const mainUrl = process.env.ELECTRON_START_URL
    || url.format({
      pathname: path.join(__dirname, '../../web-app/index.html'),
      protocol: 'file:',
      slashes: true,
    });
    this.win.loadURL(`${mainUrl}?type=imageViewer`);
    this.win.maximize();
    this.win.webContents.openDevTools();
  }

  show(imagesList, index) {
    this.win.webContents.send('showImage', {
      imagesList,
      index,
    });
    if (!this.win.isVisible()) {
      this.win.show();
    }
  }
}

module.exports = ImageViewer;
