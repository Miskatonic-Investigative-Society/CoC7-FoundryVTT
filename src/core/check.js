/* global $, Actor, AudioHelper, ChatMessage, CONFIG, CONST, foundry, fromUuid, game, getComputedStyle, Item, renderTemplate, Token, ui */
import { CoC7Dice } from '../shared/dice/dice.js'
import { CoC7Item } from '../core/documents/item.js'
import { chatHelper, CoC7Roll } from '../shared/dice/helper.js'
import { CoCActor } from '../core/documents/actor.js'
import { CoC7Utilities } from '../shared/utilities.js'

export class CoC7Check {
  constructor (
    actor = null,
    skill = null,
    item = null,
    diceMod = 0,
    difficulty = null,
    flatThresholdModifier = 0,
    flatDiceModifier = 0
  ) {
    this.actor = actor
    this.skill = skill
    this.item = item
    this.difficulty = difficulty
    this.diceModifier = diceMod
    this.rawValue = 0 // value needed before difficulty
    this.successLevel = null
    this.referenceMessageId = null
    this.pushing = false
    this.flatDiceModifier = flatDiceModifier
    this.flatThresholdModifier = flatThresholdModifier

    if (difficulty === null) {
      const isUnknown =
        game.settings.get('CoC7', 'defaultCheckDifficulty') === 'unknown'
      this.difficulty = isUnknown
        ? CoC7Check.difficultyLevel.unknown
        : CoC7Check.difficultyLevel.regular
    }
  }

  static get cardType () {
    return 'rollCard'
  }

  static get difficultyLevel () {
    return {
      unknown: -1,
      regular: 1,
      hard: 2,
      extreme: 3,
      critical: 4,
      impossible: 9
    }
  }

  static get successLevel () {
    return {
      fumble: -99,
      failure: 0,
      regular: 1,
      hard: 2,
      extreme: 3,
      critical: 4
    }
  }

  static get type () {
    return {
      characteristic: 'characteristic',
      attribute: 'attribute',
      skill: 'item',
      item: 'item',
      value: 'value'
    }
  }

  static difficultyString (difficultyLevel) {
    switch (
      !isNaN(Number(difficultyLevel))
        ? Number(difficultyLevel)
        : difficultyLevel
    ) {
      case '?':
        return game.i18n.localize('CoC7.UnknownDifficulty')
      case '+':
        return game.i18n.localize('CoC7.HardDifficulty')
      case '++':
        return game.i18n.localize('CoC7.ExtremeDifficulty')
      case '+++':
        return game.i18n.localize('CoC7.CriticalDifficulty')
      case 0:
        return game.i18n.localize('CoC7.RegularDifficulty')
      case CoC7Check.difficultyLevel.unknown:
        return game.i18n.localize('CoC7.UnknownDifficulty')
      case CoC7Check.difficultyLevel.regular:
        return game.i18n.localize('CoC7.RegularDifficulty')
      case CoC7Check.difficultyLevel.hard:
        return game.i18n.localize('CoC7.HardDifficulty')
      case CoC7Check.difficultyLevel.extreme:
        return game.i18n.localize('CoC7.ExtremeDifficulty')
      case CoC7Check.difficultyLevel.critical:
        return game.i18n.localize('CoC7.CriticalDifficulty')
      default:
        return null
    }
  }

  get rawValue () {
    // if (!this.actor || !this.actor.id) return undefined
    if (!this._rawValue) {
      if (this.characteristic) {
        this.rawValue =
          this.actor.system.characteristics[this.characteristic].value
      }
      if (this.skill) this.rawValue = this.skill.value
      if (this.attribute) {
        this.rawValue = this.actor.system.attribs[this.attribute].value
      }
    }
    if (this._rawValue) {
      if (
        this.flatThresholdModifier &&
        game.settings.get('CoC7', 'allowFlatThresholdModifier')
      ) {
        if (this._rawValue + this.flatThresholdModifier < 1) return 1
        return this._rawValue + this.flatThresholdModifier
      }
      return this._rawValue
    }
    return undefined
  }

  set rawValue (x) {
    this._rawValue = x
  }

  set uuid (x) {
    this._uuid = x
  }

  get uuid () {
    if (!this._uuid) this._uuid = foundry.utils.randomID(16)
    return this._uuid
  }

  get hasCard () {
    const chatCard = ui.chat.collection.filter(message => {
      return (
        this.uuid === message.getFlag('CoC7', 'uuid') &&
        CoC7Check.cardType === message.getFlag('CoC7', 'type')
      )
    })
    if (chatCard.length > 0) return true
    return false
  }

  get rawValueString () {
    if (this._rawValue === 0) {
      return '0'
    }
    if (!this._rawValue) return undefined
    if (
      this.flatThresholdModifier &&
      game.settings.get('CoC7', 'allowFlatThresholdModifier')
    ) {
      if (this.flatThresholdModifier < 0) {
        return this._rawValue.toString() + this.flatThresholdModifier.toString()
      }
      return (
        this._rawValue.toString() + '+' + this.flatThresholdModifier.toString()
      )
    } else return this._rawValue.toString()
  }

  get criticalThreshold () {
    return 1
  }

  get regularThreshold () {
    if (this.rawValue) {
      if (this.rawValue >= 100) return 99
      return parseInt(this.rawValue)
    }
    return null
  }

  get hardThreshold () {
    if (this.rawValue) return Math.floor(this.rawValue / 2)
    return null
  }

  get extremeThreshold () {
    if (this.rawValue) return Math.floor(this.rawValue / 5)
    return null
  }

  get fumbleThreshold () {
    if (this.rawValue) {
      if (this.difficulty) {
        if (this.difficulty >= CoC7Check.difficultyLevel.extreme) {
          return this.extremeThreshold < 50 ? 96 : 100
        } else if (this.difficulty >= CoC7Check.difficultyLevel.hard) {
          return this.hardThreshold < 50 ? 96 : 100
        }
      }
      return this.rawValue < 50 ? 96 : 100
    }
    return null
  }

  get succesThreshold () {
    if (typeof this.difficulty !== 'undefined') {
      switch (this.difficulty) {
        case CoC7Check.difficultyLevel.extreme:
          return this.extremeThreshold
        case CoC7Check.difficultyLevel.hard:
          return this.hardThreshold
        case CoC7Check.difficultyLevel.regular:
          return this.regularThreshold
        case CoC7Check.difficultyLevel.critical:
          return this.criticalThreshold
        case CoC7Check.difficultyLevel.unknown:
          return -1
        default:
          return this.rawValue
      }
    }
    return null
  }

  get difficultyString () {
    if (typeof this.difficulty !== 'undefined') {
      switch (this.difficulty) {
        case CoC7Check.difficultyLevel.extreme:
          return game.i18n.format('CoC7.ExtremeDifficulty')
        case CoC7Check.difficultyLevel.hard:
          return game.i18n.format('CoC7.HardDifficulty')
        case CoC7Check.difficultyLevel.regular:
          return game.i18n.format('CoC7.RegularDifficulty')
        case CoC7Check.difficultyLevel.critical:
          return game.i18n.format('CoC7.CriticalDifficulty')
        case CoC7Check.difficultyLevel.unknown:
          return game.i18n.format('CoC7.UnknownDifficulty')
        default:
          return ''
      }
    }
    return ''
  }

  get modifiedResult () {
    if (this.standby) return undefined
    if (typeof this._modifiedResult !== 'undefined') return this._modifiedResult
    if (this.flatDiceModifier) {
      const modified = this.dices.total + this.flatDiceModifier
      if (modified < 1) return 1
      if (modified > 100) return 100
      return modified
    }
    return this.dices.total
  }

