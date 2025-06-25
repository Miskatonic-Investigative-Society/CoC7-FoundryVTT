/* global foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { COC7 } from '../../core/config.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7TalentSheet extends foundry.appv1.sheets.ItemSheet {
  /**
   *
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'talent'],
      template: 'systems/CoC7/templates/items/talent.html',
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

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  /* Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData () {
    const sheetData = super.getData()

    sheetData.itemProperties = []

    for (const [key, value] of Object.entries(this.item.system.type)) {
      if (value) {
        sheetData.itemProperties.push(
          COC7.talentType[key] ? COC7.talentType[key] : null
        )
      }
    }

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionNotes = await TextEditor.enrichHTML(
      sheetData.data.system.description.notes,
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

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }
}
