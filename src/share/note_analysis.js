// 规则: 在一行內，#在一个单词开头，表示标签开始。如果在行尾，找不到单词结尾+#，则表示标签以空格结束。
// Tag 不能太长，限定在 25 个字符以内
const REGEXP_TAG = /(^|[\t\f\v ])#(?!#|\s)(([^#\r\n]{0,25}[^#\s]#)|([^#\s]{0,25}$)|(\S{0,25}(\S|$)))/gm;

// 规则: [[xxxx]] 提取出xxxx
const REGEXP_LINK = /(?<!\[)\[\[[^[\]]*]](?!\])/g;

function clearCodeFromMarkdown(markdown) {
  const codeReg = /```[^`]*```/g;
  return markdown.replace(codeReg, '');
}
function clearCodeInLineFromMarkdown(markdown) {
  const codeReg = /`.*?`/g;
  return markdown.replace(codeReg, '\n');
}
function clearLinkFromMarkdown(markdown) {
  const linkReg = /\[[^[\]]*]\([^()\r\n]*\)/g;
  return markdown.replace(linkReg, '\n');
}

function extractTagsFromMarkdown(markdown) {
  // 规则: 在一行內，#在一个单词开头，表示标签开始。如果在行尾，找不到单词结尾+#，则表示标签以空格结束。
  // 如果找到单词+#结尾，则标签以单词结尾+#结束
  // #test1 #test2 xxxx, xxx, xxx => ['test1', 'test2']
  // #test test sss#, #test xxx -> ['test test sss', 'test']
  let str = markdown;
  str = clearCodeFromMarkdown(str);
  str = clearCodeInLineFromMarkdown(str);
  str = clearLinkFromMarkdown(str);
  const matches = str.match(REGEXP_TAG);
  if (!matches) {
    return [];
  }
  const matchSet = new Set();
  matches.forEach((s) => {
    const tag = s.replace(/#/g, '').trim().toLowerCase();
    if (tag) {
      matchSet.add(tag);
    }
  });
  const result = Array.from(matchSet);
  return result.sort();
}

function extractLinksFromMarkdown(markdown) {
  // 规则: [[xxxx]] 提取出xxxx
  const matches = clearCodeFromMarkdown(markdown).match(REGEXP_LINK);
  if (!matches) {
    return [];
  }
  const matchSet = new Set();
  matches.forEach((s) => {
    const link = s.replace(/\[|\]/g, '').trim();
    if (link) {
      matchSet.add(link);
    }
  });
  const result = Array.from(matchSet);
  return result.sort();
}

function getMarkdownFromHtml(html) {
  const from = html.indexOf('<pre>');
  const to = html.lastIndexOf('</pre>');
  if (from === -1 || to === -1 || from > to) {
    return '';
  }
  //
  const text = html.substr(from + 5, to - from - 5);
  const result = text.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  return result;
}

function parseIncludeResourcesForMarkdown(markdown) {
  const map = {};
  const result = [];

  if (!markdown) {
    return result;
  }
  const resourceReg = /!\[[^\]]*]\(index_files\/([^)]*)/gi;
  for (;;) {
    const file = resourceReg.exec(markdown);
    if (!file) {
      break;
    }
    const fileName = file[1];
    if (!map[fileName]) {
      map[fileName] = true;
      result.push({
        name: fileName,
      });
    }
  }
  return result;
}

function getResourcesFromHtml(html) {
  let markdown = getMarkdownFromHtml(html);
  markdown = clearCodeFromMarkdown(markdown);
  markdown = clearCodeInLineFromMarkdown(markdown);
  return parseIncludeResourcesForMarkdown(markdown);
}

module.exports = {
  REGEXP_TAG,
  extractTagsFromMarkdown,
  extractLinksFromMarkdown,
  getMarkdownFromHtml,
  getResourcesFromHtml,
};
