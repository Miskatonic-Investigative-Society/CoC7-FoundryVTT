/* global $, duplicate, expandObject, game, ItemSheet, mergeObject */

import { COC7 } from '../../config.js'
import { CoC7Item } from '../item.js'
import { CoC7Utilities } from '../../utilities.js'
import { isCtrlKey } from '../../chat/helper.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7SetupSheet extends ItemSheet {
  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)

    if (!this.options.editable) return

    html.find('.item .item-name h4').click(event => this._onItemSummary(event, 'items'))
    html.find('.item-delete').click(event => this._onItemDelete(event, 'items'))
    html.find('.add-bio').click(async () => await this._onAddBio())
    html.find('.remove-section').click(this._onRemoveSection.bind(this))
    html.find('.toggle-switch').click(this._onClickToggle.bind(this))

    // html.find('.item-edit').click(async ev => {
    //   const li = $(ev.currentTarget).parents('.item');
    //   const itemData = this.getItem(li.data('itemId'), 'skills');
    //   delete itemData._id;
    //   delete itemData.folder;
    //   const item = new CoC7Item(itemData);
    //   await item.sheet.render(true); //marche pas !!
    // });
  }

  async _onClickToggle (event) {
    event.preventDefault()
    const propertyId = event.currentTarget.dataset.property
    await this.item.toggleProperty(
      propertyId,
      isCtrlKey(event)
    )
  }

  async _onDrop (event, collectionName = 'items') {
    event.preventDefault()
    event.stopPropagation()

    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')

    const collection = this.item.system[collectionName] ? duplicate(this.item.system[collectionName]) : []
    for (const item of dataList) {
      if (!item || !item.system) continue
      if (!['item', 'weapon', 'skill', 'book', 'spell'].includes(item.type)) {
        continue
      }

      if (!CoC7Item.isAnySpec(item)) {
        if (collection.find(el => el.name === item.name)) {
          continue
        }
      }

      collection.push(duplicate(item))
    }
    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  async _onRemoveSection (event) {
    const a = event.currentTarget
    const div = a.closest('.item')
    const bio = duplicate(this.item.system.bioSections)
    bio.splice(Number(div.dataset.index), 1)
    await this.item.update({ 'system.bioSections': bio })
  }

  async _onAddBio () {
    const bio = this.item.system.bioSections ? duplicate(this.item.system.bioSections) : []
    bio.push(null)
    await this.item.update({ 'system.bioSections': bio })
  }

  _onItemSummary (event, collectionName = 'items') {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.item.system[collectionName].find(s => {
      return s._id === li.data('item-id')
    })
    const chatData = item.system.description

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary')
      summary.slideUp(200, () => summary.remove())
    } else {
      const div = $(`<div class="item-summary">${chatData.value}</div>`)
      const props = $('<div class="item-properties"></div>')
      // for (const p of chatData.properties) { props.append(`<span class="tag">${p}</span>`) }
      div.append(props)
      li.append(div.hide())
      div.slideDown(200)
    }
    li.toggleClass('expanded')
  }

  async _onItemDelete (event, collectionName = 'items') {
    const itemIndex = $(event.currentTarget).parents('.item').data('item-id')
    if (itemIndex) await this.removeItem(itemIndex, collectionName)
  }

  getItem (itemId, collectionName = 'items') {
    return this.item.system[collectionName].find(s => {
      return s._id === itemId
    })
  }

  async removeItem (itemId, collectionName = 'items') {
    const itemIndex = this.item.system[collectionName].findIndex(s => {
      return s._id === itemId
    })
    if (itemIndex > -1) {
      const collection = this.item.system[collectionName]
        ? duplicate(this.item.system[collectionName])
        : []
      collection.splice(itemIndex, 1)
      await this.item.update({ [`system.${collectionName}`]: collection })
    }
  }

  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'setup'],
      template: 'systems/CoC7/templates/items/setup.html',
      width: 525,
      height: 530,
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

  getData () {
    const item = super.getData()

    item.hasOwner = this.item.isEmbedded === true

    item.skills = this.item.system.items.filter(it => it.type === 'skill')
    item.otherItems = this.item.system.items.filter(it => it.type !== 'skill')

    item.skillListEmpty = item.skills.length === 0
    item.itemsListEmpty = item.otherItems.length === 0

    item.skills.sort((a, b) => {
      return a.name
        .toLocaleLowerCase()
        .localeCompare(b.name.toLocaleLowerCase())
    })

    item._eras = []
    for (const [key, value] of Object.entries(COC7.eras)) {
      item._eras.push({
        id: key,
        name: value,
        isEnabled: this.item.system.eras[key] === true
      })
    }

    item.oneBlockBackStory = game.settings.get('CoC7', 'oneBlockBackstory')

    item.isKeeper = game.user.isGM
    return item
  }

  _updateObject (event, formData) {
    const system = expandObject(formData)?.system
    if (system.bioSections) {
      formData['system.bioSections'] = Object.values(
        system.bioSections || []
      )
    }

    if (event.currentTarget?.name === 'system.characteristics.points.enabled') {
      formData['system.characteristics.rolls.enabled'] = !event.currentTarget.checked
    }

    if (event.currentTarget?.name === 'system.characteristics.rolls.enabled') {
      formData['system.characteristics.points.enabled'] = !event.currentTarget.checked
    }

    super._updateObject(event, formData)
  }
}
