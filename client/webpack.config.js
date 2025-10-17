const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isProduction = process.env.NODE_ENV === 'production';

const webpack = {
    target: [ 'web', 'es5' ],
    entry: './src/index.js',
    mode: isProduction ? 'production' : 'development',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'studio',
        libraryExport: 'default'
    },
    plugins: [],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    isProduction ? MiniCssExtractPlugin.loader : "style-loader",
                    "css-loader",
                    "postcss-loader"
                ],
            }
        ],
    },
    devServer: {
        static : {
            directory : path.join(__dirname, "/")
        },
        port: 4001,
        historyApiFallback: true,
        hot: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false
            }
        }
    },
    stats: {
        warnings: false
    },
    optimization: {
        minimize: isProduction,
    }
};

if (isProduction) {
    webpack.plugins.push(
        new MiniCssExtractPlugin({
            filename: 'style.css'
        })
    );
}

module.exports = webpack;