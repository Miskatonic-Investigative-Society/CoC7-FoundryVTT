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
      this.coc7Config.picked[event.submitter.dataset.id] = !this.coc7Config.picked[event.submitter.dataset.id]
      this.render({ force: true })
      return
    }
    this.coc7Config.resolved = true
    if (event.submitter?.dataset?.action === 'validate') {
      this.coc7Config.resolve(this.coc7Config.talents.filter(doc => this.coc7Config.picked[doc.id] === true))
    } else {
      this.coc7Config.resolve([])
    }
    this.close()
  }

  /**
   * @inheritdoc
   */
  async close (...options) {
    if (!this.coc7Config.resolved) {
      this.coc7Config.resolve([])
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
        context.talents = []
        context.name = this.coc7Config.name
        context.luck = 0
        context.loss = 0
        for (const doc of this.coc7Config.talents) {
          const enabled = this.coc7Config.picked[doc.id] === true
          context.talents.push({
            link: await foundry.applications.ux.TextEditor.implementation.enrichHTML(doc.link, { async: true }),
            enabled: enabled,
            id: doc.id
          })
          if (enabled) {
            const offsets = doc.system.getLuckAndReduction(this.coc7Config.type, this.coc7Config.maxLoss)
            context.luck += offsets.luck
            context.loss += offsets.loss
          }
        }
        context.loss = Math.min(context.loss, this.coc7Config.maxLoss)
        break
      case 'footer':
        if (context.luck === 0) {
          context.buttons = [{
            type: 'submit',
            action: 'close',
            label: 'CoC7.Migrate.ButtonSkip',
            icon: 'fa-solid fa-ban'
          }]
        } else {
          const enoughLuck = parseInt(this.coc7Config.actor.system.attribs.lck.value ?? 0, 10) < context.luck
          context.buttons = [{
            type: 'submit',
            action: 'validate',
            disabled: (enoughLuck),
            label: (enoughLuck ? 'CoC7.NotEnoughLuck' : 'CoC7.Validate'),
            icon: (enoughLuck ? 'fa-solid fa-times' : 'fa-solid fa-check')
          }]
        }
        break
    }
    return context
  }

  /**
   * Create popup
   * @param {object} options
   * @param {Array} options.talents
   * @param {string} options.type
   * @param {string} options.name
   * @param {string} options.actorUuid
   * @param {int} options.maxLoss
   * @returns {Promise<Array>}
   */
  static async create ({ talents = [], type = '', name = '', actorUuid = '', maxLoss = 0 } = {}) {
    const actor = await fromUuid(actorUuid)
    if (!actor) {
      return []
    }
    return await new Promise(resolve => {
      new CoC7PickTalentDialog({}, {}, {
        talents,
        type,
        name,
        actor,
        maxLoss,
        picked: {},
        resolved: false,
        resolve
      }).render({ force: true })
    })
  }
}
