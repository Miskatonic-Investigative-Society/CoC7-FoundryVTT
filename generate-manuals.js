import * as crypto from 'crypto'
import { Remarkable } from 'remarkable'
import * as fs from 'fs'
import write from './node_modules/write/index.js'

const collisions = {}

const sources = {
  en: {
    name: 'Call of Cthulhu 7th Edition',
    priority: 0,
    pages: [
      {
        name: 'System documentation',
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
        name: 'CoC ID System',
        file: 'coc-id-system.md'
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
  },
  es: {
    name: 'La Llamada de Cthulhu 7ª Edición',
    priority: 0,
    pages: [
      {
        name: 'Documentación del sistema',
        file: 'README.md'
      },
      {
        name: 'Efectos',
        file: 'efectos.md'
      },
      {
        name: 'Importador de actores',
        file: 'importador_de_actores.md'
      },
      {
        name: 'Creación de personajes',
        file: 'creacion_de_personaje.md'
      },
      {
        name: 'Persecuciones',
        file: 'persecuciones.md'
      },
      {
        name: 'Sistema de CoC ID',
        file: 'sistema_de_coc_id.md'
      },
      {
        name: 'Combate',
        file: 'combate.md'
      },
      {
        name: 'Hoja de atajos',
        file: 'hoja_de_atajos.md'
      },
      {
        name: 'Creando tu primer investigador',
        file: 'primer_investigador.md'
      },
      {
        name: 'Objetos',
        file: 'objetos.md'
      },
      {
        name: 'Tipo de objeto: Arquetipo',
        file: 'objeto_arquetipo.md'
      },
      {
        name: 'Tipo de objeto: Libro',
        file: 'objeto_libro.md'
      },
      {
        name: 'Tipo de objeto: Ocupación',
        file: 'objeto_ocupacion.md'
      },
      {
        name: 'Tipo de objeto: Configuración',
        file: 'objeto_configuracion.md'
      },
      {
        name: 'Tipo de objeto: Habilidad',
        file: 'objeto_habilidad.md'
      },
      {
        name: 'Enlaces',
        file: 'enlaces.md'
      },
      {
        name: 'Herramienta de creación de enlaces',
        file: 'ventana_de_creacion_de_enlaces.md'
      },
      {
        name: 'Cordura',
        file: 'cordura.md'
      }
    ]
  },
  fr: {
    name: 'L\'Appel de Cthulhu version 7',
    priority: 0,
    pages: [
      {
        name: 'Documentation du système',
        file: 'README.md'
      },
      {
        name: 'Effets',
        file: 'effects.md'
      },
      {
        name: 'Importation d\'acteurs',
        file: 'actor_importer.md'
      },
      {
        name: 'Création de Personnage',
        file: 'character_creation.md'
      },
      {
        name: 'Expérience & évolution',
        file: 'experience.md'
      },
      {
        name: 'Poursuites',
        file: 'chases.md'
      },
      {
        name: 'Système de gestion des ID ',
        file: 'coc-id-system.md'
      },
      {
        name: 'Combat',
        file: 'combat.md'
      },
      {
        name: 'Tableau des commandes',
        file: 'commands_cheat_sheet.md'
      },
      {
        name: 'Créer son premier investigateur',
        file: 'first_investigator.md'
      },
      {
        name: 'Objets',
        file: 'items.md'
      },
      {
        name: 'Type d\'Objet: Archétype',
        file: 'item_archetype.md'
      },
      {
        name: 'Type d\'Objet: Livre',
        file: 'item_book.md'
      },
      {
        name: 'Type d\'Objet: Occupation',
        file: 'item_occupation.md'
      },
      {
        name: 'Type d\'Objet: Setup',
        file: 'item_setup.md'
      },
      {
        name: 'Type d\'Objet: Compétence',
        file: 'item_skill.md'
      },
      {
        name: 'Liens',
        file: 'links.md'
      },
      {
        name: 'Outil de création de Lien',
        file: 'link_creation_window.md'
      },
      {
        name: 'Santé Mentale',
        file: 'sanity.md'
      }
    ]
  }
}

const dbFile = []
try {
  for (const lang in sources) {
    const id = generateBuildConsistentID('manual' + lang)
    const dbEntry = {
      name: sources[lang].name + ' [' + lang + ']',
      pages: [],
      _id: id,
      flags: {
        CoC7: {
          cocidFlag: {
            eras: {},
            id: 'je..call-of-cthulhu-7-th-edition-system-documentation',
            lang,
            priority: sources[lang].priority
          }
        }
      }
    }
    const links = {}
    const includedPages = []
    for (const source of sources[lang].pages) {
      const id = generateBuildConsistentID('manual' + lang + source.file)
      collisions[id] = true
      links[source.file] = id
    }
    for (const page in sources[lang].pages) {
      const md = new Remarkable()
      let input = fs.readFileSync(
        './module/manual/' + lang + '/' + sources[lang].pages[page].file,
        'utf8'
      )
      includedPages.push(' - "' + sources[lang].pages[page].name + '" from module/manual/' + lang + '/' + sources[lang].pages[page].file)

      const mdFile = input
        .replace(/\[(fas fa-[^\]]+|game-icon game-icon-[^\]]+)\]/g, '')
        .replace(/@@coc7./g, '@coc7.')
        .replace(/@Compendium\[[^\]]+\.[^\\.]+\]{([^}]+)}/g, '[_$1_]')

      write('./docs/' + lang + '/' + sources[lang].pages[page].file, mdFile)

      const matches = input.matchAll(/\[(.+?)\]\(((?![a-z]{1,10}:)(.+?))\)/g)
      for (const match of matches) {
        if (match[2].substring(0, 1) === '#') {
          input = input.replace(match[0], '@UUID[.' + links[sources[lang].pages[page].file] + match[2] + ']{' + match[1] + '}')
        } else if (typeof links[match[2]] !== 'undefined') {
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
    console.log('Created: ' + dbEntry.name)
    console.log(includedPages.join('\n'))
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
function generateBuildConsistentID (idSource) {
  let id = crypto.createHash('md5').update(idSource).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
  while (typeof collisions[id] !== 'undefined') {
    id = crypto.createHash('md5').update(idSource + Math.random().toString()).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
  }
  return id
}
