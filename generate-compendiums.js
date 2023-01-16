import * as crypto from 'crypto'
import * as fs from 'fs'
import glob from './node_modules/glob/glob.js'
import { loadAll } from './node_modules/js-yaml/index.js'

const lang = 'en'

let foundryVTTFile = ''
let check = ''
const collisions = {}
if (fs.existsSync(check = './system.json')) {
  foundryVTTFile = check
} else if (fs.existsSync(check = './module.json')) {
  foundryVTTFile = check
}

if (foundryVTTFile !== '') {
  const packs = {}
  const json = JSON.parse(fs.readFileSync(foundryVTTFile, 'utf8'))
  for (const pack of json.packs) {
    const match = pack.path.match(/([^\\/]+)\.db$/)
    if (match) {
      packs[match[1]] = pack.type
    }
  }
  console.log('Known packs', packs)
  const dbList = glob.sync('./compendiums/*.yaml', {})
  for (const filename of dbList) {
    const match = filename.match(/^\.\/compendiums\/([^/]+)\.yaml$/)
    if (match) {
      const fileslug = match[1]
      if (typeof packs[fileslug] !== 'undefined') {
        const type = packs[fileslug]
        let yaml = loadAll(fs.readFileSync(filename, 'utf8'))
        yaml = yaml.filter(doc => doc).map(doc => {
          if (!doc._id) {
            // Make sure we don't generate new ids everytime we rebuild
            doc._id = generateBuildConsistentID(doc.name + lang + JSON.stringify(doc.flags.cocidFlag.eras))
          }
          doc.flags = {
            CoC7: doc.flags
          }
          switch (type) {
            case 'Item':
              switch (doc.type) {
                case 'skill': {
                  const match = doc.name.match(/^(.+)\s*\((.+)\)$/)
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
                    doc.results[offset]._id = generateBuildConsistentID(doc.name + lang + JSON.stringify(doc.flags.CoC7.cocidFlag.eras) + offset)
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
          }
          return doc
        })
        const packDir = './packs/'
        const file = packDir + fileslug + '.db'
        if (!fs.existsSync(packDir)) {
          fs.mkdirSync(packDir, { recursive: true })
        }
        console.log('Generating: ' + file)
        fs.writeFileSync(file, yaml.map(doc => JSON.stringify(doc)).join('\n'))
      }
    }
  }
}

/**
 * generateBuildConsistentID uses idSource to generate an id that will be consistent across builds.
 *
 * Note: This is called outside of foundry to build manual .db files and substitutes foundry.utils.randomID in a build consistent way.
 * It creates a hash from the key so it is consistent between builds and the converts to base 64 so it uses the same range of characters as FoundryVTTs generator.
 * @param {string} idSource
 * @returns id, an string of 16 characters with the id consistently generated from idSource
 */
function generateBuildConsistentID (idSource) {
  let id = crypto.createHash('md5').update(idSource).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
  while (typeof collisions[id] !== 'undefined') {
    console.log('collision on ' + idSource)
    id = crypto.createHash('md5').update(idSource + Math.random().toString()).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
  }
  return id
}
