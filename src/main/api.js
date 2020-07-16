const {
  ipcMain, BrowserWindow,
  dialog,
  shell,
} = require('electron');
const fs = require('fs-extra');
const URL = require('url');
const path = require('path');
const PImage = require('pureimage');
const i18next = require('i18next');

const users = require('./user/users');
const globalSettings = require('./settings/global_settings');
const wait = require('./utils/wait');
const paths = require('./common/paths');

const isDebug = false;

function unregisterWindow(window) {
  users.unregisterWindow(window.webContents);
}

ipcMain.on('init', (event, options) => {
  console.log(options);
  // eslint-disable-next-line no-param-reassign
  event.returnValue = {};
});

async function handleApi(name, api) {
  ipcMain.handle(name, async (event, ...args) => {
    try {
      const ret = await api(event, ...args);
      return ret;
    } catch (err) {
      console.error(err);
      return {
        error: {
          code: err.code,
          message: err.message,
          externCode: err.externCode,
          sourceStack: err.stack,
          isNetworkError: err.isAxiosError,
          networkStatus: err.response?.status,
        },
      };
    }
  });
}

handleApi('getLink', async (event, ...args) => {
  const link = await users.getLink(...args);
  return link;
});

handleApi('signUp', async (event, ...args) => {
  const user = await users.signUp(...args);
  users.registerWindow(user.userGuid, event.sender);
  return user;
});

handleApi('onlineLogin', async (event, ...args) => {
  const user = await users.onlineLogin(...args);
  users.registerWindow(user.userGuid, event.sender);
  return user;
});


handleApi('localLogin', async (event, ...args) => {
  const user = await users.localLogin(...args);
  if (user) {
    users.registerWindow(user.userGuid, event.sender);
  }
  return user;
});

handleApi('logout', async (event, ...args) => {
  await users.logout(...args);
});

handleApi('queryNotes', async (event, ...args) => {
  const notes = await users.queryNotes(...args);
  return notes;
});

handleApi('getNote', async (event, ...args) => {
  const result = await users.getNote(...args);
  return result;
});

handleApi('getNoteMarkdown', async (event, ...args) => {
  const result = await users.getNoteMarkdown(...args);
  return result;
});

handleApi('setNoteMarkdown', async (event, ...args) => {
  const result = await users.setNoteMarkdown(...args);
  return result;
});

handleApi('createNote', async (event, ...args) => {
  const result = await users.createNote(...args);
  return result;
});

handleApi('deleteNote', async (event, ...args) => {
  const result = await users.deleteNote(...args);
  return result;
});

handleApi('putBackNote', async (event, ...args) => {
  const result = await users.putBackNote(...args);
  return result;
});

handleApi('syncKb', async (event, ...args) => {
  const result = await users.syncKb(...args);
  return result;
});

handleApi('addImagesFromLocal', async (event, ...args) => {
  const webContents = event.sender;
  const browserWindow = BrowserWindow.fromWebContents(webContents);
  const result = await users.addImagesFromLocal(browserWindow, ...args);
  return result;
});

handleApi('addImageFromData', async (event, ...args) => {
  const result = await users.addImageFromData(...args);
  return result;
});


handleApi('addImageFromUrl', async (event, ...args) => {
  const result = await users.addImageFromUrl(...args);
  return result;
});

handleApi('getSettings', async (event, key, defaultValue) => globalSettings.getSettings(key, defaultValue));

handleApi('setSettings', async (event, key, value) => globalSettings.setSettings(key, value));

handleApi('getUserSettings', async (event, userGuid, key, defaultValue) => users.getSettings(userGuid, key, defaultValue));

handleApi('setUserSettings', async (event, userGuid, key, value) => users.setSettings(userGuid, key, value));

ipcMain.on('getUserSettingsSync', (event, userGuid, key, defaultValue) => {
  const result = users.getSettings(userGuid, key, defaultValue);
  // eslint-disable-next-line no-param-reassign
  event.returnValue = result;
});


handleApi('getAllTags', async (event, ...args) => {
  const result = await users.getAllTags(...args);
  return result;
});

handleApi('getAllLinks', async (event, ...args) => {
  const result = await users.getAllLinks(...args);
  return result;
});

handleApi('renameTag', async (event, ...args) => {
  const result = await users.renameTag(...args);
  return result;
});

