/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';

import useMediaQuery from '@material-ui/core/useMediaQuery';
import { Scrollbars } from 'react-custom-scrollbars';

function Scrollbar(props) {
  const {
    children,
    classes,
    autoHide,
    autoHideTimeout,
    hideTracksWhenNotNeeded,
    hideThumb,
    themeType,
    ...others
  } = props;

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  let isDark;
  if (themeType === 'auto') {
    isDark = prefersDarkMode;
  } else if (themeType === 'dark') {
    isDark = true;
  } else {
    isDark = false;
  }

  const renderThumbVertical = (options) => {
    const { style, ...otherProps } = options;
    const customStyle = {
      backgroundColor: `#999999`,
      borderRadius: 4,
    };
    if (hideThumb) {
      customStyle.display = 'none';
    }
    return (
      <div {...otherProps} style={{ ...style, ...customStyle }} />
    );
  };
  //
  const thumbRenderer = (isDark || hideThumb) ? renderThumbVertical : undefined;
  //
  return (
    <Scrollbars
      hideTracksWhenNotNeeded={hideTracksWhenNotNeeded}
      autoHide={autoHide}
      autoHideTimeout={autoHideTimeout}
      renderThumbVertical={thumbRenderer}
      renderThumbHorizontal={renderThumbVertical}
      {...others}
    >
      {children}
    </Scrollbars>
  );
}

Scrollbar.propTypes = {
  classes: PropTypes.object,
  children: PropTypes.node.isRequired,
  hideTracksWhenNotNeeded: PropTypes.bool,
  hideThumb: PropTypes.bool,
  autoHide: PropTypes.bool,
  autoHideTimeout: PropTypes.number,
  themeType: PropTypes.string,
};

Scrollbar.defaultProps = {
  classes: {},
  hideTracksWhenNotNeeded: true,
  hideThumb: false,
  autoHide: true,
  autoHideTimeout: 1000,
  themeType: 'auto',
};

export default Scrollbar;
