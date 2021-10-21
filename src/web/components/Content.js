import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles, withTheme } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
// import isBoolean from 'lodash/isBoolean';
import CommonHeader from './CommonHeader';
import NoteEditor from './NoteEditor';
import ExportPngDialog from '../dialogs/ExportPngDialog';
import ExportPdfDialog from '../dialogs/ExportPdfDialog';
import Icons from '../config/icons';
import FocusButton from './FocusButton';
import SyncButton from './SyncButton';
import Scrollbar from './Scrollbar';
import WordCounterButton from './WordCounterButton';
import EditorContents from './editor/markdown/EditorContents';
import LinkMenu from './LinkMenu';
import LiteMiddle from './LiteMiddle';
import { eventCenter, eventMap } from '../utils/event';

const styles = (theme) => ({
  main: {
    backgroundColor: theme.custom.background.content,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    // overflowX: 'hidden',
  },
  main_green: {
    backgroundColor: theme.custom.background.contentGreen,
  },
  main_yellow: {
    backgroundColor: theme.custom.background.contentYellow,
  },
  header: {
    top: 0,
    height: 24,
    width: '100%',
    zIndex: 100,
    background: 'transparent',
  },
  header_mac: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    // padding: theme.spacing(3),
  },
  toolBar: {
    display: 'flex',
    position: 'absolute',
    right: theme.spacing(3),
    top: theme.spacing(8),
    bottom: theme.spacing(3),
    flexDirection: 'column',
    zIndex: 10,
    pointerEvents: 'none',
  },
  toolBar_mac: {
    top: theme.spacing(4),
  },
  iconButton: {
    '&:not(:nth-last-child(1))': {
      marginBottom: theme.spacing(2),
    },
    '&:hover $icon': {
      color: theme.custom.color.contentToolIconHover,
    },
    pointerEvents: 'all',
    marginBottom: 8,
  },
  emptyBlock: {
    flex: 1,
  },
  icon: {
    width: theme.spacing(3),
    height: theme.spacing(3),
    color: theme.custom.color.contentToolIcon,
  },
  exportMenu: {
    // '& .MuiPaper-elevation8': {
    //   boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.31)',
    // },
    // '& .MuiList-padding': {
    //   paddingTop: 4,
    //   paddingBottom: 4,
    //   color: theme.custom.color.noteTypeButton,
    // },
    // '& .MuiListItem-gutters': {
    //   paddingLeft: theme.spacing(3),
    //   paddingRight: theme.spacing(3),
    // },
    // '& .MuiMenuItem-root': {
    //   paddingTop: theme.spacing(1),
    //   paddingBottom: theme.spacing(1),
    //   fontSize: 15,
    // },
    '& .Mui-disabled': {
      fontSize: 14,
      color: theme.custom.color.matchedText,
      opacity: 1,
    },
  },
  separator: {
    height: 1,
    backgroundColor: '#d8d8d8',
    margin: '4px 24px',
  },
  normalButton: {
    backgroundColor: 'transparent',
    color: theme.custom.color.forgetPasswordButton,
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.custom.color.forgetPasswordButton,
    },
  },
  noteNull: {
    fontSize: 12,
  },
  noteNullIcon: {
    width: 202,
    height: 'auto',
    marginBottom: theme.spacing(6),
    color: 'inherit',
  },
});

