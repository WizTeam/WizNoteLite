import React, { useState, useEffect, useRef } from 'react';
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

function ImageMenu(props) {
  const classes = useStyles();

  const { intl } = props;

  const [menuPosition, setMenuPosition] = useState(undefined);

  const currentImageContainerElementRef = useRef();
  const scrollElementRef = useRef();

  useEffect(() => {
    function handleMouseDown(e) {
      if (e.button === 2 && e.target.tagName === 'IMG') {
        currentImageContainerElementRef.current = filterParentElement(e.target, props.editor.vditor.element, (dom) => hasClass(dom, 'vditor-ir__node'));
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
        const scrollTop = scrollElementRef.current.scrollTop;
        setMenuPosition(undefined);
        scrollElementRef.current.scrollTo(0, scrollTop);
      }
    }

    if (props.editor?.vditor.element) {
      scrollElementRef.current = getScrollContainer(props.editor.vditor.element);

      window.addEventListener('mousedown', handleMouseDown);
    }
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [menuPosition, props.editor, classes.menuRoot]);

  function handleChangeImage(e) {
    const scrollTop = scrollElementRef.current.scrollTop;
    const range = document.createRange();
    range.setStartAfter(currentImageContainerElementRef.current);
    resetRange(range);
    props.onInsertImage(() => currentImageContainerElementRef.current.remove());
    scrollElementRef.current.scrollTo(0, scrollTop);
    e.preventDefault();
    setMenuPosition(undefined);
  }

  function handleDeleteImage(e) {
    currentImageContainerElementRef.current.remove();
    props.onSaveNote();
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
      <MenuItem onClick={handleChangeImage}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'imageMenuChange' })}</div>
        </div>
      </MenuItem>
      <MenuItem onClick={handleDeleteImage}>
        <div className={classes.menuItem}>
          <div className={classes.menuName}>{intl.formatMessage({ id: 'imageMenuDelete' })}</div>
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
