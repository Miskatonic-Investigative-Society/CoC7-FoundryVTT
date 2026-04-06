/* global foundry game TextEditor */
import { FOLDER_ID, ERAS } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemWeaponSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 600,
      height: 500
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/weapon-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/weapon-tab-details.hbs',
      scrollable: ['']
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-description.hbs',
      scrollable: ['']
    },
    prices: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-prices.hbs',
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
      details: {
        icon: '',
        label: 'CoC7.ItemDetails'
      },
      description: {
        icon: '',
        label: 'CoC7.Description'
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

    context.tabs = this.getTabs('primary', 'details', tabs)

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
        context._properties = [{
          id: 'melee',
          name: 'CoC7.Weapon.Property.Melee',
          tooltip: '',
          isEnabled: context.document.system.properties.rngd !== true
        }]
        for (const [key, value] of context.document.system.schema.getField('properties').entries()) {
          context._properties.push({
            id: key,
            name: value.label,
            tooltip: value.hint,
            isEnabled: context.document.system.properties[key] === true
          })
        }
        context.usesAlternateSkill = context.document.system.usesAlternateSkill
        if (context.document.isEmbedded) {
          context.weaponSkillGroups = context.document.parent.weaponSkillGroups(context.document.system.properties.rngd)
        }
        break
      case 'details':
        /* // FoundryVTT V12 */
        context.enrichedDescriptionSpecial = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
          context.document.system.description.special,
          {
            async: true,
            secrets: context.editable
          }
        )
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
