const { protocol } = require('electron');
const fs = require('fs-extra');
const url = require('url');
const path = require('path');
const mime = require('mime');
const sdk = require('wiznote-sdk-js');

const lockers = sdk.core.lockers;
const paths = sdk.core.paths;


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
  const userData = sdk.getUserData(userGuid);
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
        await sdk.downloadNoteResource(userGuid, kbGuid, noteGuid, resName);
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
    protocol.registerStreamProtocol('wiz', (request, callback) => {
      //
      resourceProtocolHandler(request, callback);
      //
    });
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  registerWizProtocol,
};
