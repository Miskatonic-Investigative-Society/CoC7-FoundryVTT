/* global $, Combat, CONFIG, CONST, game, Hooks, isNewerVersion, tinyMCE */
import { CoC7NPCSheet } from './actors/sheets/npc-sheet.js'
import { CoC7CreatureSheet } from './actors/sheets/creature-sheet.js'
import { CoC7CharacterSheet } from './actors/sheets/character.js'
import { CoC7Chat } from './chat.js'
import { CoC7Combat, rollInitiative } from './combat.js'
import { COC7 } from './config.js'
import { Updater } from './updater.js'
import { CoC7Utilities } from './utilities.js'
import { CoC7Parser } from './apps/parser.js'
import { CoC7Check } from './check.js'
import { CoC7Menu } from './menu.js'
import { DamageCard } from './chat/cards/damage.js'
import { CoC7Canvas } from './apps/canvas.js'
import { CoC7SettingsDirectory } from './settings-directory.js'
import { CoC7CompendiumDirectory } from './compendium-directory.js'
import { CoC7ActorDirectory } from './actor-directory.js'
import { CoC7Hooks } from './hooks/index.js'
import * as DiceBot from './dicebot.js'
import '../styles/system/index.less'
import { CoC7ChaseSheet } from './items/sheets/chase.js'
import { CoC7Socket } from './hooks/socket.js'
import { CoC7SystemSocket } from './apps/coc7-system-socket.js'
import { DropActorSheetData } from './hooks/drop-actor-sheet-data.js'
import { TestCard } from './chat/cards/test.js'
import { initECC } from './common/chatcardlib/src/chatcardlib.js'

if (CONST.COMPATIBILITY_MODES && !isNewerVersion(game.version, '10.262')) {
  // hide compatibility warnings while still in testing v10 and supporting v9
  CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT
}

Hooks.on('renderSettingsConfig', (app, html, options) => {
  const systemTab = $(app.form).find('.tab[data-tab=system]')
  systemTab
    .find('input[name=CoC7\\.displayInitDices]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleInitiative') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.stanbyGMRolls]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleRoll') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.displayActorOnCard]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleChatCards') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.enableStatusIcons]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleScene') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.overrideGameArtwork]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleGameArtwork') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.displayPlayerNameOnSheet]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleSheet') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.disregardUsePerRound]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleWeapon') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.syncDice3d]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleDiceSoNice') +
        '</h2>'
    )
  systemTab
    .find('input[name=CoC7\\.debugmode]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleDeveloperDebug') +
        '</h2>'
    )
  systemTab
    .find('select[name=CoC7\\.boutOfMadnessSummaryTable]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleRollTable') +
        '</h2>'
    )
})

Hooks.once('init', async function () {
  game.CoC7 = {
    macros: {
      skillCheck: CoC7Utilities.skillCheckMacro,
      weaponCheck: CoC7Utilities.weaponCheckMacro,
      check: CoC7Utilities.checkMacro
    },
    cards: {
      DamageCard: DamageCard
    }
  }
  Combat.prototype.rollInitiative = rollInitiative
})

initECC(TestCard) // TO BE REMOVED FOR PROD

Hooks.on('renderCombatTracker', (app, html, data) =>
  CoC7Combat.renderCombatTracker(app, html, data)
)

DiceBot.listen()
CoC7Hooks.listen()

Hooks.once('socketlib.ready', CoC7Socket)

Hooks.once('setup', function () {
  // Localize CONFIG objects once up-front
  const toLocalize = [
    'spellProperties',
    'bookType',
    'talentType',
    'occupationProperties',
    'statusType'
  ]

  for (const o of toLocalize) {
    const localized = Object.entries(COC7[o]).map(e => {
      return [e[0], game.i18n.localize(e[1])]
    })
    COC7[o] = localized.reduce((obj, e) => {
      obj[e[0]] = e[1]
      return obj
    }, {})
  }

  let effectIndex = CONFIG.statusEffects.findIndex(
    t => t.id === COC7.status.dead
  )
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].icon =
      'systems/CoC7/assets/icons/tombstone.svg'
  }
  effectIndex = CONFIG.statusEffects.findIndex(
    t => t.id === COC7.status.unconscious
  )
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].icon =
      'systems/CoC7/assets/icons/knocked-out-stars.svg'
  }
  CONFIG.statusEffects.unshift(
    {
      id: COC7.status.tempoInsane,
      label: 'CoC7.BoutOfMadnessName',
      icon: 'systems/CoC7/assets/icons/hanging-spider.svg'
    },
    {
      id: COC7.status.indefInsane,
      label: 'CoC7.InsanityName',
      icon: 'systems/CoC7/assets/icons/tentacles-skull.svg'
    },
    {
      id: COC7.status.criticalWounds,
      label: 'CoC7.CriticalWounds',
      icon: 'systems/CoC7/assets/icons/arm-sling.svg'
    },
    {
      id: COC7.status.dying,
      label: 'CoC7.Dying',
      icon: 'systems/CoC7/assets/icons/heart-beats.svg'
    }
  )
})

