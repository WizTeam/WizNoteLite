const {
  ipcMain, BrowserWindow,
  dialog,
  shell,
} = require('electron');
const fs = require('fs-extra');
const URL = require('url');
const path = require('path');
const PImage = require('pureimage');
const log = require('electron-log');
const sdk = require('wiznote-sdk-js');

const inAppPurchase = require('./inapp/in_app_purchase');

const paths = sdk.core.paths;
const wait = sdk.core.utils.wait;
const i18next = sdk.core.i18next;

const isDebug = false;

function unregisterWindow(window) {
  sdk.unregisterListener(window.webContents);
}

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
  const link = await sdk.getLink(...args);
  return link;
});

handleApi('signUp', async (event, ...args) => {
  const user = await sdk.signUp(...args);
  sdk.registerListener(user.userGuid, event.sender);
  // 因为registerWindow在login/signup之后，所以消息没有正常发出。在这里强制发送一下消息
  sdk.emitEvent(user.userGuid, 'userInfoChanged', user);
  //
  return user;
});

handleApi('onlineLogin', async (event, ...args) => {
  const user = await sdk.onlineLogin(...args);
  sdk.registerListener(user.userGuid, event.sender);
  // 因为registerWindow在login/signup之后，所以消息没有正常发出。在这里强制发送一下消息
  sdk.emitEvent(user.userGuid, 'userInfoChanged', user);
  //
  return user;
});


handleApi('localLogin', async (event, ...args) => {
  const user = await sdk.localLogin(...args);
  if (user) {
    sdk.registerListener(user.userGuid, event.sender);
    // 因为registerWindow在login/signup之后，所以消息没有正常发出。在这里强制发送一下消息
    sdk.emitEvent(user.userGuid, 'userInfoChanged', user);
  }
  return user;
});

handleApi('logout', async (event, ...args) => {
  await sdk.logout(...args);
});

handleApi('queryNotes', async (event, ...args) => {
  const notes = await sdk.queryNotes(...args);
  return notes;
});

handleApi('getNote', async (event, ...args) => {
  const result = await sdk.getNote(...args);
  return result;
});

handleApi('getNoteMarkdown', async (event, ...args) => {
  const result = await sdk.getNoteMarkdown(...args);
  return result;
});

handleApi('setNoteMarkdown', async (event, ...args) => {
  const result = await sdk.setNoteMarkdown(...args);
  return result;
});

handleApi('createNote', async (event, ...args) => {
  const result = await sdk.createNote(...args);
  return result;
});

handleApi('deleteNote', async (event, ...args) => {
  const result = await sdk.deleteNote(...args);
  return result;
});

handleApi('putBackNote', async (event, ...args) => {
  const result = await sdk.putBackNote(...args);
  return result;
});

handleApi('syncKb', async (event, ...args) => {
  const result = await sdk.syncKb(...args);
  return result;
});

handleApi('addImagesFromLocal', async (event, userGuid, kbGuid, noteGuid) => {
  const webContents = event.sender;
  const browserWindow = BrowserWindow.fromWebContents(webContents);
  // const result = await sdk.addImagesFromLocal(browserWindow, ...args);
  // return result;

  const dialogResult = await dialog.showOpenDialog(browserWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{
      name: 'Images (*.png, *.jpg, *.jpeg, *,bmp, *.gif)',
      extensions: [
        'png', 'jpg', 'jpeg', 'bmp', 'gif',
      ],
    }],
  });
  if (dialogResult.canceled) {
    return [];
  }
  const result = [];
  for (const file of dialogResult.filePaths) {
    const data = await fs.readFile(file);
    const resName = await sdk.addImageFromData(userGuid, kbGuid, noteGuid, data);
    result.push(resName);
  }
  return result;
});

handleApi('addImageFromData', async (event, ...args) => {
  const result = await sdk.addImageFromData(...args);
  return result;
});


handleApi('addImageFromUrl', async (event, ...args) => {
  const result = await sdk.addImageFromUrl(...args);
  return result;
});

handleApi('getSettings', async (event, key, defaultValue) => sdk.getSettings(key, defaultValue));

handleApi('setSettings', async (event, key, value) => sdk.setSettings(key, value));

