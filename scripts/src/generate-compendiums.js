import * as fs from 'fs'
import { loadAll } from 'js-yaml'
import TemplateHelpers from './template-helpers.js'

export default class GenerateCompendiums {
  /**
   * Process
   */
  static async process () {
    const rootFolder = TemplateHelpers.systemRoot

    const foundryConfig = TemplateHelpers.loadFoundryConfig()

    if (typeof foundryConfig.json.packs === 'undefined') {
      throw new Error('No packs found in ./' + foundryConfig.type + '.json file')
    }

    if (typeof foundryConfig.json.languages === 'undefined') {
      throw new Error('No languages found in ./' + foundryConfig.type + '.json file')
    }

    const langs = []
    for (const lang of foundryConfig.json.languages) {
      if (lang.lang) {
        langs.push(lang.lang)
      }
    }

    const sortedLangs = [...langs].sort((a, b) => b.length - a.length)
    const batch = []
    for (const pack of foundryConfig.json.packs) {
      const packPath = pack.path.replace(/^packs\//, '')
      const lang = sortedLangs.find(lang => packPath.startsWith(lang + '-'))

      if (!lang) {
        TemplateHelpers.ansiFormat('Skipping Pack ' + packPath + ' (' + pack.type + ')', { color: 'yellow', output: true })
        continue
      }

      const single = {
        type: pack.type,
        lang,
        pack: packPath.substring(lang.length + 1)
      }

      if (fs.existsSync(rootFolder + '/compendiums/' + single.lang + '-' + single.pack + '.yaml')) {
        if (!langs.includes(single.lang)) {
          throw new Error('Invalid language found in ./' + foundryConfig.type + '.json file for ' + pack.name)
        }

        batch.push(single)
      } else {
        TemplateHelpers.ansiFormat('Skipping Pack ' + single.lang + '-' + single.pack + ' (' + single.type + ')', { color: 'yellow', output: true })
      }
    }

    console.log('Known Packs', batch)

    const collisions = {}

    for (const single of batch) {
      const yaml = fs.readFileSync(rootFolder + '/compendiums/' + single.lang + '-' + single.pack + '.yaml', 'utf8')
      const yamlObject = loadAll(yaml)

      const documents = yamlObject.filter(doc => doc).reduce((c, doc) => {
        const entity = TemplateHelpers.processDocument(collisions, doc, { type: single.type, lang: single.lang, id: foundryConfig.json.id })
        c[entity.id] = entity.value
        return c
      }, {})

      TemplateHelpers.createBinaryPack(single.lang + '-' + single.pack, documents)
      console.log('Generated: ./packs/' + single.lang + '-' + single.pack, Object.keys(documents).length)
    }
  }
}
