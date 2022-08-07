import { Remarkable } from 'remarkable'
import * as fs from 'fs'
import write from './node_modules/write/index.js'

const sources = {
  wZtTHpGV3atKV2oD: {
    en: {
      name: 'Call of Cthulhu 7th Edition (Unofficial) [en]',
      file: 'manual.md'
    }
  },
  nVYLlqVzmUV5dXAW: {
    en: {
      name: 'Creating your first investigator [en]',
      file: 'first_investigator.md'
    }
  },
  VdOeGcxsu3jsVm3F: {
    en: {
      name: 'Chases [en]',
      file: 'chases.md'
    }
  }
}

const dbFile = []

for (const id in sources) {
  for (const lang in sources[id]) {
    try {
      const md = new Remarkable()
      const input = fs.readFileSync(
        './module/manual/' + lang + '/' + sources[id][lang].file,
        'utf8'
      )

      const source = md.render(input)

      const html = source
        .replace(/<p>\.<\/p>/g, '<p>&nbsp;</p>')
        .replace(
          /\[(fas fa-[^\]]+|game-icon game-icon-[^\]]+)\]/g,
          '<em class="$1">&nbsp;</em>'
        )
        .replace(/src="..\/..\/assets\//g, 'src="systems/CoC7/assets/')
        .replace(/\n\s*/g, '\n')

      const dbEntry = {
        _id: id,
        name: sources[id][lang].name,
        content: '<div class="coc7overview">\n' + html + '\n</div>'
      }

      dbFile.push(JSON.stringify(dbEntry))

      let mdFile = input
        .replace(/\n.\n/g, '\n')
        .replace(/\[(fas fa-[^\]]+|game-icon game-icon-[^\]]+)\]/g, '')

      const compendiumLinks = mdFile.matchAll(
        /@Compendium\[(?<pack>[^\]]+)\.(?<id>[^\\.]+)\]{(?<name>[^}]+)}/g
      )
      for (const link of compendiumLinks) {
        if (link.groups.pack !== 'CoC7.system-doc') {
          mdFile = mdFile.replace(link[0], '')
        } else {
          mdFile = mdFile.replace(
            link[0],
            '[' +
              link.groups.name +
              '](' +
              sources[link.groups.id][lang].file +
              ')'
          )
        }
      }

      write('./docs/' + lang + '/' + sources[id][lang].file, mdFile)
    } catch (e) {
      console.log('EXCEPTION:', e)
    }
  }
}

write('./packs/system-doc.db', dbFile.join('\n'))
