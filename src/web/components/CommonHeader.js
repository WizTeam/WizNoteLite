import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import LiteText from './LiteText';
import Icons from '../config/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    height: theme.spacing(4),
    minHeight: theme.spacing(4),
    display: 'flex',
  },
  dragLayer: {
    flex: 1,
    '-webkit-app-region': 'drag',
  },
  logoBox: {
    display: 'flex',
    fontSize: 12,
    color: theme.custom.color.windowBarLogo,
    alignItems: 'center',
    height: '100%',
    userSelect: 'none',
    '& .MuiSvgIcon-root': {
      width: 16,
      height: 16,
      margin: theme.spacing(0, 0.5, 0, 1),
    },
  },
  systemButtonContainer: {
    '& .MuiButton-root': {
      color: theme.custom.color.windowBarTool,
      padding: '0',
      minWidth: 48,
      borderRadius: 0,
    },
  },
  systemButtonRoot: {
    '&:hover': {
      backgroundColor: theme.custom.background.normalButtonHover,
      color: theme.custom.color.normalButtonHover,
    },
  },
  closeRoot: {
    '&:hover': {
      backgroundColor: theme.custom.background.closeButtonHover,
      color: theme.custom.color.closeButtonHover,
    },
  },
  name: {
    color: theme.custom.color.noteTitle,
    whiteSpace: 'nowrap',
  },
  liteLogo: {
    color: '#f0f0f0',
  },
}));

export default function CommonHeader(props) {
  const classes = useStyles();
  const wm = window.wizApi.windowManager;
  const hasSystemButton = window.wizApi.isElectron && wm.platform !== 'darwin';
  //
  const fullScreen = wm.isFullScreen();
  const maximized = fullScreen || wm.isMaximized();
  //
  const [isMaximized, setMaximized] = useState(hasSystemButton && maximized);
  const [isFullScreen, setFullScreen] = useState(hasSystemButton && fullScreen);

  useEffect(() => {
    const handleResize = () => {
      if (!hasSystemButton) return;

      setTimeout(() => {
        const isFullScreenNow = wm.isFullScreen();
        const isMaximizedNow = isFullScreenNow || wm.isMaximized();
        if (isMaximizedNow !== isMaximized) {
          setMaximized(isMaximizedNow);
        }
        if (isFullScreenNow !== isFullScreen) {
          setFullScreen(isFullScreenNow);
        }
      });
    };

    window.addEventListener('resize', handleResize);
    //
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  const handleDoubleClickHeader = () => {
    if (isFullScreen) {
      props.onRequestFullScreen();
    } else {
      wm.toggleMaximize();
    }
  };

  const handleMinimizeWindow = () => {
    wm.minimizeWindow();
  };

  const handleCloseWindow = () => {
    wm.closeWindow();
  };

  const handleClickLogo = (event) => {
    const elem = event.currentTarget;
    wm.showSystemMenu(elem.offsetLeft + 8, elem.offsetTop + elem.offsetHeight);
  };

  const handleDoubleClickLogo = () => {
    wm.closeWindow();
  };

  const {
    className, showLogo,
    liteLogo, systemButton,
  } = props;

  return (
    <div className={classNames(classes.root, className)} onDoubleClick={handleDoubleClickHeader}>
      {hasSystemButton && showLogo && (
        <div className={classNames(classes.logoBox, classes.dragLayer)}>
          <IconButton onClick={handleClickLogo} onDoubleClick={handleDoubleClickLogo}>
            <Icons.LiteLogoIcon />
          </IconButton>
          <LiteText className={classNames(classes.name, liteLogo && classes.liteLogo)}>
            WizNote Lite
          </LiteText>
        </div>
      )}
      <div className={classes.dragLayer} />
      {hasSystemButton && systemButton && (
        <div className={classes.systemButtonContainer}>
          <Button onClick={handleMinimizeWindow} classes={{ root: classes.systemButtonRoot }}>
            <Icons.MinimizeIcon />
          </Button>
          <Button onClick={props.onRequestFullScreen} classes={{ root: classes.systemButtonRoot }}>
            {isFullScreen || fullScreen
              ? <Icons.WindowsQuitFullScreenIcon /> : <Icons.WindowsFullScreenIcon />}
          </Button>
          <Button onClick={handleDoubleClickHeader} classes={{ root: classes.systemButtonRoot }}>
            {isMaximized ? <Icons.RestoreIcon /> : <Icons.MaximizeIcon />}
          </Button>
          <Button onClick={handleCloseWindow} classes={{ root: classes.closeRoot }}>
            <Icons.CloseIcon />
          </Button>
        </div>
      )}
    </div>
  );
}

CommonHeader.propTypes = {
  className: PropTypes.string,
  showLogo: PropTypes.bool,
  liteLogo: PropTypes.bool,
  systemButton: PropTypes.bool,
  onRequestFullScreen: PropTypes.func,
};

CommonHeader.defaultProps = {
  className: null,
  showLogo: false,
  liteLogo: false,
  systemButton: false,
  onRequestFullScreen: null,
};
