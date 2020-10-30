import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import Tooltip from '@material-ui/core/Tooltip';
//
import Icons from '../config/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    position: 'relative',
    border: `solid 1px ${theme.custom.color.liteInputNormalBorder}`,
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
}));

function LiteInput(props) {
  const classes = useStyles();
  const {
    error, className, helperText, type,
    placeholder, onChange, value, disabled,
    inputRef, endAdornment,
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
        inputRef={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        error={error}
        disabled={disabled}
        classes={{
          root: classes.root,
          focused: classes.focused,
          error: classes.error,
        }}
        endAdornment={error ? <Icons.InputErrorIcon className={classes.errorIcon} /> : endAdornment}
        className={className}
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
};

export default LiteInput;
