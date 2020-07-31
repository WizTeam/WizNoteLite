const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const ServerBase = require('./server_base');
const paths = require('../common/paths');
const { WizNotExistsError } = require('../../share/error');

class KnowledgeServer extends ServerBase {
  constructor(user, kbGuid, serverUrl) {
    super();
    this._kbGuid = kbGuid;
    this._serverUrl = serverUrl;
    this._user = user;
  }

  //
  static _getMaxVersion(objects, start) {
    let max = start;
    objects.forEach((element) => {
      max = Math.max(start, element.version);
    });
    return max;
  }

  //
  async uploadNote(note) {
    //
    const kbGuid = this._kbGuid;
    const resourcePath = paths.getNoteResources(this._user.userGuid, kbGuid, note.guid);
    //
    const uploadNoteResource = async (key, resName, isLast) => {
      //
      const resPath = path.join(resourcePath, resName);
      if (!fs.existsSync(resPath)) {
        throw new WizNotExistsError(`resource ${resName} does not exists`);
      }
      //
      const formData = new FormData();
      formData.append('kbGuid', kbGuid);
      formData.append('docGuid', note.guid);
      formData.append('key', key);
      formData.append('objType', 'resource');
      formData.append('objId', resName);
      formData.append('isLast', isLast ? 1 : 0);
      formData.append('data', fs.createReadStream(resPath), {
        filename: resName,
      });
      //
      const headers = {
        ...formData.getHeaders(),
      };
      const result = await this.request({
        token: this._user.token,
        method: 'post',
        url: `${this._serverUrl}/ks/object/upload/${this._kbGuid}/${note.guid}?`,
        headers,
        data: formData,
        returnFullResult: true,
      });
      //
      return result;
    };
    //
    //
    const data = JSON.parse(JSON.stringify(note));
    data.docGuid = note.guid;
    data.kbGuid = this._kbGuid;
    data.infoModified = data.created;
    data.dataModified = data.modified;
    //
    const result = await this.request({
      token: this._user.token,
      method: 'post',
      url: `${this._serverUrl}/ks/note/upload/${this._kbGuid}/${note.guid}`,
      data,
      returnFullResult: true,
    });
    //
    const resources = result.resources;
    if (resources && resources.length > 0) {
      for (let i = 0; i < resources.length; i++) {
        const isLast = i === resources.length - 1;
        const resName = resources[i];
        const ret = await uploadNoteResource(result.key, resName, isLast);
        if (isLast) {
          return ret.version;
        }
      }
    }
    //
    return result.version;
  }

  async downloadNoteResource(noteGuid, resName) {
    const data = await this.request({
      token: this._user.token,
      method: 'get',
      url: `${this._serverUrl}/ks/object/download/${this._kbGuid}/${noteGuid}?objType=resource&objId=${resName}`,
      responseType: 'arraybuffer',
      returnFullResult: true,
    });
    return data;
  }

  async downloadNote(noteGuid) {
    const result = await this.request({
      token: this._user.token,
      method: 'get',
      url: `${this._serverUrl}/ks/note/download/${this._kbGuid}/${noteGuid}?downloadData=1`,
      returnFullResult: true,
    });
    return result;
  }

  //
  async downloadNotes(startVersion, callback) {
    //
    let start = startVersion;
    const count = 100;
    //
    for (;;) {
      const notes = await this.request({
        token: this._user.token,
        method: 'get',
        url: `${this._serverUrl}/ks/note/list/version/${this._kbGuid}?version=${start}&count=${count}&type=lite&withAbstract=true`,
      });
      //
      const maxVersion = KnowledgeServer._getMaxVersion(notes, start);
      await callback(notes, maxVersion);
      //
      if (notes.length < count) {
        break;
      }
      //
      start = maxVersion;
    }
  }

  async downloadDeletedObjects(startVersion, callback) {
    //
    let start = startVersion;
    const count = 100;
    //
    for (;;) {
      const objects = await this.request({
        token: this._user.token,
        method: 'get',
        url: `${this._serverUrl}/ks/deleted/list/version/${this._kbGuid}?version=${start}&count=${count}`,
      });
      //
      const maxVersion = KnowledgeServer._getMaxVersion(objects, start);
      await callback(objects, maxVersion);
      //
      if (objects.length < count) {
        break;
      }
      //
      start = maxVersion;
    }
  }

  //
  async uploadDeletedObjects(objects) {
    //
    const result = await this.request({
      token: this._user.token,
      method: 'post',
      url: `${this._serverUrl}/ks/deleted/upload/${this._kbGuid}`,
      data: objects,
      returnFullResult: true,
    });
    //
    return result.version;
  }
}

module.exports = KnowledgeServer;
