/* global foundry */
import { FOLDER_ID } from '../constants.js'

export default class CoC7CharacteristicSelectionDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['coc7', 'dialog'],
    window: {
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false
    },
    position: {
      width: 350
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/char-select.hbs',
      scrollable: ['']
    }
  }

  /**
   * @inheritdoc
   */
  get title () {
    return this.coc7Config.title
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('.selectable').forEach((element) => element.addEventListener('click', async (event) => {
      this.coc7Config.resolve(element.dataset.key)
      this.close()
    }))
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
      case 'form':
        context.characteristics = this.coc7Config.characteristics
        break
    }
    return context
  }

  /**
   * Create popup
   * @param {object} options
   * @param {Array} options.characteristics
   * @param {string} options.title
   * @returns {object}
   */
  static async create ({ characteristics = [], title = '' } = {}) {
    return await new Promise(resolve => {
      new CoC7CharacteristicSelectionDialog({}, {}, {
        characteristics,
        title,
        resolve
      }).render({ force: true })
    })
  }
}
