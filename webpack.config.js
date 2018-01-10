var ExtractTextPlugin = require ("extract-text-webpack-plugin");
var CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path');

module.exports = {    
    entry: "./src/main.js",
    output: {
        filename: "[name].[hash].bundle.js",
        path: path.resolve(__dirname, "dist"),
    },

    // Enable sourcemaps for debugging webpack"s output.
    devtool: "source-map",

    resolve: {
        extensions: [".webpack.js", ".web.js", ".js", ".jsx"],
        alias: {
            app: path.resolve(__dirname, "src/app/"),
            assets: path.resolve(__dirname, "src/assets/"),
            lib: path.resolve(__dirname, "src/lib/"),
            res: path.resolve(__dirname, "src/res/"),
        },
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
                // loaders: [
                //     "file?hash=sha512&digest=hex&name=[hash].[ext]",
                //     "image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false"
                // ]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            hash: "sha512",
                            digest: "hex",
                            name: "[hash].[ext]",                            
                        },
                    }
                ]
                
            }
        ],               
    },

    externals: {
        "leaflet": "L",
        //   "leaflet-geomixer": "L.gmx",
        //   "leaflet-tilelayer-mercator": "L.TileLayer.Mercator",
        //   "./initBaseLayerManager" : "L.gmxBaseLayersManager"
    },

    plugins: [   
        new ExtractTextPlugin("[contenthash].bundle.css"),
        new CopyWebpackPlugin([{ from: './src/assets/leaflet' }])
    ]
};