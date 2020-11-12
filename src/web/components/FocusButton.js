import React, {
  useRef, useState, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import Switch from '@material-ui/core/Switch';
import { makeStyles } from '@material-ui/core/styles';
import Icons from '../config/icons';

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
  switchBase: {
    '&.Mui-checked': {
      color: '#35e714',
      '& + .MuiSwitch-track': {
        backgroundColor: '#35e714',
        opacity: 0.2,
      },
    },
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

  useEffect(() => {
    (async () => {
      setFocusMode(await window.wizApi.userManager.getSettings('focusMode', false));
      setTypewriterMode(await window.wizApi.userManager.getSettings('typewriterMode', false));
    })();
  }, []);

  function handleTypewriter(event) {
    setTypewriterMode(event.target.checked);
    window.wizApi.userManager.setSettings('typewriterMode', event.target.checked);
  }

  function handleFocus(event) {
    const focusWithTypewriter = window.wizApi.userManager.getUserSettingsSync('focusWithTypewriter', false);
    //
    if (focusWithTypewriter && event.target.checked) {
      handleTypewriter(event);
    }

    setFocusMode(event.target.checked);
    window.wizApi.userManager.setSettings('focusMode', event.target.checked);
  }

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
              onChange={handleFocus}
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
              onChange={handleTypewriter}
            />
          </div>
        </div>
      </Menu>
    </>
  );
}

FocusButton.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
};

FocusButton.defaultProps = {
  className: '',
  iconClassName: '',
};

export default FocusButton;
