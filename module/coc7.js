/* global Hooks */
import '../styles/system/index.less'
import { CoC7NPCSheet } from './actors/sheets/npc-sheet.js'
import { CoC7CreatureSheet } from './actors/sheets/creature-sheet.js'
import { CoC7CharacterSheet } from './actors/sheets/character.js'
import { CoC7Chat } from './chat.js'
import { CoC7Combat } from './combat.js'
import { CoC7Utilities } from './utilities.js'
import { CoC7Menu } from './menu.js'
import { CoC7Canvas } from './apps/canvas.js'
import { CoC7Hooks } from './hooks/index.js'
import * as DiceBot from './dicebot.js'
import { CoC7ChaseSheet } from './items/chase/sheet.js'
import { CoC7Socket } from './hooks/socket.js'
import { DropActorSheetData } from './hooks/drop-actor-sheet-data.js'
import ChangeSidebarTab from './hooks/change-sidebar-tab.js'
import CreateActiveEffect from './hooks/create-active-effect.js'
import DeleteActiveEffect from './hooks/delete-active-effect.js'
import DrawNote from './hooks/draw-note.js'
import GetJournalSheetHeaderButtons from './hooks/get-journal-sheet-header-buttons.js'
import GetMacroConfigHeaderButtons from './hooks/get-macro-config-header-buttons.js'
import GetPlaylistConfigHeaderButtons from './hooks/get-playlist-config-header-buttons.js'
import GetRollTableConfigHeaderButtons from './hooks/get-roll-table-config-header-buttons.js'
import GetSceneConfigHeaderButtons from './hooks/get-scene-config-header-buttons.js'
import Init from './hooks/init.js'
import PopOutLoaded from './hooks/popout-loaded.js'
import Ready from './hooks/ready.js'
import RenderActorDirectory from './hooks/render-actor-directory.js'
import RenderCoC7JournalSheet from './hooks/render-coc7-journal-sheet.js'
import RenderCompendiumDirectory from './hooks/render-compendium-directory.js'
import RenderJournalTextPageSheet from './hooks/render-journal-text-page-sheet.js'
import RenderSettings from './hooks/render-settings.js'
import RenderSettingsConfig from './hooks/render-settings-config.js'
import Setup from './hooks/setup.js'

// Card init
import { initECC } from './common/chatcardlib/src/chatcardlib.js'
import { ChaseObstacleCard } from './chat/cards/chase-obstacle.js'

Hooks.once('init', Init)

initECC(ChaseObstacleCard)

Hooks.on('renderCombatTracker', (app, html, data) =>
  CoC7Combat.renderCombatTracker(app, html, data)
)

DiceBot.listen()
CoC7Hooks.listen()

Hooks.once('socketlib.ready', CoC7Socket)

Hooks.once('setup', Setup)

Hooks.on('getHeaderControlsJournalEntrySheet', GetJournalSheetHeaderButtons)
Hooks.on('getHeaderControlsMacroConfig', GetMacroConfigHeaderButtons)
Hooks.on('getHeaderControlsPlaylistConfig', GetPlaylistConfigHeaderButtons)
Hooks.on('getHeaderControlsRollTableSheet', GetRollTableConfigHeaderButtons)
Hooks.on('getHeaderControlsSceneConfig', GetSceneConfigHeaderButtons)

/* // FoundryVTT v12 */
Hooks.on('getJournalSheetHeaderButtons', GetJournalSheetHeaderButtons)
Hooks.on('getMacroConfigHeaderButtons', GetMacroConfigHeaderButtons)
Hooks.on('getPlaylistConfigHeaderButtons', GetPlaylistConfigHeaderButtons)
Hooks.on('getRollTableConfigHeaderButtons', GetRollTableConfigHeaderButtons)
Hooks.on('getSceneConfigHeaderButtons', GetSceneConfigHeaderButtons)

Hooks.on('createActiveEffect', CreateActiveEffect)

Hooks.on('deleteActiveEffect', DeleteActiveEffect)

// This will hide the item called '__CoC7InternalItem__'
// This item is used for internal purposes and should not be seen by anyone
Hooks.on('changeSidebarTab', ChangeSidebarTab)

Hooks.on('hotbarDrop', (bar, data, slot) => {
  return CoC7Utilities.createMacro(bar, data, slot)
})

Hooks.on('renderChatLog', (app, html, data) =>
  CoC7Chat.chatListeners(app, html, data)
)
Hooks.on('updateChatMessage', (chatMessage, chatData, diff, speaker) =>
  CoC7Chat.onUpdateChatMessage(chatMessage, chatData, diff, speaker)
)

Hooks.on('ready', Ready)

// Hooks.on('preCreateActor', (createData) => CoCActor.initToken( createData));

Hooks.on('renderCoC7ChaseSheet', (app, html, data) =>
  CoC7ChaseSheet.setScroll(app, html, data)
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

// Hooks.on('renderSceneControls', () => CoC7Utilities.updateCharSheets());
// Hooks.on('renderSceneNavigation', () => CoC7Utilities.updateCharSheets());
// Sheet css options
// Hooks.on('renderCoC7CharacterSheet', CoC7CharacterSheet.renderSheet);
Hooks.on('renderActorSheet', CoC7CharacterSheet.renderSheet)
Hooks.on('renderItemSheet', CoC7CharacterSheet.renderSheet)

Hooks.on('getSceneControlButtons', CoC7Menu.getButtons)
Hooks.on('renderSceneControls', CoC7Menu.renderControls)

Hooks.on('dropCanvasData', CoC7Canvas.onDropSomething)

Hooks.on('dropActorSheetData', DropActorSheetData)

Hooks.on('drawNote', DrawNote)
Hooks.on('renderActorDirectory', RenderActorDirectory)
Hooks.on('renderCoC7JournalSheet', RenderCoC7JournalSheet)
Hooks.on('renderCompendiumDirectory', RenderCompendiumDirectory)
Hooks.on('renderJournalTextPageSheet', RenderJournalTextPageSheet)
Hooks.on('renderSettings', RenderSettings)
Hooks.on('renderSettingsConfig', RenderSettingsConfig)
Hooks.on('PopOut:loaded', PopOutLoaded)
