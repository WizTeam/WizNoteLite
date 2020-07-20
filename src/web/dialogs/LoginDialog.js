import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
//
import LiteInput from '../components/LiteInput';
import LiteText from '../components/LiteText';
import Icons from '../config/icons';

const styles = (theme) => ({
  root: {
    padding: `${theme.spacing(4)}px !important`,
    width: 350,
    boxSizing: 'border-box',
  },
  normalFontSize: {
    fontSize: 14,
  },
  normalFontWeight: {
    fontWeight: 'normal',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(10),
  },
  grow: {
    flexGrow: 1,
  },
  input: {
    width: '100%',
    height: 40,
    marginTop: theme.spacing(2),
  },
  handle: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(4),
  },
  oAuth: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 45,
  },
  declare: {
    width: '100%',
    fontSize: 12,
    minHeight: 34,
    color: theme.custom.color.dialogText,
    marginTop: 50,
    textAlign: 'center',
    transition: theme.transitions.create('color'),
    userSelect: 'none',
    '&:hover': {
      color: theme.custom.color.dialogTextHover,
    },
    '& a': {
      color: 'inherit',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 12,
    color: theme.custom.color.contentToolIcon,
    userSelect: 'none',
    '&:hover': {
      color: theme.custom.color.contentToolIconHover,
    },
    '& .MuiIconButton-root': {
      padding: 6,
      borderRadius: 0,
    },
  },
  textOr: {
    marginRight: 34,
    userSelect: 'none',
    color: theme.custom.color.dialogText,
  },
  tabButton: {
    color: theme.custom.color.dialogButton,
  },
  activeTab: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: theme.custom.background.dialogButtonBlack,
    color: theme.custom.color.dialogButtonBlack,
    borderRadius: 0,
    minWidth: 112,
    '&:hover': {
      backgroundColor: theme.custom.background.dialogButtonBlackHover,
    },
  },
  loginButtonActive: {
    backgroundColor: theme.custom.background.dialogButtonBlackHover,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    '& .MuiSvgIcon-root': {
      width: theme.spacing(6),
      height: theme.spacing(6),
    },
  },
  name: {
    fontSize: 16,
    fontWeight: 'normal',
    letterSpacing: 1,
    color: theme.custom.color.logoName,
    marginLeft: theme.spacing(1),
    userSelect: 'none',
  },
  forgetButton: {
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.custom.color.forgetPasswordButton,
    },
  },
  backdrop: {
    backgroundColor: 'transparent',
    transition: 'unset !important',
  },
  scrollPaper: {
    transition: 'unset !important',
  },
  disabled: {
    color: `${theme.custom.color.dialogButtonBlack}52 !important`,
  },
  serverButton: {
    color: theme.custom.color.noteTitle,
    padding: 0,
    lineHeight: 1,
    textTransform: 'unset',
    fontSize: 14,
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:active': {
      backgroundColor: 'transparent',
    },
  },
  menuIcon: {
    height: 24,
    width: 24,
    marginRight: 12,
  },
  menuItem: {
    fontSize: 15,
  },
});

const SERVER_TYPE_DEFAULT = 'default';
const SERVER_TYPE_PRIVATE = 'private';
const DEFAULT_SERVER = 'https://as.wiz.cn';

