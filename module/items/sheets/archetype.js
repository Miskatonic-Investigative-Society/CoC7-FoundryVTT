/* global $, duplicate, expandObject, game, ItemSheet, mergeObject */

// import  { COC7 } from '../../config.js';
// import { CoCActor } from '../../actors/actor.js';

import { CoC7Item } from '../item.js'
import { CoC7Utilities } from '../../utilities.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7ArchetypeSheet extends ItemSheet {
  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    html
      .find('.item .item-name h4')
      .click(event => this._onItemSummary(event, 'skills'))
    html
      .find('.item-delete')
      .click(event => this._onItemDelete(event, 'skills'))
  }

  async _onDrop (event, type = 'skill', collectionName = 'skills') {
    event.preventDefault()
    event.stopPropagation()

    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')

    const collection = this.item.data.data[collectionName]
      ? duplicate(this.item.data.data[collectionName])
      : []
    for (const item of dataList) {
      if (!item || !item.data) continue
      if (![type].includes(item.data.type)) {
        continue
      }
      if (!CoC7Item.isAnySpec(item)) {
        if (collection.find(el => el.name === item.data.name)) {
          continue
        }
      }

      collection.push(duplicate(item.data))
    }
    await this.item.update({ [`data.${collectionName}`]: collection })
  }

  _onItemSummary (event, collectionName = 'items') {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.item.data.data[collectionName].find(s => {
      return s._id === li.data('item-id')
    })
    const chatData = item.data.description

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary')
      summary.slideUp(200, () => summary.remove())
    } else {
      const div = $(`<div class="item-summary">${chatData.value}</div>`)
      const props = $('<div class="item-properties"></div>')
      // chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
      div.append(props)
      li.append(div.hide())
      div.slideDown(200)
    }
    li.toggleClass('expanded')
  }

  async _onItemDelete (event, collectionName = 'items') {
    const itemIndex = $(event.currentTarget)
      .parents('.item')
      .data('item-id')
    if (itemIndex) await this.removeItem(itemIndex, collectionName)
  }

  async removeItem (itemId, collectionName = 'items') {
    const itemIndex = this.item.data.data[collectionName].findIndex(s => {
      return s._id === itemId
    })
    if (itemIndex > -1) {
      const collection = this.item.data.data[collectionName]
        ? duplicate(this.item.data.data[collectionName])
        : []
      collection.splice(itemIndex, 1)
      await this.item.update({ [`data.${collectionName}`]: collection })
    }
  }

  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'occupation'],
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

  get template () {
    return 'systems/CoC7/templates/items/archetype.html'
  }

  _onDragStart (event) {
    const li = event.currentTarget.closest('.item')
    const skill = this.item.data.data.skills.find(s => {
      return s._id === li.dataset.itemId
    })

    const dragData = { type: 'Item', data: skill }
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
  }

  getData () {
    const data = super.getData()

    /** MODIF: 0.8.x **/
    const itemData = data.data
    data.data = itemData.data // MODIF: 0.8.x data.data
    /*****************/

    data.isOwned = this.item.isOwned

    const coreCharacteristics = []
    for (const [key, selected] of Object.entries(
      data.data.coreCharacteristics
    )) {
      if (selected) {
        const characName = game.i18n.localize(`CHARAC.${key.toUpperCase()}`)
        coreCharacteristics.push(characName)
      }
    }

    data.skillListEmpty = data.data.skills.length === 0
    data.data.skills.forEach(skill => {
      // For each skill if it's a spec and spac name not included in the name add it
      if (
        skill.data.specialization &&
        !skill.name.includes(skill.data.specialization)
      ) {
        skill.displayName = `${skill.data.specialization} (${skill.name})`
      } else skill.displayName = skill.name
    })

    data.data.skills.sort((a, b) => {
      return a.displayName.localeCompare(b.displayName)
    })

    data.coreCharacteristicsString = ''
    const orString = ` ${game.i18n.localize('CoC7.Or')} `
    if (coreCharacteristics.length) {
      data.coreCharacteristicsString += coreCharacteristics.join(orString)
    }

    data.itemProperties = []

    data.itemProperties.push(
      `${game.i18n.localize('CoC7.PulpTalents')}: ${data.data.bonusPoints}`
    )
    data.itemProperties.push(
      `${game.i18n.localize('CoC7.BonusPoints')}: ${data.data.talents}`
    )

    // for (let [key, value] of Object.entries(data.data.type)) {
    //   if( value) data.itemProperties.push( COC7.occupationProperties[key]?COC7.occupationProperties[key]:null);
    // }

    data.isKeeper = game.user.isGM
    return data
  }

  _updateObject (event, formData) {
    // TODO: This can be removed once 0.7.x is release channel
    if (!formData.data) formData = expandObject(formData)

    if (formData.data.groups) {
      formData.data.groups = Object.values(formData.data?.groups || {})
      for (let index = 0; index < this.item.data.data.groups.length; index++) {
        formData.data.groups[index].skills = duplicate(
          this.item.data.data.groups[index].skills
        )
      }
    }

    super._updateObject(event, formData)
  }
}
