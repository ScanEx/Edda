const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'main.[hash].bundle.js',
    path: path.resolve(__dirname, 'dist'),    
    libraryTarget: 'umd2'
  },
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [   
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          }
        }
      },    
    ]
  },
};