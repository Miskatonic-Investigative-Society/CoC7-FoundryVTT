/* global ChatMessage CONFIG FormDataExtended foundry game Roll */
import { FOLDER_ID } from '../constants.js'
import CoC7Utilities from './utilities.js'

export default class CoC7CharacteristicRollDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      handler: CoC7CharacteristicRollDialog.#onSubmit
    },
    position: {
      width: 360
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/char-roll.hbs',
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

    this.element.querySelectorAll('input').forEach((element) => element.addEventListener('keyup', async (event) => {
      this.formKeyFromEvent(event)
      const total = this.totalPoints
      this.element.querySelector('.total-points').innerText = total
      const pointsSummary = this.element.querySelector('.points-summary')
      if (this.pointsWarning) {
        pointsSummary.classList.add('warning')
      } else {
        pointsSummary.classList.remove('warning')
      }
    }))
    this.element.querySelectorAll('.roll-characteristic').forEach((element) => element.addEventListener('click', async (event) => {
      const key = this.formKeyFromEvent(event)
      await this.rollCharacteristic(key)
      this.render({ force: true })
    }))
    this.element.querySelectorAll('.increase-characteristic').forEach((element) => element.addEventListener('click', async (event) => {
      const key = this.formKeyFromEvent(event)
      this.coc7Config.values[key] = Math.min(100, this.coc7Config.values[key] + (CoC7Utilities.isCtrlKey(event) ? 10 : 1))
      this.render({ force: true })
    }))
    this.element.querySelectorAll('.decrease-characteristic').forEach((element) => element.addEventListener('click', async (event) => {
      const key = this.formKeyFromEvent(event)
      this.coc7Config.values[key] = Math.max(0, this.coc7Config.values[key] - (CoC7Utilities.isCtrlKey(event) ? 10 : 1))
      this.render({ force: true })
    }))
    this.element.querySelectorAll('.reset-characteristic').forEach((element) => element.addEventListener('click', async (event) => {
      const key = this.formKeyFromEvent(event)
      this.coc7Config.values[key] = null
      this.render({ force: true })
    }))
  }

  /**
   * Roll Characteristic or luck
   * @param {string} key
   */
  async rollCharacteristic (key) {
    if (key === 'luck' && this.coc7Config.attribs.luck.formula) {
      const roll = await new Roll(this.coc7Config.attribs.luck.formula).roll()
      roll.toMessage({
        flavor: game.i18n.format('CoC7.MessageRollingCharacteristic', {
          label: CoC7Utilities.getAttributeNames('lck')?.label,
          formula: this.coc7Config.attribs.luck.formula
        })
      })
      this.coc7Config.values.luck = roll.total
    } else if (typeof this.coc7Config.characteristics[key] !== 'undefined' && this.coc7Config.characteristics[key].formula) {
      const roll = await new Roll(this.coc7Config.characteristics[key].formula).roll()
      roll.toMessage({
        flavor: game.i18n.format('CoC7.MessageRollingCharacteristic', {
          label: CoC7Utilities.getCharacteristicNames(key)?.label,
          formula: this.coc7Config.characteristics[key].formula
        })
      })
      this.coc7Config.values[key] = roll.total
    }
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    if (event.submitter.dataset.action === 'roll') {
      const rolls = []
      for (const [key, field] of CONFIG.Actor.dataModels.character.schema.getField('characteristics').entries()) {
        if (this.coc7Config.characteristics[key].formula) {
          const roll = await new Roll(this.coc7Config.characteristics[key].formula, {}, { flavor: game.i18n.localize(field.hint) }).roll()
          rolls.push(roll)
          this.coc7Config.values[key] = roll.total
        }
      }
      if (this.coc7Config.attribs.luck.formula) {
        const roll = await new Roll(this.coc7Config.attribs.luck.formula, {}, { flavor: game.i18n.localize(CONFIG.Actor.dataModels.character.schema.getField('attribs').getField('lck').hint) }).roll()
        rolls.push(roll)
        this.coc7Config.values.luck = roll.total
      }
      ChatMessage.create({
        rolls
      })
      this.render({ force: true })
    } else if (event.submitter.dataset.action === 'validate') {
      let okay = Object.values(this.coc7Config.values).every(v => typeof v === 'number')
      if (this.coc7Config.isPoints && this.coc7Config.points !== this.totalPoints) {
        okay = false
      }
      if (okay) {
        this.coc7Config.resolve(this.coc7Config.values)
        this.close()
      }
    }
  }

  /**
   * Are rolls and points valid?
   * @returns {boolean}
   */
  get pointsWarning () {
    return (this.coc7Config.isPoints && this.totalPoints !== this.coc7Config.points) || !Object.values(this.coc7Config.values).every(v => typeof v === 'number')
  }

  /**
   * @inheritdoc
   */
  get title () {
    return game.i18n.localize(this.coc7Config.isPoints ? 'CoC7.SpendPoints' : 'CoC7.RollCharac')
  }

  /**
   * Total characteristic points
   * @returns {int}
   */
  get totalPoints () {
    return Object.keys(this.coc7Config.characteristics).reduce((c, key) => {
      if (key !== 'luck') {
        c += parseInt(this.coc7Config.values[key] ?? 0, 10)
      }
      return c
    }, 0)
  }

  /**
   * Update values and get key from Event
   * @param {Event} event
   * @returns {string}
   */
  formKeyFromEvent (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const form = event.currentTarget.closest('form')
    const formData = new (foundry.applications.ux.FormDataExtended ?? FormDataExtended)(form)
    for (const key in this.coc7Config.values) {
      if (typeof formData.object[key] !== 'undefined' && formData.object[key].toString().length && !isNaN(Number(formData.object[key]))) {
        this.coc7Config.values[key] = Number(formData.object[key])
      } else {
        this.coc7Config.values[key] = null
      }
    }
    return li.dataset.key
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
        context.characteristics = {}
        for (const [key, field] of CONFIG.Actor.dataModels.character.schema.getField('characteristics').entries()) {
          context.characteristics[key] = {
            formula: this.coc7Config.characteristics[key].formula,
            label: field.hint
          }
        }
        context.isPoints = this.coc7Config.isPoints
        context.isRolls = this.coc7Config.isRolls
        context.totalPoints = this.totalPoints
        context.points = this.coc7Config.points
        context.pointsWarning = this.pointsWarning
        context.luck = {
          formula: this.coc7Config.attribs.luck.formula,
          label: CONFIG.Actor.dataModels.character.schema.getField('attribs').getField('lck').hint
        }
        context.values = this.coc7Config.values
        break
      case 'footer':
        context.buttons = []
        if (this.coc7Config.isRolls) {
          context.buttons.push({
            type: 'roll',
            action: 'roll',
            label: 'CoC7.RollDice',
            icon: 'fa-solid fa-dice'
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
   * @param {boolean} options.isPoints
   * @param {boolean} options.isRolls
   * @param {integer} options.points
   * @param {object} options.attribs
   * @param {object} options.characteristics
   * @returns {object}
   */
  static async create ({ isPoints = false, isRolls = false, points = 460, attribs = {}, characteristics = {} } = {}) {
    const values = {
      luck: attribs.luck.value
    }
    for (const key in characteristics) {
      values[key] = characteristics[key].value
    }
    return await new Promise(resolve => {
      new CoC7CharacteristicRollDialog({}, {}, {
        attribs,
        characteristics,
        isPoints,
        isRolls,
        points,
        resolve,
        values
      }).render({ force: true })
    })
  }
}
