/* global MacroConfig */
import { addCoCIDSheetHeaderButton } from '../scripts/coc-id-button.js'

export class CoC7MacroConfig extends MacroConfig {
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }
}
