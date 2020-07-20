import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import trim from 'lodash/trim';
import { withSnackbar } from 'notistack';
//
import NoteList from '../components/NoteList';
import Content from '../components/Content';
import CommonHeader from '../components/CommonHeader';
import SideBar from '../components/SideBar';
import LiteText from '../components/LiteText';
import LoginDialog from '../dialogs/LoginDialog';
import UpgradeToVIPDialog from '../dialogs/UpgradeToVIPDialog';
// import SettingDialog from '../components/SettingDialog';
import Icons from '../config/icons';

const noteListWidth = '25%';

const styles = (theme) => ({
  app: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  toolbar: {
    '-webkit-app-region': 'drag',
    backgroundColor: 'transparent',
  },
  noteListContainer: {
    width: noteListWidth,
    minWidth: 300,
    maxWidth: 448,
    flexShrink: 0,
    backgroundColor: theme.custom.background.noteList,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    transition: theme.transitions.create('width'),
  },
  smallNoteListContainer: {
    width: '20%',
  },
  noteListContainer_fullScreen: {
    width: 0,
    minWidth: 0,
  },
  contentContainer: {
    flexGrow: 1,
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
      await window.wizApi.userManager.setUserSettings('showDrawer', showDrawer);
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
    handleCreateNote: (noteType) => {
      const type = this.state.type;
      const { tag } = this.state;
      const note = {
        type: noteType,
        tag: type === 'tag' && tag?.key,
      };
      window.wizApi.userManager.createNote(this.props.kbGuid, note);
    },
    handleSelectNote: (currentNote) => {
      this.setState({ currentNote });
      window.wizApi.userManager.setUserSettings('lastNote', currentNote?.guid);
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
        // showSettingDialog: true,
      });
    },
    handleSettingDialogClose: () => {
      this.setState({
        // showSettingDialog: false,
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

    handleSyncFinish: (kbGuid, result, syncOptions) => {
      if (kbGuid !== this.props.kbGuid) {
        return;
      }
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
        console.error(result.error);
        alert(result.error.message);
      }
    },

    handleUpgradeVip: () => {
      this.props.closeSnackbar(SNACKBAR_KEY);
      this.setState({ showUpgradeToVipDialog: true });
    },

    handleCloseSnackbar: () => {
      this.props.closeSnackbar(SNACKBAR_KEY);
    },

    handleCloseUpgradeToVipDialog: () => {
      this.setState({ showUpgradeToVipDialog: false });
    },
  }

  constructor(props) {
    super(props);
    const um = window.wizApi.userManager;
    this.state = {
      type: um.getUserSettingsSync('sideBar', 'notes'),
      currentNote: null,
      showDrawer: um.getUserSettingsSync('showDrawer', false),
      tag: um.getUserSettingsSync('selectedTag', {}),
      matchedNotesCount: 0,
      showMatched: false,
      showLoginDialog: false,
      showUpgradeToVipDialog: false,
      // showSettingDialog: false,
      backgroundType: window.wizApi.userManager.getUserSettingsSync('background', 'white'),
      isFullScreen: window.wizApi.windowManager.isFullScreen(),
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
        // 等待编辑器加载完成。（否则可能会有错误发生）
        setTimeout(() => {
          this.setState({ currentNote });
        }, 500);
      } catch (err) {
        //
      }
    }
    window.wizApi.userManager.on('syncFinish', this.handler.handleSyncFinish);
  }

  componentWillUnmount() {
    window.wizApi.userManager.off('syncFinish', this.handler.handleSyncFinish);
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
          <Button onClick={this.handler.handleUpgradeVip} className={classes.snackbarButton}>
            {buttonMessage}
          </Button>
          <IconButton onClick={this.handler.handleCloseSnackbar} className={classes.snackbarButton}>
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
      showDrawer,
      tag, matchedNotesCount, showMatched,
      backgroundType,
      showLoginDialog,
      showUpgradeToVipDialog,
      isFullScreen,
      // showSettingDialog,
    } = this.state;
    return (
      <div className={classes.app}>
        <SideBar
          kbGuid={kbGuid}
          type={type}
          user={user}
          open={showDrawer && !isFullScreen}
          onChangeType={this.handler.handleChangeType}
          onTagSelected={this.handler.handleTagSelected}
          onClickLogin={this.handler.handleShowLoginDialog}
          onClickSetting={this.handler.handleShowSettingDialog}
          selectedTag={tag}
        />
        <div className={classNames(
          classes.noteListContainer,
          showDrawer && classes.smallNoteListContainer,
          isFullScreen && classes.noteListContainer_fullScreen,
        )}
        >
          <CommonHeader showLogo={!showDrawer} className={classes.header} />
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
              kbGuid={kbGuid}
              isSearch={showMatched}
              backgroundType={backgroundType}
              onCreateAccount={this.handler.handleShowLoginDialog}
              onClickTag={this.handler.handleClickTag}
              onRequestFullScreen={this.handler.handleFullScreen}
            />
          </div>
        </div>

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

        {/* <SettingDialog
          open={showSettingDialog}
          user={user}
          onClose={this.handler.handleSettingDialogClose}
        /> */}
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
};

Main.defaultProps = {
  kbGuid: null,
  onCreateAccount: null,
};

export default withSnackbar(withStyles(styles)(injectIntl(Main)));
