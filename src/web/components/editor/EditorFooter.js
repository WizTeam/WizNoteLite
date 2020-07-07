import React, {
  useRef, useState, useEffect, useMemo,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Menu from '@material-ui/core/Menu';
import Switch from '@material-ui/core/Switch';
import Timer from 'timer.js';
import Icon from '../../config/icons';

const useStyles = makeStyles(({ spacing, palette }) => ({
  footer: {
    height: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    fontSize: 12,
    width: '100%',
    backgroundColor: palette.type === 'dark' ? '#333' : '#fafafa',
  },
  infoItem: {
    border: 'none',
    color: palette.type === 'dark' ? '#f0f0f0' : '#333333',
    outline: 'none',
    backgroundColor: 'transparent',
    '&:not(:nth-last-child(1))': {
      marginRight: spacing(2),
    },
    '&.button': {
      cursor: 'pointer',
    },
  },
  infoIcon: {
    fontSize: 16,
    '&.button': {
      cursor: 'pointer',
    },
  },
  value: {
    marginLeft: spacing(1),
    '&.black': {
      color: palette.type === 'dark' ? '#f0f0f0' : '#333',
    },
  },
  focusMenu: {
    width: 192,
    height: 120,
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
    display: 'flex',
    width: '56px',
    height: '20px',
    border: '1px solid #d8d8d8',
    boxSizing: 'border-box',
    padding: '0 4px',
    fontSize: 12,
    alignItems: 'center',
    color: '#aaaaaa',
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

function EditorFooter(props) {
  const classes = useStyles();

  const focusRef = useRef();

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
    if (!anchorEl && isTimer) {
      timer.start(props.timeout * 60);
    }
  }, [anchorEl]);

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
    <div
      className={classes.footer}
    >
      <div className={classes.infoItem}>
        {props.isLogin
          ? (
            <Icon.RefreshIcon
              className={classes.infoIcon}
            />
          )
          : (
            <Icon.UploadIcon
              className={classNames(classes.infoIcon, 'button')}
              onClick={() => window.wizApi.userManager.emit('goLogin')}
            />
          )}
      </div>
      <div className={classes.infoItem}>
        <span className={classes.label}>
          {props.isLogin
            ? `${props.intl.formatMessage({ id: 'editorFooterSyncTime' })}:`
            : props.intl.formatMessage({ id: 'editorFooterLocal' })}
        </span>
        {props.isLogin && (<span className={classes.value}>{props.updatedTimer}</span>)}
      </div>
      {/* <div className={classes.infoItem}>
        <span className={classes.label}>
          {`${props.intl.formatMessage({ id: 'editorFooterWordsSize' })}:`}
        </span>
        <span className={classes.value}>{props.counterNum}</span>
      </div> */}
      <button
        type="button"
        className={classNames(classes.infoItem, 'button')}
        ref={focusRef}
        onClick={() => { setAnchorEl(focusRef.current); }}
      >
        <span className={classes.label}>Focus:</span>
        <span className={classNames(classes.value, 'black')}>{timerText || (isFocus ? 'ON' : 'OFF')}</span>
      </button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
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
          <div className={classes.menuLine}>
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
            <div className={classes.timerInput}>
              {`${props.timeout} mins`}
            </div>
          </div>
        </div>
      </Menu>
    </div>

  );
}

EditorFooter.propTypes = {
  intl: PropTypes.object.isRequired,
  updatedTimer: PropTypes.string,
  // counterNum: PropTypes.number,
  isLogin: PropTypes.bool,
  timeout: PropTypes.number,
};

EditorFooter.defaultProps = {
  updatedTimer: '',
  // counterNum: 0,
  isLogin: false,
  timeout: 25,
};

export default injectIntl(EditorFooter);
