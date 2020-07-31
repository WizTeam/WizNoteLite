const axios = require('axios');
const assert = require('assert');
const i18next = require('i18next');
// const URL = require('url');
const { app } = require('electron');

const { WizNetworkError, WizInternalError, WizKnownError } = require('../../share/error');


function getContentLengthFromHeaders(headers) {
  for (const key of Object.keys(headers)) {
    const lowerCaseKey = key.toLowerCase();
    if (lowerCaseKey === 'content-length') {
      return Number.parseInt(headers[key], 10);
    }
  }
  return -1;
}

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
    const version = app.getVersion();
    if (options.url.indexOf('clientType=') === -1) {
      if (options.url.indexOf('?') === -1) {
        options.url += `?clientType=lite&clientVersion=${version}`;
      } else {
        options.url += `&clientType=lite&clientVersion=${version}`;
      }
    }
  }
  //
  try {
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
    } else {
      const headerContentLength = getContentLengthFromHeaders(result.headers);
      if (headerContentLength !== -1) {
        if (data.length !== headerContentLength) {
          throw new WizNetworkError(`Failed to download data, invalid content length: ${data.length}, ${result.contentLength}`);
        }
      }
    }
    //
    if (opt.returnFullResult) {
      return data;
    }
    return data.result;
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      throw new WizNetworkError(i18next.t('errorConnect', {
        host: err.hostname,
      }));
    }
    if (err instanceof WizKnownError) {
      throw err;
    }
    throw new WizNetworkError(err.message);
  }
}


async function downloadToData(opt) {
  const options = opt;
  options.responseType = 'blob';
  const response = await axios(options);
  if (response.status !== 200) {
    throw new WizNetworkError(response.statusText);
  }
  //
  if (!response.data) {
    throw new WizInternalError('no data returned');
  }
  return response.data;
}

module.exports = {
  standardRequest,
  downloadToData,
};
