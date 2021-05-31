const { remote, ipcRenderer, contextBridge } = require('electron');
const EventEmitter = require('events');
const platform = require('platform');
const path = require('path');
const URL = require('url');

const { Menu, MenuItem } = remote;

const isMainWindow = remote.getCurrentWindow().isMainWindow;
console.log('isMainWindow: ', isMainWindow);

let wordCounter = () => {};

if (isMainWindow) {
  const wordCounterWorkerScriptPath = path.resolve(__dirname, 'worker/word_counter.worker.js');
  console.log('word counter worker path: ', wordCounterWorkerScriptPath);
  const wordCounterWorker = new Worker(URL.pathToFileURL(wordCounterWorkerScriptPath));
  console.log('start worker');
  wordCounterWorker.onmessage = (event) => {
    const data = event.data;
    try {
      const result = JSON.parse(data);
      // eslint-disable-next-line no-use-before-define
      userManager.emit('wordCounter', result);
    } catch (err) {
      console.error(err);
    }
  };

  wordCounter = (dataObject) => {
    const data = JSON.stringify(dataObject);
    wordCounterWorker.postMessage(data);
  };
}

async function invokeApi(name, ...args) {
  const ret = await ipcRenderer.invoke(name, ...args);
  if (!ret) {
    return ret;
  }
  if (ret.error && ret.error.message) {
    const e = ret.error;
    const err = new Error(e.message);
    err.code = e.code;
    err.externCode = e.externCode;
    err.sourceStack = e.sourceStack;
    err.isNetworkError = e.isNetworkError;
    err.networkStatus = e.networkStatus;
    console.error(err);
    throw err;
  }
  return ret;
}

const windowManager = {
  toggleMaximize: () => {
    const window = remote.getCurrentWindow();
    if (window.isFullScreen()) {
      window.setFullScreen(false);
      window.unmaximize();
      return;
    }

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  },

  toggleFullScreen: () => {
    const window = remote.getCurrentWindow();
    setTimeout(() => {
      if (window.isFullScreen()) {
        window.setFullScreen(false);
      } else {
        window.setFullScreen(true);
      }
    }, 0);
  },

  minimizeWindow: () => {
    const window = remote.getCurrentWindow();
    if (!window.isMinimized()) {
      window.minimize();
    }
  },

  closeWindow: () => {
    const window = remote.getCurrentWindow();
    window.close();
  },

  isMaximized: () => {
    const window = remote.getCurrentWindow();
    return window.isMaximized();
  },

  isFullScreen: () => {
    const window = remote.getCurrentWindow();
    return window.isFullScreen();
  },

  setMenu: (menu, options) => {
    options.forEach((mItem) => {
      menu.append(new MenuItem(mItem));
    });
  },

  showSystemMenu: (x, y, intl) => {
    if (!windowManager._systemMenu) {
      const options = [
        {
          label: intl.formatMessage({ id: 'menuSendFeedback' }),
          click() {
            window.open('https://support.qq.com/products/174045');
          },
        },
        {
          label: intl.formatMessage({ id: 'menuDevTool' }),
          role: 'toggledevtools',
        },
        {
          label: intl.formatMessage({ id: 'menuAbout' }),
          click() {
            window.wizApi.userManager.emit('menuItemClicked', 'menuShowAbout');
          },
        },
        { type: 'separator' },
        {
          label: intl.formatMessage({ id: 'menuQuit' }),
          click() {
            remote.app.quit();
          },
        },
      ];
      //
      const menu = new Menu();

      windowManager.setMenu(menu, options);

      windowManager._systemMenu = menu;
    }

    const currentWindow = remote.getCurrentWindow();
    windowManager._systemMenu.popup({
      window: currentWindow,
      x,
      y,
    });
  },
  openImageViewer(imagesList, index) {
    invokeApi('openImage', imagesList, index);
  },
};

