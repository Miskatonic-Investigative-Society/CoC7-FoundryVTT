import CoCIDEditor from '../apps/coc-id-editor.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  CoCIDEditor.addCoCIDSheetHeaderButton(application, element)
}
