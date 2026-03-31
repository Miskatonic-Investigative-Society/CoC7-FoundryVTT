import * as crypto from 'crypto'
import * as fs from 'fs'
import * as os from 'os'
import * as readline from 'readline'
import { ClassicLevel } from 'classic-level'

export default class TemplateHelpers {
  /**
   * Path to root
   * @returns {string}
   */
  static get systemRoot () {
    return process.cwd().replace(/\\/g, '/')
  }

  /**
   * Colorize string
   * @param {string} text
   * @param {object} options
   * @param {string} options.color
   * @param {string} options.bgColor
   * @param {boolean} options.bold
   * @param {boolean} options.underline
   * @param {boolean} options.output
   * @returns {string}
   */
  static ansiFormat (text, { color, bgColor, bold = false, underline = false, output = false } = {}) {
    const colors = {
      black: 30,
      red: 31,
      green: 32,
      yellow: 33,
      blue: 34,
      purple: 35,
      cyan: 36,
      white: 37
    }
    const codes = []
    if (bold) {
      codes.push('1')
    }
    if (underline) {
      codes.push('4')
    }
    if (typeof colors[color] !== 'undefined') {
      codes.push(colors[color])
    }
    if (typeof colors[bgColor] !== 'undefined') {
      codes.push(parseInt(colors[bgColor], 10) + 10)
    }
    const formatted = (codes.length === 0 ? `\x1b[0m${text}` : '\x1b[' + codes.join(';') + 'm' + text + '\x1b[0m')
    if (output) {
      console.log(formatted)
    }
    return formatted
  }

  /**
   * Create binary pack from json
   * @param {string} folder
   * @param {object} json
   */
  static async createBinaryPack (folder, json) {
    if (!fs.existsSync(TemplateHelpers.systemRoot + '/binary-packs/')) {
      fs.mkdirSync(TemplateHelpers.systemRoot + '/binary-packs/')
    }
    if (fs.existsSync(TemplateHelpers.systemRoot + '/binary-packs/' + folder)) {
      await ClassicLevel.destroy(TemplateHelpers.systemRoot + '/binary-packs/' + folder)
    }
    const groups = {
      // Adventure
      items: /^!(actors)!([a-zA-Z0-9]{16})$/,
      pages: /^!(journal)!([a-zA-Z0-9]{16})$/,
      results: /^!(tables)!([a-zA-Z0-9]{16})$/
    }
    const batch = Object.keys(json).reduce((c, i) => {
      const all = {
        [i]: JSON.parse(JSON.stringify(json[i]))
      }
      for (const key in groups) {
        const array = i.match(groups[key])
        if (array) {
          for (const offset in json[i][key]) {
            const arrayKey = '!' + array[1] + '.' + key + '!' + array[2] + '.' + json[i][key][offset]._id
            all[arrayKey] = json[i][key][offset]
            all[i][key][offset] = json[i][key][offset]._id
          }
        }
      }
      for (const key in all) {
        c.push({ type: 'put', key, value: all[key], valueEncoding: 'json' })
      }
      return c
    }, [])

    const db = new ClassicLevel(TemplateHelpers.systemRoot + '/binary-packs/' + folder, { keyEncoding: 'utf8', valueEncoding: 'json' })
    await db.batch(batch, { valueEncoding: 'utf8' })
    await db.close()
  }

  /**
   * generateBuildConsistentID uses idSource to generate an id that will be consistent across builds.
   *
   * Note: This is called outside of foundry to build manual .db files and substitutes foundry.utils.randomID in a build consistent way.
   * It creates a hash from the key so it is consistent between builds and the converts to base 64 so it uses the same range of characters as FoundryVTTs generator.
   * @param {object} collisions
   * @param {string} idSource
   * @returns {string}
   */
  static generateBuildConsistentID (collisions, idSource) {
    const id = crypto.createHash('md5').update(idSource).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
    if (typeof collisions[id] !== 'undefined') {
      throw new Error('Collision on ' + idSource)
    }
    collisions[id] = true
    return id
  }

  /**
   * Prompt for FoundryVTT
   * @returns {Promise<string>}
   */
  static inputFoundryVTTPath () {
    return new Promise(resolve => {
      console.log('')
      console.log('Enter the path to the FoundryVTT User Data Path')
      console.log('')
      console.log('This can be found in the FoundryVTT Setup page, Configure, User Data Path')
      console.log('Examples: ' + TemplateHelpers.ansiFormat('C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\FoundryVTT', { color: 'green' }) + ' (You can use this path style if you are using WSL, it will automatically be converted)')
      console.log('          ' + TemplateHelpers.ansiFormat('~/Library/Application Support/FoundryVTT', { color: 'green' }))
      console.log('          ' + TemplateHelpers.ansiFormat('/home/' + os.userInfo().username + '/.local/share/FoundryVTT', { color: 'green' }))
      console.log('')
      TemplateHelpers.inputFoundryVTTPathTry().then((value) => {
        resolve(value)
      })
    })
  }

