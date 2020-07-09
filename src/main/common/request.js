const axios = require('axios');
const assert = require('assert');
const { WizNetworkError, WizInternalError, WizKnownError } = require('../../share/error');

// axios.defaults.adapter = require('axios/lib/adapters/http');
//
//
async function standardRequest(opt) {
  //
  const options = opt;
  assert(options);
  //
  const token = options.token;
  //
  if (token) {
    if (!options.headers) {
      options.headers = {
        'X-Wiz-Token': token,
      };
    } else {
      options.headers['X-Wiz-Token'] = token;
    }
  }
  //
  if (options.url) {
    if (options.url.indexOf('clientType=') === -1) {
      if (options.url.indexOf('?') === -1) {
        options.url += '?clientType=lite&clientVersion=1.0';
      } else {
        options.url += '&clientType=lite&clientVersion=1.0';
      }
    }
  }
  //
  const result = await axios(options);
  if (result.status !== 200) {
    throw new WizNetworkError(result.statusText);
  }
  //
  if (!result.data) {
    throw new WizInternalError('no data returned');
  }
  //
  const data = result.data;
  if (opt.responseType !== 'arraybuffer') {
    if (data.returnCode !== 200) {
      throw new WizKnownError(data.returnMessage, data.returnCode, data.externCode);
    }
  }
  //
  if (opt.returnFullResult) {
    return data;
  }
  return data.result;
}

module.exports = {
  standardRequest,
};
