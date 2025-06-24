/* global game */
import { CoCIDEditor } from '../../features/coc-id-system/apps/coc-id-editor.js'

export function addCoCIDSheetHeaderButton (headerButtons, sheet) {
  if (game.user.isGM) {
    if (typeof sheet.options.actions !== 'undefined') {
      sheet.options.actions.cocid = () => {
        new CoCIDEditor(sheet.document, {}).render(true, { focus: true })
      }
    }
    const sheetCoCID = sheet.document.flags?.CoC7?.cocidFlag
    const noId = (typeof sheetCoCID === 'undefined' || typeof sheetCoCID.id === 'undefined' || sheetCoCID.id === '')
    const CoCIDEditorButton = {
      class: (noId ? 'edit-coc-id-warning' : 'edit-coc-id-exisiting'),
      label: 'CoC7.CoCIDFlag.id',
      icon: 'fas fa-fingerprint',
      action: 'cocid',
      onclick: () => {
        new CoCIDEditor(sheet.document, {}).render(true, { focus: true })
      }
    }
    const numberOfButtons = headerButtons.length
    headerButtons.splice(numberOfButtons - 1, 0, CoCIDEditorButton)
  }
}
