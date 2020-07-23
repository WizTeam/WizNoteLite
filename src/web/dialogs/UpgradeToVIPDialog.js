import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
//
import LiteText from '../components/LiteText';
import Icons from '../config/icons';

const styles = (theme) => ({
  root: {
    width: 352,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    padding: 0,
    backgroundColor: theme.custom.background.about,
    '&:first-child': {
      padding: 0,
    },
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 12,
    color: theme.custom.color.contentToolIcon,
    userSelect: 'none',
    '&:hover': {
      color: theme.custom.color.contentToolIconHover,
    },
    '& .MuiIconButton-root': {
      padding: 6,
      borderRadius: 0,
    },

    uploadIcon: {

    },
    uploadMessage: {

    },

    buttonUpgrade: {

    },
  },

  textMargin: {
    margin: '4px 16px',
  },

  header: {
    width: '100%',
    padding: '32px 16px',
    backgroundColor: theme.custom.background.noteList,
  },
  verticalFlex: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  message: {
    padding: '32px 16px',
  },
  actions: {
    padding: '32px 16px',
  },

  why: {
    color: theme.custom.color.noteTitle,
  },

  vipMessage: {
    color: theme.custom.color.noteTitle,
    fontSize: 12,
    marginTop: 16,
  },

  uploadCloudIcon: {
    width: 64,
    height: 64,
  },

  purchaseButton: {
    margin: 8,
    paddingLeft: 32,
    paddingRight: 32,
    backgroundColor: theme.custom.background.dialogButtonBlack,
    color: theme.custom.color.dialogButtonBlack,
    borderRadius: 0,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: theme.custom.background.dialogButtonBlackHover,
    },
    '&.Mui-disabled': {
      color: theme.custom.color.dialogButtonBlack,
      opacity: 0.5,
    },
  },

  restorePurchase: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:active': {
      backgroundColor: 'transparent',
    },
  },
});

class UpgradeToVIPDialog extends React.Component {
  handler = {
    handleDialogEnter: async () => {
      if (!this.state.yearProduct) {
        if (window.wizApi.platform.isMac) {
          try {
            this.setState({ loading: true });
            const products = await window.wizApi.userManager.queryProducts();
            const yearProduct = products.find((product) => product.productIdentifier === 'cn.wiz.note.lite.year');
            this.setState({ yearProduct, loading: false });
          } catch (err) {
            console.error(err);
            alert(err.message);
            this.setState({ yearProduct: null, loading: false });
          }
        }
      }
    },

    handlePurchase: async () => {
      if (window.wizApi.platform.isMac) {
        try {
          this.setState({ purchasing: true });
          await window.wizApi.userManager.purchaseProduct(this.state.yearProduct);
        } catch (err) {
          this.setState({ purchasing: false });
          if (err.externCode === 'WizErrorNowAllowMakePayments') {
            await window.wizApi.userManager.showUpgradeVipDialog();
          } else {
            alert(err.message);
          }
        }
      } else {
        await window.wizApi.userManager.showUpgradeVipDialog();
      }
    },

    onTransactionsUpdated: async (params) => {
      const {
        state,
        message,
      } = params;
      //
      const purchaseState = state;
      //
      if (state === 'purchasing') {
        //
      } else if (state === 'verifying') {
        //
      } else if (state === 'purchased') {
        //
        await this.refreshUserInfo();
        this.setState({ purchasing: false });
        const successMessage = this.props.intl.formatMessage({ id: 'messagePurchaseSucceeded' });
        alert(successMessage);
        this.props.onClose();
        //
      } else if (state === 'failed') {
        //
        this.setState({ purchasing: false });
        const errorMessage = this.props.intl.formatMessage({ id: 'errorPurchaseFailed' }, { message });
        alert(errorMessage);
        //
      } else if (state === 'restored') {
        //
        await this.refreshUserInfo();
        this.setState({ purchasing: false });
        const successMessage = this.props.intl.formatMessage({ id: 'messagePurchaseRestoreSucceeded' });
        alert(successMessage);
        this.props.onClose();
        //
      } else {
        //
      }

      this.setState({ purchaseState });
    },

    handleRestorePurchases: () => {
      if (!window.wizApi.platform.isMac) {
        return;
      }
      //
      window.wizApi.userManager.restorePurchases();
    },
  }

  constructor(props) {
    super(props);
    this.state = {
      yearProduct: undefined,
      loading: true,
      purchasing: false,
      purchaseState: '',
      user: null,
    };
  }

