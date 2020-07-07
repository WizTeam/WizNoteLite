import { getRange } from './range_utils';

// eslint-disable-next-line import/prefer-default-export
export function getFontBtnStatus(editor, type) {
  const dom = editor.querySelector(`.vditor-toolbar .vditor-tooltipped[data-type=${type}]`);
  return dom && Array.prototype.includes.call(dom.classList, 'vditor-menu--current');
}

export function isCtrl(event) {
  if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
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
  return filterParentElement(container, root, (dom) => dom.tagName.toLowerCase() === 'code');
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
