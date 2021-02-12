const process = require("process");
const nodeExternals = require('webpack-node-externals');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    webpackConfig: options => {
        try {
            createConfig(options);
        }
        catch (e) {
            console.error("Error: " + e.message);
            process.exit(1);
        }
    }
};

function createConfig(options) {
    if (!options) {
        throw new Error("Missing required `options` parameter");
    }

    const {
        entry,
        target = "web",
        output,
        jsx,
        ts = true,
        style,
        whitelistNodeModules,
        copy,
        externals
    } = options;

    const {type: styleType = "css", extract: styleExtract} = style || {};

    if (!entry || typeof entry !== "string") {
        throw new Error("Missing required property `entry`");
    }
    if (!inArray(target, "web,node")) {
        throw new Error(`Unsupported target "${target}"`);
    }
    if (!output) {
        throw new Error("Missing required property `output`");
    }

    const {path: filePath = "dist", filename = "index.js"} = output;
    if (!filePath) {
        throw new Error("Missing required property `output.path`");
    }
    if (!filename) {
        throw new Error("Missing required property `output.filename`");
    }
    if (style) {
        if (styleType && !inArray(styleType, "css,scss")) {
            throw new Error("`style.type` property should be one of 'css', 'scss'");
        }
        if (styleExtract && typeof styleExtract !== "string") {
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
        if (styleType === "scss") {
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
        const test = styleType === "scss" ? /\.s?css$/ : /\.css$/;
        if (style.omit) {
            rules.push({
                test,
                loader: "css-loader"
            });
        }
        else {
            const use = [];
            if (styleExtract) {
                use.push({
                    loader: MiniCssExtractPlugin.loader
                });
            }
            else {
                use.push("style-loader");
            }
            use.push("css-loader");
            if (styleType === "scss") {
                use.push("sass-loader");
            }
            rules.push({
                test,
                use
            });
        }
    }

    const plugins = [];
    if (styleExtract) {
        plugins.push(new MiniCssExtractPlugin({filename: styleExtract}),)
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
            path: path.resolve(process.cwd(), filePath),
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

    if (target === "node") {
        result.node = {
            __dirname: false
        };

        result.externals = [
            nodeExternals({allowlist: whitelistNodeModules})
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
