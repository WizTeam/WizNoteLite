import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

import Icons from '../config/icons';
import LiteText from './LiteText';


const styles = (/* theme */) => ({
  root: {
    display: 'flex',
  },
  content: {
    display: 'flex',
    height: 16,
    cursor: 'pointer',
    backgroundColor: 'rgb(254, 213, 53)',
    color: 'black',
    marginTop: 4,
    fontSize: 12,
    borderRadius: 3,
    marginRight: 8,
    padding: '0 4px',
    pointerEvents: 'all',
  },
  content_normal: {
    marginTop: 8,
  },
  icon: {
    width: 16,
    height: 16,
  },
});


class VipIndicator extends React.Component {
  handler = {
    handleKeyPress: (e) => {
      if (e.keyCode === 13) {
        this.props.onClick();
      }
    },
    handleUserInfoChanged: (user) => {
      // console.log('user info changed');
      this.setState({ user });
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      user: null,
    };
  }

  async componentDidMount() {
    window.wizApi.userManager.on('userInfoChanged', this.handler.handleUserInfoChanged);
    const user = await window.wizApi.userManager.getUserInfo();
    this.setState({ user });
  }

  componentWillUnmount() {
    window.wizApi.userManager.off('userInfoChanged', this.handler.handleUserInfoChanged);
  }

  render() {
    //
    const { className, classes, intl } = this.props;
    const { user } = this.state;
    //
    if (!user) {
      return <div />;
    }
    //
    let typeText;
    if (user.vip) {
      typeText = 'VIP';
    } else {
      //
      // eslint-disable-next-line no-lonely-if
      if (!user.vipDate) {
        typeText = intl.formatMessage({ id: 'userTypeUpgrade' });
      } else {
        typeText = intl.formatMessage({ id: 'userTypeRenew' });
      }
      //
    }

    const isMac = window.wizApi.platform.isMac;

    return (
      <div
        className={classNames(classes.root, className)}
      >
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
        <div
          className={classNames(classes.content, !isMac && classes.content_normal)}
          onClick={this.props.onClick}
          role="link"
          onKeyPress={this.handler.handleKeyPress}
          // tabIndex={0} // 不希望点击的时候转移键盘焦点
        >
          <Icons.CrownIcon className={classes.icon} />
          <LiteText fullWidth={false}>{typeText}</LiteText>
        </div>
      </div>
    );
  }
}


VipIndicator.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

VipIndicator.defaultProps = {
  className: null,
  onClick: PropTypes.func,
};

export default withStyles(styles)(injectIntl(VipIndicator));
