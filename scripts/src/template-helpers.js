import * as crypto from 'crypto'
import * as fs from 'fs'
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
