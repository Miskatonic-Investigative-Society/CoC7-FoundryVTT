import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'
import { ClassicLevel } from 'classic-level'

const FOLDER_ID = 'CoC7'

const rootFolder = fs.realpathSync(path.dirname(url.fileURLToPath(import.meta.url)) + '/..')

const collisions = {}

const rolls = [
  {
    type: 'attrib',
    name: 'Attrib',
    names: [
      {
        name: 'Luck',
        icon: 'fas fa-dice-d20'
      },
      {
        name: 'Sanity',
        icon: 'fas fa-pastafarianism'
      }
    ]
  },
  {
    type: 'characteristic',
    name: 'Characteristic',
    names: [
      {
        name: 'APP',
        icon: 'fas fa-hat-cowboy'
      },
      {
        name: 'CON',
        icon: 'fas fa-heart-broken'
      },
      {
        name: 'DEX',
        icon: 'fas fa-skating'
      },
      {
        name: 'EDU',
        icon: 'fas fa-graduation-cap'
      },
      {
        name: 'INT',
        icon: 'fas fa-brain'
      },
      {
        name: 'POW',
        icon: 'fas fa-hamsa'
      },
      {
        name: 'SIZ',
        icon: 'fas fa-child'
      },
      {
        name: 'STR',
        icon: 'fas fa-dumbbell'
      }
    ]
  },
  {
    type: 'skill',
    name: 'Skill',
    names: [
      {
        name: 'Accounting',
        icon: 'fas fa-balance-scale'
      },
      {
        name: 'Anthropology',
        icon: 'fas fa-bone'
      },
      {
        name: 'Appraise',
        icon: 'fas fa-dollar-sign'
      },
      {
        name: 'Archaeology',
        icon: 'fas fa-archway'
      },
      {
        name: 'Art/Craft (Fine Art)',
        icon: 'fas fa-broom'
      },
      {
        name: 'Charm',
        icon: 'fas fa-kiss-wink-heart'
      },
      {
        name: 'Climb',
        icon: 'fas fa-hiking'
      },
      {
        name: 'Computer Use',
        icon: 'fas fa-mouse'
      },
      {
        name: 'Credit Rating',
        icon: 'fas fa-award'
      },
      {
        name: 'Cthulhu Mythos',
        icon: 'fab fa-gitkraken'
      },
      {
        name: 'Demolitions',
        icon: 'fas fa-bomb'
      },
      {
        name: 'Disguise',
        icon: 'fas fa-user-secret'
      },
      {
        name: 'Diving',
        icon: 'fas fa-user-astronaut'
      },
      {
        name: 'Dodge',
        icon: 'fas fa-running'
      },
      {
        name: 'Drive Auto',
        icon: 'fas fa-car-side'
      },
      {
        name: 'Electrical Repair',
        icon: 'fas fa-bolt'
      },
      {
        name: 'Electronics',
        icon: 'fas fa-microchip'
      },
      {
        name: 'Fast Talk',
        icon: 'fas fa-dizzy'
      },
      {
        name: 'Fighting (Brawl)',
        icon: 'fas fa-fist-raised'
      },
      {
        name: 'Firearms (Handgun)',
        icon: 'fas fa-bullseye'
      },
      {
        name: 'Firearms (Rifle/Shotgun)',
        icon: 'fas fa-crosshairs'
      },
      {
        name: 'Firearms (Submachine Gun)',
        icon: 'far fa-dot-circle'
      },
      {
        name: 'First Aid',
        icon: 'fas fa-medkit'
      },
      {
        name: 'History',
        icon: 'fas fa-heading'
      },
      {
        name: 'Intimidate',
        icon: 'fas fa-tired'
      },
      {
        name: 'Jump',
        icon: 'fas fa-walking'
      },
      {
        name: 'Language (Any)',
        icon: 'fas fa-om'
      },
      {
        name: 'Language (Own)',
        icon: 'fas fa-globe'
      },
      {
        name: 'Law',
        icon: 'fas fa-gavel'
      },
      {
        name: 'Library Use',
        icon: 'fas fa-book-open'
      },
      {
        name: 'Listen',
        icon: 'fas fa-deaf'
      },
      {
        name: 'Locksmith',
        icon: 'fab fa-expeditedssl'
      },
      {
        name: 'Mechanical Repair',
        icon: 'fas fa-tools'
      },
      {
        name: 'Medicine',
        icon: 'fas fa-ambulance'
      },
      {
        name: 'Natural World',
        icon: 'fas fa-hippo'
      },
      {
        name: 'Navigate',
        icon: 'fas fa-route'
      },
      {
        name: 'Occult',
        icon: 'fas fa-hat-wizard'
      },
      {
        name: 'Operate Heavy Machinery',
        icon: 'fas fa-snowplow'
      },
      {
        name: 'Persuade',
        icon: 'fas fa-comments'
      },
      {
        name: 'Pilot (Boat)',
        icon: 'fas fa-ship'
      },
      {
        name: 'Psychoanalysis',
        icon: 'fas fa-head-side-cough'
      },
      {
        name: 'Psychology',
        icon: 'fas fa-head-side-virus'
      },
      {
        name: 'Read Lips',
        icon: 'fas fa-blind'
      },
      {
        name: 'Ride',
        icon: 'fab fa-sticker-mule'
      },
      {
        name: 'Science (Chemistry)',
        icon: 'fas fa-atom'
      },
      {
        name: 'Sleight of Hand',
        icon: 'fas fa-hand-sparkles'
      },
      {
        name: 'Spot Hidden',
        icon: 'fas fa-binoculars'
      },
      {
        name: 'Stealth',
        icon: 'fas fa-user-ninja'
      },
      {
        name: 'Survival (Desert)',
        icon: 'fas fa-wind'
      },
      {
        name: 'Swim',
        icon: 'fas fa-swimmer'
      },
      {
        name: 'Fighting (Throw)',
        icon: 'fas fa-football-ball'
      },
      {
        name: 'Track',
        icon: 'fas fa-shoe-prints'
      }
    ]
  }
]

