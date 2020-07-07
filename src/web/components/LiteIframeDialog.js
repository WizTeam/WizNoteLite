import React from 'react';
import PropTypes from 'prop-types';
// import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';

const styles = (/* theme */) => ({
  iframe: {
    width: '100%',
    height: '100%',
    border: 0,
  },
});

class LiteIframeDialog extends React.Component {
  handler = {
  };

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const {
      classes, url, open, style,
    } = this.props;

    return (
      <Dialog
        open={open}
      >
        <div className={classes.root} style={style}>
          <iframe
            src={url}
            title="lite-iframe"
            className={classes.iframe}
          />
        </div>
      </Dialog>
    );
  }
}

LiteIframeDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  open: PropTypes.bool,
  style: PropTypes.object,
};

LiteIframeDialog.defaultProps = {
  open: false,
  style: {},
};

export default withStyles(styles)(injectIntl(LiteIframeDialog));
