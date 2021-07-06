export function overwriteEditorConfig(options, id = 'editor-overwrite') {
  let style = document.querySelector(`#${id}`);
  //
  if (!style) {
    style = document.createElement('style');
    style.id = id;
  }
  let css = '';
  //
  Object.keys(options).forEach((item) => {
    const val = options[item];
    switch (item) {
      case 'fontFamily':
        css += `--editor-font-family: '${val}';`;
        break;
      case 'fontSize':
        css += `--editor-font-size: ${val}px;`;
        break;
      case 'lineHeight':
        {
          const h = Math.floor(val * options.fontSize);
          css += `--editor-line-height: ${h}px; --editor-first-line-center-top: calc(0.5 * var(--editor-line-height) - 1px);`;
        }
        break;
      case 'paragraphHeight':
        css += `--p-margin-bottom: ${val}px;`;
        break;
      case 'textColor':
        css += `--editor-color: ${val}`;
        break;
      case 'textWidth':
        css += `--editor-container-width: ${val}%`;
        break;
      default:
        break;
    }
  });
  //
  style.innerHTML = `:root,div.editor-main { ${css} }`;
  document.head.appendChild(style);
}

export function injectionCssFormId(id, css = '') {
  if (!id) return;
  //
  const element = document.querySelector(`#${id}`);
  const parentElement = element.parentElement;
  if (element && parentElement) {
    let style = Array
      .from(parentElement.childNodes)
      .find((node) => node.tagName.toLowerCase() === 'style');
    //
    if (!style) {
      style = document.createElement('style');
    }
    //
    style.innerHTML = css;
    parentElement.insertBefore(style, element);
  }
}

export function getScrollbarWidthHorizontal() {
  let scrollbarWidth = 0;
  //
  const div = document.createElement('div');
  div.style = `
    width: 100px;
    height: 100px;
    position: absolute;
    top: -9999px;
    overflow: scroll;
    -ms-overflow-style: scrollbar;
  `;
  //
  document.body.appendChild(div);
  scrollbarWidth = (div.offsetHeight - div.clientHeight);
  document.body.removeChild(div);
  //
  return scrollbarWidth;
}

export function isMacSystem() {
  return navigator.platform.toUpperCase().includes('MAC');
}

export function parseKey(key) {
  let val;
  switch (key) {
    case '↑':
      val = 'ArrowUp';
      break;
    case '↓':
      val = 'ArrowDown';
      break;
    case '←':
      val = 'ArrowLeft';
      break;
    case '→':
      val = 'ArrowRight';
      break;
    default:
      val = key;
      break;
  }
  return val;
}

export function transformKey(key) {
  switch (key) {
    case 'å':
      return 'a';
    case 'µ':
      return 'm';
    case '–':
      return '-';
    case '∆':
      return 'j';
    case 'ç':
      return 'c';
    case 'ø':
      return 'o';
    case '¨':
      return 'u';
    case '≈':
      return 'x';
    case 'œ':
      return 'q';
    case 'dead':
      return 'u';
    case 'ß':
      return 's';
    case '÷':
      return '/';
    case '†':
      return 't';
    default:
      return key;
  }
}

export function isTouchCtrlKey(event) {
  return isMacSystem() ? event.metaKey && !event.ctrlKey : !event.metaKey && event.ctrlKey;
}

export function matchHotKey(hotkey, event, separator = '-') {
  const hotkeys = hotkey.split(separator);
  const key = parseKey(hotkeys[hotkeys.length - 1]);
  const hasCtrl = hotkeys.some(
    (value) => value.toLocaleLowerCase().includes('ctrl') || value.toLocaleLowerCase().includes('cmd') || value.includes('⌘'),
  );
  const hasAlt = hotkeys.some((value) => value.toLocaleLowerCase() === 'alt' || value === '⌥');
  const hasShift = hotkeys.some((value) => value.toLocaleLowerCase() === 'shift' || value === '⇧');

  return (
    key.toLocaleLowerCase() === transformKey(event.key.toLocaleLowerCase())
    && ((hasCtrl && isTouchCtrlKey(event)) || (!hasCtrl && !isTouchCtrlKey(event)))
    && ((hasAlt && event.altKey) || (!hasAlt && !event.altKey))
    && ((hasShift && event.shiftKey) || (!hasShift && !event.shiftKey))
  );
}

export const COMMAND_KEY = isMacSystem() ? '⌘' : 'Ctrl';

export default {
  overwriteEditorConfig,
  injectionCssFormId,
  getScrollbarWidthHorizontal,
  isMacSystem,
  parseKey,
  transformKey,
  isTouchCtrlKey,
  COMMAND_KEY,
};
