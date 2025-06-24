/* global $, foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { CoC7Item } from '../../core/documents/item.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import { DropCoCID } from '../coc-id-system/apps/drop-coc-id.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7ArchetypeSheet extends foundry.appv1.sheets.ItemSheet {
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

    let useCoCID = 0
    const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []
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

      if (useCoCID === 0) {
        useCoCID = await DropCoCID.create()
      }
      collection.push(DropCoCID.processItem(useCoCID, item))
    }
    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  async _onItemSummary (event, collectionName = 'items') {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.item.system[collectionName].find(s => {
      return s._id === li.data('item-id')
    })
    if (!item) {
      return
    }
    const chatData = await TextEditor.enrichHTML(
      item.system.description.value,
      {
        async: true,
        secrets: this.item.editable
      }
    )

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary')
      summary.slideUp(200, () => summary.remove())
    } else {
      const div = $(`<div class="item-summary">${chatData}</div>`)
      const props = $('<div class="item-properties"></div>')
      // for (const p of chatData.properties) { props.append(`<span class="tag">${p}</span>`) }
      div.append(props)
      li.append(div.hide())
      div.slideDown(200)
    }
    li.toggleClass('expanded')
  }

  async _onItemDelete (event, collectionName = 'items') {
    const item = $(event.currentTarget).closest('.item')
    const itemId = item.data('item-id')
    const CoCId = item.data('cocid')
    const itemIndex = this.item.system[collectionName].findIndex(i => (itemId && i._id === itemId) || (CoCId && i === CoCId))
    if (itemIndex > -1) {
      const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []
      collection.splice(itemIndex, 1)
      await this.item.update({ [`system.${collectionName}`]: collection })
    }
  }

  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
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

    sheetData.enrichedSuggestedOccupations = await TextEditor.enrichHTML(
      sheetData.data.system.suggestedOccupations,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedSuggestedTraits = await TextEditor.enrichHTML(
      sheetData.data.system.suggestedTraits,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.data.system.skills = await game.system.api.cocid.expandItemArray({ itemList: sheetData.data.system.skills })
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
