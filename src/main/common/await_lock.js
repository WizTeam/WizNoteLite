const { WizTimeoutError } = require('../../share/error');

/**
 * A mutex lock for coordination across async functions
 */
class AwaitLock {
  constructor() {
    this._acquired = false;
    this._waitingResolvers = [];
  }

  /**
   * Acquires the lock, waiting if necessary for it to become free if it is already locked. The
   * returned promise is fulfilled once the lock is acquired.
   *
   * After acquiring the lock, you **must** call `release` when you are done with it.
   */
  acquireAsync(timeout) {
    if (!this._acquired) {
      this._acquired = true;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      //
      this._waitingResolvers.push(resolve);
      //
      if (timeout && timeout > 0) {
        //
        setTimeout(() => {
          //
          const index = this._waitingResolvers.indexOf(resolve);
          if (index === -1) {
            //
            // console.info(`has already got lock`);
            // has already get locker
          } else {
            //
            this._waitingResolvers.splice(index, 1);
            //
            const err = new WizTimeoutError(`lock timeout: ${timeout}, waiting resolves: ${this._waitingResolvers.length}`);
            reject(err);
            //
          }
          //
        }, timeout);
      }
      //
    });
  }

  /**
   * Acquires the lock if it is free and otherwise returns immediately without waiting. Returns
   * `true` if the lock was free and is now acquired, and `false` otherwise,
   */
  tryAcquire() {
    if (!this._acquired) {
      this._acquired = true;
      return true;
    }
    return false;
  }

  /**
   * Releases the lock and gives it to the next waiting acquirer, if there is one. Each acquirer
   * must release the lock exactly once.
   */
  release() {
    if (!this._acquired) {
      throw new Error(`Cannot release an unacquired lock`);
    }
    if (this._waitingResolvers.length > 0) {
      const resolve = this._waitingResolvers.shift();
      resolve();
    } else {
      this._acquired = false;
    }
  }

  acquired() {
    return this._acquired;
  }

  //
  //
  debug() {
    const count = this._waitingResolvers.length;
    console.log(`waiting resolves: ${count}`);
    return {
      waitingCount: count,
    };
  }
}

module.exports = AwaitLock;
