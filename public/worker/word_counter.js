/* eslint-disable keyword-spacing */
/* eslint-disable max-len */
/* eslint-disable nonblock-statement-body-position */
/* eslint-disable prefer-template */
/* eslint-disable no-useless-escape */
/* eslint-disable curly */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
const removeMd = (md, options) => {
  options = options || {};
  options.listUnicodeChar = options.hasOwnProperty('listUnicodeChar') ? options.listUnicodeChar : false;
  options.stripListLeaders = options.hasOwnProperty('stripListLeaders') ? options.stripListLeaders : true;
  options.gfm = options.hasOwnProperty('gfm') ? options.gfm : true;
  options.useImgAltText = options.hasOwnProperty('useImgAltText') ? options.useImgAltText : true;

  var output = md || '';

  // Remove horizontal rules (stripListHeaders conflict with this rule, which is why it has been moved to the top)
  output = output.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, '');

  try {
    if (options.stripListLeaders) {
      if (options.listUnicodeChar)
        output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, options.listUnicodeChar + ' $1');
      else
        output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, '$1');
    }
    if (options.gfm) {
      output = output
        // Header
        .replace(/\n={2,}/g, '\n')
        // Fenced codeblocks
        .replace(/~{3}.*\n/g, '')
        // Strikethrough
        .replace(/~~/g, '')
        // Fenced codeblocks
        .replace(/`{3}.*\n/g, '');
    }
    output = output
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove setext-style headers
      .replace(/^[=\-]{2,}\s*$/g, '')
      // Remove footnotes?
      .replace(/\[\^.+?\](\: .*?$)?/g, '')
      .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
      // Remove images
      .replace(/\!\[(.*?)\][\[\(].*?[\]\)]/g, options.useImgAltText ? '$1' : '')
      // Remove inline links
      .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
      // Remove blockquotes
      .replace(/^\s{0,3}>\s?/g, '')
      // Remove reference-style links?
      .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
      // Remove atx-style headers
      .replace(/^(\n)?\s{0,}#{1,6}\s+| {0,}(\n)?\s{0,}#{0,} {0,}(\n)?\s{0,}$/gm, '$1$2$3')
      // Remove emphasis (repeat the line to remove double emphasis)
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, '$2')
      // Remove code blocks
      .replace(/(`{3,})(.*?)\1/gm, '$2')
      // Remove inline code
      .replace(/`(.+?)`/g, '$1')
      // Replace two or more newlines with exactly two? Not entirely sure this belongs here...
      .replace(/\n{2,}/g, '\n\n');
  } catch(e) {
    console.error(e);
    return md;
  }
  return output;
};

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

function isAlpha(char) {
  const AlphaRange = [
    [0x0030, 0x0039], [0x0041, 0x005A], [0x0061, 0x007A],
    [0x00C0, 0x00D6], [0x00D8, 0x00F6], [0x00F8, 0x100],
  ];
  return checkChar(char, AlphaRange);
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
    const ch = str.charCodeAt(i);
    alpha = false;
    if (isCJK(ch)) {
      // cjk
      count.nAsianChars++;
    } else if (isSpace(ch)) {
      // 空格
      count.nChars--;
    } else if (isAlpha(ch)) {
      // 字母
      alpha = true;
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
  count.nPunctuations = count.nCharsWithSpace - count.nAsianChars - count.nNonAsianChars;
  count.nWordsWithPunctuation = count.nWords + count.nPunctuations;
  return count;
}

onmessage = (event) => {
  try {
    console.log('onmessage');
    const result = wordCounter(JSON.parse(event.data));
    postMessage(JSON.stringify(result));
  } catch (err) {
    console.log(event.data);
    postMessage(JSON.stringify({
      error: {
        code: err.code,
        message: err.message,
        stack: err.stack,
      },
    }));
  }
};
