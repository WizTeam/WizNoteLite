const trim = require('lodash/trim');
const AccountServer = require('../sync/account_server');
const UserData = require('./user_data');
const dataStore = require('./data_store');
const globalSettings = require('../settings/global_settings');
const downloadNoteData = require('../sync/download_note_data');
const { WizInternalError } = require('../../share/error');

class Users {
  constructor() {
    this._userMap = new Map();
  }

  async getUsers() {
    const users = await dataStore.getUsers();
    return users;
  }

  async _processUser(user, options, {
    server, userId, password, accountServer,
  }) {
    const mergeLocalAccount = options.mergeLocalAccount;
    if (mergeLocalAccount) {
      const users = await this.getUsers();
      const localUser = users.find((elem) => elem.isLocalUser);
      if (!localUser) {
        throw new WizInternalError('no local user');
      }
      const existUser = users.find((elem) => elem.userGuid === user.userGuid);
      if (existUser) {
        throw new WizInternalError(`user ${user.userId} has already logged in`);
      }
      //
      await dataStore.copyLocalAccount(localUser, user);
      const db = await dataStore.openPersonalDb(user.userGuid, user.kbGuid);
      // //
      const userData = new UserData();
      await userData.setUser(user, db, accountServer);
      this._userMap.set(user.userGuid, userData);
      this.initEvents(user.userGuid, db);
      //
      await db.updateAccount(userId, password, server, user);
      //
      if (options && options.autoLogin) {
        globalSettings.setLastAccount(user.userGuid);
      } else {
        globalSettings.setLastAccount('');
      }
      //
      return user;
    }
    //
    let db;
    if (this.getUserData(user.userGuid)) {
      db = await dataStore.getDb(user.kbGuid);
    } else {
      db = await dataStore.openPersonalDb(user.userGuid, user.kbGuid);
    }
    //
    const userData = new UserData();
    await userData.setUser(user, db, accountServer);
    await db.updateAccount(userId, password, server, user);
    //
    if (options && options.autoLogin) {
      globalSettings.setLastAccount(user.userGuid);
    } else {
      globalSettings.setLastAccount('');
    }
    //
    this._userMap.set(user.userGuid, userData);
    this.initEvents(user.userGuid, db);
    return user;
  }

  _processServer(server) {
    let result = trim(trim(server), '/');
    if (!result.startsWith('https://') && !result.startsWith('http://')) {
      result = `http://${result}`;
    }
    return result;
  }

  async getLink(userGuid, name) {
    const userData = this.getUserData(userGuid);
    await userData.getLink(name);
  }

  async signUp(server, userId, password, options = {}) {
    // eslint-disable-next-line no-param-reassign
    server = this._processServer(server);
    const as = new AccountServer();
    const user = await as.signUp(server, userId, password, options);
    //
    await this._processUser(user, options, {
      server, userId, password, accountServer: as,
    });
    //
    if (!options.mergeLocalAccount) {
      const userData = this.getUserData(user.userGuid);
      const db = await userData.getDb(user.kbGuid);
      const note = await db.createGuideNote();
      userData.setSettings('lastNote', note.guid);
    }
    //
    return user;
  }

  async onlineLogin(server, userId, password, options = {}) {
    // eslint-disable-next-line no-param-reassign
    server = this._processServer(server);
    //
    const as = new AccountServer();
    const user = await as.login(server, userId, password, options);
    //
    await this._processUser(user, options, {
      server, userId, password, accountServer: as,
    });
    return user;
  }

  async localLogin() {
    //
    let createdGuideNote;
    const getUser = async () => {
      //
      const users = await dataStore.getUsers();
      if (users.length === 0) {
        const { user, guideNote } = await dataStore.createDefaultAccount();
        createdGuideNote = guideNote;
        return user;
      }
      //
      if (users.length === 1) {
        if (users[0].isLocalUser) {
          return users[0];
        }
      }
      //
      const userGuid = globalSettings.getLastAccount();
      if (!userGuid) {
        return null;
      }
      //
      const user = users.find((element) => element.userGuid === userGuid);
      return user;
    };
    //
    const user = await getUser();
    if (!user) {
      return null;
    }
    //
    if (this.getUserData(user.userGuid)) {
      return this.getUserData(user.userGuid).user;
    }
    //
    const as = new AccountServer();
    as.setCurrentUser(user, user.password, user.server);
    //
    const db = await dataStore.openPersonalDb(user.userGuid, user.kbGuid);
    //
    const userData = new UserData();
    await userData.setUser(user, db, as);
    this._userMap.set(user.userGuid, userData);
    this.initEvents(user.userGuid, db);
    //
    if (createdGuideNote) {
      userData.setSettings('lastNote', createdGuideNote.guid);
    }
    //
    return user;
  }

