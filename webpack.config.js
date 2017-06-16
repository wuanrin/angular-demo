var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// 输出目录
var distPath = path.join(__dirname, 'dist.webpack');

var appPath = path.join(__dirname, 'src', 'app');

module.exports = {
  devtool: 'cheap-module-eval-source-map',

  resolve: {
    extensions: ['.ts', '.js']
  },

  entry: {
    polyfills: './src/polyfills.ts',
    vendor: './src/vendor.ts',
    app: './src/main.ts'
  },

  output: {
    path: distPath,
    publicPath: '/',
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          'awesome-typescript-loader',
          'angular2-template-loader'
        ]
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.css$/,
        exclude: appPath,
        loader: ExtractTextPlugin.extract({ fallbackLoader: 'style-loader', loader: 'css-loader?sourceMap' })
      },
      {
        test: /\.css$/,
        include: appPath,
        loader: 'raw-loader'
      }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor', 'polyfills']
    }),

    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ],

  devServer: {
    contentBase: distPath,
    historyApiFallback: true,
    stats: 'minimal',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        pathRewrite: {"^/api" : ""}
      }
    }
  }
};