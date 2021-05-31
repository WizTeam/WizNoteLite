import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import trim from 'lodash/trim';
import debounce from 'lodash/debounce';
import { withSnackbar } from 'notistack';
import SplitPane from '../thirdparty/react-split-pane';
//
import NoteList from '../components/NoteList';
import Content from '../components/Content';
import CommonHeader from '../components/CommonHeader';
import SideBar from '../components/SideBar';
import LiteText from '../components/LiteText';
import LoginDialog from '../dialogs/LoginDialog';
import UpgradeToVIPDialog from '../dialogs/UpgradeToVIPDialog';
import SettingDialog from '../dialogs/SettingDialog';
import { overwriteEditorConfig } from '../utils/utils';
import Icons from '../config/icons';

const styles = (theme) => ({
  app: {
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  toolbar: {
    '-webkit-app-region': 'drag',
    backgroundColor: 'transparent',
  },
  noteListContainer: {
    width: '100%',
    backgroundColor: theme.custom.background.noteList,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  smallNoteListContainer: {
    width: '20%',
  },
  noteListContainer_fullScreen: {
    width: 0,
    minWidth: 0,
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  contentMainContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  noteList: {
    // position: 'fixed',
    // width: noteListWidth,
    // maxWidth: noteListWidth,
    width: '100%',
    flex: 1,
    overflow: 'hidden',
  },
  footerBar: {
    margin: theme.spacing(0, 3),
    borderTop: `solid 1px ${theme.custom.color.hr}`,
    display: 'flex',
    alignItems: 'center',
  },
  matchedNotes: {
    fontSize: 12,
    color: theme.custom.color.matchedText,
    userSelect: 'none',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  sidebarIcon: {
    padding: theme.spacing(1),
    color: theme.custom.color.sidebarIcon,
  },
  drawerListItem: {
    color: theme.custom.color.drawerText,
  },
  header: {
    marginBottom: theme.spacing(1),
  },
  snackbarButton: {
    color: 'white',
    padding: 4,
  },
  snackbarButtonUpgrade: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    padding: 4,
    marginRight: 8,
  },
  splitPane: {
  },
  sidebarResizer: {
    margin: '0 -6px',
  },
  notelistResizer: {
    backgroundColor: `${theme.custom.background.content} !important`,
  },
});

const SNACKBAR_KEY = 'WizErrorPayedPersonalExpired';

class Main extends React.Component {
  handler = {
    handleToggleDrawer: async () => {
      let { showDrawer } = this.state;
      showDrawer = !showDrawer;
      this.setState({
        showDrawer,
      });
      // await window.wizApi.userManager.setUserSettings('showDrawer', showDrawer);
    },
    handleChangeType: async (type) => {
      this.setState({ type });
      await window.wizApi.userManager.setUserSettings('sideBar', type);
    },
    handleSync: async () => {
      try {
        await window.wizApi.userManager.syncKb(this.props.kbGuid, {
          manual: true,
        });
      } catch (err) {
        if (err.code === 'WizErrorNoAccount') {
          alert(err.message);
          if (this.props.onCreateAccount) {
            this.props.onCreateAccount();
          }
        }
      }
    },
    handleCreateNote: (noteType, markdown) => {
      const type = this.state.type;
      const { tag } = this.state;
      const note = {
        type: noteType,
        tag: type === 'tag' && tag?.key,
        markdown,
      };
      window.wizApi.userManager.createNote(this.props.kbGuid, note);
    },
    handleSelectNote: (currentNote) => {
      const isNullNote = currentNote === null;
      this.setState({ currentNote, isNullNote }, () => {
        window.wizApi.userManager.setUserSettings('lastNote', currentNote?.guid);
        this.getNoteLinks(currentNote?.title);
        this.getAllTitle();
      });

    },
    handleTagSelected: async (tag) => {
      this.setState({
        type: 'tag',
        tag,
      });
      const settings = {
        key: tag.key,
        title: tag.title,
      };
      await window.wizApi.userManager.setUserSettings('sideBar', 'tag');
      await window.wizApi.userManager.setUserSettings('selectedTag', settings);
    },
    handleChangeNotes: (notes, options) => {
      if (options?.searchText?.trim()) {
        this.setState({
          showMatched: true,
          matchedNotesCount: notes.length,
        });
      } else if (this.state.showMatched) {
        this.setState({
          showMatched: false,
        });
      }
    },
    handleShowLoginDialog: () => {
      this.setState({
        showLoginDialog: true,
      });
    },
    handleLoginDialogClose: () => {
      this.setState({
        showLoginDialog: false,
      });
    },
    handleShowSettingDialog: () => {
      this.setState({
        showSettingDialog: true,
      });
    },
    handleSettingDialogClose: () => {
      this.setState({
        showSettingDialog: false,
      });
    },
    handleClickTag: (text) => {
      const tagText = trim(trim(text), '#/');
      const lastChildIndex = tagText.lastIndexOf('/');
      let tagName;
      if (lastChildIndex === -1) {
        tagName = tagText;
      } else {
        tagName = tagText.substr(lastChildIndex + 1);
      }
      const tag = {
        key: tagText.toLowerCase(),
        title: tagName.toLowerCase(),
      };
      this.handler.handleTagSelected(tag);
    },
    handleFullScreen: () => {
      const isFullScreen = !window.wizApi.windowManager.isFullScreen();
      this.setState({
        isFullScreen,
      }, () => {
        window.wizApi.windowManager.toggleFullScreen();
      });
    },

    handleMenuItemClicked: (id) => {
      if (id === 'menuViewEditorOnly') {
        this.setState({ isFullScreen: true });
      } else if (id === 'menuViewEditorAndNotes') {
        this.setState({ isFullScreen: false, showDrawer: false });
      } else if (id === 'menuViewEditorAndNotesAndTags') {
        this.setState({ isFullScreen: false, showDrawer: true });
      } else if (id === 'newNote') {
        this.handler.handleCreateNote('lite/markdown');
      } else if (id === 'importMd') {
        this.handler.handleImportMarkdown();
      } else if (id === 'setting') {
        this.handler.handleShowSettingDialog();
      }
    },

    handleSyncFinish: (kbGuid, result, syncOptions) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
      const { intl, enqueueSnackbar, classes } = this.props;
      if (result.error) {
        const err = result.error;
        if (err.code === 'WizErrorInvalidPassword') {
          alert(this.props.intl.formatMessage({ id: 'errorInvalidPassword' }));
          this.props.onInvalidPassword();
          return;
        } else if (err.externCode === 'WizErrorPayedPersonalExpired') {
          this.showUpgradeVipMessage(true, syncOptions);
          return;
        } else if (err.externCode === 'WizErrorFreePersonalExpired') {
          this.showUpgradeVipMessage(false, syncOptions);
          return;
        }
        //
        console.error(err);
        //
        const message = intl.formatMessage({ id: 'errorSyncFailed' }, { message: err.message });
        enqueueSnackbar(message, {
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          },
          variant: 'error',
          key: 'WizErrorSync',
          action: (() => (
            <>
              <Button
                onClick={this.handler.handleViewLog}
                className={classNames(classes.snackbarButton, classes.snackbarButtonUpgrade)}
              >
                <FormattedMessage id="buttonViewLog" />
              </Button>
              <IconButton
                onClick={() => this.handler.handleCloseSnackbar('WizErrorSync')}
                className={classes.snackbarButton}
              >
                <Icons.CloseIcon />
              </IconButton>
            </>
          )),
        });
      } else if (result.failedNotes && result.failedNotes.length > 0) {
        //
        let notes = result.failedNotes;
        if (notes.length > 3) {
          notes = notes.slice(0, 3);
        }
        const titles = notes.join(', ');
        const message = intl.formatMessage({ id: 'errorNoteSyncFailed' }, { message: titles });
        enqueueSnackbar(message, {
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          },
          variant: 'error',
          key: 'WizErrorSyncNotes',
          action: (() => (
            <>
              <Button
                onClick={this.handler.handleViewLog}
                className={classNames(classes.snackbarButton, classes.snackbarButtonUpgrade)}
              >
                <FormattedMessage id="buttonViewLog" />
              </Button>
              <IconButton
                onClick={() => this.handler.handleCloseSnackbar('WizErrorSyncNotes')}
                className={classes.snackbarButton}
              >
                <Icons.CloseIcon />
              </IconButton>
            </>
          )),
        });
        //
      }
    },

    handleUpgradeVip: () => {
      const isLocalUser = window.wizApi.userManager.getCurrentUser().isLocalUser;
      if (isLocalUser) {
        this.handler.handleShowLoginDialog();
        return;
      }
      //
      this.props.closeSnackbar(SNACKBAR_KEY);
      this.setState({ showUpgradeToVipDialog: true });
    },

    handleCloseSnackbar: (key) => {
      this.props.closeSnackbar(key);
    },

    handleCloseUpgradeToVipDialog: () => {
      this.setState({ showUpgradeToVipDialog: false });
    },

    handleViewLog: () => {
      window.wizApi.userManager.viewLogFile();
    },
    handleSizeChange: debounce((type, size) => {
      window.wizApi.userManager.setUserSettings(`${type}Size`, size);
    }, 500),
    handleEditorConfigChange: (config) => {
      overwriteEditorConfig(config);
    },
    handleOrderByChange: (orderBy) => {
      this.setState({ orderBy });
    },
    handleDrag: async (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        if (files[i].name.endsWith('.md')) {
          console.log(files[i].path);
          const content = await window.wizApi.userManager.readToMarkdown(files[i].path);
          this.handler.handleCreateNote('lite/markdown', content);
        }
      }
    },
    handleDragover: (e) => {
      e.preventDefault();
    },
    handleImportMarkdown: async () => {
      const { kbGuid } = this.props;
      //
      try {
        const res = await window.wizApi.userManager.uploadMarkdown(kbGuid);
        for (let i = 0; i < res.length; i++) {
          await this.handler.handleCreateNote('lite/markdown', res[i]);
        }
      } catch (err) {
        alert(err.message);
      }
    },

  }

  sideBarSize = window.wizApi.userManager.getUserSettingsSync('sideBarSize', undefined);

  noteListSize = window.wizApi.userManager.getUserSettingsSync('noteListSize', undefined);

  constructor(props) {
    super(props);
    const um = window.wizApi.userManager;
    this.state = {
      type: um.getUserSettingsSync('sideBar', 'notes'),
      currentNote: null,
      isNullNote: false,
      showDrawer: um.getUserSettingsSync('showDrawer', false),
      tag: um.getUserSettingsSync('selectedTag', {}),
      matchedNotesCount: 0,
      showMatched: false,
      showLoginDialog: false,
      showUpgradeToVipDialog: false,
      showSettingDialog: false,
      backgroundType: window.wizApi.userManager.getUserSettingsSync('background', 'white'),
      isFullScreen: window.wizApi.windowManager.isFullScreen(),
      linkedList: [],
      titlesList: [],
      orderBy: um.getUserSettingsSync('orderBy', 'modified'),
    };
    this._upgradeVipDisplayed = false;
  }

  async componentDidMount() {
    const selectedNoteGuid = await window.wizApi.userManager.getUserSettings('lastNote');
    if (selectedNoteGuid) {
      try {
        const currentNote = await window.wizApi.userManager.getNote(
          this.props.kbGuid,
          selectedNoteGuid,
        );
        await this.getNoteLinks(currentNote.title);
        this.getAllTitle();
        // 等待编辑器加载完成。（否则可能会有错误发生）
        setTimeout(() => {
          this.setState({ currentNote });
        }, 500);
      } catch (err) {
        //
      }
    } else {
      this.setState({ isNullNote: true });
    }
    this.initEditorStyle();
    window.document.addEventListener('drop', this.handler.handleDrag);
    window.document.addEventListener('dragover', this.handler.handleDragover);
    window.wizApi.userManager.on('syncFinish', this.handler.handleSyncFinish);
    window.wizApi.userManager.on('menuItemClicked', this.handler.handleMenuItemClicked);
  }

  componentWillUnmount() {
    window.document.removeEventListener('drop', this.handler.handleDrag);
    window.document.removeEventListener('dragover', this.handler.handleDragover);
    window.wizApi.userManager.off('syncFinish', this.handler.handleSyncFinish);
    window.wizApi.userManager.off('menuItemClicked', this.handler.handleMenuItemClicked);
  }

  async getAllTitle() {
    const titlesList = await window.wizApi.userManager.getAllTitles(this.props.kbGuid);
    this.setState({
      titlesList,
    });
  }


  async getNoteLinks(title) {
    const res = await window.wizApi.userManager.getBackwardLinkedNotes(this.props.kbGuid, title);
    this.setState({
      linkedList: res,
    });
  }

  initEditorStyle() {
    const editorConfig = window.wizApi.userManager.getUserSettingsSync('editorConfig', {});
    overwriteEditorConfig(editorConfig);
  }

  showUpgradeVipMessage(isVipExpired, syncOptions) {
    const shouldShow = !this._upgradeVipDisplayed || syncOptions.manual;
    if (!shouldShow) {
      return;
    }
    this._upgradeVipDisplayed = true;
    //
    const { classes, intl, enqueueSnackbar } = this.props;

    const messageId = isVipExpired ? 'errorVipExpiredSync' : 'errorUpgradeVipSync';
    const message = intl.formatMessage({ id: messageId });
    //
    const buttonMessageId = isVipExpired ? 'buttonRenewVip' : 'buttonUpgradeVip';
    const buttonMessage = intl.formatMessage({ id: buttonMessageId });
    //
    enqueueSnackbar(message, {
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center',
      },
      variant: 'error',
      persist: true,
      key: SNACKBAR_KEY,
      action: (() => (
        <>
          <Button
            onClick={this.handler.handleUpgradeVip}
            className={classNames(classes.snackbarButton, classes.snackbarButtonUpgrade)}
          >
            {buttonMessage}
          </Button>
          <IconButton
            onClick={() => this.handler.handleCloseSnackbar(SNACKBAR_KEY)}
            className={classes.snackbarButton}
          >
            <Icons.CloseIcon />
          </IconButton>
        </>
      )),
    });
  }

  //
  render() {
    const {
      classes, kbGuid, onInvalidPassword, intl,
      user, mergeLocalAccount,
    } = this.props;
    const {
      type,
      currentNote,
      showDrawer, orderBy,
      tag, matchedNotesCount, showMatched,
      backgroundType,
      showLoginDialog,
      showUpgradeToVipDialog,
      isFullScreen,
      titlesList, isNullNote,
      // showSettingDialog,
      showSettingDialog,
    } = this.state;

    const openSidebar = showDrawer && !isFullScreen;

    return (
      <div className={classes.app}>
        <SplitPane
          split="vertical"
          paneClassName={classes.splitPane}
          resizerClassName={classes.sidebarResizer}
          minSize={openSidebar ? 192 : 0}
          maxSize={openSidebar ? 320 : 0}
          paneEndStep={30}
          defaultSize={openSidebar ? this.sideBarSize : 0}
          onChange={(size) => {
            this.handler.handleSizeChange('sideBar', size);
          }}
          allowResize={openSidebar}
        >
          <SideBar
            kbGuid={kbGuid}
            type={type}
            user={user}
            open={openSidebar}
            onChangeType={this.handler.handleChangeType}
            onTagSelected={this.handler.handleTagSelected}
            onClickLogin={this.handler.handleShowLoginDialog}
            onClickSetting={this.handler.handleShowSettingDialog}
            selectedTag={tag}
            onUpgradeVip={this.handler.handleUpgradeVip}
          />
          <SplitPane
            split="vertical"
            paneClassName={classes.splitPane}
            resizerClassName={classes.notelistResizer}
            minSize={isFullScreen ? 0 : 300}
            maxSize={isFullScreen ? 0 : 480}
            defaultSize={isFullScreen ? 0 : this.noteListSize}
            onChange={(size) => {
              this.handler.handleSizeChange('noteList', size);
            }}
            allowResize={!isFullScreen}
          >
            <div className={classNames(
              classes.noteListContainer,
            )}
            >
              <CommonHeader
                showLogo={!showDrawer}
                showUserType={!showDrawer}
                className={classes.header}
                onUpgradeVip={this.handler.handleUpgradeVip}
              />
              <NoteList
                className={classes.noteList}
                selectedNoteGuid={currentNote?.guid}
                onCreateNote={this.handler.handleCreateNote}
                onSelectNote={this.handler.handleSelectNote}
                onRequestChangeType={this.handler.handleChangeType}
                onSync={this.handler.handleSync}
                onInvalidPassword={onInvalidPassword}
                onChangeType={this.handler.handleChangeType}
                onChangeNotes={this.handler.handleChangeNotes}
                onToggleDrawer={this.handler.handleToggleDrawer}
                orderBy={orderBy}
                kbGuid={kbGuid}
                type={type}
                tag={tag}
                backgroundType={backgroundType}
              />
              {showMatched && (
                <div className={classes.footerBar}>
                  <LiteText className={classes.matchedNotes}>
                    {intl.formatMessage({ id: 'matchedNotes' }, { num: matchedNotesCount })}
                  </LiteText>
                </div>
              )}
            </div>
            <div className={classes.contentContainer}>
              <div className={classes.contentMainContainer}>
                <Content
                  note={currentNote}
                  isNullNote={isNullNote}
                  onSelectNote={this.handler.handleSelectNote}
                  onCreateNote={this.handler.handleCreateNote}
                  linkedList={this.state.linkedList}
                  kbGuid={kbGuid}
                  user={user}
                  isSearch={showMatched}
                  isShowDrawer={showDrawer}
                  backgroundType={backgroundType}
                  onCreateAccount={this.handler.handleShowLoginDialog}
                  onClickTag={this.handler.handleClickTag}
                  onRequestFullScreen={this.handler.handleFullScreen}
                  titlesList={titlesList}
                />
              </div>
            </div>
          </SplitPane>
        </SplitPane>

        <LoginDialog
          open={showLoginDialog}
          mergeLocalAccount={mergeLocalAccount}
          onClose={this.handler.handleLoginDialogClose}
          onLoggedIn={this.props.onLoggedIn}
        />

        <UpgradeToVIPDialog
          open={showUpgradeToVipDialog}
          onClose={this.handler.handleCloseUpgradeToVipDialog}
        />

        <SettingDialog
          open={showSettingDialog}
          user={user}
          onClose={this.handler.handleSettingDialogClose}
          onEditorConfigChange={this.handler.handleEditorConfigChange}
          onOrderByChange={this.handler.handleOrderByChange}
          onLoggedIn={this.props.onLoggedIn}
          onColorThemeChange={this.props.onColorThemeChange}
        />
      </div>
    );
  }
}

Main.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  kbGuid: PropTypes.string,
  onCreateAccount: PropTypes.func,
  onInvalidPassword: PropTypes.func.isRequired,
  mergeLocalAccount: PropTypes.bool.isRequired,
  onLoggedIn: PropTypes.func.isRequired,
  enqueueSnackbar: PropTypes.func.isRequired,
  closeSnackbar: PropTypes.func.isRequired,
  onColorThemeChange: PropTypes.func.isRequired,
};

Main.defaultProps = {
  kbGuid: null,
  onCreateAccount: null,
};

export default withSnackbar(withStyles(styles)(injectIntl(Main)));
