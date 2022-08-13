import { Remarkable } from 'remarkable'
import * as fs from 'fs'
import write from './node_modules/write/index.js'

const sources = {
  rmtiwtbixojhyf5v: {
    name: 'Active effects',
    lang: 'en',
    file: 'effects.md'
  },
  xV4Hxxmu6zjIMw9h: {
    name: 'Actor Importer',
    lang: 'en',
    file: 'actor_importer.md'
  },
  wZtTHpGV3atKV2oD: {
    name: 'Call of Cthulhu 7th Edition (Unofficial)',
    lang: 'en',
    file: 'README.md'
  },
  uug1mm5nokly4o2v: {
    name: 'Character Creation',
    lang: 'en',
    file: 'character_creation.md'
  },
  VdOeGcxsu3jsVm3F: {
    name: 'Chases',
    lang: 'en',
    file: 'chases.md'
  },
  nk68b2ew15iw0bb8: {
    name: 'Combat',
    lang: 'en',
    file: 'combat.md'
  },
  wilj4rvkreemh70n: {
    name: 'Commands Cheat Sheet',
    lang: 'en',
    file: 'commands_cheat_sheet.md'
  },
  nVYLlqVzmUV5dXAW: {
    name: 'Creating your first investigator',
    lang: 'en',
    file: 'first_investigator.md'
  },
  di6mcnaxfyi0y2l4: {
    name: 'Items',
    lang: 'en',
    file: 'items.md'
  },
  kv2tbz6x29cq6ewq: {
    name: 'Item Type: Archetype',
    lang: 'en',
    file: 'item_archetype.md'
  },
  oruecvy7jne4u4gt: {
    name: 'Item Type: Book',
    lang: 'en',
    file: 'item_book.md'
  },
  qa934whpkpauiyc9: {
    name: 'Item Type: Occupation',
    lang: 'en',
    file: 'item_occupation.md'
  },
  JU1GCWwc8at7gzJ4: {
    name: 'Item Type: Setup',
    lang: 'en',
    file: 'item_setup.md'
  },
  mz0ulbkecfvv8nw7: {
    name: 'Item Type: Skill',
    lang: 'en',
    file: 'item_skill.md'
  },
  fk040vqb4per5ju1: {
    name: 'Links',
    lang: 'en',
    file: 'links.md'
  },
  emuu3wo0uul91029: {
    name: 'Link creation tool',
    lang: 'en',
    file: 'link_creation_window.md'
  },
  ce7s8psgyctzx5r1: {
    name: 'Sanity',
    lang: 'en',
    file: 'sanity.md'
  }
}

const dbFile = []

for (const id in sources) {
  try {
    const md = new Remarkable()
    const input = fs.readFileSync(
      './module/manual/' + sources[id].lang + '/' + sources[id].file,
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
      .replace(/@@coc7./g, '<span>@</span>coc7.')

    const dbEntry = {
      _id: id,
      name: sources[id].name + ' [' + sources[id].lang + ']',
      content: '<div class="coc7overview">\n' + html + '\n</div>'
    }

    dbFile.push(JSON.stringify(dbEntry))

    let mdFile = input
      .replace(/\n.\n/g, '\n')
      .replace(/\[(fas fa-[^\]]+|game-icon game-icon-[^\]]+)\]/g, '')
      .replace(/@@coc7./g, '@coc7.')

    const compendiumLinks = mdFile.matchAll(
      /@Compendium\[(?<pack>[^\]]+)\.(?<id>[^\\.]+)\]{(?<name>[^}]+)}/g
    )
    for (const link of compendiumLinks) {
      if (link.groups.pack !== 'CoC7.system-doc') {
        mdFile = mdFile.replace(link[0], '[_' + link.groups.name + '_]')
      } else {
        mdFile = mdFile.replace(
          link[0],
          '[' +
              link.groups.name +
              '](' +
              sources[link.groups.id].file +
              ')'
        )
      }
    }

    write('./docs/' + sources[id].lang + '/' + sources[id].file, mdFile)
  } catch (e) {
    console.log('EXCEPTION:', e)
  }
}

write('./packs/system-doc.db', dbFile.join('\n'))
