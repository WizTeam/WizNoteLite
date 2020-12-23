import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((/* theme */) => ({
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
}));

function LiteMiddle(props) {
  const classes = useStyles();
  const { children, className, ...other } = props;

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div className={classNames(classes.root, className)} {...other}>
      {children}
    </div>
  );
}

LiteMiddle.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.element,
  ]),
  className: PropTypes.string,
};

LiteMiddle.defaultProps = {
  children: null,
  className: '',
};

export default React.memo(LiteMiddle);
