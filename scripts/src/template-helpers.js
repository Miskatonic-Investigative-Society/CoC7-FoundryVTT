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
}
