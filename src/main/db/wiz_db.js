const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const md5 = require('md5');
const EventEmitter = require('events');
const removeMd = require('remove-markdown');
const trim = require('lodash/trim');
const isEqual = require('lodash/isEqual');
const intersection = require('lodash/intersection');
const Sqlite = require('./sqlite_db');
const paths = require('../common/paths');
const { WizInternalError, WizNotExistsError, WizInvalidParamError } = require('../../share/error');
const wiznoteSqlCommands = require('./wiz_sql_commands');
const noteData = require('./note_data');
const enc = require('../common/enc');
const { highlightText } = require('../utils/word');

const VERSION_INFO_CHANGED = -1;
const VERSION_DATA_CHANGED = -2;

const LOCAL_STATUS_DOWNLOADED = 1;
const LOCAL_STATUS_NEED_REDOWNLOAD = 0;

function isDataChanged(version) {
  return version === VERSION_DATA_CHANGED;
}

// function isInfoChanged(version) {
//   return version < 0;
// }

class WizDb extends EventEmitter {
  constructor(userGuid, kbGuid, isPersonalKb) {
    super();
    const p = path.join(paths.getUsersData(), userGuid);
    fs.ensureDirSync(p);
    const fileName = isPersonalKb ? 'index' : kbGuid;
    const dbPath = path.join(p, `${fileName}.db`);
    // console.log(dbPath);
    this._sqlite = new Sqlite(dbPath);
    this._kbGuid = kbGuid;
    this._userGuid = userGuid;
  }

  get userGuid() {
    return this._userGuid;
  }

  setDownloadNoteHandler(handler) {
    this._downloadNoteHandler = handler;
  }

  //
  async setMeta(key, value) {
    const now = new Date().valueOf();
    await this._sqlite.run(`INSERT INTO wiz_meta(key, value, updated) VALUES(?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value=?, updated=?;`,
    [key, value, now, value, now]);
  }

  //
  async getMeta(key, defaultValue) {
    const sql = `SELECT value FROM wiz_meta WHERE key=?`;
    const values = [key];
    const value = await this._sqlite.fieldValue(sql, values, 'value', false);
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return value;
  }

  //
  async open() {
    await this._sqlite.open();
    await this._sqlite.update(wiznoteSqlCommands);
  }

  // close
  async close() {
    await this._sqlite.close();
    this._sqlite = null;
  }

  async updateAccount(userId, password, server, user) {
    await this.setMeta('userId', userId);
    await this.setMeta('password', enc.aes.encryptText(password, user.userGuid));
    await this.setMeta('server', server);
    await this.updateUserInfo(user);
  }

  async updateUserInfo(user) {
    await this.setMeta('user', JSON.stringify(user));
    this.emit('userInfoChanged', user);
  }

  async getUserInfo() {
    const userText = await this.getMeta('user');
    if (!userText) {
      return null;
    }
    const user = JSON.parse(userText);
    return user;
  }

  // account info
  async getAccountInfo() {
    const userText = await this.getMeta('user');
    if (!userText) {
      return null;
    }
    const user = JSON.parse(userText);
    user.server = await this.getMeta('server');
    try {
      user.password = enc.aes.decryptText(await this.getMeta('password'), user.userGuid);
    } catch (err) {
      user.password = '';
    }
    return user;
  }

  async getKbGuid() {
    if (this._kbGuid) {
      return this._kbGuid;
    }
    //
    const accountInfo = await this.getAccountInfo();
    return accountInfo.kbGuid;
  }

  async getServerUrl() {
    const accountInfo = await this.getAccountInfo();
    return accountInfo.kbServer;
  }

  async getObjectsVersion(objectType) {
    const version = await this.getMeta(`${objectType}_version`, 0);
    return version;
  }

  async setObjectsVersion(objectType, version) {
    await this.setMeta(`${objectType}_version`, version);
  }

  async _getNotes(sqlWhere, values) {
    const sql = `select * from wiz_note ${sqlWhere}`;
    const notes = await this._sqlite.all(sql, values);
    for (const note of notes) {
      note.fileType = note.file_type;
      note.attachmentCount = note.attachment_count;
      note.dataMd5 = note.data_md5;
      note.localStatus = note.local_status;
      note.onTop = note.on_top;
      note.lastSynced = note.last_synced;
      //
      delete note.file_type;
      delete note.attachment_count;
      delete note.data_md5;
      delete note.local_status;
      delete note.on_top;
      delete note.last_synced;
      //
    }
    return notes;
  }