  /**
   * Check for valid FoundryVTT User Data Path
   * @returns {Promise<string>}
   */
  static inputFoundryVTTPathTry () {
    return new Promise(resolve => {
      TemplateHelpers.inputText({ prompt: 'Path (empty to end)' }).then((value) => {
        if (value !== '') {
          value = value.replace(/\\/g, '/')
          if (os.type() === 'Linux') {
            const drive = value.match(/^([a-z]):(.+)$/i)
            if (drive) {
              // Attempting to use a Windows path in WSL
              value = '/mnt/' + drive[1].toLowerCase() + drive[2]
            }
          }
          if (!fs.existsSync(value + '/Data/modules') || !fs.existsSync(value + '/Data/systems') || !fs.existsSync(value + '/Data/worlds')) {
            console.log('')
            TemplateHelpers.ansiFormat('The path does not contain a FoundryVTT User Data Path', { color: 'red', output: true })
            TemplateHelpers.inputFoundryVTTPathTry().then((value) => {
              resolve(value)
            })
            return
          }
        }
        resolve(value)
      })
    })
  }

  /**
   * Get user input
   * @param {object} options
   * @param {string} options.prompt
   * @param {string} options.defaultText
   * @param {Array|undefined} options.defaultOptions
   * @returns {Promise<string>}
   */
  static inputText ({ prompt = '', defaultText = '', defaultOptions = undefined } = {}) {
    return new Promise(resolve => {
      const options = {
        input: process.stdin,
        output: process.stdout
      }
      if (typeof defaultOptions !== 'undefined') {
        options.completer = (line) => {
          const lcl = line.toString().toLowerCase()
          const found = defaultOptions.filter(t => t.toString().toLowerCase().indexOf(lcl) === 0)
          return [found, line]
        }
        console.log('')
        console.log(TemplateHelpers.ansiFormat('Suggested Values (tab to auto complete)', { color: 'blue', bold: true }))
        for (const value of defaultOptions) {
          console.log(' ' + value)
        }
      }
      const rl = readline.createInterface(options)
      rl.question(TemplateHelpers.ansiFormat(prompt + (defaultText !== '' ? ' (' + defaultText + ')' : '') + ': ', { color: 'blue', bold: true }), (answer) => {
        const text = answer.trim()
        if (text.length === 0) {
          resolve(defaultText)
        } else {
          resolve(text)
        }
        rl.close()
      })
    })
  }

  /**
   * Is this a module or a system. Load the config
   * @returns {object}
   */
  static loadFoundryConfig () {
    const rootFolder = TemplateHelpers.systemRoot

    let type = ''

    if (fs.existsSync(rootFolder + '/static/module.json')) {
      type = 'module'
    } else if (fs.existsSync(rootFolder + '/static/system.json')) {
      type = 'system'
    } else {
      throw new Error('No module.json or system.json')
    }

    const foundryConfig = JSON.parse(fs.readFileSync(rootFolder + '/static/' + type + '.json', 'utf8'))
    if (typeof foundryConfig?.id === 'undefined') {
      throw new Error('No id found in ./' + type + '.json file')
    }

    return {
      type,
      json: foundryConfig
    }
  }

  /**
   * Parse Node argv into array
   * @param {string} message
   * @param {object} options
   * @param {string} options.<key>.message
   * @param {boolean} options.<key>.group
   * @returns {object}
   */
  static parseNodeArguments (message, options) {
    const args = {}
    const regEx = new RegExp('^--(help|' + Object.keys(options).map(t => TemplateHelpers.quoteRegExp(t)).join('|') + ')(=(.+))?$')
    for (let i = 2, im = process.argv.length; i < im; i++) {
      const match = process.argv[i].match(regEx)
      if (match) {
        const key = match[1]
        let value = match[3]
        if (!match[3]) {
          if ((process.argv[i + 1] ?? '--').match(/^--/)) {
            value = true
          } else {
            value = process.argv[i + 1] ?? ''
            i++
          }
        }
        if (value === 'false') {
          value = false
        } else if (value === 'true') {
          value = true
        }
        if (key === 'help' || options[key].group === false) {
          args[key] = value
        } else if (options[key].group === true) {
          if (typeof args[key] === 'undefined') {
            args[key] = []
          }
          args[key].push(value)
        }
      }
    }
    if (args.help) {
      if (message.length) {
        TemplateHelpers.ansiFormat(message, { color: 'green', output: true })
      }
      console.log('')
      console.log('npm run ' + process.env.npm_lifecycle_event + ' -- <options>')
      console.log('')
      for (const key in options) {
        console.log(TemplateHelpers.ansiFormat(key, { color: 'green' }) + ': ' + options[key].message)
      }
      console.log('')
      process.exit(0)
    }
    return args
  }

