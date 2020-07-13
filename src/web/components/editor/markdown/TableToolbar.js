import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import classNames from 'classnames';
import Menu from '@material-ui/core/Menu';
import Icons from '../../../config/icons';
import { filterParentElement, hasClass } from '../libs/dom_utils';
import { getRange } from '../libs/range_utils';

const useStyles = makeStyles(({ spacing }) => ({
  menu: {
    position: 'absolute',
    display: 'none',
    '&.active': {
      display: 'block',
    },
  },
  iconButton: {
    width: 32,
    height: 32,
  },
  menuContainer: {
    padding: spacing(2, 3, 1, 3),
    outline: 'none',
  },
  boxContainer: {
    marginBottom: spacing(2),
  },
  row: {
    display: 'flex',
    '&:not(:nth-last-child(1))': {
      marginBottom: '3px',
    },
  },
  box: {
    width: '16px',
    height: '16px',
    border: 'solid 1px #333333',
    cursor: 'pointer',
    '&:not(:nth-last-child(1))': {
      marginRight: '3px',
    },
    '&.active': {
      backgroundColor: 'rgba(68, 138, 255, 0.3)',
      borderColor: '#006eff',
    },
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333333',
  },
  input: {
    width: '24px',
    height: '20px',
    textAlign: 'center',
    fontSize: '12px',
    outline: 'none',
  },
  unit: {
    margin: '0 5px',
  },
}));

let tableElement;

function TableToolbar(props) {
  const classes = useStyles();

  const [menuPos, setMenuPos] = useState(undefined);

  const [selectIndex, setSelectIndex] = useState({
    x: -1,
    y: -1,
  });

  const [anchorEl, setAnchorEl] = useState(null);

  function menuBtnClickHandler(e) {
    setAnchorEl(e.currentTarget);
    e.preventDefault();
  }

  function closeMenuHandler() {
    setAnchorEl(null);
  }

  useEffect(() => {
    function selectionchangeHandler() {
      const range = getRange();
      if (range) {
        const ele = filterParentElement(range.startContainer, props.editor.vditor.element, (dom) => dom.tagName.toLocaleLowerCase() === 'table');
        if (ele) {
          if (ele !== tableElement) {
            tableElement = ele;
            setMenuPos({
              top: `${tableElement.offsetTop - 32}px`,
              left: `${tableElement.offsetLeft + tableElement.offsetWidth - 32}px`,
            });
          }
          return;
        } else if (filterParentElement(
          range.startContainer,
          document.body,
          (dom) => hasClass(dom, classes.menuContainer),
        )) {
          return;
        }
      }
      if (menuPos) {
        tableElement = undefined;
        setMenuPos(undefined);
        closeMenuHandler();
      }
    }

    function mouseoverHandler(e) {
      const ele = filterParentElement(
        e.target,
        document.body,
        (dom) => hasClass(dom, classes.boxContainer),
      );
      if (ele) {
        const box = filterParentElement(
          e.target,
          document.body,
          (dom) => hasClass(dom, classes.box),
          true,
        );
        if (box) {
          const indexArr = box.getAttribute('data-coordinate').split('-');
          setSelectIndex({
            x: parseInt(indexArr[1], 10),
            y: parseInt(indexArr[0], 10),
          });
        }
      } else {
        setSelectIndex({
          x: -1,
          y: -1,
        });
      }
    }

    document.addEventListener('selectionchange', selectionchangeHandler);
    document.addEventListener('mouseover', mouseoverHandler);

    return () => {
      document.removeEventListener('selectionchange', selectionchangeHandler);
      document.removeEventListener('mouseover', mouseoverHandler);
    };
  }, [props.editor, menuPos, classes]);

  return (
    <div
      className={classNames(classes.menu, {
        active: Boolean(menuPos),
      })}
      style={menuPos}
    >
      <IconButton className={classes.iconButton} onMouseDown={menuBtnClickHandler}>
        <Icons.QuitFullScreenIcon className={classes.icon} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(menuPos) && Boolean(anchorEl)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={closeMenuHandler}
        getContentAnchorEl={null}
      >
        <div className={classes.menuContainer}>

          <div className={classes.boxContainer}>
            {Array.from(Array(8), (row, y) => (
              <div className={classes.row} key={y.toString()}>
                {Array.from(Array(8), (item, x) => (
                  <div
                    className={classNames(classes.box, {
                      active: y <= selectIndex.y && x <= selectIndex.x,
                    })}
                    key={`${y.toString()}-${x.toString()}`}
                    data-coordinate={`${y}-${x}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className={classes.inputContainer}>
            <input type="text" className={classes.input} value={tableElement?.rows.length ?? 0} />
            <span className={classes.unit}>x</span>
            <input type="text" className={classes.input} value={tableElement?.rows[0].childElementCount ?? 0} />
          </div>
        </div>
      </Menu>
    </div>
  );
}

TableToolbar.propTypes = {
  editor: PropTypes.object,
};

TableToolbar.defaultProps = {
  editor: null,
};

export default TableToolbar;
