import React from 'react';
import './App.css';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import queryString from 'query-string';
// v4.5.12 Document: https://formatjs.io/docs/react-intl
import { IntlProvider } from 'react-intl';
import { SnackbarProvider } from 'notistack';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'moment/locale/zh-tw';
import 'moment/locale/zh-hk';
import 'moment/locale/zh-mo';

import Login from './pages/Login';
import Main from './pages/Main';
import NoteViewer from './pages/NoteViewer';
import AboutDialog from './dialogs/AboutDialog';
import ThemeSwitcher from './components/ThemeSwitcher';
import localeMessages from './locale';
import { getLocale } from './utils/lang';
import { matchHotKey } from './utils/utils';
import { eventCenter, eventMap } from './utils/event';
import onlineApi from './OnlineApi';
import Icons from './config/icons';

if (window.navigator.userAgent.indexOf(' Electron/') === -1) {
  window.wizApi = onlineApi;
}

const styles = (/* theme */) => ({
  root: {
    width: '100%',
    height: '100vh',
  },
  snackbarIcon: {
    width: 16,
    paddingRight: 8,
  },
});

const locale = getLocale();

moment.locale(locale);
const messages = Object.assign(localeMessages.en, localeMessages[locale]);

class App extends React.Component {
  handler = {
    handleLoggedIn: (user) => {
      this.setState({
        currentUser: user,
        color: window.wizApi.userManager.getUserSettingsSync('colorTheme', 'default'),
      });
    },
    handleCreateAccount: () => {
      this.setState({ currentUser: null, mergeLocalAccount: true });
    },
    handleInvalidPassword: () => {
      this.setState({ currentUser: null, mergeLocalAccount: false });
    },

    handleLogout: () => {
      this.setState({
        currentUser: null,
        isAutoLogging: false,
      });
    },
    handleCloseAboutDialog: () => {
      this.setState({ showAboutDialog: false });
    },
    handleShowAboutDialog: (id) => {
      if (id !== 'menuShowAbout') {
        return;
      }
      this.setState({ showAboutDialog: true });
    },
    handleColorThemeChange: (color) => {
      this.setState({
        color,
      });
    },
    handlerShortcut: (event) => {
      if (matchHotKey('cmd+shift+F', event, '+')) {
        eventCenter.dispatch(eventMap.SEARCH);
      } else if (matchHotKey('cmd+alt+/', event, '+')) {
        eventCenter.dispatch(eventMap.STAR_NOTE);
      } else if (matchHotKey('cmd+alt+s', event, '+')) {
        eventCenter.dispatch(eventMap.SYNC);
      } else if (matchHotKey('cmd+alt+t', event, '+')) {
        eventCenter.dispatch(eventMap.FOCUS_MODE);
      } else if (matchHotKey('cmd+shift+j', event, '+')) {
        eventCenter.dispatch(eventMap.TYPEWRITER_MODE);
      } else if (matchHotKey('cmd+alt+c', event, '+')) {
        eventCenter.dispatch(eventMap.WORDS_NUMBER);
      } else if (matchHotKey('cmd+shift+o', event, '+')) {
        eventCenter.dispatch(eventMap.OUTLINE);
      } else if (matchHotKey('cmd+shift+w', event, '+')) {
        eventCenter.dispatch(eventMap.WIKILINK);
      }
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      isAutoLogging: true,
      mergeLocalAccount: false,
      showAboutDialog: false,
      color: 'default',
    };
    this.shouldAutoLogging = true;
    const params = queryString.parse(window.location.search);
    this._params = params;
    this._viewNote = params.kbGuid && params.noteGuid;
  }

  componentDidMount() {
    window.wizApi.userManager.on('logout', this.handler.handleLogout);
    window.wizApi.userManager.on('menuItemClicked', this.handler.handleShowAboutDialog);
    //
    const syncData = async (user) => {
      try {
        const um = window.wizApi.userManager;
        if (um.getCurrentUser().isLocalUser) {
          return;
        }
        //
        const _user = await um.refreshUserInfo();
        await um.syncKb(user.kbGuid, {
          noWait: true,
        });
        // eslint-disable-next-line no-param-reassign
        user.token = _user.token;
      } catch (err) {
        console.error(err);
      }
    };
    //
    if (this.shouldAutoLogging) {
      this.shouldAutoLogging = false;
      window.document.addEventListener('DOMContentLoaded', () => {
        window.wizApi.userManager.localLogin().then(async (user) => {
          if (user) {
            await syncData(user);
            this.setState({
              currentUser: user,
              isAutoLogging: false,
              mergeLocalAccount: !!user.isLocalUser,
              color: window.wizApi.userManager.getUserSettingsSync('colorTheme', 'default'),
            });
          } else {
            this.setState({ isAutoLogging: false });
          }
        });
      });
    }

    window.addEventListener('keydown', this.handler.handlerShortcut);
  }

  componentWillUnmount() {
    window.wizApi.userManager.off('logout', this.handler.handleLogout);
    window.wizApi.userManager.off('menuItemClicked', this.handler.handleShowAboutDialog);
  }

  //
  render() {
    const { classes } = this.props;
    const {
      currentUser, isAutoLogging, mergeLocalAccount,
      showAboutDialog, color,
    } = this.state;
    //
    const loggedIn = currentUser;
    const kbGuid = currentUser?.kbGuid;
    //
    if (!isAutoLogging) {
      window.document.body.className = window.document.body.className.replace('loading', '');
    }
    return (
      <ThemeSwitcher color={color}>
        <IntlProvider
          locale={locale}
          messages={messages}
        >
          <SnackbarProvider
            maxSnack={3}
            preventDuplicate
            classes={{
              anchorOriginTopCenter: 'snackbar-top-center',
            }}
            iconVariant={{
              error: <Icons.WarningIcon className={classes.snackbarIcon} />,
            }}
          >

            <div className={classes.root}>
              {!loggedIn && !isAutoLogging && (
                <Login
                  onLoggedIn={this.handler.handleLoggedIn}
                  mergeLocalAccount={mergeLocalAccount}
                />
              )}
              {loggedIn && !isAutoLogging && (
                this._viewNote
                  ? (
                    <NoteViewer
                      kbGuid={this._params.kbGuid}
                      noteGuid={this._params.noteGuid}
                      params={this._params}
                      showTableInline
                    />
                  )
                  : (
                    <Main
                      kbGuid={kbGuid}
                      user={currentUser}
                      onLoggedIn={this.handler.handleLoggedIn}
                      mergeLocalAccount={mergeLocalAccount}
                      onCreateAccount={this.handler.handleCreateAccount}
                      onInvalidPassword={this.handler.handleInvalidPassword}
                      onColorThemeChange={this.handler.handleColorThemeChange}
                    />
                  )
              )}
            </div>
            <AboutDialog
              open={showAboutDialog}
              onClose={this.handler.handleCloseAboutDialog}
            />
          </SnackbarProvider>
        </IntlProvider>
      </ThemeSwitcher>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(App);
