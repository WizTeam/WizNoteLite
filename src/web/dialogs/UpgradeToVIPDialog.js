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
    margin: 4,
  },

  header: {
    width: '100%',
    padding: '48px 16px',
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
    padding: '48px 16px',
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
            const products = await window.wizApi.userManager.queryProducts();
            const yearProduct = products.find((product) => product.productIdentifier === 'cn.wiz.note.lite.year');
            this.setState({ yearProduct });
          } catch (err) {
            console.error(err);
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
          console.error(err);
        }
      } else {
        await window.wizApi.userManager.showUpgradeVipDialog();
      }
    },

    onTransactionsUpdated: (params) => {
      const {
        productIdentifier, state,
        message,
      } = params;
      //
      if (productIdentifier !== 'cn.wiz.note.lite.year') {
        return;
      }
      //
      if (state === 'purchasing') {
        //
        return;
        //
      } else if (state === 'purchased') {
        //
      } else if (state === 'failed') {
        //
        const errorMessage = this.props.intl.formatMessage({ id: 'errorPurchaseFailed' }, { message });
        alert(errorMessage);
        //
      } else if (state === 'restored') {
        //
      } else {
        //
      }
      //
      this.setState({ purchasing: false });
      //
    },

    // handleRestorePurchases: () => {
    //   if (!window.wizApi.platform.isMac) {
    //     return;
    //   }
    //   //
    //   window.wizApi.userManager.restorePurchases();
    // },
  }

  constructor(props) {
    super(props);
    this.state = {
      yearProduct: null,
      purchasing: false,
    };
  }

  componentDidMount() {
    window.onTransactionsUpdated = this.handler.onTransactionsUpdated;
  }

  componentWillUnmount() {
    window.onTransactionsUpdated = null;
  }

  render() {
    const {
      classes, open, onClose, intl,
    } = this.props;

    const { yearProduct, purchasing } = this.state;

    const isMac = window.wizApi.platform.isMac;

    let buttonText = '';
    if (isMac) {
      if (purchasing) {
        buttonText = intl.formatMessage({ id: 'buttonPurchasing' });
      } else if (yearProduct) {
        buttonText = intl.formatMessage({ id: 'buttonUpgradeVIP' }, { price: yearProduct.formattedPrice });
      } else {
        buttonText = intl.formatMessage({ id: 'buttonPurchaseLoading' });
      }
    } else {
      buttonText = intl.formatMessage({ id: 'buttonUpgradeVIPWithPrice' });
    }

    return (
      <Dialog
        open={open}
        onEscapeKeyDown={onClose}
        onEnter={this.handler.handleDialogEnter}
      >
        <DialogContent className={classes.root}>
          <div className={classNames(classes.header, classes.verticalFlex)}>
            <LiteText className={classes.textMargin} variant="h1" fullWidth={false}><FormattedMessage id="labelUpgradeToVip" /></LiteText>
            <LiteText className={classes.textMargin} fullWidth={false}><FormattedMessage id="labelUpgradeToVipWhy" /></LiteText>
          </div>
          <div className={classNames(classes.message, classes.verticalFlex)}>
            <Icons.UploadCloudIcon className={classes.uploadCloudIcon} />
            <LiteText className={classes.textMargin} fullWidth={false}><FormattedMessage id="labelUpgradeVipMessage1" /></LiteText>
            <LiteText className={classes.textMargin} fullWidth={false}><FormattedMessage id="labelUpgradeVipMessage2" /></LiteText>
          </div>
          <div className={classNames(classes.actions, classes.verticalFlex)}>
            <Button
              onClick={this.handler.handlePurchase}
              className={classes.purchaseButton}
            >
              <Icons.CrownIcon />
              {buttonText}
            </Button>
            {/* {isMac && (
              <Button
                className={classes.restorePurchase}
                onClick={this.handler.handleRestorePurchases}
              >
                <FormattedMessage id="buttonRestorePurchases" />
              </Button>
            )} */}
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
