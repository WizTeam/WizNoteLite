/* eslint-disable no-param-reassign */

import EventEmitter from 'events';
import axios from 'axios';
import assert from 'assert';
import CryptoJS from 'crypto-js';
import isEqual from 'lodash/isEqual';
import trim from 'lodash/trim';
import removeMd from 'remove-markdown';
import platform from 'platform';
import { getResourcesFromHtml, extractTagsFromMarkdown } from '../share/note_analysis';
import {
  WizInvalidUserError,
  WizInvalidPasswordError,
  WizInvalidTokenError,
  WizNetworkError,
  WizInternalError,
  WizKnownError,
} from '../share/error';

function getAsUrl() {
  if (window.location.host === 'localhost:3000') {
    return 'https://v3.wiz.cn';
  } else if (window.location.host === 'www.wiz.cn') {
    return 'https://as.wiz.cn';
  }
  return window.location.origin;
}

const AS_URL = getAsUrl();

function markdownToHtml(markdown) {
  const DEFAULT_NOTE_HTML = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" >
      <head></head>
    </head>
    <body>
      <pre><!--wiznote-lite-markdown--></pre>
    </body>
  </html>`;
  //
  const text = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = DEFAULT_NOTE_HTML;
  return html.replace('<!--wiznote-lite-markdown-->', text);
}


function htmlToMarkdown(html) {
  const from = html.indexOf('<pre>');
  const to = html.lastIndexOf('</pre>');
  if (from === -1 || to === -1 || from > to) {
    return '';
  }
  //
  const text = html.substr(from + 5, to - from - 5);
  const result = text.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  return result;
}


function encryptText(text, password) {
  return CryptoJS.AES.encrypt(text, password).toString();
}

function decryptText(text, password) {
  const bytes = CryptoJS.AES.decrypt(text, password);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
}

let refreshToken = null;

async function executeStandardRequest(opt) {
  //
  const requestCore = async (options) => {
    assert(options, `no request options`);
    //
    const token = options.token;
    //
    if (token) {
      if (!options.headers) {
        options.headers = {
          'X-Wiz-Token': token,
        };
      } else {
        options.headers['X-Wiz-Token'] = token;
      }
    }
    //
    if (options.url.indexOf('?') === -1) {
      options.url += '?clientType=web&clientVersion=3.0';
    } else {
      options.url += '&clientType=web&clientVersion=3.0';
    }
    //
    const result = await axios(options);
    if (result.status !== 200) {
      throw new WizNetworkError(result.statusText);
    }
    //
    if (!result.data) {
      throw new WizInternalError('no data returned');
    }
    //
    const data = result.data;
    if (opt.responseType !== 'arraybuffer') {
      //
      if (data.returnCode !== 200) {
        if (data.returnCode === 301) {
          throw new WizInvalidTokenError();
        } else if (data.returnCode === 31001) {
          throw new WizInvalidUserError();
        } else if (data.returnCode === 31002) {
          throw new WizInvalidPasswordError();
        }
        throw new WizKnownError(data.returnMessage, data.returnCode, data.externCode);
      }
    }
    //
    if (opt.returnFullResult) {
      return data;
    }
    return data.result;
  };
  //
  try {
    const result = await requestCore(opt);
    return result;
  } catch (err) {
    if (!(err instanceof WizInvalidTokenError)) {
      throw err;
    }
    //
    const shouldRetry = !opt.noRetry && refreshToken;
    if (!shouldRetry) {
      throw err;
    }
    //
    const token = await refreshToken();
    if (!token) {
      throw err;
    }
    //
    opt.token = token;
    const result = await requestCore(opt);
    return result;
  }
}

class Store {
  constructor() {
    this._storage = window.localStorage;
  }

  getSettings(key, defaultValue) {
    const value = this._storage.getItem(key);
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return JSON.parse(value);
  }

  setSettings(key, value) {
    if (value === undefined || value === null) {
      this._storage.removeItem(key);
      return;
    }
    this._storage.setItem(key, JSON.stringify(value));
  }
}

class GlobalSettings extends Store {

}

class UserSettings extends Store {
  constructor(userGuid) {
    super();
    this._userGuid = userGuid;
  }

  getSettings(key, defaultValue) {
    return super.getSettings(`${this._userGuid}_${key}`, defaultValue);
  }

  setSettings(key, value) {
    return super.setSettings(`${this._userGuid}_${key}`, value);
  }
}

const globalSettings = new GlobalSettings();


class WindowManager {
  toggleMaximize() {
    console.error('not support');
  }

  toggleFullScreen() {
  }
}


class UserManager extends EventEmitter {
  constructor() {
    super();
    this._user = null;
    this._lastNoteMarkdown = null;
  }

  async _executeAsRequest(options) {
    options.url = `${AS_URL}/${options.url}`;
    const result = await executeStandardRequest(options);
    return result;
  }

  async _executeKsRequest(options) {
    const kbServer = this.getKbServer(options.kbGuid);
    options.url = `${kbServer}/${options.url}`;
    const result = await executeStandardRequest(options);
    return result;
  }

  get currentUser() {
    return this._user;
  }

  get userGuid() {
    return this._user.userGuid;
  }

  get token() {
    return this._user.token;
  }

  async _initGroups() {
    const options = {
      url: 'as/user/groups',
      method: 'get',
      token: this.token,
    };
    const groups = await this._executeAsRequest(options);
    const groupMap = new Map();
    groups.forEach((group) => {
      groupMap.set(group.kbGuid, group);
    });
    const personalKb = {
      kbGuid: this._user.kbGuid,
      kbServer: this._user.kbServer,
      isPersonalKb: true,
    };
    groupMap.set(this._user.kbGuid, personalKb);
    this._groupMap = groupMap;
  }

  getKbServer(kbGuid) {
    let kbServer = this._groupMap.get(kbGuid).kbServer;
    if (kbServer.startsWith('http:')) {
      kbServer = kbServer.substr(5);
    }
    return kbServer;
  }

  async _init() {
    //
    await this._initGroups();
    //
  }

  async onlineLogin(server, userId, password /* , options = {} */) {
    const requestOptions = {
      url: `as/user/login`,
      method: 'post',
      data: {
        userId,
        password,
      },
    };
    const result = await this._executeAsRequest(requestOptions);
    const lastUser = {
      userId,
      password: encryptText(password, userId),
    };
    globalSettings.setSettings('lastUser', lastUser);
    this._account = {
      userId: lastUser.userId,
      password: lastUser.password,
    };
    this._user = result;
    this._userSettings = new UserSettings(this.userGuid);
    await this._init();
    return result;
  }

  async localLogin() {
    const lastUser = globalSettings.getSettings('lastUser');
    if (!lastUser) {
      return null;
    }
    lastUser.password = decryptText(lastUser.password, lastUser.userId);
    const options = {
      url: `as/user/login`,
      method: 'post',
      data: {
        userId: lastUser.userId,
        password: lastUser.password,
      },
    };
    const result = await this._executeAsRequest(options);
    this._account = {
      userId: lastUser.userId,
      password: lastUser.password,
    };
    this._user = result;
    this._userSettings = new UserSettings(this.userGuid);
    await this._init();
    return result;
  }

  async refreshToken() {
    const { userId, password } = this._account;
    const options = {
      url: `as/user/login`,
      method: 'post',
      data: {
        userId,
        password,
      },
      noRetry: true,
    };

    try {
      const result = await this._executeAsRequest(options);
      return result.token;
    } catch (err) {
      //
      if (err instanceof WizInvalidUserError || err instanceof WizInvalidPasswordError) {
        this.logout({
          noRemote: true,
        });
      }
      //
      return null;
    }
  }

  async logout(options = {}) {
    let callServerLogout = true;
    if (options.noRemote) {
      callServerLogout = false;
    }
    //
    globalSettings.setSettings('lastUser', null);
    const user = this._user;
    //
    try {
      if (callServerLogout) {
        const requestOptions = {
          url: `as/user/logout`,
          method: 'get',
          token: this.token,
        };
        await this._executeAsRequest(requestOptions);
      }
    } catch (err) {
      //
    } finally {
      this._user = null;
      this.emit('logout', user.userGuid);
    }
  }

  _processNote(note) {
    // guid
    note.guid = note.docGuid;
    note.modified = note.dataModified;
    // attributes
    if (note.author) {
      for (const ch of note.author) {
        if (ch === 'a') {
          note.archived = true;
        } else if (ch === 'd') {
          note.trash = true;
        } else if (ch === 't') {
          note.archived = true;
        } else if (ch === 's') {
          note.starred = true;
        }
      }
    }
    // tags
    delete note.tags;
    if (note.keywords) {
      note.tags = note.keywords;
    }
    // title
    if (note.title?.endsWith('.md')) {
      note.title = note.title.substr(0, note.title.length - 3);
    }
    return note;
  }

  async queryNotes(kbGuid, start, count, options) {
    //
    const requestOptions = {
      url: `ks/note/list/category/${kbGuid}?type=lite/&start=${start}&count=${count}`,
      kbGuid,
      token: this.token,
    };
    if (options.tags) {
      const keywords = encodeURIComponent(options.tags);
      requestOptions.url += `&keywords=${keywords}`;
    }
    if (options.starred) {
      requestOptions.url += `&starred=1`;
    }
    if (options.trash) {
      requestOptions.url += `&trash=1`;
    }
    if (options.searchText) {
      requestOptions.url += `&searchText=${encodeURIComponent(options.searchText)}`;
    }
    const notes = await this._executeKsRequest(requestOptions);
    //
    notes.forEach(this._processNote);
    //
    return notes;
  }

  async getNote(kbGuid, noteGuid) {
    const options = {
      url: `ks/note/download/${kbGuid}/${noteGuid}?downloadInfo=1`,
      kbGuid,
      method: 'get',
      token: this.token,
      returnFullResult: true,
    };
    const result = await this._executeKsRequest(options);
    const note = result.info;
    this._processNote(note);
    return note;
  }

  async getNoteMarkdown(kbGuid, noteGuid) {
    const options = {
      url: `ks/note/download/${kbGuid}/${noteGuid}?downloadData=1`,
      method: 'get',
      kbGuid,
      token: this.token,
      returnFullResult: true,
    };
    const result = await this._executeKsRequest(options);
    const html = result.html;
    const markdown = htmlToMarkdown(html);
    this._lastNoteMarkdown = markdown;
    return markdown;
  }

  async setNoteMarkdown(kbGuid, noteGuid, markdown) {
    const html = markdownToHtml(markdown);
    //
    const resources = getResourcesFromHtml(html);
    //
    const tags = extractTagsFromMarkdown(markdown);
    const tagsValue = tags.map((tag) => `#${tag}/`).join('|');
    //
    const note = {
      kbGuid,
      docGuid: noteGuid,
      html,
      resources,
      keywords: tagsValue,
    };

    const text = removeMd(markdown);
    const firstLineEnd = text.indexOf('\n');
    if (firstLineEnd === -1) {
      note.title = text.trim();
      note.abstract = '';
    } else {
      note.title = text.substr(0, firstLineEnd).trim();
      note.abstract = text.substr(firstLineEnd + 1).substr(0, 200).trim();
    }
    //
    note.title = `${note.title}.md`;
    //
    const options = {
      url: `ks/note/save/${kbGuid}/${noteGuid}`,
      kbGuid,
      method: 'put',
      token: this.token,
      data: note,
    };
    const resultNote = await this._executeKsRequest(options);
    this._processNote(resultNote);
    this.emit('modifyNote', kbGuid, resultNote);
    //
    const oldTags = extractTagsFromMarkdown(this._lastNoteMarkdown || '');
    if (!isEqual(tags, oldTags)) {
      this.emit('tagsChanged', kbGuid);
    }
    this._lastNoteMarkdown = markdown;
  }

  async createNote(kbGuid, note) {
    //
    note.category = '/Lite/';
    //
    if (note.tag) {
      note.keywords = `#${note.tag}/`;
      delete note.tag;
    }
    if (!note.title) {
      note.title = 'New Note';
    }
    if (!note.type) {
      note.type = 'lite/markdown';
    }
    //
    if (!note.title.endsWith('.md')) {
      note.title += '.md';
    }
    //
    if (note.html) {
      //
    } else if (note.markdown) {
      note.html = markdownToHtml(note.markdown);
    } else {
      note.html = markdownToHtml('# Note Title\n');
    }
    note.kbGuid = kbGuid;
    //
    const options = {
      url: `ks/note/create/${kbGuid}`,
      kbGuid,
      token: this.token,
      data: note,
      method: 'post',
    };
    //
    const newNote = await this._executeKsRequest(options);
    this._processNote(newNote);
    this.emit('newNote', kbGuid, newNote);
    return newNote;
  }

  async deleteNote(kbGuid, noteGuid, note) {
    if (note) {
      if (note.trash) {
        // TODO: delete note from server
        return;
      }
      // 提高界面反应速度
      note.trash = true;
      this.emit('modifyNote', kbGuid, note);
    }
    await this._modifyAttribute(kbGuid, noteGuid, 'd', true);
  }

  async putBackNote(kbGuid, noteGuid, note) {
    if (note) {
      if (!note.trash) {
        // nothing to do
        return;
      }
      // 提高界面反应速度
      note.trash = false;
      this.emit('modifyNote', kbGuid, note);
    }
    await this._modifyAttribute(kbGuid, noteGuid, 'd', false);
  }

  async syncKb() {
    // nothing to to
  }

  async addImagesFromLocal(kbGuid, noteGuid, options) {
    // TODO: upload image first
    console.log(kbGuid, noteGuid, options);
  }

  async addImageFromData(kbGuid, noteGuid, data, options) {
    console.log(kbGuid, noteGuid, data, options);
  }

  async addImageFromUrl(kbGuid, noteGuid, url, options) {
    console.log(kbGuid, noteGuid, url, options);
  }


  async getSettings(key, defaultValue) {
    return globalSettings.getSettings(key, defaultValue);
  }

  async setSettings(key, value) {
    if (key === 'focusMode') {
      this.emit('focusEdit', value);
    }
    this.setSettings.getSettings(key, value);
  }

  async getUserSettings(key, defaultValue) {
    return this._userSettings.getSettings(key, defaultValue);
  }

  async setUserSettings(key, value) {
    this._userSettings.setSettings(key, value);
  }

  getUserSettingsSync(key, defaultValue) {
    return this._userSettings.getSettings(key, defaultValue);
  }

  async getAllTags(kbGuid) {
    //
    const options = {
      url: `ks/kb/keywords/${kbGuid}?type=lite/`,
      method: 'get',
      kbGuid,
      token: this.token,
    };
    //
    const allKeywords = await this._executeKsRequest(options);
    const allTags = allKeywords.map((keywords) => keywords.split('|')).flat();
    //
    const result = {};
    allTags.forEach((name) => {
      name = trim(name, '#/');
      const tags = name.split('/');
      let parent = result;
      let fullPath = '';
      tags.forEach((tag) => {
        fullPath = fullPath ? `${fullPath}/${tag}` : tag;
        if (!parent[tag]) {
          parent[tag] = {
            wizName: tag,
            wizFull: fullPath,
          };
        }
        parent = parent[tag];
      });
    });
    //
    return result;
  }

  async getAllLinks(kbGuid) {
    console.log(kbGuid);
    return [];
  }

  async setNoteStarred(kbGuid, noteGuid, starred, note) {
    if (note) {
      // 提高界面反应速度
      note.starred = starred;
      this.emit('modifyNote', kbGuid, note);
    }
    await this._modifyAttribute(kbGuid, noteGuid, 's', starred);
  }

  async hasNotesInTrash(/* kbGuid */) {
    return true;
  }

  async _modifyNoteInfo(kbGuid, noteGuid, note) {
    //
    note.kbGuid = kbGuid;
    note.docGuid = noteGuid;
    //
    const options = {
      url: `ks/note/save/${kbGuid}/${noteGuid}?infoOnly=1`,
      kbGuid,
      method: 'put',
      token: this.token,
      data: note,
    };
    const resultNote = await this._executeKsRequest(options);
    this._processNote(resultNote);
    this.emit('modifyNote', kbGuid, resultNote);
  }

  async _modifyAttribute(kbGuid, noteGuid, attribute, on) {
    const old = await this.getNote(kbGuid, noteGuid);
    let author = old.author || '';
    const set = new Set(Array.from(author.toLowerCase()));
    if (on) {
      set.add(attribute);
    } else {
      set.delete(attribute);
    }
    author = Array.from(set).join('');
    //
    await this._modifyNoteInfo(kbGuid, noteGuid, {
      author,
    });
  }
}

const userManager = new UserManager();
const windowManager = new WindowManager();

refreshToken = async () => {
  const token = await userManager.refreshToken();
  return token;
};

export default {
  isElectron: false,
  platform,
  windowManager,
  userManager,
};
