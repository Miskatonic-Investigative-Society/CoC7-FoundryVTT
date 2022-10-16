/* global $, duplicate, game, ItemSheet, mergeObject, TextEditor */
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

    const collection = this.item.system[collectionName] ? duplicate(this.item.system[collectionName]) : []
    for (const item of dataList) {
      if (!item || !item.system) continue
      if (![type].includes(item.type)) {
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

  async removeItem (itemId, collectionName = 'items') {
    const itemIndex = this.item.system[collectionName].findIndex(s => {
      return s._id === itemId
    })
    if (itemIndex > -1) {
      const collection = this.item.system[collectionName] ? duplicate(this.item.system[collectionName]) : []
      collection.splice(itemIndex, 1)
      await this.item.update({ [`system.${collectionName}`]: collection })
    }
  }

  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'occupation'],
      template: 'systems/CoC7/templates/items/archetype.html',
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

  async getData () {
    const sheetData = super.getData()

    sheetData.hasOwner = this.item.isEmbedded === true

    const coreCharacteristics = []
    for (const [key, selected] of Object.entries(
      sheetData.data.system.coreCharacteristics
    )) {
      if (selected) {
        const characName = game.i18n.localize(`CHARAC.${key.toUpperCase()}`)
        coreCharacteristics.push(characName)
      }
    }

    sheetData.enrichedDescriptionValue = TextEditor.enrichHTML(
      sheetData.data.system.description.value,
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

    sheetData.enrichedSuggestedOccupations = TextEditor.enrichHTML(
      sheetData.data.system.suggestedOccupations,
      {
        async: false,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedSuggestedTraits = TextEditor.enrichHTML(
      sheetData.data.system.suggestedTraits,
      {
        async: false,
        secrets: sheetData.editable
      }
    )

    sheetData.skillListEmpty = sheetData.data.system.skills.length === 0

    sheetData.data.system.skills.sort(CoC7Utilities.sortByNameKey)

    sheetData.coreCharacteristicsString = ''
    const orString = ` ${game.i18n.localize('CoC7.Or')} `
    if (coreCharacteristics.length) {
      sheetData.coreCharacteristicsString += coreCharacteristics.join(orString)
    }

    sheetData.itemProperties = []

    sheetData.itemProperties.push(
      `${game.i18n.localize('CoC7.PulpTalents')}: ${sheetData.data.system.talents}`
    )
    sheetData.itemProperties.push(
      `${game.i18n.localize('CoC7.BonusPoints')}: ${sheetData.data.system.bonusPoints}`
    )

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }
}
