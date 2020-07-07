const AwaitLocker = require('./await_lock');

class Lockers {
  constructor() {
    this._map = new Map();
  }

  getLocker(key) {
    let locker = this._map.get(key);
    if (!locker) {
      locker = new AwaitLocker();
      this._map.set(key, locker);
    }
    return locker;
  }

  async lock(key, timeout) {
    const locker = this.getLocker(key);
    await locker.acquireAsync(timeout);
  }

  release(key) {
    const locker = this.getLocker(key);
    locker.release();
  }

  isLocking(key) {
    if (!this._map.has(key)) {
      return false;
    }
    const locker = this.getLocker(key);
    return locker.acquired();
  }
}

const lockers = new Lockers();

module.exports = lockers;
