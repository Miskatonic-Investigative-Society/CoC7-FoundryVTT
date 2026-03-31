/* global foundry game */
import { FOLDER_ID } from '../constants.js'

export default class CoC7SkillSelectionDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      width: 360
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/skill-select.hbs',
      scrollable: ['']
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

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
      this.coc7Config.selected[event.currentTarget.dataset.id] = true
      if (Object.keys(this.coc7Config.selected).length === this.coc7Config.optionsCount) {
        this.coc7Config.resolve(this.coc7Config.selected)
        this.close()
        return
      }
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
        context.selected = this.coc7Config.selected
        context.selectedCount = Object.keys(this.coc7Config.selected).length
        context.optionsCount = this.coc7Config.optionsCount
        context.skills = this.coc7Config.skills
        break
    }

    return context
  }

  /**
   * @inheritdoc
   */
  get title () {
    return this.coc7Config.title
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
   * Create popup
   * @param {object} options
   * @param {Array} options.skills
   * @param {int} options.optionsCount
   * @param {string} options.title
   * @returns {object}
   */
  static async create ({ skills = [], optionsCount = 0, title = '' } = {}) {
    if (title === '') {
      title = game.i18n.localize('CoC7.SkillSelectionWindow')
    }
    return await new Promise(resolve => {
      new CoC7SkillSelectionDialog({}, {}, {
        selected: {},
        optionsCount,
        resolve,
        skills,
        title
      }).render({ force: true })
    })
  }
}
