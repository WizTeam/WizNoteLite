import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

export default (props) => (
  // eslint-disable-next-line react/prop-types
  <SvgIcon viewBox="0 0 24 24" className={props.className}>
    <path
      d="M12,5 L11.999,11 L18,11 L18,12 L11.999,12 L12,18 L11,18 L10.999,12 L5,12 L5,11 L10.999,11 L11,5 L12,5 Z"
      transform="translate(11.500000, 11.500000) rotate(45.000000) translate(-11.500000, -11.500000) "
    />
  </SvgIcon>
);
