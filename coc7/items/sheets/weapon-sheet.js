/* global foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../../scripts/coc-id-button.js'
import { COC7 } from '../../config.js'
import { isCtrlKey } from '../../chat/helper.js'
import { CoC7Utilities } from '../../utilities.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7WeaponSheet extends foundry.appv1.sheets.ItemSheet {
  /**
   *
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'item'],
      width: 545,
      height: 480,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'skills'
        }
      ]
    })
  }

  /**
   *
   */
  get template () {
    const path = 'systems/CoC7/templates/items'
    return `${path}/weapon-sheet.html`
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
  async getData () {
    const sheetData = super.getData()

    sheetData.hasOwner = this.item.isEmbedded === true
    if (sheetData.hasOwner) {
      sheetData.weaponSkillGroups = this.actor.weaponSkillGroups(this.item.system.properties.rngd)
    }

    sheetData._properties = []
    for (const [key, value] of Object.entries(COC7.weaponProperties)) {
      sheetData._properties.push({
        id: key,
        name: value,
        isEnabled: this.item.system.properties[key] === true
      })
    }

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

    sheetData.usesAlternateSkill =
      this.item.system.properties.auto === true ||
      this.item.system.properties.brst === true ||
      this.item.system.properties.thrown === true

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionSpecial = await TextEditor.enrichHTML(
      sheetData.data.system.description.special,
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

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return
    html.find('.toggle-switch').click(this._onClickToggle.bind(this))
    html.find('.weapon-property').click(this._onPropertyClick.bind(this))
  }

  /**
   *
   * @param {*} event
   */
  async _onClickToggle (event) {
    event.preventDefault()
    const propertyId = event.currentTarget.closest('.toggle-switch').dataset.property
    await this.item.toggleProperty(
      propertyId,
      isCtrlKey(event)
    )
  }

  async _onPropertyClick (event) {
    event.preventDefault()
    const propertyId = event.currentTarget.closest('.weapon-property').dataset.property
    await this.item.toggleProperty(propertyId)
  }
}
