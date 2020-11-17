import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.custom.background.dialogButtonBlack,
    color: theme.custom.color.dialogButtonBlack,
    borderRadius: 0,
    '&:hover': {
      backgroundColor: theme.custom.background.dialogButtonBlackHover,
    },
  },
}));

function LiteButton(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;

  return (
    <Button
      className={classNames(classes.root, className)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...other}
    >
      {children}
    </Button>
  );
}

LiteButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.element,
  ]).isRequired,
};

LiteButton.defaultProps = {
  className: '',
};

export default React.memo(LiteButton);
