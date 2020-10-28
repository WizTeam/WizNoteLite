const removeMd = require('remove-markdown');
const XRegExp = require('xregexp');

function checkChar(char, rangeList) {
  for (let i = 0; i < rangeList.length; i++) {
    const start = rangeList[i][0];
    const end = rangeList[i].length > 1 ? rangeList[i][1] : null;
    if (end === null && char === start) {
      return true;
    } else if (end !== null && char >= start && char <= end) {
      return true;
    }
  }
  return false;
}

function isSpace(char) {
  const SpaceRange = [
    [0x0009, 0x000D], [0x0020], [0x00A0],
  ];
  return checkChar(char, SpaceRange);
}

const letterTest = XRegExp('\\pL');
const numberTest = XRegExp('\\pN');
const punctuationTest = XRegExp('\\pP');

function isAlpha(char) {
  return letterTest.test(char) || numberTest.test(char);
}

function isPunctuation(char) {
  return punctuationTest.test(char);
}

function isCJK(char) {
  const CJKRange = [
    [0x3040, 0x318f], [0x3300, 0x337f], [0x3400, 0x3d2d],
    [0x4e00, 0x9fff], [0xf900, 0xfaff], [0xac00, 0xd7af],
  ];
  return checkChar(char, CJKRange);
}

function wordCounter(dataObject) {
  const { text, markdown, ...others } = dataObject;
  const count = {
    ...others,
    nWords: 0,
    nWordsWithPunctuation: 0,
    nChars: 0,
    nCharsWithSpace: 0,
    nNonAsianWords: 0,
    nNonAsianChars: 0,
    nAsianChars: 0,
    nPunctuations: 0,
  };

  //
  const str = text || (markdown && removeMd(markdown));
  if (!str) {
    return count;
  }

  let alpha = false;
  let isInWords = false;
  let wordsLength = 0;
  count.nCharsWithSpace = str.length; // 字符串长度
  count.nChars = count.nCharsWithSpace;
  const length = str.length;
  for (let i = 0; i < length; i++) {
    const ch = str[i];
    const code = ch.charCodeAt(0);
    alpha = false;
    if (isCJK(code)) {
      // cjk
      count.nAsianChars++;
    } else if (isSpace(code)) {
      // 空格
      count.nChars--;
    } else if (isAlpha(ch)) {
      // 字母
      alpha = true;
    } else if (isPunctuation(ch)) {
      count.nPunctuations++;
    }
    // console.log(ch);
    // console.log('isAlpha: ' + isAlpha + ', isInWords: ' + isInWords );

    if (alpha && !isInWords) {
      wordsLength = 1;
      isInWords = true;
    } else if (alpha && isInWords) {
      wordsLength++;
    } else if (!alpha) {
      if (isInWords) {
        count.nNonAsianWords++;
        count.nNonAsianChars += wordsLength;
        wordsLength = 0;
      }
      isInWords = false;
    }
  }
  // 修正最后一个单词
  if (isAlpha && isInWords) {
    count.nNonAsianWords++;
  }
  count.nWords = count.nNonAsianWords + count.nAsianChars;
  // count.nPunctuations = count.nCharsWithSpace - count.nAsianChars - count.nNonAsianChars;
  count.nWordsWithPunctuation = count.nWords + count.nPunctuations;
  return count;
}

onmessage = (event) => {
  try {
    const result = wordCounter(JSON.parse(event.data));
    postMessage(JSON.stringify(result));
  } catch (err) {
    postMessage(JSON.stringify({
      error: {
        code: err.code,
        message: err.message,
        stack: err.stack,
      },
    }));
  }
};
