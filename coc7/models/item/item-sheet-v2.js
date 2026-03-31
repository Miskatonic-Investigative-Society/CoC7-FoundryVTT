/* global foundry game TextEditor */
import { FOLDER_ID, ERAS } from '../../constants.js'
import CoC7ActiveEffect from '../../apps/active-effect.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemItemSheetV2 extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 525,
      height: 450
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/item-v2-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-description.hbs',
      scrollable: ['.editor-content']
    },
    activeEffects: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-active-effects.hbs',
      scrollable: ['']
    },
    prices: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-prices.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
      scrollable: ['.editor-content']
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
      activeEffects: {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-aura',
        tooltip: 'CoC7.Effects'
      },
      prices: {
        cssClass: 'icon-only-tab',
        icon: 'fa-solid fa-tag',
        tooltip: 'CoC7.ItemPrice'
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
        context.worldEra = game.settings.get(FOLDER_ID, 'worldEra')
        break
      case 'description':
        /* // FoundryVTT V12 */
        context.enrichedDescriptionValue = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'activeEffects':
        context.effects = CoC7ActiveEffect.prepareActiveEffectCategories(context.document.effects, { status: false })
        break
      case 'prices':
        context._eras = []
        for (const [key, era] of Object.entries(ERAS)) {
          const isEnabled = (context.document.flags[FOLDER_ID]?.cocidFlag?.eras ?? {})[key] === true
          context._eras.push({
            price: (isEnabled ? context.document.system.price[key] : null),
            id: key,
            name: game.i18n.localize(era.name),
            icon: era.icon,
            isEnabled
          })
        }
        context._eras.sort(CoC7Utilities.sortByNameKey)
        context.useEraIcons = game.settings.get(FOLDER_ID, 'sheetEraIcons')
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