class LoginDialog extends React.Component {
  handler = {
    handleChangeType: (type) => {
      if (type !== this.state.type) {
        this.setState({
          type,
          userIdErrorText: '',
          passwordErrorText: '',
          serverErrorText: '',
        });
      }
    },
    handleValueChange: (e, key) => {
      const val = e.target.value;
      //
      const checkLoginStatus = () => {
        if (this.validInput(true)) {
          this.setState({ validActive: true });
        } else {
          this.setState({ validActive: false });
        }
      };
      //
      if (key === 'userId') {
        this.setState({
          userIdValue: val,
          userIdErrorText: '',
        }, checkLoginStatus);
      }
      if (key === 'password') {
        this.setState({
          passwordValue: val,
          passwordErrorText: '',
        }, checkLoginStatus);
      }
      if (key === 'server') {
        this.setState({
          privateServerValue: val,
          serverErrorText: '',
        }, checkLoginStatus);
      }
    },
    handleLogin: async () => {
      const {
        serverType, privateServerValue, userIdValue, passwordValue,
      } = this.state;
      const { mergeLocalAccount } = this.props;
      if (!this.validInput()) return;
      //
      try {
        this.setState({ loading: true });
        //
        const server = serverType === SERVER_TYPE_DEFAULT ? DEFAULT_SERVER : privateServerValue;
        const loginOptions = {
          autoLogin: true,
          mergeLocalAccount,
        };
        const user = await window.wizApi.userManager.onlineLogin(server, userIdValue,
          passwordValue, loginOptions);
        //
        window.wizApi.userManager.syncKb(user.kbGuid, {
          noWait: true,
          downloadFirst: true,
        });
        this.setState({ loading: false });
        this.props.onLoggedIn(user);
        if (this.props.onClose) {
          this.props.onClose();
        }
      } catch (err) {
        this.processServerError(err, false);
      }
    },
    handleRegister: async () => {
      this.validInput();
      const {
        serverType, privateServerValue, userIdValue, passwordValue,
      } = this.state;
      const { mergeLocalAccount } = this.props;
      if (!this.validInput()) return;
      //
      try {
        this.setState({ loading: true });
        //
        const server = serverType === SERVER_TYPE_DEFAULT ? DEFAULT_SERVER : privateServerValue;
        const user = await window.wizApi.userManager.signUp(
          server,
          userIdValue,
          passwordValue,
          {
            autoLogin: true,
            mergeLocalAccount,
          },
        );
        this.props.onLoggedIn(user);
        if (this.props.onClose) {
          this.props.onClose();
        }
        this.setState({ loading: false });
      } catch (err) {
        this.processServerError(err, true);
      }
    },
    handleEnter: () => {
      const { type, loading } = this.state;
      if (loading) return;
      if (type === 'login') this.handler.handleLogin();
      if (type === 'register') this.handler.handleRegister();
    },

    handleShowServerTypeMenu: (event) => {
      this.setState({
        serverMenuAnchorEl: event.currentTarget,
      });
    },

    handleCloseServerMenu: () => {
      this.setState({
        serverMenuAnchorEl: null,
      });
    },

    handleSelectDefaultServer: () => {
      this.setState({
        serverType: SERVER_TYPE_DEFAULT,
        serverMenuAnchorEl: null,
      });
    },

    handleSelectPrivateServer: () => {
      this.setState({
        serverType: SERVER_TYPE_PRIVATE,
        serverMenuAnchorEl: null,
      });
    },

    handleForgotPassword: () => {
      const { serverType, privateServerValue } = this.state;
      if (serverType === SERVER_TYPE_PRIVATE && privateServerValue) {
        window.open(`${privateServerValue}/login#forgot`);
      } else {
        window.open(`https://www.wiz.cn/login#forgot`);
      }
    },
  };

  passwordRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      type: 'login',
      userIdValue: '',
      passwordValue: '',
      loading: false,
      validActive: false,
      serverType: SERVER_TYPE_DEFAULT,
      userIdErrorText: '',
      passwordErrorText: '',
      serverErrorText: '',
      privateServerValue: '',
      serverMenuAnchorEl: null,
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  validInput(disableError = false) {
    const {
      userIdValue, passwordValue, serverType, privateServerValue,
    } = this.state;
    const { intl } = this.props;
    //
    if (!userIdValue.trim()) {
      if (!disableError) {
        this.setState({ userIdErrorText: intl.formatMessage({ id: 'inputUserIdNullError' }) });
      }
      return false;
    }

    if (!passwordValue.trim()) {
      if (!disableError) {
        this.setState({ passwordErrorText: intl.formatMessage({ id: 'inputPasswordNullError' }) });
      }
      return false;
    }

    if (serverType === SERVER_TYPE_PRIVATE) {
      if (!privateServerValue.trim()) {
        if (!disableError) {
          this.setState({ serverErrorText: intl.formatMessage({ id: 'inputServerNullError' }) });
        }
        return false;
      }
    }

    return true;
  }