  /**
   * Convert JSON into a document
   * @param {object} collisions
   * @param {object} doc
   * @param {object} options
   * @param {string} options.type
   * @param {string} options.lang
   * @param {string} options.id
   * @returns {object}
   */
  static processDocument (collisions, doc, { type = '', lang = 'en', id = '' }) {
    if (doc.type === 'folder') {
      if (!doc._id) {
        // Make sure we don't generate new ids every time we rebuild
        doc._id = TemplateHelpers.generateBuildConsistentID(collisions, doc.name + lang + 'folder')
      }
      doc.type = type
      return {
        id: '!folders!' + doc._id,
        value: doc
      }
    }
    if (!doc._id) {
      // Make sure we don't generate new ids every time we rebuild
      doc._id = TemplateHelpers.generateBuildConsistentID(collisions, doc.name + lang + JSON.stringify(doc.flags[id].cocidFlag.eras))
    }
    let idKey = type.toLowerCase() + 's'
    switch (type) {
      case 'Actor':
        break
      case 'Item':
        switch (doc.type) {
          case 'skill': {
            const match = doc.name.match(/^(.+)\s*\((.+)\)$/)
            doc.system = doc.system || {}
            if (match) {
              doc.system.skillName = match[2].trim()
              doc.system.specialization = match[1].trim()
            } else {
              doc.system.skillName = doc.name
              doc.system.specialization = ''
            }
            break
          }
        }
        break
      case 'RollTable':
        idKey = 'tables'
        if (typeof doc.results !== 'undefined') {
          let range = 0
          for (const offset in doc.results) {
            if (!doc.results[offset]._id) {
              doc.results[offset]._id = TemplateHelpers.generateBuildConsistentID(collisions, doc.name + lang + JSON.stringify(doc.flags[id].cocidFlag.eras) + offset)
            }
            if (!doc.results[offset].range) {
              range++
              doc.results[offset].range = [range, range]
            } else {
              range = doc.results[offset].range[1]
            }
            if (doc.results[offset].type === 'text') {
              /* // FoundryVTT V12 */
              doc.results[offset].text = '<strong>' + doc.results[offset].name + '</strong> ' + doc.results[offset].description
            }
            /* // FoundryVTT V12 */
            // type: document / pack
          }
          if (!doc.formula) {
            doc.formula = '1d' + range
          }
        }
        break
      case 'JournalEntry':
        if (typeof doc.pages !== 'undefined') {
          for (const offset in doc.pages) {
            if (!doc.pages[offset]._id) {
              doc.pages[offset]._id = TemplateHelpers.generateBuildConsistentID(collisions, doc.name + lang + JSON.stringify(doc.flags[id].cocidFlag.eras) + offset)
            }
          }
        }
        break
    }
    return {
      id: '!' + idKey + '!' + doc._id,
      value: doc
    }
  }

  /**
   * Escape a string for use in a Regular Expression
   * @param {string} string
   * @returns {string}
   */
  static quoteRegExp (string) {
    // Replace in Node 24 with RegExp.escape()
    // https://bitbucket.org/cggaertner/js-hacks/raw/master/quote.js
    const len = string.length
    let qString = ''

    for (let current, i = 0; i < len; ++i) {
      current = string.charAt(i)

      if (current >= ' ' && current <= '~') {
        if (current === '\\' || current === "'") {
          qString += '\\'
        }

        qString += current.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
      } else {
        switch (current) {
          case '\b':
            qString += '\\b'
            break

          case '\f':
            qString += '\\f'
            break

          case '\n':
            qString += '\\n'
            break

          case '\r':
            qString += '\\r'
            break

          case '\t':
            qString += '\\t'
            break

          case '\v':
            qString += '\\v'
            break

          default:
            qString += '\\u'
            current = current.charCodeAt(0).toString(16)
            for (let j = 4; --j >= current.length; qString += '0');
            qString += current
        }
      }
    }

    return qString
  }

  /**
   * Check node version and exit if below required version
   */
  static requireNodeVersion () {
    const currentNodeVersion = process.versions.node

    if (currentNodeVersion.split('.')[0] < 20) {
      TemplateHelpers.ansiFormat('Requires Node 20 or higher.\n' + 'You are currently using Node ' + currentNodeVersion + '.\n' + 'Please update your version of Node.', { color: 'red', output: true })
      process.exit(1)
    }
  }

