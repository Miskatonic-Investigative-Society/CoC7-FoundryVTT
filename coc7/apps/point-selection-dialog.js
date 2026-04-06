/* global foundry game */
import { FOLDER_ID } from '../constants.js'

export default class CoC7PointSelectionDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      title: 'CoC7.InvestigatorWizard.OccupationSkillPoints',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7PointSelectionDialog.#onSubmit
    },
    position: {
      width: 360
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/point-select.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
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

    this.element.querySelectorAll('.selectable').forEach((element) => element.addEventListener('click', async (event) => {
      event.preventDefault()
      this.coc7Config.selected = event.currentTarget.dataset.key
      this.render({ force: true })
    }))
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
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    this.coc7Config.resolve(this.coc7Config.selected)
    this.close()
  }

  /**
   * Total points
   * @returns {int}
   */
  get total () {
    const total = this.coc7Config.characteristicOptional.reduce((c, r) => {
      if (r.key === this.coc7Config.selected) {
        c += r.total
      }
      return c
    }, this.coc7Config.characteristicFixed.reduce((c, r) => {
      c += r.total
      return c
    }, 0))
    return total
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
        context.characteristicFixed = this.coc7Config.characteristicFixed
        context.characteristicOptional = this.coc7Config.characteristicOptional
        context.selected = this.coc7Config.selected
        context.total = this.total
        break
      case 'footer':
        context.buttons = []
        context.buttons.push({
          type: 'submit',
          action: 'validate',
          label: 'CoC7.Validate',
          icon: 'fa-solid fa-check'
        })
        break
    }
    return context
  }

  /**
   * Create popup
   * @param {object} options
   * @param {Array} options.characteristicFixed
   * @param {Array} options.characteristicOptional
   * @returns {string}
   */
  static async create ({ characteristicFixed = [], characteristicOptional = [] } = {}) {
    const selected = characteristicOptional[0].key
    return await new Promise(resolve => {
      new CoC7PointSelectionDialog({}, {}, {
        characteristicFixed,
        characteristicOptional,
        selected,
        resolve
      }).render({ force: true })
    })
  }
}
