import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { ClassicLevel } from 'classic-level'
import { loadAll } from 'js-yaml'

export default class GenerateCompendiums {
  static async process () {
    const rootFolder = fs.realpathSync(path.dirname(url.fileURLToPath(import.meta.url)) + '/..')

    let type = ''

    if (fs.existsSync(rootFolder + '/module.json')) {
      type = 'module'
    } else if (fs.existsSync(rootFolder + '/system.json')) {
      type = 'system'
    } else {
      throw new Error('No module.json or system.json')
    }

    let outputMode = 'db'
    for (let i = 2, im = process.argv.length; i < im; i++) {
      if (['db', 'json'].includes(process.argv[i])) {
        outputMode = process.argv[i]
      }
    }

    const foundryConfig = JSON.parse(fs.readFileSync(rootFolder + '/' + type + '.json', 'utf8'))
    if (typeof foundryConfig?.id === 'undefined') {
      throw new Error('No id found in ./' + type + '.json file')
    }

    if (typeof foundryConfig.packs === 'undefined') {
      throw new Error('No packs found in ./' + type + '.json file')
    }

    if (typeof foundryConfig.languages === 'undefined') {
      throw new Error('No languages found in ./' + type + '.json file')
    }

    const langs = []
    for (const lang of foundryConfig.languages) {
      if (lang.lang) {
        langs.push(lang.lang)
      }
    }

    const batch = []
    for (const pack of foundryConfig.packs) {
      const match = pack.path.match(/^packs\/([^-]+)-(.+)$/)

      if (!match) {
        throw new Error('Incorrect folder found in ./' + type + '.json file for ' + pack.name)
      }

      const single = {
        type: pack.type,
        lang: match[1],
        pack: match[2]
      }

      if (fs.existsSync(rootFolder + '/compendiums/' + single.lang + '-' + single.pack + '.yaml')) {
        if (!langs.includes(single.lang)) {
          throw new Error('Invalid language found in ./' + type + '.json file for ' + pack.name)
        }

        batch.push(single)
      } else {
        console.log('\x1b[33m', 'Skipping Pack', single.lang + '-' + single.pack + ' (' + single.type + ')', '\x1b[0m')
      }
    }

    console.log('Known Packs', batch)

    for (const single of batch) {
      this.collisions = {}

      const yaml = fs.readFileSync(rootFolder + '/compendiums/' + single.lang + '-' + single.pack + '.yaml', 'utf8')

      const yamlObject = loadAll(yaml)

      const documents = yamlObject.filter(doc => doc).map(doc => {
        return GenerateCompendiums.processDocument(doc, { type: single.type, pack: single.lang, id: foundryConfig.id })
      })

      const batch = Object.keys(documents).reduce((c, i) => {
        const additionalKeys = {}
        let dbKey = ''
        if (documents[i].type === 'folder') {
          documents[i].type = single.type
          dbKey = 'folders'
        } else {
          switch (single.type) {
            case 'Actor':
              dbKey = single.type.toLowerCase() + 's'
              if (typeof documents[i].items !== 'undefined') {
                const items = []
                for (const doc of documents[i].items) {
                  const item = GenerateCompendiums.processDocument(doc, { type: 'Item', pack: single.lang, id: foundryConfig.id })
                  items.push(item._id)
                  if (typeof additionalKeys['actors.items'] === 'undefined') {
                    additionalKeys['actors.items'] = []
                  }
                  additionalKeys['actors.items'].push(item)
                }
                documents[i].items = items
              }
              break
            case 'Item':
              dbKey = single.type.toLowerCase() + 's'
              break
            case 'JournalEntry':
              dbKey = 'journal'
              if (typeof documents[i].pages !== 'undefined') {
                const pages = []
                for (const page of documents[i].pages) {
                  pages.push(page._id)
                  if (typeof additionalKeys['journal.pages'] === 'undefined') {
                    additionalKeys['journal.pages'] = []
                  }
                  additionalKeys['journal.pages'].push(page)
                }
                documents[i].pages = pages
              }
              break
            case 'RollTable':
              dbKey = 'tables'
              if (typeof documents[i].results !== 'undefined') {
                const results = []
                for (const result of documents[i].results) {
                  results.push(result._id)
                  if (typeof additionalKeys['tables.results'] === 'undefined') {
                    additionalKeys['tables.results'] = []
                  }
                  additionalKeys['tables.results'].push(result)
                }
                documents[i].results = results
              }
              break
            case 'Adventure':
              dbKey = 'adventures'
              break
            default:
              throw new Error('Unknown type ' + single.type)
          }
          if (typeof documents[i].sort === 'undefined') {
            documents[i].sort = Number(i)
          }
        }
        if (dbKey !== '') {
          c.push({ type: 'put', key: '!' + dbKey + '!' + documents[i]._id, value: documents[i], valueEncoding: 'json' })
        }
        for (const additionalKey in additionalKeys) {
          for (const additionalDocument of additionalKeys[additionalKey]) {
            c.push({ type: 'put', key: '!' + additionalKey + '!' + documents[i]._id + '.' + additionalDocument._id, value: additionalDocument, valueEncoding: 'json' })
          }
        }
        return c
      }, [])

      if (outputMode === 'json') {
        if (!fs.existsSync(rootFolder + '/temp')) {
          fs.mkdirSync(rootFolder + '/temp')
        }
        fs.writeFileSync(rootFolder + '/temp/' + single.lang + '-' + single.pack + '_2.json', JSON.stringify(batch, null, 2), { flag: 'w+' })
        console.log('Generated: ./temp/' + single.lang + '-' + single.pack + '_2.json')
      } else {
        if (fs.existsSync(rootFolder + '/packs/' + single.lang + '-' + single.pack)) {
          await ClassicLevel.destroy(rootFolder + '/packs/' + single.lang + '-' + single.pack)
        }
        const db = new ClassicLevel(rootFolder + '/packs/' + single.lang + '-' + single.pack, { keyEncoding: 'utf8', valueEncoding: 'json' })
        await db.batch(batch, { valueEncoding: 'utf8' })
        await db.close()
        console.log('Generated: ./packs/' + single.lang + '-' + single.pack, batch.length)
      }
    }
  }

