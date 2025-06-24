/* global $, DragDrop, foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { COC7 } from '../../core/config.js'
import { CoC7Item } from '../../core/documents/item.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import { DropCoCID } from '../coc-id-system/apps/drop-coc-id.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7OccupationSheet extends foundry.appv1.sheets.ItemSheet {
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

    html.find('.group-item-delete').click(this._onGroupItemDelete.bind(this))
    html.find('.group-control').click(this._onGroupControl.bind(this))

    /* // FoundryVTT V12 */
    const dragDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.droppable',
      callbacks: { drop: this._onDrop.bind(this) }
    })
    dragDrop.bind(html[0])
  }

  async _onDrop (event, type = 'skill', collectionName = 'skills') {
    event.preventDefault()
    event.stopPropagation()

    const optionalSkill = event?.currentTarget?.classList?.contains('optional-skills')
    const ol = event?.currentTarget?.closest('ol')
    const index = ol?.dataset?.group

    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')

    let useCoCID = 0
    const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []
    const groups = this.item.system.groups ? foundry.utils.duplicate(this.item.system.groups) : []

    for (const item of dataList) {
      if (!item || !item.system) continue
      if (![type].includes(item.type)) {
        continue
      }

      if (optionalSkill) {
        if (!CoC7Item.isAnySpec(item)) {
          // Generic specialization can be included many times
          if (collection.find(el => el.name === item.name)) {
            continue // If skill is already in main don't add it
          }
          if (groups[index].skills.find(el => el.name === item.name)) {
            continue // If skill is already in group don't add it
          }
        }

        if (useCoCID === 0) {
          useCoCID = await DropCoCID.create()
        }
        groups[index].skills = groups[index].skills.concat([DropCoCID.processItem(useCoCID, item)])
      } else {
        if (!CoC7Item.isAnySpec(item)) {
          // Generic specialization can be included many times
          if (collection.find(el => el.name === item.name)) {
            continue
          }

          for (let i = 0; i < groups.length; i++) {
            // If the same skill is in one of the group remove it from the groups
            const index = groups[i].skills.findIndex(
              el => el.name === item.name
            )
            if (index !== -1) {
              groups[i].skills.splice(index, 1)
            }
          }
        }
        if (useCoCID === 0) {
          useCoCID = await DropCoCID.create()
        }
        collection.push(DropCoCID.processItem(useCoCID, item))
      }
    }
    await this.item.update({ 'system.groups': groups })
    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  async _onGroupControl (event) {
    event.preventDefault()
    const a = event.currentTarget

    // Add new damage component
    if (a.classList.contains('add-group')) {
      await this._onSubmit(event) // Submit any unsaved changes
      const groups = this.item.system.groups
      await this.item.update({
        'system.groups': groups.concat([{ options: 0, skills: [] }])
      })
    }

    if (a.classList.contains('remove-group')) {
      await this._onSubmit(event) // Submit any unsaved changes
      const groups = foundry.utils.duplicate(this.item.system.groups)
      const ol = a.closest('.item-list.group')
      groups.splice(Number(ol.dataset.group), 1)
      await this.item.update({ 'system.groups': groups })
    }
  }

  async _onItemSummary (event, collectionName = 'items') {
    event.preventDefault()
    const obj = $(event.currentTarget)
    const li = obj.parents('.item')
    const group = obj.closest('.group')
    let item
    if (group.length) {
      item = this.item.system.groups[group.data('group')][collectionName].find(s => {
        return s._id === li.data('item-id')
      })
    } else {
      item = this.item.system[collectionName].find(s => {
        return s._id === li.data('item-id')
      })
    }
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

  async _onGroupItemDelete (event) {
    const item = $(event.currentTarget).closest('.item')
    const group = Number(item.closest('.item-list.group').data('group'))
    const groups = foundry.utils.duplicate(this.item.system.groups)
    if (typeof groups[group] !== 'undefined') {
      const itemId = item.data('item-id')
      const CoCId = item.data('cocid')
      const itemIndex = groups[group].skills.findIndex(i => (itemId && i._id === itemId) || (CoCId && i === CoCId))
      if (itemIndex > -1) {
        groups[group].skills.splice(itemIndex, 1)
        await this.item.update({ 'system.groups': groups })
      }
    }
  }

  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'occupation'],
      template: 'systems/CoC7/templates/items/occupation.html',
      width: 525,
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

    sheetData.data.system.skills = await game.system.api.cocid.expandItemArray({ itemList: sheetData.data.system.skills })

    sheetData.skillListEmpty = sheetData.data.system.skills.length === 0

    sheetData.data.system.skills.sort(CoC7Utilities.sortByNameKey)

    for (let index = 0, len = sheetData.data.system.groups.length; index < len; index++) {
      sheetData.data.system.groups[index].skills = await game.system.api.cocid.expandItemArray({ itemList: sheetData.data.system.groups[index].skills })

      sheetData.data.system.groups[index].isEmpty = sheetData.data.system.groups[index].skills.length === 0

      sheetData.data.system.groups[index].skills.sort(CoC7Utilities.sortByNameKey)
    }

    sheetData.occupationPointsString = CoC7OccupationSheet.occupationPointsString(sheetData.data.system.occupationSkillPoints)

    sheetData.itemProperties = []

    for (const [key, value] of Object.entries(sheetData.data.system.type)) {
      if (value) {
        sheetData.itemProperties.push(COC7.occupationProperties[key] ? COC7.occupationProperties[key] : null)
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

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }

  static occupationPointsString (occupationSkillPoints) {
    const optionnal = []
    const mandatory = []
    for (const [key, carac] of Object.entries(occupationSkillPoints)) {
      if (carac.multiplier) {
        const caracName = game.i18n.localize(`CHARAC.${key.toUpperCase()}`)
        if (carac.selected && carac.optional) {
          optionnal.push(`${caracName}x${carac.multiplier}`)
        }
        if (carac.selected && !carac.optional) {
          mandatory.push(`${caracName}x${carac.multiplier}`)
        }
      }
    }
    let occupationPointsString = ''
    const orString = ` ${game.i18n.localize('CoC7.Or')} `
    if (mandatory.length) occupationPointsString += mandatory.join(' + ')
    if (optionnal.length && mandatory.length) {
      occupationPointsString += ` + (${optionnal.join(orString)})`
    }
    if (optionnal.length && !mandatory.length) {
      occupationPointsString += optionnal.join(orString)
    }
    return occupationPointsString
  }

  _updateObject (event, formData) {
    const system = foundry.utils.expandObject(formData)?.system
    if (system.groups) {
      formData['system.groups'] = Object.values(
        system.groups || []
      )
      for (let index = 0; index < this.item.system.groups.length; index++) {
        formData[`system.groups.${index}.skills`] = foundry.utils.duplicate(
          this.item.system.groups[index].skills
        )
      }
    }

    super._updateObject(event, formData)
  }
}
