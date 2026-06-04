/* global foundry game */
import { FOLDER_ID } from '../constants.js'

export default class CoC7SpendLuckDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      closeOnSubmit: true,
      handler: CoC7SpendLuckDialog.#onSubmit
    },
    position: {
      width: 360
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/spend-luck.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<string|null>}
   */
  static async #onSubmit (event, form, formData) {
    if (event.submitter?.dataset?.action === 'validate') {
      this.coc7Config.resolve(this.coc7Config.luckValue)
    } else {
      this.coc7Config.resolve(0)
    }
  }

  /**
   * @inheritdoc
   */
  get title () {
    return game.i18n.format('CoC7.UseLuckForReduceLoss', { name: this.coc7Config.name })
  }

  /**
   * @inheritdoc
   */
  async close (...options) {
    this.coc7Config.resolve(0)
    super.close(...options)
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
        context.fixed = this.coc7Config.fixed
        context.name = this.coc7Config.name
        context.luckValue = this.coc7Config.luckValue
        context.nameValue = this.coc7Config.nameValue
        break
      case 'footer':
        context.buttons = [
          {
            type: 'submit',
            action: 'close',
            label: 'No',
            icon: 'fa-solid fa-times'
          },
          {
            type: 'submit',
            action: 'validate',
            label: 'Yes',
            icon: 'fa-solid fa-check'
          }
        ]
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   */
  async _renderFrame (options) {
    const frame = await super._renderFrame(options)

    /* // FoundryV12 polyfill */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      frame.setAttribute('open', true)
    }

    return frame
  }

  /**
   * Create popup
   * @param {object} options
   * @param {string} options.name
   * @param {boolean} options.fixed
   * @param {int} options.luckValue
   * @param {int} options.nameValue
   * @returns {object}
   */
  static async create ({ name = '?', fixed = true, luckValue = 0, nameValue = 0 } = {}) {
    return await new Promise(resolve => {
      new CoC7SpendLuckDialog({}, {}, {
        name,
        fixed,
        luckValue,
        nameValue,
        resolve
      }).render({ force: true })
    })
  }
}
