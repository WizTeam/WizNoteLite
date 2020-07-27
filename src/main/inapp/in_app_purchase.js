const {
  inAppPurchase, BrowserWindow, app, shell,
} = require('electron');
const path = require('path');
const i18n = require('i18next');
const fs = require('fs-extra');
const { WizInternalError } = require('../../share/error');
const request = require('../common/request');
const users = require('../user/users');

const isWindows = process.platform === 'win32';

let currentUserGuid;

function getCurrentUserGuid() {
  if (currentUserGuid) {
    return currentUserGuid;
  }
  //
  return users.getUsers()[0].userGuid;
}

async function verifyPurchase(transaction, receiptURL) {
  //
  let receiptData = null;
  try {
    if (receiptURL.startsWith('/')) {
      receiptData = await fs.readFile(receiptURL);
    } else {
      receiptData = await request.downloadToData({
        url: receiptURL,
        method: 'GET',
      });
    }
  } catch (err) {
    const errorMessage = i18n.t('errorDownloadReceipt', {
      message: err.message,
    });
    throw new WizInternalError(errorMessage);
  }

  const userGuid = getCurrentUserGuid();
  const userData = users.getUserData(userGuid);
  const user = userData.user;
  //
  const server = userData.accountServer.server;
  //
  const data = {
    receipt: receiptData.toString('base64'),
    userGuid: user.userGuid,
    userId: user.userId,
    clientType: 'lite',
    apiVersion: app.getVersion(),
    transactionId: transaction.transactionIdentifier,
  };
  //
  try {
    await request.standardRequest({
      url: `${server}/as/pay2/ios`,
      data,
      method: 'POST',
    });
    //
    await users.refreshUserInfo(userGuid);
    //
    return true;
  } catch (err) {
    const errorMessage = i18n.t('errorVerifyPurchase', {
      message: err.message,
    });
    throw new WizInternalError(errorMessage);
  }
}

async function sendTransactionsEvents(state, productIdentifier, userGuid, message) {
  const mainWindow = BrowserWindow.getAllWindows().find((win) => win.isMainWindow);
  if (!mainWindow) {
    return;
  }
  //
  const params = {
    state,
    productIdentifier,
    userGuid,
    message,
  };
  const paramsData = JSON.stringify(params);
  const script = `window.onTransactionsUpdated(${paramsData})`;
  await mainWindow.webContents.executeJavaScript(script);
}

function initInAppPurchases() {
  if (inAppPurchase && inAppPurchase.canMakePayments()) {
    // 尽早监听transactions事件.
    inAppPurchase.on('transactions-updated', async (event, transactions) => {
      if (!Array.isArray(transactions)) {
        return;
      }

      // 检查每一笔交易.
      for (const transaction of transactions) {
        const payment = transaction.payment;

        switch (transaction.transactionState) {
          case 'purchasing':
            console.log(`Purchasing ${payment.productIdentifier}...`);
            await sendTransactionsEvents('purchasing', payment.productIdentifier);
            break;

          case 'purchased': {
            console.log(`${payment.productIdentifier} purchased.`);
            await sendTransactionsEvents('verifying', payment.productIdentifier);
            const receiptURL = inAppPurchase.getReceiptURL();
            try {
              const userGuid = await verifyPurchase(transaction, receiptURL);
              await sendTransactionsEvents('purchased', payment.productIdentifier, userGuid);
              inAppPurchase.finishTransactionByDate(transaction.transactionDate);
            } catch (err) {
              console.error(err);
              await sendTransactionsEvents('failed', payment.productIdentifier, null, err.message);
            }
            break;
          }

          case 'failed':
            console.log(`Failed to purchase ${payment.productIdentifier}.`);
            await sendTransactionsEvents('failed', payment.productIdentifier, null, transaction.errorMessage);
            inAppPurchase.finishTransactionByDate(transaction.transactionDate);
            break;

          case 'restored': {
            console.log(`The purchase of ${payment.productIdentifier} has been restored.`);
            await sendTransactionsEvents('verifying', payment.productIdentifier);
            const receiptURL = inAppPurchase.getReceiptURL();
            try {
              const userGuid = await verifyPurchase(transaction, receiptURL);
              await sendTransactionsEvents('restored', payment.productIdentifier, userGuid);
            } catch (err) {
              console.error(err);
              await sendTransactionsEvents('failed', payment.productIdentifier, null, err.message);
            }
            break;
          }

          case 'deferred':
            console.log(`The purchase of ${payment.productIdentifier} has been deferred.`);
            await sendTransactionsEvents('deferred', payment.productIdentifier);
            break;

          default:
            break;
        }
      }
    });
  }
}

