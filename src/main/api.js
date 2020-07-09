const {
  ipcMain, BrowserWindow,
  nativeImage, dialog,
  shell,
} = require('electron');
const fs = require('fs-extra');
const URL = require('url');
const path = require('path');
const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');

const users = require('./user/users');
const globalSettings = require('./settings/global_settings');
const wait = require('./utils/wait');
const paths = require('./common/paths');

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

handleApi('captureScreen', async (event, userGuid, kbGuid, noteGuid, options = {}) => {
  //
  const webContents = event.sender;
  const browserWindow = BrowserWindow.fromWebContents(webContents);
  const dialogResult = await dialog.showSaveDialog(browserWindow, {
    properties: ['saveFile'],
    filters: [{
      name: 'Images (*.png)',
      extensions: [
        'png',
      ],
    }],
  });
  if (dialogResult.canceled) {
    return;
  }
  //
  const filePath = dialogResult.filePath;
  //
  const width = options.width || 375; // iPhone X
  const height = 400; // default
  //
  const browserWindowOptions = {
    x: 0,
    y: 0,
    width,
    height,
    resizable: false,
    show: false,
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

  window.loadURL(`${mainUrl}?kbGuid=${kbGuid}&noteGuid=${noteGuid}`);
  //
  //
  window.webContents.on('ipc-message', async (e, channel, ...args) => {
    if (channel === 'onNoteLoaded') {
      const [, , , noteOptions] = args;
      const totalHeight = noteOptions.height;
      const windowWidth = window.getSize()[0];
      const pageHeight = 400;
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
            await window.webContents.executeJavaScript(`document.documentElement.scrollTop = ${top};`);
          } else if (i > 0) {
            await window.webContents.executeJavaScript(`document.documentElement.scrollTop = ${i * pageHeight};`);
          }
        }
        const top = await window.webContents.executeJavaScript(`document.documentElement.scrollTop;`);
        //
        await wait(1000); // wait scrollbar
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
      }
      //
      const emptyImage = nativeImage.createFromPath(path.join(tempPath, `0.png`));
      const resizedImage = emptyImage.resize({
        width: windowWidth * scaleX,
        height: totalHeight * scaleY,
      });
      const pngEmpty = resizedImage.toPNG();
      const pngEmptyFile = path.join(tempPath, `empty.png`);
      await fs.writeFile(pngEmptyFile, pngEmpty);
      images.unshift({
        src: pngEmptyFile,
        x: 0,
        y: 0,
      });
      //
      const base64 = await mergeImages(images, {
        Canvas,
        Image,
      }, {
        width: 200,
        height: 200,
      });
      //
      const image = nativeImage.createFromDataURL(base64);
      const png = image.toPNG();
      const imageName = filePath;
      await fs.writeFile(imageName, png);
      //
      shell.showItemInFolder(filePath);
      //
      e.preventDefault();
      //
      setTimeout(() => {
        // unregisterWindow(window);
        // window.close();
      }, 1000);
    }
  });
});


module.exports = {
  unregisterWindow,
};
