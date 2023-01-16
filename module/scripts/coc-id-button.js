/* global game */
import { CoCIDEditor } from '../apps/coc-id-editor.js'

export function addCoCIDSheetHeaderButton (headerButtons, sheet) {
  if (game.user.isGM) {
    const sheetCoCID = sheet.object.flags?.CoC7?.cocidFlag
    const noId = (typeof sheetCoCID === 'undefined' || typeof sheetCoCID.id === 'undefined' || sheetCoCID.id === '')
    const CoCIDEditorButton = {
      class: (noId ? 'edit-coc-id-warning' : 'edit-coc-id-exisiting'),
      label: 'CoC7.CoCIDFlag.id',
      icon: 'fas fa-fingerprint',
      onclick: () => {
        new CoCIDEditor(sheet.object, {}).render(true, { focus: true })
      }
    }
    const numberOfButtons = headerButtons.length
    headerButtons.splice(numberOfButtons - 1, 0, CoCIDEditorButton)
  }
}
