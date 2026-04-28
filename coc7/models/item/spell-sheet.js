/* global CONFIG DragDrop foundry game Item TextEditor */
import { FOLDER_ID, SPELL_COST_TYPE_KEYS } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemSpellSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 550,
      height: 550
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/spell-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-description.hbs',
      scrollable: ['']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/spell-tab-details.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/spell-tab-keeper.hbs',
      scrollable: ['']
    }
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
      }
    }
    if (game.user.isGM) {
      tabs.details = {
        icon: '',
        label: 'CoC7.Details'
      }
      tabs.keeper = {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-tentacles-skull',
        tooltip: 'CoC7.GmNotes'
      }
    }

    context.tabs = this.getTabs('primary', 'description', tabs)

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
      case 'header':
        context.isKeeper = game.user.isGM
        if (context.document.parent instanceof Item) {
          context.isEmbedded = true
          context.isOwner = context.document?.parent.actor?.isOwner
        } else {
          context.isEmbedded = context.document.isEmbedded
          context.isOwner = context.document?.actor?.isOwner
        }
        context.automatedCast = context.document.system.costList.length > 0
        break
      case 'description':
        context._types = []
        for (const [key, value] of context.document.system.schema.getField('type').entries()) {
          context._types.push({
            id: key,
            name: value.label,
            tooltip: value.hint,
            isEnabled: context.document.system.type[key] === true
          })
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
        /* // FoundryVTT V12 */
        context.enrichedDescriptionAlternativeNames = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.alternativeNames,
          {
            async: true,
            secrets: context.editable
          }
        )
        context._costListTypes = Object.entries(SPELL_COST_TYPE_KEYS).reduce((c, e) => { c.push({ key: e[0], name: game.i18n.localize(e[1].name), group: game.i18n.localize(e[1].group) }); return c }, []).sort(CoC7Utilities.sortByNameKey)
        context._costListCosts = CONFIG.Item.dataModels.spell.availableCosts()
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
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'castSpell':
          {
            const hidden = event.currentTarget.dataset.property === 'hidden'
            this.document.system.cast(hidden)
          }
          break
        case 'cost-list-add':
          event.preventDefault()
          this.scrollToNewLast('div.cost-list-section')
          this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
          this.document.update({
            'system.costList': this.document.system.costList.concat([{}])
          })
          break
        case 'cost-list-before':
          {
            event.preventDefault()
            this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
            const item = event.currentTarget.closest('.spell-cost-list')
            if (item && typeof item.dataset.index !== 'undefined') {
              const index = Number(item.dataset.index)
              const costList = foundry.utils.duplicate(this.document.system.costList)
              costList.splice(index, 0, [{}])
              this.document.update({ 'system.costList': costList })
            }
          }
          break
        case 'cost-list-remove':
          {
            event.preventDefault()
            this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
            const item = event.currentTarget.closest('.spell-cost-list')
            if (item && typeof item.dataset.index !== 'undefined') {
              const index = Number(item.dataset.index)
              const costList = foundry.utils.duplicate(this.document.system.costList)
              costList.splice(index, 1)
              this.document.update({ 'system.costList': costList })
            }
          }
          break
      }
    }))
    this.element.querySelectorAll('.spell-cost-block').forEach((element) => element.addEventListener('dragstart', (event) => {
      event.preventDefault()
      event.stopPropagation()
    }))
    this.element.querySelectorAll('.item-controls-column').forEach((element) => element.addEventListener('dragstart', (event) => {
      event.preventDefault()
      event.stopPropagation()
    }))
    const dragDrop = new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dragSelector: '.spell-cost-list',
      dropSelector: '.spell-cost-list',
      permissions: {
        dragstart: true,
        drop: true
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDragDrop.bind(this)
      }
    })
    dragDrop.bind(this.element)
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onDragStart (event) {
    const data = {
      type: 'CoC7SpellCostList',
      index: Number(event.currentTarget.dataset.index)
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * Process dropped characteristic values or skill Items
   * @param {DropEvent} event
   */
  _onDragDrop (event) {
    const indexDrop = Number(event.currentTarget.dataset.index)
    const dataString = event.dataTransfer.getData('text/plain')
    const dropData = JSON.parse(dataString)
    if (dropData.type === 'CoC7SpellCostList' && dropData.index !== indexDrop) {
      const costList = this.document.system.costList
      const dragged = costList.splice(dropData.index, 1)
      costList.splice(indexDrop, 0, ...dragged)
      this.document.update({ 'system.costList': costList })
    }
  }
}
