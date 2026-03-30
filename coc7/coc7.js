/* global Hooks */
import '../styles/system/index.less'
import './polyfill.js'
/* // FoundryVTT V10 */
// import * as DiceBot from './dicebot.js'
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
import GetHeaderControlsJournalEntrySheet from './hooks/get-header-controls-journal-entry-sheet.js'
import GetHeaderControlsMacroConfig from './hooks/get-header-controls-macro-config.js'
import GetHeaderControlsPlaylistConfig from './hooks/get-header-controls-playlist-config.js'
import GetHeaderControlsRollTableSheet from './hooks/get-header-controls-roll-table-sheet.js'
import GetHeaderControlsSceneConfig from './hooks/get-header-controls-scene-config.js'
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
import RenderCoC7DirectoryPicker from './hooks/render-coc7-directory-picker.js'
import RenderCoC7NPCSheet from './hooks/render-coc7-npc-sheet.js'
import RenderCombatTracker from './hooks/render-combat-tracker.js'
import RenderDialogV2 from './hooks/render-dialog-v2.js'
import RenderGamePause from './hooks/render-game-pause.js'
import RenderItemSheet from './hooks/render-item-sheet.js'
import RenderJournalEntryPageTextSheet from './hooks/render-journal-entry-page-text-sheet.js'
import RenderJournalEntrySheet from './hooks/render-journal-entry-sheet.js'
import RenderPlayers from './hooks/render-players.js'
import RenderRealRoll from './hooks/render-real-roll.js'
import RenderRegionConfig from './hooks/render-region-config.js'
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
/* // FoundryVTT V10 */
// DiceBot.listen()

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
Hooks.on('getHeaderControlsJournalEntrySheet', GetHeaderControlsJournalEntrySheet)
Hooks.on('getHeaderControlsMacroConfig', GetHeaderControlsMacroConfig)
Hooks.on('getHeaderControlsPlaylistConfig', GetHeaderControlsPlaylistConfig)
Hooks.on('getHeaderControlsRollTableSheet', GetHeaderControlsRollTableSheet)
Hooks.on('getHeaderControlsSceneConfig', GetHeaderControlsSceneConfig)
Hooks.on('getSceneControlButtons', GetSceneControlButtons)
Hooks.on('hotbarDrop', HotbarDrop)
Hooks.on('renderActorDirectory', RenderActorDirectory)
Hooks.on('renderActorSheet', RenderActorSheet)
Hooks.on('renderChatLog', RenderChatLog)
Hooks.on('renderChatMessage', RenderChatMessage)
Hooks.on('renderCoC7ChaseSheet', RenderCoC7ChaseSheet)
Hooks.on('renderCoC7CreatureSheet', RenderCoC7CreatureSheet)
Hooks.on('renderCoC7DirectoryPicker', RenderCoC7DirectoryPicker)
Hooks.on('renderCoC7NPCSheet', RenderCoC7NPCSheet)
Hooks.on('renderCombatTracker', RenderCombatTracker)
Hooks.on('renderDialogV2', RenderDialogV2)
Hooks.on('renderGamePause', RenderGamePause)
Hooks.on('renderItemSheet', RenderItemSheet)
Hooks.on('renderJournalEntryPageTextSheet', RenderJournalEntryPageTextSheet)
Hooks.on('renderJournalEntrySheet', RenderJournalEntrySheet)
Hooks.on('renderPlayers', RenderPlayers)
Hooks.on('renderRegionConfig', RenderRegionConfig)
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