  set modifiedResult (x) {
    this._modifiedResult = x
  }

  get flatDiceModifierString () {
    if (!this.flatDiceModifier) return null
    if (this.flatDiceModifier > 0) return `+${this.flatDiceModifier}`
    return this.flatDiceModifier.toString()
  }

  get isFumble () {
    if (this.standby) return undefined
    if (this.isSimpleRoll) return undefined
    return this.modifiedResult >= this.fumbleThreshold
  }

  get isCritical () {
    if (this.standby) return undefined
    return this.modifiedResult === 1
  }

  get isExtremeSuccess () {
    if (this.standby) return undefined
    return this.successLevel >= CoC7Check.successLevel.extreme
  }

  get passed () {
    if (this.standby) return undefined
    if (this.isSimpleRoll) return undefined
    if (this.luckSpent) return this.difficulty <= this.successLevel
    return this.succesThreshold >= this.modifiedResult || this.isCritical
  }

  get failed () {
    if (this.standby) return undefined
    if (this.isSimpleRoll) return undefined
    return !this.passed
  }

  get isSimpleRoll () {
    return typeof this.rawValue === 'undefined'
  }

  get hasBonus () {
    if (this.diceModifier && this.diceModifier > 0) return true
    return false
  }

  get hasPenalty () {
    if (this.diceModifier && this.diceModifier < 0) return true
    return false
  }

  get hasModifier () {
    if (this.diceModifier && this.diceModifier !== 0) return true
    return false
  }

  get diceModifier () {
    if (this._diceModifier) return this._diceModifier
    return null
  }

  set diceModifier (x) {
    this._diceModifier = parseInt(x)
  }

  get name () {
    if (this.actor) {
      if (this.skill) return this.skill.shortName
      if (this.item) return this.item.name
      if (this.characteristic) {
        return CoC7Utilities.getCharacteristicNames(this.characteristic)?.label
      }
      if (this.attribute) {
        if (this.attribute === 'lck') return game.i18n.localize('CoC7.Luck')
        if (this.attribute === 'san') return game.i18n.localize('CoC7.Sanity')
      }
    }
    return null
  }

  get shortName () {
    if (this.actor) {
      if (this.skill) return this.skill.shortName
      if (this.item) return this.item.name
      if (this.characteristic) {
        return CoC7Utilities.getCharacteristicNames(this.characteristic)?.short
      }
      if (this.attribute) {
        if (this.attribute === 'lck') return game.i18n.localize('CoC7.Luck')
        if (this.attribute === 'san') return game.i18n.localize('CoC7.SAN')
      }
    }
    return null
  }

  get fullName () {
    const difficulty =
      this._difficulty === CoC7Check.difficultyLevel.regular
        ? false
        : CoC7Check.difficultyString(this._difficulty)
    const modifier =
      this._diceModifier > 0
        ? `+${this._diceModifier}`
        : this._diceModifier.toString()
    return game.i18n.format(
      `CoC7.LinkCheck${!difficulty ? '' : 'Diff'}${
        !this._diceModifier ? '' : 'Modif'
      }`,
      { difficulty, modifier, name: this.name }
    )
  }

  get rolled () {
    if (this.dice) return true
    return false
  }

  /**
   * Get a check from an HTMLElement or a chat card.
   * @param {HTMLElement} card  The HTMLElement that is a roll-result or a chat card containing a single roll-result.
   * @return {CoC7Check}      A CoC7Check.
   */
  static getFromCard (card) {
    const rollResult = card.classList.contains('roll-result')
      ? card
      : card.querySelector('.roll-result')
    const check = new CoC7Check()
    CoC7Roll.getFromElement(rollResult, check)
    const message = card.closest('.message')
    check.messageId = message ? message.dataset.messageId : null
    return check
  }

  static async push (card, publish = true) {
    const oldCheck = CoC7Check.getFromCard(card) // TODO: Refactoring
    const actorId = card.dataset.tokenId
      ? card.dataset.tokenId
      : card.dataset.actorId
    const skillId = card.dataset.skillId
    const charac = card.dataset.characteristic
    const itemId = card.dataset.itemId
    const diceMod = card.dataset.diceMod
    const difficulty = card.dataset.difficulty

    let pushedRoll
    if (skillId) {
      pushedRoll = new CoC7Check(actorId, skillId, itemId, diceMod, difficulty)
    } else if (charac) {
      pushedRoll = new CoC7Check()
      pushedRoll.diceModifier = diceMod
      pushedRoll.difficulty = difficulty
      pushedRoll.actor = actorId
      pushedRoll.characteristic = charac
    } else return
    if (oldCheck.uuid) {
      pushedRoll.context = oldCheck.context
      pushedRoll.uuid = oldCheck.uuid
    }
    if (oldCheck.parent) pushedRoll.parent = oldCheck.parent
    pushedRoll.pushing = true
    await pushedRoll.roll()
    if (oldCheck.messageId) {
      const o = await game.messages.get(oldCheck.messageId)
      if (typeof o.rolls?.[0]?.options?.coc7Result !== 'undefined') {
        o.rolls[0].options.coc7Result.pushing = true
        await o.update({
          rolls: o.rolls
        })
      }
    }
    if (publish) pushedRoll.toMessage(true, card)
  }

  get token () {
    if (!this.actor) return null
    return chatHelper.getTokenFromKey(this.actorKey)
  }

  set actor (x) {
    this.actorKey = x
    if (x == null) {
      this._actor = x
      return
    }

    if (x instanceof Actor) {
      // REFACTORING (2)
      this._actor = x
      this._actor.alias = this.actor.name
      if (x.token && x.token.scene && x.token.scene.id) {
        this.actorKey = `${x.token.scene.id}.${x.token.id}`
      } else this.actorKey = x.id // REFACTORING (2)
      return
    }

    if (x.includes('.')) {
      const [sceneId, tokenId] = x.split('.') // REFACTORING (2)
      if (sceneId === 'TOKEN') {
        this._actor = game.actors.tokens[tokenId] // REFACTORING (2)
        this._actor.alias = this._actor.name // REFACTORING (2)
      } else {
        const scene = game.scenes.get(sceneId)
        if (!scene) return
        const tokenData = scene.getEmbeddedDocument('Token', tokenId)
        if (!tokenData) return
        const token = new Token(tokenData)
        this._actor = token.actor
        this._actor.alias = token.name
      }
      return
    }

    this._actor = game.actors.get(x)
    this.actor.alias = this.actor.name
  }

  get successLevelIcons () {
    if (this.unknownDifficulty) return null
    if (this.isSimpleRoll && this._rawValue !== 0) return null
    if (this.successLevel >= this.difficulty) {
      const icons = []
      for (
        let index = 0;
        index < this.successLevel - this.difficulty + 1;
        index++
      ) {
        icons.push(this.isCritical ? 'medal' : 'star')
      }
      const successHint = game.i18n.format('CoC7.SuccesLevelHint', {
        value: this.successLevel - this.difficulty + 1
      })
      return {
        success: true,
        cssClass: this.isCritical ? 'critical' : 'success',
        hint: successHint,
        icons
      }
    } else {
      const icons = []
      const successLevel = this.isFumble ? -1 : this.successLevel
      for (let index = 0; index < this.difficulty - successLevel; index++) {
        icons.push(this.isFumble ? 'skull' : 'spider')
      }
      const failureHint = game.i18n.format('CoC7.FailureLevelHint', {
        value: this.difficulty - successLevel
      })
      return {
        success: false,
        cssClass: this.isFumble ? 'fumble' : 'failure',
        hint: failureHint,
        icons
      }
    }
  }

