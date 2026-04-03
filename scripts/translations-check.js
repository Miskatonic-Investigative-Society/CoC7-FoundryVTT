import * as fs from 'fs'
import TemplateHelpers from './src/template-helpers.js'

const maxMissingKeys = 360

try {
  let abandonedLanguages = {}
  const completedLanguages = []
  let missingLanguages = {}
  let allMissingKeys = []

  const rootFolder = TemplateHelpers.systemRoot

  const foundryConfig = TemplateHelpers.loadFoundryConfig()

  if (typeof foundryConfig.json.languages === 'undefined') {
    throw new Error('No languages found in ./' + foundryConfig.type + '.json file')
  }

  const translations = foundryConfig.json.languages.filter(l => l.lang !== 'en')

  const source = JSON.parse(fs.readFileSync(rootFolder + '/static/lang/en.json', 'utf8'))
  const keys = Object.keys(source)

  for (const translation of translations) {
    const json = JSON.parse(fs.readFileSync(rootFolder + '/static/' + translation.path, 'utf8'))
    const missingKeys = keys.filter(key => !Object.keys(json).includes(key))
    if (missingKeys.length === 0) {
      completedLanguages.push(translation.lang)
    } else if (missingKeys.length <= maxMissingKeys) {
      missingLanguages[translation.lang] = missingKeys
      allMissingKeys = missingKeys.concat(missingLanguages[translation.lang])
    } else {
      abandonedLanguages[translation.lang] = missingKeys
    }
  }

  allMissingKeys = allMissingKeys.filter((item, index) => {
    return allMissingKeys.indexOf(item) === index
  }).sort()
  completedLanguages.sort()
  missingLanguages = TemplateHelpers.sortByKey(missingLanguages)
  abandonedLanguages = TemplateHelpers.sortByKey(abandonedLanguages)

  const hasMissingLanguages = Object.keys(missingLanguages).length
  const hasAbandonedLanguages = Object.keys(abandonedLanguages).length

  let output = ''
  let anchors = '\n\n'
  output = output + '# Translating.\n\n'
  output = output + 'Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better!'
  if (hasMissingLanguages) {
    output = output + ' Below is a list of translations keys on existing files that still need translated, based on `en.json`.'
  }
  output = output + ' Feel free to create a new `*.json` file for a language that is not shown here!\n\n'
  if (completedLanguages.length > 1) {
    output = output + 'The following translations are currently up to date **' + completedLanguages.join('**, **') + '**\n\n'
  } else if (completedLanguages.length === 1) {
    output = output + 'The **' + completedLanguages.join() + '** translation is currently up to date\n\n'
  }
  if (hasAbandonedLanguages) {
    output = output + 'The following translations have more than ' + maxMissingKeys + ' untranslated strings [are you able to help?](./ABANDONED.md)\n\n'
    for (const key in abandonedLanguages) {
      output = output + '[' + key + '.json (' + Object.entries(abandonedLanguages[key]).length + ' untranslated strings)](./ABANDONED.md#' + (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') + ')\n\n'
    }
    output = output + '\n\n'
  }

  if (hasMissingLanguages) {
    output = output + '|Key|'
    for (const key in missingLanguages) {
      output = output + '[' + key + '](./MISSING.md#' + (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') + ')|'
    }
    output = output + '\n'
    output = output + '|:---|'
    for (let i = 0, im = Object.keys(missingLanguages).length; i < im; i++) {
      output = output + ':---:|'
    }
    output = output + '\n'
    output = output + '|**Remaining**:|'
    for (const key in missingLanguages) {
      output = output + '**' + missingLanguages[key].length + '**|'
    }
    output = output + '\n'
    for (const key of allMissingKeys) {
      output = output + '|[' + key + '](#' + (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') + ')|'
      for (const lang in missingLanguages) {
        output = output + (missingLanguages[lang].includes(key) ? '&#x274C;' : '&#9989;') + '|'
      }
      output = output + '\n'
      anchors = anchors + '##### ' + key + '\n```  "' + key + '": "' + source[key].replace(/\n/g, '\\n') + '",```\n'
    }
    output = output + anchors
  }
  fs.writeFileSync(rootFolder + '/.github/TRANSLATIONS.md', output, { flag: 'w+' })

  if (hasMissingLanguages) {
    output = ''
    output = output + '# Missing Translations.\n\n'
    output = output + 'Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better!'
    output = output + ' Below is a list of translations keys on existing files that still need translated, based on `en.json`.\n\n'

    for (const key in missingLanguages) {
      output = output + '[' + key + '.json (' + Object.entries(missingLanguages[key]).length + ' untranslated strings)](#' + (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') + ')\n\n'
    }
    output = output + '\n'
    for (const key in missingLanguages) {
      missingLanguages[key].sort()
      output = output + '## ' + key + '.json\n' + Object.entries(missingLanguages[key]).length + ' untranslated strings\n```\n'
      for (const sourceKey of missingLanguages[key]) {
        output = output + '"' + sourceKey + '": "' + source[sourceKey].replace(/\n/g, '\\n') + '",\n'
      }
      output = output.substring(0, output.length - 2) + '\n```\n'
    }
    fs.writeFileSync(rootFolder + '/.github/MISSING.md', output, { flag: 'w+' })
  } else if (fs.existsSync(rootFolder + '/.github/MISSING.md')) {
    fs.unlinkSync(rootFolder + '/.github/MISSING.md')
  }

  if (hasAbandonedLanguages) {
    output = ''
    output = output + '# Abandoned Translations.\n\n'
    output = output + 'Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better!'
    output = output + ' Below is a list of translations keys on existing files that still need translated, based on `en.json`.\n\n'

    for (const key in abandonedLanguages) {
      output = output + '[' + key + '.json (' + Object.entries(abandonedLanguages[key]).length + ' untranslated strings)](#' + (key + '.json').toLowerCase().replace(/[^a-zA-Z0-9-]+/g, '') + ')\n\n'
    }
    output = output + '\n'
    for (const key in abandonedLanguages) {
      abandonedLanguages[key].sort()
      output = output + '## ' + key + '.json\n' + Object.entries(abandonedLanguages[key]).length + ' untranslated strings\n```\n'
      for (const sourceKey of abandonedLanguages[key]) {
        output = output + '"' + sourceKey + '": "' + source[sourceKey].replace(/\n/g, '\\n') + '",\n'
      }
      output = output.substring(0, output.length - 2) + '\n```\n'
    }
    fs.writeFileSync(rootFolder + '/.github/ABANDONED.md', output, { flag: 'w+' })
  } else if (fs.existsSync(rootFolder + '/.github/ABANDONED.md')) {
    fs.unlinkSync(rootFolder + '/.github/ABANDONED.md')
  }
} catch (e) {
  TemplateHelpers.showErrorAndExit(e)
}
