import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
//
import Icons from '../config/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    position: 'relative',
    border: `solid 2px ${theme.custom.color.liteInputNormalBorder}`,
    paddingLeft: 10,
    paddingRight: 10,
    '& > input::-webkit-input-safebox-button': {
      display: 'none',
    },
  },
  focused: {
    backgroundColor: `${theme.custom.color.liteInputFocusBorder}19`,
    border: `solid 2px ${theme.custom.color.liteInputFocusBorder}`,
    paddingLeft: 9,
    paddingRight: 9,
  },
  error: {
    backgroundColor: `${theme.custom.color.liteInputErrorBorder}19`,
    border: `solid 2px ${theme.custom.color.liteInputErrorBorder}`,
    paddingLeft: 9,
    paddingRight: 9,
  },
  tooltip: {
    fontSize: 12,
    backgroundColor: theme.custom.color.liteInputErrorBorder,
    boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.5)',
    borderRadius: 2,
  },
  tooltipArrow: {
    top: '0 !important',
    left: '2px !important',
    marginTop: '0 !important',
    '&::before': {
      color: theme.custom.color.liteInputErrorBorder,
      transformOrigin: '0 0 !important',
      transform: 'rotate(-45deg)',
    },
  },
  errorIcon: {
    color: theme.custom.color.liteInputErrorBorder,
  },
  buttonBox: {
    position: 'absolute',
    right: 0,
    bottom: '-38px',
  },
  submitButton: {
    marginRight: theme.spacing(1),
    backgroundColor: '#448aff',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#448affc0',
    },
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
}));

function InputComponent(props) {
  const classes = useStyles();
  const [isFocus, setIsFocus] = useState(false);
  const lock = React.useRef(false);
  const focus = React.useRef(false);
  const { button, inputRef, ...other } = props;

  const handleFocus = (event) => {
    focus.current = true;
    //
    if (props.onFocus) props.onFocus(event);
  };

  const handleBlur = (event) => {
    focus.current = false;
    //
    if (props.onBlur) props.onBlur(event);
  };

  const handleMouseDown = () => {
    lock.current = true;
  };

  const handleMouseUp = () => {
    lock.current = false;
  };

  const handleSubmit = (event) => {
    event.stopPropagation();
    // do something
    lock.current = false;
    if (!focus.current && !lock.current) {
      setIsFocus(false);
    } else {
      setIsFocus(true);
    }
  };

  const handleCancel = (event) => {
    event.stopPropagation();
    lock.current = false;
    if (!focus.current && !lock.current) {
      setIsFocus(false);
    } else {
      setIsFocus(true);
    }
  };

  useEffect(() => {
    if (!focus.current && !lock.current) {
      setIsFocus(false);
    } else {
      setIsFocus(true);
    }
  }, [focus.current, lock.current]);
  //
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={{ flex: 1 }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <input
        ref={inputRef}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...other}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {button && isFocus && (
        <div className={classes.buttonBox}>
          <IconButton className={classes.submitButton} onMouseUp={handleSubmit}>
            <Icons.SelectedIcon />
          </IconButton>
          <IconButton className={classes.cancelButton} onMouseUp={handleCancel}>
            <Icons.ClearIcon />
          </IconButton>
        </div>
      )}
    </div>
  );
}

function LiteInput(props) {
  const classes = useStyles();
  const {
    error, className, helperText, type,
    placeholder, onChange, value, disabled,
    inputRef, endAdornment, button,
  } = props;

  const handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      if (props.onEnter) {
        props.onEnter();
      }
    }
  };

  return (
    <Tooltip
      title={helperText}
      arrow
      type={type}
      open={Boolean(error && helperText)}
      placement="right"
      disableFocusListener
      disableHoverListener
      disableTouchListener
      classes={{
        tooltip: classes.tooltip,
        arrow: classes.tooltipArrow,
      }}
    >
      <InputBase
        value={value}
        error={error}
        inputRef={inputRef}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
        inputComponent={InputComponent}
        inputProps={{
          button,
        }}
        classes={{
          root: classes.root,
          focused: classes.focused,
          error: classes.error,
        }}
        endAdornment={error
          ? <Icons.InputErrorIcon className={classes.errorIcon} /> : endAdornment}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
    </Tooltip>
  );
}

LiteInput.propTypes = {
  error: PropTypes.bool,
  className: PropTypes.string,
  helperText: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  disabled: PropTypes.bool,
  onEnter: PropTypes.func,
  inputRef: PropTypes.object,
  endAdornment: PropTypes.element,
  button: PropTypes.bool,
};

LiteInput.defaultProps = {
  error: false,
  className: '',
  helperText: '',
  type: 'text',
  placeholder: '',
  onChange: () => {},
  onEnter: null,
  value: '',
  disabled: false,
  inputRef: null,
  endAdornment: null,
  button: false,
};

InputComponent.propTypes = {
  inputRef: PropTypes.func.isRequired,
  button: PropTypes.bool.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default LiteInput;
