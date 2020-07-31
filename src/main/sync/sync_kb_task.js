const EventEmitter = require('events');
const KnowledgeServer = require('./knowledge_server');
const noteData = require('../db/note_data.js');
const lockers = require('../common/lockers');

const FLAGS_IN_TRASH = 'd';
const FLAGS_STARRED = 's';
const FLAGS_ARCHIVED = 'a';
const FLAGS_ON_TOP = 't';

class SyncKbTask extends EventEmitter {
  constructor(user, serverUrl, kbGuid, db, invalidTokenHandler, options = {}) {
    super();
    this._kbGuid = kbGuid;
    this._ks = new KnowledgeServer(user, kbGuid, serverUrl);
    this._db = db;
    this._user = user;
    this._isRunning = false;
    this._ks.setInvalidTokenHandler(invalidTokenHandler);
    this._options = options;
  }

  get kbGuid() {
    return this._kbGuid;
  }

  //
  async syncAll() {
    //
    try {
      this._isRunning = true;
      this.emit('start', this);
      //
      const uploadOnly = this._options.uploadOnly;
      const downloadFirst = this._options.downloadFirst;
      const downloadObjects = !uploadOnly;

      let downloadedCount = 0;
      let uploadedCount = 0;
      let failedNotes = [];
      //
      if (downloadFirst) {
        // first login, download remote data first
        downloadedCount = await this.downloadNotes();
        await this.uploadDeletedNotes();
        const uploadRet = await this.uploadNotes();
        failedNotes = uploadRet.failedNotes;
        uploadedCount = uploadRet.uploadedCount;
        //
      } else {
        //
        await this.uploadDeletedNotes();
        if (downloadObjects) {
          await this.downloadDeletedObjects();
        }
        //
        const uploadRet = await this.uploadNotes();
        failedNotes = uploadRet.failedNotes;
        uploadedCount = uploadRet.uploadedCount;
        if (downloadObjects) {
          downloadedCount = await this.downloadNotes();
        }
      }
      //
      if (downloadObjects) {
        // 不需要等待
        this.downloadNotesData();
      }
      //
      this._isRunning = false;
      this.emit('finish', this, {
        uploadedCount,
        downloadedCount,
        failedNotes,
      }, this._options);
    } catch (err) {
      this._isRunning = false;
      err.task = this;
      this.emit('error', this, err, this._options);
    }
  }

  async uploadNotes() {
    //
    const notes = await this._db.getModifiedNotes();
    //
    const failedNotes = [];
    for (const note of notes) {
      //
      let flags = '';
      if (note.trash) {
        flags += FLAGS_IN_TRASH;
      }
      if (note.starred) {
        flags += FLAGS_STARRED;
      }
      if (note.archived) {
        flags += FLAGS_ARCHIVED;
      }
      if (note.onTop) {
        flags += FLAGS_ON_TOP;
      }
      note.author = flags;
      note.keywords = note.tags;
      note.protected = note.encrypted ? 1 : 0;
      delete note.tags;
      //
      note.title = note.title?.trim();
      if (!note.title.endsWith('.md')) {
        note.title += '.md';
      }
      //
      if (note.version === -2) {
        // data modified
        const kbGuid = await this._db.getKbGuid();
        note.html = await noteData.readNoteHtml(this._user.userGuid, kbGuid, note.guid);
        note.resources = noteData.getResourcesFromHtml(note.html);
      }
      //
      try {
        const version = await this._ks.uploadNote(note);
        note.version = version;
        note.lastSynced = new Date().valueOf();
        const resultNote = await this._db.setNoteVersion(note.guid, version);
        this.emit('uploadNote', this, resultNote);
      } catch (err) {
        //
        if (err.code === 'WizErrorInvalidPassword'
        || err.externCode === 'WizErrorPayedPersonalExpired'
        || err.externCode === 'WizErrorFreePersonalExpired') {
          throw err;
        }
        //
        console.error(err);
        failedNotes.push(note.title);
      }
    }
    //
    const uploadedCount = notes.length - failedNotes.length;
    return {
      uploadedCount,
      failedNotes,
    };
  }

