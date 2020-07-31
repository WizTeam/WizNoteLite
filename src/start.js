/* eslint-disable global-require */
const { app } = require('electron');

// 加快重新启动速度
const isMac = process.platform === 'darwin';
if (isMac) {
  require('./main/main');
} else {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    require('./main/main');
  }
}
