/* global $, foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { COC7 } from '../../core/config.js'
import { CoC7Item } from '../../core/documents/item.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import { DropCoCID } from '../coc-id-system/apps/drop-coc-id.js'
import { isCtrlKey } from '../../shared/dice/helper.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7SetupSheet extends foundry.appv1.sheets.ItemSheet {
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
    html.find('.add-monetary').click(this._onAddMonetary.bind(this))
    html.find('.remove-monetary').click(this._onRemoveMonetary.bind(this))
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

    let useCoCID = 0
    const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []
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

      if (useCoCID === 0) {
        useCoCID = await DropCoCID.create()
      }
      collection.push(DropCoCID.processItem(useCoCID, item))
    }

    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  async _onRemoveSection (event) {
    const a = event.currentTarget
    const div = a.closest('.item')
    const bio = foundry.utils.duplicate(this.item.system.bioSections)
    bio.splice(Number(div.dataset.index), 1)
    await this.item.update({ 'system.bioSections': bio })
  }

  async _onAddBio () {
    const bio = this.item.system.bioSections ? foundry.utils.duplicate(this.item.system.bioSections) : []
    bio.push(null)
    await this.item.update({ 'system.bioSections': bio })
  }

  _onAddMonetary () {
    const values = this.item.system.monetary.values ? foundry.utils.duplicate(this.item.system.monetary.values) : []
    values.push({
      name: '',
      min: null,
      max: null,
      cashType: 0,
      cashValue: '',
      assetsType: 0,
      assetsValue: '',
      spendingType: 0,
      spendingValue: ''
    })
    this.item.update({ 'system.monetary.values': values })
  }

  _onRemoveMonetary (event) {
    const a = event.currentTarget
    const div = a.closest('.item')
    const values = foundry.utils.duplicate(this.item.system.monetary.values)
    values.splice(Number(div.dataset.index), 1)
    this.item.update({ 'system.monetary.values': values })
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
      classes: ['coc7', 'sheet', 'setup'],
      template: 'systems/CoC7/templates/items/setup.html',
      width: 565,
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

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  async getData () {
    const sheetData = super.getData()

    sheetData.hasOwner = this.item.isEmbedded === true

    const era = Object.entries(this.item.flags?.CoC7?.cocidFlag?.eras ?? {}).filter(e => e[1]).map(e => e[0])

    const items = await game.system.api.cocid.expandItemArray({ itemList: this.item.system.items, era: (typeof era[0] !== 'undefined' ? era[0] : true) })

    sheetData.skills = items.filter(it => it.type === 'skill')
    sheetData.otherItems = items.filter(it => it.type !== 'skill')

    sheetData.skillListEmpty = sheetData.skills.length === 0
    sheetData.itemsListEmpty = sheetData.otherItems.length === 0

    sheetData.skills.sort(CoC7Utilities.sortByNameKey)

    sheetData._eras = []
    for (const [key, value] of Object.entries(COC7.eras)) {
      sheetData._eras.push({
        id: key,
        name: game.i18n.localize(value),
        isEnabled: (this.item.flags?.CoC7?.cocidFlag?.eras ?? {})[key] === true
      })
    }
    sheetData._eras.sort(CoC7Utilities.sortByNameKey)

    sheetData._monetaryFormats = []
    for (const key in COC7.monetaryFormats) {
      sheetData._monetaryFormats.push({ key, val: game.i18n.localize(COC7.monetaryFormats[key]) })
    }

    sheetData.showCurrencySymbol = ['decimalLeft', 'decimalRight', 'integerLeft', 'integerRight'].includes(sheetData.data.system.monetary.format)

    sheetData._monetaryTypes = []
    for (const key in COC7.monetaryTypes) {
      if (COC7.monetaryTypes[key].filter.length === 0 || COC7.monetaryTypes[key].filter.includes(sheetData.data.system.monetary.format)) {
        sheetData._monetaryTypes.push({ key, val: game.i18n.localize(COC7.monetaryTypes[key].name) })
      }
    }

    sheetData.oneBlockBackStory = game.settings.get('CoC7', 'oneBlockBackstory')

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

    sheetData.enrichedBackstory = await TextEditor.enrichHTML(
      sheetData.data.system.backstory,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }

  _updateObject (event, formData) {
    const system = foundry.utils.expandObject(formData)?.system
    if (system.bioSections) {
      formData['system.bioSections'] = Object.values(
        system.bioSections || []
      )
    }
    if (system.monetary.values) {
      formData['system.monetary.values'] = Object.values(system.monetary.values || [])
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
