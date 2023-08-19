/* global game, ItemSheet, mergeObject, TextEditor */
import { addCoCIDSheetHeaderButton } from '../../scripts/coc-id-button.js'
import CoC7ActiveEffect from '../../active-effect.js'
import { COC7 } from '../../config.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7StatusSheet extends ItemSheet {
  /**
   *
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'status'],
      template: 'systems/CoC7/templates/items/status.html',
      width: 525,
      height: 480,
      scrollY: ['.tab.description'],
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.body',
          initial: 'description'
        }
      ]
    })
  }

  activateListeners (html) {
    super.activateListeners(html)

    html
      .find('.effect-control')
      .click(ev => CoC7ActiveEffect.onManageActiveEffect(ev, this.item))
  }

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  /* Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  getData () {
    const sheetData = super.getData()
    sheetData.effects = CoC7ActiveEffect.prepareActiveEffectCategories(this.item.effects, { status: false })

    sheetData.itemProperties = []

    for (const [key, value] of Object.entries(this.item.system.type)) {
      if (value) {
        sheetData.itemProperties.push(
          COC7.statusType[key] ? COC7.statusType[key] : null
        )
      }
    }

    sheetData.enrichedDescriptionValue = TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: false,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionNotes = TextEditor.enrichHTML(
      sheetData.data.system.description.notes,
      {
        async: false,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionKeeper = TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: false,
        secrets: sheetData.editable
      }
    )

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }
}