  getUserInfo(userGuid) {
    const userData = this.getUserData(userGuid);
    const user = userData.user;
    //
    return user;
  }

  async refreshUserInfo(userGuid) {
    const userData = this.getUserData(userGuid);
    const user = await userData.refreshUserInfo();
    return user;
  }

  async logout(userGuid) {
    const userData = this.getUserData(userGuid);
    await dataStore.closeDb(userData.user.kbGuid);
    globalSettings.setLastAccount('');
    this.emitEvent(userGuid, 'logout');
    this._userMap.delete(userGuid);
  }

  async createNote(userGuid, kbGuid, note) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    await db.createNote(note);
  }

  async deleteNote(userGuid, kbGuid, noteGuid) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const note = await db.getNote(noteGuid);
    if (!note) {
      return;
    }
    if (note.trash) {
      await db.deletedFromTrash(noteGuid);
    } else {
      await db.moveNoteToTrash(noteGuid);
    }
  }

  async putBackNote(userGuid, kbGuid, noteGuid) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const note = await db.getNote(noteGuid);
    if (!note) {
      return;
    }
    if (!note.trash) {
      return;
    }
    //
    await db.putBackFromTrash(noteGuid);
  }

  async syncKb(userGuid, kbGuid, options) {
    const userData = this.getUserData(userGuid);
    await userData.syncKb(kbGuid, options);
  }

  async addImagesFromLocal(browserWindow, userGuid, kbGuid, noteGuid, options) {
    const userData = this.getUserData(userGuid);
    const ret = await userData.addImagesFromLocal(browserWindow, kbGuid, noteGuid, options);
    return ret;
  }

  async addImageFromData(userGuid, kbGuid, noteGuid, data, options) {
    const userData = this.getUserData(userGuid);
    const ret = await userData.addImageFromData(kbGuid, noteGuid, data, options);
    return ret;
  }

  async addImageFromUrl(userGuid, kbGuid, noteGuid, url, options) {
    const userData = this.getUserData(userGuid);
    const ret = await userData.addImageFromUrl(kbGuid, noteGuid, url, options);
    return ret;
  }

  getUserData(userGuid) {
    const userData = this._userMap.get(userGuid);
    return userData;
  }

  async queryNotes(userGuid, kbGuid, ...args) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const notes = await db.queryNotes(...args);
    return notes;
  }

  async getNote(userGuid, kbGuid, noteGuid, options) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const note = await db.getNote(noteGuid, options);
    return note;
  }

  async getNoteMarkdown(userGuid, kbGuid, noteGuid) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const markdown = await db.getNoteMarkdown(noteGuid);
    return markdown;
  }

  async setNoteMarkdown(userGuid, kbGuid, noteGuid, markdown) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    await db.setNoteMarkdown(noteGuid, markdown);
  }

  async downloadNoteResource(userGuid, kbGuid, noteGuid, resName) {
    const userData = this.getUserData(userGuid);
    if (!userData) {
      return;
    }
    await userData.downloadNoteResource(kbGuid, noteGuid, resName);
  }

  async hasNotesInTrash(userGuid, kbGuid) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const result = await db.hasNotesInTrash();
    return result;
  }

  async getAllTags(userGuid, kbGuid) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const tags = await db.getAllTags();
    return tags;
  }

  async getAllLinks(userGuid, kbGuid) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    const tags = await db.getAllLinks();
    return tags;
  }

  async renameTag(userGuid, kbGuid, from, to) {
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    await db.renameTag(from, to);
  }

  async setNoteStarred(userGuid, kbGuid, noteGuid, starred) {
    //
    const userData = this.getUserData(userGuid);
    const db = await userData.getDb(kbGuid);
    await db.setNoteStarred(noteGuid, starred);
  }

  getSettings(userGuid, key, defaultValue) {
    const userData = this.getUserData(userGuid);
    return userData.getSettings(key, defaultValue);
  }

  setSettings(userGuid, key, value) {
    const userData = this.getUserData(userGuid);
    userData.setSettings(key, value);
  }

  registerWindow(userGuid, webContents) {
    const userData = this.getUserData(userGuid);
    userData.registerWindow(webContents);
  }

  unregisterWindow(webContents) {
    for (const userGuid of this._userMap.keys()) {
      const userData = this.getUserData(userGuid);
      userData.unregisterWindow(webContents);
    }
  }

  emitEvent(userGuid, eventName, ...args) {
    const userData = this.getUserData(userGuid);
    if (!userData) {
      console.error(`failed to get user data: ${userGuid}, ${new Error().stack}`);
      return;
    }
    const windows = userData.windows;
    if (!windows) {
      return;
    }
    //
    for (const webContents of windows) {
      webContents.send(eventName, ...args);
    }
  }

  initEvents(userGuid, db) {
    db.on('newNote', async (note) => {
      const kbGuid = await db.getKbGuid();
      this.emitEvent(userGuid, 'newNote', kbGuid, note);
      this.syncKb(userGuid, kbGuid, {
        uploadOnly: true,
      });
    });
    //
    db.on('modifyNote', async (note) => {
      const kbGuid = await db.getKbGuid();
      this.emitEvent(userGuid, 'modifyNote', kbGuid, note);
      this.syncKb(userGuid, kbGuid, {
        uploadOnly: true,
      });
    });
    db.on('deleteNotes', async (noteGuids, options) => {
      const kbGuid = await db.getKbGuid();
      this.emitEvent(userGuid, 'deleteNotes', kbGuid, noteGuids, options);
      if (!options.permanentDeleted) {
        this.syncKb(userGuid, kbGuid, {
          uploadOnly: true,
        });
      }
    });
    db.on('putBackNotes', async (noteGuids, options) => {
      const kbGuid = await db.getKbGuid();
      this.emitEvent(userGuid, 'putBackNotes', kbGuid, noteGuids, options);
      this.syncKb(userGuid, kbGuid, {
        uploadOnly: true,
      });
    });
    db.on('tagsChanged', async (noteGuid) => {
      const kbGuid = await db.getKbGuid();
      this.emitEvent(userGuid, 'tagsChanged', kbGuid, noteGuid);
    });
    db.on('tagRenamed', async (noteGuid, from, to) => {
      const kbGuid = await db.getKbGuid();
      this.emitEvent(userGuid, 'tagRenamed', kbGuid, noteGuid, from, to);
    });
    db.on('linksChanged', async (noteGuid) => {
      const kbGuid = await db.getKbGuid();
      this.emitEvent(userGuid, 'linksChanged', kbGuid, noteGuid);
    });
    db.on('userInfoChanged', async (user) => {
      this.emitEvent(userGuid, 'userInfoChanged', user);
    });
    //

    const userData = this.getUserData(userGuid);
    //
    userData.on('syncStart', (_userGuid, kbGuid) => {
      this.emitEvent(userGuid, 'syncStart', kbGuid);
    });

    userData.on('syncFinish', (_userGuid, kbGuid, ret, options) => {
      this.emitEvent(userGuid, 'syncFinish', kbGuid, ret, options);
    });

    userData.on('syncError', (_userGuid, kbGuid, err, options) => {
      const error = {
        code: err.code,
        externCode: err.externCode,
        message: err.message,
        returnCode: err.returnCode,
        returnMessage: err.returnMessage,
        stack: err.stack,
      };
      this.emitEvent(userGuid, 'syncFinish', kbGuid, { error }, options);
    });

    userData.on('downloadNotes', (_userGuid, kbGuid, downloadedNotes) => {
      this.emitEvent(userGuid, 'downloadNotes', kbGuid, downloadedNotes);
    });

    userData.on('uploadNote', (_userGuid, kbGuid, note) => {
      this.emitEvent(userGuid, 'uploadNote', kbGuid, note);
    });

    db.setDownloadNoteHandler(async (database, noteGuid) => {
      const result = await downloadNoteData(userData.user,
        database, noteGuid, userData._refreshToken);
      return result;
    });
  }
}

const users = new Users();

module.exports = users;
