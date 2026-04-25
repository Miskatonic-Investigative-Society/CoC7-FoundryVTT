import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TemplateHelpers from './src/template-helpers.js'
import TerserPlugin from 'terser-webpack-plugin'
import WebpackBar from 'webpackbar'

export default class WebpackConfig {
  #args
  #config
  #validated

  /**
   * Constructor
   */
  constructor () {
    TemplateHelpers.requireNodeVersion()

    this.#args = TemplateHelpers.parseNodeArguments('Webpack command line extender', {
      mode: { message: 'Production or Development', group: false },
      debug: { message: 'Show the config before passing to Webpack.', group: false },
      env: { message: 'Allow passing arguments to this config script', group: true }
    })
    this.#config = {}
    this.#validated = false
  }

  /**
   * Default configuration
   * @returns {object}
   */
  get #defaultOptions () {
    return {
      buildMode: '',
      debugOutput: false,
      folderId: '',
      type: ''
    }
  }

  /**
   * Setup config
   * @param {object} options None currently supported
   */
  async validate (options = {}) {
    this.#config = { ...this.#defaultOptions, ...options }
    this.#config.rootFolder = TemplateHelpers.systemRoot

    if (!fs.existsSync(path.join(this.#config.rootFolder, 'fvtt.config.json'))) {
      throw new Error('No fvtt.config try running "npm run init"')
    }

    if (!fs.existsSync(path.join(this.#config.rootFolder, 'binary-packs/en-skills/LOCK'))) {
      throw new Error('Compendiums not built try running "npm run compendium-build"')
    }

    if (!fs.existsSync(path.join(this.#config.rootFolder, 'binary-packs/system-doc/LOCK'))) {
      throw new Error('Manuals not built try running "npm run manual-build"')
    }

    if (!fs.existsSync(path.join(this.#config.rootFolder, 'binary-packs/roll-requests/LOCK'))) {
      throw new Error('Roll requests not built try running "npm run rolls-build"')
    }

    const jsonConfig = JSON.parse(fs.readFileSync(path.join(this.#config.rootFolder, '/fvtt.config.json'), 'utf8'))
    if (typeof jsonConfig?.currentSelection === 'undefined') {
      throw new Error('No currentSelection found in ./fvtt.config.json file')
    } else if (typeof jsonConfig[jsonConfig.currentSelection] === 'undefined') {
      throw new Error('No ' + jsonConfig?.currentSelection + ' found in ./fvtt.config.json file')
    }

    const foundryConfig = TemplateHelpers.loadFoundryConfig()

    this.#config.type = foundryConfig.type

    if (!['development', 'production'].includes(this.#args.mode ?? '')) {
      throw new Error('Mode should be "production" or "development"')
    }

    this.#config.buildMode = this.#args.mode
    this.#config.debugOutput = (this.#args.env ?? []).includes('debug')
    this.#config.folderId = foundryConfig.json.id
    this.#config.suffixFolder = path.join('/Data', this.#config.type + 's', this.#config.folderId)
    if (typeof jsonConfig[jsonConfig.currentSelection] === 'string') {
      this.#config.prefixFolders = {
        [jsonConfig.currentSelection]: jsonConfig[jsonConfig.currentSelection]
      }
    } else {
      this.#config.prefixFolders = jsonConfig[jsonConfig.currentSelection]
    }

    let entryPath = ''
    if (fs.existsSync(path.join(this.#config.rootFolder, (entryPath = 'src/' + this.#config.type + '.js')))) {
      this.#config.entryPath = path.join(process.cwd(), entryPath)
    } else if (fs.existsSync(path.join(this.#config.rootFolder, (entryPath = this.#config.folderId.toLowerCase() + '/' + this.#config.type + '.js')))) {
      this.#config.entryPath = path.join(process.cwd(), entryPath)
    } else if (fs.existsSync(path.join(this.#config.rootFolder, (entryPath = this.#config.folderId + '/' + this.#config.type + '.js')))) {
      this.#config.entryPath = path.join(process.cwd(), entryPath)
    } else if (fs.existsSync(path.join(this.#config.rootFolder, (entryPath = this.#config.type + '/' + this.#config.type + '.js')))) {
      this.#config.entryPath = path.join(process.cwd(), entryPath)
    } else {
      throw new Error('Entry point not found, ./src/, ./' + this.#config.folderId.toLowerCase() + '/, ./' + this.#config.folderId + '/, or ./' + this.#config.type + '/')
    }

    for (const prefixFolder in this.#config.prefixFolders) {
      const outputFolder = path.join(this.#config.prefixFolders[prefixFolder], this.#config.suffixFolder)
      if (fs.existsSync(outputFolder)) {
        const check = fs.lstatSync(outputFolder)
        if (!check.isDirectory()) {
          throw new Error('Build location ' + fs.realpathSync(outputFolder) + ' is not a directory')
        }
      }
      if (fs.existsSync(outputFolder) && !fs.existsSync(path.join(outputFolder, this.#config.type + '.json'))) {
        const complete = await TemplateHelpers.selectText({ prompt: 'This will ' + (this.#args.mode === 'production' ? 'empty' : 'write to') + ' the folder ' + fs.realpathSync(outputFolder), defaultText: 'Quit', defaultOptions: ['Okay', 'Quit'] })
        if (complete === false || complete === 'Quit') {
          process.exit(1)
        }
      }
    }

    this.#validated = true
  }

  /**
   * Copy Binary Pack, if development skip any packs that are currently locked (the system/module is in use)
   * @param {string} resourcePath
   * @param {string} outputFolder
   * @returns {boolean}
   */
  async copyBinaryPack (resourcePath, outputFolder) {
    if (this.#config.buildMode === 'production') {
      return true
    }
    const match = path.dirname(resourcePath).match(/([^/\\]+)$/)
    if (match) {
      const lockFile = path.join(outputFolder, 'packs', match[1], 'LOCK')
      if (!fs.existsSync(lockFile)) {
        return true
      }
      try {
        fs.closeSync(fs.openSync(lockFile, 'r+'))
      } catch (err) {
        return false
      }
      return true
    }
    return true
  }

  /**
   * Clone object
   * @param {object} original
   * @param {int} depth
   * @returns {object}
   */
  cloneConfig (original, depth = 0) {
    if (depth > 10) {
      throw new Error('Maximum depth exceeded.')
    }
    depth++
    // Simple types
    if ((typeof original !== 'object') || (original === null)) return original
    // Arrays
    if (original instanceof Array) return original.map(o => this.cloneConfig(o, depth))
    // Dates
    if (original instanceof Date) return new Date(original)
    // Unsupported advanced objects
    if (original.constructor && (original.constructor !== Object)) {
      return original
    }
    // Other objects
    const clone = {}
    for (const key of Object.keys(original)) {
      clone[key] = this.cloneConfig(original[key], depth)
    }
    return clone
  }

  /**
   * Generate config object
   * @returns {object}
   */
  generate () {
    if (this.#validated !== true) {
      throw new Error('Not validated')
    }
    const copyConfig = []
    let copyFrom
    switch (this.#config.type) {
      case 'module':
      case 'system':
        if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'static', this.#config.type + '.json'))) {
          copyConfig.push({ from: copyFrom, to: this.#config.type + '.json' })
        }
        break
    }
    if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'static/assets/'))) {
      copyConfig.push({ from: copyFrom, to: 'assets/' })
    }
    if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'static/lang/'))) {
      copyConfig.push({ from: copyFrom, to: 'lang/' })
    }
    if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'static/lib/'))) {
      copyConfig.push({ from: copyFrom, to: 'lib/', info: { minimized: true } })
    }
    if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'static/templates/'))) {
      copyConfig.push({ from: copyFrom, to: 'templates/' })
    }
    if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'binary-packs/'))) {
      copyConfig.push({
        from: copyFrom,
        to: 'packs/'
      })
    }
    if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'static/README.md'))) {
      copyConfig.push({ from: copyFrom, to: 'README.md' })
    } else if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'README.md'))) {
      copyConfig.push({ from: copyFrom, to: 'README.md' })
    }
    // License is required
    if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'static/LICENSE'))) {
      copyConfig.push({ from: copyFrom, to: 'LICENSE', toType: 'file' })
    } else if (fs.existsSync(copyFrom = path.join(this.#config.rootFolder, 'LICENSE'))) {
      copyConfig.push({ from: copyFrom, to: 'LICENSE', toType: 'file' })
    } else {
      throw new Error('No static/LICENSE or LICENSE file found')
    }

    /** Set optimization options for production only */
    const optimization = (this.#config.buildMode === 'production')
      ? {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              mangle: false
            }
          }),
          new CssMinimizerPlugin()
        ],
        splitChunks: {
          chunks: 'all'
        }
      }
      : undefined

    /**
     * The nerve center. Here are all the settings for compiling bundles:
     * production and development
     */
    const output = {
      bail: this.#config.buildMode === 'production',
      context: this.#config.rootFolder,
      entry: this.#config.entryPath,
      devtool: 'inline-source-map',
      mode: this.#config.buildMode,
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
          },
          {
            loader: 'thread-loader',
            options: {
              workers: os.cpus().length,
              poolRespawn: false,
              poolTimeout: this.#config.buildMode === 'production' ? 500 : Infinity
            }
          }
        ]
      },
      optimization,
      output: {
        clean: this.#config.buildMode === 'production',
        path: path.join(process.cwd(), 'dist'),
        filename: this.#config.type + '.js'
      },
      performance: {
        maxAssetSize: 1200000
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: this.#config.type + '.css',
          insert: 'head'
        }),
        new WebpackBar({})
      ],
      resolve: {
        extensions: ['.js']
      },
      watch: this.#config.buildMode === 'development'
    }

    if (this.#config.debugOutput) {
      console.log(TemplateHelpers.ansiFormat('config =', { color: 'green' }) + JSON.stringify(this.#config, null, 2))
      console.log(TemplateHelpers.ansiFormat('output =', { color: 'green' }) + JSON.stringify(output, null, 2))
      process.exit(1)
    }

    const exports = []
    for (const prefixFolder in this.#config.prefixFolders) {
      const outputFolder = path.join(this.#config.prefixFolders[prefixFolder], this.#config.suffixFolder)

      const named = this.cloneConfig(output)
      named.name = prefixFolder
      named.output.path = outputFolder
      const outputCopyConfig = { patterns: this.cloneConfig(copyConfig) }
      const index = outputCopyConfig.patterns.findIndex(r => r.to === 'packs/')
      if (index > -1) {
        outputCopyConfig.patterns[index].filter = (resourcePath) => { return this.copyBinaryPack(resourcePath, outputFolder) }
      }
      named.plugins.push(new CopyWebpackPlugin(outputCopyConfig))

      exports.push(named)
    }

    return exports
  }
}