Hooks.on('createActiveEffect', (data, options, userId) => {
  if (
    game.userId === userId &&
    typeof data.data.flags.core !== 'undefined' &&
    typeof data.data.flags.core.statusId !== 'undefined'
  ) {
    switch (data.data.flags.core.statusId) {
      case COC7.status.indefInsane:
      case COC7.status.unconscious:
      case COC7.status.criticalWounds:
      case COC7.status.dying:
      case COC7.status.prone:
      case COC7.status.dead:
        data.parent.setCondition(data.data.flags.core.statusId, {
          forceValue: true
        })
        break
      case COC7.status.tempoInsane:
        {
          const realTime = data.data.flags.CoC7?.realTime
          let duration = null
          if (realTime === true) {
            duration = data.data.duration?.rounds
          } else if (realTime === false) {
            duration = data.data.duration?.seconds
            if (!isNaN(duration)) {
              duration = Math.floor(duration / 3600)
            }
          }
          data.parent.setCondition(COC7.status.tempoInsane, {
            forceValue: true,
            realTime: realTime,
            duration: duration
          })
        }
        break
    }
  }
})

Hooks.on('deleteActiveEffect', (data, options, userId) => {
  if (
    game.userId === userId &&
    typeof data.data.flags.core !== 'undefined' &&
    typeof data.data.flags.core.statusId !== 'undefined'
  ) {
    switch (data.data.flags.core.statusId) {
      case COC7.status.tempoInsane:
      case COC7.status.indefInsane:
      case COC7.status.unconscious:
      case COC7.status.criticalWounds:
      case COC7.status.dying:
      case COC7.status.prone:
      case COC7.status.dead:
        data.parent.unsetCondition(data.data.flags.core.statusId, {
          forceValue: true
        })
    }
  }
})

Hooks.on('hotbarDrop', async (bar, data, slot) =>
  CoC7Utilities.createMacro(bar, data, slot)
)

Hooks.on('renderChatLog', (app, html, data) =>
  CoC7Chat.chatListeners(app, html, data)
)
Hooks.on('renderChatMessage', (app, html, data) =>
  CoC7Chat.renderMessageHook(app, html, data)
)
Hooks.on('updateChatMessage', (chatMessage, chatData, diff, speaker) =>
  CoC7Chat.onUpdateChatMessage(chatMessage, chatData, diff, speaker)
)

Hooks.on('ready', async () => {
  await Updater.checkForUpdate()

  // game.CoC7.menus = new CoC7Menu();

  activateGlobalListener()

  // setGlobalCssVar()

  configureTinyMCE()

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
    tableChoice[t.data._id] = t.data.name
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
})

// Hooks.on('preCreateActor', (createData) => CoCActor.initToken( createData));

Hooks.on(
  'renderCoC7ChaseSheet',
  /** async */ (app, html, data) =>
    /** await */ CoC7ChaseSheet.setScroll(app, html, data)
)

Hooks.on('closeCoC7ChaseSheet', (app, html) =>
  CoC7ChaseSheet.onClose(app, html)
)

// Called on closing a character sheet to lock it on getting it to display values
Hooks.on('closeActorSheet', characterSheet => characterSheet.onCloseSheet())
Hooks.on('renderCoC7CreatureSheet', (app, html, data) =>
  CoC7CreatureSheet.forceAuto(app, html, data)
)
Hooks.on('renderCoC7NPCSheet', (app, html, data) =>
  CoC7NPCSheet.forceAuto(app, html, data)
)
// Hooks.on('updateActor', (actor, dataUpdate) => CoCActor.updateActor( actor, dataUpdate));
// Hooks.on('updateToken', (scene, token, dataUpdate) => CoCActor.updateToken( scene, token, dataUpdate));

Hooks.on('chatMessage', CoC7Utilities.ParseChatEntry)
// Hooks.on('preCreateToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
// Hooks.on('createToken', ( scene, actor, options, id) => CoCActor.preCreateToken( scene, actor, options, id))
// Hooks.on("renderChatLog", (app, html, data) => CoC7Item.chatListeners(html));

