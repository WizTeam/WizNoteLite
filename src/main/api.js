const { ipcMain, BrowserWindow } = require('electron');
const users = require('./user/users');
const globalSettings = require('./settings/global_settings');


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

function unregisterWindow(window) {
  users.unregisterWindow(window.webContents);
}

module.exports = {
  unregisterWindow,
};
