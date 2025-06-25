/* global foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import CoC7ActiveEffect from '../../core/documents/active-effect.js'
import { COC7 } from '../../core/config.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import { isCtrlKey } from '../../shared/dice/helper.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7SkillSheet extends foundry.appv1.sheets.ItemSheet {
  constructor (...args) {
    super(...args)
    this._sheetTab = 'items'
  }

  /**
   * Extend and override the default options used by the Simple Item Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'item'],
      width: 520,
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

  /** @override */
  get template () {
    return `systems/CoC7/templates/items/${this.item.type}-sheet.html`
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
    // this.item.checkSkillProperties();
    const sheetData = super.getData()

    sheetData.hasOwner = this.item.isEmbedded === true
    sheetData.hadNonCharacterOwner = sheetData.hasOwner && this.actor?.type !== 'character'

    sheetData.effects = CoC7ActiveEffect.prepareActiveEffectCategories(
      this.item.effects
    )

    sheetData._properties = []
    for (const [key, value] of Object.entries(COC7.skillProperties)) {
      sheetData._properties.push({
        id: key,
        name: value,
        isEnabled: this.item.system.properties[key] === true
      })
    }

    sheetData._eras = []
    for (const [key, value] of Object.entries(COC7.eras)) {
      sheetData._eras.push({
        id: key,
        name: game.i18n.localize(value),
        isEnabled: (this.item.flags?.CoC7?.cocidFlag?.eras ?? {})[key] === true
      })
    }
    sheetData._eras.sort(CoC7Utilities.sortByNameKey)

    sheetData.isSpecialized = this.item.system.properties.special
    sheetData.canModifySpec =
      !this.item.system.properties.firearm &&
      !this.item.system.properties.fighting

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
  }

  /* -------------------------------------------- */

  async _onClickToggle (event) {
    event.preventDefault()
    const propertyId = event.currentTarget.closest('.toggle-switch').dataset.property
    await this.item.toggleProperty(
      propertyId,
      isCtrlKey(event)
    )
  }

  async _updateObject (event, formData) {
    const skillName = formData['system.skillName'] || this.item.system.skillName
    if (this.item.system.properties?.special) {
      const specialization = formData['system.specialization'] || this.item.system.specialization
      formData.name = specialization + ' (' + skillName + ')'
    } else {
      formData.name = skillName
    }
    return super._updateObject(event, formData)
  }
}
