/* global RollTableConfig */
import { addCoCIDSheetHeaderButton } from '../scripts/coc-id-button.js'

export class CoC7RollTableConfig extends RollTableConfig {
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }
}