  async downloadNoteData(noteGuid) {
    const result = await this._ks.downloadNote(noteGuid);
    return result;
  }

  async uploadDeletedNotes() {
    const deletedNotes = await this._db.getDeletedNotes();
    if (deletedNotes.length === 0) {
      return;
    }
    //
    // deletedGuid, created, modified, type, content, ext, tag, docGuid
    const deletedObjects = deletedNotes.map((note) => ({
      deletedGuid: note.guid,
      type: 'document',
      created: note.deleted,
    }));
    //
    await this._ks.uploadDeletedObjects(deletedObjects);
    await this._db.permanentDeleteNotesByGuid(deletedNotes.map((note) => note.guid));
  }

  async downloadDeletedObjects() {
    const startVersion = await this._db.getObjectsVersion('deleted');

    await this._ks.downloadDeletedObjects(startVersion, async (objects, maxVersion) => {
      const noteGuids = [];
      for (const object of objects) {
        if (object.type === 'document') {
          const exists = await this._db.getNote(object.deletedGuid);
          if (exists) {
            exists.permanentDeleted = true;
            noteGuids.push(object.deletedGuid);
          }
        }
      }
      if (noteGuids.length > 0) {
        await this._db.permanentDeleteNotesByGuid(noteGuids);
      }
      //
      if (objects.length > 0) {
        await this._db.setObjectsVersion('deleted', maxVersion + 1);
      }
      //
    });
  }

  async downloadNotes() {
    const startVersion = await this._db.getObjectsVersion('note');
    //
    let noteCount = 0;
    await this._ks.downloadNotes(startVersion, async (notes, maxVersion) => {
      //
      // 避免用服务器的abstract（有延迟）覆盖本地的abstract
      const syncedNotes = [];
      for (const note of notes) {
        //
        note.guid = note.docGuid;
        note.abstract = note.abstractText;
        note.modified = note.dataModified;
        note.encrypted = note.protected ? 1 : 0;
        //
        note.tags = note.keywords;
        const flags = note.author;
        if (flags) {
          for (const flag of flags) {
            if (flag === FLAGS_IN_TRASH) {
              note.trash = true;
            } else if (flag === FLAGS_STARRED) {
              note.starred = true;
            } else if (flag === FLAGS_ARCHIVED) {
              note.archived = true;
            } else if (flag === FLAGS_ON_TOP) {
              note.onTop = true;
            }
          }
        }
        //
        note.title = note.title?.trim();
        if (note.title.endsWith('.md')) {
          note.title = note.title.substr(0, note.title.length - 3);
        }
        //
        const synced = await this._db.syncNote(note);
        if (synced) {
          syncedNotes.push(note);
        }
        noteCount++;
      }
      //
      if (notes.length > 0) {
        await this._db.setObjectsVersion('note', maxVersion + 1);
        this.emit('downloadNotes', this, syncedNotes);
        this._db.emit('tagsChanged');
      }
      //
    });
    //
    return noteCount;
  }

  async downloadNotesData() {
    const lockerKey = `${this._kbGuid}/download_notes_data`;
    try {
      await lockers.lock(lockerKey);
      for (;;) {
        const note = await this._db.getNextNeedToBeDownloadedNote();
        if (!note) {
          return;
        }
        //
        const result = await this.downloadNoteData(note.guid);
        await this._db.syncNoteData(note.guid, result.html);
      }
    } finally {
      lockers.release(lockerKey);
    }
  }

  async downloadNoteResource(noteGuid, resName) {
    const data = await this._ks.downloadNoteResource(noteGuid, resName);
    noteData.writeNoteResource(this._user.userGuid, this._kbGuid, noteGuid, resName, data);
  }
}


module.exports = SyncKbTask;
