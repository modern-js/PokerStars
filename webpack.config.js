const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/client/index.js',
    output: {
        path: path.resolve('dist'),
        filename: 'index_bundle.js',
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
        ],
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
    ],
};