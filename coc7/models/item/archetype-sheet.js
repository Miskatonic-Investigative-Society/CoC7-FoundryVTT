import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemArchetypeSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 520,
      height: 480
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/archetype-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-properties-description.hbs',
      scrollable: ['']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/archetype-tab-details.hbs',
      scrollable: ['']
    },
    skills: {
      template: 'systems/' + FOLDER_ID + '/templates/items/archetype-tab-skills.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
      scrollable: ['.editor-content']
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
        case 'item-delete':
          this._onItemDelete(event)
          break
        case 'talent-delete':
          this._onTalentDelete(event)
          break
      }
    }))

    new foundry.applications.ux.DragDrop({
      dropSelector: '.drop-item',
      permissions: {
        drop: true
      },
      callbacks: {
        drop: this._onItemDrop.bind(this)
      }
    }).bind(this.element)

    new foundry.applications.ux.DragDrop({
      dropSelector: '.drop-talent',
      permissions: {
        drop: true
      },
      callbacks: {
        drop: this._onTalentDrop.bind(this)
      }
    }).bind(this.element)
  }

  /**
   * Drop
   * @param {DropEvent} event
   */
  async _onItemDrop (event) {
    this._onItemDropEvent(event, 'system', ['skill'])
  }

  /**
   * Drop
   * @param {DropEvent} event
   */
  async _onTalentDrop (event) {
    event.preventDefault()
    event.stopPropagation()
    const fields = ['talentsRequired', 'talentsSuggested']
    if (fields.includes(event.currentTarget.dataset.type)) {
      this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes

      const droppedCocids = (await CoC7Utilities.getDataFromDropEvent(event, 'Item')).filter(doc => doc.type === 'talent' && doc.flags?.[FOLDER_ID]?.cocidFlag?.id?.length).map(doc => doc.flags[FOLDER_ID].cocidFlag.id)
      const updates = {}
      for (const field of fields) {
        updates['system.' + field] = this.document.system.toObject()[field]
      }
      let changed = false
      for (const cocid of droppedCocids) {
        for (const field of fields) {
          if (field !== event.currentTarget.dataset.type) {
            const index = updates['system.' + field].indexOf(cocid)
            if (index > -1) {
              updates['system.' + field].splice(index, 1)
              changed = true
            }
          } else {
            const index = updates['system.' + field].indexOf(cocid)
            if (index === -1) {
              updates['system.' + field].push(cocid)
              changed = true
            }
          }
        }
      }
      if (changed) {
        this.document.update(updates)
      }
    }
  }

  /**
   * Delete embedded item
   * @param {ClickEvent} event
   */
  async _onTalentDelete (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const li = event.currentTarget.closest('.item')
    const div = event.currentTarget.closest('.drop-talent')
    const updates = {
      ['system.' + div.dataset.type]: this.document.system.toObject()[div.dataset.type].filter(t => t !== li.dataset.cocid)
    }
    this.document.update(updates)
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
      },
      skills: {
        icon: '',
        label: 'CoC7.Skills'
      }
    }
    if (game.user.isGM) {
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
        context.coreCharacteristicsString = Object.entries(context.document.system.coreCharacteristics).reduce((c, i) => {
          if (i[1]) {
            c.push(game.i18n.localize('CHARAC.' + i[0].toUpperCase()))
          }
          return c
        }, []).join(` ${game.i18n.localize('CoC7.Or')} `)
        break
      case 'description':
        context._properties = [
          `${game.i18n.localize('CoC7.PulpTalents')}: ${context.document.system.talents}`,
          `${game.i18n.localize('CoC7.BonusPoints')}: ${context.document.system.bonusPoints}`
        ]
        context.enrichedDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'details':
        context._types = []
        for (const [value, field] of context.document.system.schema.getField('coreCharacteristics').entries()) {
          context._types.push({
            value,
            label: field.label,
            tooltip: field.hint,
            isEnabled: context.document.system.coreCharacteristics[value] === true
          })
        }
        context.enrichedSuggestedOccupations = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.suggestedOccupations,
          {
            async: true,
            secrets: context.editable
          }
        )
        context.enrichedSuggestedTraits = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.suggestedTraits,
          {
            async: true,
            secrets: context.editable
          }
        )
        context.talentsSuggested = await game.CoC7.cocid.expandItemArray({ itemList: context.document.system.talentsSuggested })
        context.talentsSuggestedEmpty = context.talentsSuggested.length === 0
        context.talentsRequired = await game.CoC7.cocid.expandItemArray({ itemList: context.document.system.talentsRequired })
        context.talentsRequiredEmpty = context.talentsRequired.length === 0
        break
      case 'skills':
        context.skills = await context.document.system.items()
        context.skillListEmpty = context.skills.length === 0
        break
      case 'keeper':
        context.enrichedDescriptionKeeper = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
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
}