handleApi('setNoteStarred', async (event, ...args) => {
  const result = await users.setNoteStarred(...args);
  return result;
});

handleApi('hasNotesInTrash', async (event, ...args) => {
  const result = await users.hasNotesInTrash(...args);
  return result;
});

function noteTitleToFileName(title) {
  let result = '';
  for (const ch of title) {
    if (`\\/<>:"|?*`.indexOf(ch) === -1) {
      result += ch;
    } else {
      // result += '-';
    }
  }
  return result;
}

handleApi('captureScreen', async (event, userGuid, kbGuid, noteGuid, options = {}) => {
  //
  const senderWebContents = event.sender;
  const progressCallback = options.progressCallback;
  //
  const onProgress = async (progress) => {
    if (progressCallback) {
      await senderWebContents.executeJavaScript(`${progressCallback}(${progress});`);
    }
  };
  await onProgress(0);
  //
  const width = options.width || 375; // iPhone X
  const pageHeight = 600; // default
  //
  const browserWindowOptions = {
    x: 0,
    y: 0,
    width,
    height: pageHeight,
    resizable: false,
    show: isDebug,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, '../web/preload.js'),
    },
  };
  const window = new BrowserWindow(browserWindowOptions);

  const mainUrl = process.env.ELECTRON_START_URL
  || URL.format({
    pathname: path.join(__dirname, '../../web-app/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  const theme = options.theme || 'lite';
  const padding = options.padding || 16;

  window.loadURL(`${mainUrl}?kbGuid=${kbGuid}&noteGuid=${noteGuid}&padding=${padding}&theme=${theme}&hideThumb=1&showFooter=1`);
  if (isDebug) window.webContents.toggleDevTools();
  //
  window.webContents.on('ipc-message', async (e, channel, ...args) => {
    if (channel === 'onNoteLoaded') {
      await onProgress(10);
      const [, , , noteOptions] = args;
      const totalHeight = noteOptions.height;
      const windowWidth = window.getSize()[0];
      window.setSize(windowWidth, pageHeight);
      await window.webContents.executeJavaScript('window.requestAnimationFrame;');
      const pageCount = Math.floor((totalHeight + pageHeight - 1) / pageHeight);
      //
      const images = [];
      let scaleX;
      let scaleY;
      //
      const tempPath = paths.getTempPath();
      //
      for (let i = 0; i < pageCount; i++) {
        //
        if (pageCount > 1) {
          if (i === pageCount - 1) {
            const top = totalHeight - pageHeight;
            await window.webContents.executeJavaScript(`document.getElementById('wiz-note-content-root').parentElement.scrollTop = ${top};`);
          } else if (i > 0) {
            await window.webContents.executeJavaScript(`document.getElementById('wiz-note-content-root').parentElement.scrollTop = ${i * pageHeight};`);
          }
        }
        const top = await window.webContents.executeJavaScript(`document.getElementById('wiz-note-content-root').parentElement.scrollTop;`);
        //
        await wait(300); // wait scrollbar
        await window.webContents.executeJavaScript('window.requestAnimationFrame;');
        const image = await window.capturePage();
        const imageSize = image.getSize();
        if (i === 0) {
          scaleX = imageSize.width / windowWidth;
          scaleY = imageSize.height / pageHeight;
        }
        const png = image.toPNG();
        const imageName = path.join(tempPath, `${i}.png`);
        await fs.writeFile(imageName, png);
        images.push({
          src: imageName,
          x: 0,
          y: top * scaleY,
        });
        //
        await onProgress(10 + Math.floor(((i + 1) / pageCount) * 80));
      }
      //
      // pureimage 提供的drawImage有一些浮点数计算的问题，会导致图片质量下降
      const drawImage = (toBitmap, dx, dy, fromBitmap) => {
        // two argument form
        for (let y = 0; y < fromBitmap.height; y++) {
          for (let x = 0; x < fromBitmap.width; x++) {
            const rgba = fromBitmap.getPixelRGBA(x, y);
            toBitmap.setPixelRGBA(dx + x, dy + y, rgba);
          }
        }
      };
      //
      const resultImage = PImage.make(windowWidth * scaleX, totalHeight * scaleY);
      for (const imageData of images) {
        const image = await PImage.decodePNGFromStream(fs.createReadStream(imageData.src));
        drawImage(resultImage, imageData.x, imageData.y, image);
        fs.unlinkSync(imageData.src);
      }
      //
      await onProgress(100);
      //
      const note = await users.getNote(userGuid, kbGuid, noteGuid);
      const fileName = noteTitleToFileName(note.title);
      //
      const browserWindow = BrowserWindow.fromWebContents(senderWebContents);
      const dialogResult = await dialog.showSaveDialog(browserWindow, {
        defaultPath: `${fileName}.png`,
        properties: ['saveFile'],
        filters: [{
          name: i18next.t('fileFilterPNG'),
          extensions: [
            'png',
          ],
        }],
      });
      if (!dialogResult.canceled) {
        const filePath = dialogResult.filePath;
        //
        await PImage.encodePNGToStream(resultImage, fs.createWriteStream(filePath));
        //
        shell.showItemInFolder(filePath);
      }
      //
      e.preventDefault();
      await onProgress(-1);
      //
      setTimeout(() => {
        if (!isDebug) {
          unregisterWindow(window);
          window.close();
        }
      }, 1000);
    }
  });
});


handleApi('printToPDF', async (event, userGuid, kbGuid, noteGuid, options = {}) => {
  //
  const senderWebContents = event.sender;
  const progressCallback = options.progressCallback;
  //
  const onProgress = async (progress) => {
    if (progressCallback) {
      await senderWebContents.executeJavaScript(`${progressCallback}(${progress});`);
    }
  };
  await onProgress(0);
  //
  const calWidth = (pdfOptions) => {
    //
    if (pdfOptions.landscape) {
      //
      switch (pdfOptions.pageSize) {
        case 'A3':
          return 1191;
        case 'A5':
          return 595;
        case 'Legal':
          return 975;
        case 'Letter':
          return 750;
        case 'Tabloid':
          return 1200;
        default: // A4
          return 842;
      }
    }
    //
    switch (pdfOptions.pageSize) {
      case 'A3':
        return 842;
      case 'A5':
        return 420;
      case 'Legal':
        return 563;
      case 'Letter':
        return 563;
      case 'Tabloid':
        return 750;
      default: // A4
        return 595;
    }
  };
  //
  const pdfOptions = {
    marginsType: options.marginsType,
    pageSize: options.pageSize || 'A4',
    printBackground: options.printBackground,
    printSelectionOnly: options.printSelectionOnly,
    landscape: options.landscape,
  };
  //
  const width = calWidth(pdfOptions);
  //
  const browserWindowOptions = {
    x: 0,
    y: 0,
    width,
    height: 600,
    resizable: false,
    show: isDebug,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, '../web/preload.js'),
    },
  };
  const window = new BrowserWindow(browserWindowOptions);

  const mainUrl = process.env.ELECTRON_START_URL
  || URL.format({
    pathname: path.join(__dirname, '../../web-app/index.html'),
    protocol: 'file:',
    slashes: true,
  });

  window.loadURL(`${mainUrl}?kbGuid=${kbGuid}&noteGuid=${noteGuid}&standardScrollBar=1&padding=32&theme=lite`);
  if (isDebug) window.webContents.toggleDevTools();
  //
  window.webContents.on('ipc-message', async (e, channel) => {
    if (channel === 'onNoteLoaded') {
      //
      e.preventDefault();
      //
      await onProgress(10);
      //
      const note = await users.getNote(userGuid, kbGuid, noteGuid);
      const fileName = noteTitleToFileName(note.title);
      //
      const browserWindow = BrowserWindow.fromWebContents(senderWebContents);
      const dialogResult = await dialog.showSaveDialog(browserWindow, {
        properties: ['saveFile'],
        defaultPath: `${fileName}.pdf`,
        filters: [{
          name: i18next.t('fileFilterPDF'),
          extensions: [
            'pdf',
          ],
        }],
      });
      if (!dialogResult.canceled) {
        const data = await window.webContents.printToPDF(pdfOptions);
        const filePath = dialogResult.filePath;
        await fs.writeFile(filePath, data);
        //
        shell.showItemInFolder(filePath);
      }
      await onProgress(-1);
      //
      setTimeout(() => {
        if (!isDebug) {
          unregisterWindow(window);
          window.close();
        }
      }, 1000);
    }
  });
});


module.exports = {
  unregisterWindow,
};
