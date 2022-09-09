/* global $, DragDrop, duplicate, expandObject, game, ItemSheet, mergeObject */
import { COC7 } from '../../config.js'
import { CoC7Item } from '../item.js'
import { CoC7Utilities } from '../../utilities.js'

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7OccupationSheet extends ItemSheet {
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

    const dragDrop = new DragDrop({
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

    const collection = this.item.system[collectionName] ? duplicate(this.item.system[collectionName]) : []
    const groups = this.item.system.groups ? duplicate(this.item.system.groups) : []

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

        groups[index].skills = groups[index].skills.concat([item])
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
        collection.push(duplicate(item))
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
      const groups = duplicate(this.item.system.groups)
      const ol = a.closest('.item-list.group')
      groups.splice(Number(ol.dataset.group), 1)
      await this.item.update({ 'system.groups': groups })
    }
  }

  _onItemSummary (event, collectionName = 'items') {
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

  async _onGroupItemDelete (event) {
    const a = event.currentTarget
    const li = a.closest('.item')
    const ol = li.closest('.item-list.group')
    const groups = duplicate(this.item.system.groups)
    groups[Number(ol.dataset.group)].skills.splice(
      Number(li.dataset.itemIndex),
      1
    )
    await this.item.update({ 'system.groups': groups })
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

  getData () {
    const sheetData = super.getData()

    sheetData.hasOwner = this.item.isEmbedded === true

    const optionnal = []
    const mandatory = []
    for (const [key, carac] of Object.entries(sheetData.data.system.occupationSkillPoints)) {
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

    sheetData.skillListEmpty = sheetData.data.system.skills.length === 0

    sheetData.data.system.skills.sort((a, b) => {
      return a.name
        .toLocaleLowerCase()
        .localeCompare(b.name.toLocaleLowerCase())
    })

    for (let index = 0, len = sheetData.data.system.groups.length; index < len; index++) {
      sheetData.data.system.groups[index].isEmpty = sheetData.data.system.groups[index].skills.length === 0

      sheetData.data.system.groups[index].skills.sort((a, b) => {
        return a.name
          .toLocaleLowerCase()
          .localeCompare(b.name.toLocaleLowerCase())
      })
    }

    sheetData.occupationPointsString = ''
    const orString = ` ${game.i18n.localize('CoC7.Or')} `
    if (mandatory.length) sheetData.occupationPointsString += mandatory.join(' + ')
    if (optionnal.length && mandatory.length) {
      sheetData.occupationPointsString += ` + (${optionnal.join(orString)})`
    }
    if (optionnal.length && !mandatory.length) {
      sheetData.occupationPointsString += optionnal.join(orString)
    }

    sheetData.itemProperties = []

    for (const [key, value] of Object.entries(sheetData.data.system.type)) {
      if (value) {
        sheetData.itemProperties.push(COC7.occupationProperties[key] ? COC7.occupationProperties[key] : null)
      }
    }

    sheetData.isKeeper = game.user.isGM
    return sheetData
  }

  _updateObject (event, formData) {
    const system = expandObject(formData)?.system
    if (system.groups) {
      formData['system.groups'] = Object.values(
        system.groups || []
      )
      for (let index = 0; index < this.item.system.groups.length; index++) {
        formData[`system.groups.${index}.skills`] = duplicate(
          this.item.system.groups[index].skills
        )
      }
    }

    super._updateObject(event, formData)
  }
}