handleApi('getUserSettings', async (event, userGuid, key, defaultValue) => sdk.getUserSettings(userGuid, key, defaultValue));

handleApi('setUserSettings', async (event, userGuid, key, value) => sdk.setUserSettings(userGuid, key, value));

ipcMain.on('getUserSettingsSync', (event, userGuid, key, defaultValue) => {
  const result = sdk.getUserSettings(userGuid, key, defaultValue);
  // eslint-disable-next-line no-param-reassign
  event.returnValue = result;
});


handleApi('getAllTags', async (event, ...args) => {
  const result = await sdk.getAllTags(...args);
  return result;
});

handleApi('getAllLinks', async (event, ...args) => {
  const result = await sdk.getAllLinks(...args);
  return result;
});

handleApi('renameTag', async (event, ...args) => {
  const result = await sdk.renameTag(...args);
  return result;
});

handleApi('setNoteStarred', async (event, ...args) => {
  const result = await sdk.setNoteStarred(...args);
  return result;
});

handleApi('hasNotesInTrash', async (event, ...args) => {
  const result = await sdk.hasNotesInTrash(...args);
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
      try {
        await window.webContents.executeJavaScript('window.requestAnimationFrame;0;');
      } catch (err) {
        console.error(err);
      }
      const pageCount = Math.floor((totalHeight + pageHeight - 1) / pageHeight);
      //
      const images = [];
      let scaleX;
      let scaleY;
      //
      const tempPath = paths.getTempPath();
      await fs.ensureDir(tempPath);
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
        try {
          await window.webContents.executeJavaScript('window.requestAnimationFrame;0;');
        } catch (err) {
          console.error(err);
        }
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
      const note = await sdk.getNote(userGuid, kbGuid, noteGuid);
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
      const note = await sdk.getNote(userGuid, kbGuid, noteGuid);
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

handleApi('writeToMarkdown', async (event, userGuid, kbGuid, noteGuid) => {
  const webContents = event.sender;
  const browserWindow = BrowserWindow.fromWebContents(webContents);
  //
  const note = await sdk.getNote(userGuid, kbGuid, noteGuid);
  const fileName = noteTitleToFileName(note.title);
  //
  const dialogResult = await dialog.showSaveDialog(browserWindow, {
    properties: ['saveFile'],
    defaultPath: `${fileName}.md`,
    filters: [{
      name: i18next.t('fileFilterMarkdown'),
      extensions: [
        'md',
      ],
    }],
  });

  if (dialogResult.canceled) return;
  //
  const filePath = dialogResult.filePath;
  const targetDirname = path.dirname(filePath);
  const targetFilesDirname = path.join(targetDirname, 'index_files');
  //
  const resourcePath = await paths.getNoteResources(userGuid, kbGuid, noteGuid);
  const files = await fs.readdir(resourcePath);
  //
  if (!fs.existsSync(targetFilesDirname) && files.length) {
    await fs.mkdir(targetFilesDirname);
  }
  //
  for (const file of files) {
    const oldFilePath = path.join(resourcePath, file);
    const newFilePath = path.join(targetFilesDirname, file);
    await fs.copyFile(oldFilePath, newFilePath);
  }
  //
  const data = await sdk.getNoteMarkdown(userGuid, kbGuid, noteGuid);
  await fs.writeFile(filePath, data);
  //
  shell.showItemInFolder(filePath);
});

handleApi('queryProducts', inAppPurchase.queryProducts);
handleApi('purchaseProduct', inAppPurchase.purchaseProduct);
handleApi('restorePurchases', inAppPurchase.restorePurchases);
handleApi('showUpgradeVipDialog', inAppPurchase.showUpgradeVipDialog);

handleApi('getUserInfo', async (event, userGuid) => {
  const user = sdk.getUserInfo(userGuid);
  return user;
});


handleApi('refreshUserInfo', async (event, userGuid) => {
  const user = await sdk.refreshUserInfo(userGuid);
  return user;
});

handleApi('viewLogFile', async () => {
  const logPath = log.transports.file.file;
  shell.openPath(logPath);
});


module.exports = {
  unregisterWindow,
};