const parameters = [
  {
    name: 'Regular',
    code: '',
    difficulty: 0,
    modifier: 0
  },
  {
    name: 'Hard',
    code: 'Hard',
    difficulty: '+',
    modifier: 0
  },
  {
    name: 'Extreme',
    code: 'Extreme',
    difficulty: '++',
    modifier: 0
  },
  {
    name: 'Critical',
    code: 'Critical',
    difficulty: '+++',
    modifier: 0
  },
  {
    name: 'Blind',
    code: 'Blind',
    difficulty: '?',
    modifier: 0
  },
  {
    name: '1 Bonus',
    code: '1B',
    difficulty: 0,
    modifier: '+1'
  },
  {
    name: '2 Bonus',
    code: '2B',
    difficulty: 0,
    modifier: '+2'
  },
  {
    name: '1 Penalty',
    code: '1P',
    difficulty: 0,
    modifier: '-1'
  },
  {
    name: '2 Penalty',
    code: '2P',
    difficulty: 0,
    modifier: '-2'
  }
]

try {
  const html = [
    '<table><tbody>',
    '<tr>',
    '<td><p style="text-align:center"><strong>Type</strong></p></td>',
    '<td><p style="text-align:center"><strong>Name</strong></p></td>',
    '<td><p style="text-align:center"><strong>Parameters</strong></p></td>',
    '<td><p style="text-align:center"><strong>Code</strong></p></td>',
    '</tr>'
  ]
  for (const roll1 of rolls) {
    for (const roll2 of roll1.names) {
      for (const parameter of parameters) {
        html.push('<tr>')
        html.push('<td><p style="text-align:center"><strong>' + roll1.name + '</strong></p></td>')
        html.push('<td><p style="text-align:center">' + roll2.name + '</p></td>')

        html.push('<td><p style="text-align:center">' + parameter.name + '</p></td>')
        html.push('<td><p style="text-align:center">@coc7.check[type:' + roll1.type + ',name:' + roll2.name + ',difficulty:' + parameter.difficulty + ',modifier:' + parameter.modifier + ',icon:' + roll2.icon + ']{ ' + roll2.name + (parameter.code !== '' ? ' (' + parameter.code + ')' : '') + '}</p></td>')
        html.push('</tr>')
      }
    }
  }

  const dbFile = {}

  const id = 'qaWAuaZa42JtdBhF'
  collisions[id] = true
  const pageId = 'izVAGIeSXPWURg7U'
  collisions[pageId] = true
  const journalKey = '!journal!' + id
  const journalPageKey = '!journal.pages!' + id + '.' + pageId
  dbFile[journalKey] = {
    name: 'Roll Requests',
    pages: [
      pageId
    ],
    _id: id,
    flags: {
      [FOLDER_ID]: {
        cocidFlag: {
          id: 'je..roll-requests',
          lang: 'en',
          priority: 0
        }
      }
    }
  }
  dbFile[journalPageKey] = {
    _id: pageId,
    name: 'Roll Requests',
    type: 'text',
    title: {
      show: false
    },
    text: {
      content: html.join('')
    }
  }

  const batch = Object.keys(dbFile).reduce((c, i) => {
    c.push({ type: 'put', key: i, value: dbFile[i], valueEncoding: 'json' })
    return c
  }, [])

  if (fs.existsSync(rootFolder + '/packs/roll-requests')) {
    await ClassicLevel.destroy(rootFolder + '/packs/roll-requests')
  }
  const db = new ClassicLevel(rootFolder + '/packs/roll-requests', { keyEncoding: 'utf8', valueEncoding: 'json' })
  await db.batch(batch, { valueEncoding: 'utf8' })
  await db.close()
  console.log('Generated: ./packs/roll-requests')
} catch (e) {
  console.log('EXCEPTION:', e)
}
