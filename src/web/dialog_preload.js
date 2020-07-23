const { remote } = require('electron');

document.onkeydown = (event) => {
  if (event.keyCode === 27) {
    remote.getCurrentWindow().close();
  }
};
