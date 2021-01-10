const oldExports = {
    entry: {
        server: "./src/index.ts",
        web: "./src/web/index.ts"
    },
    mode: NODE_ENV,
    target: "node",
    output: {
        path: path.resolve(__dirname, `server/dist`),
        filename: 'server.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.mjs']
    },
    devtool: NODE_ENV === "development" ? "cheap-eval-source-map" : "source-map",
    module: {
        rules: [
            // Fix for webpack to Resolve GraphQL .mjs files
            {
                test: /\.tsx?$/,
                exclude: /(node_modules)/,
                loader: "awesome-typescript-loader",
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            },
            {
                test: /\.s?css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: '../'
                        },
                    },
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                loader: 'url-loader?emitFile=false',
            },
            {
                test: /\.(woff|woff2|ttf|eot|otf)$/,
                loader: 'file-loader?emitFile=false'
            },
        ]
    },
    node: {
        __dirname: false
    },
    plugins: [
        new MiniCssExtractPlugin({filename: "public/style.css"}),
        new webpack.DefinePlugin({
            __isClient__: false,
        })
    ],
    externals: [
        nodeExternals({
            whitelist: [/\.s?css$/, /utils/]
        })
    ]
};

module.exports = {webpackConfig};

function webpackConfig(options) {
    if (!options) {
        throw new Error("Missing required `options` parameter");
    }

    const {
        entry,
        target = "web",
        output,
        jsx,
        ts,
        style,
        whitelistNodeModules,
        copy,
        externals
    } = options;

    if (!entry || typeof entry !== "string") {
        throw new Error("Missing required property `entry`");
    }
    if (!inArray(target, "web,node")) {
        throw new Error(`Unsupported target "${target}"`);
    }
    if (!output) {
        throw new Error("Missing required property `output`");
    }

    const {path: filePath, filename} = output;
    if (!filePath) {
        throw new Error("Missing required property `output.path`");
    }
    if (!filename) {
        throw new Error("Missing required property `output.filename`");
    }
    if (style) {
        const {type, extract} = style;
        if (type && !inArray(type, "css,scss")) {
            throw new Error("`style.type` property should be one of 'css', 'scss'");
        }
        if (extract && typeof extract !== "string") {
            throw new Error("`style.extract` should be a string");
        }
    }
    if (externals) {
        if (target === "node") {
            throw new Error("`externals` are supported only for `web` target");
        }
        if (typeof externals !== "object") {
            throw new Error("`externals` should be an object");
        }
        Object.keys(externals).forEach(key => {
            if (typeof externals[key] !== "string") {
                throw new Error(`externals["${key}"] is not a string`);
            }
        });
    }

    const {NODE_ENV = "development"} = process.env;
    const extensions = [".js"];

    if (jsx) {
        extensions.push(".jsx");
    }

    if (ts) {
        extensions.push(".ts");
        if (jsx) {
            extensions.push(".tsx");
        }
    }
    if (style) {
        extensions.push(".css");
        if (style.type === "scss") {
            extensions.push(".scss");
        }
    }

    // Rules
    const rules = [];

    if (ts) {
        rules.push({
            resource: {
                test: jsx ? /\.tsx?$/ : /\.ts$/,
                or: [
                    {include: /(@digitize)/},
                    {exclude: [/(node_modules)/, /\.test\.tsx?$/]}
                ]
            },
            loader: "awesome-typescript-loader",
        });
    }

    rules.push({
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader'
    });

    if (style) {
        const {type, extract, omit} = style;
        const test = type === "scss" ? /\.s?css$/ : /\.css$/;
        if (omit) {
            rules.push({
                test,
                loader: "css-loader"
            });
        }
        else {
            const use = [];
            if (extract) {
                use.push({
                    loader: MiniCssExtractPlugin.loader
                });
            }
            else {
                use.push("style-loader");
            }
            use.push("css-loader");
            if (type === "scss") {
                use.push("sass-loader");
            }
            rules.push({
                test,
                use
            });
        }
    }

    /*
        {
            test: /\.(png|svg|jpg|gif)$/,
            loader: 'url-loader?emitFile=false',
        },
        {
            test: /\.(woff|woff2|ttf|eot|otf)$/,
            loader: 'file-loader?emitFile=false'
        },
    ]
*/
    const plugins = [];
    if (style && style.extract) {
        plugins.push(new MiniCssExtractPlugin({filename: style.extract}),)
    }

    if (copy) {
        assertCopyOptions(copy);
        const copyOptions = Object.keys(copy).map(from => {
            const value = copy[from];
            if (typeof value === "string") {
                return {
                    from,
                    to: value
                }
            }
            else {
                return {from, ...value}
            }
        });
        plugins.push(new CopyWebpackPlugin(copyOptions));
    }

    const result = {
        entry,
        mode: NODE_ENV,
        target,
        output: {
            path: path.resolve(__dirname, filePath),
            filename
        },
        resolve: {extensions},
        devtool: NODE_ENV === "development" ? "cheap-eval-source-map" : "source-map",
        module: {rules},
        plugins,
        watchOptions: {
            ignored: /node_modules/
        }
    };

    /*
    optimization: {
        runtimeChunk: {
            name: "manifest"
        }
    },
    plugins: [
        new CleanWebpackPlugin(['public']),
        new CopyWebpackPlugin([
            {
                from: './src/assets/img',
                to: './img',
            },
            {
                from: './src/assets/fonts',
                to: './fonts',
            }
        ]),
        new webpack.DefinePlugin({
            __isClient__: true,
        }),
        new ManifestPlugin()
    ],
    devtool: NODE_ENV === "development" ? "cheap-eval-source-map" : "source-map",
    externals: [
        {
            "highcharts": "Highcharts",
            "react": "React",
            "react-dom": "ReactDOM",
            "react-router-dom": "ReactRouterDOM",
        },
        configExternals
    ]



    externals: [
        nodeExternals({
            whitelist: [/apollo/, /\.s?css$/]
        }),
        configExternals
    ]


     */

    if (target === "node") {
        result.node = {
            __dirname: false
        };

        result.externals = [
            nodeExternals({whitelist: whitelistNodeModules})
        ];
    }
    if (target === "web" && externals) {
        result.externals = [externals];
    }

    return result;
}

function inArray(value, arrayStr) {
    return arrayStr.split(",").indexOf(value) > -1;
}

function assertCopyOptions(obj) {
    if (typeof obj !== "object") {
        throw new Error("Value is not an object");
    }
    Object.keys(obj).forEach(key => assertCopyValue(obj[key], key));

    function assertCopyValue(value, key) {
        if (typeof value === "object") {
            if (typeof value.to !== "string") {
                throw new Error(`copy["${key}"].to should be a string`);
            }
        }
        else if (typeof value !== "string") {
            throw new Error(`copy["${key}"] should be either string or object`);
        }
    }
}
