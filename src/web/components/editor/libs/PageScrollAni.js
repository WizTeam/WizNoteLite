import { getScrollContainer } from './dom_utils';

class PageScrollAni {
  setScrollTopTimer = null;

  constructor(root) {
    this.root = root;
  }

  setScrollTop = (top) => {
    // console.log('setScrollTop: ' + top);

    // t: 当前时间
    // b: 初始值
    // c: 变化量
    // d: 持续时间
    const easeOut = (t, b, c, d) => {
      const tx = t / d;
      return -c * tx * (tx - 2) + b;
    };

    if (this.setScrollTopTimer) {
      window.clearTimeout(this.setScrollTopTimer);
    }
    const scrollContainer = getScrollContainer(this.root);
    const startTime = new Date().valueOf();
    const startScrollTop = scrollContainer.scrollTop;
    const change = top - startScrollTop;
    const during = 250;
    let lastTop = startScrollTop;

    if (change < 10) {
      // 距离太小时，不做动画效果
      scrollContainer.scrollTop = top;
      return;
    }

    const scrollTo = () => {
      const curScrollTop = scrollContainer.scrollTop;
      if (Math.abs(curScrollTop - lastTop) > 30) {
        return;
      }

      let curTime = new Date().valueOf() - startTime;
      if (curTime > during) {
        curTime = during;
      }
      const _top = easeOut(curTime, startScrollTop, change, during);
      scrollContainer.scrollTop = _top;
      if ((change > 0 && _top < top) || (change < 0 && _top > top)) {
        lastTop = _top;
        this.setScrollTopTimer = window.setTimeout(scrollTo, 20);
      }
    };

    scrollTo();
  };
}

export default PageScrollAni;
