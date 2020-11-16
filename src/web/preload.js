const EventEmitter = require('events');
const axios = require('axios');
const { remote, ipcRenderer } = require('electron');
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
      window.wizApi.userManager.emit('wordCounter', result);
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

class WindowManager {
  toggleMaximize() {
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
  }

  toggleFullScreen() {
    const window = remote.getCurrentWindow();
    setTimeout(() => {
      if (window.isFullScreen()) {
        window.setFullScreen(false);
      } else {
        window.setFullScreen(true);
      }
    }, 0);
  }

  minimizeWindow() {
    const window = remote.getCurrentWindow();
    if (!window.isMinimized()) {
      window.minimize();
    }
  }

  closeWindow() {
    const window = remote.getCurrentWindow();
    window.close();
  }

  isMaximized() {
    const window = remote.getCurrentWindow();
    return window.isMaximized();
  }

  isFullScreen() {
    const window = remote.getCurrentWindow();
    return window.isFullScreen();
  }

  setMenu(menu, options) {
    options.forEach((mItem) => {
      menu.append(new MenuItem(mItem));
    });
  }

  showSystemMenu(x, y, intl) {
    if (!this._systemMenu) {
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

      this.setMenu(menu, options);

      this._systemMenu = menu;
    }

    const currentWindow = remote.getCurrentWindow();
    this._systemMenu.popup({
      window: currentWindow,
      x,
      y,
    });
  }
}

class UserManager extends EventEmitter {
  constructor() {
    super();
    this._user = null;
  }

  get currentUser() {
    return this._user;
  }

  get userGuid() {
    return this._user.userGuid;
  }

  get userToken() {
    return this._user.token;
  }

  get getAsUrl() {
    if (window.location.host === 'localhost:3000') {
      return 'https://v3.wiz.cn';
    } else if (window.location.host === '') {
      return 'https://as.wiz.cn';
    }
    return window.location.origin;
  }

  async signUp(server, userId, password, options = {}) {
    this._user = await invokeApi('signUp', server, userId, password, options);
    return this._user;
  }

  async onlineLogin(server, userId, password, options = {}) {
    this._user = await invokeApi('onlineLogin', server, userId, password, options);
    return this._user;
  }

  async localLogin() {
    this._user = await invokeApi('localLogin');
    return this._user;
  }

  async logout() {
    try {
      await invokeApi('logout', this.userGuid);
    } catch (err) {
      console.error(err);
    }
    this.emit('logout');
    this._user = null;
  }

  async queryNotes(kbGuid, start, count, options) {
    const notes = await invokeApi('queryNotes', this.userGuid, kbGuid, start, count, options);
    return notes;
  }

  async getNote(kbGuid, noteGuid, options) {
    const note = await invokeApi('getNote', this.userGuid, kbGuid, noteGuid, options);
    return note;
  }

  async getNoteMarkdown(kbGuid, noteGuid) {
    const markdown = await invokeApi('getNoteMarkdown', this.userGuid, kbGuid, noteGuid);
    wordCounter({
      kbGuid, noteGuid, markdown,
    });
    return markdown;
  }

  async setNoteMarkdown(kbGuid, noteGuid, markdown) {
    const result = await invokeApi('setNoteMarkdown', this.userGuid, kbGuid, noteGuid, markdown);
    wordCounter({
      kbGuid, noteGuid, markdown,
    });
    return result;
  }

  async createNote(kbGuid, note) {
    const result = await invokeApi('createNote', this.userGuid, kbGuid, note);
    return result;
  }

  async deleteNote(kbGuid, noteGuid) {
    const result = await invokeApi('deleteNote', this.userGuid, kbGuid, noteGuid);
    return result;
  }

  async putBackNote(kbGuid, noteGuid) {
    const result = await invokeApi('putBackNote', this.userGuid, kbGuid, noteGuid);
    return result;
  }

  async syncKb(kbGuid, options) {
    const result = await invokeApi('syncKb', this.userGuid, kbGuid, options);
    return result;
  }

  async addImagesFromLocal(kbGuid, noteGuid, options) {
    const result = await invokeApi('addImagesFromLocal', this.userGuid, kbGuid, noteGuid, options);
    return result;
  }

  async addImageFromData(kbGuid, noteGuid, data, options) {
    let arrayBuffer = null;
    if (data instanceof File) {
      arrayBuffer = await data.arrayBuffer();
    }
    const result = await invokeApi('addImageFromData', this.userGuid, kbGuid, noteGuid, arrayBuffer || data, options);
    return result;
  }

