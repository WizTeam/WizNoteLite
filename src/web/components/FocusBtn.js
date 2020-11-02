import React, {
  useRef, useState, useEffect, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import Switch from '@material-ui/core/Switch';
import Timer from 'timer.js';
// import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import Icons from '../config/icons';

const useStyles = makeStyles(({ spacing, palette }) => ({
  focusMenu: {
    width: 192,
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
  timerInput: {
    width: '56px',
    height: '20px',
    border: '1px solid #d8d8d8',
    boxSizing: 'border-box',
    padding: '0 4px',
    fontSize: 12,
    alignItems: 'center',
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: '20px',
    '&.active': {
      color: palette.type === 'dark' ? '#fff' : '#333',
    },
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

function FocusBtn(props) {
  const focusRef = useRef();

  const classes = useStyles();

  const [anchorEl, setAnchorEl] = useState(null);

  const [isFocus, setIsFocus] = useState(false);

  const [isTimer, setIsTimer] = useState(false);

  const [timerText, setTimerText] = useState('');

  const timer = useMemo(() => new Timer({
    ontick: (ms) => {
      const second = Math.floor(ms / 1000);
      setTimerText(`${Math.floor(second / 60)
        .toString()
        .padStart(2, '0')}:${(second % 60).toString().padStart(2, '0')}`);
    },
    onend: () => {
      setTimerText('');
    },
  }), [setTimerText]);

  useEffect(() => {
    if (isTimer) {
      setTimerText(`${props.timeout}:00`);
      timer.start(props.timeout * 60);
    }
  }, [isTimer]);

  useEffect(() => {
    timer.stop();
    setIsTimer(false);
  }, [props.timeout]);

  useEffect(() => {
    (async function initFocusStatus() {
      setIsFocus(await window.wizApi.userManager.getSettings('focusMode', false));
    }());
  }, []);

  function handleFocus(event) {
    setIsFocus(event.target.checked);
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
              checked={isFocus}
              onChange={handleFocus}
            />
          </div>
          {/* <div className={classes.menuLine}>
            <span className={classes.menuLabel}>Timer</span>
            <Switch
              size="small"
              classes={{
                switchBase: classes.switchBase,
              }}
              checked={isTimer}
              onChange={(event) => setIsTimer(event.target.checked)}
            />
          </div>
          <div className={classes.menuLine}>
            <div
              className={classNames(classes.timerInput, {
                active: isTimer,
              })}
            >
              {isTimer ? timerText : `${props.timeout} mins`}
            </div>
          </div> */}
        </div>
      </Menu>
    </>
  );
}

FocusBtn.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  timeout: PropTypes.number,
};

FocusBtn.defaultProps = {
  className: '',
  iconClassName: '',
  timeout: 25,
};

export default FocusBtn;
