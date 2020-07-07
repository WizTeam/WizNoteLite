const path = require('path');
const fs = require('fs-extra');
// const xRegExp = require('xregexp');
const getDefaultNoteHtml = require('./default_note_html');
const paths = require('../common/paths');
const {
  extractLinksFromMarkdown,
  extractTagsFromMarkdown,
  getMarkdownFromHtml,
  getResourcesFromHtml,
} = require('../../share/note_analysis');
const { getCurrentLang } = require('../i18n');

async function markdownToHtml(markdown) {
  const text = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = await getDefaultNoteHtml();
  return html.replace('<!--wiznote-lite-markdown-->', text);
}

function getNoteHtmlPath(userGuid, kbGuid, noteGuid) {
  return path.join(paths.getNoteData(userGuid, kbGuid, noteGuid), 'index.html');
}

async function writeNoteHtml(userGuid, kbGuid, noteGuid, html) {
  //
  const p = getNoteHtmlPath(userGuid, kbGuid, noteGuid);
  await fs.writeFile(p, html);
}

async function writeNoteMarkdown(userGuid, kbGuid, noteGuid, markdown) {
  const html = await markdownToHtml(markdown);
  await writeNoteHtml(userGuid, kbGuid, noteGuid, html);
}

async function readNoteMarkdown(userGuid, kbGuid, noteGuid) {
  const p = getNoteHtmlPath(userGuid, kbGuid, noteGuid);
  const data = await fs.readFile(p);
  const html = data.toString('utf8');
  return getMarkdownFromHtml(html);
}

async function readNoteHtml(userGuid, kbGuid, noteGuid) {
  const markdown = await readNoteMarkdown(userGuid, kbGuid, noteGuid);
  const html = await markdownToHtml(markdown);
  return html;
}

function noteDataExists(userGuid, kbGuid, noteGuid) {
  const p = getNoteHtmlPath(userGuid, kbGuid, noteGuid);
  return fs.pathExistsSync(p);
}

async function writeNoteResource(userGuid, kbGuid, noteGuid, resName, data) {
  const resPathName = path.join(paths.getNoteResources(userGuid, kbGuid, noteGuid), resName);
  await fs.writeFile(resPathName, data);
}

async function getMarkdownNoteTemplate() {
  return `# Note Title`;
}

async function getGuideNoteData() {
  const lang = getCurrentLang();
  let guideDataPath = path.join(__dirname, `../resources/${lang}/guide`);
  if (!(await fs.exists(guideDataPath))) {
    guideDataPath = path.join(__dirname, `../resources/en/guide`);
  }
  //
  const data = await fs.readFile(path.join(guideDataPath, 'index.md'));
  const markdown = data.toString('utf8');
  //
  const names = await fs.readdir(path.join(guideDataPath, 'index_files'));
  const images = names.map((image) => path.join(guideDataPath, 'index_files', image));
  //
  return {
    markdown,
    images,
  };
}

function extractNoteTitleAndAbstractFromText(text) {
  const firstLineEnd = text.indexOf('\n');
  let title;
  let abstract;
  if (firstLineEnd === -1) {
    title = text.trim();
    abstract = '';
  } else {
    title = text.substr(0, firstLineEnd).trim();
    abstract = text.substr(firstLineEnd + 1).substr(0, 200).trim();
  }
  return {
    title,
    abstract,
  };
}

module.exports = {
  markdownToHtml,
  getMarkdownFromHtml,
  writeNoteHtml,
  writeNoteMarkdown,
  readNoteMarkdown,
  readNoteHtml,
  noteDataExists,
  getResourcesFromHtml,
  writeNoteResource,
  extractTagsFromMarkdown,
  extractLinksFromMarkdown,
  getMarkdownNoteTemplate,
  getGuideNoteData,
  extractNoteTitleAndAbstractFromText,
};