class Content extends React.Component {
  handler = {
    handleFullScreen: () => {
      this.props.onRequestFullScreen();
    },
    handleResize: () => {
      const isFullScreen = window.wizApi.windowManager.isFullScreen();
      if (isFullScreen !== this.state.isFullScreen) {
        this.setState({ isFullScreen });
      }
    },
    handleShowExportMenu: (e) => {
      this.setState({
        exportMenuAnchorEl: e.currentTarget,
      });
    },
    handleCloseExportMenu: () => {
      this.setState({
        exportMenuAnchorEl: null,
      });
    },
    handleShowContents: () => {
      this.setState({
        showEditorContents: true,
      });
    },
    handleCloseContents: () => {
      this.setState({
        showEditorContents: false,
      });
    },
    handleShowExportPngDialog: () => {
      this.handler.handleCloseExportMenu();
      //
      this.setState({ showExportPngDialog: true });
    },
    handleCloseExportPngDialog: () => {
      this.setState({ showExportPngDialog: false });
    },
    handleShowExportPdfDialog: () => {
      this.handler.handleCloseExportMenu();
      //
      this.setState({ showExportPdfDialog: true });
    },
    handleCloseExportPdfDialog: () => {
      this.setState({ showExportPdfDialog: false });
    },
    handleChangeEditorContents: (list) => {
      this.setState({
        contentsList: list,
      });
    },
    handleChangeEditorLink: (list) => {
      this.setState({
        linkList: list,
      });
    },
    handleContentsNodeClick: (item) => {
      const element = document.querySelector(`#${item.key}`);
      element.scrollIntoView({
        behavior: 'smooth',
      });
    },
    handleExportMarkdown: async () => {
      const { kbGuid, note } = this.props;
      //
      if (!note.guid) return;
      //
      this.handler.handleCloseExportMenu();
      //
      try {
        await window.wizApi.userManager.writeToMarkdown(kbGuid, note.guid, {});
      } catch (err) {
        alert(err.message);
      }
    },
    handleNoteLink: async (content, position) => {
      const title = content.name.trim();
      if (title) {
        const list = await window.wizApi.userManager.queryNotes(
          this.props.kbGuid,
          0,
          100,
          { title, analysisTags: true },
        );
        // console.log('list', list.filter((item) => item.tags));
        // const list = this.props.titlesList.filter((item) => item.title === title);
        if (!list?.length) {
          this.props.onCreateNote('lite/markdown', `# ${title}`);
        } else if (list.length === 1) {
          this.handler.handleSelectNote(list[0].guid);
        } else {
          this.setState({
            linkMenuPosition: position,
            linkMenuList: list,
          });
        }
      }
    },
    handleSelectNote: async (guid) => {
      const note = await window.wizApi.userManager.getNote(this.props.kbGuid, guid);
      this.props.onSelectNote(note);
    },

    handleMenuItemClicked: (id) => {
      if (id === 'exportPdf') {
        this.handler.handleShowExportPdfDialog();
      } else if (id === 'exportMd') {
        this.handler.handleExportMarkdown();
      }
    },

    handleSwitchContent: () => {
      if (this.editorContentRef.current && this.editorContentRef.current.setTab) {
        this.setState((state) => ({
          showEditorContents: !state.showEditorContents,
        }));
        this.editorContentRef.current.setTab('content');
      }
    },
    handleSwitchLink: () => {
      if (this.editorContentRef.current && this.editorContentRef.current.setTab) {
        this.setState((state) => ({
          showEditorContents: !state.showEditorContents,
        }));
        this.editorContentRef.current.setTab('link');
      }
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      isFullScreen: false,
      exportMenuAnchorEl: null,
      showExportPngDialog: false,
      showExportPdfDialog: false,
      showEditorContents: false,
      contentsList: [],
      linkList: [],
      linkMenuPosition: undefined,
      linkMenuList: [],
    };
    this.scrollContentRef = React.createRef();
    this.headerRef = React.createRef();
    this.editorContentRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.handler.handleResize);
    window.wizApi.userManager.on('menuItemClicked', this.handler.handleMenuItemClicked);

