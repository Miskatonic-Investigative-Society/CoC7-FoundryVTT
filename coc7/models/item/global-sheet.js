import { FOLDER_ID } from '../../constants.js'
import CoC7ActiveEffect from '../../apps/active-effect.js'
import CoC7DropCoCID from '../../apps/drop-coc-id.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemGlobalSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['coc7-sheet'],
    form: {
      handler: CoC7ModelsItemGlobalSheet.#onSubmit,
      submitOnChange: true
    },
    window: {
      resizable: true
    }
  }

  /**
   * Handle form submission
   * @param {SubmitEvent|null} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static async #onSubmit (event, form, formData) {
    if (!this.isEditable) return
    if (this.document.parent instanceof Item) {
      const submitData = this._prepareSubmitData(event, form, formData)
      await CoC7Utilities.editEmbeddedItem(this.document.parent, this.document.id, submitData)
      foundry.utils.mergeObject(this.document, submitData)
      this.render({ force: true })
      return
    }
    const submitData = this._prepareSubmitData(event, form, formData)
    await this._processSubmitData(event, form, submitData)
  }

  /**
   * Prepare tabs object
   * @param {string} group
   * @param {string} active
   * @param {object} tabs
   * @returns {object}
   */
  getTabs (group, active, tabs) {
    if (typeof this.tabGroups[group] === 'undefined' || typeof tabs[this.tabGroups[group]] === 'undefined') {
      this.tabGroups[group] = active
    }
    for (const tab in tabs) {
      tabs[tab].id = tab
      tabs[tab].group = group
      tabs[tab].cssClass = (tabs[tab].cssClass ?? '') + (this.tabGroups[group] === tabs[tab].id ? ' active' : '')
    }
    return tabs
  }

  /**
   * Merge form data into existing array
   * @param {object} object
   * @param {string} arrayKey
   */
  _mergeFormData (object, arrayKey) {
    if (typeof object.system[arrayKey] !== 'undefined') {
      const array = foundry.utils.duplicate(this.document.system[arrayKey])
      for (const key in object.system[arrayKey]) {
        array[key] = { ...array[key], ...object.system[arrayKey][key] }
      }
      object.system[arrayKey] = array
    }
  }

  /**
   * Toggle property
   * @param {SubmitEvent|null} event
   */
  async _onClickToggle (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const property = event.currentTarget.closest('.toggle-attributes').dataset.set
    const key = event.currentTarget.dataset.property
    this.document.system.toggleProperty(property, key, { isCtrlKey: CoC7Utilities.isCtrlKey(event) })
  }

  /**
   * Edit embedded item
   * @param {ClickEvent} event
   * @param {string} source
   */
  async _onItemEditEvent (event, source) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const li = event.currentTarget.closest('.item')
    if (li.dataset.uuid) {
      const item = await fromUuid(li.dataset.uuid)
      item.sheet.render({ force: true })
    } else if (li.dataset.id) {
      const itemData = foundry.utils.getProperty(this.document, source).itemDocuments.find(doc => doc._id === li.dataset.id)
      const Cls = CONFIG.Item.documentClass
      const item = new Cls(itemData, { parent: this.document })
      item.sheet.render({ force: true })
    }
  }

  /**
   * Delete embedded item
   * @param {ClickEvent} event
   * @param {string} source
   */
  async _onItemDeleteEvent (event, source) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const li = event.currentTarget.closest('.item')
    let index = -1
    let collectionName
    if (li.dataset.uuid) {
      collectionName = 'itemKeys'
      index = foundry.utils.getProperty(this.document, source)[collectionName].findIndex(key => key === li.dataset.cocid)
    } else if (li.dataset.id) {
      collectionName = 'itemDocuments'
      index = foundry.utils.getProperty(this.document, source)[collectionName].findIndex(doc => doc._id === li.dataset.id)
    }
    if (index > -1) {
      const object = foundry.utils.expandObject({
        [source + '.' + collectionName]: foundry.utils.duplicate(foundry.utils.getProperty(this.document, source)[collectionName])
      })
      const parts = source.match(/\.([^\\.]+)\.\d+$/)
      if (parts) {
        this._mergeFormData(object, parts[1])
      }
      foundry.utils.getProperty(object, source + '.' + collectionName).splice(index, 1)
      await this.document.update(object)
    }
  }

  /**
   * Drop item(s) to embed
   * @param {ClickEvent} event
   * @param {string} source
   * @param {Array} allowedTypes
   * @param {Array} otherLocations
   */
  async _onItemDropEvent (event, source, allowedTypes, otherLocations = []) {
    event.preventDefault()
    event.stopPropagation()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes

    const droppedItems = (await CoC7Utilities.getDataFromDropEvent(event, 'Item')).filter(doc => allowedTypes.includes(doc.type))

    if (droppedItems.length) {
      const useCoCID = await CoC7DropCoCID.create()
      const embeddedItems = await CoC7Utilities.getEmbeddedItems(this.document, source)
      for (const otherLocation of otherLocations) {
        if (otherLocation !== source) {
          const otherItems = await CoC7Utilities.getEmbeddedItems(this.document, otherLocation)
          embeddedItems.push(...otherItems)
        }
      }
      let collectionName
      const skipped = []
      const updates = {}
      const names = []
      for (const document of droppedItems) {
        if (!this.document.constructor.isAnySpec(document)) {
          if (embeddedItems.find(doc => ((doc.name === document.name && doc.type === document.type) || (typeof doc.flags?.[FOLDER_ID]?.cocidFlag?.id !== 'undefined' && doc.flags[FOLDER_ID].cocidFlag.id === document.flags?.[FOLDER_ID]?.cocidFlag?.id)))) {
            skipped.push(document.name)
            continue
          }
        }
        names.push(document.name)
        const newEntry = CoC7DropCoCID.processItem(useCoCID, document)
        if (typeof newEntry === 'string') {
          collectionName = 'itemKeys'
        } else {
          collectionName = 'itemDocuments'
        }
        if (typeof updates[source + '.' + collectionName] === 'undefined') {
          updates[source + '.' + collectionName] = foundry.utils.duplicate(foundry.utils.getProperty(this.document, source)[collectionName])
        }
        updates[source + '.' + collectionName].push(newEntry)
      }
      if (skipped.length) {
        ui.notifications.warn('CoC7.ExistingEmbeddedItems', { format: { names: '"' + skipped.join('" / "') + '"' } })
      }
      if (names.length) {
        ui.notifications.info('CoC7.AddedEmbeddedItems', { format: { names: '"' + names.join('" / "') + '"' } })
        const object = foundry.utils.expandObject(updates)
        const parts = source.match(/\.([^\\.]+)\.\d+$/)
        if (parts) {
          this._mergeFormData(object, parts[1])
        }
        await this.document.update(object)
      }
    }
  }

  /**
   * Toggle description
   * @param {ClickEvent} event
   * @param {string} source
   */
  async _onItemSummaryEvent (event, source) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    let item
    if (li.dataset.uuid) {
      item = await fromUuid(li.dataset.uuid)
    } else if (li.dataset.id) {
      item = foundry.utils.getProperty(this.document, source).itemDocuments.find(doc => doc._id === li.dataset.id)
    }
    if (item) {
      if (CoC7Utilities.htmlElementToggled(li)) {
        CoC7Utilities.htmlElementToggleHide(li, { remove: true })
      } else {
        let div = li.querySelector('.html-element-toggled')
        if (!div) {
          div = document.createElement('div')
          div.classList.add('item-summary')
          await CoC7Utilities.setItemSummaryHtml(div, item)
          li.append(div)
        }
        CoC7Utilities.htmlElementToggleShow(li, div)
      }
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

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return
    this.element.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', this._onClickToggle.bind(this)))

    CoC7ActiveEffect._onRender(this.element, context.document)
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

    if (typeof context.tabs[partId] !== 'undefined') {
      context.tab = context.tabs[partId]
    } else {
      context.tab = undefined
    }

    return context
  }

  /**
   * Add empty element the same height as the last and move scroll to it
   * @param {string} selector
   */
  scrollToNewLast (selector) {
    const existing = this.element.querySelectorAll(selector)
    if (existing.length) {
      const empty = document.createElement('div')
      empty.style.height = existing[existing.length - 1].getBoundingClientRect().height + 'px'
      existing[existing.length - 1].after(empty)
      empty.scrollIntoView({ block: 'end' })
    }
  }
}