const userManager = {

  _user: null,

  _events: new EventEmitter(),

  getCurrentUser: () => userManager._user,
  
  getUserToken: () => userManager._user.token,

  getUserGuid: () => userManager._user.userGuid,

  emit: (...args) => userManager._events.emit(...args),

  on: (...args) => userManager._events.on(...args),

  off: (...args) => userManager._events.off(...args),

  addEventListener: (...args) => userManager._events.addEventListener(...args),

  removeEventListener: (...args) => userManager._events.removeEventListener(...args),

  signUp: async (server, userId, password, options = {}) => {
    userManager._user = await invokeApi('signUp', server, userId, password, options);
    return userManager._user;
  },

  onlineLogin: async (server, userId, password, options = {}) => {
    userManager._user = await invokeApi('onlineLogin', server, userId, password, options);
    return userManager._user;
  },

  localLogin: async () => {
    userManager._user = await invokeApi('localLogin');
    return userManager._user;
  },

  logout: async () => {
    try {
      await invokeApi('logout', userManager.getUserGuid());
    } catch (err) {
      console.error(err);
    }
    userManager.emit('logout');
    userManager._user = null;
  },

  queryNotes: async (kbGuid, start, count, options) => {
    const notes = await invokeApi('queryNotes', userManager.getUserGuid(), kbGuid, start, count, options);
    return notes;
  },

  getAllTitles: async (kbGuid) => {
    const notes = await invokeApi('getAllTitles', userManager.getUserGuid(), kbGuid);
    return notes;
  },

  getBackwardLinkedNotes: async (kbGuid, title) => {
    const res = await invokeApi('getBackwardLinkedNotes', userManager.getUserGuid(), kbGuid, title);
    return res;
  },

  getNote: async (kbGuid, noteGuid, options) => {
    const note = await invokeApi('getNote', userManager.getUserGuid(), kbGuid, noteGuid, options);
    return note;
  },

  getNoteMarkdown: async (kbGuid, noteGuid) => {
    const markdown = await invokeApi('getNoteMarkdown', userManager.getUserGuid(), kbGuid, noteGuid);
    wordCounter({
      kbGuid, noteGuid, markdown,
    });
    return markdown;
  },

  setNoteMarkdown: async (kbGuid, noteGuid, markdown) => {
    const result = await invokeApi('setNoteMarkdown', userManager.getUserGuid(), kbGuid, noteGuid, markdown);
    wordCounter({
      kbGuid, noteGuid, markdown,
    });
    return result;
  },

  createNote: async (kbGuid, note) => {
    const result = await invokeApi('createNote', userManager.getUserGuid(), kbGuid, note);
    return result;
  },

  deleteNote: async (kbGuid, noteGuid) => {
    const result = await invokeApi('deleteNote', userManager.getUserGuid(), kbGuid, noteGuid);
    return result;
  },

  putBackNote: async (kbGuid, noteGuid) => {
    const result = await invokeApi('putBackNote', userManager.getUserGuid(), kbGuid, noteGuid);
    return result;
  },

  syncKb: async (kbGuid, options) => {
    const result = await invokeApi('syncKb', userManager.getUserGuid(), kbGuid, options);
    return result;
  },

  addImagesFromLocal: async (kbGuid, noteGuid, options) => {
    const result = await invokeApi('addImagesFromLocal', userManager.getUserGuid(), kbGuid, noteGuid, options);
    return result;
  },

  addImageFromData: async (kbGuid, noteGuid, data, options) => {
    let arrayBuffer = null;
    if (data instanceof File) {
      arrayBuffer = await data.arrayBuffer();
    }
    const result = await invokeApi('addImageFromData', userManager.getUserGuid(), kbGuid, noteGuid, arrayBuffer || data, options);
    return result;
  },

  addImageFromUrl: async (kbGuid, noteGuid, url, options) => {
    const result = await invokeApi('addImageFromUrl', userManager.getUserGuid(), kbGuid, noteGuid, url, options);
    return result;
  },

  getSettings: async (key, defaultValue) => {
    const result = await invokeApi('getSettings', key, defaultValue);
    // TODO 临时关闭 FocusMode
    // if (/^focusMode$/i.test(key) || /^typewriterMode$/i.test(key)) {
    //   result = false;
    // }
    return result;
  },

  setSettings: async (key, value) => {
    if (key === 'focusMode') {
      userManager.emit('focusEdit', value);
    } else if (key === 'typewriterMode') {
      userManager.emit('typewriterEdit', value);
    }
    await invokeApi('setSettings', key, value);
  },

  getUserSettings: async (key, defaultValue) => {
    const result = await invokeApi('getUserSettings', userManager.getUserGuid(), key, defaultValue);
    return result;
  },

  setUserSettings: async (key, value) => {
    await invokeApi('setUserSettings', userManager.getUserGuid(), key, value);
  },

  getUserSettingsSync: (key, defaultValue) => {
    const result = ipcRenderer.sendSync('getUserSettingsSync', userManager.getUserGuid(), key, defaultValue);
    return result;
  },

  getAllTags: async (kbGuid) => {
    const result = await invokeApi('getAllTags', userManager.getUserGuid(), kbGuid);
    return result;
  },

  getAllLinks: async (kbGuid) => {
    const result = await invokeApi('getAllLinks', userManager.getUserGuid(), kbGuid);
    return result;
  },

  setNoteStarred: async (kbGuid, noteGuid, starred) => {
    const result = await invokeApi('setNoteStarred', userManager.getUserGuid(), kbGuid, noteGuid, starred);
    return result;
  },

  hasNotesInTrash: async (kbGuid) => {
    const result = await invokeApi('hasNotesInTrash', userManager.getUserGuid(), kbGuid);
    return result;
  },

  captureScreen: async (kbGuid, noteGuid, options) => {
    const result = await invokeApi('captureScreen', userManager.getUserGuid(), kbGuid, noteGuid, options);
    return result;
  },

  printToPDF: async (kbGuid, noteGuid, options) => {
    const result = await invokeApi('printToPDF', userManager.getUserGuid(), kbGuid, noteGuid, options);
    return result;
  },

  writeToMarkdown: async (kbGuid, noteGuid) => {
    const result = await invokeApi('writeToMarkdown', userManager.getUserGuid(), kbGuid, noteGuid);
    return result;
  },

  getThemeCssString: async (theme) => {
    const result = await invokeApi('getThemeCssString', theme);
    return result;
  },

  uploadMarkdown: async () => {
    const result = await invokeApi('uploadMarkdown');
    return result;
  },

  buildBindSnsUrl: (server, type, postMessage, origin, extraParams) => {
    const urlPath = '/as/thirdparty/go/auth';
    const query = {
      type,
      state: '',
      redirectUrl: '',
      postMessage: postMessage ? 1 : '',
      origin,
      extra: encodeURIComponent(extraParams),
    };
    return url;
  },

  readToMarkdown: async (filePath) => {
    const data = await invokeApi('readToMarkdown', filePath);
    return data;
  },

  getThemeCssString: async (theme) => {
    const result = await invokeApi('getThemeCssString', theme);
    return result;
  },

  getDefaultMarkdown: async () => {
    const result = await invokeApi('getDefaultMarkdown');
    return result;
  },

  screenCaptureManual: async () => {
    const result = await invokeApi('screenCaptureManual');
    return result;
  },

  queryProducts: async () => {
    const result = await invokeApi('queryProducts', userManager.getUserGuid());
    return result;
  },

  purchaseProduct: async (product) => {
    const result = await invokeApi('purchaseProduct', userManager.getUserGuid(), product);
    return result;
  },

  restorePurchases: async () => {
    const result = await invokeApi('restorePurchases', userManager.getUserGuid());
    return result;
  },

  showUpgradeVipDialog: async () => {
    const result = await invokeApi('showUpgradeVipDialog', userManager.getUserGuid());
    return result;
  },

  getUserInfo: async () => {
    const result = await invokeApi('getUserInfo', userManager.getUserGuid());
    return result;
  },

  refreshUserInfo: async () => {
    const result = await invokeApi('refreshUserInfo', userManager.getUserGuid());
    return result;
  },

  viewLogFile: async () => {
    const result = await invokeApi('viewLogFile', userManager.getUserGuid());
    return result;
  },

  unbindSns: async (st) => {
    const result = await invokeApi('unbindSns', userManager.getUserGuid(), userManager.getUserToken(), {
      st,
    });
    return result;
  },

  getUserInfoFromServer: async () => {
    const result = await invokeApi('getUserInfoFromServer', userManager.getUserGuid(), userManager.getUserToken(), {
      with_sns: true,
    });
    return result;
  },

  async changeAccount(password, userId, newUserId) {
    const result = await invokeApi('changeAccount', userManager.getUserGuid(), userManager.getUserToken(), {
      password,
      userId,
      newUserId,
    });
    return result;
  },

  updateUserDisplayName: async (displayName) => {
    const result = await invokeApi('changeUserDisplayName', userManager.getUserGuid(), userManager.getUserToken(), displayName);
    return result;
  },

  removeMobile: async () => {
    const result = await invokeApi('changeUserMobile', userManager.getUserGuid(), userManager.getUserToken(), '');
    return result;
  },

  changePassword: async (newPwd, oldPwd) => {
    const result = await invokeApi('changeUserPassword', userManager.getUserGuid(), userManager.getUserToken(), {
      newPwd,
      oldPwd,
    });
    return result;
  },

  sendMessage: async (name, ...args) => {
    ipcRenderer.send(name, userManager.getUserGuid(), ...args);
  },
};