  get isBlind () {
    if (undefined === this._isBlind) {
      this._isBlind = this.rollMode === 'blindroll'
    }
    return this._isBlind
  }

  set isBlind (x) {
    this._isBlind = x
  }

  get unknownDifficulty () {
    if (
      this.gmDifficultyCritical ||
      this.gmDifficultyExtreme ||
      this.gmDifficultyHard ||
      this.gmDifficultyRegular
    ) {
      return false
    }
    return CoC7Check.difficultyLevel.unknown === this.difficulty
  }

  get rollMode () {
    if (!this._rollMode) this._rollMode = game.settings.get('core', 'rollMode')
    return this._rollMode
  }

  set rollMode (x) {
    if (x === false) this._rollMode = game.settings.get('core', 'rollMode')
    this._rollMode = x
  }

  set skill (x) {
    this._skill = this._getItemFromId(x)
    this.skillId = x
  }

  set item (x) {
    this._item = this._getItemFromId(x)
    if (this._item?.type === 'weapon') {
      this.itemId = x
    } else {
      this._item = undefined
      this.itemId = undefined
    }
  }

  _getItemFromId (x) {
    if (x == null) return null
    if (x instanceof Item) return x
    if (this._actor) return this._actor.items.get(x)
    return game.items.get(x)
  }

  get actor () {
    if (!this._actor || !this._actor?.id) {
      if (this.actorKey) this._actor = chatHelper.getActorFromKey(this.actorKey) // REFACTORING (2)
      if (this.actorId) this._actor = chatHelper.getActorFromKey(this.actorId) // REFACTORING (2)
      if (!this._actor) {
        return {
          isDummy: true,
          name: this.actorName ? this.actorName : undefined,
          id: undefined,
          img: 'systems/CoC7/assets/icons/question-circle-regular.svg',
          portrait: 'systems/CoC7/assets/icons/question-circle-regular.svg'
        }
      }
    } else if (this._actor.constructor.name === 'Object') {
      const actor = new CoCActor(this._actor)
      this._actor = actor
    }
    return this._actor
  }

  get skill () {
    if (!this._skill && this.skillId) {
      this._skill = this.actor?.items.get(this.skillId)
    }
    if (!this._skill && this.item) {
      if (this.item.system.skill) {
        if (this.item.system.skill.main.id && !this.weaponAltSkill) {
          this._skill = this._actor.items.get(this.item.system.skill.main.id)
        } else if (
          this.item.system.skill.alternativ.id &&
          this.weaponAltSkill
        ) {
          this._skill = this._actor.items.get(
            this.item.system.skill.alternativ.id
          )
        }
      }
    }
    return this._skill
  }

  get item () {
    if (!this._item && this.itemId && this.actor) {
      this._item = this.actor.items.get(this.itemId)
    }
    return this._item
  }

  get displayResultType () {
    return game.settings.get('CoC7', 'displayResultType')
  }

  get displayCheckSuccessLevel () {
    return game.settings.get('CoC7', 'displayCheckSuccessLevel')
  }

  get displayBothSuccessLevel () {
    return this.displayResultType && this.displayCheckSuccessLevel
  }

  get dontDisplaySuccessLevel () {
    return !this.displayResultType && !this.displayCheckSuccessLevel
  }

  get image () {
    if (this.skill) return this.skill.img
    if (this.item) return this.item.img
    return undefined
  }

  get link () {
    return this.getLinkElement().outerHTML
  }

  get displayActorOnCard () {
    return game.settings.get('CoC7', 'displayActorOnCard')
  }

  getLinkElement (classes = null) {
    const data = {
      cls: ['coc7-link', 'coc7-roll'].concat(classes),
      dataset: { check: 'check' },
      icon: this.image
        ? `<div style="background-image: url(${this.image})"></div>`
        : '<i class="fas fa-dice"></i>',
      blind: this.isBlind
    }

    const difficulty = CoC7Check.difficultyString(this._difficulty)
    const title = game.i18n.format(
      `CoC7.LinkCheck${!this._difficulty ? '' : 'Diff'}${
        !this._diceModifier ? '' : 'Modif'
      }`,
      {
        difficulty,
        modifier: this._diceModifier,
        name: this.name
      }
    )

    const a = document.createElement('a')
    a.title = title
    a.classList.add(...data.cls)
    a.innerHTML = `${data.blind ? '<i class="fas fa-eye-slash"></i>' : ''}${
      data.icon
    }${this.name}`

    return a
  }

  async roll (diceMod = null, difficulty = null, options = {}) {
    if (diceMod) this.diceModifier = diceMod
    if (difficulty) this.difficulty = difficulty
    if (!this.standby) await this._perform(options)
  }

  /**
   * Create a check with the provided data
   * Process roll data to a format that can be fed to create()
   * @param {*} rollData A roll data structure as returned by actor.find
   * @returns A check with the roll data provided
   */
  static createFromActorRollData (rollData) {
    const roll = {}
    // check Modifier
    if (rollData.difficulty) roll.difficulty = rollData.difficulty
    if (rollData.diceModifier) roll.diceModifier = rollData.diceModifier
    if (rollData.denyPush === true) roll.denyPush = true
    if (rollData.flatDiceModifier) {
      roll.flatDiceModifier = rollData.flatDiceModifier
    }
    if (rollData.flatThresholdModifier) {
      roll.flatThresholdModifier = rollData.flatThresholdModifier
    }
    // Actor
    if (rollData.actor?.actorKey) roll.actorKey = rollData.actor.actorKey
    else if (rollData.actor?.name) roll.actorName = rollData.actor.name
    // Check type
    switch (rollData.type) {
      case CoC7Check.type.characteristic:
        roll.characteristic = rollData.value?.key
        break
      case CoC7Check.type.attribute:
        roll.attribute = rollData.value?.key
        break
      case CoC7Check.type.item:
        roll.actorKey = rollData.value.actor.actorKey
        if (rollData.value?.type === 'skill') roll.skill = rollData.value.id
        else roll.item = rollData.value.id
        break
      case CoC7Check.type.skill:
        roll.actorKey = rollData.value.actor.actorKey
        roll.skill = rollData.value.id
        break
      case CoC7Check.type.value:
        roll.displayName = rollData.value.name
        roll.rawValue = rollData.value.threshold
        break
      default:
        break
    }
    return CoC7Check.create(roll)
  }

  static create ({
    difficulty = CoC7Check.difficultyLevel.regular,
    diceModifier = null,
    actorKey = null,
    characteristic = null,
    attribute = null,
    rawValue = 0,
    item = null,
    skill = null,
    flatDiceModifier = 0,
    flatThresholdModifier = 0,
    displayName = null,
    actorName = null,
    denyPush = undefined
  } = {}) {
    const check = new CoC7Check()
    check.difficulty = difficulty
    if (denyPush === true) check.denyPush = true
    if (diceModifier) check.diceModifier = diceModifier
    if (flatDiceModifier) check.flatDiceModifier = flatDiceModifier
    if (flatThresholdModifier) {
      check.flatThresholdModifier = flatThresholdModifier
    }
    if (displayName) check.displayName = displayName
    if (actorKey) check.actor = actorKey
    if (actorName) check.actorName = actorName
    if (!isNaN(Number(rawValue))) check.rawValue = Number(rawValue)
    if (check.actor && !check.actor.isDummy) {
      // TODO : Add check for validity of characteristic, attribute, skillId
      if (skill) check.skill = skill
      // TODO : try retrieve skill by name
      else if (characteristic) check.characteristic = characteristic
      else if (attribute) check.attribute = attribute
      else if (item) check.item = item
    }
    return check
  }

