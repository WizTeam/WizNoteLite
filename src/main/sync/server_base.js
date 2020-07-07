const WizRequest = require('../common/request');

class ServerBase {
  constructor() {
    this._invalidTokenHandler = null;
  }

  setInvalidTokenHandler(handler) {
    this._invalidTokenHandler = handler;
  }

  async refreshToken() {
    if (this._invalidTokenHandler) {
      const token = await this._invalidTokenHandler();
      return token;
    }
    return null;
  }

  async request(options) {
    try {
      const ret = await WizRequest.standardRequest(options);
      return ret;
    } catch (err) {
      if (err.code !== 301) {
        throw err;
        // invalid token
      }
      if (options.noRetry) {
        throw err;
      }
      const token = await this.refreshToken();
      if (!token) {
        throw err;
      }
      //
      const newOptions = Object.assign(options, { token });
      const ret = await WizRequest.standardRequest(newOptions);
      return ret;
    }
  }
}

module.exports = ServerBase;
