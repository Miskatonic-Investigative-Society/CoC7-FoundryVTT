import TemplateHelpers from './src/template-helpers.js'

const rolls = [
  {
    subtype: 'attrib',
    name: 'Attrib',
    names: [
      {
        name: 'Luck',
        icon: 'fa-solid fa-dice-d20'
      },
      {
        name: 'Sanity',
        icon: 'fa-solid fa-pastafarianism'
      }
    ]
  },
  {
    subtype: 'characteristic',
    name: 'Characteristic',
    names: [
      {
        name: 'APP',
        icon: 'fa-solid fa-hat-cowboy'
      },
      {
        name: 'CON',
        icon: 'fa-solid fa-heart-broken'
      },
      {
        name: 'DEX',
        icon: 'fa-solid fa-skating'
      },
      {
        name: 'EDU',
        icon: 'fa-solid fa-graduation-cap'
      },
      {
        name: 'INT',
        icon: 'fa-solid fa-brain'
      },
      {
        name: 'POW',
        icon: 'fa-solid fa-hamsa'
      },
      {
        name: 'SIZ',
        icon: 'fa-solid fa-child'
      },
      {
        name: 'STR',
        icon: 'fa-solid fa-dumbbell'
      }
    ]
  },
  {
    subtype: 'skill',
    name: 'Skill',
    names: [
      {
        name: 'Accounting',
        icon: 'fa-solid fa-balance-scale'
      },
      {
        name: 'Anthropology',
        icon: 'fa-solid fa-bone'
      },
      {
        name: 'Appraise',
        icon: 'fa-solid fa-dollar-sign'
      },
      {
        name: 'Archaeology',
        icon: 'fa-solid fa-archway'
      },
      {
        name: 'Art/Craft (Fine Art)',
        icon: 'fa-solid fa-broom'
      },
      {
        name: 'Charm',
        icon: 'fa-solid fa-kiss-wink-heart'
      },
      {
        name: 'Climb',
        icon: 'fa-solid fa-hiking'
      },
      {
        name: 'Computer Use',
        icon: 'fa-solid fa-mouse'
      },
      {
        name: 'Credit Rating',
        icon: 'fa-solid fa-award'
      },
      {
        name: 'Cthulhu Mythos',
        icon: 'fab fa-gitkraken'
      },
      {
        name: 'Demolitions',
        icon: 'fa-solid fa-bomb'
      },
      {
        name: 'Disguise',
        icon: 'fa-solid fa-user-secret'
      },
      {
        name: 'Diving',
        icon: 'fa-solid fa-user-astronaut'
      },
      {
        name: 'Dodge',
        icon: 'fa-solid fa-running'
      },
      {
        name: 'Drive Auto',
        icon: 'fa-solid fa-car-side'
      },
      {
        name: 'Electrical Repair',
        icon: 'fa-solid fa-bolt'
      },
      {
        name: 'Electronics',
        icon: 'fa-solid fa-microchip'
      },
      {
        name: 'Fast Talk',
        icon: 'fa-solid fa-dizzy'
      },
      {
        name: 'Fighting (Brawl)',
        icon: 'fa-solid fa-fist-raised'
      },
      {
        name: 'Firearms (Handgun)',
        icon: 'fa-solid fa-bullseye'
      },
      {
        name: 'Firearms (Rifle/Shotgun)',
        icon: 'fa-solid fa-crosshairs'
      },
      {
        name: 'Firearms (Submachine Gun)',
        icon: 'fa-regular fa-dot-circle'
      },
      {
        name: 'First Aid',
        icon: 'fa-solid fa-medkit'
      },
      {
        name: 'History',
        icon: 'fa-solid fa-heading'
      },
      {
        name: 'Intimidate',
        icon: 'fa-solid fa-tired'
      },
      {
        name: 'Jump',
        icon: 'fa-solid fa-walking'
      },
      {
        name: 'Language (Any)',
        icon: 'fa-solid fa-om'
      },
      {
        name: 'Language (Own)',
        icon: 'fa-solid fa-globe'
      },
      {
        name: 'Law',
        icon: 'fa-solid fa-gavel'
      },
      {
        name: 'Library Use',
        icon: 'fa-solid fa-book-open'
      },
      {
        name: 'Listen',
        icon: 'fa-solid fa-deaf'
      },
      {
        name: 'Locksmith',
        icon: 'fab fa-expeditedssl'
      },
      {
        name: 'Mechanical Repair',
        icon: 'fa-solid fa-tools'
      },
      {
        name: 'Medicine',
        icon: 'fa-solid fa-ambulance'
      },
      {
        name: 'Natural World',
        icon: 'fa-solid fa-hippo'
      },
      {
        name: 'Navigate',
        icon: 'fa-solid fa-route'
      },
      {
        name: 'Occult',
        icon: 'fa-solid fa-hat-wizard'
      },
      {
        name: 'Operate Heavy Machinery',
        icon: 'fa-solid fa-snowplow'
      },
      {
        name: 'Persuade',
        icon: 'fa-solid fa-comments'
      },
      {
        name: 'Pilot (Boat)',
        icon: 'fa-solid fa-ship'
      },
      {
        name: 'Psychoanalysis',
        icon: 'fa-solid fa-head-side-cough'
      },
      {
        name: 'Psychology',
        icon: 'fa-solid fa-head-side-virus'
      },
      {
        name: 'Read Lips',
        icon: 'fa-solid fa-blind'
      },
      {
        name: 'Ride',
        icon: 'fab fa-sticker-mule'
      },
      {
        name: 'Science (Chemistry)',
        icon: 'fa-solid fa-atom'
      },
      {
        name: 'Sleight of Hand',
        icon: 'fa-solid fa-hand-sparkles'
      },
      {
        name: 'Spot Hidden',
        icon: 'fa-solid fa-binoculars'
      },
      {
        name: 'Stealth',
        icon: 'fa-solid fa-user-ninja'
      },
      {
        name: 'Survival (Desert)',
        icon: 'fa-solid fa-wind'
      },
      {
        name: 'Swim',
        icon: 'fa-solid fa-swimmer'
      },
      {
        name: 'Fighting (Throw)',
        icon: 'fa-solid fa-football-ball'
      },
      {
        name: 'Track',
        icon: 'fa-solid fa-shoe-prints'
      }
    ]
  }
]

