# Angular编译运行
先创建一个简单的项目。可以从 https://github.com/wuanrin/angular-simple.git 克隆。


## 1. tsc + system.js 方式

用 tsc 编译 typescript 代码，system.js 作为模块加载器。
编译命令：`tsc --outDir dist`。
将该命令加入到 package.json 中的 scripts 中：
```json
{
  "scripts": {
    "build": "tsc --outDir dist"
  }
}
```

### 内联的模板文件

1. 添加 system.js 的配置文件 src/systemjs.config.ts。内容：
```typescript
System.config({
    map: {
        '@angular/common': 'node_modules/@angular/common/bundles/common.umd.js',
        '@angular/compiler': 'node_modules/@angular/compiler/bundles/compiler.umd.js',
        '@angular/core': 'node_modules/@angular/core/bundles/core.umd.js',
        '@angular/platform-browser': 'node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
        '@angular/platform-browser-dynamic': 'node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
        'rxjs': 'node_modules/rxjs'
    },
    packages: {
        app: {
            defaultExtension: 'js'
        },
        rxjs: {
            defaultExtension: 'js'
        }
    }
});
```
需要安装 system.js 的声明包：`npm install @types/systemjs --save`。

2. 添加 index.html 文件到 dist 目录。内容：
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Angular Demo</title>
<base href="/">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>

<app-root>Loading...</app-root>

<script src="node_modules/core-js/client/shim.min.js"></script>
<script src="node_modules/zone.js/dist/zone.js"></script>
<script src="node_modules/rxjs/bundles/Rx.min.js"></script>
<script src="node_modules/systemjs/dist/system.src.js"></script>
<script src="systemjs.config.js"></script>
<script>
System.import('main.js').catch(function(err){ console.error(err); });
</script>

