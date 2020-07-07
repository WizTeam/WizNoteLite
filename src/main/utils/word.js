/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
const xRegExp = require('xregexp');

function checkChar(char, rangeList) {
  let i;
  let j;
  let start;
  let end;
  for ((i = 0), (j = rangeList.length); i < j; i++) {
    start = rangeList[i][0];
    end = rangeList[i].length > 1 ? rangeList[i][1] : null;
    if (end === null && char === start) {
      return true;
    } else if (end !== null && char >= start && char <= end) {
      return true;
    }
  }
  return false;
}

function isCJK(char) {
  // eslint-disable-next-line max-len
  const CJKRange = [[0x3040, 0x318f], [0x3300, 0x337f], [0x3400, 0x3d2d], [0x4e00, 0x9fff], [0xf900, 0xfaff], [0xac00, 0xd7af]];
  return checkChar(char, CJKRange);
}


function isSpace(char) {
  const SpaceRange = [[0x0009, 0x000d], [0x0020], [0x00a0]];
  return checkChar(char, SpaceRange);
}


function isAlpha(char) {
  // eslint-disable-next-line max-len
  const AlphaRange = [[0x0030, 0x0039], [0x0041, 0x005a], [0x0061, 0x007a], [0x00c0, 0x00d6], [0x00d8, 0x00f6], [0x00f8, 0x100]];
  return checkChar(char, AlphaRange);
}

function isNormalAlpha(char) {
  const charCode = char.charCodeAt(0);
  if ((charCode >= 48 && charCode <= 57) || charCode === 46) {
    // 0-9, .
    return true;
  }
  return xRegExp(`^\\pL+$`).test(char);
}

function isNonCjkAlpha(char) {
  const charCode = char.charCodeAt(0);
  if ((charCode >= 48 && charCode <= 57) || charCode === 46) {
    return true;
  }
  return isAlpha(char.charCodeAt(0));
}

function processCJKSearchKeywords(keywords) {
  if (!keywords) {
    return '';
  }
  if (keywords.length === 1 && isCJK(keywords.charCodeAt(0))) {
    return `${keywords}*`;
  }
  //
  let ret = '';
  let preIsCJK = false;
  let nextIsCJK = false;
  for (let i = 0; i < keywords.length; i++) {
    const curIsCJK = isCJK(keywords.charCodeAt(i));
    nextIsCJK = (i + 1 < keywords.length) && isCJK(keywords.charCodeAt(i + 1));
    if (!preIsCJK && curIsCJK && !nextIsCJK) {
      ret += `${keywords[i]}*`;
      continue;
    } else {
      ret += keywords[i];
    }
    //
    preIsCJK = curIsCJK;
  }
  //
  return ret;
}


