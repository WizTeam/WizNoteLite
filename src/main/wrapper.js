const crypto = require('crypto');
const assert = require('assert');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const Store = require('electron-store');
const electronApp = require('electron').app;

const sqlite3 = require('./sqlite3').verbose();

function getVersion() {
  return electronApp.getVersion();
}

function getPath(name) {
  if (name === 'appData') {
    return electronApp.getPath('appData');
  } else if (name === 'temp') {
    return os.tmpdir();
  } else if (name === 'res') {
    return path.join(__dirname, './resources');
  }
  //
  assert(false, `unknown path name: ${name}`);
  return null;
}

function getLocale() {
  return electronApp.getLocale();
}

const app = {
  getVersion,
  getPath,
  getLocale,
  name: 'WizNote Lite',
};


const aesAlgorithmCBC = 'aes-256-cbc';

const IV_LENGTH = 16;

function passwordToKey(password) {
  const key = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);
  return key;
}

function encryptText(text, password) {
  if (!text) {
    return '';
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(aesAlgorithmCBC, passwordToKey(password), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const ivData = iv.toString('hex');
  const resultData = encrypted.toString('hex');
  return `${ivData}:${resultData}`;
}

function decryptText(text, password) {
  if (!text) {
    return '';
  }
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(aesAlgorithmCBC, passwordToKey(password), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const enc = {
  aes: {
    encryptText,
    decryptText,
  },
};

const wizWrapper = {
  fs,
  app,
  sqlite3,
  Store,
  enc,
};

global.wizWrapper = wizWrapper;