  async getNote(guid) {
    const sqlWhere = `where guid=? and (deleted is null or deleted = 0)`;
    const values = [guid];
    const notes = await this._getNotes(sqlWhere, values);
    if (notes.length === 0) {
      return null;
    }
    return notes[0];
  }

  async getNotesGuidByTag(name) {
    const nameValue = `#${name}/$`;
    const sql = `select guid as guid from wiz_note where tags like ?`;
    const values = [
      nameValue,
    ];
    //
    const rows = await this._sqlite.all(sql, values);
    return rows.map((row) => row.guid);
  }

  async queryNotes(start, count, options = {}) {
    //
    const conditions = [];
    const values = [];
    if (options.tags) {
      let tags = options.tags;
      if (!Array.isArray(tags)) {
        tags = [tags];
      }
      tags.forEach((name) => {
        const nameValue = `%#${name}/%`;
        const condition = `tags like ?`;
        conditions.push(condition);
        values.push(nameValue);
      });
    }
    //
    if (options.trash) {
      conditions.push('trash=1');
    } else {
      conditions.push('(trash is null or trash = 0)');
    }
    //
    if (options.starred) {
      conditions.push('starred=1');
    }
    if (options.archived) {
      conditions.push('archived=1');
    }
    if (options.onTop) {
      conditions.push('onTop=1');
    }
    //
    const sqlWhere = conditions.join(' and ');
    if (!options.searchText) {
      values.push(start, count);
      const notes = await this._getNotes(`where ${sqlWhere} limit ?, ?`, values);
      return notes;
    }
    //
    const sql = `select guid from wiz_note where ${sqlWhere}`;
    const categoryGuids = (await this._sqlite.all(sql, values)).map((row) => row.guid);
    //
    const { guids, rows } = await this.getNotesGuidBySearchText(options.searchText);
    const searchedGuid = guids;
    const searchResult = rows;
    //
    let resultsGuid = intersection(searchedGuid, categoryGuids);
    resultsGuid = resultsGuid.slice(start, start + count);
    //
    const notes = await this.getNotesByGuid(resultsGuid);
    //
    const noteMap = new Map();
    notes.forEach((note) => noteMap.set(note.guid, note));
    //
    const searchResultMap = new Map();
    searchResult.forEach((search) => searchResultMap.set(search.guid, search));
    //
    const result = [];
    //
    resultsGuid.forEach((guid) => {
      const note = noteMap.get(guid);
      if (!note) {
        return;
      }
      //
      const search = searchResultMap.get(guid);
      note.highlight = {
        title: highlightText(search.title, options.searchText, {
          full: true,
        }),
        text: highlightText(search.text, options.searchText),
      };
      //
      result.push(note);
    });
    //
    return result;
  }

  async getNotesByGuid(noteGuidArr) {
    const guidData = [noteGuidArr.map((guid) => `'${guid}'`).join(', ')];
    const sqlWhere = `where guid in (${guidData}) and (deleted is null or deleted = 0)`;
    const notes = await this._getNotes(sqlWhere, []);
    return notes;
  }

  async getModifiedNotes() {
    const sqlWhere = `where version < 0 and (deleted is null or deleted = 0)`;
    const notes = await this._getNotes(sqlWhere, []);
    return notes;
  }

  async getNextNeedToBeDownloadedNote() {
    const sqlWhere = `where version >= 0 and (local_status=0 or local_status is null) and (trash is null or trash = 0) limit 1`;
    const notes = await this._getNotes(sqlWhere, []);
    if (notes.length === 0) {
      return null;
    }
    return notes[0];
  }

  async getDeletedNotes() {
    const sqlWhere = `where deleted = 1`;
    const notes = await this._getNotes(sqlWhere, []);
    return notes;
  }

