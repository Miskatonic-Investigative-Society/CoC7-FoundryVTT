/* global foundry game */
import { FOLDER_ID } from '../constants.js'

export default class CoC7SkillSpecializationSelectDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      closeOnSubmit: false,
      handler: CoC7SkillSpecializationSelectDialog.#onSubmit
    },
    position: {
      width: 410
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/skill-specialization-select.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * @inheritdoc
   */
  get title () {
    return game.i18n.format('CoC7.SkillSpecSelectTitle', {
      specialization: this.coc7Config.specializationName
    })
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelector('select[name=existing-skill]')?.addEventListener('change', (event) => {
      this.coc7Config.selected = event.currentTarget.value
      this.render({ force: true })
    })
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    if (event.submitter.dataset.action === 'validate') {
      const submitData = foundry.utils.expandObject(formData.object)
      const resolved = {
        selected: submitData['existing-skill'] ?? '',
        name: submitData['new-skill-name'] ?? '',
        baseValue: submitData['base-value'] ?? ''
      }
      if (resolved.selected === '' && resolved.name === '') {
        return
      }
      this.coc7Config.resolve(resolved)
    }
    this.coc7Config.resolve(false)
    this.coc7Config.resolved = true
    this.close()
  }

  /**
   * @inheritdoc
   */
  async close (...options) {
    if (!this.coc7Config.resolved) {
      this.coc7Config.resolve(false)
    }
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
        context.allowCustom = this.coc7Config.allowCustom
        context.allowSelect = this.coc7Config.allowSelect
        context.baseValue = this.coc7Config.baseValue
        context.fixedBaseValue = this.coc7Config.fixedBaseValue
        context.label = this.coc7Config.label
        context.name = this.coc7Config.name
        context.selected = this.coc7Config.selected
        context.skills = this.coc7Config.skills.map(d => { return { id: d._id, name: d.name } })
        break
      case 'footer':
        context.buttons = []
        if (this.coc7Config.allowSkip) {
          context.buttons.push({
            type: 'submit',
            action: 'close',
            label: 'CoC7.Migrate.ButtonSkip',
            icon: 'fa-solid fa-ban'
          })
        }
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
   * @param {Array} options.skills
   * @param {bool} options.allowCustom
   * @param {bool} options.fixedBaseValue
   * @param {string} options.specializationName
   * @param {string} options.label
   * @param {null|int} options.baseValue
   * @param {bool} options.allowSkip
   * @returns {object}
   */
  static async create ({ skills = [], allowCustom = false, fixedBaseValue = false, specializationName = '', label = '', baseValue = null, allowSkip = true } = {}) {
    return await new Promise(resolve => {
      new CoC7SkillSpecializationSelectDialog({}, {}, {
        allowCustom,
        allowSelect: skills.length > 0,
        allowSkip,
        baseValue,
        fixedBaseValue,
        label,
        name: '',
        resolve,
        resolved: false,
        selected: '',
        skills,
        specializationName
      }).render({ force: true })
    })
  }
}
