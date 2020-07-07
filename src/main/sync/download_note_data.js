const SyncKbTask = require('./sync_kb_task');
const lockers = require('../common/lockers');
const noteData = require('../db/note_data');

async function downloadNoteData(user, db, noteGuid, invalidTokenHandler) {
  //
  const key = noteGuid;
  const haAlreadyLocked = lockers.isLocking(key);
  try {
    await lockers.lock(key);
    const kbGuid = await db.getKbGuid();
    if (haAlreadyLocked) {
      // 如果之前已经被正在下载，则不重复下载，直接去尝试读取数据
      const html = await noteData.readNoteHtml(user.userGuid, kbGuid, noteGuid);
      return {
        html,
      };
    }
    //
    const serverUrl = await db.getServerUrl();
    const task = new SyncKbTask(user, serverUrl, kbGuid, db, invalidTokenHandler);
    const result = await task.downloadNoteData(noteGuid);
    //
    const markdown = noteData.getMarkdownFromHtml(result.html);
    await db.updateNoteTags(noteGuid, markdown);
    //
    return result;
  } finally {
    lockers.release(key);
  }
}

module.exports = downloadNoteData;
