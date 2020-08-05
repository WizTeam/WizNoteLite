import { getRange, getRangeRect } from './range_utils';

// eslint-disable-next-line import/prefer-default-export
export function getFontBtnStatus(editor, type) {
  const dom = editor.querySelector(`.vditor-toolbar .vditor-tooltipped[data-type=${type}]`);
  return dom && Array.prototype.includes.call(dom.classList, 'vditor-menu--current');
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

export function isParent(dom, parent) {
  if (!dom || !parent) {
    return false;
  }
  let target = dom;
  while (target) {
    if (target === parent) {
      return true;
    }
    target = target.parentNode;
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

export function fixRangeScrollTop(root, pageScrollAni, rectLast) {
  const space = 40;
  const range = getRange();
  if (!isParent(range.startContainer, root)) {
    return;
  }
  const rect = getRangeRect();
  if (rect.x !== 0) {
    const scrollContainer = getScrollContainer(root);
    const curScrollTop = scrollContainer.scrollTop;
    let scrollTop = curScrollTop;
    const containerHeight = scrollContainer.clientHeight;
    if (rect.y < space) {
      scrollTop = scrollContainer.scrollTop + rect.y - space;
    } else if (rect.y > containerHeight - space) {
      const y = scrollContainer.scrollTop + rect.y;
      scrollTop = y - containerHeight + space;
    } else if (rectLast && rectLast.y > containerHeight * 0.6) {
      const y = scrollContainer.scrollTop + rect.y;
      scrollTop = y - containerHeight * 0.6;
    }
    if (scrollTop !== curScrollTop) {
      if (pageScrollAni) {
        pageScrollAni.setScrollTop(scrollTop);
      } else {
        scrollContainer.scrollTop = scrollTop;
      }
    }
  }
}

export function hasClass(dom, className) {
  return dom && ` ${dom.className}`.indexOf(` ${className}`) !== -1;
}

export function getCodeFromRange(root) {
  const range = getRange();
  const container = range.startContainer;
  return filterParentElement(container, root,
    (dom) => dom.nodeType === 1 && /^code$/i.test(dom.tagName),
    true);
}

export function getTagSpanFromRange(root, target = null) {
  let tagDom = target;
  if (!target) {
    const range = getRange();
    tagDom = range.startContainer;
  }
  return filterParentElement(tagDom, root,
    (dom) => hasClass(dom, 'tag-span'), true);
}

export function getTableFromRange(root) {
  const range = getRange();
  const container = range.startContainer;
  return filterParentElement(container, root,
    (dom) => dom.nodeType === 1 && /^table$/i.test(dom.tagName),
    true);
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
