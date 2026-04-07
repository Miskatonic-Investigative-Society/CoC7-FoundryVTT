/* global foundry game Item TextEditor */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'

export default class CoC7ModelsItemSpellSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 525,
      height: 480
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
      }
    }))
  }
}
