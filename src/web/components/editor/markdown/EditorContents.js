import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Scrollbar from '../../Scrollbar';
import Icons from '../../../config/icons';
import TreeView from '../../TreeView';
import { filterParentElement, hasClass } from '../libs/dom_utils';

const useStyles = makeStyles(({ spacing, palette }) => ({
  editorContents: ({ contentsWidth }) => ({
    backgroundColor: palette.type === 'dark' ? '#333' : '#fff',
    display: 'none',
    width: contentsWidth,
    boxSizing: 'border-box',
    minWidth: 300,
    maxWidth: 448,
    flexShrink: 0,
    '&.active': {
      display: 'block',
    },
  }),
  fixed: () => ({
    position: 'fixed',
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: palette.type === 'dark' ? '#333333' : '#fafafa',
    boxShadow: '0px 1px 16px 0px rgba(0, 0, 0, 0.31)',
    opacity: 0.8,
    backdropFilter: 'blur(8px)',
  }),
  container: {
    padding: spacing(4, 2),
  },
  title: {
    borderBottom: `1px solid ${palette.type === 'dark' ? '#404040' : '#d8d8d8'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: palette.type === 'dark' ? '#969696' : '#aaaaaa',
    marginBottom: spacing(2),
  },
  icon: {
    width: '24px',
    height: '24px',
    color: palette.type === 'dark' ? '#969696' : '#aaa',
    '&:hover': {
      color: palette.type === 'dark' ? '#f0f0f0' : '#333',
    },
  },
  treeRoot: {
    backgroundColor: 'transparent',
  },
  listItem: {
    color: palette.type === 'dark' ? '#fff' : '#333',
    maxHeight: 32,
    '&:hover': {
      'background-color': 'transparent',
    },
    '&.Mui-selected, &.Mui-selected:hover': {
      backgroundColor: 'transparent',
    },
    paddingLeft: 0,
  },
  itemSelected: {
    backgroundColor: 'transparent',
  },
  itemText: {
    fontSize: 14,
  },
  openIcon: {
    color: palette.type === 'dark' ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)',
  },
  closeIcon: {
    color: palette.type === 'dark' ? '#fff' : '#000',
  },
}));

function EditorContents(props) {

  const classes = useStyles({
    contentsWidth: window.innerWidth / (props.isShowDrawer ? 5 : 4)
  });

  const [isFixed, setIsFixed] = useState(true);

  const { onClose } = props;

  useEffect(() => {
    function clickHandler(e) {
      if (
        onClose
        && props.open
        && isFixed
        && e.target
        && !filterParentElement(
          e.target,
          document.body,
          (dom) => hasClass(dom, classes.editorContents),
          true,
        )
      ) {
        onClose();
      }
    }
    document.addEventListener('click', clickHandler, true);
    return () => {
      document.removeEventListener('click', clickHandler, true);
    };
  }, [props.onClose, props.open, isFixed, classes.editorContents, onClose]);

  return (
    <div className={classNames(classes.editorContents, {
      active: props.open,
      [classes.fixed]: isFixed,
    })}
    >
      <Scrollbar>
        <div className={classes.container}>
          <div className={classes.title}>
            <span>{props.intl.formatMessage({ id: 'editorContents' })}</span>
            <div className={classes.titleBtnList}>
              <IconButton className={classes.iconButton} onClick={() => setIsFixed(!isFixed)}>
                {isFixed
                  ? <Icons.UnpinIcon className={classes.icon} />
                  : <Icons.PinIcon className={classes.icon} />}
              </IconButton>
              <IconButton className={classes.iconButton} onClick={props.onClose}>
                <ClearIcon className={classes.icon} />
              </IconButton>
            </div>
          </div>
          <div className={classes.contents}>
            <TreeView
              className={classes.treeRoot}
              itemClassName={classes.listItem}
              textClassName={classes.itemText}
              itemSelectedClassName={classes.itemSelected}
              onNodeClick={props.onNodeClick}
              openIcon={(
                <ArrowDropDownIcon className={classes.openIcon} />
              )}
              closeIcon={(
                <ArrowRightIcon className={classes.closeIcon} />
              )}
              data={props.contents}
              deep={0}
            />
          </div>
        </div>
      </Scrollbar>
    </div>
  );
}

EditorContents.propTypes = {
  intl: PropTypes.object.isRequired,
  contents: PropTypes.array.isRequired,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onNodeClick: PropTypes.func,
  isShowDrawer: PropTypes.bool,
};

EditorContents.defaultProps = {
  onClose: null,
  open: false,
  onNodeClick: null,
  isShowDrawer: false,
};

export default injectIntl(EditorContents);