  async _changeTrashStatus(noteGuid, trash) {
    const note = await this.getNote(noteGuid);
    if (!note) {
      return null;
    }
    //
    const oldTags = await this.getAllTagsName();
    //
    let version = note.version;
    if (version !== VERSION_DATA_CHANGED) {
      version = VERSION_INFO_CHANGED;
    }
    //
    const sql = `update wiz_note set trash=?, deleted=0, version=? where guid=?`;
    const values = [trash, version, noteGuid];
    await this._sqlite.run(sql, values);
    //
    const newTags = await this.getAllTagsName();
    //
    if (!isEqual(oldTags, newTags)) {
      this.emit('tagsChanged');
    }
    note.version = version;
    note.trash = trash;
    return note;
  }

  async moveNoteToTrash(noteGuid) {
    const note = await this._changeTrashStatus(noteGuid, 1);
    if (!note) {
      return null;
    }
    this.emit('deleteNotes', [noteGuid], {
      permanentDelete: false,
    });
    return note;
  }


  async putBackFromTrash(noteGuid) {
    const note = await this._changeTrashStatus(noteGuid, 0);
    if (!note) {
      return null;
    }
    this.emit('putBackNotes', [noteGuid]);
    return note;
  }

  async deletedFromTrash(noteGuid) {
    //
    this.emit('deleteNotes', [noteGuid], {
      permanentDelete: true,
    });
    //
    const sql = `update wiz_note set trash=1, deleted=1 where guid=?`;
    const values = [noteGuid];
    await this._sqlite.run(sql, values);
  }

  async permanentDeleteNotesByGuid(guids) {
    //
    const guidsSql = guids.map((guid) => `'${guid}'`).join(',');
    const sql = `delete from wiz_note where guid in (${guidsSql})`;
    const ret = await this._sqlite.run(sql);
    console.log(`deleted ${ret} notes`);
    return ret;
  }

  async setNoteVersion(noteGuid, version) {
    if (version >= 0) {
      const sql = `update wiz_note set version=?, last_synced=? where guid=?`;
      const now = new Date().valueOf();
      const values = [version, now, noteGuid];
      await this._sqlite.run(sql, values);
    } else {
      const sql = `update wiz_note set version=? where guid=?`;
      const values = [version, noteGuid];
      await this._sqlite.run(sql, values);
    }
    //
    const result = await this.getNote(noteGuid);
    return result;
  }

  async setNoteLocalStatus(noteGuid, status) {
    const sql = `update wiz_note set local_status=? where guid=?`;
    const values = [status, noteGuid];
    await this._sqlite.run(sql, values);
  }

  async setNoteText(noteGuid, text) {
    const sql = `update wiz_note set text=? where guid=?`;
    const values = [text, noteGuid];
    await this._sqlite.run(sql, values);
  }

  async syncNote(note) {
    //
    const old = await this.getNote(note.guid);
    if (!old) {
      const sql = `insert into wiz_note(guid, title, category, 
        name, seo, url,
        tags, owner, type, file_type, 
        created, modified, encrypted, attachment_count,
        data_md5, version, local_status, abstract,
        starred, archived, on_top, trash) 
        values (?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`;
      //
      const values = [note.guid, note.title, note.category || '/Lite/',
        note.name, note.seo, note.url,
        note.tags, note.owner, note.type, note.fileType,
        note.created, note.dataModified, note.encrypted, note.attachmentCount,
        note.dataMd5, note.version, 0, note.abstract,
        note.starred, note.archived, note.onTop, note.trash];
      //
      await this._sqlite.run(sql, values);
      return true;
    }
    //
    if (isDataChanged(old.version)) {
      console.error(`${old.title} has changed in local, should not be overwritten by server`);
      return false;
    }
    if (old.version === note.version) {
      // 避免用服务器的abstract（有延迟）覆盖本地的abstract
      console.log(`${note.title} not changed, skip.`);
      return false;
    }
    //
    const needRedownload = note.dataMd5 !== old.dataMd5;
    const localStatus = needRedownload ? LOCAL_STATUS_NEED_REDOWNLOAD : LOCAL_STATUS_DOWNLOADED;
    //
    const sql = `update wiz_note set title=?, category=?, name=?, seo=?,
      url=?,
      tags=?, owner=?, type=?, file_type=?, 
      created=?, modified=?, encrypted=?, attachment_count=?,
      data_md5=?, version=?, local_status=?, abstract=?,
      starred=?, archived=?, on_top=?, trash=?
      where guid=?`;
    const values = [note.title, note.category, note.name, note.seo,
      note.url,
      note.tags, note.owner, note.type, note.fileType,
      note.created, note.modified, note.encrypted, note.attachmentCount,
      note.dataMd5, note.version, localStatus, note.abstract,
      note.starred, note.archived, note.onTop, note.trash,
      note.guid];
    //
    await this._sqlite.run(sql, values);
    return true;
  }