    eventCenter.on(eventMap.OUTLINE, this.handler.handleSwitchContent);
    eventCenter.on(eventMap.WIKILINK, this.handler.handleSwitchLink);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handler.handleResize);
    window.wizApi.userManager.off('menuItemClicked', this.handler.handleMenuItemClicked);
    eventCenter.off(eventMap.OUTLINE, this.handler.handleSwitchContent);
    eventCenter.off(eventMap.WIKILINK, this.handler.handleSwitchLink);
  }

  render() {
    const {
      note, kbGuid, classes,
      theme, backgroundType, onClickTag,
      intl, isNullNote, user,
    } = this.props;
    const {
      isFullScreen, exportMenuAnchorEl, showExportPngDialog,
      showExportPdfDialog, linkMenuPosition, linkMenuList,
    } = this.state;
    //
    const isLite = theme.palette.type !== 'dark';
    const backgroundColorClassName = `main_${backgroundType}`;
    const backgroundClass = isLite && (classes[backgroundColorClassName] ?? '');

    const isMac = window.wizApi.platform.isMac;
    const hasFullScreenButton = window.wizApi.isElectron && isMac;

    return (
      <main
        className={classNames(classes.main, backgroundClass)}
      >
        <CommonHeader
          systemButton
          className={classNames(classes.header, isMac && classes.header_mac)}
          onRequestFullScreen={this.props.onRequestFullScreen}
          ref={this.headerRef}
        />
        {!this.state.showEditorContents && note && (
        <div className={classNames(classes.toolBar, isMac && classes.toolBar_mac)}>
          {/* <IconButton className={classes.iconButton}>
            <Icons.MoreHorizIcon className={classes.icon} />
          </IconButton> */}
          {/* <IconButton className={classes.iconButton}>
            <Icons.TableContentIcon className={classes.icon} />
          </IconButton> */}
          {/* <IconButton className={classes.iconButton}>
            <Icons.LinkIcon className={classes.icon} />
          </IconButton> */}
          {hasFullScreenButton && (
          <IconButton className={classes.iconButton} onClick={this.handler.handleFullScreen}>
            {isFullScreen && <Icons.QuitFullScreenIcon className={classes.icon} />}
            {!isFullScreen && <Icons.FullScreenIcon className={classes.icon} />}
          </IconButton>
          )}
          <IconButton className={classes.iconButton} onClick={this.handler.handleShowContents}>
            <Icons.OutlineIcon className={classes.icon} />
          </IconButton>
          <IconButton className={classes.iconButton} onClick={this.handler.handleShowExportMenu}>
            <Icons.ExportIcon className={classes.icon} />
          </IconButton>
          <div className={classes.emptyBlock} />
          <WordCounterButton
            className={classes.iconButton}
            iconClassName={classes.icon}
            onCreateAccount={this.props.onCreateAccount}
            kbGuid={kbGuid}
            note={note}
          />
          <FocusButton className={classes.iconButton} iconClassName={classes.icon} />
          <SyncButton
            className={classes.iconButton}
            iconClassName={classes.icon}
            onCreateAccount={this.props.onCreateAccount}
            kbGuid={kbGuid}
            note={note}
          />
        </div>
        )}
        <div className={classes.content}>
          <Scrollbar ref={this.scrollContentRef}>
            {isNullNote && (
              <LiteMiddle className={classes.noteNull}>
                <Icons.NoteNullIcon className={classes.noteNullIcon} />
                <FormattedMessage id="tipNoteNull" />
              </LiteMiddle>
            )}
            <NoteEditor
              note={note}
              kbGuid={kbGuid}
              user={user}
              onClickTag={onClickTag}
              scrollbar={this.scrollContentRef.current ?? null}
              onUpdateContentsList={this.handler.handleChangeEditorContents}
              onUpdateLinkList={this.handler.handleChangeEditorLink}
              onSelectNote={this.props.onSelectNote}
              onCreateNote={this.props.onCreateNote}
              onClickNoteLink={this.handler.handleNoteLink}
              titlesList={this.props.titlesList}
            />
          </Scrollbar>
          <EditorContents
            ref={this.editorContentRef}
            contents={this.state.contentsList}
            open={note && this.state.showEditorContents}
            onClose={this.handler.handleCloseContents}
            onNodeClick={this.handler.handleContentsNodeClick}
            isShowDrawer={this.props.isShowDrawer}
            linkedList={this.props.linkedList}
            linkList={this.state.linkList}
            title={note?.title}
            onLinkedClick={this.handler.handleSelectNote}
            onLinkClick={this.handler.handleNoteLink}
          />
        </div>
        <Menu
          className={classes.exportMenu}
          getContentAnchorEl={null}
          anchorEl={exportMenuAnchorEl}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={!!exportMenuAnchorEl}
          onClose={this.handler.handleCloseExportMenu}
        >
          <MenuItem onClick={this.handler.handleShowExportPngDialog}>
            {intl.formatMessage({ id: 'exportPng' })}
          </MenuItem>
          <MenuItem onClick={this.handler.handleExportMarkdown}>
            {intl.formatMessage({ id: 'exportMd' })}
          </MenuItem>
          <MenuItem onClick={this.handler.handleShowExportPdfDialog}>
            {intl.formatMessage({ id: 'exportPdf' })}
          </MenuItem>
          {/* <MenuItem>
            {intl.formatMessage({ id: 'copySourceMarkdown' })}
          </MenuItem> */}
          {/* <div className={classes.separator} /> */}
          {/* <MenuItem disabled>
            {intl.formatMessage({ id: 'publishTo' })}
          </MenuItem> */}
          {/* <MenuItem
            disableRipple
            className={classes.normalButton}
          >
            {intl.formatMessage({ id: 'settingPublishPlatform' })}
          </MenuItem> */}
        </Menu>
        <ExportPngDialog
          open={showExportPngDialog}
          kbGuid={kbGuid}
          noteGuid={note?.guid ?? null}
          onClose={this.handler.handleCloseExportPngDialog}
        />
        <ExportPdfDialog
          open={showExportPdfDialog}
          kbGuid={kbGuid}
          noteGuid={note?.guid ?? null}
          onClose={this.handler.handleCloseExportPdfDialog}
        />
        <LinkMenu
          position={linkMenuPosition}
          list={linkMenuList}
          onClose={() => this.setState({
            linkMenuPosition: undefined,
          })}
          onClickLink={(item) => {
            this.handler.handleSelectNote(item.guid);
            this.setState({
              linkMenuPosition: undefined,
            });
          }}
        />
      </main>
    );
  }
}

Content.propTypes = {
  theme: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  kbGuid: PropTypes.string.isRequired,
  // isSearch: PropTypes.bool.isRequired,
  note: PropTypes.object,
  backgroundType: PropTypes.string,
  onCreateAccount: PropTypes.func.isRequired,
  onClickTag: PropTypes.func.isRequired,
  onRequestFullScreen: PropTypes.func.isRequired,
  linkedList: PropTypes.array.isRequired,
  isShowDrawer: PropTypes.bool,
  onSelectNote: PropTypes.func,
  onCreateNote: PropTypes.func,
  titlesList: PropTypes.array,
  isNullNote: PropTypes.bool,
};

Content.defaultProps = {
  note: null,
  backgroundType: 'white',
  isShowDrawer: false,
  onSelectNote: null,
  onCreateNote: null,
  titlesList: [],
  isNullNote: false,
};

export default withTheme(withStyles(styles)(injectIntl(Content)));
