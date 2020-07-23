import React from 'react';
import PropTypes from 'prop-types';
// import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
//
import LoginDialog from '../dialogs/LoginDialog';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.custom.background.login,
  },
}));

export default function Login(props) {
  const classes = useStyles();
  // const intl = useIntl();

  return (
    <div className={classes.root}>
      <LoginDialog
        open
        disableCloseListener
        disableBackdrop
        onLoggedIn={props.onLoggedIn}
        mergeLocalAccount={props.mergeLocalAccount}
      />
    </div>
  );
}

Login.propTypes = {
  onLoggedIn: PropTypes.func.isRequired,
  mergeLocalAccount: PropTypes.bool.isRequired,
};
