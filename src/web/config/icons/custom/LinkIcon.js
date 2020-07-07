import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

export default (props) => (
  // eslint-disable-next-line react/prop-types
  <SvgIcon viewBox="0 0 24 24" className={props.className}>
    <g transform="translate(4.000000, 4.000000)">
      <polygon points="4.46936035 6 5.73681641 6 2.55700684 14.1694336 1.46154785 14.1694336" />
      <polygon points="5 6.59350586 5.53222656 5.7434082 14.1951904 12.5411377 13.7021484 13.4025879" />
      <polygon points="13.0706787 1.53479004 13.5357666 2.38830566 5.03393555 6.59350586 4.63342285 5.73400879" />
      <circle fillRule="nonzero" cx="5" cy="6" r="3" />
      <circle fillRule="nonzero" cx="13" cy="2" r="2" />
      <circle fillRule="nonzero" cx="14" cy="13" r="2" />
      <circle fillRule="nonzero" cx="2" cy="14" r="2" />
    </g>
  </SvgIcon>
);
