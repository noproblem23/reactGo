/*
 * process.env.NODE_ENV - used to determine whether we generate a production or development bundle
 *
 * webpack --env.browser - used to determine whether to generate a browser or server bundle
 *
 * NOTE: browser/server is client/server-side rendering respectively in universal/isomorphic javascript
 *
 */
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import externals from './externals';
import PATHS from './paths';
import plugins from './plugins';
import resolve from './resolve';
import rules from './rules';

export default (env: { browser: boolean }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isBrowser = env.browser;
  console.log(`Running webpack in ${process.env.NODE_ENV} mode on ${isBrowser ? 'browser' : 'server'}`);

  const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true';
  const node = { __dirname: true, __filename: true };

  const prodServerRender = {
    mode: 'production',
    devtool: 'source-map',
    context: PATHS.app,
    entry: { server: '../server/index' },
    target: 'node',
    node,
    externals,
    output: {
      path: PATHS.compiled,
      filename: '[name].js',
      publicPath: PATHS.public,
    },
    module: { rules: rules({ production: true, browser: false }) },
    resolve,
    plugins: plugins({ production: true, browser: false }),
  };

  const prodBrowserRender = {
    mode: 'production',
    devtool: 'hidden-source-map',
    context: PATHS.app,
    entry: { app: ['./client'] },
    node,
    output: {
      path: PATHS.assets,
      filename: '[name].[chunkhash].js',
      chunkFilename: '[name].[chunkhash:6].js', // for code splitting. will work without but useful to set
      publicPath: PATHS.public,
    },
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          sourceMap: true,
          uglifyOptions: {
            output: {
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /node_modules/, // you may add "vendor.js" here if you want to
            name: 'vendor',
            chunks: 'initial',
            enforce: true,
          },
        },
      },
    },
    performance: { /* this to hide 'WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).' */
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    module: { rules: rules({ production: true, browser: true }) },
    resolve,
    plugins: plugins({ production: true, browser: true }),
  };

  const devBrowserRender = {
    mode: 'development',
    devtool: 'inline-source-map',
    context: PATHS.app,
    entry: { app: ['./client', hotMiddlewareScript] },
    node,
    output: {
      path: PATHS.assets,
      filename: '[name].js',
      publicPath: PATHS.public,
    },
    optimization: {
      // emitOnErrors: false,
    },
    module: { rules: rules({ production: false, browser: true }) },
    resolve,
    plugins: plugins({ production: false, browser: true }),
  };

  const devServerRender = {
    mode: 'development',
    devtool: 'inline-source-map',
    context: PATHS.app,
    entry: { server: '../server/index' },
    target: 'node',
    node,
    externals,
    output: {
      path: PATHS.compiled,
      filename: '[name].dev.js',
      publicPath: PATHS.public,
      libraryTarget: 'commonjs2',
    },
    module: { rules: rules({ production: false, browser: false }) },
    resolve,
    plugins: plugins({ production: false, browser: false }),
  };

  const prodConfig = isBrowser ? prodBrowserRender : prodServerRender;
  const devConfig = isBrowser ? devBrowserRender : devServerRender;
  return isProduction ? prodConfig : devConfig;
};

