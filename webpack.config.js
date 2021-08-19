import { dirname } from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import developmentOptions from './fvtt.config.js'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import WebpackBar from 'webpackbar'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Set the run mode for @constant bundleScript */
const buildMode =
  process.argv[3] === 'production' ? 'production' : 'development'

function systemFolderName () {
  if (buildMode === 'development') {
    const validDirectoryName = /^[a-zA-Z].*/
    if (validDirectoryName.test(developmentOptions.systemFolderName)) {
      return developmentOptions.systemFolderName
    }
  }
  return 'CoC7'
}

/**
 * Get the user data path for Foundry VTT, based on what is configured on key
 * userDataPath inside fvtt.config.js
 */
function buildDestination () {
  const { userDataPath } = developmentOptions
  if (fs.existsSync(userDataPath)) {
    return path.join(userDataPath, 'Data', 'systems', systemFolderName())
  }
  return path.join(__dirname, 'build/')
}

/** Set optimization options for when @constant buildMode is `production` */
const optimization =
  buildMode === 'production'
    ? {
        minimize: true,
        minimizer: [new CssMinimizerPlugin(), new UglifyJsPlugin()]
      }
    : undefined

/**
 * The nerve center. Here are all the settings for compiling bundles:
 * production and development
 */
const bundleScript = {
  bail: buildMode === 'production',
  context: __dirname,
  entry: './module/coc7.js',
  devtool: buildMode === 'development' ? undefined : 'inline-source-map',
  mode: buildMode,
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: true
            }
          },
          {
            loader: 'less-loader',
            options: { sourceMap: true }
          }
        ]
      }
    ]
  },
  optimization,
  output: {
    clean: true,
    path: buildDestination(),
    filename: 'bundle.js'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets/', to: 'assets/' },
        { from: 'lang/', to: 'lang/' },
        { from: 'LICENSE' },
        { from: 'packs/', to: 'packs/' },
        { from: 'README.md' },
        { from: 'system.json' },
        { from: 'template.json' },
        { from: 'templates/', to: 'templates/' }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: 'style.css',
      insert: 'head'
    }),
    new WebpackBar({})
  ],
  resolve: {
    extensions: ['.js']
  },
  watch: buildMode === 'development'
}

export default bundleScript
