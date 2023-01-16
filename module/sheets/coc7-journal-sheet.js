/* global JournalSheet */
import { addCoCIDSheetHeaderButton } from '../scripts/coc-id-button.js'

export class CoC7JournalSheet extends JournalSheet {
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }
}
