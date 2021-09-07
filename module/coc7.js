/* global $, Combat, CONFIG, CONST, fromUuid, game, Hooks, tinyMCE, ui */
import { CoC7NPCSheet } from './actors/sheets/npc-sheet.js'
import { CoC7CreatureSheet } from './actors/sheets/creature-sheet.js'
import { CoC7CharacterSheetV2 } from './actors/sheets/character.js'
import { CoC7Chat } from './chat.js'
import { CoC7Combat, rollInitiative } from './combat.js'
import { COC7 } from './config.js'
import { Updater } from './updater.js'
import { CoC7Utilities } from './utilities.js'
import { CoC7Parser } from './apps/parser.js'
import { CoC7Check } from './check.js'
import { CoC7Menu } from './menu.js'
import { OpposedCheckCard } from './chat/cards/opposed-roll.js'
import { CombinedCheckCard } from './chat/cards/combined-roll.js'
import { DamageCard } from './chat/cards/damage.js'
import { CoC7Canvas } from './apps/canvas.js'
import { CoC7CompendiumDirectory } from './compendium-directory.js'
import { CoC7Hooks } from './hooks/index.js'
import * as DiceBot from './dicebot.js'
import '../styles/system/index.less'

Hooks.on('renderSettingsConfig', (app, html, options) => {
  const systemTab = $(app.form).find('.tab[data-tab=system]')
  systemTab
    .find('input[name=CoC7\\.pulpRules]')
    .closest('div.form-group')
    .before(
      '<h2 class="setting-header">' +
        game.i18n.localize('SETTINGS.TitleRules') +
        '</h2>'
    )
  systemTab
    .find('select[name=CoC7\\.initiativeRule]')
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

Hooks.once('diceSoNiceReady', dice3d => {
  dice3d.addDicePreset(
    {
      type: 'dt',
      labels: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '00'],
      fontScale: 0.75,
      system: 'standard'
    },
    'dt'
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

Hooks.on('renderCombatTracker', (app, html, data) =>
  CoC7Combat.renderCombatTracker(app, html, data)
)

DiceBot.listen()
CoC7Hooks.listen()

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

  let effectIndex = CONFIG.statusEffects.findIndex(t => t.id === 'dead')
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].icon =
      'systems/CoC7/assets/icons/tombstone.svg'
  }
  effectIndex = CONFIG.statusEffects.findIndex(t => t.id === 'unconscious')
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].icon =
      'systems/CoC7/assets/icons/knocked-out-stars.svg'
  }
  CONFIG.statusEffects.unshift(
    {
      id: 'boutOfMadness',
      label: 'CoC7.BoutOfMadnessName',
      icon: 'systems/CoC7/assets/icons/hanging-spider.svg'
    },
    {
      id: 'insanity',
      label: 'CoC7.InsanityName',
      icon: 'systems/CoC7/assets/icons/tentacles-skull.svg'
    },
    {
      id: 'criticalWounds',
      label: 'criticalWounds',
      icon: 'systems/CoC7/assets/icons/arm-sling.svg'
    },
    {
      id: 'dying',
      label: 'dying',
      icon: 'systems/CoC7/assets/icons/heart-beats.svg'
    }
  )
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
  if (game.user.isGM) {
    CONFIG.TinyMCE.content_css.push('/systems/CoC7/assets/mce.css')
    CONFIG.TinyMCE.style_formats.push({
      title: 'CoC7',
      items: [
        {
          title: 'Keeper Only',
          block: 'section',
          classes: 'keeper-only',
          wrapper: true
        }
      ]
    })
  } else CONFIG.TinyMCE.content_style = '.keeper-only {display: none}'

  game.socket.on('system.CoC7', async data => {
    if (data.type === 'updateChar') CoC7Utilities.updateCharSheets()

    if (game.user.isGM) {
      if (OpposedCheckCard.defaultConfig.type === data.type) {
        OpposedCheckCard.dispatch(data)
      }

      if (CombinedCheckCard.defaultConfig.type === data.type) {
        CombinedCheckCard.dispatch(data)
      }

      if (data.type === 'invoke') {
        const item = await fromUuid(data.item)
        item[data.method](data.data)
      }
    }
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
  game.tables.forEach(t => {
    tableChoice[t.data._id] = t.data.name
  })

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
// Sheet V2 css options
// Hooks.on('renderCoC7CharacterSheetV2', CoC7CharacterSheetV2.renderSheet);
Hooks.on('renderActorSheet', CoC7CharacterSheetV2.renderSheet) // TODO : change from CoC7CharacterSheetV2
Hooks.on('renderItemSheet', CoC7CharacterSheetV2.renderSheet) // TODO : change from CoC7CharacterSheetV2

// Hooks.on('dropCanvasData', CoC7Parser.onDropSomething);
Hooks.on('renderSceneControls', CoC7Menu.renderMenu)

Hooks.on('dropCanvasData', CoC7Canvas.onDropSomething)

tinyMCE.PluginManager.add('CoC7_Editor_OnDrop', function (editor) {
  editor.on('drop', event => CoC7Parser.onEditorDrop(event, editor))
})

// tinyMCE.PluginManager.add('CoC7_Editor_OnInit', function (editor) {
//   editor.on('init', () => CoC7Parser.onInitEditor( editor))
// })

// CONFIG.TinyMCE.plugins = `CoC7_Editor_OnInit CoC7_Editor_OnDrop ${CONFIG.TinyMCE.plugins}`
CONFIG.TinyMCE.plugins = `CoC7_Editor_OnDrop ${CONFIG.TinyMCE.plugins}`

function activateGlobalListener () {
  const body = $('body')
  body.on('click', 'a.coc7-inline-check', CoC7Check._onClickInlineRoll)
  document.addEventListener('mousedown', _onLeftClick)
}

// function setGlobalCssVar(){
//   const body = $('body')
//   body.css('--keeper-display', game.user.isGM ? '' : 'none')
// }

function _onLeftClick (event) {
  return event.shiftKey
}

Hooks.on('targetToken', function (user, token, targeted) {
  if (targeted) {
    // Check if the targeted token is a player controlled token but no user controls it
    let gmonly = true
    if (
      token.actor.data.permission.default === CONST.ENTITY_PERMISSIONS.OWNER
    ) {
      gmonly = false
    } else {
      const gms = game.users.filter(a => a.isGM).map(a => a.id)
      for (const [k, v] of Object.entries(token.actor.data.permission)) {
        if (
          k !== 'default' &&
          v === CONST.ENTITY_PERMISSIONS.OWNER &&
          !gms.includes(k)
        ) {
          gmonly = false
        }
      }
    }
    if (!gmonly) {
      const controlled = game.users.filter(
        a => !a.isGM && a.data.character === token.actor.id
      )
      if (controlled.length === 0) {
        ui.notifications.error(
          game.i18n.format('CoC7.MessageSelectedTargetIsNotControlled', {
            name: token.name
          })
        )
      }
    }
  }
})

CONFIG.ui.compendium = CoC7CompendiumDirectory
