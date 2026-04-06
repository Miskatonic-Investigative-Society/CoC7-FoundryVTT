import CoCIDEditor from '../apps/coc-id-editor.js'

/**
 * Get config header buttons hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {ApplicationHeaderButton} buttons
 */
export default function (application, buttons) {
  CoCIDEditor.addCoCIDSheetHeaderButtonV12(application, buttons)
}
