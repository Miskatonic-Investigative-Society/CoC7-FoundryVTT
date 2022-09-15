import * as crypto from 'crypto'
import { Remarkable } from 'remarkable'
import * as fs from 'fs'
import write from './node_modules/write/index.js'

const collisions = {}

const sources = {
  en: {
    name: 'Call of Cthulhu 7th Edition (Unofficial)',
    pages: [
      {
        name: 'System documentation for version 9.0',
        file: 'README.md'
      },
      {
        name: 'Active effects',
        file: 'effects.md'
      },
      {
        name: 'Actor Importer',
        file: 'actor_importer.md'
      },
      {
        name: 'Character Creation',
        file: 'character_creation.md'
      },
      {
        name: 'Chases',
        file: 'chases.md'
      },
      {
        name: 'Combat',
        file: 'combat.md'
      },
      {
        name: 'Commands Cheat Sheet',
        file: 'commands_cheat_sheet.md'
      },
      {
        name: 'Creating your first investigator',
        file: 'first_investigator.md'
      },
      {
        name: 'Items',
        file: 'items.md'
      },
      {
        name: 'Item Type: Archetype',
        file: 'item_archetype.md'
      },
      {
        name: 'Item Type: Book',
        file: 'item_book.md'
      },
      {
        name: 'Item Type: Occupation',
        file: 'item_occupation.md'
      },
      {
        name: 'Item Type: Setup',
        file: 'item_setup.md'
      },
      {
        name: 'Item Type: Skill',
        file: 'item_skill.md'
      },
      {
        name: 'Links',
        file: 'links.md'
      },
      {
        name: 'Link creation tool',
        file: 'link_creation_window.md'
      },
      {
        name: 'Sanity',
        file: 'sanity.md'
      }
    ]
  }
}

const dbFile = []
try {
  for (const lang in sources) {
    let id = generateBuildConsistentID('manual' + lang)
    const dbEntry = {
      name: sources[lang].name + ' [' + lang + ']',
      pages: [],
      _id: id
    }
    const links = {}
    for (const source of sources[lang].pages) {
      let id = generateBuildConsistentID('manual' + lang + source.file)
      collisions[id] = true
      links[source.file] = id
    }
    for (const page in sources[lang].pages) {
      const md = new Remarkable()
      let input = fs.readFileSync(
        './module/manual/' + lang + '/' + sources[lang].pages[page].file,
        'utf8'
      )

      const mdFile = input
        .replace(/\[(fas fa-[^\]]+|game-icon game-icon-[^\]]+)\]/g, '')
        .replace(/@@coc7./g, '@coc7.')
        .replace(/@Compendium\[[^\]]+\.[^\\.]+\]{([^}]+)}/g, '[_$1_]')

      write('./docs/' + lang + '/' + sources[lang].pages[page].file, mdFile)

      const matches = input.matchAll(/\[(.+?)\]\(((?![a-z]{1,10}:)(.+?))\)/g)
      for (const match of matches) {
        if (typeof links[match[2]] !== 'undefined') {
          input = input.replace(match[0], '@UUID[.' + links[match[2]] + ']{' + match[1] + '}')
        }
      }

      const html = md.render(input)
        .replace(
          /\[(fas fa-[^\]]+|game-icon game-icon-[^\]]+)\]/g,
          '<em class="$1">&nbsp;</em>'
        )
        .replace(/src="..\/..\/assets\//g, 'src="systems/CoC7/assets/')
        .replace(/\n\s*/g, '\n')
        .replace(/@@coc7./g, '<span>@</span>coc7.')

      dbEntry.pages.push({
        name: sources[lang].pages[page].name,
        type: 'text',
        _id: links[sources[lang].pages[page].file],
        title: {
          show: false,
          level: 1
        },
        text: {
          format: 1,
          content: '<div class="coc7overview">\n' + html + '\n</div>',
          markdown: ''
        },
        sort: Number(page)
      })
    }
    dbFile.push(JSON.stringify(dbEntry))
  }
} catch (e) {
  console.log('EXCEPTION:', e)
}

write('./packs/system-doc.db', dbFile.join('\n'))

/**
 * generateBuildConsistentID uses idSource to generate an id that will be consistent across builds.
 *
 * Note: This is called outside of foundry to build manual .db files and substitutes foundry.utils.randomID in a build consistent way.
 * It creates a hash from the key so it is consistent between builds and the converts to base 64 so it uses the same range of characters as FoundryVTTs generator.
 * @param {string} idSource
 * @returns id, an string of 16 characters with the id consistently generated from idSource
 */
function generateBuildConsistentID(idSource) {
  let id = crypto.createHash('md5').update(idSource).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
  while (typeof collisions[id] !== 'undefined') {
    id = crypto.createHash('md5').update(idSource + Math.random().toString()).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
  }
  return id
}

