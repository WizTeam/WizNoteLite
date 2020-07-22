import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import Icon from '../../../config/icons';
import { getScrollContainer } from '../libs/dom_utils';

const IconBtn = withStyles({
  root: {
    minWidth: 'auto',
  },
})(Button);

const useStyles = makeStyles(({ spacing, palette }) => ({
  menu: ({ type }) => ({
    backgroundColor: palette.type === 'dark' ? '#555555' : '#fff',
    display: 'none',
    height: type !== 'icon' ? 'auto' : 40,
    boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    position: 'absolute',
    padding: type !== 'icon' ? spacing(1, 0) : 0,
    minWidth: type !== 'icon' ? 126 : 104,
    zIndex: 9999,
    color: palette.type === 'dark' ? '#fff' : '#333',
  }),

  menuActive: ({ type }) => ({
    display: type !== 'icon' ? 'block' : 'flex',
  }),
  menuHead: {
    padding: spacing(0, 2, 0, 1),
    height: 32,
    lineHeight: '32px',
    fontSize: 14,
    color: '#aaa',
    display: 'flex',
  },
  menuItem: {
    display: 'flex',
    border: 'none',
    textAlign: 'left',
    outline: 'none',
    fontSize: 14,
    padding: spacing(0, 2, 0, 1),
    height: 32,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    '&:hover,&.hover': {
      backgroundColor: '#006eff',
      color: '#fff',
    },
  },
  menuItemIcon: ({ type }) => ({
    borderRadius: 4,
    marginRight: spacing(1),
    width: type === 'checkbox' ? 20 : 'auto',
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  selectedIcon: {
    fontSize: 14,
  },
}));
export default function LiteMenu(props) {
  const classes = useStyles({ type: props.type });

  const menuRef = useRef(null);

  const [pos, setPos] = useState({
    left: 0,
    top: 0,
  });

  const [btnCount, setBtnCount] = useState(0);

  const [menuList, setMenuList] = useState([]);

  useEffect(() => {
    let _btnCount = 0;
    setMenuList(props.menuList.map((item) => ({
      ...item,
      type: item.type ?? 'button',
      hoverIndex: !item.type || item.type === 'button' ? _btnCount++ : undefined,
    })));
    setBtnCount(_btnCount);
  }, [props.menuList]);

  function getOffset(positionName) {
    let offset;
    switch (positionName) {
      case 'top':
        offset = {
          left: 0,
          top: -menuRef.current.offsetHeight - 10,
        };
        break;
      case 'bottom':
        offset = {
          left: -menuRef.current.offsetWidth / 2,
          top: 30,
        };
        break;
      case 'left':
        offset = {
          left: -menuRef.current.offsetWidth,
          top: 0,
        };
        break;
      default:
        offset = {
          left: 0,
          top: 0,
        };
        break;
    }
    return offset;
  }

  const [hoverIndex, setHoverIndex] = useState(-1);

  useEffect(() => {
    const computePosition = (position, positionName) => {
      const offset = getOffset(positionName);
      const scrollContainer = getScrollContainer(props.editorRoot);
      let left = position.left + offset.left - scrollContainer.scrollLeft;
      let top = position.top + offset.top - scrollContainer.scrollTop;
      const right = left + menuRef.current.offsetWidth;
      const bottom = top + menuRef.current.offsetHeight;

      const tolerance = 30;
      if (right > window.innerWidth - tolerance) {
        left = window.innerWidth - tolerance - menuRef.current.offsetWidth;
      }
      if (left < tolerance) {
        left = tolerance;
      }

      if (bottom > window.innerHeight - tolerance) {
        // 上移的 Menu 不能挡住 光标
        if (positionName === 'bottom') {
          top = position.top - scrollContainer.scrollTop - menuRef.current.offsetHeight;
        } else {
          top = window.innerHeight - tolerance - menuRef.current.offsetHeight;
        }
      }
      if (top < tolerance) {
        top = tolerance;
      }
      return {
        left,
        top,
      };
    };

    if (props.show) {
      setPos(computePosition(props.position, props.positionName));
      if (props.keyControl) {
        setHoverIndex(-1);
      }
    }
  }, [props.editorRoot, props.show, props.position, props.keyControl,
    props.positionName, menuList]);

  useEffect(() => {
    function keyControlHandler(e) {
      const keyCode = e.keyCode;
      if (props.show) {
        if (keyCode === 38) {
          if (hoverIndex > 0) {
            setHoverIndex(hoverIndex - 1);
          }
          e.preventDefault();
          e.stopPropagation();
        } else if (keyCode === 40) {
          if (hoverIndex < btnCount - 1) {
            setHoverIndex(hoverIndex + 1);
          }
          e.preventDefault();
          e.stopPropagation();
        } else if (keyCode === 13 && hoverIndex >= 0) {
          const dom = menuRef.current.querySelector(`.${classes.menuItem}.hover`);
          if (dom) {
            dom.dispatchEvent(new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
            }));
          }
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }

    if (props.keyControl) {
      window.document.addEventListener('keydown', keyControlHandler, true);
    } else {
      window.document.removeEventListener('keydown', keyControlHandler, true);
    }
    return () => {
      window.document.removeEventListener('keydown', keyControlHandler, true);
    };
  }, [props.keyControl, props.show, hoverIndex, btnCount, classes]);

  function renderTextMenuItem(item, key, isCheckbox = false) {
    let node;
    switch (item.type) {
      case 'head':
        node = (
          <div className={classes.menuHead} key={key}>
            <div className={classes.menuItemIcon} />
            <div>{item.label}</div>
          </div>
        );
        break;
      default:
        node = (
          <button
            type="button"
            className={classNames(classes.menuItem, {
              hover: item.hoverIndex === hoverIndex,
            })}
            onClick={() => item.onClick()}
            key={key}
          >
            <div className={classes.menuItemIcon}>
              {
                isCheckbox && item.active
                  ? (<Icon.SelectedIcon className={classes.selectedIcon} />) : item.icon
              }
            </div>
            <div>{item.label}</div>
          </button>
        );
        break;
    }

    return node;
  }

  function renderIconMenuItem(item, key) {
    return (
      <IconBtn
        color={item.active ? 'primary' : 'default'}
        size="small"
        key={key}
        onClick={item.onClick}
      >
        {item.icon}
      </IconBtn>
    );
  }

  return createPortal((
    <div
      className={classNames(classes.menu, {
        [classes.menuActive]: props.show,
      })}
      style={pos}
      ref={menuRef}
    >
      {props.children ? props.children : menuList.map((item, index) => (props.type === 'icon' ? renderIconMenuItem(item, index.toString()) : renderTextMenuItem(item, index.toString(), props.type === 'checkbox')))}
    </div>
  ), window.document.body);
}

const MenuItem = PropTypes.shape({
  onClick: PropTypes.func,
  active: PropTypes.bool,
  label: PropTypes.string,
  icon: PropTypes.object,
  type: PropTypes.oneOf(['head', 'button']),
});

const PropTypesPosition = PropTypes.shape({
  left: PropTypes.number,
  top: PropTypes.number,
});

LiteMenu.propTypes = {
  positionName: PropTypes.oneOf(['top', 'bottom', 'left']),
  menuList: PropTypes.arrayOf(MenuItem),
  type: PropTypes.oneOf(['icon', 'label', 'checkbox']),
  editorRoot: PropTypes.object,
  show: PropTypes.bool,
  keyControl: PropTypes.bool,
  position: PropTypesPosition,
  children: PropTypes.object,
};

LiteMenu.defaultProps = {
  positionName: undefined,
  type: 'label',
  editorRoot: null,
  show: false,
  keyControl: false,
  children: null,
  menuList: [],
  position: {
    left: 0,
    top: 0,
  },
};
