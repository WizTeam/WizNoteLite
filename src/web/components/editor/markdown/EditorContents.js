import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Collapse from '@material-ui/core/Collapse';
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
    fontSize: '14px',
    color: palette.type === 'dark' ? '#969696' : '#aaaaaa',
    marginBottom: spacing(2),
  },
  tabList: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  tabItem: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: palette.type === 'dark' ? '#969696' : '#aaaaaa',
    '&.active': {
      color: palette.type === 'dark' ? '#f0f0f0' : '#333',
    },
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
      backgroundColor: 'transparent',
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
  linkListLabel: {
    display: 'flex',
    fontSize: 14,
    color: palette.type === 'dark' ? '#fff' : '#333',
  },
  collapseContainer: {
    paddingLeft: 22,
    paddingRight: 22,
  },
  linkInfo: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  noLink: {
    color: '#aaa',
    fontSize: 12,
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    lineHeight: 1,
    '&:hover': {
      color: '#000',
      '& .content': {
        borderBottom: '1px solid #448aff',
      },
    },
  },
  linkItemContent: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    color: '#448aff',
    fontSize: 14,
    lineHeight: '20px',
    borderBottom: '1px solid transparent',
  },
  linkItemIcon: {
    marginRight: 5,
    color: '#448aff',
    paddingTop: 5,
  },
  groupMargin: {
    marginTop: 50,
  },
}));

function EditorContents(props) {
  const classes = useStyles({
    contentsWidth: window.innerWidth / (props.isShowDrawer ? 5 : 4),
  });

  const [isFixed, setIsFixed] = useState(true);
  const [tab, setTab] = useState('content');

  const [linkListOpen, setLinkListOpen] = useState(true);
  const [linkedListOpen, setLinkedListOpen] = useState(true);

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

  const linkList = [...new Set(props.linkList)];
  return (
    <div className={classNames(classes.editorContents, {
      active: props.open,
      [classes.fixed]: isFixed,
    })}
    >
      <Scrollbar>
        <div className={classes.container}>
          <div className={classes.title}>
            <div className={classes.tabList}>
              <button
                type="button"
                className={classNames(classes.tabItem, {
                  active: tab === 'content',
                })}
                onClick={() => setTab('content')}
              >
                {props.intl.formatMessage({ id: 'editorContents' })}
              </button>
              <button
                type="button"
                className={classNames(classes.tabItem, {
                  active: tab === 'link',
                })}
                onClick={() => setTab('link')}
              >
                {props.intl.formatMessage({ id: 'editorLink' })}
              </button>
            </div>
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
            {tab === 'content' ? (
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
            ) : (
              <div className={classes.linkContainer}>
                <div
                  aria-hidden
                  onClick={() => setLinkListOpen((value) => !value)}
                  className={classes.linkListLabel}
                  role="button"
                >
                  {linkListOpen ? (
                    <ArrowDropDownIcon className={classes.openIcon} />
                  ) : (
                    <ArrowRightIcon className={classes.closeIcon} />
                  )}
                  <span>{props.intl.formatMessage({ id: 'editorLinkLabel' })}</span>
                </div>
                <Collapse in={linkListOpen} timeout="auto" unmountOnExit>
                  <div className={classes.collapseContainer}>
                    <div className={classes.linkInfo}>{props.intl.formatMessage({ id: 'editorLinkInfo' })}</div>
                    {linkList.length ? linkList.map((item, index) => (
                      <div
                        className={classes.linkItem}
                        key={index.toString()}
                        aria-hidden
                        role="button"
                        onClick={
                          (e) => props.onLinkClick && props.onLinkClick(item, {
                            left: e.clientX,
                            top: e.clientY + 20,
                          })
                        }
                      >
                        <Icons.NoteIcon className={classes.linkItemIcon} />
                        <span className={classNames(classes.linkItemContent, 'content')}>{item}</span>
                      </div>
                    )) : (<span className={classes.noLink}>{props.intl.formatMessage({ id: 'editorLinkedNull' })}</span>)}
                  </div>
                </Collapse>

                <div
                  aria-hidden
                  onClick={() => setLinkedListOpen((value) => !value)}
                  className={classNames(classes.linkListLabel, classes.groupMargin)}
                  role="button"
                >
                  {linkedListOpen ? (
                    <ArrowDropDownIcon className={classes.openIcon} />
                  ) : (
                    <ArrowRightIcon className={classes.closeIcon} />
                  )}
                  <span>{props.intl.formatMessage({ id: 'editorLinkedLabel' })}</span>
                </div>
                <Collapse in={linkedListOpen} timeout="auto" unmountOnExit>
                  <div className={classes.collapseContainer}>
                    <div className={classes.linkInfo}>{props.intl.formatMessage({ id: 'editorLinkedInfo' }, { currentTitle: props.title })}</div>
                    {props.linkedList.length ? props.linkedList.map((item, index) => (
                      <div
                        aria-hidden
                        role="button"
                        className={classes.linkItem}
                        key={index.toString()}
                        onClick={
                          () => props.onLinkedClick && props.onLinkedClick(item.guid)
                        }
                      >
                        <Icons.NoteIcon className={classes.linkItemIcon} />
                        <span className={classNames(classes.linkItemContent, 'content')}>{item.title}</span>
                      </div>
                    )) : (<span className={classes.noLink}>{props.intl.formatMessage({ id: 'editorLinkedNull' })}</span>)}
                  </div>
                </Collapse>
              </div>
            )}

          </div>
        </div>
      </Scrollbar>
    </div>
  );
}

EditorContents.propTypes = {
  intl: PropTypes.object.isRequired,
  contents: PropTypes.array.isRequired,
  linkList: PropTypes.array.isRequired,
  linkedList: PropTypes.array.isRequired,
  title: PropTypes.string,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onNodeClick: PropTypes.func,
  isShowDrawer: PropTypes.bool,
  onLinkedClick: PropTypes.func,
  onLinkClick: PropTypes.func,
};

EditorContents.defaultProps = {
  onClose: null,
  open: false,
  onNodeClick: null,
  isShowDrawer: false,
  title: '',
  onLinkedClick: null,
  onLinkClick: null,
};

export default injectIntl(EditorContents);