const parameters = [
  {
    name: 'Regular',
    code: '',
    difficulty: 0,
    poolModifier: 0
  },
  {
    name: 'Hard',
    code: 'Hard',
    difficulty: '+',
    poolModifier: 0
  },
  {
    name: 'Extreme',
    code: 'Extreme',
    difficulty: '++',
    poolModifier: 0
  },
  {
    name: 'Critical',
    code: 'Critical',
    difficulty: '+++',
    poolModifier: 0
  },
  {
    name: 'Blind',
    code: 'Blind',
    difficulty: '?',
    poolModifier: 0
  },
  {
    name: '1 Bonus',
    code: '1B',
    difficulty: 0,
    poolModifier: '+1'
  },
  {
    name: '2 Bonus',
    code: '2B',
    difficulty: 0,
    poolModifier: '+2'
  },
  {
    name: '1 Penalty',
    code: '1P',
    difficulty: 0,
    poolModifier: '-1'
  },
  {
    name: '2 Penalty',
    code: '2P',
    difficulty: 0,
    poolModifier: '-2'
  }
]

const foundryConfig = TemplateHelpers.loadFoundryConfig()

const folderId = foundryConfig.json.id

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
        html.push('<td><p style="text-align:center">@coc7.check[subtype:' + roll1.subtype + ',name:' + roll2.name + ',difficulty:' + parameter.difficulty + ',poolModifier:' + parameter.poolModifier + ',icon:' + roll2.icon + ']{ ' + roll2.name + (parameter.code !== '' ? ' (' + parameter.code + ')' : '') + '}</p></td>')
        html.push('</tr>')
      }
    }
  }

  const id = 'qaWAuaZa42JtdBhF'
  const pageId = 'izVAGIeSXPWURg7U'
  const dbFile = {
    ['!journal!' + id]: {
      name: 'Roll Requests',
      pages: [
        {
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
      ],
      _id: id,
      flags: {
        [folderId]: {
          cocidFlag: {
            id: 'je..roll-requests',
            lang: 'en',
            priority: 0
          }
        }
      }
    }
  }
  TemplateHelpers.createBinaryPack('roll-requests', dbFile)
  console.log('Generated: ./binary-packs/roll-requests')
} catch (e) {
  TemplateHelpers.showErrorAndExit(e)
}
