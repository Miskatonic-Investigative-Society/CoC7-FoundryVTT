import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { exit } from 'process'

export function formatErrorText (text) {
  return '\x1b[31m' + text + '\x1b[0m'
}

export function formatSuccessText (text) {
  return '\x1b[32m' + text + '\x1b[0m'
}

export function processArguments (message, options) {
  const regEx = new RegExp('^--(help|' + Object.keys(options).map(t => quoteRegExp(t)).join('|') + ')(=(.+))?$')
  const args = {}
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
      args[key] = value
    }
  }
  if (args.help) {
    if (message.length) {
      console.log(formatSuccessText(message))
    }
    console.log('')
    console.log('npm run ' + process.env.npm_lifecycle_event + ' -- <options>')
    console.log('')
    for (const key in options) {
      console.log(formatSuccessText(key) + ': ' + options[key])
    }
    console.log('')
    exit()
  }
  return args
}

export function getRootFolder () {
  return fs.realpathSync(path.dirname(url.fileURLToPath(import.meta.url)) + '/..')
}

export function quoteRegExp (string) {
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

export function requireNodeVersion () {
  const currentNodeVersion = process.versions.node

  if (currentNodeVersion.split('.')[0] < 20) {
    console.log('\n' + formatErrorText('Requires Node 20 or higher.\n' + 'You are currently using Node ' + currentNodeVersion + '.\n' + 'Please update your version of Node.') + '\n')
    process.exit(1)
  }
}
