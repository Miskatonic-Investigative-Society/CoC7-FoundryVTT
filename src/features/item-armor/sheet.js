/* global foundry game TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import CoC7ActiveEffect from '../../core/documents/active-effect.js'

export class CoC7ArmorSheet extends foundry.appv1.sheets.ItemSheet {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'armor'],
      template: 'systems/CoC7/templates/items/armor.hbs',
      width: 520,
      height: 480,
      dragDrop: [{ dragSelector: '.item' }],
      scrollY: ['.tab.description'],
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'description'
        }
      ]
    })
  }

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  async getData () {
    const sheetData = super.getData()

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionKeeper = await TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.effects = CoC7ActiveEffect.prepareActiveEffectCategories(
      this.item.effects
    )

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    html
      .find('.effect-control')
      .click(ev => CoC7ActiveEffect.onManageActiveEffect(ev, this.item))
  }
}
