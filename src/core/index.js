/* global Hooks */
import '../../styles/system/index.less'
import './polyfill.js'
/* // FoundryVTT V10 */
// import * as DiceBot from './dicebot.js'
import { initECC } from '../shared/chatcardlib/src/chatcardlib.js'
import { ChaseObstacleCard } from '../features/chase/chat/chase-obstacle.js'

import ChangeSidebarTab from './hooks/change-sidebar-tab.js'
import ChatMessage from './hooks/chat-message.js'
import CloseActorSheet from './hooks/close-actor-sheet.js'
import CreateActiveEffect from './hooks/create-active-effect.js'
import CreateToken from './hooks/create-token.js'
import DeleteActiveEffect from './hooks/delete-active-effect.js'
import DiceSoNiceReady from './hooks/dice-so-nice-ready.js'
import DrawNote from './hooks/draw-note.js'
import DropActorSheetData from './hooks/drop-actor-sheet-data.js'
import DropCanvasData from './hooks/drop-canvas-data.js'
import GetHeaderControlsJournalEntrySheet from '../features/coc-id-system/hooks/get-header-controls-journal-entry-sheet.js'
import GetHeaderControlsMacroConfig from '../features/coc-id-system/hooks/get-header-controls-macro-config.js'
import GetHeaderControlsPlaylistConfig from '../features/coc-id-system/hooks/get-header-controls-playlist-config.js'
import GetHeaderControlsRollTableSheet from '../features/coc-id-system/hooks/get-header-controls-roll-table-sheet.js'
import GetHeaderControlsSceneConfig from '../features/coc-id-system/hooks/get-header-controls-scene-config.js'
import GetSceneControlButtons from './hooks/get-scene-control-buttons.js'
import HotbarDrop from './hooks/hotbar-drop.js'
import Init from './hooks/init.js'
import PopOutLoaded from './hooks/popout-loaded.js'
import Ready from './hooks/ready.js'
import RenderActorDirectory from '../features/investigator-wizard/hooks/render-actor-directory.js'
import RenderActorSheet from '../features/actor-character/hooks/render-actor-sheet.js'
import RenderChatLog from './hooks/render-chat-log.js'
import RenderChatMessage from './hooks/render-chat-message.js'
import RenderCoC7DirectoryPicker from './hooks/render-coc7-directory-picker.js'
import RenderCombatTracker from '../features/combat/hooks/render-combat-tracker.js'
import RenderDialog from './hooks/render-dialog.js'
import RenderGamePause from './hooks/render-game-pause.js'
import RenderItemSheet from '../features/actor-character/hooks/render-item-sheet.js'
import RenderJournalEntryPageTextSheet from './hooks/render-journal-entry-page-text-sheet.js'
import RenderJournalEntrySheet from './hooks/render-journal-entry-sheet.js'
import RenderJournalSheet from './hooks/render-journal-sheet.js'
import RenderJournalTextPageSheet from './hooks/render-journal-text-page-sheet.js'
import RenderPause from './hooks/render-pause.js'
import RenderPlayerList from './hooks/render-player-list.js'
import RenderPlayers from './hooks/render-players.js'
import RenderRealRoll from './hooks/render-real-roll.js'
import RenderSceneControls from './hooks/render-scene-controls.js'
import RenderSettings from './hooks/render-settings.js'
import RenderSettingsConfig from './hooks/render-settings-config.js'
import Setup from './hooks/setup.js'
import SocketlibReady from './hooks/socketlib-ready.js'
import UpdateChatMessage from './hooks/update-chat-message.js'

import CloseCoC7ChaseSheet from '../features/chase/hooks/close-coc7-chase-sheet.js'
import RenderCoC7ChaseSheet from '../features/chase/hooks/render-coc7-chase-sheet.js'
import RenderCoC7CreatureSheet from '../features/actor-creature/hooks/render-coc7-creature-sheet.js'
import RenderCoC7NPCSheet from '../features/actor-npc/hooks/render-coc7-npc-sheet.js'

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
Hooks.on('getJournalSheetHeaderButtons', GetHeaderControlsJournalEntrySheet) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsMacroConfig', GetHeaderControlsMacroConfig)
Hooks.on('getMacroConfigHeaderButtons', GetHeaderControlsMacroConfig) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsPlaylistConfig', GetHeaderControlsPlaylistConfig)
Hooks.on('getPlaylistConfigHeaderButtons', GetHeaderControlsPlaylistConfig) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsRollTableSheet', GetHeaderControlsRollTableSheet)
Hooks.on('getRollTableConfigHeaderButtons', GetHeaderControlsRollTableSheet) /* // FoundryVTT v12 */
Hooks.on('getHeaderControlsSceneConfig', GetHeaderControlsSceneConfig)
Hooks.on('getSceneConfigHeaderButtons', GetHeaderControlsSceneConfig) /* // FoundryVTT v12 */
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
Hooks.on('renderDialog', RenderDialog)
Hooks.on('renderGamePause', RenderGamePause)
Hooks.on('renderItemSheet', RenderItemSheet)
Hooks.on('renderJournalEntryPageTextSheet', RenderJournalEntryPageTextSheet)
Hooks.on('renderJournalEntrySheet', RenderJournalEntrySheet)
Hooks.on('renderJournalSheet', RenderJournalSheet) /* // FoundryVTT v12 */
Hooks.on('renderJournalTextPageSheet', RenderJournalTextPageSheet) /* // FoundryVTT v12 */
Hooks.on('renderPause', RenderPause) /* // FoundryVTT v12 */
Hooks.on('renderPlayerList', RenderPlayerList) /* // FoundryVTT v12 */
Hooks.on('renderPlayers', RenderPlayers)
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
