const Store = require('electron-store');

class UserSettings {
  constructor(userGuid) {
    this._store = new Store({
      name: userGuid,
    });
  }

  setSettings(key, value) {
    if (value === undefined || value === null) {
      this._store.delete(key);
      return;
    }
    this._store.set(key, value);
  }

  getSettings(key, defaultValue) {
    const value = this._store.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    return value;
  }
}

module.exports = UserSettings;
