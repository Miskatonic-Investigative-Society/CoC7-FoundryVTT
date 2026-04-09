/* global Hooks */
import '../styles/coc7-index.less'
import './polyfill.js'
import CoC7ChatMessage from './hooks/chat-message.js'
import CoC7ClientSettingChanged from './hooks/client-setting-changed.js'
import CoC7CloseNoteConfig from './hooks/close-note-config.js'
import CoC7CreateActiveEffect from './hooks/create-active-effect.js'
import CoC7CreateItem from './hooks/create-item.js'
import CoC7CreateToken from './hooks/create-token.js'
import CoC7DeleteActiveEffect from './hooks/delete-active-effect.js'
import CoC7DeleteItem from './hooks/delete-item.js'
import CoC7DiceSoNiceReady from './hooks/dice-so-nice-ready.js'
import CoC7DrawNote from './hooks/draw-note.js'
import CoC7DropActorSheetData from './hooks/drop-actor-sheet-data.js'
import CoC7DropCanvasData from './hooks/drop-canvas-data.js'
import CoC7GetChatMessageContextOptions from './hooks/get-chat-message-context-options.js'
import CoC7GetProseMirrorMenuDropDowns from './hooks/get-prose-mirror-menu-drop-downs.js'
import CoC7GetSceneControlButtons from './hooks/get-scene-control-buttons.js'
import CoC7HotbarDrop from './hooks/hotbar-drop.js'
import CoC7Init from './hooks/init.js'
import CoC7PopOutLoaded from './hooks/pop-out-loaded.js'
import CoC7PreCreateChatMessage from './hooks/pre-create-chat-message.js'
import CoC7PreUpdateChatMessage from './hooks/pre-update-chat-message.js'
import CoC7PreUpdateItem from './hooks/pre-update-item.js'
import CoC7Ready from './hooks/ready.js'
import CoC7RenderActorDirectory from './hooks/render-actor-directory.js'
import CoC7RenderActorSheetV2 from './hooks/render-actor-sheet-v2.js'
import CoC7RenderChatMessageHTML from './hooks/render-chat-message-html.js'
import CoC7RenderCoC7ModelsActorCharacterSheetV2 from './hooks/render-coc7-models-actor-character-sheet-v2.js'
import CoC7RenderCombatTracker from './hooks/render-combat-tracker.js'
import CoC7RenderDialogV2 from './hooks/render-dialog-v2.js'
import CoC7RenderDocumentSheetConfig from './hooks/render-document-sheet-config.js'
import CoC7RenderGamePause from './hooks/render-game-pause.js'
import CoC7RenderItemSheetV2 from './hooks/render-item-sheet-v2.js'
import CoC7RenderJournalEntryPageTextSheet from './hooks/render-journal-entry-page-text-sheet.js'
import CoC7RenderJournalEntrySheet from './hooks/render-journal-entry-sheet.js'
import CoC7RenderMacroConfig from './hooks/render-macro-config.js'
import CoC7RenderNoteConfig from './hooks/render-note-config.js'
import CoC7RenderPlayers from './hooks/render-players.js'
import CoC7RenderPlaylistConfig from './hooks/render-playlist-config.js'
import CoC7RenderRegionConfig from './hooks/render-region-config.js'
import CoC7RenderRollTableSheet from './hooks/render-roll-table-sheet.js'
import CoC7RenderSceneConfig from './hooks/render-scene-config.js'
import CoC7RenderSceneControls from './hooks/render-scene-controls.js'
import CoC7RenderSettings from './hooks/render-settings.js'
import CoC7RenderSettingsConfig from './hooks/render-settings-config.js'
import CoC7Setup from './hooks/setup.js'
import CoC7UpdateItem from './hooks/update-item.js'

Hooks.once('init', CoC7Init)
Hooks.once('ready', CoC7Ready)
Hooks.once('setup', CoC7Setup)

Hooks.on('chatMessage', CoC7ChatMessage)
Hooks.on('clientSettingChanged', CoC7ClientSettingChanged)
Hooks.on('closeNoteConfig', CoC7CloseNoteConfig)
Hooks.on('createActiveEffect', CoC7CreateActiveEffect)
Hooks.on('createItem', CoC7CreateItem)
Hooks.on('createToken', CoC7CreateToken)
Hooks.on('deleteActiveEffect', CoC7DeleteActiveEffect)
Hooks.on('deleteItem', CoC7DeleteItem)
Hooks.on('drawNote', CoC7DrawNote)
Hooks.on('dropActorSheetData', CoC7DropActorSheetData)
Hooks.on('dropCanvasData', CoC7DropCanvasData)
Hooks.on('getChatMessageContextOptions', CoC7GetChatMessageContextOptions)
Hooks.on('getProseMirrorMenuDropDowns', CoC7GetProseMirrorMenuDropDowns)
Hooks.on('getSceneControlButtons', CoC7GetSceneControlButtons)
Hooks.on('hotbarDrop', CoC7HotbarDrop)
Hooks.on('preCreateChatMessage', CoC7PreCreateChatMessage)
Hooks.on('preUpdateChatMessage', CoC7PreUpdateChatMessage)
Hooks.on('preUpdateItem', CoC7PreUpdateItem)
Hooks.on('renderActorDirectory', CoC7RenderActorDirectory)
Hooks.on('renderActorSheetV2', CoC7RenderActorSheetV2)
Hooks.on('renderChatMessageHTML', CoC7RenderChatMessageHTML)
Hooks.on('renderCoC7ModelsActorCharacterSheetV2', CoC7RenderCoC7ModelsActorCharacterSheetV2)
Hooks.on('renderCombatTracker', CoC7RenderCombatTracker)
Hooks.on('renderDialogV2', CoC7RenderDialogV2)
Hooks.on('renderDocumentSheetConfig', CoC7RenderDocumentSheetConfig)
Hooks.on('renderGamePause', CoC7RenderGamePause)
Hooks.on('renderItemSheetV2', CoC7RenderItemSheetV2)
Hooks.on('renderJournalEntryPageTextSheet', CoC7RenderJournalEntryPageTextSheet)
Hooks.on('renderJournalEntrySheet', CoC7RenderJournalEntrySheet)
Hooks.on('renderMacroConfig', CoC7RenderMacroConfig)
Hooks.on('renderNoteConfig', CoC7RenderNoteConfig)
Hooks.on('renderPlayers', CoC7RenderPlayers)
Hooks.on('renderPlaylistConfig', CoC7RenderPlaylistConfig)
Hooks.on('renderRegionConfig', CoC7RenderRegionConfig)
Hooks.on('renderRollTableSheet', CoC7RenderRollTableSheet)
Hooks.on('renderSceneConfig', CoC7RenderSceneConfig)
Hooks.on('renderSceneControls', CoC7RenderSceneControls)
Hooks.on('renderSettings', CoC7RenderSettings)
Hooks.on('renderSettingsConfig', CoC7RenderSettingsConfig)
Hooks.on('updateItem', CoC7UpdateItem)

// Module: Dice So Nice
Hooks.once('diceSoNiceReady', CoC7DiceSoNiceReady)

// Module: PopOut
Hooks.on('PopOut:loaded', CoC7PopOutLoaded)
