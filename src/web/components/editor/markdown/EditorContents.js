import React, { useState } from 'react';
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

const useStyles = makeStyles(({ spacing, palette }) => ({
  editorContents: ({ contentsWidth }) => ({
    backgroundColor: palette.type === 'dark' ? '#555555' : '#fff',
    display: 'none',
    width: contentsWidth,
    boxSizing: 'border-box',
    minWidth: 300,
    flexShrink: 0,
    '&.active': {
      display: 'block',
    },
  }),
  fixed: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: palette.type === 'dark' ? '#333333' : '#fafafa',
    boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.31)',
    opacity: 0.95,
  },
  container: {
    padding: spacing(4, 2),
  },
  title: {
    borderBottom: '1px solid #d8d8d8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#aaaaaa',
    marginBottom: spacing(2),
  },
  icon: {
    width: '24px',
    height: '24px',
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
    color: 'rgba(0, 0, 0, 0.54)',
  },
}));

function EditorContents(props) {
  const classes = useStyles({ contentsWidth: window.innerWidth / 4 });

  const [isFixed, setIsFixed] = useState(true);

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
                  ? <Icons.Unstop className={classes.icon} />
                  : <Icons.Stop className={classes.icon} />}
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
                <ArrowRightIcon />
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
};

EditorContents.defaultProps = {
  onClose: null,
  open: false,
  onNodeClick: null,
};

export default injectIntl(EditorContents);