Hooks.on('getSceneControlButtons', (/* controls */) => {
  // if( game.user.isGM){
  //  let group = controls.find(b => b.name == 'token');
  //  group.tools.push({
  //    toggle: true,
  //    icon : 'fas fa-angle-double-up',
  //    name: 'devphase',
  //    active: game.settings.get('CoC7', 'developmentEnabled'),
  //    title: game.settings.get('CoC7', 'developmentEnabled')? game.i18n.localize( 'CoC7.DevPhaseEnabled'): game.i18n.localize( 'CoC7.DevPhaseDisabled'),
  //    onClick :async () => await CoC7Utilities.toggleDevPhase()
  //  });
  //  group.tools.push({
  //    toggle: true,
  //    icon : 'fas fas fa-user-edit',
  //    name: 'charcreate',
  //    active: game.settings.get('CoC7', 'charCreationEnabled'),
  //    title: game.settings.get('CoC7', 'charCreationEnabled')? game.i18n.localize( 'CoC7.CharCreationEnabled'): game.i18n.localize( 'CoC7.CharCreationDisabled'),
  //    onClick :async () => await CoC7Utilities.toggleCharCreation()
  //  });
  // }
})

// Hooks.on('renderSceneControls', () => CoC7Utilities.updateCharSheets());
// Hooks.on('renderSceneNavigation', () => CoC7Utilities.updateCharSheets());
Hooks.on('renderItemSheet', CoC7Parser.ParseSheetContent)
Hooks.on('renderJournalSheet', CoC7Parser.ParseSheetContent)
Hooks.on('renderActorSheet', CoC7Parser.ParseSheetContent)
// Chat command processing
// Hooks.on('preCreateChatMessage', CoC7Parser.ParseMessage);
// Hooks.on('createChatMessage', CoC7Chat.createChatMessageHook);
Hooks.on('renderChatMessage', (app, html, data) => {
  CoC7Chat.renderChatMessageHook(app, html, data)
  CoC7Parser.ParseMessage(app, html, data)
})
// Sheet css options
// Hooks.on('renderCoC7CharacterSheet', CoC7CharacterSheet.renderSheet);
Hooks.on('renderActorSheet', CoC7CharacterSheet.renderSheet)
Hooks.on('renderItemSheet', CoC7CharacterSheet.renderSheet)

// Hooks.on('dropCanvasData', CoC7Parser.onDropSomething);
Hooks.on('getSceneControlButtons', CoC7Menu.getButtons)
Hooks.on('renderSceneControls', CoC7Menu.renderControls)

Hooks.on('dropCanvasData', CoC7Canvas.onDropSomething)

Hooks.on('dropActorSheetData', DropActorSheetData)

function activateGlobalListener () {
  const body = $('body')
  body.on('click', 'a.coc7-inline-check', CoC7Check._onClickInlineRoll)
  document.addEventListener('mousedown', _onLeftClick)
}

/**
 * Configuration of TinyMCE editor
 */
function configureTinyMCE () {
  // Add on drop event to tinyMCE to hendle the links drop
  tinyMCE.PluginManager.add('CoC7_Editor_OnDrop', function (editor) {
    editor.on('drop', event => CoC7Parser.onEditorDrop(event, editor))
  })

  // Add custom plugins to list of plugins.
  // CONFIG.TinyMCE.plugins = `CoC7_Editor_OnInit CoC7_Editor_OnDrop ${CONFIG.TinyMCE.plugins}`
  CONFIG.TinyMCE.plugins = `CoC7_Editor_OnDrop ${CONFIG.TinyMCE.plugins}`
  //
  //  if (game.user.isGM) {
  //    // Define css and menu for keeper only blocks
  //    CONFIG.TinyMCE.content_css.push('/systems/CoC7/assets/mce.css')
  //    CONFIG.TinyMCE.style_formats.push({
  //      title: 'CoC7',
  //      items: [
  //        {
  //          title: 'Keeper Only',
  //          block: 'section',
  //          classes: 'keeper-only',
  //          wrapper: true
  //        }
  //      ]
  //    })
  //  } else {
  //    // Prevent player to edit and view source code if settings is disabled
  //    if (!game.settings.get('CoC7', 'enablePlayerSourceCode'))
  //      CONFIG.TinyMCE.toolbar = CONFIG.TinyMCE.toolbar.replace(' code', '')
  //    // Hide keeper only blocks to players
  //    CONFIG.TinyMCE.content_style = '.keeper-only {display: none}'
  //  }
}

function _onLeftClick (event) {
  return event.shiftKey
}

CONFIG.ui.settings = CoC7SettingsDirectory
CONFIG.ui.compendium = CoC7CompendiumDirectory
CONFIG.ui.actors = CoC7ActorDirectory
