const axios = require('axios');
const assert = require('assert');
const i18next = require('i18next');
const URL = require('url');

const { WizNetworkError, WizInternalError, WizKnownError } = require('../../share/error');

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
    }
    //
    if (opt.returnFullResult) {
      return data;
    }
    return data.result;
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      //
      // 尝试解决苹果审核无法解析as.wiz.cn域名的问题
      if (err.hostname === 'as.wiz.cn') {
        const url = URL.parse(options.url);
        options.headers = options.headers || {};
        options.headers.Host = url.hostname; // put original hostname in Host header
        url.hostname = '120.55.138.92';
        delete url.host; // clear hostname cache
        options.url = URL.format(url);
        //
        const ret = await standardRequest(options);
        return ret;
      }
      //
      //
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

module.exports = {
  standardRequest,
};
