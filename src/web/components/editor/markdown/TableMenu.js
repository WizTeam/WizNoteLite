import React, {
  useEffect, useState, useCallback,
} from 'react';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import copy from 'copy-to-clipboard';
import Icon from '../../../config/icons';
import {
  filterParentElement, updateHotkeyTip, matchHotKey, hasClass,
} from '../libs/dom_utils';
import { setRangeByDomBeforeEnd } from '../libs/range_utils';
import LiteMenu from './LiteMenu';

const useStyles = makeStyles(({ spacing, palette }) => ({
  menuRoot: {
    minWidth: '224px',
    color: palette.type === 'dark' ? '#fff' : '#333',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    height: '32px',
    width: '100%',
    position: 'relative',
  },
  subMenu: {
    position: 'absolute',
    top: '-6px',
    display: 'none',
    '&.active': {
      display: 'block',
    },
  },
  rightMenu: {
    right: 0,
    transform: 'translateX(100%)',
    paddingLeft: spacing(3),
  },
  leftMenu: {
    left: 0,
    transform: 'translateX(-100%)',
    paddingRight: spacing(3),
  },
  subMenuContainer: {
    color: palette.type === 'dark' ? '#fff' : '#333',
  },
  subMenuItem: {
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
  menuItemIcon: {
    borderRadius: 4,
    marginRight: spacing(1),
    width: 20,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    fontSize: 14,
  },
  menuName: {
    flex: '1',
    fontSize: '15px',
    letterSpacing: '1px',
    marginRight: spacing(2),
  },
  menuLine: {
    height: '1px',
    backgroundColor: '#d8d8d8',
    margin: spacing(0, 2),
  },
  iconArrow: {
    color: '#aaa',
    fontSize: '10px',
  },
  shortcut: {
    color: '#aaa',
    fontSize: '12px',
  },
}));

let currentCellElement;
let tableElement;
// 修复md表头分割线 | - | - | - |   => | ----- | ----- | ----- |
function fixTableMd(md) {
  const textArr = md.split('\n');
  textArr[1] = textArr[1].replace(/-/g, '-----');
  return textArr.join('\n');
}

function TableMenu(props) {
  const classes = useStyles();

  const { intl } = props;

  const [menuPosition, setMenuPosition] = useState(undefined);
  const [subMenuPos, setSubMenuPos] = useState(null);
  const [align, setAlign] = useState('left');

  function deleteTable() {
    if (tableElement) {
      tableElement.outerHTML = '';
      props.onSaveNote();
    }
  }

  function addRowAbove() {
    if (currentCellElement) {
      let rowHTML = '';
      for (let i = 0; i < currentCellElement.parentElement.childElementCount; i++) {
        rowHTML += '<td> </td>';
      }
      currentCellElement.parentElement.insertAdjacentHTML('beforebegin', `<tr>${rowHTML}</tr>`);
      setRangeByDomBeforeEnd(currentCellElement.parentElement.previousElementSibling.children[0]);
      props.onSaveNote();
    }
  }

  function addColBefore() {
    if (currentCellElement && tableElement) {
      let index = 0;
      let previousElement = currentCellElement.previousElementSibling;
      while (previousElement) {
        index++;
        previousElement = previousElement.previousElementSibling;
      }
      for (let i = 0; i < tableElement.rows.length; i++) {
        if (i === 0) {
          tableElement.rows[i].cells[index].insertAdjacentHTML('beforebegin', '<th> </th>');
        } else {
          tableElement.rows[i].cells[index].insertAdjacentHTML('beforebegin', '<td> </td>');
        }
      }
      props.onSaveNote();
    }
  }

  // 通过触发editor.vditor快捷键实现表格操作功能
  const dispatchKey = useCallback((hotKey) => {
    if (props.editor?.vditor.ir.element) {
      const hotKeys = updateHotkeyTip(hotKey).split('-');
      let ctrlKey = false;
      let metaKey = false;
      if (hotKeys.length > 1 && (hotKeys[0] === 'ctrl' || hotKeys[0] === '⌘')) {
        if (window.wizApi.platform.isMac) {
          metaKey = true;
        } else {
          ctrlKey = true;
        }
      }
      const shiftKey = hotKeys.length > 2 && (hotKeys[1] === 'shift' || hotKeys[1] === '⇧');
      let key = (shiftKey ? hotKeys[2] : hotKeys[1]) || '-';
      if (shiftKey && key === '-' && !window.wizApi.platform.isMac) {
        key = '_';
      }
      const mockKeyboardEvent = new KeyboardEvent('keydown', {
        key, ctrlKey, metaKey, shiftKey,
      });
      props.editor.vditor.ir.element.dispatchEvent(mockKeyboardEvent);
    }
  }, [props.editor]);

  function getTableMd() {
    return fixTableMd(props.editor.html2md(tableElement.outerHTML));
  }

  function clickHandler(type, e) {
    setRangeByDomBeforeEnd(currentCellElement);

    switch (type) {
      case 'addRowAbove':
        addRowAbove();
        break;
      case 'addRowBelow':
        dispatchKey('⌘-=');
        break;
      case 'addColBefore':
        addColBefore();
        break;
      case 'addColAfter':
        dispatchKey('⌘-⇧-=');
        break;
      case 'alignLeft':
        dispatchKey('⌘-⇧-L');
        break;
      case 'alignCenter':
        dispatchKey('⌘-⇧-C');
        break;
      case 'alignRight':
        dispatchKey('⌘-⇧-R');
        break;
      case 'deleteRow':
        dispatchKey('⌘--');
        break;
      case 'deleteCol':
        dispatchKey('⌘-⇧--');
        break;
      case 'deleteTable':
        deleteTable();
        break;
      case 'CpHtml':
        if (tableElement) {
          const copyHandler = (event) => {
            event.preventDefault();
            event.clipboardData.setData('text/plain', getTableMd());
            event.clipboardData.setData('text/html', tableElement.outerHTML);
          };
          document.addEventListener('copy', copyHandler);
          copy();
          document.removeEventListener('copy', copyHandler);
        }
        break;
      case 'CpMd':
        if (props.editor && tableElement) {
          copy(getTableMd());
        }
        break;
      default:
        break;
    }
    e.preventDefault();
    setMenuPosition(undefined);
  }

  useEffect(() => {
    function handleShowSubMenu(e) {
      const ele = filterParentElement(e.target, document.body, (dom) => dom.getAttribute('data-type') === 'subMenu', true);
      if (ele && !subMenuPos) {
        const eleRect = ele.getBoundingClientRect();
        setSubMenuPos({
          left: eleRect.left + eleRect.width,
          top: eleRect.top,
        });
      } else if (!ele && !filterParentElement(e.target, document.body, (dom) => dom.getAttribute('data-type') === 'subMenuContainer', true) && subMenuPos) {
        setSubMenuPos(null);
      }
    }

    function handleMouseDown(e) {
      if (props.editor) {
        const ele = filterParentElement(e.target, props.editor.vditor.element, (dom) => dom.tagName.toLocaleLowerCase() === 'table');
        if (e.button === 2 && ele) {
          tableElement = ele;
          currentCellElement = filterParentElement(e.target, props.editor.vditor.element, (dom) => ['th', 'td'].includes(dom.tagName?.toLocaleLowerCase()), true);
          if (currentCellElement) {
            const currentCellElementAlign = currentCellElement.getAttribute('align') ?? 'left';
            if (currentCellElementAlign !== align) {
              setAlign(currentCellElementAlign);
            }
            setMenuPosition({
              top: e.clientY,
              left: e.clientX,
            });
          }
          e.preventDefault();
        } else if (!filterParentElement(
          e.target, document.body,
          (dom) => hasClass(dom, classes.menuRoot),
          true,
        ) && menuPosition) {
          setMenuPosition(undefined);
        }
      }
    }

    function handleKeyDown(e) {
      if (matchHotKey('⌘-Enter', e)) {
        dispatchKey('⌘-=');
        e.preventDefault();
      } else if (matchHotKey('⌘-⌥-Enter', e)) {
        dispatchKey('⌘-⇧-=');
        e.preventDefault();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseover', handleShowSubMenu);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseover', handleShowSubMenu);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [menuPosition, subMenuPos, props.editor, align, dispatchKey, classes.menuRoot]);

  const isHead = currentCellElement && currentCellElement.tagName.toLocaleLowerCase() === 'th';

  return (
    <Menu
      keepMounted
      open={Boolean(menuPosition)}
      anchorReference="anchorPosition"
      anchorPosition={menuPosition}
      classes={{
        list: classes.menuRoot,
      }}
    >
      {isHead ? '' : (
        <MenuItem onClick={(e) => clickHandler('addRowAbove', e)}>
          <div className={classes.menuItem}>
            <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuAddRowAbove' })}</div>
          </div>
        </MenuItem>
      )}
      <MenuItem onClick={(e) => clickHandler('addRowBelow', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuAddRowBelow' })}</div>
          <div className={classes.shortcut}>{updateHotkeyTip('⌘+Enter')}</div>
        </div>
      </MenuItem>
      <div className={classes.menuLine} />
      <MenuItem onClick={(e) => clickHandler('addColBefore', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuAddColBefore' })}</div>
        </div>
      </MenuItem>
      <MenuItem onClick={(e) => clickHandler('addColAfter', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuAddColAfter' })}</div>
          <div className={classes.shortcut}>{updateHotkeyTip('⌘+⌥+Enter')}</div>
        </div>
      </MenuItem>
      <div className={classes.menuLine} />
      <MenuItem>
        <div
          className={classes.menuItem}
          data-type="subMenu"
        >
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuAlign' })}</div>
          <ArrowForwardIosIcon className={classes.iconArrow} />
          <LiteMenu position={subMenuPos ?? undefined} show={!!subMenuPos}>
            <div className={classes.subMenuContainer} data-type="subMenuContainer">
              <button type="button" className={classes.subMenuItem} onClick={(e) => clickHandler('alignLeft', e)}>
                <div className={classes.menuItemIcon}>
                  {align === 'left' && (<Icon.SelectedIcon className={classes.selectedIcon} />)}
                </div>
                <div>{intl.formatMessage({ id: 'tableMenuLeft' })}</div>
              </button>
              <button type="button" className={classes.subMenuItem} onClick={(e) => clickHandler('alignCenter', e)}>
                <div className={classes.menuItemIcon}>
                  {align === 'center' && (<Icon.SelectedIcon className={classes.selectedIcon} />)}
                </div>
                <div>{intl.formatMessage({ id: 'tableMenuCenter' })}</div>
              </button>
              <button type="button" className={classes.subMenuItem} onClick={(e) => clickHandler('alignRight', e)}>
                <div className={classes.menuItemIcon}>
                  {align === 'right' && (<Icon.SelectedIcon className={classes.selectedIcon} />)}
                </div>
                <div>{intl.formatMessage({ id: 'tableMenuRight' })}</div>
              </button>
            </div>
          </LiteMenu>
        </div>
      </MenuItem>
      <div className={classes.menuLine} />
      {isHead ? '' : (
        <MenuItem onClick={(e) => clickHandler('deleteRow', e)}>
          <div className={classes.menuItem}>
            <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuDeleteRow' })}</div>
          </div>
        </MenuItem>
      )}
      <MenuItem onClick={(e) => clickHandler('deleteCol', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuDeleteCol' })}</div>
        </div>
      </MenuItem>
      <MenuItem onClick={(e) => clickHandler('deleteTable', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuDeleteTable' })}</div>
        </div>
      </MenuItem>
      <div className={classes.menuLine} />
      <MenuItem onClick={(e) => clickHandler('CpHtml', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuCpHtml' })}</div>
        </div>
      </MenuItem>
      <MenuItem onClick={(e) => clickHandler('CpMd', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'tableMenuCpMd' })}</div>
        </div>
      </MenuItem>
    </Menu>
  );
}

TableMenu.propTypes = {
  intl: PropTypes.object.isRequired,
  editor: PropTypes.object,
  onSaveNote: PropTypes.func.isRequired,
};

TableMenu.defaultProps = {
  editor: null,
};

export default injectIntl(TableMenu);
