/* global foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { COC7 } from '../../core/config.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import CoC7ActiveEffect from '../../core/documents/active-effect.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7ItemSheetV2 extends foundry.appv1.sheets.ItemSheet {
  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'item'],
      template: 'systems/CoC7/templates/items/item-sheetV2.html',
      width: 500,
      height: 450,
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

  /**
   * Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  async getData (options = {}) {
    const sheetData = super.getData(options)

    sheetData.effects = CoC7ActiveEffect.prepareActiveEffectCategories(this.item.effects, { status: false })

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

    sheetData._eras = []
    for (const [key, value] of Object.entries(COC7.eras)) {
      sheetData._eras.push({
        price: this.item.system.price[key] ?? 0,
        id: key,
        name: game.i18n.localize(value),
        isEnabled: (this.item.flags?.CoC7?.cocidFlag?.eras ?? {})[key] === true
      })
    }
    sheetData._eras.sort(CoC7Utilities.sortByNameKey)

    sheetData.isKeeper = game.user.isGM

    sheetData.worldEra = game.settings.get('CoC7', 'worldEra')

    return sheetData
  }

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    html.find('.toggle-switch').click(this._onClickToggle.bind(this))

    html
      .find('.effect-control')
      .click(ev => CoC7ActiveEffect.onManageActiveEffect(ev, this.item))
  }

  async _onClickToggle (event) {
    event.preventDefault()
    const propertyId = event.currentTarget.closest('.toggle-switch').dataset.property
    await this.item.toggleProperty(
      propertyId,
      false
    )
  }
}
