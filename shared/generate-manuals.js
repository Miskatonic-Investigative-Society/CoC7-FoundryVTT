import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { ClassicLevel } from 'classic-level'
import { Remarkable } from 'remarkable'

const FOLDER_ID = 'CoC7'

const rootFolder = fs.realpathSync(path.dirname(url.fileURLToPath(import.meta.url)) + '/..')

const collisions = {}

const sources = {
  de: {
    name: 'Cthulhu 7. Edition',
    priority: 0,
    pages: [
      {
        name: 'Systemdokumentation',
        file: 'README.md'
      },
      {
        name: 'Effekte',
        file: 'effects.md'
      },
      {
        name: 'Figurenimporter',
        file: 'actor_importer.md'
      },
      {
        name: 'Charaktererstellung',
        file: 'character_creation.md'
      },
      {
        name: 'Erfahrung und Charakterentwicklung',
        file: 'experience.md'
      },
      {
        name: 'Verfolgungsjagd',
        file: 'chases.md'
      },
      {
        name: 'CoC ID System',
        file: 'coc-id-system.md'
      },
      {
        name: 'Kampf',
        file: 'combat.md'
      },
      {
        name: 'Kommando Cheat Sheet',
        file: 'commands_cheat_sheet.md'
      },
      {
        name: 'Erstelle deinen ersten Investigator',
        file: 'first_investigator.md'
      },
      {
        name: 'Items/Gegenstände',
        file: 'items.md'
      },
      {
        name: 'Item Type: Archetyp',
        file: 'item_archetype.md'
      },
      {
        name: 'Item Typ: Buch',
        file: 'item_book.md'
      },
      {
        name: 'Item Typ: Beruf',
        file: 'item_occupation.md'
      },
      {
        name: 'Item Typ: Setup',
        file: 'item_setup.md'
      },
      {
        name: 'Item Typ: Fertigkeit',
        file: 'item_skill.md'
      },
      {
        name: 'Links',
        file: 'links.md'
      },
      {
        name: 'Linkerstellungswerkzeug',
        file: 'link_creation_window.md'
      },
      {
        name: 'Geistige Stabilität',
        file: 'sanity.md'
      }
    ]
  },
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
        name: 'Compendiums',
        file: 'compendiums.md'
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
  },
  ja: {
    name: '新クトゥルフ神話TRPG',
    priority: 0,
    pages: [
      {
        name: 'システム資料',
        file: 'README.md'
      }
    ]
  },
  uk: {
    name: 'Поклик Ктулху: 7 Видання',
    priority: 0,
    pages: [
      {
        name: 'Документація про систему',
        file: 'README.md'
      },
      {
        name: 'Ефекти',
        file: 'effects.md'
      },
      {
        name: 'Імпорт Акторів',
        file: 'actor_importer.md'
      },
      {
        name: 'Створення персонажа',
        file: 'character_creation.md'
      },
      {
        name: 'Гонитва (Не перекладено)',
        file: 'chases.md'
      },
      {
        name: 'Система CoC ID (Не перекладено)',
        file: 'coc-id-system.md'
      },
      {
        name: 'Бій (Не перекладено)',
        file: 'combat.md'
      },
      {
        name: 'Шпаргалка з командами',
        file: 'commands_cheat_sheet.md'
      },
      {
        name: 'Створення першого дослідника (Не перекладено)',
        file: 'first_investigator.md'
      },
      {
        name: 'Предмети',
        file: 'items.md'
      },
      {
        name: 'Тип предмету: Архетип Pulp',
        file: 'item_archetype.md'
      },
      {
        name: 'Тип предмету: Книга',
        file: 'item_book.md'
      },
      {
        name: 'Тип предмету: Діяльність (не перекладено)',
        file: 'item_occupation.md'
      },
      {
        name: 'Тип предмету: Шаблон (Не перекладено)',
        file: 'item_setup.md'
      },
      {
        name: 'Тип предмету: Вміння',
        file: 'item_skill.md'
      },
      {
        name: 'Посилання на кидки (Не перекладено)',
        file: 'links.md'
      },
      {
        name: 'Засіб створення посилань (Не перекладено)',
        file: 'link_creation_window.md'
      },
      {
        name: 'Глузд',
        file: 'sanity.md'
      }
    ]
  }
}

const dbFile = {}
try {
  for (const lang in sources) {
    const id = generateBuildConsistentID('manual' + lang)
    collisions[id] = true
    const journalKey = '!journal!' + id
    const journalPagePrefixKey = '!journal.pages!' + id + '.'
    dbFile[journalKey] = {
      name: sources[lang].name + ' [' + lang + ']',
      pages: [],
      _id: id,
      flags: {
        [FOLDER_ID]: {
          cocidFlag: {
            eras: {},
            id: 'je..call-of-cthulhu-7-th-edition-system-documentation',
            lang,
            priority: sources[lang].priority
          },
          'css-adventure-entry': true
        }
      }
    }
    const links = {}
    for (const source of sources[lang].pages) {
      const id = generateBuildConsistentID('manual' + lang + source.file)
      collisions[id] = true
      links[source.file] = id
    }

    if (!fs.existsSync(rootFolder + '/docs/')) {
      fs.mkdirSync(rootFolder + '/docs/')
    }

    for (const page in sources[lang].pages) {
      const md = new Remarkable()
      let input = fs.readFileSync(rootFolder + '/module/manual/' + lang + '/' + sources[lang].pages[page].file, 'utf8')

      const mdFile = input
        .replace(/\[(fas fa-[^\]]+|game-icon game-icon-[^\]]+)\]/g, '')
        .replace(/@@coc7./g, '@coc7.')
        .replace(/@Compendium\[[^\]]+\.[^\\.]+\]{([^}]+)}/g, '[_$1_]')

      if (!fs.existsSync(rootFolder + '/docs/' + lang + '/')) {
        fs.mkdirSync(rootFolder + '/docs/' + lang + '/')
      }

      fs.writeFileSync(rootFolder + '/docs/' + lang + '/' + sources[lang].pages[page].file, '<!--- DO NOT EDIT. This file is automatically generated from module/manual/' + lang + '/' + sources[lang].pages[page].file + ' changes made to this file will be lost -->\n' + mdFile, { flag: 'w+' })

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

      dbFile[journalKey].pages.push(links[sources[lang].pages[page].file])
      dbFile[journalPagePrefixKey + links[sources[lang].pages[page].file]] = {
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
      }
    }
  }

  const batch = Object.keys(dbFile).reduce((c, i) => {
    c.push({ type: 'put', key: i, value: dbFile[i], valueEncoding: 'json' })
    return c
  }, [])

  if (fs.existsSync(rootFolder + '/packs/system-doc')) {
    await ClassicLevel.destroy(rootFolder + '/packs/system-doc')
  }
  const db = new ClassicLevel(rootFolder + '/packs/system-doc', { keyEncoding: 'utf8', valueEncoding: 'json' })
  await db.batch(batch, { valueEncoding: 'utf8' })
  await db.close()
  console.log('Generated: ./packs/system-doc')
} catch (e) {
  console.log('EXCEPTION:', e)
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
    id = crypto.createHash('md5').update(idSource + Math.random().toString()).digest('base64').replace(/[\\+=\\/]/g, '').substring(0, 16)
  }
  return id
}
