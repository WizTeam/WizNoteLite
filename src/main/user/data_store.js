const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AwaitLock = require('../common/await_lock');
const WizDb = require('../db/wiz_db');
const paths = require('../common/paths');

class DataStoreMap {
  //
  constructor() {
    this._map = new Map();
    this._locker = new AwaitLock();
  }

  async openDb(userGuid, kbGuid, isPersonalKb) {
    //
    assert(!this._map.get(kbGuid), `DataStore has opened for ${userGuid}/${kbGuid}`);
    //
    await this._locker.acquireAsync();
    try {
      let db = this._map.get(kbGuid);
      if (!db) {
        db = new WizDb(userGuid, kbGuid, isPersonalKb);
        await db.open();
        this._map.set(kbGuid, db);
      }
      return db;
    } finally {
      this._locker.release();
    }
  }

  //
  getDb(kbGuid) {
    const db = this._map.get(kbGuid);
    assert(db, `db has not opened: ${kbGuid}`);
    return db;
  }

  async closeDb(kbGuid) {
    const db = this._map.get(kbGuid);
    assert(db, `db has not opened: ${kbGuid}`);
    await db.close();
    this._map.delete(kbGuid);
  }
}

const dbMap = new DataStoreMap();

async function openPersonalDb(userGuid, kbGuid) {
  const db = await dbMap.openDb(userGuid, kbGuid, true);
  return db;
}


function getDb(kbGuid) {
  const db = dbMap.getDb(kbGuid);
  return db;
}

async function closeDb(kbGuid) {
  await dbMap.closeDb(kbGuid);
}

//
async function getUsers() {
  //
  const isGuid = (test) => {
    if (!test) {
      return false;
    }
    if (test.length !== 36) {
      return false;
    }
    if (test[8] !== '-' || test[13] !== '-' || test[18] !== '-' || test[23] !== '-') {
      return false;
    }
    const a = 'a'.charCodeAt(0);
    const z = 'z'.charCodeAt(0);
    const _0 = '0'.charCodeAt(0);
    const _9 = '9'.charCodeAt(0);
    for (const ch of test) {
      const code = ch.charCodeAt(0);
      if (ch === '-' || (code >= a && code <= z) || (code >= _0 && code <= _9)) {
        //
      } else {
        return false;
      }
    }
    return true;
  };
  //
  const users = [];
  const userDataPath = paths.getUsersData();
  const subPaths = await fs.readdir(userDataPath);
  for (const userGuid of subPaths) {
    if (!isGuid(userGuid)) {
      continue;
    }
    //
    if (!fs.pathExistsSync(path.join(userDataPath, userGuid, 'index.db'))) {
      continue;
    }
    //
    try {
      const db = new WizDb(userGuid, null, true);
      await db.open();
      try {
        const user = await db.getAccountInfo();
        if (!user) {
          continue;
        }
        user.userGuid = userGuid;
        users.push(user);
      } finally {
        await db.close();
      }
    } catch (err) {
      console.log(err);
    }
  }
  return users;
}

async function createDefaultAccount() {
  //
  const userGuid = uuidv4();
  const kbGuid = uuidv4();
  const db = new WizDb(userGuid, null, true);
  await db.open();
  //
  const now = new Date().valueOf();
  //
  const user = {
    isLocalUser: true,
    created: now,
    displayName: 'WizNote Lite',
    email: '',
    emailVerify: 'verified',
    kbGuid,
    kbServer: '',
    kbType: 'person',
    token: '',
    userGuid,
    userId: userGuid,
  };
  //
  await db.updateAccount('', '', '', user);
  //
  const guideNote = await db.createGuideNote();
  //
  return { user, guideNote };
  //
}

async function copyLocalAccount(localUser, toUser) {
  const fromPath = paths.getUserData(localUser.userGuid);
  const toPath = paths.getUserData(toUser.userGuid);
  //
  const fromIndexDb = path.join(fromPath, 'index.db');
  const toIndexDb = path.join(toPath, 'index.db');
  await fs.copyFile(fromIndexDb, toIndexDb);
  //
  const fromData = path.join(fromPath, localUser.kbGuid);
  if (fs.existsSync(fromData)) {
    const toData = path.join(toPath, toUser.kbGuid);
    await fs.copy(fromData, toData);
  }
}


module.exports = {
  openPersonalDb,
  getDb,
  closeDb,
  //
  getUsers,
  createDefaultAccount,
  copyLocalAccount,
};
