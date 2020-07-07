/*
修改自：
https://github.com/CassetteRocks/react-infinite-scroller
原来的版本有问题，在引入redux的情况下，刷新页面，初始化store的时候，导致页面提前render，
并调用componentDidUpdate，导致提前attachScrollListener，从而导致加载数据产生并发。
引入loading状态并且给数据加载函数增加回调，避免这个问题。
*/

import React, {
  Component,
} from 'react';
import PropTypes from 'prop-types';

export default class InfiniteScroll extends Component {
  lastScrollComponent = null;

  curScrollTarget = null;

  constructor(props) {
    super(props);

    this.scrollListener = this.scrollListener.bind(this);
    this.loading = false;
  }

  componentDidMount() {
    const { pageStart } = this.props;
    this.pageLoaded = pageStart;
    // console.log("did mount");
    this.attachScrollListener();
  }

  componentDidUpdate() {
    // console.log("did update");
    this.attachScrollListener();
  }

  componentWillUnmount() {
    // console.log("will unmount");
    this.detachScrollListener();
  }

  // Set a default loader for all your `InfiniteScroll` components
  setDefaultLoader(loader) {
    this.defaultLoader = loader;
  }

  getScrollTarget() {
    if (this.lastScrollComponent === this.scrollComponent
      && this.curScrollTarget) {
      return this.curScrollTarget;
    }
    let scrollEl = window;
    const { useWindow } = this.props;
    if (useWindow === false) {
      scrollEl = this.scrollComponent;
      // scrollEl = this.scrollComponent.parentNode;
      // let style = window.getComputedStyle(scrollEl);
      while (scrollEl && scrollEl !== window.document.body) {
        const style = window.getComputedStyle(scrollEl);
        const overflowY = style['overflow-y'];
        if (overflowY === 'auto' || overflowY === 'scroll') {
          break;
        }
        scrollEl = scrollEl.parentNode;
        // if (!scrollEl) {
        //   break;
        // }
      }

      this.lastScrollComponent = this.scrollComponent;
      this.curScrollTarget = scrollEl;
    }
    return scrollEl;
  }

  detachScrollListener() {
    const scrollEl = this.getScrollTarget();
    if (!scrollEl) {
      return;
    }
    const { useCapture } = this.props;
    scrollEl.removeEventListener('scroll', this.scrollListener, useCapture);
    scrollEl.removeEventListener('resize', this.scrollListener, useCapture);
  }

  attachScrollListener() {
    // console.log("attach scrollListener");
    const { hasMore, useCapture, initialLoad } = this.props;
    if (!hasMore) {
      // console.log("!has more");
      return;
    }

    if (this.loading) {
      // console.log("loading data, don't attach");
      return;
    }

    const scrollEl = this.getScrollTarget();
    if (!scrollEl) {
      // console.log("no scrollEl");
      return;
    }
    // console.log(scrollEl);
    this.detachScrollListener();
    scrollEl.addEventListener('scroll', this.scrollListener, useCapture);
    scrollEl.addEventListener('resize', this.scrollListener, useCapture);

    // console.log("add listener");
    // console.log("initialLoad: " + this.props.initialLoad);
    if (initialLoad) {
      // console.log("initialLoad");
      this.scrollListener();
    }
  }

  scrollListener() {
    //
    // console.log("enter scrollListener");
    if (this.loading) {
      // console.log("loading data, don't attach");
      // console.log("leave scrollListener");
      return;
    }
    //
    const el = this.scrollComponent;
    const scrollEl = this.curScrollTarget;

    const {
      useWindow, isReverse, threshold, loadMore,
    } = this.props;

    let offset;
    if (useWindow) {
      const scrollTop = (typeof scrollEl.pageYOffset !== 'undefined')
        ? scrollEl.pageYOffset
        : (window.document.documentElement || window.document.body.parentNode || window.document.body).scrollTop;
      if (isReverse) {
        offset = scrollTop;
      } else {
        offset = this.calculateTopPosition(el)
          + (el.offsetHeight - scrollTop - window.innerHeight);
      }
    } else if (isReverse) {
      offset = scrollEl.scrollTop;
    } else {
      offset = el.offsetTop + el.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    }

    // console.log(offset + ', ' + this.props.threshold);
    if (offset < Number(threshold)) {
      this.detachScrollListener();
      // Call loadMore after detachScrollListener to allow for non-async loadMore functions
      if (typeof loadMore === 'function') {
        this.loading = true;

        // console.log("start loading");
        loadMore(this.pageLoaded += 1, (err) => {
          this.loading = false;
          if (!err) {
            this.attachScrollListener();
          }
          // console.log("loaded");
        });
      }
    }
    // console.log("leave scrollListener");
  }

  calculateTopPosition(el) {
    if (!el) {
      return 0;
    }
    return el.offsetTop + this.calculateTopPosition(el.offsetParent);
  }

  render() {
    const {
      children,
      element,
      hasMore,
      initialLoad,
      isReverse,
      loader,
      loadMore,
      pageStart,
      ref,
      threshold,
      useCapture,
      useWindow,
      ...props
    } = this.props;

    props.ref = (node) => {
      this.scrollComponent = node;
      if (ref) {
        ref(node);
      }
    };

    // console.log(`has more=${hasMore}`);

    const childrenArray = [children];
    if (hasMore) {
      if (loader) {
        if (isReverse) {
          childrenArray.unshift(loader);
        } else {
          childrenArray.push(loader);
        }
      } else if (this.defaultLoader) {
        if (isReverse) {
          childrenArray.unshift(this.defaultLoader);
        } else {
          childrenArray.push(this.defaultLoader);
        }
      }
    }
    return React.createElement(
      element,
      props,
      ...childrenArray,
    );
  }
}

InfiniteScroll.propTypes = {
  children: PropTypes
    .oneOfType([PropTypes.object, PropTypes.array])
    .isRequired,
  element: PropTypes.string,
  hasMore: PropTypes.bool,
  initialLoad: PropTypes.bool,
  isReverse: PropTypes.bool,
  loader: PropTypes.object,
  loadMore: PropTypes.func.isRequired,
  pageStart: PropTypes.number,
  ref: PropTypes.func,
  threshold: PropTypes.number,
  useCapture: PropTypes.bool,
  useWindow: PropTypes.bool,
};

InfiniteScroll.defaultProps = {
  element: 'div',
  hasMore: false,
  initialLoad: true,
  pageStart: 0,
  ref: null,
  threshold: 150,
  useWindow: true,
  isReverse: false,
  useCapture: false,
  loader: null,
};
