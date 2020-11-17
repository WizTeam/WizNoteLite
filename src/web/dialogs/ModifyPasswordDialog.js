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

class ModifyPasswordDialog extends React.Component {
  handler = {
    handleSubmit: async () => {
      if (!this.vaildInput()) return false;
      //
      const { originPassword, newPassword } = this.state;
      this.setState({ loading: true });

      try {
        await window.wizApi.userManager.changePassword(newPassword, originPassword);
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
      originPassword: '',
      newPassword: '',
      confirmPassword: '',
      originPasswordErrorText: '',
      newPasswordErrorText: '',
      confirmPasswordErrorText: '',
      loading: false,
    };
    this.newPasswordRef = React.createRef();
    this.confirmPasswordRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.open !== prevProps.open && this.props.open) {
      this.reset();
    }
  }

  reset() {
    this.setState({
      originPassword: '',
      newPassword: '',
      confirmPassword: '',
      originPasswordErrorText: '',
      newPasswordErrorText: '',
      confirmPasswordErrorText: '',
      loading: false,
    });
  }

  vaildInput() {
    const { originPassword, newPassword, confirmPassword } = this.state;
    const { intl } = this.props;

    if (originPassword.trim() === '') {
      this.setState({
        originPasswordErrorText: intl.formatMessage({ id: 'errorOriginPasswordNull' }),
      });
      return false;
    }

    if (originPassword.length < 6) {
      this.setState({
        originPasswordErrorText: intl.formatMessage({ id: 'errorPasswordFormat' }),
      });
      return false;
    }

    if (newPassword.trim() === '') {
      this.setState({
        newPasswordErrorText: intl.formatMessage({ id: 'errorNewPasswordNull' }),
      });
      return false;
    }

    if (newPassword.length < 6) {
      this.setState({
        newPasswordErrorText: intl.formatMessage({ id: 'errorPasswordFormat' }),
      });
      return false;
    }

    if (confirmPassword.trim() === '') {
      this.setState({
        confirmPasswordErrorText: intl.formatMessage({ id: 'errorConfirmPasswordNull' }),
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      this.setState({
        confirmPasswordErrorText: intl.formatMessage({ id: 'errorConfirmPasswordNotSame' }),
      });
      return false;
    }

    return true;
  }

  processError(/* err */) {
    // const { intl } = this.props;
    const state = {
      originPasswordErrorText: '',
      newPasswordErrorText: '',
      confirmPasswordErrorText: '',
    };

    state.confirmPasswordErrorText = 'error';

    this.setState({ ...state, loading: false });
  }

  render() {
    const {
      originPassword, newPassword, confirmPassword,
      originPasswordErrorText, newPasswordErrorText, confirmPasswordErrorText,
      loading,
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
            <FormattedMessage id="settingLabelModifyPassword" />
          </LiteText>
          <LiteText disableUserSelect className={classes.label}>
            <FormattedMessage id="settingLabelOriginPassword" />
          </LiteText>
          <LiteInput
            error={Boolean(originPasswordErrorText)}
            helperText={originPasswordErrorText}
            className={classes.input}
            disabled={loading}
            type="password"
            value={originPassword}
            placeholder={intl.formatMessage({ id: 'settingLabelOriginPassword' })}
            onChange={(e) => this.handler.handleInputChange('originPassword', e.target.value)}
            onEnter={() => this.newPasswordRef?.current.focus()}
          />
          <LiteText disableUserSelect className={classes.label}>
            <FormattedMessage id="settingLabelNewPassword" />
          </LiteText>
          <LiteInput
            inputRef={this.newPasswordRef}
            error={Boolean(newPasswordErrorText)}
            helperText={newPasswordErrorText}
            className={classes.input}
            disabled={loading}
            type="password"
            value={newPassword}
            placeholder={intl.formatMessage({ id: 'settingLabelNewPassword' })}
            onChange={(e) => this.handler.handleInputChange('newPassword', e.target.value)}
            onEnter={() => this.confirmPasswordRef?.current.focus()}
          />
          <LiteText disableUserSelect className={classes.label}>
            <FormattedMessage id="settingLabelConfirmNewPassword" />
          </LiteText>
          <LiteInput
            inputRef={this.confirmPasswordRef}
            error={Boolean(confirmPasswordErrorText)}
            helperText={confirmPasswordErrorText}
            className={classes.input}
            disabled={loading}
            type="password"
            value={confirmPassword}
            placeholder={intl.formatMessage({ id: 'settingLabelConfirmNewPassword' })}
            onChange={(e) => this.handler.handleInputChange('confirmPassword', e.target.value)}
            onEnter={this.handler.handleSubmit}
          />
          <LiteText disableUserSelect className={classes.tip}>
            <FormattedMessage id="settingLabelPasswordTip" />
          </LiteText>
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

ModifyPasswordDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
};

ModifyPasswordDialog.defaultProps = {
  onClose: () => {},
};

export default withStyles(styles)(injectIntl(ModifyPasswordDialog));
