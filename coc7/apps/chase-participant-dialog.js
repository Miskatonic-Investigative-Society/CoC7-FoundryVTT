/* global CONFIG DragDrop foundry fromUuid game ui */
import { FOLDER_ID, TARGET_ALLOWED } from '../constants.js'
import CoC7ChaseParticipant from '../models/chase/participant.js'
import CoC7DicePool from './dice-pool.js'
import CoC7RollNormalize from './roll-normalize.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChaseParticipantDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
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
      submitOnChange: true,
      closeOnSubmit: false,
      handler: CoC7ChaseParticipantDialog.#onSubmit
    },
    position: {
      width: 400
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/chase-participant.hbs',
      scrollable: ['']
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  /**
   * Get Title
   * @returns {string}
   */
  get title () {
    return game.i18n.localize(this.coc7Config.isExisting ? 'CoC7.AddActorToChase' : 'CoC7.EditActorOnChase')
  }

  /**
   * Generate a default participant from the chase system dataModel
   * @returns {object}
   */
  static get emptyParticipant () {
    const ClassName = CONFIG.Item.dataModels.chase
    return new ClassName({ participants: [{}] }).participants[0]
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    /* // FoundryVTT V12 */
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dropSelector: '.window-content',
      permissions: {
        drop: game.user.isGM
      },
      callbacks: {
        drop: this._onDropParticipant.bind(this)
      }
    }).bind(this.element)

    /* // FoundryVTT V12 */
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dragSelector: '.chase-token',
      permissions: {
        dragstart: game.user.isGM
      },
      callbacks: {
        dragstart: this._onTokenSelectorDragStart.bind(this)
      }
    }).bind(this.element)

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'resetParticipant':
          this.coc7Config.participant = foundry.utils.duplicate(CoC7ChaseParticipantDialog.emptyParticipant)
          this.render()
          break
        case 'toggleChaser':
          this.coc7Config.participant.chaser = !this.coc7Config.participant.chaser
          this.render()
          break
        case 'rollSpeedCheck':
          {
            let actor = null
            if (this.coc7Config.participant.docUuid) {
              actor = await fromUuid(this.coc7Config.participant.docUuid)
            }
            const listOptions = await CONFIG.Actor.documentClass.everyField(actor)
            const value = listOptions.find(row => row.name === this.coc7Config.participant.speedCheck.name)
            if (value) {
              const config = {
                cardTypeFixed: true,
                cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
                chatMessage: false,
                actor,
                preventStandby: true
              }
              let check
              if (value.value) {
                switch (value.type) {
                  case 'attribs':
                    config.rollType = CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE
                    config.attribute = value.key
                    break
                  case 'characteristics':
                    config.rollType = CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC
                    config.characteristic = value.key
                    break
                  case 'skill':
                    config.rollType = CoC7RollNormalize.ROLL_TYPE.SKILL
                    config.itemUuid = value.uuid
                    break
                }
                check = await CoC7RollNormalize.trigger(config)
              } else {
                config.rollType = CoC7RollNormalize.ROLL_TYPE.MANUAL
                config.threshold = this.coc7Config.participant.speedCheck.score
                config.runRoll = false
                const modified = await CoC7RollNormalize.trigger(config)
                modified.flavor = game.i18n.format('CoC7.CheckResult', {
                  name: value.name,
                  value: modified.threshold.toString() + (modified.flatThresholdModifier !== 0 ? (modified.flatThresholdModifier > 0 ? '+' : '') + modified.flatThresholdModifier.toString() : ''),
                  difficulty: CoC7DicePool.difficultyString(modified.difficulty)
                })
                check = await CoC7RollNormalize.runRoll(modified)
              }
              const chatData = await check.getChatData()
              delete chatData.content
              for (const offset in chatData.rolls) {
                chatData.rolls[offset] = JSON.stringify(chatData.rolls[offset])
              }
              this.coc7Config.participant.speedCheck.checkData = chatData
              this.render()
            }
          }
          break
      }
    }))
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onTokenSelectorDragStart (event) {
    const dragData = {
      type: 'CoC7GetToken',
      appId: this.id,
      callback: 'addTokenToChase'
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
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
        context.isExisting = this.coc7Config.isExisting
        context.actor = null
        if (this.coc7Config.participant.docUuid) {
          const actor = await fromUuid(this.coc7Config.participant.docUuid)
          if (actor) {
            context.actor = actor
          }
        }
        context.listOptions = await CONFIG.Actor.documentClass.everyField(context.actor)
        if (this.coc7Config.participant.docUuid) {
          const value = context.listOptions.find(row => row.name === this.coc7Config.participant.initiative)
          if (value?.value) {
            context.initReadOnly = true
          }
        }
        if (this.coc7Config.participant.docUuid) {
          const value = context.listOptions.find(row => row.name === this.coc7Config.participant.speedCheck.name)
          if (value?.value) {
            context.speedCheckReadOnly = true
          }
        }
        context.participant = new CoC7ChaseParticipant([this.coc7Config.participant], 0)
        context.runSpeedCheck = await context.participant.runSpeedCheck()
        break
      case 'footer':
        context.buttons = [{
          type: 'submit',
          action: 'close',
          label: 'Cancel',
          icon: 'fa-solid fa-times'
        }, {
          type: 'submit',
          action: 'update',
          label: (this.coc7Config.isExisting ? 'CoC7.Update' : 'CoC7.Add'),
          icon: (this.coc7Config.isExisting ? 'fa-solid fa-user-edit' : 'fa-solid fa-user-plus')
        }]
        break
    }
    return context
  }

  /**
   * Process dropped Actor
   * @param {DropEvent} event
   */
  async _onDropParticipant (event) {
    const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (dataList?.type === 'Actor' && typeof dataList.uuid === 'string') {
      const document = await fromUuid(dataList.uuid)
      if (TARGET_ALLOWED.includes((document?.actor ?? document)?.type)) {
        this.coc7Config.participant = await CoC7ChaseParticipantDialog.createParticipant(await CoC7Utilities.getActorUuid(document))
        await this.render()
      }
    }
  }

  /**
   * If tokens contains one allowed actor replace participant
   * @param {Array} tokens
   */
  async addTokenToChase (tokens) {
    const found = tokens.filter(doc => TARGET_ALLOWED.includes(doc.actor.type))
    if (found.length === 1) {
      this.coc7Config.participant = await CoC7ChaseParticipantDialog.createParticipant(await CoC7Utilities.getActorUuid(found[0]))
      await this.render()
    } else {
      ui.notifications.warn(game.i18n.localize('CoC7.ErrorTokenIncorrect'))
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
    switch (event.submitter?.dataset.action) {
      case 'update':
        {
          const chase = await fromUuid(this.coc7Config.chaseUuid)
          if (chase) {
            const participant = new CoC7ChaseParticipant([this.coc7Config.participant], 0)
            if (participant.adjustedMov < 1) {
              ui.notifications.warn('CoC7.DoesNotMeetMinimumReqToBeAdded', { localize: true })
              return
            }
            chase.system.addParticipant(this.coc7Config.participant, {
              locationId: this.coc7Config.locationId
            })
          }
          this.close()
        }
        return
    }
    let actor = null
    if (this.coc7Config.participant.docUuid) {
      actor = await fromUuid(this.coc7Config.participant.docUuid)
    }
    const listOptions = await CONFIG.Actor.documentClass.everyField(actor)
    const replacements = {}
    for (const key in formData.object) {
      if (key === 'participant.speedCheck.name' && this.coc7Config.participant.speedCheck.name !== formData.object[key]) {
        replacements['participant.speedCheck.score'] = await CoC7ChaseParticipant.getPercentValue(actor, listOptions, formData.object[key])
      } else if (key === 'participant.initiative' && this.coc7Config.participant.speedCheck.name !== formData.object[key]) {
        replacements['participant.dex'] = await CoC7ChaseParticipant.getPercentValue(actor, listOptions, formData.object[key])
      }
      foundry.utils.setProperty(this.coc7Config, key, formData.object[key])
    }
    for (const key in replacements) {
      foundry.utils.setProperty(this.coc7Config, key, replacements[key])
    }
    this.render()
  }

  /**
   * Create empty participant or from actor
   * @param {string} uuid
   * @returns {object|false}
   */
  static async createParticipant (uuid) {
    const actor = await fromUuid(uuid)
    if (TARGET_ALLOWED.includes((actor?.actor ?? actor)?.type)) {
      return foundry.utils.mergeObject(CoC7ChaseParticipantDialog.emptyParticipant, {
        docUuid: uuid,
        name: (actor?.actor ?? actor)?.name ?? '',
        dex: (actor?.actor ?? actor)?.system.characteristics.dex.value ?? 0,
        mov: (actor?.actor ?? actor)?.system.attribs.mov.value ?? 0,
        // If actor is controlled by GM only we assume he is a chaser
        chaser: (actor?.actor ?? actor)?.owners.length === 0,
        speedCheck: {
          score: (actor?.actor ?? actor)?.system.characteristics.con.value ?? 0
        }
      }, { inplace: false })
    }
    return false
  }

  /**
   * Create popup
   * @param {object} options
   * @param {string} options.chaseUuid
   * @param {string} options.locationId
   * @param {object} options.dropData
   * @param {object} options.participant
   */
  static async create ({ chaseUuid, locationId, dropData, participant } = {}) {
    const isExisting = typeof participant !== 'undefined'
    if (typeof dropData !== 'undefined') {
      if (typeof dropData.type !== 'string' || typeof dropData.uuid !== 'string') {
        return
      }
      if (!['Actor', 'Token'].includes(dropData.type)) {
        return
      }
      participant = await CoC7ChaseParticipantDialog.createParticipant(dropData.uuid)
      if (participant === false) {
        return
      }
    } else if (!isExisting) {
      participant = foundry.utils.duplicate(CoC7ChaseParticipantDialog.emptyParticipant)
    }
    new CoC7ChaseParticipantDialog({}, {}, {
      chaseUuid,
      isExisting,
      locationId,
      participant
    }).render({ force: true })
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
}