  static processDocument (doc, { type = '', lang = 'en', id = '' }) {
    if (doc.type === 'folder') {
      if (!doc._id) {
        // Make sure we don't generate new ids everytime we rebuild
        doc._id = GenerateCompendiums.generateBuildConsistentID(doc.name + lang + 'folder')
      }
      this.collisions[doc._id] = true
      return doc
    }
    if (!doc._id) {
      // Make sure we don't generate new ids everytime we rebuild
      doc._id = GenerateCompendiums.generateBuildConsistentID(doc.name + lang + JSON.stringify(doc.flags.CoC7.cocidFlag.eras))
    }
    this.collisions[doc._id] = true
    switch (type) {
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
        if (typeof doc.results !== 'undefined') {
          let range = 0
          for (const offset in doc.results) {
            if (!doc.results[offset]._id) {
              doc.results[offset]._id = GenerateCompendiums.generateBuildConsistentID(doc.name + lang + JSON.stringify(doc.flags.CoC7.cocidFlag.eras) + offset)
            }
            if (!doc.results[offset].range) {
              range++
              doc.results[offset].range = [range, range]
            } else {
              range = doc.results[offset].range[1]
            }
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
              doc.pages[offset]._id = GenerateCompendiums.generateBuildConsistentID(doc.name + lang + JSON.stringify(doc.flags.CoC7.cocidFlag.eras) + offset)
            }
          }
        }
        break
    }
    return doc
  }

  /**
   * generateBuildConsistentID uses idSource to generate an id that will be consistent across builds.
   *
   * Note: This is called outside of foundry to build manual .db files and substitutes foundry.utils.randomID in a build consistent way.
   * It creates a hash from the key so it is consistent between builds and the converts to base 64 so it uses the same range of characters as FoundryVTTs generator.
   * @param {string} idSource
   * @returns id, an string of 16 characters with the id consistently generated from idSource
   */
  static generateBuildConsistentID (idSource) {
    let id = crypto.createHash('md5').update(idSource).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
    while (typeof this.collisions[id] !== 'undefined') {
      console.log('collision on ' + idSource)
      id = crypto.createHash('md5').update(idSource + Math.random().toString()).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
    }
    return id
  }
}