function highlightTextEx(text, keywords, splitCjk = true, allowFromMiddle = false, options = {}) {
  //
  if (!text) {
    return null;
  }
  //
  //
  const charSpaceInQuot = '^';
  // 过滤无效字符
  const filterWords = (keywords) => {
    let processKeywords = '';
    let inQuot = false;
    for (let i = 0; i < keywords.length; i++) {
      //
      const ch = keywords.charAt(i);
      //
      const isAlpha = isNormalAlpha(ch.charAt(0));
      const isCjk = isCJK(ch.charCodeAt(0));
      if (isAlpha || isCjk || ch === '.') {
        processKeywords += ch;
      } else if (ch === '"') {
        inQuot = !inQuot;
        processKeywords += ch;
      } else if (ch === ' ') {
        if (inQuot) {
          processKeywords += charSpaceInQuot;
        } else {
          processKeywords += ch;
        }
      } else {
        processKeywords += ' ';
      }
    }
    return processKeywords;
  };
  //
  // 在cjk和英文字母之间添加空格
  const appSpaceBetweenAlphaAndCJK = (keywords) => {
    let processKeywords = '';
    for (let i = 0; i < keywords.length - 1; i++) {
      //
      const ch = keywords.charAt(i);
      //
      if (!isSpace(ch.charCodeAt(0))) {
        //
        const chNext = keywords.charAt(i + 1);
        //
        const check1 = isNonCjkAlpha(ch.charAt(0))
          && isCJK(chNext.charCodeAt(0));
        const check2 = isNonCjkAlpha(chNext.charAt(0))
          && isCJK(ch.charCodeAt(0));
        if (check1 || check2) {
          processKeywords += ch;
          processKeywords += ' ';
        } else {
          processKeywords += ch;
        }
      } else {
        processKeywords += ' ';
      }
      //
    }
    processKeywords += keywords.charAt(keywords.length - 1);
    //
    return processKeywords;
  };

  const processedKeywords = appSpaceBetweenAlphaAndCJK(filterWords(keywords));
  let wordsArr = processedKeywords.split(' ').filter((s) => !!s);
  wordsArr = wordsArr.map((word) => word.replace(/"/g, '').replace(/\^/g, ' '));
  wordsArr = Array.from(new Set(wordsArr)); // 过滤重复元素
  //
  let searchWords = [];
  for (const words of wordsArr) {
    if (splitCjk) {
      // 分割cjk
      if (words.length > 2 && isCJK(words.charCodeAt(0))) {
        for (let i = 0; i < words.length - 1; i++) {
          const sub = words.charAt(i) + words.charAt(i + 1);
          searchWords.push(sub);
        }
      }
    }
    //
    searchWords.push(words); // add full words
  }
  //
  searchWords = Array.from(new Set(searchWords));
  // 去掉单个字母（非单个汉字），去掉em，避免冲突，也可以进行优化
  searchWords = searchWords.filter((keyword) => (keyword.length > 1 && keyword !== 'em') || isCJK(keyword.charCodeAt(0)));
  if (searchWords.length === 0) {
    return [text.substr(0, 255)];
  }
  //
  // 开始匹配搜索内容
  let indexArr = [];
  const regText = searchWords.join('|').replace(/\./g, '\\.');
  const regEx = new RegExp(regText, 'ig');
  for (;;) {
    const items = regEx.exec(text);
    if (!items) {
      break;
    }
    //
    // eslint-disable-next-line no-loop-func
    items.forEach((item) => {
      //
      const isCjk = isCJK(item.charCodeAt(0));
      if (!isCjk) {
        if (items.index > 0 && !allowFromMiddle) {
          const prevChar = text.charCodeAt(items.index - 1);
          if (isAlpha(prevChar)) {
            return;
          }
        }
      }
      //
      indexArr.push({
        index: items.index,
        search: `${item}`,
        length: 10,
      });
    });
    //
    if (indexArr.length >= 10) {
      break;
    }
  }
  //
  if (indexArr.length === 0) {
    return null;
  }
  // 结果进行排序
  indexArr.sort((a, b) => a.index - b.index);
  //
  //
  // 根据搜索结果位置，提取上下文
  const extractText = (index) => {
    //
    if (options.full) {
      return {
        index,
        start: 0,
        end: text.length,
        context: text,
      };
    }
    //
    let start = index - 20;
    for (let i = 1; i < 20 && index - i >= 0; i++) {
      const ch = text.charAt(index - i);
      if (i < 10) {
        if (ch === '_' || ch === ' ' || isAlpha(ch.charCodeAt(0)) || isCJK(ch.charCodeAt(0)) || ch === '.') {
          //
        } else {
          start = index - i + 1;
          break;
        }
      } else if (isAlpha(ch.charCodeAt(0)) || ch === '.') {
        //
      } else {
        start = index - i + 1;
        break;
      }
    }
    //
    const isSentenceEnd = (text, index) => {
      const ch = text.charAt(index);
      if (ch === '\n' || ch === '\t') {
        return true;
      }
      if (ch === '：') {
        return false;
      }
      if (ch === ' ' && index > 0) {
        const chPrev = text.charAt(index - 1);
        if (chPrev === '.' || chPrev === ',' || chPrev === '?') {
          return true;
        }
        return false;
      }
      //
      if (isNormalAlpha(ch) || ch === '.') {
        return false;
      }
      //
      return true;
    };
    //
    let end = index + 100;
    for (let i = 1; i < 100 && i + index < text.length; i++) {
      // const ch = text.charAt(index + i);
      if (isSentenceEnd(text, index + i)) {
        end = index + i + 1;
        break;
      }
    }
    if (start < 0) {
      start = 0;
    }
    if (end > text.length) {
      end = text.length;
    }
    //
    return {
      index,
      start,
      end,
      context: text.substr(start, end - start).trim(),
    };
  };
  //
  //
  // 提取上下文，保存到数组中
  indexArr = indexArr.map((item) => Object.assign(item, extractText(item.index)));
  //
  // 合并临近的关键字
  for (let i = indexArr.length - 2; i >= 0; i--) {
    //
    const cur = indexArr[i];
    const next = indexArr[i + 1];
    if (cur.end >= next.start) {
      cur.end = next.end;
      cur.search += `|${next.search}`;
      cur.context = text.substr(cur.start, cur.end - cur.start);
      next.skip = true;
    }
  }
  // 去掉被合并的结果
  indexArr = indexArr.filter((item) => !item.skip);
  //
  // 搜索结果进行高亮
  for (const item of indexArr) {
    //
    // 进行最大匹配，不完美，可以优化
    let keywords = item.search.split('|').concat(searchWords);
    keywords = Array.from(new Set(keywords));
    keywords.sort((a, b) => 0 - a.localeCompare(b));
    //
    let highlightResult = '';
    for (let i = 0; i < item.context.length; i++) {
      //
      let match = false;
      for (const keyword of keywords) {
        //
        const isCjk = isCJK(keyword.charCodeAt(0));
        if (!isCjk) {
          if (i > 0) {
            const prevChar = item.context.charCodeAt(i - 1);
            if (!allowFromMiddle) {
              if (isAlpha(prevChar)) {
                continue;
              }
            }
          }
        }
        //
        if (item.context.substr(i).startsWith(keyword)) {
          highlightResult += `<em>${keyword}</em>`;
          i += keyword.length - 1;
          match = true;
          break;
        }
      }
      //
      if (!match) {
        highlightResult += item.context.substr(i, 1);
      }
    }
    //
    item.context = highlightResult;
  }
  //
  const result = indexArr.map((item) => item.context);
  //
  if (result.length === 0) {
    return null;
  }
  //
  return result;
}


function highlightText(text, keywords, options = {}) {
  //
  // replace AND OR NOT NEAR, these are syntax for full-text search
  keywords = keywords.replace(/\sAND\s/g, ' ');
  keywords = keywords.replace(/\sOR\s/g, ' ');
  keywords = keywords.replace(/\sNOT\s/g, ' ');
  keywords = keywords.replace(/\sNEAR\s/g, ' ');
  const { allowFromMiddle } = options || {};
  //
  let result = highlightTextEx(text, keywords, false, allowFromMiddle, options);
  if (result) {
    return result;
  }
  //
  result = highlightTextEx(text, keywords, true, allowFromMiddle, options);
  if (result) {
    return result;
  }
  //
  return [text.substr(0, 255)];
}

module.exports = {
  highlightText,
  processCJKSearchKeywords,
};
