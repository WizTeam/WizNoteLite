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
    hideTracksWhenNotNeeded,
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
      backgroundColor: `#555555`,
      borderRadius: 4,
    };
    return (
      <div {...otherProps} style={{ ...style, ...customStyle }} />
    );
  };
  //
  return (
    <Scrollbars
      hideTracksWhenNotNeeded={hideTracksWhenNotNeeded}
      autoHide={autoHide}
      renderThumbVertical={isDark ? renderThumbVertical : undefined}
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
  autoHide: PropTypes.bool,
  themeType: PropTypes.string,
};

Scrollbar.defaultProps = {
  classes: {},
  hideTracksWhenNotNeeded: true,
  autoHide: true,
  themeType: 'auto',
};

export default Scrollbar;
