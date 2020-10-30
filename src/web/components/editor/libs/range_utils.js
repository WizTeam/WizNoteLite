export function getSelection() {
  return window.document.getSelection();
}

export function getRange() {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) {
    return null;
  }
  return sel.getRangeAt(0);
}

export function getRangeRect() {
  const range = getRange();
  let rect = range.getBoundingClientRect();
  if (rect.y === 0 && rect.x === 0) {
    let target = range.startContainer;
    if (target.noteType === 3) {
      target = target.parentNode;
    }
    rect = target.getBoundingClientRect();
  }
  return rect;
}

export function getEndOffset(dom) {
  if (!dom) {
    return 0;
  }
  return dom.nodeType === 3 ? dom.nodeValue.length : dom.childNodes.length;
}

export function setRange(_start, _startOffset, _end, _endOffset) {
  const start = _start;
  let startOffset = _startOffset;
  const end = _end;
  let endOffset = _endOffset;

  if (!start) {
    return;
  }
  const maxStart = getEndOffset(start);
  const maxEnd = getEndOffset(end);

  if (startOffset < 0) {
    startOffset = 0;
  } else if (startOffset > maxStart) {
    startOffset = maxStart;
  }
  if (endOffset < 0) {
    endOffset = getEndOffset(end);
  } else if (endOffset > maxEnd) {
    endOffset = maxEnd;
  }
  const sel = getSelection();
  sel.removeAllRanges();
  if (sel.rangeCount === 0) {
    const range = window.document.createRange();
    range.selectNode(start);
    try {
      sel.addRange(range);
    } catch (e) {
      console.error(e);
      return;
    }
  }
  try {
    sel.collapse(start, startOffset);
    if (end && (end !== start || endOffset !== startOffset)) {
      sel.extend(end, endOffset);
    }
  } catch (e) {
    // IE11 某些情况下设置 endContainer 为 img，且 endOffset 为 0 时，再次修改 start 会导致错误
    // “由于出现错误 800a025e 而导致此项操作无法完成。”
    console.log(e);
  }
}

export function resetRange(range) {
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
export function setRangeByDomBeforeEnd(dom) {
  if (dom) {
    const range = document.createRange();
    range.selectNodeContents(dom.firstChild ?? dom);
    range.collapse(false);
    resetRange(range);
  }
}
