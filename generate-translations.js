import { deleteAsync } from 'del'
import glob from './node_modules/glob/glob.js'
import jsonfile from './node_modules/jsonfile/index.js'
import write from './node_modules/write/index.js'

const unordered = {}
let missing = []
const abandoned = {}
const source = jsonfile.readFileSync('./lang/en.json')
const keys = Object.keys(source)

const maxMissingKeys = 115

glob('./lang/*.json', {}, async function (er, files) {
  await Promise.all(
    files.map(async filename => {
      const lang = filename.replace(/^(.+\/)([a-zA-Z0-9-]+)(\.json)$/, '$2')
      if (lang !== 'en') {
        const json = jsonfile.readFileSync(filename)
        const missingKeys = keys.filter(x => !Object.keys(json).includes(x))
        if (missingKeys.length <= maxMissingKeys) {
          unordered[lang] = missingKeys
          missing = missing.concat(unordered[lang])
        } else {
          abandoned[lang] = missingKeys
        }
      }
    })
  )
  const complete = Object.keys(unordered).filter(
    lang => unordered[lang].length === 0
  )
  const langs = Object.keys(unordered)
    .filter(lang => unordered[lang].length > 0)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key]
      return obj
    }, {})
  let output = ''
  let anchors = ''
  output = output + '# Translating.\n\n'
  output =
    output +
    'Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better!'
  if (missing.length > 0) {
    output =
      output +
      ' Below is a list of translations keys on existing files that still need translated, based on `en.json`.'
  }
  output =
    output +
    ' Feel free to create a new `*.json` file for a language that is not shown here!\n\n'
  if (complete.length > 1) {
    output =
      output +
      'The following translations are currently up to date **' +
      complete.join('**, **') +
      '**\n\n'
  } else if (complete.length > 0) {
    output =
      output +
      'The **' +
      complete.join() +
      '** translation is currently up to date\n\n'
  }
  if (Object.keys(abandoned).length > 0) {
    output = output + 'The following translations have more than ' + maxMissingKeys + ' untranslated strings [are you able to help?](./ABANDONED.md)\n\n'
    Object.entries(abandoned).forEach(([key, values]) => {
      output = output + '[' + key + '.json (' + Object.entries(abandoned[key]).length + ' untranslated strings)](./ABANDONED.md#' + (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') + ')\n\n'
    })
    output = output + '\n\n'
  }
  if (missing.length > 0) {
    output = output + '|Key|'
    Object.entries(langs).forEach(([key, value]) => {
      output = output + '[' + key + '](./MISSING.md#' + (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') + ')|'
    })
    output = output + '\n'
    output = output + '|:---|'
    Object.entries(langs).forEach(([key, value]) => {
      output = output + ':---:|'
    })
    output = output + '\n'
    output = output + '|**Remaining**:|'
    Object.entries(langs).forEach(([key, value]) => {
      output = output + '**' + value.length + '**|'
    })
    output = output + '\n'
    missing
      .filter((item, index) => {
        return missing.indexOf(item) === index
      })
      .sort()
      .forEach(key => {
        output =
          output +
          '|[' +
          key +
          '](#' +
          key.toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') +
          ')|'
        Object.entries(langs).forEach(([lang, value]) => {
          output = output + (value.includes(key) ? '&#x274C;' : '&#9989;') + '|'
        })
        output = output + '\n'
        anchors =
          anchors +
          '##### ' +
          key +
          '\n```  "' +
          key +
          '": "' +
          source[key].replace(/\n/g, '\\n') +
          '",```\n'
      })
    output = output + anchors
  }
  write('./.github/TRANSLATIONS.md', output)
  const missingPerLang = Object.keys(unordered)
    .filter(lang => unordered[lang].length > 0)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key]
      return obj
    }, {})
  if (Object.keys(missingPerLang).length > 0) {
    output = ''
    output = output + '# Missing Translations.\n\n'
    output =
      output +
      'Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better!'
    output =
      output +
      ' Below is a list of translations keys on existing files that still need translated, based on `en.json`.\n\n'
    Object.entries(missingPerLang).forEach(([key, values]) => {
      output =
        output +
        '[' +
        key +
        '.json (' + Object.entries(unordered[key]).length + ' untranslated strings)](#' +
        (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') +
        ')\n\n'
    })
    output = output + '\n'
    Object.entries(missingPerLang).forEach(([key, values]) => {
      output = output + '## ' + key + '.json\n' + Object.entries(missingPerLang[key]).length + ' untranslated strings\n```\n'
      values.forEach(sourceKey => {
        output =
          output +
          '"' +
          sourceKey +
          '": "' +
          source[sourceKey].replace(/\n/g, '\\n') +
          '",\n'
      })
      output = output.substring(0, output.length - 2) + '\n```\n'
    })
    write('./.github/MISSING.md', output)
  } else {
    deleteAsync('./.github/MISSING.md')
  }
  if (Object.keys(abandoned).length > 0) {
    output = ''
    output = output + '# Abandoned Translations.\n\n'
    output =
      output +
      'Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better!'
    output =
      output +
      ' Below is a list of translations keys on existing files that still need translated, based on `en.json`.\n\n'
    Object.entries(abandoned).forEach(([key, values]) => {
      output =
        output +
        '[' +
        key +
        '.json (' + Object.entries(abandoned[key]).length + ' untranslated strings)](#' +
        (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') +
        ')\n\n'
    })
    output = output + '\n'
    Object.entries(abandoned).forEach(([key, values]) => {
      output = output + '## ' + key + '.json\n' + Object.entries(abandoned[key]).length + ' untranslated strings\n```\n'
      values.forEach(sourceKey => {
        output =
          output +
          '"' +
          sourceKey +
          '": "' +
          source[sourceKey].replace(/\n/g, '\\n') +
          '",\n'
      })
      output = output.substring(0, output.length - 2) + '\n```\n'
    })
    write('./.github/ABANDONED.md', output)
  } else {
    deleteAsync('./.github/ABANDONED.md')
  }
})
