/* global foundry fromUuid game Item ui */
import { FOLDER_ID } from '../../constants.js'
import CoC7ActiveEffect from '../../apps/active-effect.js'
import CoC7DropCoCID from '../../apps/drop-coc-id.js'
import CoC7Utilities from '../../apps/utilities.js'
import deprecated from '../../deprecated.js'

export default class CoC7ModelsItemGlobalSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['coc7', 'sheet', 'dialog', 'item'],
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
    const property = event.currentTarget.closest('.toggle-attributes').dataset.set
    const key = event.currentTarget.dataset.property
    this.document.system.toggleProperty(property, key, { isCtrlKey: CoC7Utilities.isCtrlKey(event) })
  }

  /**
   * Delete embedded item
   * @param {ClickEvent} event
   * @param {string} source
   */
  async _onItemDeleteEvent (event, source) {
    event.preventDefault()
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
   */
  async _onItemDropEvent (event, source, allowedTypes) {
    event.preventDefault()
    event.stopPropagation()

    const droppedItems = (await CoC7Utilities.getDataFromDropEvent(event, 'Item')).filter(doc => allowedTypes.includes(doc.type))

    if (droppedItems.length) {
      const useCoCID = await CoC7DropCoCID.create()
      const embeddedItems = await CoC7Utilities.getEmbeddedItems(this.document, source)
      let collectionName
      const updates = {}
      const names = []
      for (const document of droppedItems) {
        if (!this.document.constructor.isAnySpec(document)) {
          if (embeddedItems.find(doc => ((doc.name === document.name && doc.type === document.type) || (typeof doc.flags?.[FOLDER_ID]?.cocidFlag?.id !== 'undefined' && doc.flags[FOLDER_ID].cocidFlag.id === document.flags?.[FOLDER_ID]?.cocidFlag?.id)))) {
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
      if (names.length) {
        /* // FoundryVTT V12 */
        ui.notifications.info(game.i18n.format('CoC7.AddedEmbeddedItems', { names: '"' + names.join('" / "') + '"' }))
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
    this.element.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', (event) => { this._onClickToggle(event) }))

    /* // FoundryVTT V12 */
    if (game.release.generation === 12) {
      this.element.querySelectorAll('img[data-action="editImage"]').forEach((element) => element.addEventListener('click', async (event) => {
        deprecated.AppV2EditImage(event, this.document, this.element, { submitOnChange: this.options.form.submitOnChange, position: this.position })
      }))
    }

    CoC7ActiveEffect._onRender(this.element, context.document)
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    /* // FoundryV12 polyfill */
    if (!context.document) {
      context.document = this.document
    }

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

    if (typeof context.tabs[partId] !== 'undefined') {
      context.tab = context.tabs[partId]
    } else {
      context.tab = undefined
    }

    /* // FoundryV12 polyfill */
    if (game.release.generation === 12) {
      context.editable = this.isEditable
    }

    return context
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   */
  async _renderFrame (options) {
    const frame = await super._renderFrame(options)

    /* // FoundryV12 polyfill */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      frame.setAttribute('open', true)
    }

    return frame
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