ipcRenderer.on('logout', (event, ...args) => {
  userManager.emit('logout', ...args);
});

ipcRenderer.on('syncStart', (event, ...args) => {
  userManager.emit('syncStart', ...args);
});

ipcRenderer.on('syncFinish', (event, ...args) => {
  userManager.emit('syncFinish', ...args);
});

ipcRenderer.on('newNote', (event, ...args) => {
  userManager.emit('newNote', ...args);
});

ipcRenderer.on('showImage', (event, ...args) => {
  userManager.emit('showImage', ...args);
});

ipcRenderer.on('modifyNote', (event, ...args) => {
  userManager.emit('modifyNote', ...args);
});

ipcRenderer.on('deleteNotes', (event, ...args) => {
  userManager.emit('deleteNotes', ...args);
});

ipcRenderer.on('putBackNotes', (event, ...args) => {
  userManager.emit('putBackNotes', ...args);
});

ipcRenderer.on('downloadNotes', (event, ...args) => {
  userManager.emit('downloadNotes', ...args);
});

ipcRenderer.on('uploadNote', (event, ...args) => {
  userManager.emit('uploadNote', ...args);
});

ipcRenderer.on('tagsChanged', (event, ...args) => {
  userManager.emit('tagsChanged', ...args);
});

ipcRenderer.on('tagRenamed', (event, ...args) => {
  userManager.emit('tagRenamed', ...args);
});

ipcRenderer.on('linksChanged', (event, ...args) => {
  userManager.emit('linksChanged', ...args);
});

ipcRenderer.on('menuItemClicked', (event, ...args) => {
  const id = args[0];
  switch (id) {
    default: {
      userManager.emit('menuItemClicked', ...args);
    }
  }
});

ipcRenderer.on('userInfoChanged', (event, ...args) => {
  userManager.emit('userInfoChanged', ...args);
});

platform.isMac = platform.os.family === 'OS X';
platform.isWindows = platform.os.family === 'Windows';
platform.isLinux = platform.os.family === 'Linux';

contextBridge.exposeInMainWorld('wizApi', {
  isElectron: true,
  version: remote.app.getVersion(),
  platform,
  windowManager,
  userManager: {
    ...userManager,
  },
});
