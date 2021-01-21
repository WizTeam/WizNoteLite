import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import Switch from '@material-ui/core/Switch';
import { makeStyles } from '@material-ui/core/styles';
import Icons from '../config/icons';
import { eventCenter, eventMap } from '../utils/event';

const useStyles = makeStyles(({ spacing, palette }) => ({
  focusMenu: {
    width: 220,
    // height: 120,
    padding: spacing(0, 3),
    color: palette.type === 'dark' ? '#fff' : '#333',
    boxSizing: 'border-box',
    '&:focus': {
      outline: 'none',
    },
  },
  menuLine: {
    fontSize: 15,
    // color: '#333',
    width: '100%',
    display: 'flex',
    height: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inpContainer: {
    width: 15,
    border: 'none',
    outline: 'none',
    color: '#aaaaaa',
    backgroundColor: 'transparent',
  },
  menuPaper: {
    backgroundColor: palette.type === 'dark' ? '#555' : '#fff',
    borderRadius: '2px',
  },
}));

function FocusButton(props) {
  const focusRef = useRef();

  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);

  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);

  const handleTypewriter = useCallback((isChecked = !typewriterMode) => {
    setTypewriterMode(isChecked);
    window.wizApi.userManager.setSettings('typewriterMode', isChecked);
  }, [typewriterMode]);

  const handleFocus = useCallback((isChecked = !focusMode) => {
    const focusWithTypewriter = window.wizApi.userManager.getUserSettingsSync('focusWithTypewriter', false);
    //
    if (focusWithTypewriter && isChecked) {
      handleTypewriter(isChecked);
    }

    setFocusMode(isChecked);
    window.wizApi.userManager.setSettings('focusMode', isChecked);
  }, [focusMode, handleTypewriter]);


  useEffect(() => {
    (async () => {
      setFocusMode(await window.wizApi.userManager.getSettings('focusMode', false));
      setTypewriterMode(await window.wizApi.userManager.getSettings('typewriterMode', false));
    })();
  }, []);

  useEffect(() => {
    eventCenter.on(eventMap.FOCUS_MODE, handleFocus);
    eventCenter.on(eventMap.TYPEWRITER_MODE, handleTypewriter);
    return () => {
      eventCenter.off(eventMap.FOCUS_MODE, handleFocus);
      eventCenter.off(eventMap.TYPEWRITER_MODE, handleTypewriter);
    };
  }, [
    handleFocus,
    handleTypewriter,
  ]);

  return (
    <>
      <IconButton
        className={props.className}
        ref={focusRef}
        onClick={() => setAnchorEl(focusRef.current)}
      >
        <Icons.FocusIcon className={props.iconClassName} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        classes={{
          paper: classes.menuPaper,
        }}
      >
        <div className={classes.focusMenu}>
          <div className={classes.menuLine}>
            <span className={classes.menuLabel}>Focus Mode</span>
            <Switch
              size="small"
              classes={{
                switchBase: classes.switchBase,
              }}
              checked={focusMode}
              onChange={(e) => handleFocus(e.target.checked)}
            />
          </div>
          <div className={classes.menuLine}>
            <span className={classes.menuLabel}>Typewriter Mode</span>
            <Switch
              size="small"
              classes={{
                switchBase: classes.switchBase,
              }}
              checked={typewriterMode}
              onChange={(e) => handleTypewriter(e.target.checked)}
            />
          </div>
        </div>
      </Menu>
    </>
  );
}


FocusButton.defaultProps = {
  className: '',
  iconClassName: '',
};

export default FocusButton;
