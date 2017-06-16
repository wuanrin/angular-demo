var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// 输出目录
var distPath = path.join(__dirname, 'dist.webpack.prod');

var appPath = path.join(__dirname, 'src', 'app');

module.exports = {
	devtool: 'source-map',

	resolve: {
		extensions: ['.ts', '.js']
	},

	entry: {
		polyfills: './src/polyfills.ts',
		vendor: './src/vendor.ts',
		app: './src/main.aot.ts'
	},

	output: {
		path: distPath,
		publicPath: '/',
		filename: '[name].[hash].js',
		chunkFilename: '[id].[hash].chunk.js'
	},

	module: {
		rules: [
			{
				test: /\.ts$/,
				loaders: [
					{
						loader: 'awesome-typescript-loader',
						options: {
							configFileName: 'tsconfig.aot.json'
						}
					},
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
				loader: ExtractTextPlugin.extract({
					fallbackLoader: 'style-loader',
					loader: 'css-loader?sourceMap'
				})
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
		}),

		new webpack.NoEmitOnErrorsPlugin(),

		new webpack.optimize.UglifyJsPlugin({
			mangle: {
				keep_fnames: true
			}
		})
	]
};