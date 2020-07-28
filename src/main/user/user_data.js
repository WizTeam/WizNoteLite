const EventEmitter = require('events');
const assert = require('assert');
const path = require('path');
const URL = require('url');
const fs = require('fs-extra');
const { dialog } = require('electron');
const { v4: uuidv4 } = require('uuid');
const i18next = require('i18next');
const imageType = require('image-type');
const debounce = require('lodash/debounce');
const SyncKbTask = require('../sync/sync_kb_task');
const { WizKnownError, WizInvalidParamError, WizInvalidPasswordError } = require('../../share/error');
const paths = require('../common/paths');
const UserSettings = require('../settings/user_settings');

class UserData extends EventEmitter {
  constructor() {
    super();
    this._user = null;
    this._personalDb = null;
    this._as = null;
    this._webContents = new Set();
    this._isSyncing = false;
  }

  async setUser(user, personalDb, accountServer) {
    this._user = user;
    this._personalDb = personalDb;
    this._as = accountServer;
    this._delayedSyncKb = debounce(this._syncKbCore, 3 * 1000); // delay 3 seconds
    this._userSettings = new UserSettings(user.userGuid);
    //
    this._refreshToken = async () => {
      console.log(`refresh token`);
      const db = this._personalDb;
      const account = await db.getAccountInfo();
      if (!account.password) {
        throw new WizInvalidPasswordError('no password');
      }
      try {
        const newUser = await this._as.login(account.server, account.userId,
          account.password, {
            noRetry: true,
            noCheckExists: true,
          });
        console.log(`succeeded to refresh token`);
        await db.updateAccount(newUser.userId, account.password, account.server, newUser);
        return newUser.token;
      } catch (err) {
        if (err.code === 31001 || err.externCode === 'WizErrorInvalidPassword') {
          throw new WizInvalidPasswordError();
        }
        throw err;
      }
    };
    //
  }

  async refreshUserInfo() {
    if (this._user.isLocalUser) {
      throw new WizKnownError(i18next.t('messageNoAccount', 'No account'), 'WizErrorNoAccount');
    }
    const db = this._personalDb;
    const newUser = await this._as.refreshUserInfo(this.token);
    this._user = newUser;
    await db.updateUserInfo(newUser);
    return newUser;
  }

  getLink(name) {
    this._as.getLink(name);
  }

  get userGuid() {
    assert(this._user, 'user has not initialized');
    return this._user.userGuid;
  }

  get user() {
    return this._user;
  }

  get token() {
    assert(this._user, 'user has not initialized');
    return this._user.token;
  }

  get accountServer() {
    assert(this._user, 'user has not initialized');
    return this._as;
  }

  async getDb(kbGuid) {
    if (!kbGuid || kbGuid === this._user.kbGuid) {
      return this._personalDb;
    }
    //
    return null;
  }

  registerWindow(webContents) {
    this._webContents.add(webContents);
  }

  unregisterWindow(webContents) {
    this._webContents.delete(webContents);
  }

  get windows() {
    return this._webContents;
  }

  async addImagesFromLocal(browserWindow, kbGuid, noteGuid) {
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
    const resourcePath = paths.getNoteResources(this.userGuid, kbGuid, noteGuid);
    for (const file of dialogResult.filePaths) {
      const guid = uuidv4();
      const ext = path.extname(file);
      const newName = guid + ext;
      const imagePath = path.join(resourcePath, newName);
      await fs.copyFile(file, imagePath);
      result.push(`index_files/${newName}`);
    }
    return result;
  }

  async addImageFromData(kbGuid, noteGuid, data) {
    const type = imageType(data);
    if (!type) {
      throw new WizInvalidParamError('Unknown image type');
    }
    const resourcePath = paths.getNoteResources(this.userGuid, kbGuid, noteGuid);
    const guid = uuidv4();
    const newName = `${guid}.${type.ext}`;
    const imageName = path.join(resourcePath, newName);
    //
    function toBuffer(ab) {
      const buf = Buffer.alloc(ab.byteLength);
      const view = new Uint8Array(ab);
      for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
      }
      return buf;
    }
    if (data.byteLength) {
      // eslint-disable-next-line no-param-reassign
      data = toBuffer(data);
    }
    //
    await fs.writeFile(imageName, data);
    return `index_files/${newName}`;
  }

  async addImageFromUrl(kbGuid, noteGuid, url) {
    console.log(url);
    const resourcePath = paths.getNoteResources(this.userGuid, kbGuid, noteGuid);
    const u = URL.parse(url);
    if (u.protocol === 'file') {
      const file = u.path;
      if (file.startsWith(resourcePath)) {
        const imageName = path.basename(file);
        return `index_files/${imageName}`;
      }
      //
      const guid = uuidv4();
      const ext = path.extname(file);
      const newName = guid + ext;
      const imagePath = path.join(resourcePath, newName);
      await fs.copyFile(file, imagePath);
      return `index_files/${newName}`;
    }
    return url;
  }

  async syncKb(kbGuid, options = {}) {
    if (this._user.isLocalUser) {
      if (options.manual) {
        throw new WizKnownError(i18next.t('messageNoAccount', 'No account'), 'WizErrorNoAccount');
      }
      return;
    }
    //
    if (this._isSyncing) {
      this.emit('syncStart', this.userGuid, kbGuid);
    }
    //
    if (options.manual || options.noWait) {
      this._syncKbCore(kbGuid, options);
      return;
    }

    //
    console.log(`request sync`);
    this._delayedSyncKb(kbGuid, options);
  }

  //
  async _syncKbCore(kbGuid, options = {}) {
    //
    if (this._isSyncing) {
      return;
    }
    //
    try {
      this._isSyncing = true;
      console.log(`start syncing...`);
      const db = await this.getDb(kbGuid);
      const server = await db.getServerUrl();
      const syncTask = new SyncKbTask(this._user, server, kbGuid, db, this._refreshToken, options);
      //
      syncTask.on('start', (task) => {
        this.emit('syncStart', this.userGuid, task.kbGuid);
      });

      syncTask.on('finish', (task, ret, syncOptions) => {
        this.emit('syncFinish', this.userGuid, task.kbGuid, ret, syncOptions);
      });

      syncTask.on('error', (task, err, syncOptions) => {
        this.emit('syncError', this.userGuid, task.kbGuid, err, syncOptions);
      });

      syncTask.on('downloadNotes', (task, notes) => {
        this.emit('downloadNotes', this.userGuid, task.kbGuid, notes);
      });

      syncTask.on('uploadNote', (task, note) => {
        this.emit('uploadNote', this.userGuid, task.kbGuid, note);
      });
      //
      await syncTask.syncAll();
    } catch (err) {
      console.error(err);
    } finally {
      this._isSyncing = false;
      console.log(`sync done`);
    }
  }

  async downloadNoteResource(kbGuid, noteGuid, resName) {
    const db = await this.getDb(kbGuid);
    const server = await db.getServerUrl();
    let kb = kbGuid;
    if (!kb) {
      kb = await db.getKbGuid();
    }
    const syncTask = new SyncKbTask(this._user, server, kb, db, this._refreshToken);
    await syncTask.downloadNoteResource(noteGuid, resName);
  }

  getSettings(key, defaultValue) {
    return this._userSettings.getSettings(key, defaultValue);
  }

  setSettings(key, value) {
    this._userSettings.setSettings(key, value);
  }
}

module.exports = UserData;
