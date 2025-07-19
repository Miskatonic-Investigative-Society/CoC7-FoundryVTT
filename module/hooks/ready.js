/* global $ CONFIG, foundry, game */
import { CoC7Check } from '../check.js'
import { CoC7ContextMenu } from '../context-menu.js'
import { CoC7SystemSocket } from '../apps/coc7-system-socket.js'
import { CoC7Tooltips } from '../apps/tooltips.js'
// import { CoC7WelcomeMessage } from '../apps/welcome-message.js'
import { registerTours } from '../scripts/register-tours.js'
import { Updater } from '../updater.js'

function activateGlobalListener () {
  const body = $('body')
  document.addEventListener('click', CoC7ContextMenu.closeAll)
  body.on('click', 'a.coc7-inline-check', CoC7Check._onClickInlineRoll)
  document.addEventListener('mousedown', _onLeftClick)
}

function _onLeftClick (event) {
  return event.shiftKey
}

export default async function () {
  console.log('Call of Cthulhu 7th Edition | Ready')
  if (game.settings.get('CoC7', 'showWelcomeMessage') && game.user.isGM) {
    /** This will prompt the welcome message when it is  finished */
    // await CoC7WelcomeMessage.create()
  }
  game.CoC7Tooltips = new CoC7Tooltips()

  const instructionsVersion = game.settings.get('CoC7', 'showInstructions')
  let lang = game.i18n.lang
  const readMe = {
    de: 'PIUXjbPhnfLtqw3I',
    en: 'sxB2OXbfwV6M0nyQ',
    es: '35FM7ZOdzC6L2xlj',
    fr: 'tdakyzTVOQsAMdSm',
    ja: '75sD0ovkj4TDpvzv',
    uk: '98TuflgZUmQoJdSK'
  }
  if (typeof readMe[lang] === 'undefined') {
    lang = 'en'
  }
  CONFIG.CoC7 = CONFIG.CoC7 ?? {}
  CONFIG.CoC7.Manual = readMe[lang]
  if (foundry.utils.isNewerVersion(game.system.version, instructionsVersion ?? '0')) {
    (await game.packs.get('CoC7.system-doc').getDocument(CONFIG.CoC7.Manual))?.sheet.render(true)
    game.settings.set('CoC7', 'showInstructions', game.system.version)
  }
  registerTours()

  // CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT
  await Updater.checkForUpdate()

  // game.CoC7.menus = new CoC7Menu();

  activateGlobalListener()

  // setGlobalCssVar()

  game.CoC7.skillList = await game.packs.get('CoC7.skills')?.getDocuments()

  game.socket.on('system.CoC7', async data => {
    CoC7SystemSocket.callSocket(data)
  })

  // "SETTINGS.BoutOfMadnessPhobiasIndex": "Phobias index",
  // "SETTINGS.BoutOfMadnessPhobiasIndexHint": "The index (roll result) that will trigger a roll in the phobias table",
  // "SETTINGS.BoutOfMadnessManiasIndex": "Manias index",
  // "SETTINGS.BoutOfMadnessManiasIndexHint": "The index (roll result) that will trigger a roll in the manias table",
  // "SETTINGS.SamplePhobiasTable": "Sample phobias table",
  // "SETTINGS.SampleManiasTable": "Sample Manias table",

  function _tableSettingsChanged (table, id) {
    if (id === 'none') game.CoC7.tables[table] = null
    else game.CoC7.tables[table] = game.tables.get(id)
  }

  // function _tableIndexChanged( table, index){
  //  game.CoC7.tables[table]=index;
  // }

  const tableChoice = { none: 'SETTINGS.LetKeeperDecide' }
  for (const t of game.tables) {
    tableChoice[t._id] = t.name
  }

  game.settings.register('CoC7', 'boutOfMadnessSummaryTable', {
    name: 'SETTINGS.BoutOfMadnessSummaryTable',
    scope: 'world',
    config: true,
    default: 'none',
    type: String,
    choices: tableChoice,
    onChange: id => _tableSettingsChanged('boutOfMadness_Summary', id)
  })

  game.settings.register('CoC7', 'boutOfMadnessRealTimeTable', {
    name: 'SETTINGS.BoutOfMadnessRealTimeTable',
    scope: 'world',
    config: true,
    default: 'none',
    type: String,
    choices: tableChoice,
    onChange: id => _tableSettingsChanged('boutOfMadness_RealTime', id)
  })

  // game.settings.register('CoC7', 'boutOfMadnessPhobiasIndex',{
  //  name: 'SETTINGS.BoutOfMadnessPhobiasIndex',
  //  hint: 'SETTINGS.BoutOfMadnessPhobiasIndexHint',
  //  scope: 'world',
  //  config: true,
  //  default: 9,
  //  type: Number,
  //  onChange:  id => _tableIndexChanged( 'phobiasIndex', id)
  // });

  // game.settings.register('CoC7', 'boutOfMadnessManiasIndex',{
  //  name: 'SETTINGS.BoutOfMadnessManiasIndex',
  //  hint: 'SETTINGS.BoutOfMadnessManiasIndexHint',
  //  scope: 'world',
  //  config: true,
  //  default: 10,
  //  type: Number,
  //  onChange:  id => _tableIndexChanged( 'maniasIndex', id)
  // });

  // game.settings.register('CoC7', 'samplePhobiasTable',{
  //  name: 'SETTINGS.SamplePhobiasTable',
  //  scope: 'world',
  //  config: true,
  //  default: 'none',
  //  type: String,
  //  choices: tableChoice,
  //  onChange:  id => _tableSettingsChanged( 'phobias', id)
  // });

  // game.settings.register('CoC7', 'sampleManiasTable',{
  //  name: 'SETTINGS.SampleManiasTable',
  //  scope: 'world',
  //  config: true,
  //  default: 'none',
  //  type: String,
  //  choices: tableChoice,
  //  onChange:  id => _tableSettingsChanged( 'manias', id)
  // });

  game.CoC7.tables = {
    boutOfMadness_Summary:
      game.settings.get('CoC7', 'boutOfMadnessSummaryTable') === 'none'
        ? null
        : game.tables.get(
          game.settings.get('CoC7', 'boutOfMadnessSummaryTable')
        ),
    boutOfMadness_RealTime:
      game.settings.get('CoC7', 'boutOfMadnessRealTimeTable') === 'none'
        ? null
        : game.tables.get(
          game.settings.get('CoC7', 'boutOfMadnessRealTimeTable')
        )
    // maniasIndex: ge.settings.get('CoC7', 'boutOfMadnessPhobiasIndex'),
    // phobiasIndex: game.settings.get('CoC7', 'boutOfMadnessManiasIndex'),
    // phobias: ('none' == game.settings.get('CoC7', 'samplePhobiasTable'))?null:game.tables.get(game.settings.get('CoC7', 'samplePhobiasTable')),
    // manias: ('none' == game.settings.get('CoC7', 'sampleManiasTable'))?null:game.tables.get(game.settings.get('CoC7', 'sampleManiasTable')),
  }
}