  async syncNoteData(noteGuid, html) {
    const kbGuid = await this.getKbGuid();
    await noteData.writeNoteHtml(this._userGuid, kbGuid, noteGuid, html);
    await this.setNoteLocalStatus(noteGuid, LOCAL_STATUS_DOWNLOADED);
    const markdown = noteData.getMarkdownFromHtml(html);
    const text = removeMd(markdown);
    await this.setNoteText(noteGuid, text);
  }

  async downloadNoteMarkdown(noteGuid) {
    if (this._downloadNoteHandler) {
      const kbGuid = await this.getKbGuid();
      const result = await this._downloadNoteHandler(this, noteGuid);
      await noteData.writeNoteHtml(this._userGuid, kbGuid, noteGuid, result.html);
      await this.setNoteLocalStatus(noteGuid, LOCAL_STATUS_DOWNLOADED);
      const markdown = noteData.getMarkdownFromHtml(result.html);
      const text = removeMd(markdown);
      await this.setNoteText(noteGuid, text);
      return markdown;
    }
    //
    throw WizInternalError('no download note handler');
  }

  async getAllTagsName() {
    const sql = `select distinct tags from wiz_note where (trash is null or trash = 0)`;
    const rows = await this._sqlite.all(sql, []);
    const nameSet = new Set();
    rows.forEach((row) => {
      if (!row.tags) {
        return;
      }
      const tags = row.tags.split('|').map((tag) => trim(tag, '#/'));
      tags.forEach((tag) => nameSet.add(tag));
    });
    return Array.from(nameSet);
  }

