import React from 'react';
import PropTypes from 'prop-types';
// import classNames from 'classnames';
import { injectIntl } from 'react-intl';
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
        this.setState({ loading: false });
        console.log(err);
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

    if (password.trim() === '') {
      this.setState({ passwordErrorText: 'please input password' });
      return false;
    }

    if (email.trim() === '') {
      this.setState({ emailErrorText: 'please input email' });
      return false;
    }

    return true;
  }

  render() {
    const {
      password, email, passwordErrorText,
      emailErrorText, loading,
    } = this.state;
    const { classes, onClose, open } = this.props;

    return (
      <Dialog
        open={open}
      >
        <DialogContent className={classes.root}>
          <LiteText className={classes.title}>Setting Email</LiteText>
          <LiteText className={classes.tip}>
            Please login with new email when modified email.
          </LiteText>
          <LiteText className={classes.label}>Password</LiteText>
          <LiteInput
            error={Boolean(passwordErrorText)}
            helperText={passwordErrorText}
            disabled={loading}
            className={classes.input}
            value={password}
            type="password"
            placeholder="password"
            onChange={(event) => this.handler.handleInputChange('password', event.target.value)}
          />
          <LiteText className={classes.label}>Email</LiteText>
          <LiteInput
            error={Boolean(emailErrorText)}
            helperText={emailErrorText}
            disabled={loading}
            className={classes.input}
            value={email}
            password="email"
            placeholder="email"
            onChange={(event) => this.handler.handleInputChange('email', event.target.value)}
          />
          <div className={classes.buttonBox}>
            <LiteButton onClick={this.handler.handleSubmit}>Submit</LiteButton>
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
  onClose: PropTypes.func,
  user: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
};

ModifyEmailDialog.defaultProps = {
  onClose: () => {},
};

export default withStyles(styles)(injectIntl(ModifyEmailDialog));
