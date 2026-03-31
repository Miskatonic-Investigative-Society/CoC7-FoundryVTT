/* global DragDrop foundry game TextEditor */
import { FOLDER_ID, ERAS, MONETARY_FORMATS, MONETARY_TYPES } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemSetupSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 565,
      height: 530
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/setup-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-properties-description.hbs',
      scrollable: ['']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/setup-tab-details.hbs',
      scrollable: ['']
    },
    characteristics: {
      template: 'systems/' + FOLDER_ID + '/templates/items/setup-tab-characteristics.hbs',
      scrollable: ['']
    },
    skills: {
      template: 'systems/' + FOLDER_ID + '/templates/items/setup-tab-skills.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
      scrollable: ['']
    }
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('.item div.summary').forEach((element) => element.addEventListener('click', this._onItemSummary.bind(this)))

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'biography-add':
          this._onBioSectionAdd(event)
          break
        case 'biography-move-down':
          this._onBioSectionMoveDown(event)
          break
        case 'biography-move-up':
          this._onBioSectionMoveUp(event)
          break
        case 'biography-remove':
          this._onBioSectionRemove(event)
          break
        case 'item-delete':
          this._onItemDelete(event)
          break
        case 'monetary-add':
          this._onMonetaryAdd(event)
          break
        case 'monetary-remove':
          this._onMonetaryRemove(event)
          break
      }
    }))

    /* // FoundryVTT V12 */
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.drop-item',
      permissions: {
        drop: true
      },
      callbacks: {
        drop: this._onItemDrop.bind(this)
      }
    }).bind(this.element)
  }

  /**
   * Drop
   * @param {ClickEvent} event
   */
  async _onItemDrop (event) {
    this._onItemDropEvent(event, 'system', ['item', 'weapon', 'skill', 'book', 'spell'])
  }

  /**
   * Remove Biography Section Row
   * @param {ClickEvent} event
   */
  async _onBioSectionRemove (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const item = event.currentTarget.closest('.bio-section')
    if (item && typeof item.dataset.index !== 'undefined') {
      const index = Number(item.dataset.index)
      const bioSections = foundry.utils.duplicate(this.document.system.bioSections)
      bioSections.splice(index, 1)
      await this.document.update({ 'system.bioSections': bioSections })
    }
  }

  /**
   * Add Biography Section Row
   * @param {ClickEvent} event
   */
  async _onBioSectionAdd (event) {
    event.preventDefault()
    this.scrollToNewLast('div.bio-section')
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    await this.document.update({
      'system.bioSections': this.document.system.bioSections.concat([''])
    })
  }

  /**
   * Move Down Biography Section Row
   * @param {ClickEvent} event
   */
  async _onBioSectionMoveDown (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const item = event.currentTarget.closest('.bio-section')
    if (item && typeof item.dataset.index !== 'undefined') {
      const index = Number(item.dataset.index)
      const bioSections = foundry.utils.duplicate(this.document.system.bioSections)
      if (index === 0 || typeof bioSections[index] === 'undefined') return
      const elem = bioSections.splice(index, 1)[0]
      bioSections.splice(index - 1, 0, elem)
      await this.document.update({ 'system.bioSections': bioSections })
    }
  }

  /**
   * Move Up Biography Section Row
   * @param {ClickEvent} event
   */
  async _onBioSectionMoveUp (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const item = event.currentTarget.closest('.bio-section')
    if (item && typeof item.dataset.index !== 'undefined') {
      const index = Number(item.dataset.index)
      const bioSections = foundry.utils.duplicate(this.document.system.bioSections)
      if (typeof bioSections[index] === 'undefined') return
      const elem = bioSections.splice(index, 1)[0]
      bioSections.splice(index + 1, 0, elem)
      await this.document.update({ 'system.bioSections': bioSections })
    }
  }

  /**
   * Add Monetary Row
   * @param {ClickEvent} event
   */
  async _onMonetaryAdd (event) {
    event.preventDefault()
    this.scrollToNewLast('div.tiny-monetary')
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    await this.document.update({
      'system.monetary.values': this.document.system.monetary.values.concat([{}])
    })
  }

  /**
   * Remove Monetary Row
   * @param {ClickEvent} event
   */
  async _onMonetaryRemove (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const item = event.currentTarget.closest('.form-group')
    if (item && typeof item.dataset.index !== 'undefined') {
      const index = Number(item.dataset.index)
      const values = foundry.utils.duplicate(this.document.system.monetary.values)
      values.splice(index, 1)
      this._onMonetaryReorder(values)
      await this.document.update({ 'system.monetary.values': values })
    }
  }

  /**
   * Reorder Monetary values by Min and Max
   * @param {Array} values
   */
  _onMonetaryReorder (values) {
    const maxOffset = values.length - 1
    if (maxOffset > 0) {
      values.sort((l, r) => {
        const lMinimum = parseInt(l.min ?? 0, 10)
        const rMinimum = parseInt(r.min ?? 0, 10)
        return lMinimum - rMinimum
      })
      for (let offset = 1; offset <= maxOffset; offset++) {
        values[offset - 1].max = values[offset].min - 1
      }
      values[0].min = null
      values[maxOffset].max = null
    }
  }

  /**
   * Toggle embedded item description
   * @param {ClickEvent} event
   */
  async _onItemSummary (event) {
    this._onItemSummaryEvent(event, 'system')
  }

  /**
   * Delete embedded item
   * @param {ClickEvent} event
   */
  async _onItemDelete (event) {
    this._onItemDeleteEvent(event, 'system')
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    const tabs = {
      description: {
        icon: '',
        label: 'CoC7.Description'
      },
      details: {
        icon: '',
        label: 'CoC7.Details'
      }
    }
    if (context.document.system.enableCharacterisitics) {
      tabs.characteristics = {
        icon: '',
        label: 'CoC7.Characteristics'
      }
    }
    tabs.skills = {
      icon: '',
      label: 'CoC7.Skills'
    }
    if (game.user.isGM) {
      tabs.keeper = {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-tentacles-skull',
        tooltip: 'CoC7.GmNotes'
      }
    }

    context.tabs = this.getTabs('primary', 'description', tabs)

    context.items = await context.document.system.items()

    return context
  }

  /**
   * @inheritdoc
   * @param {string} partId
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _preparePartContext (partId, context, options) {
    context = await super._preparePartContext(partId, context, options)

    switch (partId) {
      case 'description':
        context._properties = []
        for (const [key, era] of Object.entries(ERAS)) {
          if (context.document.flags[FOLDER_ID]?.cocidFlag?.eras?.[key] === true) {
            context._properties.push(era.name)
          }
        }
        /* // FoundryVTT V12 */
        context.enrichedDescriptionValue = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'details':
        context.oneBlockBackStory = game.settings.get(FOLDER_ID, 'oneBlockBackstory')
        context._eras = []
        for (const [key, era] of Object.entries(ERAS)) {
          context._eras.push({
            id: key,
            name: game.i18n.localize(era.name),
            icon: era.icon,
            isEnabled: (context.document.flags[FOLDER_ID]?.cocidFlag?.eras ?? {})[key] === true
          })
        }
        context._eras.sort(CoC7Utilities.sortByNameKey)
        context.useEraIcons = game.settings.get(FOLDER_ID, 'sheetEraIcons')
        context._monetaryFormats = []
        for (const key in MONETARY_FORMATS) {
          context._monetaryFormats.push({ key, val: game.i18n.localize(MONETARY_FORMATS[key]) })
        }
        context._monetaryTypes = []
        for (const key in MONETARY_TYPES) {
          if (MONETARY_TYPES[key].filter.length === 0 || MONETARY_TYPES[key].filter.includes(context.document.system.monetary.format)) {
            context._monetaryTypes.push({ key, val: game.i18n.localize(MONETARY_TYPES[key].name) })
          }
        }
        if (context.oneBlockBackStory) {
          /* // FoundryVTT V12 */
          context.enrichedBackstory = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
            context.document.system.backstory,
            {
              async: true,
              secrets: context.editable
            }
          )
        } else {
          context.bioSections = []
          for (const index in context.document.system.bioSections) {
            context.bioSections[index] = {
              title: context.document.system.bioSections[index]
            }
          }
          if (context.bioSections.length) {
            context.bioSections[0].isFirst = true
            context.bioSections[context.bioSections.length - 1].isLast = true
          }
        }
        context.monetary = foundry.utils.duplicate(context.document.system.monetary.values)
        context.showCurrencySymbol = ['decimalLeft', 'decimalRight', 'integerLeft', 'integerRight'].includes(context.document.system.monetary.format)
        context.otherItems = context.items.filter(doc => doc.type !== 'skill')
        context.itemsListEmpty = context.otherItems.length === 0
        break
      case 'skills':
        context.skills = context.items.filter(doc => doc.type === 'skill')
        context.skillListEmpty = context.skills.length === 0
        break
      case 'keeper':
        /* // FoundryVTT V12 */
        context.enrichedDescriptionKeeper = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.keeper,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {SubmitEvent|null} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {object}
   */
  _processFormData (event, form, formData) {
    const object = super._processFormData(event, form, formData)

    if (typeof object.system.monetary.values !== 'undefined') {
      object.system.monetary.values = Object.values(object.system.monetary.values)
      if (event.target.classList.contains('cash-assets-range')) {
        this._onMonetaryReorder(object.system.monetary.values)
      }
    }

    return object
  }
}
