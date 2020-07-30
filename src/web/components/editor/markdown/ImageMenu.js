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
        const scrollTop = scrollElement.scrollTop;
        setMenuPosition(undefined);
        scrollElement.scrollTo(0, scrollTop);
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

  function handleChangeImage(e) {
    const scrollTop = scrollElement.scrollTop;
    const range = document.createRange();
    range.setStartAfter(currentImageContainerElement);
    resetRange(range);
    props.onInsertImage(() => currentImageContainerElement.remove());
    scrollElement.scrollTo(0, scrollTop);
    e.preventDefault();
  }

  function handleDeleteImage(e) {
    currentImageContainerElement.remove();
    props.onSaveNote();
    e.preventDefault();
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
      <MenuItem onClick={(e) => handleChangeImage(e)}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'ImageMenuChange' })}</div>
        </div>
      </MenuItem>
      <MenuItem onClick={(e) => handleDeleteImage(e)}>
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
