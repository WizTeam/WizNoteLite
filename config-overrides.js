/* config-overrides.js */
const { setWebpackOptimizationSplitChunks, useBabelRc, override } = require('customize-cra');
const path = require('path');

const HOMEPAGE = process.argv.filter((arg) => {
  if (arg.match(/HOMEPAGE=.+/ig)) {
    return true;
  }
  return false;
});

const config = override(
  setWebpackOptimizationSplitChunks({
    chunks: 'async',
    minSize: 30000,
    maxSize: 1024000,
    minChunks: 1,
    maxAsyncRequests: 6,
    maxInitialRequests: 4,
    automaticNameDelimiter: '~',
    cacheGroups: {
      defaultVendors: {
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
      },
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
    },
  }),
  useBabelRc(),
);


config.paths = (paths/* , env */) => {
  // eslint-disable-next-line no-param-reassign
  paths.appBuild = path.join(__dirname, 'web-app');
  return paths;
};

process.env.PUBLIC_URL = HOMEPAGE.join('').replace(/HOMEPAGE=/ig, '');

module.exports = config;