async function queryProducts() {
  if (!inAppPurchase.canMakePayments()) {
    throw new WizInternalError(i18n.t('errorNotAllowMakeInAppPurchase'), 'WizErrorNowAllowMakePayments');
  }
  //
  // 检索并显示产品描述.
  const PRODUCT_IDS = ['cn.wiz.note.lite.year'];
  const products = await inAppPurchase.getProducts(PRODUCT_IDS);
  // 检查参数.
  if (!Array.isArray(products) || products.length <= 0) {
    throw new WizInternalError(i18n.t('errorReceiveProductionInfo'));
  }

  // 显示每个产品的名称和价格.
  products.forEach((product) => {
    console.log(`The price of ${product.localizedTitle} is ${product.formattedPrice}.`);
  });
  //
  return products;
}

async function purchaseProduct(event, userGuid, selectedProduct) {
  currentUserGuid = userGuid;
  if (!inAppPurchase.canMakePayments()) {
    throw new WizInternalError(i18n.t('errorNotAllowMakeInAppPurchase'), 'WizErrorNowAllowMakePayments');
  }
  const selectedQuantity = 1;
  const productIdentifier = selectedProduct.productIdentifier;
  const isProductValid = await inAppPurchase.purchaseProduct(productIdentifier, selectedQuantity);
  if (!isProductValid) {
    throw new WizInternalError(i18n.t('errorProductInNotValid'));
  }
  console.log('The payment has been added to the payment queue.');
  return true;
}

async function showUpgradeVipDialog(event, userGuid) {
  const userData = users.getUserData(userGuid);
  const apiServer = userData.accountServer.apiServer;
  const token = userData.token;
  const url = `${apiServer}/?p=wiz&c=vip_lite&token=${token}&clientType=lite&clientVersion=${app.getVersion()}`;

  //
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  //
  const upgradeVipDialog = new BrowserWindow({
    width: 400,
    height: 600,
    parent: mainWindow,
    modal: true,
    resizable: false,
    minimizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, '../../web/dialog_preload.js'),
    },
  });

  //
  const user = users.getUserInfo(userGuid);

  upgradeVipDialog.on('closed', async () => {
    //
    try {
      if (isWindows) {
        setTimeout(() => {
          mainWindow.setAlwaysOnTop(false);
        }, 300);
      }
      //
      const newUser = await users.refreshUserInfo(userGuid);
      if (newUser.vip && newUser.vipDate !== user.vipDate) {
        await sendTransactionsEvents('purchased', '', userGuid);
      }
    } catch (err) {
      console.error(err);
    }
  });

  upgradeVipDialog.webContents.on('new-window', (e, linkUrl) => {
    if (isWindows) {
      mainWindow.setAlwaysOnTop(true);
    }
    e.preventDefault();
    shell.openExternal(linkUrl);
  });


  // aoid flicker
  // https://github.com/electron/electron/issues/10616
  //
  if (isWindows) {
    mainWindow.setAlwaysOnTop(true);

    upgradeVipDialog.on('focus', () => {
      mainWindow.setAlwaysOnTop(true);
    });

    upgradeVipDialog.on('blur', () => {
      mainWindow.setAlwaysOnTop(false);
    });
  }

  upgradeVipDialog.loadURL(url);
  upgradeVipDialog.removeMenu();
  upgradeVipDialog.show();
}

async function restorePurchases(userGuid) {
  currentUserGuid = userGuid;
  inAppPurchase.restoreCompletedTransactions();
}

initInAppPurchases();

module.exports = {
  queryProducts,
  purchaseProduct,
  restorePurchases,
  showUpgradeVipDialog,
};
