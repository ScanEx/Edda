var ExtractTextPlugin = require ("extract-text-webpack-plugin");
var CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path');

module.exports = {    
    entry: "./init.js",
    output: {
        filename: "[name].[hash].bundle.js",
        path: path.resolve('..', __dirname, "dist"),
    },

    // Enable sourcemaps for debugging webpack"s output.
    devtool: "source-map",

    resolve: {
        extensions: [".webpack.js", ".web.js", ".js", ".jsx"],        
    },

    module: {
        rules: [
            {
                test: /.jsx?$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: ["es2015"]
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader",                    
                }),
            },                
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [                    
                    {
                        loader: "file-loader",
                        options: {
                            hash: "sha512",
                            digest: "hex",
                            name: "[hash].[ext]",                            
                        },                        
                    },
                    {
                        loader: "image-webpack-loader",
                        options: {
                            bypassOnDebug: true,                            
                        }
                    }
                ],                
            },
        ],               
    },

    externals: {
         "leaflet": "L",
        //  "leaflet-geomixer": "L.gmx",
        //  "leaflet-tilelayer-mercator": "L.TileLayer.Mercator"
    },


    plugins: [   
        new ExtractTextPlugin("[contenthash].bundle.css"),
    ]
};