  async rollCharacteristic (char, diceMod = null, difficulty = null) {
    if (diceMod) this.diceModifier = diceMod
    if (difficulty) this.difficulty = difficulty
    this.characteristic = char
    if (!this.standby) await this._perform()
  }

  async rollAttribute (attrib, diceMod = null, difficulty = null) {
    if (diceMod) this.diceModifier = diceMod
    if (difficulty) this.difficulty = difficulty
    this.attribute = attrib
    if (!this.standby) await this._perform()
  }

  async rollValue (val, diceMod = null, difficulty = null) {
    if (diceMod) this.diceModifier = diceMod
    if (difficulty) this.difficulty = difficulty
    this.rawValue = val
    if (!this.standby) await this._perform()
  }

  get rolledSuccessLevel () {
    return this.successLevel
  }

  async _perform (options = {}) {
    this.dice =
      options.roll ||
      (await CoC7Dice.roll(this.diceModifier, this.rollMode, this.isBlind))
    if (!options.silent && !game.modules.get('dice-so-nice')?.active) {
      AudioHelper.play({ src: CONFIG.sounds.dice }, true)
    }

    if (options.forceDSN) {
      await CoC7Dice.showRollDice3d(this.dice.roll)
    }

    this.dices = {
      tens: [],
      unit: {
        value: this.dice.unit.total
      },
      total: this.dice.total,
      tenResult: this.dice.total - this.dice.unit.total,
      hasBonus: !!this.diceModifier,
      bonus: Math.abs(this.diceModifier),
      bonusType:
        this.diceModifier < 0
          ? game.i18n.format('CoC7.DiceModifierPenalty')
          : game.i18n.format('CoC7.DiceModifierBonus'),
      difficulty: this.difficulty
    }

    const max = this.dice.unit.total === 0 ? 100 : 90
    const min = this.dice.unit.total === 0 ? 10 : 0
    let selected = this.dice.total - this.dice.unit.total
    let firstValue = (selected === 0 ? 10 : Math.floor(selected / 10))
    for (const d of this.dice.roll.dice) {
      if (d instanceof CONFIG.Dice.terms.t) {
        if (d.results[0].result === firstValue) {
          firstValue = -1
          d.results[0].active = true
        } else {
          d.results[0].active = false
        }
      }
    }
    this.dice.roll._total = this.dice.total
    for (let i = 0; i < this.dice.tens.results.length; i++) {
      const die = {}
      die.value = this.dice.tens.results[i]
      if (die.value === selected) {
        selected = 101
        die.selected = true
        if (this.dices.hasBonus) {
          die.isMax = true
          die.isMin = false
        } else {
          die.isMin = true
          die.isMax = false
        }
      } else {
        if (die.value === max) die.isMax = true
        else die.isMax = false
        if (die.value === min) die.isMin = true
        else die.isMin = false
      }
      // if( die.value == 100) die.value = "00";
      this.dices.tens.push(die)
    }
    this.computeCheck()
  }

  async increaseLuckSpend (luckAmount) {
    const spendingAmount = parseInt(luckAmount, 10)
    this.totalLuckSpent = parseInt(this.totalLuckSpent ?? 0, 10) + spendingAmount
    const modifiedResult = Math.max(1, this.modifiedResult - this.totalLuckSpent)
    if (modifiedResult === 1) {
      this.successLevel = CoC7Check.successLevel.critical
    } else if (modifiedResult <= this.extremeThreshold) {
      this.successLevel = CoC7Check.successLevel.extreme
    } else if (modifiedResult <= this.hardThreshold) {
      this.successLevel = CoC7Check.successLevel.hard
    } else if (modifiedResult <= this.rawValue) {
      this.successLevel = CoC7Check.successLevel.regular
    } else if (this.fumbleThreshold <= modifiedResult) {
      this.successLevel = CoC7Check.successLevel.fumble
    } else if (modifiedResult > this.rawValue) {
      this.successLevel = CoC7Check.successLevel.failure
    }
    if (this.difficulty <= this.successLevel) {
      this.isSuccess = true
      this.isFailure = false
    }
    this.luckSpent = true
    let remove = 0
    for (let index = 0, maxIndex = this.increaseSuccess.length; index < maxIndex; index++) {
      this.increaseSuccess[index].luckToSpend = this.increaseSuccess[index].luckToSpend - spendingAmount
      if (this.increaseSuccess[index].luckToSpend < 1) {
        remove++
      }
    }
    for (let index = 0; index < remove; index++) {
      this.increaseSuccess.shift()
    }
    this.computeCheck()
  }

