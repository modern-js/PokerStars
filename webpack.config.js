const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const htmlWebpackPluginConfig = new HtmlWebpackPlugin({
    template: './src/client/index.html',
    filename: 'index.html',
    inject: 'body',
});


module.exports = {
    entry: './src/client/index.jsx',
    output: {
        path: path.resolve('dist'),
        filename: 'index_bundle.js',
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, loaders: ['babel-loader'/* , 'eslint-loader' */], exclude: /node_modules/ },
        ],
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
        htmlWebpackPluginConfig,
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
    },
};