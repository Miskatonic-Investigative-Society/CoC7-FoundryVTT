/* global game, ItemSheet, mergeObject, TextEditor */
/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7ItemSheetV2 extends ItemSheet {
  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheetV2', 'item'],
      template: 'systems/CoC7/templates/items/item-sheetV2.html',
      width: 290,
      height: 326,
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

  /**
   * Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  getData (options = {}) {
    const sheetData = super.getData(options)

    sheetData.enrichedDescriptionValue = TextEditor.enrichHTML(
      sheetData.data.system.description.value,
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
