/* global foundry game */
import CoCIDEditor from '../apps/coc-id-editor.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  /* // FoundryVTT V12 */
  if (!foundry.utils.isNewerVersion(game.version, 13)) {
    return
  }
  CoCIDEditor.addCoCIDSheetHeaderButton(application, element)
}
