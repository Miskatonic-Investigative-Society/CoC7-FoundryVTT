/* global Actor foundry game */
import { FOLDER_ID } from '../constants.js'

export default class CoC7CreateMythosEncounter extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      ],
      title: 'CoC7.SanityLossTypeDialogTitle'
    },
    form: {
      closeOnSubmit: true,
      handler: CoC7CreateMythosEncounter.#onSubmit
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/sanity-loss-type.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
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
        context.isImmunity = this.coc7Config.type === 'immunity'
        context.encounterTypes = [
          {
            key: 'encounter',
            label: 'CoC7.SanityLossEncounter'
          },
          {
            key: 'immunity',
            label: 'CoC7.SanityLossImmunity'
          }
        ]
        context.name = this.coc7Config.name
        context.type = this.coc7Config.type
        context.value = this.coc7Config.value
        break
      case 'footer':
        context.buttons = [{
          type: 'submit',
          action: 'close',
          label: 'CoC7.Cancel',
          icon: 'fa-solid fa-ban'
        }, {
          type: 'submit',
          action: 'update',
          label: 'CoC7.Add',
          icon: 'fa-solid fa-check'
        }]
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
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelector('select[name=type]')?.addEventListener('change', (event) => {
      this.coc7Config.type = event.target.value
      this.render({ force: true })
    })
    this.element.querySelectorAll('input').forEach((element) => element.addEventListener('keyup', async (event) => {
      this.coc7Config[event.target.name] = event.target.value
    }))
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    const sanityLossEvents = this.coc7Config.actor.system.sanityLossEvents ?? []
    const immunity = (formData.object.type === 'immunity')
    const totalLoss = (immunity ? 0 : parseInt(formData.object.value, 10))
    sanityLossEvents.push({
      type: formData.object.name,
      totalLoss,
      immunity
    })
    sanityLossEvents.sort(function (left, right) {
      return left.type.localeCompare(right.type)
    })
    this.coc7Config.actor.update({ 'system.sanityLossEvents': sanityLossEvents })
  }

  /**
   * Create dialog
   * @param {object} options
   * @param {Document} options.actor
   * @param {string} options.type
   */
  static async create ({ actor, type } = {}) {
    if (actor instanceof Actor && ['encounter', 'immunity'].includes(type)) {
      new CoC7CreateMythosEncounter({}, {}, {
        actor,
        type
      }).render({ force: true })
    }
  }
}