  //
  async getAllTags() {
    //
    const allTags = await this.getAllTagsName();
    //
    const result = {};
    allTags.forEach((name) => {
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

  async getAllLinks() {
    const sql = `select note_title as title, note_guid as noteGuid from wiz_note_links`;
    const rows = await this._sqlite.all(sql, []);
    return rows;
  }

  async getNoteTags(noteGuid) {
    const note = await this.getNote(noteGuid);
    if (!note) {
      throw new WizNotExistsError(`note ${noteGuid} does not exists`);
    }
    const tagsValue = note.tags || '';
    if (!tagsValue) {
      return [];
    }
    const tags = tagsValue.split('|');
    return tags.map((tag) => trim(tag, '#/'));
  }

  async getNoteLinks(noteGuid) {
    const sql = `select note_title as title from wiz_note_links where note_guid=?`;
    const values = [noteGuid];
    const rows = await this._sqlite.all(sql, values);
    return rows.map((row) => row.title).sort();
  }

  getNoteTagsFromMarkdown(markdown) {
    const tags = noteData.extractTagsFromMarkdown(markdown).sort();
    const tagsValue = tags.map((tag) => `#${tag}/`).join('|');
    return tagsValue;
  }

  async updateNoteTags(noteGuid, markdown) {
    //
    const tags = noteData.extractTagsFromMarkdown(markdown).sort();
    const oldTags = await this.getNoteTags(noteGuid);

    if (isEqual(tags, oldTags)) {
      return;
    }
    //
    const tagsValue = tags.map((tag) => `#${tag}/`).join('|');
    const sql = `update wiz_note set tags=? where guid=?`;
    const values = [tagsValue, noteGuid];
    await this._sqlite.run(sql, values);
    //
    this.emit('tagsChanged', noteGuid);
  }


  async updateNoteLinks(noteGuid, markdown) {
    //
    const links = noteData.extractLinksFromMarkdown(markdown).sort();
    const oldLinks = await this.getNoteLinks(noteGuid);

    if (isEqual(links, oldLinks)) {
      return;
    }
    //
    const deleteSql = `delete from wiz_note_links where note_guid=?`;
    const deleteValues = [noteGuid];
    await this._sqlite.run(deleteSql, deleteValues);
    //
    const insertSql = `insert into wiz_note_links (note_guid, note_title) values(?, ?)`;
    for (const title of links) {
      const insertValues = [noteGuid, title];
      await this._sqlite.run(insertSql, insertValues);
    }
    //
    this.emit('linksChanged', noteGuid);
  }

  //
  async renameTag(from, to) {
    //
    const notes = await this.getNotesGuidByTag(from);
    const options = {
      noModifyTime: true,
      noUpdateTags: true,
    };
    //
    let renamed = false;
    //
    for (const note of notes) {
      //
      const markdown = await this.getNoteMarkdown(note.guid);
      // TODO: #from/ or #from_(space) or #from\n(回车)
      const reg = new RegExp(`#${from}`, 'ig');
      const modifiedMarkdown = markdown.replace(reg, `#${to}`);
      if (markdown !== modifiedMarkdown) {
        await this.setNoteMarkdown(note.guid, modifiedMarkdown, options);
        renamed = true;
      }
    }
    //
    const tags = await this.getAllTagsName();
    for (const name of tags) {
      // TODO: 判断是否是标签开始
      if (name.startsWith(from)) {
        // const replaceTo = to + name.substr(from.length);
        // const sql = `update wiz_note_tags set tag_name=? where tag_name=?`;
        // const values = [replaceTo, name];
        // await this._sqlite.run(sql, values);
        // renamed = true;
      }
    }
    //
    if (!renamed) {
      return;
    }
    //
    this.emit('tagRenamed', {
      from,
      to,
    });
  }

  //
  async setNoteMarkdown(noteGuid, markdown, options = {}) {
    const note = await this.getNote(noteGuid);
    note.version = VERSION_DATA_CHANGED;
    note.localStatus = LOCAL_STATUS_DOWNLOADED;
    note.text = removeMd(markdown);
    const kbGuid = await this.getKbGuid();
    await noteData.writeNoteMarkdown(this._userGuid, kbGuid, noteGuid, markdown);
    note.dataMd5 = md5(markdown);
    if (options.noModifyTime) {
      // do nothing, using old time
    } else {
      note.modified = new Date();
    }
    //
    const { title, abstract } = noteData.extractNoteTitleAndAbstractFromText(note.text);
    note.title = title;
    note.abstract = abstract;
    //
    const sql = `update wiz_note set title=?, version=?, local_status=?, data_md5=?, modified=?, abstract=?, text=? where guid=?`;
    const values = [note.title, note.version, note.localStatus, note.dataMd5,
      note.modified, note.abstract, note.text, noteGuid];
    await this._sqlite.run(sql, values);
    note.markdown = markdown;
    //
    this.emit('modifyNote', note);
    //
    if (options.noUpdateTags) {
      // do nothing
    } else {
      await this.updateNoteTags(noteGuid, markdown);
      await this.updateNoteLinks(noteGuid, markdown);
    }
    //
    return note;
  }

  async getNoteMarkdown(noteGuid) {
    const note = await this.getNote(noteGuid);
    const kbGuid = await this.getKbGuid();
    if (note.localStatus === LOCAL_STATUS_NEED_REDOWNLOAD
      || !noteData.noteDataExists(this._userGuid, kbGuid, noteGuid)) {
      const markdown = await this.downloadNoteMarkdown(noteGuid);
      return markdown;
    }
    //
    const markdown = await noteData.readNoteMarkdown(this._userGuid, kbGuid, noteGuid);
    return markdown;
  }

  //
  async createNote(orgNote = {}) {
    let note = {};
    note = Object.assign(note, orgNote);
    if (!note.guid) {
      note.guid = uuidv4();
    }
    note.type = note.type ?? 'lite/markdown';
    note.category = '/Lite/';

    const now = new Date();
    note.created = now;
    note.modified = now;
    //
    const kbGuid = await this.getKbGuid();
    //
    if (note.type === 'lite/markdown') {
      if (note.markdown) {
        await noteData.writeNoteMarkdown(this._userGuid, kbGuid, note.guid, note.markdown);
      } else if (note.html) {
        await noteData.writeNoteHtml(this._userGuid, kbGuid, note.guid, note.html);
        note.markdown = noteData.getMarkdownFromHtml(note.html);
      } else {
        note.markdown = await noteData.getMarkdownNoteTemplate();
        await noteData.writeNoteMarkdown(this._userGuid, kbGuid, note.guid, note.markdown);
      }
      //
      if (note.tag) {
        note.markdown += `\n#${note.tag}#\n`;
        note.tags = this.getNoteTagsFromMarkdown(note.markdown);
        await noteData.writeNoteMarkdown(this._userGuid, kbGuid, note.guid, note.markdown);
      }
      //
    } else {
      throw new WizInvalidParamError(`unknown note type: ${note.type}`);
    }
    //
    if (orgNote.images) {
      const resourcePath = paths.getNoteResources(this._userGuid, kbGuid, note.guid);
      for (const image of orgNote.images) {
        const imageName = path.basename(image);
        const newImagePath = path.join(resourcePath, imageName);
        await fs.copyFile(image, newImagePath);
      }
    }
    //
    note.text = removeMd(note.markdown);
    note.dataMd5 = md5(note.markdown);
    note.dataModified = now;
    note.attachmentCount = 0;
    note.fileType = note.fileType ?? '';
    note.name = note.name ?? '';
    note.seo = note.seo ?? '';
    note.url = note.url ?? '';
    note.encrypted = 0;
    note.version = VERSION_DATA_CHANGED;
    note.localStatus = LOCAL_STATUS_DOWNLOADED;
    //
    if (!note.title || !note.abstract) {
      const { title, abstract } = noteData.extractNoteTitleAndAbstractFromText(note.text);
      if (!note.title) {
        note.title = title;
      }
      if (!note.abstract) {
        note.abstract = abstract;
      }
    }
    //
    const sql = `insert into wiz_note(guid, title, category, 
      name, seo, url,
      tags, owner, type, file_type, 
      created, modified, encrypted, attachment_count,
      data_md5, version, local_status, abstract, text,
      starred, archived, on_top, trash
      ) 
      values (?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )`;
    //
    const {
      guid, title, category,
      name, seo, url,
      tags, owner, type, fileType,
      created, modified, encrypted, attachmentCount,
      dataMd5, version, localStatus, abstract, text,
      starred, archived, onTop, trash,
    } = note;
    //
    const values = [guid, title, category,
      name, seo, url,
      tags, owner, type, fileType,
      created, modified, encrypted, attachmentCount,
      dataMd5, version, localStatus, abstract, text,
      starred, archived, onTop, trash];
    //
    await this._sqlite.run(sql, values);
    await this.updateNoteTags(note.guid, note.markdown);
    //
    this.emit('newNote', note, this);
    //
    return note;
  }

  async getNotesGuidBySearchText(key) {
    const sql = `select guid, title, text from fts_note where fts_note match(?) ORDER BY bm25(fts_note, 1.0, 100.0, 1.0)`;
    const values = [key];
    const guidRows = await this._sqlite.all(sql, values);
    const guids = guidRows.map((row) => row.guid);
    return { guids, rows: guidRows };
  }

  async setNoteStarred(noteGuid, starred) {
    const note = await this.getNote(noteGuid);
    if (!note) {
      return;
    }
    //
    let version = note.version;
    if (version !== VERSION_DATA_CHANGED) {
      version = VERSION_INFO_CHANGED;
    }
    const starredValue = starred ? 1 : 0;
    const sql = `update wiz_note set starred=?, version=? where guid=?`;
    const values = [starredValue, version, noteGuid];
    await this._sqlite.run(sql, values);
    note.starred = starred;
    this.emit('modifyNote', note);
    //
  }

  async hasNotesInTrash() {
    const sql = `select * from wiz_note where trash=1 limit 1`;
    const rows = await this._sqlite.all(sql);
    return rows.length > 0;
  }

  async createGuideNote() {
    const { markdown, images } = await noteData.getGuideNoteData();
    const note = await this.createNote({
      markdown,
      images,
    });
    return note;
  }
}

module.exports = WizDb;
