/* global game, ItemSheet, mergeObject */
import { COC7 } from '../../config.js'
import { isCtrlKey } from '../../chat/helper.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7WeaponSheet extends ItemSheet {
  /**
   *
   */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
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

  /**
   * Prepare data for rendering the Item sheet
   * The prepared data object contains both the actor data as well as additional sheet options
   */
  getData () {
    const item = super.getData()

    item.combatSkill = []

    item.hasOwner = this.item.isEmbedded === true
    if (item.hasOwner) {
      item.firearmSkills = this.actor.firearmSkills
      item.fightingSkills = this.actor.fightingSkills
      item.combatSkill = this.item.actor.items.filter(item => {
        if (item.type === 'skill') {
          if (item.system.properties.combat) {
            return true
          }
        }
        return false
      })

      item.combatSkill.sort((a, b) => {
        return a.name
          .toLocaleLowerCase()
          .localeCompare(b.name.toLocaleLowerCase())
      })
    }

    item._properties = []
    for (const [key, value] of Object.entries(COC7.weaponProperties)) {
      const property = {
        id: key,
        name: value,
        isEnabled: this.item.system.properties[key] === true
      }
      item._properties.push(property)
    }

    item._eras = []
    for (const [key, value] of Object.entries(COC7.eras)) {
      item._eras.push({
        price: this.item.system.price[key] ?? 0,
        id: key,
        name: value,
        isEnabled: this.item.system.eras[key] === true
      })
    }

    item.usesAlternateSkill =
      this.item.system.properties.auto === true ||
      this.item.system.properties.brst === true ||
      this.item.system.properties.thrown === true

    item.isKeeper = game.user.isGM
    return item
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
