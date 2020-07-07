import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

export default (props) => (
  // eslint-disable-next-line react/prop-types
  <SvgIcon viewBox="0 0 24 24" className={props.className}>
    <g stroke="none" strokeWidth="1" fillRule="evenodd">
      <path d="M17,7 L17,16 L6,16 L6,7 L17,7 Z M16,8 L7,8 L7,15 L16,15 L16,8 Z" />
    </g>
  </SvgIcon>
);
