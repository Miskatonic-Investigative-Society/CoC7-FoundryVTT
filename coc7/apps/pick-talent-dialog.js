import { FOLDER_ID } from '../constants.js'

export default class CoC7PickTalentDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
    classes: ['coc7-sheet'],
    window: {
      title: 'CoC7.SelectRelevantTalent',
      contentClasses: [
        'standard-form'
      ]
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7PickTalentDialog.#onSubmit
    },
    position: {
      width: 360
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/pick-talent.hbs',
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
   * @returns {Promise<Array>}
   */
  static async #onSubmit (event, form, formData) {
    if (event.submitter?.dataset?.property === 'enabled') {
      this.coc7Config.options[event.submitter.closest('.talent-order').dataset.index].enabled = !this.coc7Config.options[event.submitter.closest('.talent-order').dataset.index].enabled
      this.render({ force: true })
      return
    }
    this.coc7Config.resolved = true
    if (event.submitter?.dataset?.action === 'validate') {
      this.coc7Config.resolve(this.coc7Config.output)
    } else {
      this.coc7Config.resolve({
        spentLuck: 0,
        reductionValue: 0
      })
    }
    this.close()
  }

  /**
   * @inheritdoc
   */
  async close (...options) {
    if (!this.coc7Config.resolved) {
      this.coc7Config.resolve({
        spentLuck: 0,
        reductionValue: 0
      })
    }
    super.close(...options)
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)
    context.talents = []
    context.lossName = this.coc7Config.lossName
    context.luck = 0
    context.loss = 0
    for (const option of this.coc7Config.options) {
      if (typeof option.talent !== 'undefined') {
        context.talents.push({
          html: await foundry.applications.ux.TextEditor.implementation.enrichHTML(option.talent.link, { async: true }),
          ratio: option.talent.system.adjustments.find(row => row.type === this.coc7Config.adjustmentType)?.config.type === 'ratio',
          luck: option.luck,
          enabled: option.enabled
        })
      } else {
        context.talents.push({
          html: option.html(Math.max(0, this.coc7Config.lossMax - context.loss), option.luck),
          ratio: option.ratio,
          luck: option.luck,
          enabled: option.enabled
        })
      }
      if (option.enabled) {
        const offsets = (option.talent?.system ?? option).getLuckAndReduction(this.coc7Config.adjustmentType, Math.max(0, this.coc7Config.lossMax - context.loss), option.luck)
        context.luck += offsets.luck
        context.loss += offsets.loss
      }
    }
    context.loss = Math.min(context.loss, this.coc7Config.lossMax)

    this.coc7Config.output.spentLuck = context.luck
    this.coc7Config.output.reductionValue = context.loss

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
      case 'form':
        break
      case 'footer':
        if (context.luck === 0) {
          context.buttons = [{
            type: 'submit',
            action: 'close',
            label: game.i18n.format('CoC7.TakeLoss', { loss: Math.max(0, this.coc7Config.lossMax - context.loss) }),
            icon: 'fa-solid fa-ban'
          }]
        } else {
          const enoughLuck = parseInt(this.coc7Config.actor.system.attribs.lck.value ?? 0, 10) < context.luck
          context.buttons = [{
            type: 'submit',
            action: 'validate',
            disabled: (enoughLuck),
            label: (enoughLuck ? 'CoC7.NotEnoughLuck' : game.i18n.format('CoC7.TakeLoss', { loss: Math.max(0, this.coc7Config.lossMax - context.loss) })),
            icon: (enoughLuck ? 'fa-solid fa-times' : 'fa-solid fa-check')
          }]
        }
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('.talent-order > div[draggable]').forEach((element) => element.addEventListener('dragstart', (event) => {
      event.preventDefault()
      event.stopPropagation()
    }))
    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'modify-luck':
          {
            const index = event.currentTarget.closest('.talent-order').dataset.index
            const by = parseInt(event.currentTarget.dataset.by, 10)
            if (index && by && typeof this.coc7Config.options[index]?.luck === 'number') {
              let value = Math.max(0, Number(this.coc7Config.options[index].luck) + by)
              this.coc7Config.options[index].luck = value
              this.render()
            }
          }
          break
      }
    }))
    new foundry.applications.ux.DragDrop({
      dragSelector: '.talent-order',
      dropSelector: '.talent-order',
      permissions: {
        dragstart: true,
        drop: true
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDragDrop.bind(this)
      }
    }).bind(this.element)
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onDragStart (event) {
    const data = {
      type: 'CoC7TalentOrderList',
      index: Number(event.currentTarget.dataset.index)
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * Process dropped characteristic values or skill Items
   * @param {DropEvent} event
   */
  _onDragDrop (event) {
    const indexDrop = Number(event.currentTarget.dataset.index)
    const dataString = event.dataTransfer.getData('text/plain')
    const dropData = JSON.parse(dataString)
    if (dropData.type === 'CoC7TalentOrderList' && dropData.index !== indexDrop) {
      const dragged = this.coc7Config.options.splice(dropData.index, 1)
      this.coc7Config.options.splice(indexDrop, 0, ...dragged)
      this.render()
    }
  }

  /**
   * Create popup
   * @param {object} options
   * @param {Array} options.options
   * @param {string} options.adjustmentType
   * @param {string} options.actorUuid
   * @param {string} options.lossName
   * @param {int} options.lossMax
   * @returns {Promise<object>}
   */
  static async create ({ options = [], adjustmentType = '', actorUuid = '', lossName = '', lossMax = 0 } = {}) {
    const actor = await fromUuid(actorUuid)
    if (!actor) {
      return []
    }
    // options Array of
    //   enabled: false,
    //   luck: 0, // If ratio how much luck
    //   ? From talent
    //     talent: CoC7ModelsItemDocumentClass
    //   ? Not from talent
    //     ratio: false, // is a luck:loss ratio
    //     html: (loss, luck) => string,
    //     getLuckAndReduction: (type, maxLoss, luck) => { luck: 0, loss: 0 }
    return await new Promise(resolve => {
      new CoC7PickTalentDialog({}, {}, {
        options,
        adjustmentType,
        actor,
        lossName,
        lossMax,
        resolved: false,
        output: {
          spentLuck: 0,
          reductionValue: 0
        },
        resolve
      }).render({ force: true })
    })
  }
}
