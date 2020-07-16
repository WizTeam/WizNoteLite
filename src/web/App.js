import React from 'react';
import './App.css';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import queryString from 'query-string';
// v4.5.12 Document: https://formatjs.io/docs/react-intl
import { IntlProvider } from 'react-intl';
import moment from 'moment';
import 'moment/locale/zh-cn';
import 'moment/locale/zh-tw';
import 'moment/locale/zh-hk';
import 'moment/locale/zh-mo';

import Login from './pages/Login';
import Main from './pages/Main';
import NoteViewer from './pages/NoteViewer';
import AboutDialog from './components/AboutDialog';
import ThemeSwitcher from './components/ThemeSwitcher';
import localeMessages from './locale';
import { getLocale } from './utils/lang';
import onlineApi from './OnlineApi';

if (window.navigator.userAgent.indexOf(' Electron/') === -1) {
  window.wizApi = onlineApi;
}

const styles = (/* theme */) => ({
  root: {
    width: '100%',
    height: '100vh',
  },
});

const locale = getLocale();
const langMap = {
  en: 'en',
  'zh-cn': 'zh-cn',
};
window.wizApi.init({
  lang: langMap[locale] ?? 'en',
});
window.wizApi.platform = {
  isMac: window.wizApi.isElectron && window.wizApi.windowManager.platform === 'darwin',
};

moment.locale(locale);
const messages = Object.assign(localeMessages.en, localeMessages[locale]);

class App extends React.Component {
  handler = {
    handleLoggedIn: (user) => {
      this.setState({ currentUser: user });
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
    handleShowAboutDialog: () => {
      this.setState({ showAboutDialog: true });
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      isAutoLogging: true,
      mergeLocalAccount: false,
      showAboutDialog: false,
    };
    this.shouldAutoLogging = true;
    const params = queryString.parse(window.location.search);
    this._params = params;
    this._viewNote = params.kbGuid && params.noteGuid;
  }

  componentDidMount() {
    window.wizApi.userManager.on('logout', this.handler.handleLogout);
    window.wizApi.userManager.on('showAbout', this.handler.handleShowAboutDialog);
  }

  //
  render() {
    const { classes } = this.props;
    const {
      currentUser, isAutoLogging, mergeLocalAccount,
      showAboutDialog,
    } = this.state;
    //
    const loggedIn = currentUser;
    const kbGuid = currentUser?.kbGuid;
    //
    if (this.shouldAutoLogging) {
      this.shouldAutoLogging = false;
      window.document.addEventListener('DOMContentLoaded', () => {
        window.wizApi.userManager.localLogin().then((user) => {
          if (user) {
            window.wizApi.userManager.syncKb(user.kbGuid, {
              noWait: true,
            });
            this.setState({
              currentUser: user,
              isAutoLogging: false,
              mergeLocalAccount: !!user.isLocalUser,
            });
          } else {
            this.setState({ isAutoLogging: false });
          }
        });
      });
    }

    if (!isAutoLogging) {
      window.document.body.className = window.document.body.className.replace('loading', '');
    }
    return (
      <ThemeSwitcher>
        <IntlProvider
          locale={locale}
          messages={messages}
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
                  />
                )
            )}
          </div>
          <AboutDialog
            open={showAboutDialog}
            onClose={this.handler.handleCloseAboutDialog}
          />
        </IntlProvider>
      </ThemeSwitcher>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(App);
