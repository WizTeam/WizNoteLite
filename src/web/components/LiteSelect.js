import React, {
  useEffect, useState, useCallback,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
//
import Icons from '../config/icons/common';

const useStyles = makeStyles((/* theme */) => ({
  root: {
    display: 'inline-block',
    border: '1px solid #d8d8d8',
  },
  button: {
    borderRadius: 0,
  },
  buttonLabel: {
    justifyContent: 'space-between',
  },
  paper: {
    transform: 'translateY(4px) !important',
  },
  menu: {
  },
}));

function LiteSelect(props) {
  const classes = useStyles();
  const {
    options, className, value,
  } = props;
  //
  const [selectedKey, setSelectedKey] = useState('select');
  const [selectedVal, setSelectedVal] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const buttonRef = useRef();

  const handleOpenMenu = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (item) => {
    if (value === null) {
      setSelectedKey(item.title);
      setSelectedVal(item.value);
    }
    //
    if (props.onChange) {
      props.onChange(item, item.value);
    }
    //
    handleMenuClose();
  };

  const resetSelectedKey = useCallback(() => {
    if (value === null) {
      if (options.length) {
        setSelectedKey(options[0]?.title);
        setSelectedVal(options[0]?.value);
      }
      return true;
    }
    //
    for (let i = 0; i < options.length; i += 1) {
      if (options[i].value === value) {
        setSelectedKey(options[i]?.title);
        setSelectedVal(options[i]?.value);
        break;
      }
    }
    //
    return true;
  }, [value, options]);

  useEffect(() => {
    resetSelectedKey();
  }, [resetSelectedKey]);

  let paperProps = {};
  if (buttonRef.current) {
    paperProps = {
      style: {
        minWidth: buttonRef.current.clientWidth,
      },
    };
  }

  return (
    <div className={classNames(classes.root, className)}>
      <Button
        ref={buttonRef}
        fullWidth
        className={classes.button}
        classes={{
          label: classes.buttonLabel,
        }}
        onClick={handleOpenMenu}
      >
        {selectedKey}
        <Icons.ArrowBottomIcon />
      </Button>
      <Menu
        className={classes.menu}
        classes={{
          paper: classes.paper,
        }}
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={paperProps}
        getContentAnchorEl={null}
        onClose={handleMenuClose}
      >
        {options.map((item) => (
          <MenuItem
            key={item.value}
            onClick={() => handleSelect(item)}
            selected={item.value === selectedVal}
          >
            {item.title}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

LiteSelect.propTypes = {
  className: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  onChange: PropTypes.func,
};

LiteSelect.defaultProps = {
  className: '',
  options: [],
  value: null,
  onChange: null,
};

export default LiteSelect;
