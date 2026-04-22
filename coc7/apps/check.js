/* global ChatMessage CONST foundry fromUuid game renderTemplate ui */
import { FOLDER_ID } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7ModelsItemSkillSystem from '../models/item/skill-system.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7Check {
  #allowPush
  #appliedDevelopment
  #asyncActor
  #callbackContext
  #callbackUuid
  #cardOpen
  #customFlavor
  #dicePool
  #isCombat
  #isForced
  #isForcedFailure
  #isForcedSuccess
  #isStandby
  #key
  #rollMode
  #standbyRightIcon
  #type

  /**
   * Constructor
   */
  constructor () {
    this.#allowPush = true
    this.#appliedDevelopment = false
    // this.#asyncActor = undefined
    // this.#callbackContext = undefined
    // this.#callbackUuid = undefined
    this.#cardOpen = true
    this.#customFlavor = false
    this.#dicePool = CoC7DicePool.newPool({
      difficulty: CoC7DicePool.difficultyLevel[game.settings.get(FOLDER_ID, 'defaultCheckDifficulty')],
      flatDiceModifier: 0,
      flatThresholdModifier: 0,
      poolModifiers: [0],
      threshold: undefined,
      malfunctionThreshold: undefined
    })
    this.#isCombat = false
    this.#isForced = false
    // this.item = undefined
    this.#isForcedFailure = false
    this.#isForcedSuccess = false
    this.isInitiativeRoll = false
    this.#isStandby = false
    // this.#key = undefined
    // this.message = undefined
    this.#rollMode = game.settings.get('core', 'rollMode')
    this.#standbyRightIcon = ''
    // this.#type = undefined
  }

  /**
   * Value Type
   * @returns {object}
   */
  static get type () {
    return {
      characteristic: 'characteristic',
      attribute: 'attribute',
      skill: 'skill',
      item: 'item',
      value: 'value'
    }
  }

  /**
   * Create CoC7Check from message
   * @param {Document} message
   * @returns {CoC7Check}
   */
  static async loadFromMessage (message) {
    const keys = [
      // 'actorUuid' - not needed for manual roll
      'allowPush',
      'appliedDevelopment',
      // 'callbackContext' - not always set
      // 'callbackUuid' - not always set
      'cardOpen',
      'customFlavor',
      'dicePool',
      'isCombat',
      'isForced',
      'isForcedFailure',
      'isForcedSuccess',
      'isStandby',
      // 'key' - not needed for manual roll
      'rollMode',
      'standbyRightIcon'
      // 'type' - not needed for manual roll
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7Check' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined') && CoC7DicePool.isValidPool(message.flags[FOLDER_ID]?.load?.dicePool)) {
      const check = new CoC7Check()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.actor = load.actorUuid
      check.#allowPush = load.allowPush
      check.#appliedDevelopment = load.appliedDevelopment
      check.#callbackContext = load.callbackContext
      check.#callbackUuid = load.callbackUuid
      check.#cardOpen = load.cardOpen
      check.#customFlavor = load.customFlavor
      check.#dicePool = CoC7DicePool.fromObject(load.dicePool)
      check.#isCombat = load.isCombat
      check.#isForced = load.isForced
      check.#isForcedFailure = load.isForcedFailure
      check.#isForcedSuccess = load.isForcedSuccess
      check.#isStandby = load.isStandby
      check.#key = load.key
      check.#rollMode = load.rollMode
      check.#standbyRightIcon = load.standbyRightIcon
      check.#type = load.type
      switch (check.#type) {
        case CoC7Check.type.skill:
        case CoC7Check.type.item:
          check.item = await fromUuid(check.#key)
          break
      }
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
  }

  /**
   * Render Chat Message
   * @param {documents.ChatMessage} message
   * @param {HTMLElement} html
   * @param {ApplicationRenderContext} context
   * @param {Array} allowed
   */
  static async _onRenderMessage (message, html, context, allowed) {
    if (!game.user.isGM) {
      // The FoundryVTT v13 blind replaces the content replace ?? with Success / Failure if set
      if (message.blind === true) {
        ;[...html.querySelectorAll('div.dice-roll')].splice(message.flags?.[FOLDER_ID]?.load.dicePool.rolledDice.length).forEach(e => e.remove())
        if (message.flags?.[FOLDER_ID]?.load.isForced !== false) {
          html.querySelectorAll('.dice-total').forEach((element) => {
            if (element.innerHTML === '?') {
              if (message.flags?.[FOLDER_ID]?.load.isForcedFailure) {
                element.innerHTML = game.i18n.localize('CoC7.Failure')
                element.classList.add('fumble')
              } else if (message.flags?.[FOLDER_ID]?.load.isForcedSuccess) {
                element.innerHTML = game.i18n.localize('CoC7.Success')
                element.classList.add('critical')
              }
            }
          })
        }
      }
    }
    if (game.user.isGM || allowed.length) {
      html.querySelectorAll('button[data-action]').forEach((element) => {
        if (game.user.isGM || allowed.includes(element.parentElement.dataset.actorUuid)) {
          element.addEventListener('click', event => CoC7Check._onClickEvent(event, message))
        }
      })
    }
  }

  /**
   * Get actor promise
   * @returns {Promise<Document>} async Actor
   */
  get actor () {
    return this.#asyncActor
  }

  /**
   * Set actor from uuid
   * @param {string} value
   */
  set actor (value) {
    this.#asyncActor = (value ? fromUuid(value) : undefined)
  }

  /**
   * Get is blind
   * @returns {bool}
   */
  get blind () {
    return this.#rollMode === CONST.DICE_ROLL_MODES.BLIND
  }

  /**
   * Set roll mode
   * @param {boolean|string} value
   */
  set blind (value) {
    if (value === true) {
      this.#rollMode = CONST.DICE_ROLL_MODES.BLIND
    } else if (value === false && this.#rollMode === CONST.DICE_ROLL_MODES.BLIND) {
      this.#rollMode = CONST.DICE_ROLL_MODES.PUBLIC
    } else if (value !== false) {
      this.#rollMode = value
    }
  }

  /**
   * Set difficulty level
   * @param {integer} value
   */
  set difficulty (value) {
    this.#dicePool.difficulty = parseInt(value, 10)
  }

  /**
   * Get difficulty level
   * @returns {integer}
   */
  get difficulty () {
    return this.#dicePool.difficulty
  }

  /**
   * Set flat dice modifier
   * @param {integer} value
   */
  set flatDiceModifier (value) {
    this.#dicePool.flatDiceModifier = parseInt(value, 10)
  }

  /**
   * Get flat dice modifier
   * @returns {integer}
   */
  get flatDiceModifier () {
    return this.#dicePool.flatDiceModifier
  }

  /**
   * Set flat threshold modifier
   * @param {integer} value
   */
  set flatThresholdModifier (value) {
    this.#dicePool.flatThresholdModifier = parseInt(value, 10)
  }

  /**
   * Get flat threshold modifier
   * @returns {integer}
   */
  get flatThresholdModifier () {
    return this.#dicePool.flatThresholdModifier
  }

  /**
   * Set a custom flavor text
   * @param {string} value
   */
  set flavor (value) {
    this.#customFlavor = value
  }

  /**
   * Get roll name
   * @returns {string}
   */
  get name () {
    switch (this.#type) {
      case CoC7Check.type.attribute:
        return CoC7Utilities.getAttributeNames(this.#key)?.label
      case CoC7Check.type.characteristic:
        return CoC7Utilities.getCharacteristicNames(this.#key)?.label
      case CoC7Check.type.skill:
      case CoC7Check.type.item:
        if (this.item) {
          return this.item.name
        }
        break
    }
    return ''
  }

  /**
   * Get roll flavor text
   * @returns {string}
   */
  get flavor () {
    if (this.#customFlavor) {
      return this.#customFlavor
    }
    let flavor = ''
    switch (this.#type) {
      case CoC7Check.type.attribute:
      case CoC7Check.type.characteristic:
      case CoC7Check.type.skill:
        flavor = game.i18n.format('CoC7.CheckResult', {
          name: this.name,
          value: this.#dicePool.thresholdString,
          difficulty: CoC7DicePool.difficultyString(this.#dicePool.difficulty)
        })
        break
      case CoC7Check.type.item:
        flavor = game.i18n.format('CoC7.ItemCheckResult', {
          item: this.name,
          skill: this.item?.system.skillMain?.name ?? '',
          value: this.#dicePool.thresholdString,
          difficulty: CoC7DicePool.difficultyString(this.#dicePool.difficulty)
        })
        break
      case CoC7Check.type.value:
        flavor = game.i18n.format('CoC7.CheckRawValue', {
          rawvalue: this.#dicePool.thresholdString,
          difficulty: CoC7DicePool.difficultyString(this.#dicePool.difficulty)
        })
        break
    }
    return flavor
  }

  /**
   * Set is combat
   * @param {boolean} value
   */
  set isCombat (value) {
    this.#isCombat = value === true
  }

  /**
   * Get is combat
   * @returns {boolean}
   */
  get isCombat () {
    return this.#isCombat
  }

  /**
   * Is Rolled?
   * @returns {boolean}
   */
  get isRolled () {
    return this.#dicePool.isRolled
  }

  /**
   * Number of bonus or penalty dice
   * @param {integer} value
   */
  set poolModifier (value) {
    this.#dicePool.poolModifier = parseInt(value, 10)
  }

  /**
   * Number of bonus or penalty dice
   * @returns {integer}
   */
  get poolModifier () {
    return this.#dicePool.poolModifier
  }

  /**
   * Prompt for user to perform roll
   * @returns {boolean}
   */
  get standby () {
    return this.#isStandby
  }

  /**
   * Prompt for user to perform roll
   * @param {boolean} value
   */
  set standby (value) {
    this.#isStandby = (value === true)
  }

  /**
   * Image to use on right of standby
   * @returns {string}
   */
  get standbyRightIcon () {
    return this.#standbyRightIcon
  }

  /**
   * Image to use on right of standby
   * @param {string} value
   */
  set standbyRightIcon (value) {
    this.#standbyRightIcon = value
  }

  /**
   * Check if result should flag skill for development (or unflag if the messaged flagged it but didn't dice added)
   */
  async flagForDevelopment () {
    if (game.settings.get(FOLDER_ID, 'xpEnabled')) {
      let value
      if (this.#dicePool.difficulty !== CoC7DicePool.difficultyLevel.unknown && !!this.item && this.item.system instanceof CoC7ModelsItemSkillSystem && !this.item.system.properties.noxpgain) {
        if (this.#rollMode !== CONST.DICE_ROLL_MODES.BLIND && !this.#isForced && !this.#appliedDevelopment) {
          if (this.item.system.flags.developement === false && this.#dicePool.isRolledSuccess) {
            value = true
          }
        } else if (this.item.system.flags.developement === true && !this.#dicePool.isRolledSuccess) {
          value = false
        }
      }
      if (value === true || value === false) {
        this.#appliedDevelopment = value
        await CoC7Utilities.messageRollFlagForDevelopment(this.message.id, this.item, value)
      }
    }
  }

  /**
   * Create Message Data object
   * @returns {object}
   */
  async getTemplateData () {
    const buttons = {}
    const actor = (await this.#asyncActor)
    const diceGroups = this.#dicePool.diceGroups
    if (!this.#isStandby && this.#cardOpen) {
      switch (diceGroups.length) {
        case 0:
          ui.notifications.warn('CoC7.Errors.UnparsableDice', { localize: true })
          throw new Error('No Dice')
        case 1:
          foundry.utils.mergeObject(buttons, this.#dicePool.availableButtons({ luckAvailable: actor?.system.attribs.lck.value ?? 0, isPushable: this.#allowPush, key: this.#key }))
          if (this.#rollMode === CONST.DICE_ROLL_MODES.BLIND) {
            if (this.#dicePool.difficulty !== CoC7DicePool.difficultyLevel.unknown) {
              buttons.revealCheck = true
            }
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
            if (!!this.item && this.item.system instanceof CoC7ModelsItemSkillSystem && !this.item.system.properties.noxpgain && !this.item.system.flags.developement) {
              buttons.flagForDevelopment = true
            }
          }
          break
      }
    }
    const thresholdRanges = CoC7DicePool.thresholdRanges(this.#dicePool.threshold, this.#dicePool.flatThresholdModifier)
    const data = {
      actorImg: (actor ? (actor.isToken ? actor.token.texture.src : actor.img) : ''),
      actorName: (actor ? (actor.isToken ? actor.token.name : actor.name) : ''),
      actorUuid: actor?.uuid,
      bonusDice: Math.abs(this.#dicePool.poolModifier),
      bonusType: game.i18n.localize(this.#dicePool.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus'),
      buttons,
      cardOpen: this.#cardOpen,
      diceGroups,
      difficulty: this.#dicePool.difficulty,
      difficultyLevels: [
        {
          difficulty: CoC7DicePool.difficultyLevel.regular,
          name: 'CoC7.RollDifficultyRegular',
          title: 'CoC7.RollDifficultyRegularTitle',
          threshold: thresholdRanges[CoC7DicePool.difficultyLevel.regular]?.[1] ?? null
        },
        {
          difficulty: CoC7DicePool.difficultyLevel.hard,
          name: 'CoC7.RollDifficultyHard',
          title: 'CoC7.RollDifficultyHardTitle',
          threshold: thresholdRanges[CoC7DicePool.difficultyLevel.hard]?.[1] ?? null
        },
        {
          difficulty: CoC7DicePool.difficultyLevel.extreme,
          name: 'CoC7.RollDifficultyExtreme',
          title: 'CoC7.RollDifficultyExtremeTitle',
          threshold: thresholdRanges[CoC7DicePool.difficultyLevel.extreme]?.[1] ?? null
        },
        {
          difficulty: CoC7DicePool.difficultyLevel.critical,
          name: 'CoC7.RollDifficultyCritical',
          title: 'CoC7.RollDifficultyCriticalTitle',
          threshold: 1
        }
      ],
      displayActorOnCard: (actor ? game.settings.get(FOLDER_ID, 'displayActorOnCard') : false),
      displayResultType: (typeof this.#dicePool.threshold !== 'undefined' ? game.settings.get(FOLDER_ID, 'displayResultType') : false),
      displayCheckSuccessLevel: game.settings.get(FOLDER_ID, 'displayCheckSuccessLevel'),
      flatDiceModifier: this.#dicePool.flatDiceModifier,
      flatThresholdModifier: this.#dicePool.flatThresholdModifier,
      isForced: this.#isForced,
      foundryGeneration: game.release.generation,
      isBlind: this.#rollMode === CONST.DICE_ROLL_MODES.BLIND,
      isUnknownDifficulty: this.#dicePool.difficulty === CoC7DicePool.difficultyLevel.unknown,
      luckSpent: this.#dicePool.luckSpent,
      name: this.name,
      standbyRightIcon: this.#standbyRightIcon
    }
    return data
  }

  /**
   * Create Chat Message object
   * @returns {object}
   */
  async getChatData () {
    const data = await this.getTemplateData()
    const actor = (await this.#asyncActor)

    let speaker
    if (this.message) {
      speaker = this.message.speaker
    } else if (actor) {
      speaker = ChatMessage.getSpeaker({ actor })
    } else {
      speaker = ChatMessage.getSpeaker()
    }

    const template = (this.#isStandby ? 'systems/' + FOLDER_ID + '/templates/chat/roll-standby.hbs' : 'systems/' + FOLDER_ID + '/templates/chat/roll-result.hbs')

    if (this.message?.id) {
      await this.flagForDevelopment()
    }
    const chatData = {
      flags: {
        [FOLDER_ID]: {
          load: {
            as: 'CoC7Check',
            actorUuid: data?.actorUuid,
            allowPush: this.#allowPush,
            appliedDevelopment: this.#appliedDevelopment,
            cardOpen: this.#cardOpen,
            callbackContext: this.#callbackContext,
            callbackUuid: this.#callbackUuid,
            customFlavor: this.#customFlavor,
            dicePool: this.#dicePool.toObject(),
            isCombat: this.#isCombat,
            isForced: this.#isForced,
            isForcedFailure: this.#isForcedFailure,
            isForcedSuccess: this.#isForcedSuccess,
            isStandby: this.#isStandby,
            key: this.#key,
            rollMode: this.#rollMode,
            standbyRightIcon: this.#standbyRightIcon,
            type: this.#type
          }
        }
      },
      speaker,
      rolls: (this.message?.rolls ?? []).concat(this.#dicePool.newRolls),
      flavor: this.flavor,
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(template, data)
    }
    if (this.isInitiativeRoll) {
      foundry.utils.setProperty(chatData, 'flags.core.initiativeRoll', true)
    }

    if (game.user.isGM && this.#rollMode === CONST.DICE_ROLL_MODES.SELF) {
      chatData.user = game.user.id
      chatData.flavor = `[${actor.name}] ${chatData.flavor}`
      switch (game.settings.get(FOLDER_ID, 'selfRollWhisperTarget')) {
        case 'owners':
          delete chatData.speaker
          chatData.whisper = actor.owners.map(d => d.id)
          break

        case 'everyone':
          delete chatData.speaker
          chatData.whisper = game.users.players.map(d => d.id)
          break

        default:
          ChatMessage.applyRollMode(chatData, this.#rollMode)
          break
      }
    } else {
      ChatMessage.applyRollMode(chatData, this.#rollMode)
    }
    if (game.user.isGM && this.#isStandby) {
      chatData.blind = false
      chatData.whisper = []
    } else if ([CONST.DICE_ROLL_MODES.PRIVATE].includes(this.#rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM').map(d => d.id)
    } else if (CONST.DICE_ROLL_MODES.BLIND === this.#rollMode) {
      chatData.blind = true
    }
    return chatData
  }

  /**
   * Perform the current roll
   */
  async #performRoll () {
    if (!this.#isStandby) {
      await this.#dicePool.roll()
    }
  }

  /**
   * Roll is a Attribute check
   * @param {string} attribute
   */
  async rollAttribute (attribute) {
    this.#type = CoC7Check.type.attribute
    this.#key = attribute
    await this.#setThreshold()
    await this.#performRoll()
  }

  /**
   * Roll is a Characteristic check
   * @param {string} characteristic
   */
  async rollCharacteristic (characteristic) {
    this.#type = CoC7Check.type.characteristic
    this.#key = characteristic
    await this.#setThreshold()
    await this.#performRoll()
  }

  /**
   * Roll is a Skill check
   * @param {string} uuid
   */
  async rollSkill (uuid) {
    this.#type = CoC7Check.type.skill
    this.#key = uuid
    this.item = await fromUuid(this.#key)
    if (this.item) {
      await this.#setThreshold()
      await this.#performRoll()
    } else {
      throw new Error('Item Not Found')
    }
  }

  /**
   * Roll set threshold
   * @param {int} threshold
   */
  async rollManual (threshold) {
    this.#type = CoC7Check.type.value
    if (!isNaN(parseInt(threshold, 10))) {
      this.#dicePool.threshold = parseInt(threshold, 10)
    }
    await this.#performRoll()
  }

  /**
   * Roll is a Weapon check
   * @param {string} uuid
   * @param {boolean} useAlternativeSkill
   */
  async rollWeapon (uuid, useAlternativeSkill) {
    this.#type = CoC7Check.type.item
    this.#key = uuid
    this.item = await fromUuid(this.#key)
    if (this.item) {
      await this.#setThreshold(useAlternativeSkill)
      await this.#performRoll()
    } else {
      throw new Error('Item Not Found')
    }
  }

  /**
   * Set threshold based on key and type
   * @param {boolean} useAlternativeSkill
   */
  async #setThreshold (useAlternativeSkill = false) {
    let threshold
    if (this.#type === CoC7Check.type.attribute && this.#key && typeof this.#asyncActor !== 'undefined') {
      this.#allowPush = false
      threshold = parseInt((await this.#asyncActor)?.system?.attribs?.[this.#key]?.value, 10)
    } else if (this.#type === CoC7Check.type.characteristic && this.#key && typeof this.#asyncActor !== 'undefined') {
      this.#allowPush = false
      threshold = parseInt((await this.#asyncActor)?.system?.characteristics?.[this.#key]?.value, 10)
    } else if (this.#type === CoC7Check.type.skill && this.#key) {
      if (!this.item) {
        this.item = await fromUuid(this.#key)
      }
      if (this.item) {
        this.#allowPush = (this.item.system.properties.push ?? false)
        threshold = parseInt(this.item.system.value, 10)
      }
    } else if (this.#type === CoC7Check.type.item && this.#key) {
      if (!this.item) {
        this.item = await fromUuid(this.#key)
      }
      if (this.item) {
        const skill = (useAlternativeSkill ? this.item.system.skillAlternative : this.item.system.skillMain)
        if (skill) {
          this.#allowPush = false
          threshold = parseInt(skill.system.value, 10)
        }
        this.#dicePool.malfunctionThreshold = (this.item.system.malfunction || undefined)
      }
    }
    if (isNaN(threshold)) {
      threshold = undefined
    }
    if (typeof threshold === 'undefined') {
      ui.notifications.warn('CoC7.Errors.UnparsableThreshold', { localize: true })
      throw new Error('No threshold')
    }
    this.#dicePool.threshold = threshold
  }

  /**
   * Create a Chat Message
   */
  async toMessage () {
    const chatData = await this.getChatData()
    this.message = (await ChatMessage.create(chatData))
    const old = this.#appliedDevelopment
    await this.flagForDevelopment()
    if (old !== this.#appliedDevelopment) {
      this.message.update({
        ['flags.' + FOLDER_ID + '.load.appliedDevelopment']: this.#appliedDevelopment
      })
    }
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
   * Return an array of results
   * @returns {Array}
   */
  async publicResults () {
    const data = await this.getTemplateData()
    return [
      {
        messageType: this.message.flags[FOLDER_ID].load.as,
        actorUuid: data.actorUuid,
        type: this.#type,
        key: this.#key,
        ...this.#dicePool.publicResults()
      }
    ]
  }

  /**
   * Run updateRoll callback on callback uuid
   */
  async runCallback () {
    if (this.#callbackUuid) {
      const document = await fromUuid(this.#callbackUuid)
      if (document && typeof document.system.updateRoll === 'function') {
        await document.system.updateRoll(this)
      }
    }
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget.dataset.action) {
      case 'bonus':
        {
          const quantity = event.currentTarget.dataset.quantity
          if (quantity) {
            const check = await CoC7Check.loadFromMessage(message)
            try {
              if (await check.#dicePool.addDiceToPool(quantity)) {
                check.updateMessage()
              }
            } catch (err) {
              ui.notifications.warn(err.message)
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'decreaseSuccessLevel':
        {
          const check = await CoC7Check.loadFromMessage(message)
          check.#dicePool.forceResult({ direction: -1 })
          check.updateMessage()
        }
        break
      case 'flagForDevelopment':
        {
          const check = await CoC7Check.loadFromMessage(message)
          check.#appliedDevelopment = true
          await check.item.update({ 'system.flags.developement': true })
          check.updateMessage()
        }
        break
      case 'forceFail':
        {
          const check = await CoC7Check.loadFromMessage(message)
          check.#dicePool.forceResult({ successLevel: CoC7DicePool.successLevel.failure })
          check.#isForced = true
          check.#isForcedFailure = true
          check.updateMessage()
        }
        break
      case 'forcePass':
        {
          const check = await CoC7Check.loadFromMessage(message)
          check.#dicePool.forceResult({ successLevel: CoC7DicePool.successLevel.regular })
          check.#isForced = true
          check.#isForcedSuccess = true
          check.updateMessage()
        }
        break
      case 'increaseSuccessLevel':
        {
          const check = await CoC7Check.loadFromMessage(message)
          check.#dicePool.forceResult({ direction: 1 })
          check.updateMessage()
        }
        break
      case 'luck':
        {
          const luckSpend = event.currentTarget?.dataset?.luckSpend
          if (luckSpend) {
            const check = await CoC7Check.loadFromMessage(message)
            if (check) {
              const actor = (await check.#asyncActor)
              if (actor) {
                if (await check.#dicePool.addLuck(actor, parseInt(luckSpend, 10))) {
                  check.updateMessage()
                }
              }
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'push':
        {
          const check = await CoC7Check.loadFromMessage(message)
          document.querySelector('li.chat-message.message[data-message-id="' + message.id + '"] .expanded').classList.remove('expanded')
          await check.#dicePool.pushRoll()
          check.updateMessage()
        }
        break
      case 'revealCheck':
        {
          const check = await CoC7Check.loadFromMessage(message)
          check.#rollMode = CONST.DICE_ROLL_MODES.PUBLIC
          check.updateMessage()
        }
        break
      case 'rollCheckCard':
        {
          const check = await CoC7Check.loadFromMessage(message)
          check.standby = false
          await check.#dicePool.roll()
          check.updateMessage()
        }
        break
      case 'setValue':
        {
          const check = await CoC7Check.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          const value = event.currentTarget.dataset.value
          if (set && value) {
            switch (set) {
              case 'difficulty':
                check.difficulty = value
                check.updateMessage()
                break
              default:
                ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                break
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'toggleValue':
        {
          const check = await CoC7Check.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          if (check && set) {
            switch (set) {
              case 'cardOpen':
                check.#cardOpen = !check.#cardOpen
                check.updateMessage()
                break
              default:
                ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                break
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
    }
  }

  /**
   * When roll is complete / updated trigger callback on uuid
   * @param {string} uuid
   * @param {mixed} context
   */
  setCallback (uuid, context) {
    this.#callbackUuid = uuid
    this.#callbackContext = context
  }

  /**
   * Get context for callback
   * @returns {mixed}
   */
  get callbackContext () {
    return this.#callbackContext
  }

  /**
   * Is final roll critical
   * @returns {boolean}
   */
  get isCritical () {
    return this.#dicePool.isCritical
  }

  /**
   * Is final roll failure
   * @returns {boolean}
   */
  get isRegularFailure () {
    return this.#dicePool.isRegularFailure
  }

  /**
   * Is final roll fumble
   * @returns {boolean}
   */
  get isFumble () {
    return this.#dicePool.isFumble
  }

  /**
   * Is final roll success
   * @returns {boolean}
   */
  get isSuccess () {
    return this.#dicePool.isSuccess
  }

  /**
   * Get success level
   * @returns {int}
   */
  get successLevel () {
    return this.#dicePool.successLevel
  }

  /**
   * Get success levels
   * @returns {object}
   */
  get successLevels () {
    return this.#dicePool.successLevels
  }

  /**
   * Get successLevel
   * @returns {int}
   */
  get total () {
    return this.#dicePool.total
  }

  /**
   * Close the card without user input to prevent buttons being added
   */
  closeCard () {
    this.#cardOpen = false
  }

  /**
   * Prevent Rolls being added to ChatData so DsN wont trigger
   * @param {boolean} value
   */
  suppressRollData (value = true) {
    this.#dicePool.suppressRollData(value)
  }

  /**
   * Flag message as initiative roll
   */
  initiativeRoll () {
    this.isInitiativeRoll = true
  }

  /**
   * Set success/failure can not be performed on critical or fumble e.g. true = automatic melee success and false = weapon malfunction
   * @param {boolean|undefined} value
   */
  setSuccess (value) {
    this.#dicePool.setSuccess(value)
  }

  /**
   * Get new Rolls for message
   * @returns {Array}
   */
  get newRolls () {
    return this.#dicePool.newRolls
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
      let cardOpen = false
      let actorUuid = ''
      if (actor) {
        actorUuid = actor.uuid
      } else {
        actorUuid = CoC7Utilities.oldStyleToUuid(message.speaker)
        cardOpen = false
      }
      const diceModifier = Number(contents.dataset.diceModifier || 0)
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
      const update = {
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=type']: null,
        /* // FoundryVTT V13 */
        ['flags.' + FOLDER_ID + '.-=GMSelfRoll']: null,
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7Check',
        ['flags.' + FOLDER_ID + '.load.actorUuid']: actorUuid,
        ['flags.' + FOLDER_ID + '.load.allowPush']: contents.dataset.canBePushed === 'true',
        ['flags.' + FOLDER_ID + '.load.appliedDevelopment']: contents.dataset.flaggedForDevelopment === 'true',
        ['flags.' + FOLDER_ID + '.load.cardOpen']: cardOpen,
        ['flags.' + FOLDER_ID + '.load.customFlavor']: message.flavor,
        ['flags.' + FOLDER_ID + '.load.isCombat']: false,
        ['flags.' + FOLDER_ID + '.load.isForced']: contents.dataset.forced === 'true',
        ['flags.' + FOLDER_ID + '.load.isForcedFailure']: contents.dataset.forcedFailure === 'true',
        ['flags.' + FOLDER_ID + '.load.isForcedSuccess']: contents.dataset.forcedSuccess === 'true',
        ['flags.' + FOLDER_ID + '.load.isStandby']: contents.dataset.standby === 'true',
        ['flags.' + FOLDER_ID + '.load.dicePool.bonusCount']: Math.max(diceModifier, 0),
        ['flags.' + FOLDER_ID + '.load.dicePool.currentPoolModifier']: diceModifier,
        ['flags.' + FOLDER_ID + '.load.dicePool.difficulty']: Number(contents.dataset.difficulty || CoC7DicePool.difficultyLevel.regular),
        ['flags.' + FOLDER_ID + '.load.dicePool.flatDiceModifier']: Number(contents.dataset.flatDiceModifier || 0),
        ['flags.' + FOLDER_ID + '.load.dicePool.flatThresholdModifier']: Number(contents.dataset.flatThresholdModifier || 0),
        ['flags.' + FOLDER_ID + '.load.dicePool.luckSpent']: Number(contents.dataset.totalLuckSpent || 0),
        ['flags.' + FOLDER_ID + '.load.dicePool.groups']: [],
        ['flags.' + FOLDER_ID + '.load.dicePool.penaltyCount']: Math.min(diceModifier, 0),
        ['flags.' + FOLDER_ID + '.load.dicePool.rolledDice']: [
          {
            rolled: true,
            baseDie,
            bonusDice: (diceModifier > 0 ? dice : []),
            penaltyDice: (diceModifier < 0 ? dice : []),
            unitDie
          }
        ],
        ['flags.' + FOLDER_ID + '.load.dicePool.suppressRollData']: false,
        ['flags.' + FOLDER_ID + '.load.dicePool.threshold']: Number(contents.dataset.rawValue),
        ['flags.' + FOLDER_ID + '.load.standbyRightIcon']: ''
      }
      if (contents.dataset.type === 'skill') {
        update['flags.' + FOLDER_ID + '.load.key'] = actorUuid + '.Item.' + contents.dataset.skillId
        update['flags.' + FOLDER_ID + '.load.type'] = 'skill'
      } else if (contents.dataset.attribute.length) {
        update['flags.' + FOLDER_ID + '.load.key'] = contents.dataset.attribute
        update['flags.' + FOLDER_ID + '.load.type'] = 'attribute'
      } else if (contents.dataset.characteristic.length) {
        update['flags.' + FOLDER_ID + '.load.key'] = contents.dataset.characteristic
        update['flags.' + FOLDER_ID + '.load.type'] = 'characteristic'
      } else {
        update['flags.' + FOLDER_ID + '.load.type'] = 'value'
      }
      if (typeof message.flags?.[FOLDER_ID]?.uuid !== 'undefined') {
        /* // FoundryVTT V13 */
        update['flags.' + FOLDER_ID + '.-=uuid'] = null
      }
      if (message.blind) {
        update['flags.' + FOLDER_ID + '.load.rollMode'] = CONST.DICE_ROLL_MODES.BLIND
      } else if (message.whisper.length === 1 && message.whisper[0] === game.user.id) {
        update['flags.' + FOLDER_ID + '.load.rollMode'] = CONST.DICE_ROLL_MODES.SELF
      } else if (message.whisper.length > 0 && message.whisper.every(k => game.users.get(k)?.isGM)) {
        update['flags.' + FOLDER_ID + '.load.rollMode'] = CONST.DICE_ROLL_MODES.PRIVATE
      } else {
        update['flags.' + FOLDER_ID + '.load.rollMode'] = CONST.DICE_ROLL_MODES.PUBLIC
      }
      if (contents.dataset.pushedRoll === 'true') {
        for (let next = parseInt(offset, 10) + 1, nextMax = game.messages.contents.length; next < nextMax; next++) {
          const message2 = game.messages.contents[next]
          if (message2.flags?.[FOLDER_ID]?.type === 'rollCard' || message2.flags?.[FOLDER_ID]?.GMSelfRoll === true) {
            const div = document.createElement('div')
            div.innerHTML = message2.content
            const contents2 = div.children[0]
            if (contents2 && contents2.dataset.pushing === 'true') {
              if (['characteristic', 'attribute', 'skillId', 'successRequired', 'actorKey', 'diceMod', 'diceModifier'].every(k => contents2.dataset[k] === contents.dataset[k])) {
                let baseDie = 0
                let unitDie = Number(contents2.querySelector('.unit-die li').dataset.value)
                if (unitDie === 0) {
                  unitDie = 10
                }
                const dice = []
                for (const die of contents2.querySelectorAll('.ten-dice li')) {
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
                update['flags.' + FOLDER_ID + '.load.dicePool.rolledDice'].push({
                  rolled: true,
                  baseDie,
                  bonusDice: (diceModifier > 0 ? dice : []),
                  penaltyDice: (diceModifier < 0 ? dice : []),
                  unitDie
                })
                deleteIds.push(message2.id)
                break
              }
            }
          }
        }
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7Check.loadFromMessage(merged)
      const chatData = await check.getChatData()
      update.content = chatData.content
      update._id = message.id
      updates.push(update)
    }
  }
}
