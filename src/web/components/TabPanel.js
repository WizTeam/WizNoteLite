import React from 'react';
import PropTypes from 'prop-types';

export default function TabPanel(props) {
  const {
    children, visible,
    tabKey, ...other
  } = props;

  return (
    <div
      role="tabpanel"
      hidden={!visible}
      id={`simple-tabpanel-${tabKey}`}
      aria-labelledby={`simple-tab-${tabKey}`}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...other}
    >
      {children}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  visible: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  tabKey: PropTypes.any.isRequired,
};

TabPanel.defaultProps = {
  visible: false,
};
