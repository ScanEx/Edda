const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {    
    entry: "./src/main.js",
    output: {
        filename: "[name].[hash].bundle.js",
        path: path.resolve(__dirname, "dist"),
    },

    // Enable sourcemaps for debugging webpack"s output.
    devtool: "inline-source-map",

    mode: 'development',

    resolve: {
        extensions: [".webpack.js", ".web.js", ".js", ".jsx"],
        alias: {
            app: path.resolve(__dirname, "src/app/"),
            assets: path.resolve(__dirname, "src/assets/"),            
            res: path.resolve(__dirname, "src/res/"),
        },
    },

    module: {
        rules: [
            {
              test: /\.css$/,
              use: [
                { loader: 'style-loader' },
                { loader: 'css-loader'},
              ]
            },
            {
              test: /\.js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['env','flow'],
                }
              }
            },
            {
              test: /\.(png|jpg|gif|woff)$/,
              use: [
                {
                  loader: 'file-loader',
                  options: {
                    publicPath: 'dist'
                  }  
                }
              ]
            }
        ]
    },
    externals: {
        'leaflet': 'L'
    },
    plugins: [
      new CopyWebpackPlugin([
          { from: 'src/version/*', flatten: true },
          { from: 'upgrade/dist/*', flatten: true },
      ])
   ]
};