  async computeCheck () {
    this.isUnknown = this.unknownDifficulty

    if (this.gmDifficultyRegular) {
      this.difficulty = CoC7Check.difficultyLevel.regular
    }
    if (this.gmDifficultyHard) this.difficulty = CoC7Check.difficultyLevel.hard
    if (this.gmDifficultyExtreme) {
      this.difficulty = CoC7Check.difficultyLevel.extreme
    }
    if (this.gmDifficultyCritical) {
      this.difficulty = CoC7Check.difficultyLevel.critical
    }

    this.tenOnlyOneDie = this.dices.tens.length === 1

    this.isValue = false
    this.isCharactiristic = false
    this.isSkill = false
    this.isItem = false
    this.isAttribute = false
    if (this.isSimpleRoll) {
      this.denyPush = true
      this.denyLuck = true
    } else if (this.actor == null) {
      this.isValue = true
    } else {
      if (this.characteristic) {
        this.isCharactiristic = true
        this.rawValue =
          this.actor.system.characteristics[this.characteristic].value
      }

      if (this.skill) {
        this.isSkill = true
        this.rawValue = this.skill.value
      }

      if (this.attribute) {
        this.isAttribute = true
        this.rawValue = this.actor.system.attribs[this.attribute].value
      }
    }

    if (!this.luckSpent && !this.isSimpleRoll) {
      if (this.modifiedResult <= this.rawValue) {
        this.successLevel = CoC7Check.successLevel.regular
      }
      if (this.modifiedResult <= this.hardThreshold) {
        this.successLevel = CoC7Check.successLevel.hard
      }
      if (this.modifiedResult <= this.extremeThreshold) {
        this.successLevel = CoC7Check.successLevel.extreme
      }
      if (this.modifiedResult > this.rawValue) {
        this.successLevel = CoC7Check.successLevel.failure
      }
      if (this.modifiedResult === 1) {
        this.successLevel = CoC7Check.successLevel.critical
      }
      if (this.fumbleThreshold <= this.modifiedResult) {
        this.successLevel = CoC7Check.successLevel.fumble
      }
    }

    switch (this.successLevel) {
      case CoC7Check.successLevel.regular:
        this.resultType = game.i18n.format('CoC7.RegularSuccess')
        break
      case CoC7Check.successLevel.hard:
        this.resultType = game.i18n.format('CoC7.HardSuccess')
        break
      case CoC7Check.successLevel.extreme:
        this.resultType = game.i18n.format('CoC7.ExtremeSuccess')
        break
      case CoC7Check.successLevel.critical:
        this.resultType = game.i18n.format('CoC7.CriticalSuccess')
        break
      case CoC7Check.successLevel.fumble:
        this.resultType = game.i18n.format('CoC7.Fumble')
        break
      case CoC7Check.successLevel.failure:
        this.resultType = game.i18n.format('CoC7.Failure')
        break

      default:
        break
    }

    if (this.unknownDifficulty) {
      this.successRequired = ''
    } else if (!this.isSimpleRoll) {
      this.successRequired = game.i18n.format('CoC7.SuccessRequired', {
        successRequired: this.difficultyString
      })
    }

    if (this.modifiedResult === 1) {
      this.successLevel = CoC7Check.successLevel.critical
    }
    if (!this.luckSpent && !this.isUnknown && !this.isSimpleRoll) {
      this.isFailure = this.failed
      this.isSuccess = this.passed
    }

    this.hasMalfunction = false
    if (this.isFumble) this.successLevel = CoC7Check.successLevel.fumble

    if (this.item) {
      this.isItem = true
      if (this.item.system.malfunction) {
        if (
          Number(this.modifiedResult) >= Number(this.item.system.malfunction)
        ) {
          this.hasMalfunction = true
          this.malfunctionTxt = game.i18n.format('CoC7.Malfunction', {
            itemName: this.item.name
          })
          await this.item.toggleItemFlag(CoC7Item.flags.malfunction)
        }
      }
    }

    if (typeof this.canBePushed === 'undefined') {
      this.canBePushed = this.skill ? this.skill.canBePushed() : false
      if (this.characteristic != null) this.canBePushed = true
      if (this.isFumble) this.canBePushed = false
      if (this.denyPush) this.canBePushed = false
    }

    if (!this.denyLuck && this.actor) {
      if (
        !this.luckSpent &&
        !this.passed &&
        !this.isFumble &&
        this.difficulty !== CoC7Check.difficultyLevel.critical &&
        !this.unknownDifficulty
      ) {
        if (this.skill || this.characteristic) {
          const luckNeeded = this.modifiedResult - this.succesThreshold
          if (this.actor.luck > luckNeeded) {
            this.hasEnoughLuck = true
            this.luckNeeded = luckNeeded
            this.luckNeededTxt = game.i18n.format('CoC7.SpendLuck', {
              luckNeededValue: luckNeeded
            })
          }
        }
      }

      if (!this.luckSpent) {
        this.increaseSuccess = []

        // Can't spend luck on pushed rolls.
        if (
          !this.pushing &&
          this.attribute !== 'lck' &&
          this.attribute !== 'san'
        ) {
          if (
            this.unknownDifficulty &&
            this.modifiedResult > this.regularThreshold
          ) {
            const nextLevel = {}
            nextLevel.difficultyName = game.i18n.localize(
              'CoC7.RegularDifficulty'
            )
            nextLevel.difficulty = CoC7Check.difficultyLevel.regular // REFACTORING (1)
            nextLevel.luckToSpend = this.modifiedResult - this.regularThreshold // REFACTORING (1)
            nextLevel.hasEnoughLuck = nextLevel.luckToSpend <= this.actor.luck
            if (nextLevel.luckToSpend <= this.actor.luck) {
              this.increaseSuccess.push(nextLevel)
            }
          }

          if (
            this.difficulty <= CoC7Check.difficultyLevel.regular &&
            this.modifiedResult > this.hardThreshold
          ) {
            const nextLevel = {}
            nextLevel.difficultyName = game.i18n.localize('CoC7.HardDifficulty')
            nextLevel.difficulty = CoC7Check.difficultyLevel.hard // REFACTORING (1)
            nextLevel.luckToSpend = this.modifiedResult - this.hardThreshold // REFACTORING (1)
            nextLevel.hasEnoughLuck = nextLevel.luckToSpend <= this.actor.luck
            if (nextLevel.luckToSpend <= this.actor.luck) {
              this.increaseSuccess.push(nextLevel)
            }
          }

          if (
            this.difficulty <= CoC7Check.difficultyLevel.hard &&
            this.modifiedResult > this.extremeThreshold
          ) {
            const nextLevel = {}
            nextLevel.difficultyName = game.i18n.localize(
              'CoC7.ExtremeDifficulty'
            )
            nextLevel.difficulty = CoC7Check.difficultyLevel.extreme
            nextLevel.luckToSpend = this.modifiedResult - this.extremeThreshold // REFACTORING (1)
            nextLevel.hasEnoughLuck = nextLevel.luckToSpend <= this.actor.luck // REFACTORING (1)
            if (nextLevel.luckToSpend <= this.actor.luck) {
              this.increaseSuccess.push(nextLevel)
            }
          }
        }
      }

      this.canIncreaseSuccess = this.increaseSuccess.length > 0
      if (this.isFumble) this.canIncreaseSuccess = false
    }
    if (this.dice) {
      this.dice.roll.options.coc7Result = {
        successLevel: Object.keys(CoC7Check.successLevel).find(key => CoC7Check.successLevel[key] === this.successLevel) ?? 'unknown',
        difficultySet: !this.isUnknown,
        passed: this.passed,
        pushing: false,
        pushed: this.pushing,
        luckSpent: this.totalLuckSpent ?? 0
      }
    } else if (typeof this.messageId === 'string') {
      const o = await game.messages.get(this.messageId)
      if (typeof o.rolls?.[0]?.options?.coc7Result !== 'undefined') {
        o.rolls[0].options.coc7Result.luckSpent = this.totalLuckSpent ?? 0
        await o.update({
          rolls: o.rolls
        })
      }
    }

    this.canAwardExperience =
      this.skill && !this.skill.system.properties.noxpgain

    if (
      this.passed &&
      this.diceModifier <= 0 &&
      this.skill &&
      !this.skill.system.properties.noxpgain &&
      !this.luckSpent &&
      !this.forced &&
      !this.isBlind &&
      !this.isUnknown
    ) {
      this.flagForDevelopement()
    }

    if (this.parent) {
      const parent = await fromUuid(this.parent)
      if (parent && 'updateRoll' in parent) {
        await parent.updateRoll(this.JSONRollString)
        // ui.notifications.info( `Roll ${this.uuid} depends of ${this.parent}`)
      }
    }
  }

  showDiceRoll () {
    if (game.modules.get('dice-so-nice')?.active) {
      const diceResults = []
      for (const dieResult of this.dices.tens) {
        diceResults.push(dieResult.value === 100 ? 0 : dieResult.value / 10)
      }
      diceResults.push(this.dices.unit.value)

      const diceData = {
        formula: `${this.dices.tens.length}d100+1d10`,
        results: diceResults,
        whisper: null,
        blind: false
      }
      game.dice3d.show(diceData)
    }
  }

  get cssClass () {
    let cssClass = ''
    if (this.isSuccess) cssClass = 'success'
    if (this.isFailure) cssClass = 'failure'
    if (this.isCritical && !this.isFailure) cssClass = 'success critical'
    if (this.isFumble && !this.isSuccess) cssClass = 'failure fumble'
    if (CoC7Check.successLevel.regular === this.successLevel) {
      cssClass += ' regular-success'
    }
    if (CoC7Check.successLevel.hard === this.successLevel) {
      cssClass += ' hard-success'
    }
    if (CoC7Check.successLevel.extreme === this.successLevel) {
      cssClass += ' extreme-success'
    }

    return cssClass
  }

  get cssClassList () {
    const cssClass = []
    if (this.isSuccess) cssClass.push('success')
    if (this.isFailure) cssClass.push('failure')
    if (this.isCritical && !this.isFailure) cssClass.push('success', 'critical')
    if (this.isFumble && !this.isSuccess) cssClass.push('failure', 'fumble')
    if (CoC7Check.successLevel.regular === this.successLevel) {
      cssClass.push('regular-success')
    }
    if (CoC7Check.successLevel.hard === this.successLevel) {
      cssClass.push('hard-success')
    }
    if (CoC7Check.successLevel.extreme === this.successLevel) {
      cssClass.push('extreme-success')
    }

    return cssClass
  }

  get playerCssClass () {
    if (this.isSuccess || this.forcedSuccess) return 'success'
    if (this.isFailure || this.forcedFailure) return 'failure'
    return null
  }

