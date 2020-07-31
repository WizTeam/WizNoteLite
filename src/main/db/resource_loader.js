const { protocol } = require('electron');
const fs = require('fs-extra');
const url = require('url');
const path = require('path');
const mime = require('mime');
const paths = require('../common/paths');
const users = require('../user/users');
const lockers = require('../common/lockers');

async function resourceProtocolHandler(request, callback) {
  //
  const u = url.parse(request.url);
  let p = u.path;
  while (p.startsWith('/')) {
    p = p.substr(1);
  }
  const parts = p.split('/');
  if (parts.length !== 3) {
    return callback(Error('invalid url, parts !== 4'));
  }
  //
  const userGuid = u.host;
  //
  const userData = users.getUserData(userGuid);
  if (!userData) {
    return callback(Error('invalid url, user has not logged in'));
  }
  //
  const [kbGuid, noteGuid, resName] = parts;
  const key = `${userGuid}/${kbGuid}/${noteGuid}/${resName}`;
  try {
    await lockers.lock(key);
    const resourceBasePath = paths.getNoteResources(userGuid, kbGuid, noteGuid);
    const resourcePath = path.join(resourceBasePath, resName);
    if (!await fs.exists(resourcePath)) {
      try {
        await users.downloadNoteResource(userGuid, kbGuid, noteGuid, resName);
      } catch (err) {
        console.error(err);
        return callback(err);
      }
    }
    //
    return callback({
      statusCode: 200,
      headers: {
        'content-type': mime.getType(resName),
      },
      data: fs.createReadStream(resourcePath),
    });
  } finally {
    lockers.release(key);
  }
}

function registerWizProtocol() {
  try {
    protocol.registerStreamProtocol('wiz', async (request, callback) => {
      //
      const result = await resourceProtocolHandler(request, callback);
      return result;
      //
    });
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  registerWizProtocol,
};
