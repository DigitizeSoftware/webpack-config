# webpack-config

## Summary
This package is intended to help bootstrap and easily edit your Webpack config. I created it when I got annoyed reading webpack documenation every time I bootstrap a new project or need to update the configuration of the existing one.

## How it works?
Call the exported function `webpackConfig()` with simple set of options (description TBD) and it will return a webpack configuration object which you can export from your `webpack.config.js` to build a project with minimum efforts.

The in-depth documentation is on the way. In the meantime please read through the source code.

```$javascript
webpackConfig(options)
```

- **options** webpack target configuration options (see below)

Returns webpack target

### Options

#### `options.entry` string, required.
Relative path to webpack target entry point. The value of this options is passed to webpack target `entry` property as is.
See [webpack docs](https://webpack.js.org/configuration/entry-context/#entry) for details
 
#### `options.target` "web" | "node" = "web"
Type of target. This value is copied to `target` property of resulting webpack target config. Besides that, it has
several other side effects:
- `"web"` in this type of target you can specify dependencies to be excluded from the output bundle using 
  `options.externals` property.  
- `"node"` automatically excludes all `node_modules` from output bundle using 
  [webpack-node-externals](https://www.npmjs.com/package/webpack-node-externals) library. See 
  `options.whitelistNodeModules` for details on whitelisting some modules if needed. Also, sets 
  `config.node = {__dirname: false}` to preserve `__dirname` constant values. See 
  [node.__dirname config](https://webpack.js.org/configuration/node/#node__dirname) for details.
  
#### `options.output` object
Determines where to store resulting bundles.

#### `options.output.path` string, required = "dist"
The output directory path relative to CWD (current working directory).

#### `options.output.filename` string, required = "index.js"
Name of main output bundle e.g. `"index.js"`

#### `otions.jsx` boolean = false
Supports JSX files. Currently only works in TypeScript mode

#### `options.ts` boolean = true
If set to true, webpack is configured to build a TypeScript project, e.g. compile `.ts`/`.tsx` files using 
`awesome-typescript-loader`

#### `options.style` object, optional
If specified, webpack is configured to process `.css` files using [css-loader](https://www.npmjs.com/package/css-loader) 
plugin. By default bundle file will contain code that will automatically insert compiled styles into DOM when needed.
As a result, all CSS styles will be packed into the same bundle with the rest of the code. 

#### `options.style.type` "css" | "scss" = "css"
If set to `"scss"`, webpack is configured to process `.scss` files using 
[sass-loader](https://www.npmjs.com/package/sass-loader) plugin.

#### `options.style.extract` string, optional
Name for extracted CSS style bundle. If specified, all CSS styles will be extract to a separated bundle file e.g. 
`"style.css"` and you would have to reference this bundle from your HTML code manually.

#### `options.style.omit` boolean = false
If set to true, will ignore any `.css`/`.scss` files. This option is useful if you want to build SSR (server-side 
rendering) application on the backend side but don't want to compile same style twice in both client and server targets

#### `options.whitelistNodeModules` Array<string>, optional.
This options determines the `node_modules` which should not be excluded from output bundle in case of `"node"` target type.
See `webpack-node-externals` [options.allowlist](https://www.npmjs.com/package/webpack-node-externals#optionsallowlist-) 
documentation for details. 

#### `options.copy` object, optional
This options allows to copy certain files to output folder "as is". Expected value is a hash map where keys
represent [**from**](https://webpack.js.org/plugins/copy-webpack-plugin/#from) property and values could be either 
[**to**](https://webpack.js.org/plugins/copy-webpack-plugin/#to) strings or 
[**pattern**](https://webpack.js.org/plugins/copy-webpack-plugin/#patterns) objects with `from` property omitted. 
Example:
```javascript
webpackConfig({
    // ...
    copy: {
        "./ssl/server.{crt,key}": {to: "./ssl", flatten: true},
        "./firebase/firebase-admin-cert.json": "./"
    }
});
```

#### `options.externals` object, optional
Hash map of dependencies which need to be excluded from the bundle. This options is available only for `"web"` targets 
and is handy when you want to include 3rd party (vendor) dependencies from CDN as already built assets. Under the hood
it utilizes webpack config `externals` property in the following way (using 
[string](https://webpack.js.org/configuration/externals/#string) values): 
```javascript
    {
        ...
        externals: [options.externals]
    }
``` 

### Known issues

* `jsx` only works in `ts` mode e.g. when `options.ts === true`