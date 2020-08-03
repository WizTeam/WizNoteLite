const { app, shell, BrowserWindow } = require('electron');
const i18next = require('i18next');

const isMac = process.platform === 'darwin';

function showMainWindow() {
  const windows = BrowserWindow.getAllWindows();
  const mainWindow = windows.find((win) => win.isMainWindow);
  if (mainWindow) {
    mainWindow.show();
  }
}

function handleMenuClick(menuItem, browserWindow) {
  if (browserWindow && browserWindow.webContents) {
    browserWindow.webContents.send('menuItemClicked', menuItem.id);
  }
}

function toMenuItem(id, accelerator) {
  return {
    id,
    accelerator,
    label: i18next.t(id),
    click: handleMenuClick,
  };
}


function getMainMenuTemplate() {
  //
  const template = [];
  //
  // mac app menu
  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        toMenuItem('menuShowAbout'),
        { type: 'separator' },
        { role: 'services', label: i18next.t('services') },
        { type: 'separator' },
        { role: 'hide', label: i18next.t('hide') },
        { role: 'hideothers', label: i18next.t('hideOther') },
        { role: 'unhide', label: i18next.t('showAll') },
        { type: 'separator' },
        { role: 'quit', label: i18next.t('quit') },
      ],
    });
  }
  //
  // file menu
  template.push({
    label: i18next.t('fileMenu'),
    submenu: [
      { role: 'close', label: i18next.t('close') },
    ],
  });
  // edit menu
  template.push({
    label: i18next.t('editMenu'),
    submenu: [
      { role: 'undo', label: i18next.t('undo') },
      { role: 'redo', label: i18next.t('redo') },
      { type: 'separator' },
      { role: 'cut', label: i18next.t('cut') },
      { role: 'copy', label: i18next.t('copy') },
      { role: 'paste', label: i18next.t('paste') },
      { role: 'pasteAndMatchStyle', label: i18next.t('pasteAndMatchStyle') },
      { role: 'delete', label: i18next.t('delete') },
      { role: 'selectAll', label: i18next.t('selectAll') },
      { type: 'separator' },
      {
        label: i18next.t('speech'),
        submenu: [
          { role: 'startspeaking', label: i18next.t('startspeaking') },
          { role: 'stopspeaking', label: i18next.t('stopspeaking') },
        ],
      },
    ],
  });
  // view menu
  template.push({
    label: i18next.t('viewMenu'),
    submenu: [
      { role: 'reload', label: i18next.t('reload') },
      { role: 'forcereload', label: i18next.t('forcereload') },
      { role: 'toggledevtools', label: i18next.t('toggledevtools') },
      { type: 'separator' },
      { role: 'resetzoom', label: i18next.t('resetzoom') },
      { role: 'zoomin', label: i18next.t('zoomin'), accelerator: 'CmdOrCtrl+=' },
      { role: 'zoomout', label: i18next.t('zoomout') },
      { type: 'separator' },
      { role: 'togglefullscreen', label: i18next.t('togglefullscreen') },
      toMenuItem('menuViewEditorOnly', 'Ctrl+1'),
      toMenuItem('menuViewEditorAndNotes', 'Ctrl+2'),
      toMenuItem('menuViewEditorAndNotesAndTags', 'Ctrl+3'),
    ],
  });
  // window menu
  template.push({
    label: i18next.t('windowMenu'),
    role: 'window',
    submenu: [
      { role: 'minimize', label: i18next.t('minimize') },
      { role: 'zoom', label: i18next.t('zoom') },
      { type: 'separator' },
      { role: 'front', label: i18next.t('front') },
      { type: 'separator' },
      {
        role: 'window',
        label: i18next.t('menuMainWindow'),
        click: async () => {
          showMainWindow();
        },
      },
      { type: 'separator' },
    ],
  });
  // help menu
  if (isMac) {
    template.push({
      label: i18next.t('helpMenu'),
      role: 'help',
      submenu: [
        {
          label: i18next.t('learnMore'),
          click: async () => {
            await shell.openExternal('https://www.wiz.cn/wiznote-lite');
          },
        },
      ],
    });
  } else {
    template.push({
      label: i18next.t('helpMenu'),
      role: 'help',
      submenu: [
        toMenuItem('menuShowAbout'),
        {
          label: i18next.t('learnMore'),
          click: async () => {
            await shell.openExternal('https://www.wiz.cn/wiznote-lite');
          },
        },
      ],
    });
  }
  return template;
}

function getMacDockMenuTemplate() {
  return [
    {
      label: i18next.t('menuMainWindow'),
      click() {
        showMainWindow();
      },
    },
  ];
}

module.exports = {
  getMainMenuTemplate,
  getMacDockMenuTemplate,
};
