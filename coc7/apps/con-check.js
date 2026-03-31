/* global ChatMessage CONST foundry fromUuid game renderTemplate ui */
import { FOLDER_ID, STATUS_EFFECTS } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ConCheck {
  #asyncActor
  #callbackContext
  #callbackUuid
  #dicePool
  #isForced
  #isForcedFailure
  #isForcedSuccess
  #stayAlive

  /**
   * Constructor
   */
  constructor () {
    // this.#asyncActor = undefined
    // this.#callbackContext = undefined
    // this.#callbackUuid = undefined
    this.#dicePool = CoC7DicePool.newPool({
      difficulty: CoC7DicePool.difficultyLevel[game.settings.get(FOLDER_ID, 'defaultCheckDifficulty')],
      flatDiceModifier: 0,
      flatThresholdModifier: 0,
      poolModifiers: [0],
      threshold: undefined,
      malfunctionThreshold: undefined
    })
    this.#isForced = false
    this.#isForcedFailure = false
    this.#isForcedSuccess = false
    this.#stayAlive = false
  }

  /**
   * Get actor document promise
   * @returns {Promise<Document>} async Actor
   */
  get actor () {
    return this.#asyncActor
  }

  /**
   * Set actor document from document/uuid
   * @param {string} value
   */
  set actor (value) {
    this.#asyncActor = (typeof value === 'string' && value.length ? fromUuid(value) : undefined)
  }

  /**
   * Is final roll success
   * @returns {boolean}
   */
  get isSuccess () {
    return this.#dicePool.isSuccess
  }

  /**
   * Create message
   * @param {string|Document} actor
   * @param {object} options
   * @param {boolean} options.stayAlive
   * @returns {CoC7ConCheck}
   */
  static async create (actor, { stayAlive = false } = {}) {
    const chatCard = new CoC7ConCheck()
    if (typeof actor === 'string') {
      chatCard.actor = actor
    } else {
      chatCard.actor = CoC7Utilities.getActorUuid(actor)
    }
    chatCard.#stayAlive = stayAlive
    const chatData = await chatCard.getChatData()
    await ChatMessage.create(chatData)
  }

  /**
   * Roll Constitution check and apply conditions
   */
  async rollCon () {
    const actor = (await this.actor)
    this.#dicePool.threshold = actor.system.characteristics.con.value
    await this.#dicePool.roll()
    if (!this.message.blind && !this.isSuccess) {
      if (this.#stayAlive) {
        await actor.conditionsSet([STATUS_EFFECTS.dead])
      } else {
        await actor.conditionsSet([STATUS_EFFECTS.unconscious])
      }
    }
  }

  /**
   * Add luck to existing pool
   * @param {integer} luckSpend
   * @returns {boolean}
   */
  async addLuck (luckSpend) {
    const actor = (await this.actor)
    const newLuck = parseInt(actor.system.attribs.lck.value ?? 0, 10) - parseInt(luckSpend, 10)
    if (newLuck >= 0) {
      if (await actor.spendLuck(luckSpend) !== false) {
        this.#dicePool.luckSpent = this.#dicePool.luckSpent + parseInt(luckSpend, 10)
        return true
      }
    }
    return false
  }

  /**
   * Create Chat Message object
   * @returns {object}
   */
  async getChatData () {
    const actor = (await this.actor)
    const isBlind = (typeof this.message?.blind === 'undefined' ? (CONST.DICE_ROLL_MODES.BLIND === game.settings.get('core', 'rollMode')) : this.message.blind)
    const buttons = {}
    foundry.utils.mergeObject(buttons, this.#dicePool.availableButtons({ luckAvailable: actor?.system.attribs.lck.value ?? 0, isPushable: false, key: 'con' }))
    buttons.addBonus2 = false
    buttons.addBonus1 = false
    buttons.addPenalty2 = false
    buttons.addPenalty1 = false
    if (isBlind) {
      buttons.revealCheck = true
      if (typeof this.#dicePool.threshold !== 'undefined' && !this.#isForced) {
        buttons.forcePass = true
        buttons.forceFail = true
        if (!this.#dicePool.isCritical) {
          buttons.increaseSuccessLevel = true
        }
        if (!this.#dicePool.isFumble) {
          buttons.decreaseSuccessLevel = true
        }
      }
    }
    const data = {
      actorCon: actor?.system.characteristics.con.value ?? this.#dicePool.threshold,
      actorUuid: CoC7Utilities.getActorUuid(actor),
      bonusDice: Math.abs(this.#dicePool.poolModifier),
      bonusType: game.i18n.localize(this.#dicePool.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus'),
      buttons,
      customResult: (this.isSuccess ? 'CoC7.Resist' : (this.#stayAlive ? 'CoC7.Dead' : 'CoC7.Unconsious')),
      diceGroups: this.#dicePool.diceGroups,
      displayResultType: game.settings.get(FOLDER_ID, 'displayResultType'),
      displayCheckSuccessLevel: game.settings.get(FOLDER_ID, 'displayCheckSuccessLevel'),
      foundryGeneration: game.release.generation,
      isBlind,
      isRolled: this.#dicePool.isRolled,
      isUnknownDifficulty: false,
      noThreshold: false
    }
    const chatData = {
      flags: {
        [FOLDER_ID]: {
          load: {
            as: 'CoC7ConCheck',
            actorUuid: data.actorUuid,
            cardOpen: true,
            dicePool: this.#dicePool.toObject(),
            isForced: this.#isForced,
            isForcedFailure: this.#isForcedFailure,
            isForcedSuccess: this.#isForcedSuccess,
            stayAlive: this.#stayAlive
          }
        }
      },
      blind: isBlind,
      rolls: (this.message?.rolls ?? []).concat(this.#dicePool.newRolls),
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/con-check.hbs', data)
    }
    if (typeof this.message?.whisper === 'undefined') {
      if ([CONST.DICE_ROLL_MODES.PRIVATE].includes(game.settings.get('core', 'rollMode'))) {
        chatData.whisper = ChatMessage.getWhisperRecipients('GM')
      }
      chatData.speaker = ChatMessage.getSpeaker({ actor })
    } else {
      chatData.whisper = this.message.whisper
    }

    return chatData
  }

  /**
   * Create CoC7ConCheck from message
   * @param {Document} message
   * @returns {CoC7ConCheck}
   */
  static async loadFromMessage (message) {
    const keys = [
      'actorUuid',
      'isForced',
      'isForcedFailure',
      'isForcedSuccess',
      'stayAlive'
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7ConCheck' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined') && CoC7DicePool.isValidPool(message.flags[FOLDER_ID]?.load?.dicePool)) {
      const check = new CoC7ConCheck()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.actor = load.actorUuid
      check.#dicePool = CoC7DicePool.fromObject(load.dicePool)
      check.#isForced = load.isForced
      check.#isForcedFailure = load.isForcedFailure
      check.#isForcedSuccess = load.isForcedSuccess
      check.#stayAlive = load.stayAlive
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
  }

  /**
   * Create a Chat Message
   */
  async toMessage () {
    const chatData = await this.getChatData()
    this.message = (await ChatMessage.create(chatData))
    this.runCallback()
  }

  /**
   * Save changes to existing Chat Message
   */
  async updateMessage () {
    if (this.message) {
      const diff = foundry.utils.diffObject(this.message.toObject(), await this.getChatData())
      if (!this.message.canUserModify(game.user, 'update')) {
        CoC7SystemSocket.requestKeeperAction({
          type: 'messagePermission',
          messageId: this.message.id,
          who: game.user.id,
          updates: diff
        })
      } else {
        this.message.update(diff)
        this.runCallback()
      }
    }
  }

  /**
   * Run updateRoll callback on callback uuid
   */
  async runCallback () {
    if (this.#callbackUuid) {
      const document = await fromUuid(this.#callbackUuid)
      if (document && typeof document.system.updateRoll === 'function') {
        document.system.updateRoll(this)
      }
    }
  }

  /**
   * When roll is complete / updated trigger callback on uuid
   * @param {string} uuid
   * @param {mixed} context
   */
  setCallback (uuid, context) {
    this.#callbackContext = context
    this.#callbackUuid = uuid
  }

  /**
   * Get context for callback
   * @returns {mixed}
   */
  get callbackContext () {
    return this.#callbackContext
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget?.dataset?.action) {
      case 'rollConCheck':
        {
          const check = await CoC7ConCheck.loadFromMessage(message)
          if (check) {
            await check.rollCon()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'revealCheck':
        {
          const check = await CoC7ConCheck.loadFromMessage(message)
          check.message.blind = false
          check.message.whisper = []
          check.updateMessage()
        }
        break
      case 'increaseSuccessLevel':
        {
          const check = await CoC7ConCheck.loadFromMessage(message)
          check.#dicePool.forceResult({ direction: 1 })
          check.updateMessage()
        }
        break
      case 'decreaseSuccessLevel':
        {
          const check = await CoC7ConCheck.loadFromMessage(message)
          check.#dicePool.forceResult({ direction: -1 })
          check.updateMessage()
        }
        break
      case 'forceFail':
        {
          const check = await CoC7ConCheck.loadFromMessage(message)
          check.#dicePool.forceResult({ successLevel: CoC7DicePool.successLevel.failure })
          check.#isForced = true
          check.#isForcedFailure = true
          check.updateMessage()
        }
        break
      case 'forcePass':
        {
          const check = await CoC7ConCheck.loadFromMessage(message)
          check.#dicePool.forceResult({ successLevel: CoC7DicePool.successLevel.regular })
          check.#isForced = true
          check.#isForcedSuccess = true
          check.updateMessage()
        }
        break
      case 'luck':
        {
          const luckSpend = event.currentTarget?.dataset?.luckSpend
          if (luckSpend) {
            const check = await CoC7ConCheck.loadFromMessage(message)
            if (await check.addLuck(parseInt(luckSpend, 10))) {
              check.updateMessage()
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
    }
  }

  /**
   * Render Chat Message
   * @param {documents.ChatMessage} message
   * @param {HTMLElement} html
   * @param {ApplicationRenderContext} context
   * @param {Array} allowed
   */
  static async _onRenderMessage (message, html, context, allowed) {
    html.querySelectorAll('[data-action]').forEach((element) => {
      if (game.user.isGM || allowed.includes(element.parentElement.dataset.actorUuid)) {
        element.addEventListener('click', event => CoC7ConCheck._onClickEvent(event, message))
      }
    })
  }

  /**
   * Migrate older html
   * @param {object} options
   * @param {integer} options.offset
   * @param {object} options.updates
   * @param {object} options.deleteIds
   */
  static async migrateOlderMessages ({ offset, updates, deleteIds } = {}) {
    const message = game.messages.contents[offset]
    const div = document.createElement('div')
    div.innerHTML = message.content
    const contents = div.children[0]
    if (contents) {
      const actor = ChatMessage.getSpeakerActor(message.speaker)
      let actorUuid = ''
      if (actor) {
        actorUuid = actor.uuid
      } else {
        actorUuid = CoC7Utilities.oldStyleToUuid(message.speaker)
      }
      const update = {
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ConCheck',
        ['flags.' + FOLDER_ID + '.load.actorUuid']: actorUuid,
        ['flags.' + FOLDER_ID + '.load.cardOpen']: true,
        ['flags.' + FOLDER_ID + '.load.dicePool.bonusCount']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.currentPoolModifier']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.difficulty']: CoC7DicePool.difficultyLevel.regular,
        ['flags.' + FOLDER_ID + '.load.dicePool.flatDiceModifier']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.flatThresholdModifier']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.luckSpent']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.groups']: [],
        ['flags.' + FOLDER_ID + '.load.dicePool.penaltyCount']: 0,
        ['flags.' + FOLDER_ID + '.load.dicePool.rolledDice']: [],
        ['flags.' + FOLDER_ID + '.load.dicePool.suppressRollData']: false,
        ['flags.' + FOLDER_ID + '.load.dicePool.threshold']: 0,
        ['flags.' + FOLDER_ID + '.load.isForced']: false,
        ['flags.' + FOLDER_ID + '.load.isForcedFailure']: false,
        ['flags.' + FOLDER_ID + '.load.isForcedSuccess']: false,
        ['flags.' + FOLDER_ID + '.load.stayAlive']: contents.dataset.stayAlive === 'true'
      }
      const contents2 = contents.querySelector('.roll-result')
      if (contents2 && Object.keys(contents2.dataset).length) {
        let baseDie = 0
        let unitDie = Number(contents.querySelector('.unit-die li').dataset.value)
        if (unitDie === 0) {
          unitDie = 10
        }
        const dice = []
        for (const die of contents.querySelectorAll('.ten-dice li')) {
          let value = Number(die.dataset.value)
          if (value === 0) {
            value = 10
          } else {
            value = Math.floor(value / 10)
          }
          if (die.dataset.selected === 'true') {
            baseDie = value
          } else {
            dice.push(value)
          }
        }
        update['flags.' + FOLDER_ID + '.load.dicePool.threshold'] = Number(contents2.dataset.rawValue)
        update['flags.' + FOLDER_ID + '.load.dicePool.rolledDice'].push({
          rolled: true,
          baseDie,
          bonusDice: [],
          penaltyDice: [],
          unitDie
        })
      } else {
        const contents2 = contents.querySelector('button[data-action="roll-con-check"]')
        if (contents2) {
          const match = contents2.textContent.match(/(\d+)%/)
          if (match) {
            update['flags.' + FOLDER_ID + '.load.dicePool.threshold'] = match[1]
          }
        }
        update['flags.' + FOLDER_ID + '.load.dicePool.rolledDice'].push({
          rolled: false,
          baseDie: 0,
          bonusDice: [],
          penaltyDice: [],
          unitDie: 0
        })
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ConCheck.loadFromMessage(merged)
      const chatData = await check.getChatData()
      update.content = chatData.content
      update._id = message.id
      updates.push(update)
    }
  }
}
