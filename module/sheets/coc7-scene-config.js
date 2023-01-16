/* global SceneConfig */
import { addCoCIDSheetHeaderButton } from '../scripts/coc-id-button.js'

export class CoC7SceneConfig extends SceneConfig {
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }
}