  async componentDidMount() {
    window.onTransactionsUpdated = this.handler.onTransactionsUpdated;
    const user = await window.wizApi.userManager.getUserInfo();
    this.setState({ user });
  }

  componentWillUnmount() {
    window.onTransactionsUpdated = null;
  }

  async refreshUserInfo() {
    const user = await window.wizApi.userManager.refreshUserInfo();
    this.setState({ user });
  }

  render() {
    const {
      classes, open, onClose, intl,
      loading,
    } = this.props;

    const {
      yearProduct, purchasing,
      purchaseState, user,
    } = this.state;

    const isMac = window.wizApi.platform.isMac;

    let buttonText = '';
    //
    if (user && (user.vip || user.vipDate)) {
      buttonText = intl.formatMessage({ id: 'buttonRenewVIPWithPrice' });
    } else {
      buttonText = intl.formatMessage({ id: 'buttonUpgradeVIPWithPrice' });
    }
    //
    if (isMac) {
      if (purchasing) {
        if (purchaseState === 'verifying') {
          buttonText = intl.formatMessage({ id: 'buttonVerifying' });
        } else {
          buttonText = intl.formatMessage({ id: 'buttonPurchasing' });
        }
      } else if (yearProduct === null) {
        // use default button text
        // buttonText = intl.formatMessage({ id: 'buttonFailedToQueryProduct' });
        //
      } else if (yearProduct) {
        if (user && (user.vip || user.vipDate)) {
          buttonText = intl.formatMessage({ id: 'buttonRenewVIPPrice' }, { price: yearProduct.formattedPrice });
        } else {
          buttonText = intl.formatMessage({ id: 'buttonUpgradeVIPPrice' }, { price: yearProduct.formattedPrice });
        }
      } else {
        buttonText = intl.formatMessage({ id: 'buttonPurchaseLoading' });
      }
    }

    let userVipMessage = '';
    if (user) {
      if (user.vip) {
        const date = new Date(user.vipDate).toLocaleDateString();
        userVipMessage = intl.formatMessage({ id: 'messageVipServiceDate' }, { date });
      } else if (user.vipDate) {
        const date = new Date(user.vipDate).toLocaleDateString();
        userVipMessage = intl.formatMessage({ id: 'messageVipServiceEndedDate' }, { date });
      }
    }

    const isLoading = (isMac && loading);
    //
    return (
      <Dialog
        open={open}
        onEscapeKeyDown={onClose}
        onEnter={this.handler.handleDialogEnter}
      >
        <DialogContent className={classes.root}>
          <div className={classNames(classes.header, classes.verticalFlex)}>
            <LiteText className={classes.textMargin} variant="h1" fullWidth={false}><FormattedMessage id="labelUpgradeToVip" /></LiteText>
            <LiteText className={classNames(classes.textMargin, classes.why)} fullWidth={false}><FormattedMessage id="labelUpgradeToVipWhy" /></LiteText>
            <LiteText
              className={classNames(classes.textMargin, classes.vipMessage)}
              fullWidth={false}
            >
              {userVipMessage}
            </LiteText>
          </div>
          <div className={classNames(classes.message, classes.verticalFlex)}>
            <Icons.UploadCloudIcon className={classes.uploadCloudIcon} />
            <LiteText className={classes.textMargin} fullWidth={false}><FormattedMessage id="labelUpgradeVipMessage1" /></LiteText>
            <LiteText className={classes.textMargin} fullWidth={false}><FormattedMessage id="labelUpgradeVipMessage2" /></LiteText>
          </div>
          <div className={classNames(classes.actions, classes.verticalFlex)}>
            <Button
              disabled={isLoading || purchasing}
              onClick={this.handler.handlePurchase}
              className={classes.purchaseButton}
            >
              <Icons.CrownIcon />
              {buttonText}
            </Button>
            {isMac && (
              <Button
                disabled={isLoading || purchasing}
                className={classes.restorePurchase}
                onClick={this.handler.handleRestorePurchases}
              >
                <FormattedMessage id="buttonRestorePurchases" />
              </Button>
            )}
          </div>
          <div className={classes.close}>
            <IconButton color="inherit" onClick={onClose}>
              <Icons.ClearIcon />
            </IconButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}

UpgradeToVIPDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
};

UpgradeToVIPDialog.defaultProps = {
  open: false,
};

export default withStyles(styles)(injectIntl(UpgradeToVIPDialog));
