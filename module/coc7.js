/* global Hooks */
import '../styles/system/index.less'
import * as DiceBot from './dicebot.js'
import { initECC } from './common/chatcardlib/src/chatcardlib.js'
import { ChaseObstacleCard } from './chat/cards/chase-obstacle.js'

import ChangeSidebarTab from './hooks/change-sidebar-tab.js'
import ChatMessage from './hooks/chat-message.js'
import CloseActorSheet from './hooks/close-actor-sheet.js'
import CloseCoC7ChaseSheet from './hooks/close-coc7-chase-sheet.js'
import CreateActiveEffect from './hooks/create-active-effect.js'
import CreateToken from './hooks/create-token.js'
import DeleteActiveEffect from './hooks/delete-active-effect.js'
import DiceSoNiceReady from './hooks/dice-so-nice-ready.js'
import DrawNote from './hooks/draw-note.js'
import DropActorSheetData from './hooks/drop-actor-sheet-data.js'
import DropCanvasData from './hooks/drop-canvas-data.js'
import GetJournalSheetHeaderButtons from './hooks/get-journal-sheet-header-buttons.js'
import GetMacroConfigHeaderButtons from './hooks/get-macro-config-header-buttons.js'
import GetPlaylistConfigHeaderButtons from './hooks/get-playlist-config-header-buttons.js'
import GetRollTableConfigHeaderButtons from './hooks/get-roll-table-config-header-buttons.js'
import GetSceneConfigHeaderButtons from './hooks/get-scene-config-header-buttons.js'
import GetSceneControlButtons from './hooks/get-scene-control-buttons.js'
import HotbarDrop from './hooks/hotbar-drop.js'
import Init from './hooks/init.js'
import PopOutLoaded from './hooks/popout-loaded.js'
import Ready from './hooks/ready.js'
import RenderActorDirectory from './hooks/render-actor-directory.js'
import RenderActorSheet from './hooks/render-actor-sheet.js'
import RenderChatLog from './hooks/render-chat-log.js'
import RenderChatMessage from './hooks/render-chat-message.js'
import RenderCoC7ChaseSheet from './hooks/render-coc7-chase-sheet.js'
import RenderCoC7CreatureSheet from './hooks/render-coc7-creature-sheet.js'
import RenderCoC7JournalSheet from './hooks/render-coc7-journal-sheet.js'
import RenderCoC7NPCSheet from './hooks/render-coc7-npc-sheet.js'
import RenderCombatTracker from './hooks/render-combat-tracker.js'
import RenderCompendiumDirectory from './hooks/render-compendium-directory.js'
import RenderDialog from './hooks/render-dialog.js'
import RenderItemSheet from './hooks/render-item-sheet.js'
import RenderJournalTextPageSheet from './hooks/render-journal-text-page-sheet.js'
import RenderPause from './hooks/render-pause.js'
import RenderPlayerList from './hooks/render-player-list.js'
import RenderRealRoll from './hooks/render-real-roll.js'
import RenderSceneControls from './hooks/render-scene-controls.js'
import RenderSettings from './hooks/render-settings.js'
import RenderSettingsConfig from './hooks/render-settings-config.js'
import Setup from './hooks/setup.js'
import SocketlibReady from './hooks/socketlib-ready.js'
import UpdateChatMessage from './hooks/update-chat-message.js'

Hooks.once('init', Init)
Hooks.once('ready', Ready)
Hooks.once('setup', Setup)

initECC(ChaseObstacleCard)
DiceBot.listen()

Hooks.on('changeSidebarTab', ChangeSidebarTab)
Hooks.on('chatMessage', ChatMessage)
Hooks.on('closeActorSheet', CloseActorSheet)
Hooks.on('closeCoC7ChaseSheet', CloseCoC7ChaseSheet)
Hooks.on('createActiveEffect', CreateActiveEffect)
Hooks.on('createToken', CreateToken)
Hooks.on('deleteActiveEffect', DeleteActiveEffect)
Hooks.on('drawNote', DrawNote)
Hooks.on('dropActorSheetData', DropActorSheetData)
Hooks.on('dropCanvasData', DropCanvasData)
Hooks.on('getHeaderControlsJournalEntrySheet', GetJournalSheetHeaderButtons)
Hooks.on('getJournalSheetHeaderButtons', GetJournalSheetHeaderButtons) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsMacroConfig', GetMacroConfigHeaderButtons)
Hooks.on('getMacroConfigHeaderButtons', GetMacroConfigHeaderButtons) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsPlaylistConfig', GetPlaylistConfigHeaderButtons)
Hooks.on('getPlaylistConfigHeaderButtons', GetPlaylistConfigHeaderButtons) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsRollTableSheet', GetRollTableConfigHeaderButtons)
Hooks.on('getRollTableConfigHeaderButtons', GetRollTableConfigHeaderButtons) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsSceneConfig', GetSceneConfigHeaderButtons)
Hooks.on('getSceneConfigHeaderButtons', GetSceneConfigHeaderButtons) /* // FoundryVTT v12 */
Hooks.on('getSceneControlButtons', GetSceneControlButtons)
Hooks.on('hotbarDrop', HotbarDrop)
Hooks.on('renderActorDirectory', RenderActorDirectory)
Hooks.on('renderActorSheet', RenderActorSheet)
Hooks.on('renderChatLog', RenderChatLog)
Hooks.on('renderChatMessage', RenderChatMessage)
Hooks.on('renderCoC7ChaseSheet', RenderCoC7ChaseSheet)
Hooks.on('renderCoC7CreatureSheet', RenderCoC7CreatureSheet)
Hooks.on('renderCoC7JournalSheet', RenderCoC7JournalSheet)
Hooks.on('renderCoC7NPCSheet', RenderCoC7NPCSheet)
Hooks.on('renderCombatTracker', RenderCombatTracker)
Hooks.on('renderCompendiumDirectory', RenderCompendiumDirectory)
Hooks.on('renderDialog', RenderDialog)
Hooks.on('renderItemSheet', RenderItemSheet)
Hooks.on('renderJournalTextPageSheet', RenderJournalTextPageSheet)
Hooks.on('renderPause', RenderPause)
Hooks.on('renderPlayerList', RenderPlayerList)
Hooks.on('renderSceneControls', RenderSceneControls)
Hooks.on('renderSettings', RenderSettings)
Hooks.on('renderSettingsConfig', RenderSettingsConfig)
Hooks.on('updateChatMessage', UpdateChatMessage)

// Module: Dice So Nice
Hooks.once('diceSoNiceReady', DiceSoNiceReady)

// Module: PopOut
Hooks.on('PopOut:loaded', PopOutLoaded)

// Real Dice - Manual Rolling
/* // FoundryVTT v11 */
Hooks.on('renderRealRoll', RenderRealRoll)

// Module: socketlib
Hooks.once('socketlib.ready', SocketlibReady)
