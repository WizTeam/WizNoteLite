import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import LiteText from './LiteText';
import Icons from '../config/icons';
import VipIndicator from './VipIndicator';

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
      backgroundColor: '#e82100',
      color: '#ffffff',
    },
  },
  name: {
    whiteSpace: 'nowrap',
  },
  liteLogo: {
    color: theme.custom.color.windowBar,
  },
  logoIcon: {
    width: 16,
    height: 16,
    marginRight: theme.spacing(1),
  },
  liteButton: {
    padding: 0,
    lineHeight: 1,
    textTransform: 'unset',
    marginLeft: theme.spacing(1),
    fontSize: 14,
    '& .MuiButton-endIcon': {
      marginLeft: 0,
      color: theme.custom.color.windowBar,
    },
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:active': {
      backgroundColor: 'transparent',
    },
  },
}));

const CommonHeader = React.forwardRef((props, ref) => {
  const classes = useStyles();
  const intl = useIntl();
  const wm = window.wizApi.windowManager;
  const hasSystemButton = window.wizApi.isElectron && !window.wizApi.platform.isMac;
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
    wm.showSystemMenu(elem.offsetLeft + 8, elem.offsetTop + elem.offsetHeight, intl);
  };

  const handleDoubleClickLogo = () => {
    wm.closeWindow();
  };

  const {
    className, showLogo, showUserType,
    liteLogo, systemButton,
  } = props;

  return (
    <div className={classNames(classes.root, className)} onDoubleClick={handleDoubleClickHeader} ref={ref}>
      {hasSystemButton && showLogo && (
        <>
          <Button
            className={classes.liteButton}
            endIcon={<Icons.ArrowDropDownIcon />}
            onClick={handleClickLogo}
            onDoubleClick={handleDoubleClickLogo}
            disableRipple
          >
            <Icons.LiteLogoIcon className={classes.logoIcon} />
            <LiteText className={classNames(classes.name, liteLogo && classes.liteLogo)}>
              WizNote Lite
            </LiteText>
          </Button>
        </>
      )}

      {showUserType && (
        <>
          <div className={classes.dragLayer} />
          <VipIndicator onClick={props.onUpgradeVip} />
        </>
      )}
      {!showUserType && <div className={classes.dragLayer} />}
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
});

CommonHeader.propTypes = {
  className: PropTypes.string,
  showLogo: PropTypes.bool,
  showUserType: PropTypes.bool,
  liteLogo: PropTypes.bool,
  systemButton: PropTypes.bool,
  onRequestFullScreen: PropTypes.func,
  onUpgradeVip: PropTypes.func,
};

CommonHeader.defaultProps = {
  className: null,
  showLogo: false,
  showUserType: false,
  liteLogo: false,
  systemButton: false,
  onRequestFullScreen: null,
  onUpgradeVip: null,
};

export default CommonHeader;