  /**
   * Get user selected option
   * @param {object} options
   * @param {string} options.prompt
   * @param {string} options.defaultText
   * @param {Array|undefined} options.defaultOptions
   * @returns {Promise<string|false>}
   */
  static selectText ({ prompt = '', defaultText = '', defaultOptions = [] } = {}) {
    return new Promise(resolve => {
      const options = {
        input: process.stdin,
        output: process.stdout
      }

      let letters = defaultOptions.map(w => w.toString().substring(0, 1).toLowerCase()).join('')
      letters = letters + letters
      const optionCount = defaultOptions.length - 1
      let selectIndex = defaultOptions.findIndex(t => t === defaultText)
      if (selectIndex === -1) {
        selectIndex = optionCount
      }

      let max = 1
      for (const offset in defaultOptions) {
        max = Math.max(max, defaultOptions[offset].length)
      }
      for (const offset in defaultOptions) {
        defaultOptions[offset] = ' ' + defaultOptions[offset].padEnd(max) + ' '
      }

      readline.emitKeypressEvents(options.input)
      options.input.setRawMode(true)
      options.input.resume().on('keypress', (value, key) => {
        if (key) {
          if (key.name === 'escape' || (key.name === 'c' && key.ctrl)) {
            options.input.setRawMode(false)
            options.input.removeListener('keypress', options.input.rawListeners('keypress')[0])
            resolve(false)
            return
          }
          if (key.name === 'return') {
            options.input.setRawMode(false)
            options.input.removeListener('keypress', options.input.rawListeners('keypress')[0])
            resolve(defaultOptions[selectIndex].trim())
            return
          }
          if (key.name === 'down' && selectIndex < optionCount) {
            TemplateHelpers.#selectTextDisplay(options.output, defaultOptions[selectIndex], optionCount, selectIndex, false)
            selectIndex++
            TemplateHelpers.#selectTextDisplay(options.output, defaultOptions[selectIndex], optionCount, selectIndex, true)
          } else if (key.name === 'up' && selectIndex > 0) {
            TemplateHelpers.#selectTextDisplay(options.output, defaultOptions[selectIndex], optionCount, selectIndex, false)
            selectIndex--
            TemplateHelpers.#selectTextDisplay(options.output, defaultOptions[selectIndex], optionCount, selectIndex, true)
          } else {
            const match = (key.name ?? '').match(/^[a-z]$/)
            if (match) {
              const position = letters.indexOf(match, selectIndex + 1)
              if (position > -1) {
                TemplateHelpers.#selectTextDisplay(options.output, defaultOptions[selectIndex], optionCount, selectIndex, false)
                selectIndex = position % (1 + optionCount)
                TemplateHelpers.#selectTextDisplay(options.output, defaultOptions[selectIndex], optionCount, selectIndex, true)
              }
            }
          }
        }
      })

      TemplateHelpers.ansiFormat(prompt + (defaultText !== '' ? ' (' + defaultText + ')' : '') + ': ', { color: 'blue', bold: true, output: true })

      for (const offset in defaultOptions) {
        const ending = (offset !== optionCount ? '\n' : '')
        const option = TemplateHelpers.ansiFormat(defaultOptions[offset], { color: (offset === selectIndex.toString() ? 'black' : 'white'), bgColor: (offset === selectIndex.toString() ? 'white' : 'black') })
        options.output.write(option + ending)
      }
    })
  }

  /**
   * Replace selected line on screen
   * @param {stdout} output
   * @param {string} text
   * @param {int} optionCount
   * @param {int} selectIndex
   * @param {bool} selected
   */
  static #selectTextDisplay (output, text, optionCount, selectIndex, selected) {
    const oldUps = (optionCount - selectIndex) + 1
    const option = TemplateHelpers.ansiFormat(text, { color: (selected ? 'black' : 'white'), bgColor: (selected ? 'white' : 'black') })
    output.write('\u001B[' + oldUps + 'A' + option + '\u001B[G\u001B[' + oldUps + 'B')
  }

  /**
   * Show caught error and exit
   * @param {Error} e
   */
  static showErrorAndExit (e) {
    const match = (e.stack ?? '').match(/([^/\\]*):(\d+):(\d+)/)
    const stack = (match ? match[1] + ':' + match[2] + ' col ' + match[3] : '')
    TemplateHelpers.ansiFormat('ERROR: ' + e.message + '\n' + stack, { color: 'red', output: true })
    process.exit(1)
  }

  /**
   * Sort object by key
   * @param {object} unsorted
   * @returns {object}
   */
  static sortByKey (unsorted) {
    return Object.keys(unsorted).sort().reduce((c, k) => {
      c[k] = unsorted[k]
      return c
    }, {})
  }
}
