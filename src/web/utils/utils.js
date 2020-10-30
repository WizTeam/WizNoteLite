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

export default {};
