import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';

import Icons from '../config/icons';
import LiteText from './LiteText';


const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  content: {
    display: 'flex',
    height: 16,
    cursor: 'pointer',
    backgroundColor: 'rgb(254, 213, 53)',
    color: 'black',
    marginTop: 4,
    fontSize: 12,
    borderRadius: 3,
    marginRight: 8,
    padding: '0 4px',
    pointerEvents: 'all',
  },
  icon: {
    width: 16,
    height: 16,
  },
}));


export default function VipIndicator(props) {
  const { className } = props;
  const classes = useStyles();
  const intl = useIntl();
  //
  const user = window.wizApi.userManager.getUserInfo();
  let typeText;
  if (user.vip) {
    typeText = 'VIP';
  } else {
    //
    // eslint-disable-next-line no-lonely-if
    if (!user.vipDate) {
      typeText = intl.formatMessage({ id: 'userTypeUpgrade' });
    } else {
      typeText = intl.formatMessage({ id: 'userTypeRenew' });
    }
    //
  }

  function handleKeyPress(e) {
    if (e.keyCode === 13) {
      props.onClick();
    }
  }

  return (
    <div
      className={classNames(classes.root, className)}
    >
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        className={classes.content}
        onClick={props.onClick}
        role="link"
        onKeyPress={handleKeyPress}
        // tabIndex={0} // 不希望点击的时候转移键盘焦点
      >
        <Icons.CrownIcon className={classes.icon} />
        <LiteText fullWidth={false}>{typeText}</LiteText>
      </div>
    </div>
  );
}


VipIndicator.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
};

VipIndicator.defaultProps = {
  className: null,
  onClick: PropTypes.func,
};
