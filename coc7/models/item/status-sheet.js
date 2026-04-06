/* global foundry game TextEditor */
import { FOLDER_ID } from '../../constants.js'
import CoC7ActiveEffect from '../../apps/active-effect.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'

export default class CoC7ModelsItemStatusSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 550,
      height: 480
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/status-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-properties-description.hbs',
      scrollable: ['']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/status-tab-details.hbs',
      scrollable: ['']
    },
    activeEffects: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-active-effects.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
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
      },
      details: {
        icon: '',
        label: 'CoC7.Details'
      },
      activeEffects: {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-aura',
        tooltip: 'CoC7.Effects'
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
      case 'description':
        context._properties = []
        for (const [key, value] of context.document.system.schema.getField('type').entries()) {
          if (context.document.system.type[key] === true) {
            context._properties.push(value.label)
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
        context.enrichedDescriptionNotes = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.notes,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'activeEffects':
        context.effects = CoC7ActiveEffect.prepareActiveEffectCategories(context.document.effects, { status: false })
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