  async upgradeCheck (upgradeindex, update = true) {
    const increasedSuccess = this.increaseSuccess[upgradeindex]
    const luckAmount =
      parseInt(increasedSuccess.luckAmount) ||
      parseInt(increasedSuccess.luckToSpend) // REFACTORING (1)
    if (!this.actor.spendLuck(luckAmount)) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorNotEnoughLuck', {
          actor: this.actor.name
        })
      )
      return
    }
    this.totalLuckSpent = !parseInt(this.totalLuckSpent)
      ? 0
      : parseInt(this.totalLuckSpent)
    this.totalLuckSpent += parseInt(luckAmount)
    const newSuccessLevel =
      parseInt(increasedSuccess.newSuccessLevel) ||
      parseInt(increasedSuccess.difficulty) // REFACTORING (1)
    this.successLevel = newSuccessLevel
    if (this.difficulty <= newSuccessLevel) {
      this.isSuccess = true
      this.isFailure = false
    }
    for (let index = 0; index < upgradeindex + 1; index++) {
      this.increaseSuccess.shift()
    }
    for (const s of this.increaseSuccess) {
      s.luckToSpend = s.luckToSpend - luckAmount
    }
    this.luckSpent = true
    this.computeCheck()
    if (update) return await this.updateChatCard()
  }

  removeUpgrades () {
    this.canIncreaseSuccess = false
    this.increaseSuccess = []
    this.luckNeeded = 0
    this.luckNeededTxt = null
    this.canBePushed = false
  }

  forcePass (luckAmount = null, update = true) {
    if (luckAmount) {
      this.actor.spendLuck(luckAmount)
      this.successLevel = this.difficulty
      for (const s of this.increaseSuccess) {
        s.luckToSpend = s.luckToSpend - luckAmount
      }
      this.luckSpent = true
      this.isSuccess = true
      this.isFailure = false
      this.totalLuckSpent = !parseInt(this.totalLuckSpent)
        ? 0
        : parseInt(this.totalLuckSpent)
      this.totalLuckSpent += parseInt(luckAmount)
      this.computeCheck()
      if (update) this.updateChatCard()
    } else {
      this.forced = true
      this.forcedSuccess = true
      if (this.isUnknown) {
        this.forceSuccessLevel(CoC7Check.successLevel.regular, update)
      } else {
        this.forceSuccessLevel(this.difficulty, update)
      }
    }
  }

  forceFail (update = true) {
    this.forced = true
    this.forcedFailure = true
    if (this.isUnknown) {
      this.forceSuccessLevel(CoC7Check.successLevel.failure, update)
    } else {
      this.forceSuccessLevel(this.difficulty - 1, update)
    }
  }

  _forceCheck (high, low, update = true) {
    let total = Math.floor(Math.random() * (high - low)) + low + 1
    const unitTotal = total % 10
    let tenTotal = Math.floor(total / 10)
    const tens = []

    let hasEnough = Math.abs(this.diceModifier) === tens.length
    while (!hasEnough) {
      let ten = Math.floor(Math.random() * 10)
      let roll = ten * 10 + unitTotal
      if (roll === 0) {
        roll = 100
        ten = 100
      }
      if (this.hasPenalty && roll <= high) {
        tens.push(ten)
        if (roll > total) total = roll
      }
      if (this.hasBonus && roll > low) {
        tens.push(ten)
        if (roll < total) total = roll
      }
      hasEnough = tens.length === Math.abs(this.diceModifier)
    }

    // Insert result at random position.
    if (tenTotal === 10 && unitTotal === 0) {
      tenTotal = 100
    }
    tens.splice(
      Math.floor(Math.random() * tens.length + 1),
      0,
      tenTotal === 10 ? 0 : tenTotal
    )

    this.dices.tens = []
    this.dices.unit.value = unitTotal
    this.modifiedResult = total
    this.dices.total = total
    this.dices.tenResult = total - unitTotal

    const max = unitTotal === 0 ? 100 : 90
    const min = unitTotal === 0 ? 10 : 0
    let selected = total - unitTotal

    for (let i = 0; i < tens.length; i++) {
      const die = {}
      die.value = tens[i]
      if (die.value === selected) {
        selected = 101
        die.selected = true
        if (this.hasBonus) {
          die.isMax = true
          die.isMin = false
        } else {
          die.isMin = true
          die.isMax = false
        }
      } else {
        if (die.value === max) die.isMax = true
        else die.isMax = false
        if (die.value === min) die.isMin = true
        else die.isMin = false
      }
      // if( die.value == 100) die.value = "00";
      this.dices.tens.push(die)
    }

    this.computeCheck()
    if (update) this.updateChatCard()
  }

  forceSuccessLevel (successLevel, update = true) {
    let high, low
    if (CoC7Check.successLevel.fumble === successLevel) {
      high = 100
      low = this.fumbleThreshold - 1
    }
    if (CoC7Check.successLevel.failure === successLevel) {
      if (this.regularThreshold === this.fumbleThreshold - 1) {
        high = 100
      } else high = this.fumbleThreshold - 1
      low = this.regularThreshold
    }
    if (CoC7Check.successLevel.regular === successLevel) {
      high = this.regularThreshold
      low = this.hardThreshold
    }
    if (CoC7Check.successLevel.hard === successLevel) {
      high = this.hardThreshold
      low = this.extremeThreshold
    }
    if (CoC7Check.successLevel.extreme === successLevel) {
      high = this.extremeThreshold
      low = 1
    }
    if (CoC7Check.successLevel.critical === successLevel) {
      high = 1
      low = 0
    }
    if (high === low) low--
    if (high === 0) high = this.fumbleThreshold - 1
    this._forceCheck(high, low, update)
  }

  increaseSuccessLevel (update = true) {
    let high, low
    if (CoC7Check.successLevel.fumble === this.successLevel) {
      high = this.fumbleThreshold - 1
      if (this.regularThreshold === this.fumbleThreshold - 1) {
        low = this.hardThreshold
      } else {
        low = this.regularThreshold
      }
    }
    if (CoC7Check.successLevel.failure === this.successLevel) {
      high = this.regularThreshold
      low = this.hardThreshold
    }
    if (CoC7Check.successLevel.regular === this.successLevel) {
      high = this.hardThreshold
      low = this.extremeThreshold
    }
    if (CoC7Check.successLevel.hard === this.successLevel) {
      high = this.extremeThreshold
      low = this.criticalThreshold
    }
    if (CoC7Check.successLevel.extreme === this.successLevel) {
      high = this.criticalThreshold
      low = 0
    }
    if (high === low) low--
    this._forceCheck(high, low, update)
  }

  decreaseSuccessLevel (update = true) {
    let high, low
    if (CoC7Check.successLevel.failure === this.successLevel) {
      high = 100
      low = this.fumbleThreshold - 1
    }
    if (CoC7Check.successLevel.regular === this.successLevel) {
      high = this.fumbleThreshold - 1
      low = this.regularThreshold
    }
    if (CoC7Check.successLevel.hard === this.successLevel) {
      high = this.regularThreshold
      low = this.hardThreshold
    }
    if (CoC7Check.successLevel.extreme === this.successLevel) {
      high = this.hardThreshold
      low = this.extremeThreshold
    }
    if (CoC7Check.successLevel.critical === this.successLevel) {
      high = this.extremeThreshold
      low = 1
    }
    if (high === 0) high = this.fumbleThreshold - 1
    this._forceCheck(high, low, update)
  }

  async flagForDevelopement () {
    this.flaggedForDevelopment = true
    if (this.skill) await this.skill.flagForDevelopement()
  }

  set difficulty (x) {
    this._difficulty = parseInt(x)
  }

  get difficulty () {
    return this._difficulty
  }

  set flavor (x) {
    this._flavor = x
  }

  set context (x) {
    this._context = x
  }

  get context () {
    if (!this._context) return undefined
    return this._context
  }

  set parent (x) {
    if (!this.uuid) this.uuid = foundry.utils.randomID(16)
    this.parentUuid = x
  }

  get parent () {
    if (!this.parentUuid) return undefined
    return this.parentUuid
  }

  get flavor () {
    if (this._flavor) return this._flavor
    let flavor = ''
    if (this.actor?.system) {
      if (this.skill) {
        flavor = game.i18n.format('CoC7.CheckResult', {
          name: this.skill.name,
          value: this.rawValueString,
          difficulty: this.difficultyString
        })
      } else if (this.item) {
        flavor = game.i18n.format('CoC7.ItemCheckResult', {
          item: this.item.name,
          skill: this.skill.name,
          value: this.rawValueString,
          difficulty: this.difficultyString
        })
      } else if (this.characteristic) {
        flavor = game.i18n.format('CoC7.CheckResult', {
          name: game.i18n.format(
            this.actor.system.characteristics[this.characteristic].label
          ),
          value: this.rawValueString,
          difficulty: this.difficultyString
        })
      } else if (this.attribute) {
        flavor = game.i18n.format('CoC7.CheckResult', {
          name: game.i18n.format(
            `CoC7.${this.actor.system.attribs[this.attribute].label}`
          ),
          value: this.rawValueString,
          difficulty: this.difficultyString
        })
      } else if (this.displayName) {
        flavor = game.i18n.format('CoC7.CheckResult', {
          name: this.displayName,
          value: this.rawValueString,
          difficulty: this.difficultyString
        })
      }
    }

    if (!flavor) {
      if (this.rawValue) {
        if (this.displayName) {
          flavor = game.i18n.format('CoC7.CheckResult', {
            name: this.displayName,
            value: this.rawValueString,
            difficulty: this.difficultyString
          })
        } else {
          flavor = game.i18n.format('CoC7.CheckRawValue', {
            rawvalue: this.rawValue,
            difficulty: this.difficultyString
          })
        }
      }
    }

    if (this.pushing) {
      flavor = `${game.i18n.format('CoC7.Pushing')} ${flavor}`
    }

    return flavor
  }

  get tooltipHeader () {
    if (this.attribute) {
      return (
        game.i18n.format(
          `CoC7.LinkCheck${
            this.difficulty === CoC7Check.difficultyLevel.regular ? '' : 'Diff'
          }${!this.diceModifier ? '' : 'Modif'}`,
          {
            difficulty: this.difficultyString,
            modifier: this.diceModifier,
            name: game.i18n.format(
              `CoC7.${this.actor.system.attribs[this.attribute].label}`
            )
          }
        ) + ` (${this.actor.system.attribs[this.attribute].value}%)`
      )
    }
    if (this.characteristic) {
      return (
        game.i18n.format(
          `CoC7.LinkCheck${
            this.difficulty === CoC7Check.difficultyLevel.regular ? '' : 'Diff'
          }${!this.diceModifier ? '' : 'Modif'}`,
          {
            difficulty: this.difficultyString,
            modifier: this.diceModifier,
            name: game.i18n.localize(
              this.actor.system.characteristics[this.characteristic].label
            )
          }
        ) +
        ` (${this.actor.system.characteristics[this.characteristic].value}%)`
      )
    }
    if (this.skill) {
      return (
        game.i18n.format(
          `CoC7.LinkCheck${
            this.difficulty === CoC7Check.difficultyLevel.regular ? '' : 'Diff'
          }${!this.diceModifier ? '' : 'Modif'}`,
          {
            difficulty: this.difficultyString,
            modifier: this.diceModifier,
            name: this.skill.name
          }
        ) + ` (${this.skill.value}%)`
      )
    }
    if (this.displayName) {
      return (
        game.i18n.format(
          `CoC7.LinkCheck${
            this.difficulty === CoC7Check.difficultyLevel.regular ? '' : 'Diff'
          }${!this.diceModifier ? '' : 'Modif'}`,
          {
            difficulty: this.difficultyString,
            modifier: this.diceModifier,
            name: this.displayName
          }
        ) + ` (${this.rawValueString}%)`
      )
    }
    return null
  }

  async getHtmlRollElement (options = {}) {
    const template = 'systems/CoC7/templates/chat/rolls/in-card-roll.html'
    if (this.options) this.options = foundry.utils.mergeObject(this.options, options)
    else this.options = options
    const html = await renderTemplate(template, this)
    if (html) return $.parseHTML(html)[0]
    return null
  }

  async getHtmlRoll (options = {}) {
    const template = 'systems/CoC7/templates/chat/rolls/in-card-roll.html'
    if (this.options) this.options = foundry.utils.mergeObject(this.options, options)
    else this.options = options
    const html = await renderTemplate(template, this)
    return html || undefined
  }

  async toMessage (pushing = false) {
    // If card is provided atttached the roll to the card. If URID provided attach at this position.?
    this.pushing = pushing
    const template = 'systems/CoC7/templates/chat/roll-result.html'

    const html = await renderTemplate(template, this)

    const speakerData = {}
    let speaker
    if (this.actor) {
      if (this.actor.isToken) {
        speakerData.token = this.token.document
      } else if (this.actor.isDummy) {
        if (this.actor.name) speaker = { alias: this.actor.name }
      } else {
        speakerData.actor = this.actor
      }
      speaker = ChatMessage.getSpeaker(speakerData)
    } else {
      speaker = ChatMessage.getSpeaker()
    }

    const user = this.actor?.user ? this.actor.user : game.user

    const chatData = {
      user: user.id,
      speaker,
      flavor: this.flavor,
      content: html,
      flags: {
        CoC7: {
          type: CoC7Check.cardType
        }
      }
    }

    if (this.uuid) chatData.flags.CoC7.uuid = this.uuid
    if (this.context) chatData.flags.CoC7.context = this.context

    if (this.rollMode === 'selfroll') {
      if (game.user.isGM) {
        chatData.user = game.user.id
        chatData.flavor = `[${this.actor.name}] ${chatData.flavor}`
        chatData.flags = {
          CoC7: {
            GMSelfRoll: true
          }
        }
        if (typeof chatData.speaker !== 'undefined') {
          chatData.flags.CoC7.originalSpeaker = foundry.utils.duplicate(chatData.speaker)
        }
        if (game.user.isGM) {
          switch (game.settings.get('CoC7', 'selfRollWhisperTarget')) {
            case 'owners':
              delete chatData.speaker
              chatData.whisper = this.actor.owners
              chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER
              break

            case 'everyone':
              delete chatData.speaker
              chatData.whisper = game.users.players
              chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER
              break

            default:
              ChatMessage.applyRollMode(chatData, this.rollMode)
              break
          }
        }
      } else ChatMessage.applyRollMode(chatData, this.rollMode)
    }

    if (['gmroll', 'blindroll'].includes(this.rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (this.rollMode === 'blindroll') chatData.blind = true

    // ChatMessage.applyRollMode( chatData, this.rollMode);
    if (this.dice?.roll && !this.dice?.hideDice) {
      chatData.rolls = [this.dice.roll]
      chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
      chatData.rollMode = this.isBlind ? 'blindroll' : this.rollMode
    }

    ChatMessage.create(chatData).then(msg => {
      return msg
    })
  }

  /**
   *
   * @param {*} makePublic  Will change the roll mode to public
   */
  async updateChatCard ({ makePublic = false, forceRoll = false } = {}) {
    if (makePublic) this.rollMode = false // reset roll mode

    const chatData = { flavor: this.flavor }

    if (makePublic) {
      chatData.whisper = []
      chatData.blind = false
      ChatMessage.applyRollMode(chatData)
    } // else {
    // chatData.whisper = []
    // chatData.blind = false
    // ChatMessage.applyRollMode(chatData, game.settings.get('core', 'rollMode'))
    // }

    if (chatData.blind) {
      this.isBlind = true
    }

    const template = 'systems/CoC7/templates/chat/roll-result.html'
    const html = await renderTemplate(template, this)
    let newContent = html

    if (!this.messageId) return $.parseHTML(html)[0] // If no messageId return the HTMLElement containing the roll.
    // If no messageId

    const message = game.messages.get(this.messageId)
    const htmlMessage = $.parseHTML(message.content)[0]
    if (!htmlMessage.classList.contains('roll-result')) {
      const htmlCheck = $.parseHTML(html)[0]
      const rollResultElement = htmlMessage.querySelector('.roll-result')
      if (rollResultElement !== null) {
        rollResultElement.replaceWith(htmlCheck)
      }
      newContent = htmlMessage.outerHTML
    }

    chatData.content = newContent

    if (CONST.CHAT_MESSAGE_TYPES.ROLL === message.type) {
      if (message.whisper?.length) {
        chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER
      } else chatData.type = CONST.CHAT_MESSAGE_TYPES.OTHER
    }

    if (forceRoll && this.dice?.roll && (game.user.isGM || !this.isBlind)) {
      await CoC7Dice.showRollDice3d(this.dice.roll)
    }

    const msg = await message.update(chatData)
    await ui.chat.updateMessage(msg, false)
    return msg
  }

  static async updateCardSwitch (event) {
    const card = event.currentTarget.closest('.chat-card')
    const check = await CoC7Check.getFromCard(card)
    check.gmDifficultyRegular = false
    check.gmDifficultyHard = false
    check.gmDifficultyExtreme = false
    check.gmDifficultyCritical = false
    if (event.currentTarget.dataset.flag === 'gmDifficultyRegular') {
      check.gmDifficultyRegular = true
    }
    if (event.currentTarget.dataset.flag === 'gmDifficultyHard') {
      check.gmDifficultyHard = true
    }
    if (event.currentTarget.dataset.flag === 'gmDifficultyExtreme') {
      check.gmDifficultyExtreme = true
    }
    if (event.currentTarget.dataset.flag === 'gmDifficultyCritical') {
      check.gmDifficultyCritical = true
    }
    check.computeCheck()
    check.updateChatCard()
  }

  get tooltip () {
    return renderTemplate(
      'systems/CoC7/templates/chat/rolls/roll-tooltip.html',
      this
    )
  }

  get inlineCheck () {
    const a = document.createElement('a')
    a.classList.add('coc7-inline-check')
    a.classList.add('coc7-check-result')
    a.classList.add('coc7-inline')
    a.classList.add(...this.cssClassList)
    a.title = this.tooltipHeader
    a.dataset.roll = escape(this.JSONRollString) // TODO!IMPORTANT!!!
    a.innerHTML = `<i class="game-icon game-icon-d10"></i> ${
      this.modifiedResult || '??'
    }`
    return a
  }

  get rollToolTip () {
    if (this.standby) return undefined
    const parts = []
    const tens = this.dices.tens.map(r => {
      return {
        result: r.value,
        selected: r.selected,
        classes: [
          'die',
          'd10',
          !r.selected ? 'discarded' : null,
          r.isMin ? 'min' : null,
          r.isMax ? 'max' : null
        ]
          .filter(c => c)
          .join(' ')
      }
    })
    const unit = [
      {
        result: this.dices.unit.value,
        selected: true,
        classes: 'die d10'
      }
    ]

    parts.push({
      formula: this.tooltipHeader,
      total: this.modifiedResult,
      icons: this.successLevelIcons,
      class: this.cssClass,
      successRequired: this.successRequired,
      resultType: this.resultType,
      face: 10,
      rolls: [...tens, ...unit]
    })
    return renderTemplate(
      'systems/CoC7/templates/chat/rolls/roll-tooltip.html',
      { parts }
    )
  }

  get JSONRollData () {
    return JSON.parse(this.JSONRollString)
  }

  get JSONRollString () {
    return JSON.stringify(this, (key, value) => {
      if (value === null) return undefined
      const exclude = ['_actor', '_skill', '_item']
      if (exclude.includes(key)) return undefined
      return value
    })
  }

  static fromData (data) {
    return Object.assign(new CoC7Check(), data)
  }

  static fromRollString (dataString) {
    let data
    try {
      data = JSON.parse(unescape(dataString))
    } catch (err) {
      ui.notifications.error(err.message)
      return null
    }
    return CoC7Check.fromData(data)
  }

  static async alter (check, command, options = {}) {
    switch (command) {
      case 'useLuck': {
        if (options.target.classList.contains('pass-check')) {
          const luckAmount = parseInt(options.target.dataset.luckAmount)
          check.forcePass(luckAmount, options.update)
        } else {
          const upgradeIndex = parseInt(options.target.dataset.index)
          await check.upgradeCheck(upgradeIndex, options.update)
        }
        break
      }

      case 'force-pass': {
        check.forcePass(null, options.update)
        break
      }

      case 'force-fail': {
        check.forceFail(options.update)
        break
      }

      case 'increase-success-level': {
        check.increaseSuccessLevel(options.update)
        break
      }

      case 'decrease-success-level': {
        check.decreaseSuccessLevel(options.update)
        break
      }

      case 'reveal-check': {
        check.isBlind = false
        check.rollMode = false
        check.computeCheck()
        if (options.update) check.updateChatCard()
        break
      }

      case 'flag-for-development': {
        await check.flagForDevelopement()
        check.computeCheck()
        if (options.update) check.updateChatCard()
        break
      }

      case 'push': {
        await check._perform()
        check.pushing = true
        if (options.update) check.updateChatCard()
      }
    }
  }

  static async _onClickInlineRoll (event) {
    event.preventDefault()
    const a = event.currentTarget

    if (a.classList.contains('coc7-check-result')) {
      if (a.classList.contains('expanded')) {
        return CoC7Check._collapseInlineResult(a)
      } else {
        return CoC7Check._expandInlineResult(a)
      }
    }
  }

  static _collapseInlineResult (a) {
    if (!a.classList.contains('coc7-inline-check')) return
    if (!a.classList.contains('expanded')) return
    const tooltip = a.querySelector('.coc7-check-tooltip')
    if (tooltip) tooltip.remove()
    return a.classList.remove('expanded')
  }

  static async _expandInlineResult (a) {
    if (!a.classList.contains('coc7-inline-check')) return
    if (a.classList.contains('expanded')) return

    // Create a new tooltip
    const check = Object.assign(
      new CoC7Check(),
      JSON.parse(unescape(a.dataset.roll))
    ) // TODO : find stringify unescape !! 20210205
    if (check.standby) return

    const tip = document.createElement('div')
    tip.innerHTML = await check.rollToolTip

    // Add the tooltip
    const tooltip = tip.children[0]
    a.appendChild(tooltip)
    a.classList.add('expanded')

    // Set the position
    const pa = a.getBoundingClientRect()
    const pt = tooltip.getBoundingClientRect()
    tooltip.style.left = `${Math.min(
      pa.x,
      window.innerWidth - (pt.width + 3)
    )}px`
    tooltip.style.top = `${Math.min(
      pa.y + pa.height + 3,
      window.innerHeight - (pt.height + 3)
    )}px`
    const zi = getComputedStyle(a).zIndex
    tooltip.style.zIndex = Number.isNumeric(zi) ? zi + 1 : 100
  }
}