  async addImageFromUrl(kbGuid, noteGuid, url, options) {
    const result = await invokeApi('addImageFromUrl', this.userGuid, kbGuid, noteGuid, url, options);
    return result;
  }

  async getSettings(key, defaultValue) {
    let result = await invokeApi('getSettings', key, defaultValue);
    // TODO 临时关闭 FocusMode
    if (/^focusMode$/i.test(key) || /^typewriterMode$/i.test(key)) {
      result = false;
    }
    return result;
  }

  async setSettings(key, value) {
    if (key === 'focusMode') {
      this.emit('focusEdit', value);
    } else if (key === 'typewriterMode') {
      this.emit('typewriterEdit', value);
    }
    await invokeApi('setSettings', key, value);
  }

  async getUserSettings(key, defaultValue) {
    const result = await invokeApi('getUserSettings', this.userGuid, key, defaultValue);
    return result;
  }

  async setUserSettings(key, value) {
    await invokeApi('setUserSettings', this.userGuid, key, value);
  }

  getUserSettingsSync(key, defaultValue) {
    const result = ipcRenderer.sendSync('getUserSettingsSync', this.userGuid, key, defaultValue);
    return result;
  }

  async getAllTags(kbGuid) {
    const result = await invokeApi('getAllTags', this.userGuid, kbGuid);
    return result;
  }

  async getAllLinks(kbGuid) {
    const result = await invokeApi('getAllLinks', this.userGuid, kbGuid);
    return result;
  }

  async setNoteStarred(kbGuid, noteGuid, starred) {
    const result = await invokeApi('setNoteStarred', this.userGuid, kbGuid, noteGuid, starred);
    return result;
  }

  async hasNotesInTrash(kbGuid) {
    const result = await invokeApi('hasNotesInTrash', this.userGuid, kbGuid);
    return result;
  }

  async captureScreen(kbGuid, noteGuid, options) {
    const result = await invokeApi('captureScreen', this.userGuid, kbGuid, noteGuid, options);
    return result;
  }

  async printToPDF(kbGuid, noteGuid, options) {
    const result = await invokeApi('printToPDF', this.userGuid, kbGuid, noteGuid, options);
    return result;
  }

  async writeToMarkdown(kbGuid, noteGuid) {
    const result = await invokeApi('writeToMarkdown', this.userGuid, kbGuid, noteGuid);
    return result;
  }

  async getThemeCssString(theme) {
    const result = await invokeApi('getThemeCssString', theme);
    return result;
  }

  async getDefaultMarkdown() {
    const result = await invokeApi('getDefaultMarkdown');
    return result;
  }

  async screenCaptureManual() {
    const result = await invokeApi('screenCaptureManual');
    return result;
  }

  async queryProducts() {
    const result = await invokeApi('queryProducts', this.userGuid);
    return result;
  }

  async purchaseProduct(product) {
    const result = await invokeApi('purchaseProduct', this.userGuid, product);
    return result;
  }

  async restorePurchases() {
    const result = await invokeApi('restorePurchases', this.userGuid);
    return result;
  }

  async showUpgradeVipDialog() {
    const result = await invokeApi('showUpgradeVipDialog', this.userGuid);
    return result;
  }

  async getUserInfo() {
    const result = await invokeApi('getUserInfo', this.userGuid);
    return result;
  }

  async refreshUserInfo() {
    const result = await invokeApi('refreshUserInfo', this.userGuid);
    return result;
  }

  async viewLogFile() {
    const result = await invokeApi('viewLogFile', this.userGuid);
    return result;
  }

  async changeAccount(password, userId, newUserId) {
    const url = `as/users/change_account`;
    const options = {
      url: `${this.getAsUrl}/${url}?clientType=web&clientVersion=3.0`,
      method: 'post',
      headers: {
        'X-Wiz-Token': this.userToken,
      },
      data: {
        userId,
        newUserId,
        password,
      },
    };

    const result = await axios(options);
    if (result.status !== 200) {
      throw new Error(result.statusText);
    }
    if (result.data && result.data.returnCode !== 200) {
      throw new Error(result.data.returnCode);
    }
    return result.data;
  }

  async sendMessage(name, ...args) {
    ipcRenderer.send(name, this.userGuid, ...args);
  }
}

const userManager = new UserManager();
const windowManager = new WindowManager();

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

window.wizApi = {
  isElectron: true,
  version: remote.app.getVersion(),
  platform,
  windowManager,
  userManager,
};
