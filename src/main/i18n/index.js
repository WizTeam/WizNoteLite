const en = require('./en.json');
const cn = require('./zh-cn.json');
const tw = require('./zh-tw.json');

const resources = {
  en: {
    translation: en,
  },
  'zh-CN': {
    translation: cn,
  },
  'zh-TW': {
    translation: tw,
  },
};

module.exports = resources;
