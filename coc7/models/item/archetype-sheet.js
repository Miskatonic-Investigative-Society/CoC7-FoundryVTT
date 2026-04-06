/* global DragDrop foundry game TextEditor */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'

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
    this._onItemDropEvent(event, 'system', ['skill'])
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
        context._types = []
        for (const [key, value] of context.document.system.schema.getField('coreCharacteristics').entries()) {
          context._types.push({
            id: key,
            name: value.label,
            tooltip: value.hint,
            isEnabled: context.document.system.coreCharacteristics[key] === true
          })
        }
        /* // FoundryVTT V12 */
        context.enrichedSuggestedOccupations = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.suggestedOccupations,
          {
            async: true,
            secrets: context.editable
          }
        )
        /* // FoundryVTT V12 */
        context.enrichedSuggestedTraits = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.suggestedTraits,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'skills':
        context.skills = await context.document.system.items()
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
}
