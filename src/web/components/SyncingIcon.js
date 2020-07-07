import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles((/* theme */) => ({
  root: {
    position: 'relative',
    height: 24,
    width: 24,
    boxSizing: 'border-box',
    padding: 4,
  },
  top: {
    color: '#cccccc',
    display: 'block',
  },
  bottom: {
    color: '#6798e5',
    display: 'block',
    animationDuration: '550ms',
    position: 'absolute',
    left: 4,
    top: 4,
  },
}));

export default function SyncingIcon() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CircularProgress
        variant="determinate"
        value={100}
        className={classes.top}
        size={16}
        thickness={4}
      />
      <CircularProgress
        variant="indeterminate"
        disableShrink
        className={classes.bottom}
        size={16}
        thickness={4}
      />
    </div>
  );
}
