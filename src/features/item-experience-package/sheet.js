/* global $ DragDrop foundry game TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { CoC7Item } from '../../core/documents/item.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import { DropCoCID } from '../coc-id-system/apps/drop-coc-id.js'

export class CoC7ExperiencePackageSheet extends foundry.appv1.sheets.ItemSheet {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheet', 'armor'],
      template: 'systems/CoC7/templates/items/experience-package.hbs',
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

    sheetData.data.system.skills = await game.system.api.cocid.expandItemArray({ itemList: sheetData.data.system.skills })

    sheetData.skillListEmpty = sheetData.data.system.skills.length === 0

    sheetData.data.system.skills.sort(CoC7Utilities.sortByNameKey)

    for (let index = 0, len = sheetData.data.system.groups.length; index < len; index++) {
      sheetData.data.system.groups[index].skills = await game.system.api.cocid.expandItemArray({ itemList: sheetData.data.system.groups[index].skills })

      sheetData.data.system.groups[index].isEmpty = sheetData.data.system.groups[index].skills.length === 0

      sheetData.data.system.groups[index].skills.sort(CoC7Utilities.sortByNameKey)
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

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return
    html.find('.toggle-property').click(this._onPropertyClick.bind(this))
    html.find('.sanity-loss-type-add').click(this._onAddSanityLossReason.bind(this))
    html.find('.sanity-loss-type-delete').click(this._onDeleteSanityLossReason.bind(this))
    html.find('.item-delete').click(event => this._onItemDelete(event, 'skills'))
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

  async _onPropertyClick (event) {
    event.preventDefault()
    const key = event.currentTarget.dataset.property
    const propertyId = event.currentTarget.closest('.toggle-attributes').dataset.set
    const value = !(this.item.system[propertyId][key] ?? false)
    const changes = { ['system.' + propertyId + '.' + key]: value }
    if (propertyId === 'properties' && key === 'sanitySame') {
      if (value) {
        changes['system.' + propertyId + '.cthulhuGain'] = true
        changes['system.' + propertyId + '.sanityLoss'] = false
      }
    } else if (propertyId === 'properties' && key === 'sanityLoss') {
      if (value) {
        changes['system.' + propertyId + '.sanitySame'] = false
      }
    } else if (propertyId === 'properties' && key === 'cthulhuGain') {
      if (!value) {
        changes['system.' + propertyId + '.sanitySame'] = false
      }
    }
    await this.item.update(changes)
  }

  async _onAddSanityLossReason (event) {
    event.preventDefault()
    const immunity = this.item.system.immunity ?? []
    immunity.push('')
    await this.item.update({ 'system.immunity': immunity })
  }

  async _onDeleteSanityLossReason (event) {
    event.preventDefault()
    const index = $(event.currentTarget).closest('.form-group').data('index')
    const immunity = this.item.system.immunity ?? []
    immunity.splice(index, 1)
    await this.item.update({ 'system.immunity': immunity })
  }

  _updateObject (event, formData) {
    const system = foundry.utils.expandObject(formData)?.system
    if (system.immunity) {
      formData['system.immunity'] = Object.values(
        system.immunity || []
      )
    }
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
