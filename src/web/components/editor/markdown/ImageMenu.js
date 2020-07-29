import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { injectIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import {
  filterParentElement, hasClass, getScrollContainer,
} from '../libs/dom_utils';
import { resetRange } from '../libs/range_utils';

const useStyles = makeStyles(({ palette }) => ({
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
}));

let currentImageContainerElement;
let scrollElement;

function ImageMenu(props) {
  const classes = useStyles();

  const { intl } = props;

  const [menuPosition, setMenuPosition] = useState(undefined);

  useEffect(() => {
    function mousedownHandler(e) {
      if (e.button === 2 && e.target.tagName === 'IMG') {
        currentImageContainerElement = filterParentElement(e.target, props.editor.vditor.element, (dom) => hasClass(dom, 'vditor-ir__node'));
        setMenuPosition({
          top: e.clientY,
          left: e.clientX,
        });
        e.preventDefault();
      } else if (!filterParentElement(
        e.target, document.body,
        (dom) => hasClass(dom, classes.menuRoot),
        true,
      ) && menuPosition) {
        setMenuPosition(undefined);
      }
    }

    if (props.editor?.vditor.element) {
      scrollElement = getScrollContainer(props.editor.vditor.element);

      window.addEventListener('mousedown', mousedownHandler);
    }
    return () => {
      window.removeEventListener('mousedown', mousedownHandler);
    };
  }, [menuPosition, props.editor, classes.menuRoot]);

  async function clickHandler(type, e) {
    if (currentImageContainerElement) {
      const range = document.createRange();
      const scrollTop = scrollElement.scrollTop;
      switch (type) {
        case 'change':
          range.setStartAfter(currentImageContainerElement);
          resetRange(range);
          await props.onInsertImage(() => currentImageContainerElement.remove());
          break;
        case 'delete':
          currentImageContainerElement.remove();
          props.onSaveNote();
          break;
        default:
          break;
      }
      scrollElement.scrollTo(0, scrollTop);
    }
    e.preventDefault();
    setMenuPosition(undefined);
  }

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
      <MenuItem onClick={(e) => clickHandler('change', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'ImageMenuChange' })}</div>
        </div>
      </MenuItem>
      <MenuItem onClick={(e) => clickHandler('delete', e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'ImageMenuDelete' })}</div>
        </div>
      </MenuItem>
    </Menu>
  );
}

ImageMenu.propTypes = {
  intl: PropTypes.object.isRequired,
  editor: PropTypes.object,
  onSaveNote: PropTypes.func.isRequired,
  onInsertImage: PropTypes.func.isRequired,
};

ImageMenu.defaultProps = {
  editor: null,
};

export default injectIntl(ImageMenu);
