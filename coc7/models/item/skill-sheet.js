/* global foundry game TextEditor */
import { FOLDER_ID, ERAS } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7ModelsItemSkillSystem from './skill-system.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemSkillSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 530,
      height: 530
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/skill-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-description.hbs',
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
        context.isSpecialized = context.document.system.properties.special
        context.canModifySpec = !((context.document.system.properties.firearm && context.document.system.specialization === game.i18n.localize('CoC7.FirearmSpecializationName')) || (context.document.system.properties.fighting && context.document.system.specialization === game.i18n.localize('CoC7.FightingSpecializationName')) || (context.document.system.properties.ranged && context.document.system.specialization === game.i18n.localize('CoC7.RangedSpecializationName')))
        context.hasNonCharacterOwner = (context.document.isEmbedded && context.document.actor?.type !== 'character')
        context._properties = []
        for (const [key, value] of context.document.system.schema.getField('properties').entries()) {
          context._properties.push({
            id: key,
            name: value.label,
            tooltip: value.hint,
            isEnabled: context.document.system.properties[key] === true
          })
        }
        context._eras = []
        for (const [key, era] of Object.entries(ERAS)) {
          context._eras.push({
            id: key,
            name: game.i18n.localize(era.name),
            icon: era.icon,
            isEnabled: (context.document.flags[FOLDER_ID]?.cocidFlag?.eras ?? {})[key] === true
          })
        }
        context._eras.sort(CoC7Utilities.sortByNameKey)
        context.useEraIcons = game.settings.get(FOLDER_ID, 'sheetEraIcons')
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
   * @param {SubmitEvent|null} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {object}
   */
  _processFormData (event, form, formData) {
    const object = super._processFormData(event, form, formData)
    const skillName = object.system.skillName || this.document.system.skillName
    const specialization = (typeof object.system.specialization === 'undefined' ? this.document.system.specialization : object.system.specialization)
    const parts = CoC7ModelsItemSkillSystem.getNamePartsSpec(skillName, specialization)
    object.name = parts.name
    return object
  }
}