</body>
</html>
```

3. 预览。这使用 lite-server 包来预览项目。

    1. 先安装 lite-server：`npm install lite-server --save-dev`。

    2. 添加 lite-server 的配置文件 bs-config.json。内容：

        ```json
        {
            "server": {
                "baseDir": "dist",
                "routes": {
                    "/node_modules": "node_modules"
                }
            }
        }
        ```
    
    3. 运行命令`lite-server`查看效果。将命令添加到 package.json 中：

        ```json
        {
          "scripts": {
            "build": "tsc --outDir dist",
            "server": "lite-server"
          }
        }
        ```
这样一个最简单的项目就编译好了。

### 单独的模板文件或者样式文件

添加模板文件和 css 文件时的情况。在 src/app 目录中添加 app.component.html、app.component.css 并在 app.compnent.ts 中引用：
```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
```
再编译查看效果，这时会有报错：zone.js:2263 GET http://localhost:3000/app.component.html 404 (Not Found)。解决办法：

1. 添加 system.js 的一个自定义加载器 src/systemjs-angular-loader.ts。内容：

```typescript
var templateUrlRegex = /templateUrl\s*:(\s*['"`](.*?)['"`]\s*)/gm;
var stylesRegex = /styleUrls *:(\s*\[[^\]]*?\])/g;
var stringRegex = /(['`"])((?:[^\\]\\\1|.)*?)\1/g;

export var translate = function(load: {source: string, address: string}){
  if (load.source.indexOf('moduleId') != -1) return load;

  var url = document.createElement('a');
  url.href = load.address;

  var basePathParts = url.pathname.split('/');

  basePathParts.pop();
  var basePath = basePathParts.join('/');

  var baseHref = document.createElement('a');
  baseHref.href = this.baseURL;
  var baseHrefStr = baseHref.pathname;

  if (!baseHrefStr.startsWith('/base/')) { // it is not karma
    basePath = basePath.replace(baseHrefStr, '');
  }

  load.source = load.source
    .replace(templateUrlRegex, function(match, quote, url){
      var resolvedUrl = url;

      if (url.startsWith('.')) {
        resolvedUrl = basePath + url.substr(1);
      }

      return 'templateUrl: "' + resolvedUrl + '"';
    })
    .replace(stylesRegex, function(match, relativeUrls) {
      var urls = [];
      var rs;
      while ((rs = stringRegex.exec(relativeUrls)) !== null) {
        if (rs[2].startsWith('.')) {
          urls.push('"' + basePath + rs[2].substr(1) + '"');
        } else {
          urls.push('"' + rs[2] + '"');
        }
      }

      return "styleUrls: [" + urls.join(', ') + "]";
    });

  return load;
};
```

2. 更改 systemjs.config.ts 文件。内容：

```typescript
System.config({
    // 内容省略...
    packages: {
        app: {
            defaultExtension: 'js',
            meta: {
                './*.js': {
                    loader: 'systemjs-angular-loader.js'
                }
            }
        },
        // 内容省略...
    }
});
```

3. 由于 tsc 编译器不会编译 html 文件，所以将 src/app/app.component.html 文件复制一份到 dist/app 目录下。

4. 重新编译查看效果。

## 2. tsc + system.js + aot 方式

tsc 只是将 typescript 编译为 javascript。而 Angular 需要将模板，css 等编译为 javascript。以上方式是 JIT(just in time 即时编译)。
现在改为 AOT方式(ahead of time 预编译)。

1. 新建一份 aot 版本的 tsc 配置文件 tsconfig.aot.json。内容：

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "es5",
    "typeRoots": [
      "node_modules/@types"
    ],
    "lib": [
      "es2016",
      "dom"
    ]
  },
  "files": [
    "src/main.aot.ts",
    "src/app/app.module.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "dist.aot"
  ],
  "angularCompilerOptions": {
    "genDir": "aot",
    "skipMetadataEmit" : true
  }
}
```
主要更是添加了 angularCompilerOptions 选项，用于配置编译生成的位置。还有 files 选项，主要是定义需要编译的文件（包含依赖），
因为有些文件是不需要的。

2. 由于生成的目录结构不一样，我们需要修改 system.js 的配置文件。

新建一个文件 src/systemjs.config.aot.ts。内容：
```typescript
System.config({
    paths: {
        app: 'src/app'
    },
    map: {
        '@angular/common': 'node_modules/@angular/common/bundles/common.umd.js',
        '@angular/compiler': 'node_modules/@angular/compiler/bundles/compiler.umd.js',
        '@angular/core': 'node_modules/@angular/core/bundles/core.umd.js',
        '@angular/platform-browser': 'node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
        '@angular/platform-browser-dynamic': 'node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
        'rxjs': 'node_modules/rxjs'
    },
    packages: {
        app: {
            defaultExtension: 'js'
        },
        aot: {
            defaultExtension: 'js'
        },
        rxjs: {
            defaultExtension: 'js'
        }
    }
});
```
更改：
* 去掉了 systemjs-angular-loader 模板加载方式，因为模板已经打包为 JavaScript
* 更改了目录映射

将该文件加入到 tsc 配置文件 tsconfig.aot.json 中。内容：
```json
{
  // 省略...
  "files": [
    // 省略...
    "src/systemjs.config.aot.ts"
  ]
  // 省略...
}
```

3. 更改引导方式。添加新的入口文件 src/main.aot.ts。内容：

```typescript
import { platformBrowser }    from '@angular/platform-browser';
import { enableProdMode }     from '@angular/core';
import { AppModuleNgFactory } from '../aot/src/app/app.module.ngfactory';

platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);
```

4. 入口页面 index.html 更改。内容：
```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Angular Demo</title>
<base href="/">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>

<app-root>Loading...</app-root>

<script src="node_modules/core-js/client/shim.min.js"></script>
<script src="node_modules/zone.js/dist/zone.js"></script>
<script src="node_modules/rxjs/bundles/Rx.min.js"></script>
<script src="node_modules/systemjs/dist/system.src.js"></script>
<script src="src/systemjs.config.aot.js"></script>
<script>
System.import('src/main.aot.js').catch(function(err){ console.error(err); });
</script>

</body>
</html>
```
主要是目录引用的更改。

5. 更改编译方式。用 ngc 工具取代 tsc 工具。

ngc 命令 @angular/compiler-cli 包包含的一个编译工具。
命令：`node_modules/.bin/ngc -p tsconfig.aot.json`。
我们将其加入到 package.json 中：
```json
{
  "scripts": {
    "build": "tsc --outDir dist",
    "build.aot": "ngc -p tsconfig.aot.json",
    "server": "lite-server"
  }
}
```

6. 更改预览服务器。

    1. 新建配置文件 /bs-config.aot.json。内容：

        ```json
        {
            "server": {
                "baseDir": "dist.aot",
                "routes": {
                    "/node_modules": "node_modules"
                }
            }
        }
        ```

    2. 新建命令。package.json:
 
        ```json
        {
          "scripts": {
            "build": "tsc --outDir dist",
            "build.aot": "ngc -p tsconfig.aot.json",
            "server": "lite-server",
            "server.aot": "lite-server -c bs-config.aot.json"
          }
        }
        ```

    3. 执行命令 `npm run server.aot` 查看效果

## 3. webpack 方式

可以分为开发模式和生产模式。

### 开发模式

1. 安装 webpack 及相关插件

`npm install webpack awesome-typescript-loader angular2-template-loader html-loader extract-text-webpack-plugin html-webpack-plugin --save-dev`

2. 新建 webpack 入口文件。
  
  * src/polyfills.ts

  ```typescript
  import 'core-js/es6';
  import 'core-js/es7/reflect';
  require('zone.js/dist/zone');

  if (process.env.ENV === 'production') {
    // Production
  } else {
    // Development and test
    Error['stackTraceLimit'] = Infinity;
    require('zone.js/dist/long-stack-trace-zone');
  }
  ```
  
  * src/vendor.ts
  
  ```typescript
  // Angular
  import '@angular/platform-browser';
  import '@angular/platform-browser-dynamic';
  import '@angular/core';
  import '@angular/common';

  // RxJS
  import 'rxjs';
  ```

3. 新建 webpack 配置文件 webpack.config.js。内容：

```js
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// 输出目录
var distPath = path.join(__dirname, 'dist.webpack');

var appPath = path.join(__dirname, 'src', 'app');

module.exports = {
  devtool: 'cheap-module-eval-source-map',

  resolve: {
    extensions: ['.ts', '.js']
  },

  entry: {
    polyfills: './src/polyfills.ts',
    vendor: './src/vendor.ts',
    app: './src/main.ts'
  },

  output: {
    path: distPath,
    publicPath: '/',
    filename: '[name].js',
    chunkFilename: '[id].chunk.js'
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          'awesome-typescript-loader',
          'angular2-template-loader'
        ]
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.css$/,
        exclude: appPath,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: 'css-loader?sourceMap'
        })
      },
      {
        test: /\.css$/,
        include: appPath,
        loader: 'raw-loader'
      }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor', 'polyfills']
    }),

    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ]
};
```

4. 编译

命令：`webpack --progress --profile --bail`。加入到 package.json。

```json
{
  "scripts": {
    "build": "tsc --outDir dist",
    "build.aot": "ngc -p tsconfig.aot.json",
    "build.webpack": "webpack --progress --profile --bail",
    "server": "lite-server",
    "server.aot": "lite-server -c bs-config.aot.json"
  }
}
```

5. 添加开发服务器

webpack 提供了一个开发服务器 webpack-dev-server。该服务器启动一个服务器的同时也会编译工程，和 webpack 编译一样，
区别是 webpack 会生成文件，而 webpack-dev-server 不会生成文件，而是编译在内存中。

  1. 安装 `npm install webpack-dev-server --save-dev`。
  
  2. 添加配置
  
    在 webpack 配置文件 webpack.config.js 中添加 devServer 项：

    ```js
    // 省略...
    module.exports = {
      // 省略...
      devServer: {
        contentBase: distPath,
        historyApiFallback: true,
        stats: 'minimal',

        // 代理
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            pathRewrite: {"^/api" : ""}
          }
        }
      }
    };
    ```

  3. 添加命令。package.json:
  
  ```json
  {
    "scripts": {
      "build": "tsc --outDir dist",
      "build.aot": "ngc -p tsconfig.aot.json",
      "build.webpack": "webpack --progress --profile --bail",
      "server": "lite-server",
      "server.aot": "lite-server -c bs-config.aot.json",
      "server.webpack": "webpack-dev-server --open --inline --progress --hot"
    }
  }
  ```

### 生产模式

1. 新建 webpack 配置文件 webpack.prod.js。内容：

```js
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// 输出目录
var distPath = path.join(__dirname, 'dist.webpack.prod');

var appPath = path.join(__dirname, 'src', 'app');

module.exports = {
  devtool: 'source-map',

  resolve: {
    extensions: ['.ts', '.js']
  },

  entry: {
    polyfills: './src/polyfills.ts',
    vendor: './src/vendor.ts',
    app: './src/main.aot.ts'
  },

  output: {
    path: distPath,
    publicPath: '/',
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].chunk.js'
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          {
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: 'tsconfig.aot.json'
            }
          },
          'angular2-template-loader'
        ]
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.css$/,
        exclude: appPath,
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: 'css-loader?sourceMap'
        })
      },
      {
        test: /\.css$/,
        include: appPath,
        loader: 'raw-loader'
      }
    ]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor', 'polyfills']
    }),

    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),

    new webpack.NoEmitOnErrorsPlugin(),

    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        keep_fnames: true
      }
    })
  ]
};
```

注意：入口文件 entry.app 改为了 main.aot.ts。

2. 添加命令 build.webpack.prod, start, publish。

start 用于开发，publish 用于发布。

```json
{
  "scripts": {
    "start": "npm run server.webpack",
    "publish": "npm run build.webpack.prod",
    "build": "tsc --outDir dist",
    "build.aot": "ngc -p tsconfig.aot.json",
    "build.webpack": "webpack --progress --profile --bail --hot",
    "build.webpack.prod": "webpack --progress --profile --bail --config webpack.prod.js",
    "server": "lite-server",
    "server.aot": "lite-server -c bs-config.aot.json",
    "server.webpack": "webpack-dev-server --open --inline --progress --hot"
  }
}
```
