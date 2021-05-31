import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  root: {
    wordBreak: 'normal',
    fontSize: 'inherit',
  },
  fullWidth: {
    width: '100%',
  },
  active: {
    color: theme.custom.color.textHighlight,
    fontStyle: 'normal',
  },
  inheritColor: {
    color: 'inherit',
  },
  inheritLineheight: {
    lineHeight: 'inherit',
  },
  userSelectNone: {
    userSelect: 'none',
  },
}));

function LiteText(props) {
  const classes = useStyles();

  const {
    highlightText, children, className, inheritColor,
    isDivContainer, fullWidth,
    disableUserSelect, variant, inheritLineheight, ...other
  } = props;

  const headlineMapping = {
    h1: 'h1',
    h2: 'h1',
    h3: 'h1',
    h4: 'h1',
    h5: 'h1',
    h6: 'h2',
    subtitle1: 'h3',
    body1: 'aside',
    body2: isDivContainer ? 'div' : 'p',
  };

  let highlightHtml = highlightText;
  if (highlightHtml) {
    highlightHtml = highlightHtml.replace(/<em>/g, `<em class="${classes.active}">`);
  }
  //
  const innerHtml = highlightHtml ? {
    __html: highlightHtml,
  } : undefined;
  //
  const childrenNodes = highlightHtml ? undefined : children;

  return (
    <Typography
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...other}
      variant={variant}
      variantMapping={headlineMapping}
      dangerouslySetInnerHTML={innerHtml}
      className={classNames(classes.root,
        fullWidth && classes.fullWidth,
        disableUserSelect && classes.userSelectNone,
        inheritColor && classes.inheritColor,
        inheritLineheight && classes.inheritLineheight,
        className)}
    >
      {childrenNodes}
    </Typography>
  );
}

LiteText.propTypes = {
  highlightText: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.element,
  ]),
  className: PropTypes.string,
  inheritColor: PropTypes.bool,
  isDivContainer: PropTypes.bool,
  title: PropTypes.string,
  style: PropTypes.object,
  fullWidth: PropTypes.bool,
  disableUserSelect: PropTypes.bool,
  variant: PropTypes.string,
  inheritLineheight: PropTypes.bool,
};

LiteText.defaultProps = {
  highlightText: '',
  children: '',
  className: '',
  inheritColor: false,
  isDivContainer: false,
  title: null,
  style: null,
  fullWidth: true,
  disableUserSelect: false,
  variant: 'body2',
  inheritLineheight: false,
};

export default React.memo(LiteText);
