/* global game Hooks */
import GetHeaderControlsJournalEntrySheet from './hooks/get-header-controls-journal-entry-sheet.js'
import GetHeaderControlsMacroConfig from './hooks/get-header-controls-macro-config.js'
import GetHeaderControlsPlaylistConfig from './hooks/get-header-controls-playlist-config.js'
import GetHeaderControlsRollTableSheet from './hooks/get-header-controls-roll-table-sheet.js'
import GetHeaderControlsSceneConfig from './hooks/get-header-controls-scene-config.js'
import RenderDialog from './hooks/render-dialog.js'
import RenderJournalSheet from './hooks/render-journal-sheet.js'
import RenderJournalTextPageSheet from './hooks/render-journal-text-page-sheet.js'
import RenderPause from './hooks/render-pause.js'
import RenderPlayerList from './hooks/render-player-list.js'

export default class deprecated {
  /**
   * Trigger v12 init
   */
  static init () {
    if (game.release.generation === 12) {
      Hooks.on('getJournalSheetHeaderButtons', GetHeaderControlsJournalEntrySheet)
      Hooks.on('getMacroConfigHeaderButtons', GetHeaderControlsMacroConfig)
      Hooks.on('getPlaylistConfigHeaderButtons', GetHeaderControlsPlaylistConfig)
      Hooks.on('getRollTableConfigHeaderButtons', GetHeaderControlsRollTableSheet)
      Hooks.on('getSceneConfigHeaderButtons', GetHeaderControlsSceneConfig)
      Hooks.on('renderDialog', RenderDialog)
      Hooks.on('renderJournalSheet', RenderJournalSheet)
      Hooks.on('renderJournalTextPageSheet', RenderJournalTextPageSheet)
      Hooks.on('renderPause', RenderPause)
      Hooks.on('renderPlayerList', RenderPlayerList)
    }
  }
}
