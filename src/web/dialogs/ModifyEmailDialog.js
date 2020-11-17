import React from 'react';
import PropTypes from 'prop-types';
// import classNames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
//
import LiteInput from '../components/LiteInput';
import LiteText from '../components/LiteText';
import LiteButton from '../components/LiteButton';
//
import Icons from '../config/icons';

const styles = (theme) => ({
  root: {
    width: 320,
    boxSizing: 'border-box',
    backgroundColor: theme.custom.background.noteListActive,
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
  title: {
    fontWeight: 600,
  },
  tip: {
    color: '#aaaaaa',
    fontSize: 12,
    marginTop: theme.spacing(1),
  },
  label: {
    marginTop: theme.spacing(2),
  },
  input: {
    marginTop: theme.spacing(1),
  },
  buttonBox: {
    margin: theme.spacing(2, 0),
    display: 'flex',
    flexDirection: 'row-reverse',
  },
});

class ModifyEmailDialog extends React.Component {
  handler = {
    handleSubmit: async () => {
      if (!this.vaildInput()) return false;
      //
      const { password, email } = this.state;
      const { user } = this.props;
      this.setState({ loading: true });

      try {
        await window.wizApi.userManager.changeAccount(password, user.userId, email);
        this.setState({ loading: false }, () => {
          window.wizApi.userManager.logout();
        });
      } catch (err) {
        this.processError(err);
      }

      return false;
    },
    handleInputChange: (type, value) => {
      this.setState({
        [type]: value,
        [`${type}ErrorText`]: '',
      });
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      password: '',
      email: '',
      passwordErrorText: '',
      emailErrorText: '',
      loading: false,
    };
    this.emailRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.open !== prevProps.open && this.props.open) {
      this.reset();
    }
  }

  reset() {
    this.setState({
      password: '',
      email: '',
      passwordErrorText: '',
      emailErrorText: '',
      loading: false,
    });
  }

  vaildInput() {
    const { password, email } = this.state;
    const { intl } = this.props;

    if (password.trim() === '') {
      this.setState({ passwordErrorText: intl.formatMessage({ id: 'inputPasswordNullError' }) });
      return false;
    }

    if (email.trim() === '') {
      this.setState({ emailErrorText: intl.formatMessage({ id: 'inputUserIdNullError' }) });
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(email)) {
      this.setState({ emailErrorText: intl.formatMessage({ id: 'errorUserIdFormat' }) });
      return false;
    }

    return true;
  }

  processError(err) {
    const { intl } = this.props;
    const state = {
      passwordErrorText: '',
      emailErrorText: '',
    };

    if (err.message === '31002') {
      state.passwordErrorText = intl.formatMessage({ id: 'errorInvalidPassword' });
    } else if (err.message === '31000') {
      state.emailErrorText = intl.formatMessage({ id: 'errorUserExists' });
    } else if (err.message === '31001') {
      state.emailErrorText = intl.formatMessage({ id: 'errorInvalidUserId' });
    } else {
      state.emailErrorText = 'error';
    }

    this.setState({ ...state, loading: false });
  }

  render() {
    const {
      password, email, passwordErrorText,
      emailErrorText, loading,
    } = this.state;
    const {
      classes, onClose, open,
      intl,
    } = this.props;

    return (
      <Dialog
        open={open}
      >
        <DialogContent className={classes.root}>
          <LiteText disableUserSelect className={classes.title}>
            <FormattedMessage id="settingLabelSettingEmail" />
          </LiteText>
          <LiteText disableUserSelect className={classes.tip}>
            <FormattedMessage id="settingLabelSettingEmailTip" />
          </LiteText>
          <LiteText disableUserSelect className={classes.label}>
            <FormattedMessage id="settingLabelPassword" />
          </LiteText>
          <LiteInput
            error={Boolean(passwordErrorText)}
            helperText={passwordErrorText}
            disabled={loading}
            className={classes.input}
            value={password}
            type="password"
            placeholder={intl.formatMessage({ id: 'settingLabelPassword' })}
            onChange={(event) => this.handler.handleInputChange('password', event.target.value)}
            onEnter={() => {
              if (this.emailRef) {
                this.emailRef.current.focus();
              }
            }}
          />
          <LiteText disableUserSelect className={classes.label}>
            <FormattedMessage id="settingLabelEmail" />
          </LiteText>
          <LiteInput
            inputRef={this.emailRef}
            error={Boolean(emailErrorText)}
            helperText={emailErrorText}
            disabled={loading}
            className={classes.input}
            value={email}
            password="email"
            placeholder={intl.formatMessage({ id: 'settingLabelEmail' })}
            onChange={(event) => this.handler.handleInputChange('email', event.target.value)}
            onEnter={this.handler.handleSubmit}
          />
          <div className={classes.buttonBox}>
            <LiteButton disabled={loading} onClick={this.handler.handleSubmit}>
              <FormattedMessage id="settingButtonConfirm" />
            </LiteButton>
          </div>
        </DialogContent>
        <div className={classes.close}>
          <IconButton color="inherit" onClick={onClose}>
            <Icons.ClearIcon />
          </IconButton>
        </div>
      </Dialog>
    );
  }
}

ModifyEmailDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  user: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
};

ModifyEmailDialog.defaultProps = {
  onClose: () => {},
};

export default withStyles(styles)(injectIntl(ModifyEmailDialog));
