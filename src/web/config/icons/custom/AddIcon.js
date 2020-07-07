import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

export default (props) => (
  // eslint-disable-next-line react/prop-types
  <SvgIcon viewBox="0 0 24 24" className={props.className}>
    <path
      d="M13,4 L13,11 L20,11 L20,13 L13,13 L13,20 L11,20 L11,13 L4,13 L4,11 L11,11 L11,4 L13,4 Z"
    />
  </SvgIcon>
);
