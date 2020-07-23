const assert = require('assert');

class WizKnownError extends Error {
  constructor(message, code, externCode) {
    super(message);
    assert(message);
    assert(code);
    this.message = message;
    this.code = code;
    if (externCode) {
      this.externCode = externCode;
    }
  }

  toResult() {
    return {
      returnCode: this.code,
      returnMessage: this.message,
      externCode: this.externCode,
      code: this.code,
    };
  }

  toJSON() {
    return this.toResult();
  }

  //
  log() {
    console.error(this);
  }

  //
  static noErrorResult(result = {}) {
    return {
      returnCode: 200,
      returnMessage: 'OK',
      result,
    };
  }
}

class WizInvalidTokenError extends WizKnownError {
  constructor(message = 'Invalid token') {
    super(message, 'WizErrorInvalidToken');
  }
}


class WizInvalidUserError extends WizKnownError {
  constructor(message = 'Invalid user') {
    super(message, 'WizErrorInvalidUser');
  }
}


class WizInvalidPasswordError extends WizKnownError {
  constructor(message = 'invalid password') {
    super(message, 'WizErrorInvalidPassword');
  }
}

class WizInvalidParamError extends WizKnownError {
  constructor(message) {
    super(message, 'WizErrorInvalidParam');
  }
}


class WizNetworkError extends WizKnownError {
  constructor(message) {
    super(message, 'WizErrorNetwork');
  }
}

class WizInternalError extends WizKnownError {
  constructor(message, externCode) {
    super(message, 'WizErrorInternal', externCode);
  }
}

class WizTimeoutError extends WizKnownError {
  //
  constructor(message) {
    super(message, 'WizErrorTimeout');
  }

  //
  log() {
    console.error(`${this.code} ${this.message}`);
  }
}

class WizNotExistsError extends WizKnownError {
  constructor(message) {
    super(message, 'WizNotExistsError');
  }
}

class WizServerError extends WizKnownError {
  constructor(message, externCode) {
    super(message, 'WizErrorServer', externCode);
  }
}

module.exports = {
  WizKnownError,
  WizInvalidTokenError,
  WizInvalidUserError,
  WizInvalidPasswordError,
  WizInvalidParamError,
  WizNetworkError,
  WizTimeoutError,
  WizInternalError,
  WizNotExistsError,
  WizServerError,
};
