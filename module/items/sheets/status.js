/* global game, ItemSheet, mergeObject, TextEditor */
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
          contentSelector: '.sheet-body',
          initial: 'description'
        }
      ]
    })
  }

  /* Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  getData () {
    const sheetData = super.getData()

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
      { async: false }
    )

    sheetData.enrichedDescriptionNotes = TextEditor.enrichHTML(
      sheetData.data.system.description.notes,
      { async: false }
    )

    sheetData.enrichedDescriptionKeeper = TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      { async: false }
    )

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }
}
