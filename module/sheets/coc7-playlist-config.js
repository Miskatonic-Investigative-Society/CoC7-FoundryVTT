/* global PlaylistConfig */
import { addCoCIDSheetHeaderButton } from '../scripts/coc-id-button.js'

export class CoC7PlaylistConfig extends PlaylistConfig {
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }
}