  processServerError(err, isSignUp) {
    const { intl } = this.props;
    const { serverType } = this.state;
    const state = {
      userIdErrorText: '',
      passwordErrorText: '',
      serverErrorText: '',
    };
    if (err.code === 31001) {
      //
      state.userIdErrorText = intl.formatMessage({ id: 'errorInvalidUserId' });
      //
    } else if (err.code === 31002) {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorInvalidPassword' });
      //
    } else if (err.code === 31004 || err.code === 31005) {
      //
      state.passwordErrorText = intl.formatMessage({ id: `error${err.code}` });
      //
    } else if (err.code === 332) {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorMaxTimesForIP' });
      //
    } else if (err.code === 429) {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorFrequentOverflow' });
      //
    } else if (err.code === 31000) {
      //
      state.userIdErrorText = intl.formatMessage({ id: 'errorUserExists' });
      //
    } else if (err.code === 322) {
      //
      state.userIdErrorText = intl.formatMessage({ id: 'errorUserIdFormat' });
      //
    } else if (err.externCode === 'WizErrorLicenceCount' || err.externCode === 'WizErrorLicenseCount') {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorLicenseUserLimit' });
      //
    } else if (err.externCode === 'WizErrorLicenceYear') {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorLicenseExpired' });
      //
    } else if (err.externCode === 'WizErrorDisableRegister') {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorDisableRegister' });
      //
    } else if (err.externCode === 'WizErrorUpdateServer') {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorUpdateServer' });
      //
    } else if (err.externCode === 'WizErrorUnknownServerVersion') {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorUnknownServerVersion' }, {
        message: err.message,
      });
      //
    } else if (err.code === 'WizErrorNetwork') {
      //
      state.passwordErrorText = intl.formatMessage({ id: 'errorNetwork' }, {
        message: err.message,
      });
      //
    } else if (err.isNetworkError && serverType === SERVER_TYPE_PRIVATE) {
      //
      state.serverErrorText = intl.formatMessage({ id: `errorServer` }, { message: err.message });
      //
    } else {
      // eslint-disable-next-line no-lonely-if
      if (isSignUp) {
        state.passwordErrorText = intl.formatMessage({ id: 'errorSignUp' }, { message: err.message });
      } else {
        alert(err.message);
        return;
      }
    }
    //
    this.setState({
      loading: false,
      ...state,
    });
  }

  render() {
    const {
      classes, open, intl,
      onClose, disableCloseListener,
      disableBackdrop,
    } = this.props;
    const {
      type, userIdValue, passwordValue, loading,
      passwordErrorText, userIdErrorText,
      validActive, serverType,
      serverMenuAnchorEl,
      serverErrorText, privateServerValue,
    } = this.state;
    //
    const isDefaultServer = serverType === SERVER_TYPE_DEFAULT;
    const serverTypeText = intl.formatMessage({
      id: isDefaultServer ? 'serverTypeDefault' : 'serverTypePrivate',
    });

    return (
      <Dialog
        open={open}
        onEscapeKeyDown={disableCloseListener ? null : onClose}
        BackdropProps={{
          classes: {
            root: disableBackdrop ? classes.backdrop : '',
          },
        }}
        classes={{
          scrollPaper: disableBackdrop ? classes.scrollPaper : '',
        }}
      >
        <DialogContent className={classes.root}>
          <div className={classes.header}>
            <div className={classes.logo}>
              <Icons.LiteLogoIcon />
            </div>
            <div className={classes.grow} />
            <Button
              onClick={() => this.handler.handleChangeType('login')}
              className={classNames(classes.tabButton, classes.normalFontSize, classes.normalFontWeight, type === 'login' && classes.activeTab)}
            >
              {intl.formatMessage({ id: 'tabLogin' })}
            </Button>
            <Button
              onClick={() => this.handler.handleChangeType('register')}
              className={classNames(classes.tabButton, classes.normalFontSize, classes.normalFontWeight, type === 'register' && classes.activeTab)}
            >
              {intl.formatMessage({ id: 'tabRegister' })}
            </Button>
          </div>
          <Button
            color="primary"
            className={classes.serverButton}
            endIcon={<Icons.ArrowDropDownIcon />}
            disableRipple
            onClick={this.handler.handleShowServerTypeMenu}
          >
            {serverTypeText}
          </Button>
          <LiteInput
            error={Boolean(userIdErrorText)}
            helperText={userIdErrorText}
            disabled={loading}
            placeholder={intl.formatMessage({ id: 'placeholderUserId' })}
            className={classes.input}
            value={userIdValue}
            onChange={(e) => this.handler.handleValueChange(e, 'userId')}
            onEnter={() => {
              if (this.passwordRef) {
                this.passwordRef.current.focus();
              }
            }}
          />
          <LiteInput
            inputRef={this.passwordRef}
            error={Boolean(passwordErrorText)}
            helperText={passwordErrorText}
            disabled={loading}
            placeholder={intl.formatMessage({ id: 'placeholderUserPassword' })}
            type="password"
            className={classes.input}
            value={passwordValue}
            onChange={(e) => this.handler.handleValueChange(e, 'password')}
            onEnter={this.handler.handleEnter}
          />

          {!isDefaultServer && (
            <LiteInput
              error={Boolean(serverErrorText)}
              helperText={serverErrorText}
              disabled={loading}
              placeholder={intl.formatMessage({ id: 'placeholderPrivateServer' })}
              className={classes.input}
              value={privateServerValue}
              onChange={(e) => this.handler.handleValueChange(e, 'server')}
              onEnter={this.handler.handleEnter}
            />
          )}

          {type === 'login' && (
            <>
              <div className={classes.handle}>
                <Button
                  disabled={loading}
                  className={classNames(
                    classes.loginButton,
                    classes.normalFontSize,
                    classes.normalFontWeight,
                    validActive && classes.loginButtonActive,
                  )}
                  classes={{
                    disabled: classes.disabled,
                  }}
                  onClick={this.handler.handleLogin}
                >
                  {intl.formatMessage({ id: 'buttonLogin' })}
                </Button>
                <Button
                  disableRipple
                  className={classNames(
                    classes.normalFontSize,
                    classes.normalFontWeight,
                    classes.forgetButton,
                  )}
                  onClick={this.handler.handleForgotPassword}
                >
                  {intl.formatMessage({ id: 'buttonForgetPassword' })}
                </Button>
              </div>
              <div className={classes.declare}>
                <LiteText fullWidth={false}>Powered by WizNote</LiteText>
              </div>
            </>
          )}
          {type === 'register' && (
            <>
              <div className={classes.handle}>
                <Button
                  fullWidth
                  disabled={loading}
                  className={classNames(
                    classes.loginButton,
                    classes.normalFontSize,
                    classes.normalFontWeight,
                    validActive && classes.loginButtonActive,
                  )}
                  classes={{
                    disabled: classes.disabled,
                  }}
                  onClick={this.handler.handleRegister}
                >
                  {intl.formatMessage({ id: 'buttonRegister' })}
                </Button>
              </div>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: intl.formatMessage({ id: 'registerDeclare' }) }}
                className={classNames('MuiTypography-body2', classes.declare)}
              />
            </>
          )}
          {!disableCloseListener && (
            <div className={classes.close}>
              <IconButton color="inherit" onClick={onClose}>
                <Icons.ClearIcon />
              </IconButton>
            </div>
          )}
        </DialogContent>
        <Menu
          getContentAnchorEl={null}
          anchorEl={serverMenuAnchorEl}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          // transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          open={!!serverMenuAnchorEl}
          onClose={this.handler.handleCloseServerMenu}
        >
          <MenuItem
            className={classes.menuItem}
            onClick={this.handler.handleSelectDefaultServer}
          >
            <div className={classes.menuIcon}>
              {isDefaultServer && (<Icons.SelectedIcon />)}
            </div>
            <FormattedMessage id="serverTypeDefault" />
          </MenuItem>
          <MenuItem
            className={classes.menuItem}
            onClick={this.handler.handleSelectPrivateServer}
          >
            <div className={classes.menuIcon}>
              {!isDefaultServer && (<Icons.SelectedIcon />)}
            </div>
            <FormattedMessage id="serverTypePrivate" />
          </MenuItem>
        </Menu>
      </Dialog>
    );
  }
}

LoginDialog.propTypes = {
  intl: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  disableCloseListener: PropTypes.bool,
  disableBackdrop: PropTypes.bool,
  mergeLocalAccount: PropTypes.bool.isRequired,
  onLoggedIn: PropTypes.func.isRequired,
};

LoginDialog.defaultProps = {
  onClose: null,
  disableCloseListener: false,
  disableBackdrop: false,
};

export default withStyles(styles)(injectIntl(LoginDialog));
