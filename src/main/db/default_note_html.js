const path = require('path');
const fs = require('fs-extra');

async function getDefaultNoteHtml() {
  const htmlPath = path.join(__dirname, '../resources/default_note.html');
  const data = await fs.readFile(htmlPath);
  return data.toString('utf8');
}

module.exports = getDefaultNoteHtml;
