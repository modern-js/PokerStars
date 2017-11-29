const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const htmlWebpackPluginConfig = new HtmlWebpackPlugin({
    template: './index.html',
    filename: 'index.html',
    inject: 'body',
});

const copyWebpackPluginConfig = new CopyWebpackPlugin([
    {
        from: 'img',
        to: 'img',
    },
]);


module.exports = {
    context: path.join(__dirname, 'src', 'client'),
    entry: './index.jsx',
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
        copyWebpackPluginConfig,
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
    },
};