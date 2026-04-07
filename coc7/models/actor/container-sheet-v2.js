/* global foundry game TextEditor */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorGlobalSheet from './global-sheet.js'

export default class CoC7ModelsActorContainerSheetV2 extends CoC7ModelsActorGlobalSheet {
  static DEFAULT_OPTIONS = {
    classes: ['dialog', 'item', 'container'],
    position: {
      width: 672,
      height: 765
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/container-v2/header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    items: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/container-v2/items.hbs',
      scrollable: ['']
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-description.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
      scrollable: ['.editor-content']
    }
  }

  /**
   * Is this type of item allowed to be dropped on the actor?
   * @param {object} item
   * @returns {boolean}
   */
  _onDropItemAllowed (item) {
    return ['book', 'item', 'spell', 'weapon', 'armor'].includes(item.type)
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    const tabs = {
      items: {
        icon: '',
        label: 'CoC7.Items'
      },
      description: {
        icon: '',
        label: 'CoC7.Description'
      }
    }
    if (game.user.isGM) {
      tabs.keeper = {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-tentacles-skull',
        tooltip: 'CoC7.GmNotes'
      }
    }
    tabs.locked = {
      cssClass: 'icon-only-tab ' + (this.allowUnlock ? 'unlock-control' : 'unlock-control-disabled'),
      icon: (context.document.system.flags.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'),
      tooltip: (context.document.system.flags.locked ? 'CoC7.UnlockActor' : 'CoC7.LockActor')
    }

    context.tabs = this.getTabs('primary', 'items', tabs)

    // Containers shouldn't contain Pulp Talents or Status
    context.showInventoryTalents = typeof context.itemsByType.talent !== 'undefined'
    context.showInventoryStatuses = typeof context.itemsByType.status !== 'undefined'
    context.hasInventory = this.hasInventory(context)

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
        /* // FoundryVTT V12 */
        context.enrichedDescriptionValue = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
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
