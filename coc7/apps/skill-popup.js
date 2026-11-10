import { FOLDER_ID } from '../constants.js'

export default class CoC7SkillPopup extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ['coc7-sheet'],
    position: {
      width: 520,
      height: 480
    },
    tag: 'div',
    window: {
      title: 'CoC7.SkillDetailsWindow'
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/skill-details/header.hbs',
      scrollable: []
    },
    description: {
      template: 'systems/' + FOLDER_ID + '//templates/apps/skill-details/body.hbs',
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

    context.document = this.options.document

    context.enrichedDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      context.document.system.description.value,
      {
        async: true,
        secrets: false
      }
    )
    context._properties = []
    for (const [value, field] of context.document.system.schema.getField('properties').entries()) {
      if (context.document.system.properties[value] === true) {
        context._properties.push(field.label)
      }
    }

    return context
  }
}
