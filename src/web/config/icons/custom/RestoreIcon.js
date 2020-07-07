import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

export default (props) => (
  // eslint-disable-next-line react/prop-types
  <SvgIcon viewBox="0 0 24 24" className={props.className}>
    <g stroke="none" strokeWidth="1" fillRule="evenodd">
      <path d="M15,10 L7,10 L7,16 L15,16 L15,10 Z M16,14 L17,14 L17,8 L9,8 L9,9 L16,9 L16,14 Z M16,17 L6,17 L6,9 L8,9 L8,7 L18,7 L18,15 L16,15 L16,17 Z"/>
    </g>
  </SvgIcon>
);
