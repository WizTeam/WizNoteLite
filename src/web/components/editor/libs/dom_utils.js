import { getRange } from './range_utils';

// eslint-disable-next-line import/prefer-default-export
export function getFontBtnStatus(editor, type) {
  const dom = editor.querySelector(`.vditor-toolbar .vditor-tooltipped[data-type=${type}]`);
  return dom && Array.prototype.includes.call(dom.classList, 'vditor-menu--current');
}

export function isCtrl(event) {
  if (window.wizApi.platform.isMac) {
    if (event.metaKey && !event.ctrlKey) {
      return true;
    }
    return false;
  }
  if (!event.metaKey && event.ctrlKey) {
    return true;
  }
  return false;
}

export function filterParentElement(dom, root, filterFn, self = false) {
  if (dom) {
    let parent = self ? dom : dom.parentElement;
    while (parent) {
      if (parent === root) {
        break;
      }
      if (filterFn(parent)) {
        return parent;
      }
      parent = parent.parentElement;
    }
  }
  return null;
}

export function hasClass(dom, className) {
  return dom && ` ${dom.className}`.indexOf(` ${className}`) !== -1;
}

export function getCodeBlock(root) {
  const range = getRange();
  const container = range.startContainer;
  return filterParentElement(container, root,
    (dom) => dom.nodeType === 1 && dom.tagName.toLowerCase() === 'code',
    true);
}
export function getTagSpan(root, target = null) {
  let tagDom = target;
  if (!target) {
    const range = getRange();
    tagDom = range.startContainer;
  }
  return filterParentElement(tagDom, root,
    (dom) => hasClass(dom, 'tag-span'), true);
}

export function getDomIndexForParent(dom) {
  return [...dom.parentElement.children].findIndex((item) => item === dom);
}

export function getPositionForWin(dom) {
  const position = {
    left: 0,
    top: 0,
  };
  let node = dom;
  while (node) {
    position.left += node.offsetLeft;
    position.top += node.offsetTop;
    node = node.offsetParent;
  }
  return position;
}

export function getScrollContainer(dom) {
  let p = dom;
  const body = window.document.body;
  if (!dom) {
    return body;
  }
  if (dom === body) {
    return dom;
  }
  while (p && p.nodeType === 1) {
    const s = window.getComputedStyle(p);
    if (/auto|scroll/i.test(s.overflowY)) {
      return p;
    }
    if (p === body) {
      break;
    }
    p = p.parentNode;
  }
  return body;
}

export function updateHotkeyTip(hotkeyStr) {
  let hotkey;
  if (window.wizApi.platform.isMac) {
    hotkey = hotkeyStr.replace('ctrl', '⌘').replace('shift', '⇧')
      .replace('alt', '⌥');
    if (hotkey.indexOf('⇧') > -1) {
      hotkey = hotkey.replace(':', ';').replace('+', '=')
        .replace('_', '-');
    }
  } else {
    hotkey = hotkeyStr.replace('⌘', 'ctrl').replace('⇧', 'shift')
      .replace('⌥', 'alt');
    if (hotkey.indexOf('shift') > -1) {
      hotkey = hotkey.replace(';', ':').replace('=', '+');
    }
  }
  return hotkey;
}
// 是否匹配 ⌘-⌥-[] / ⌘-[]
export function matchHotKey(hotKey, event) {
  const hotKeys = updateHotkeyTip(hotKey).split('-');
  const hasAlt = hotKeys.length > 2 && (hotKeys[1] === 'alt' || hotKeys[1] === '⌥');
  let key = (hasAlt ? hotKeys[2] : hotKeys[1]) || '-';
  if (hasAlt && key === '-' && (!window.wizApi.platform.isMac)) {
    key = '_';
  }
  if (isCtrl(event) && event.key.toLowerCase() === key.toLowerCase() && !event.shiftKey
      && ((!hasAlt && !event.altKey) || (hasAlt && event.altKey))) {
    return true;
  }
  return false;
}
