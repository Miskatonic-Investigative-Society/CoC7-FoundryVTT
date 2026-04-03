/* global ChatMessage CONST foundry fromUuid game renderTemplate Roll TokenDocument ui */
import { FOLDER_ID, STATUS_EFFECTS } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'
import deprecated from '../deprecated.js'

export default class CoC7SanCheckCard {
  #actorLostSan
  #alreadyInsane
  #asyncActor
  #asyncSource
  #boutDuration
  #boutOfMadnessOver
  #boutOfMadnessResolved
  #boutRealTime
  #boutSummary
  #boutResult
  #cardOpen
  #cthulhuMythosAwarded
  #diceIntPool
  #diceSanPool
  #hasInsanity
  #immuneAlreadyInBout
  #immuneToCreature
  #indefinitelyInsane
  #intRolled
  #involuntaryActionPerformed
  #keepCreatureSanData
  #limitedLossToCreature
  #memoryRepressed
  #mythosGained
  #permanentlyInsane
  #preHardenedSanLoss
  #rolledSanLoss
  #sanLossApplied
  #sanLossFinal
  #sanLossRolled
  #sanMax
  #sanMin
  #sanReason
  #sanRolled
  #skipSanRoll
  #temporaryInsane

  /**
   * Constructor
   */
  constructor () {
    this.#actorLostSan = false
    this.#alreadyInsane = false
    // this.#asyncActor = undefined
    // this.#asyncSource = undefined
    this.#boutDuration = 0
    this.#boutOfMadnessOver = false
    this.#boutOfMadnessResolved = false
    this.#boutRealTime = false
    this.#boutSummary = false
    this.#boutResult = false
    this.#cardOpen = true
    this.#cthulhuMythosAwarded = false
    this.#diceIntPool = CoC7DicePool.newPool({
      difficulty: CoC7DicePool.difficultyLevel[game.settings.get(FOLDER_ID, 'defaultCheckDifficulty')],
      flatDiceModifier: 0,
      flatThresholdModifier: 0,
      poolModifiers: [0],
      threshold: undefined
    })
    this.#diceSanPool = CoC7DicePool.newPool({
      difficulty: CoC7DicePool.difficultyLevel[game.settings.get(FOLDER_ID, 'defaultCheckDifficulty')],
      flatDiceModifier: 0,
      flatThresholdModifier: 0,
      poolModifiers: [0],
      threshold: undefined
    })
    this.#hasInsanity = false
    this.#involuntaryActionPerformed = false
    this.#immuneAlreadyInBout = false
    this.#immuneToCreature = false
    this.#indefinitelyInsane = false
    this.#intRolled = false
    this.#keepCreatureSanData = false
    this.#limitedLossToCreature = false
    this.#memoryRepressed = false
    this.#mythosGained = 0
    this.#permanentlyInsane = false
    this.#preHardenedSanLoss = 0
    this.#rolledSanLoss = 0
    this.#sanLossApplied = false
    this.#sanLossFinal = 0
    this.#sanLossRolled = false
    this.#sanMax = '0'
    this.#sanMin = '0'
    this.#sanReason = ''
    this.#sanRolled = false
    this.#skipSanRoll = false
    this.#temporaryInsane = false
  }

  /**
   * Get Sanity Loss Formula
   * @returns {string|integer}
   */
  get sanLossFormula () {
    if (this.#diceSanPool.isRolled) {
      if (this.#sanMax && !this.#diceSanPool.diceGroups[0].isSuccess) {
        return !isNaN(Number(this.#sanMax)) ? Number(this.#sanMax) : this.#sanMax
      }
      if (this.#sanMin && this.#diceSanPool.diceGroups[0].isSuccess) {
        return !isNaN(Number(this.#sanMin)) ? Number(this.#sanMin) : this.#sanMin
      }
    } else if (this.#skipSanRoll) {
      return !isNaN(Number(this.#sanMax)) ? Number(this.#sanMax) : this.#sanMax
    }
    return 0
  }

  /**
   * Is San loss greater than zero
   * @returns {boolean}
   */
  async isActorLosingSan () {
    // No san loss during bout of mad.
    const actor = (await this.actor)
    if (actor.hasTempoInsane) {
      return false
    }

    // The san loss is a 0
    if (this.sanLossFormula === 0) {
      return false
    }

    if (this.#sanReason && actor.maxLossToSanReason(this.#sanReason, this.#sanMax) === 0) {
      this.#immuneToCreature = true
      return false
    }

    return true
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget?.dataset?.action) {
      case 'keepCreatureSanData':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            check.#keepCreatureSanData = true
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'involuntaryActionPerformed':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            check.#involuntaryActionPerformed = true
            if (!await check.isActorLosingSan()) {
              check.#cardOpen = false
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'sanLossApplied':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            await check.applySanLoss()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'enterBoutOfMadnessRealTime':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            const actor = (await check.actor)
            check.#boutDuration = (await new Roll('1D10').roll()).total
            check.#boutRealTime = true
            check.#boutSummary = false
            check.#boutResult = await actor.enterBoutOfMadness(true, check.#boutDuration)
            check.#boutOfMadnessResolved = true
            check.#boutOfMadnessOver = false
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'enterBoutOfMadnessSummary':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            const actor = (await check.actor)
            check.#boutDuration = (await new Roll('1D10').roll()).total
            check.#boutRealTime = false
            check.#boutSummary = true
            check.#boutResult = await actor.enterBoutOfMadness(false, check.#boutDuration)
            check.#boutOfMadnessResolved = true
            await check.triggerInsanity()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'boutOfMadnessOver':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            const actor = (await check.actor)
            await actor.conditionsUnset([STATUS_EFFECTS.tempoInsane])
            await check.triggerInsanity()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'noMythosGained':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            check.#cthulhuMythosAwarded = true
            check.#mythosGained = 0
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'cthulhuMythosAwarded':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            const actor = (await check.actor)
            let amountGained = 1
            if (!actor.mythosInsanityExperienced) {
              amountGained = 5
              await actor.experienceFirstMythosInsanity()
            }
            check.#cthulhuMythosAwarded = true
            const cthulhuMythosSkill = actor.cthulhuMythosSkill
            if (cthulhuMythosSkill) {
              await cthulhuMythosSkill.update({
                'system.adjustments.experience': parseInt(cthulhuMythosSkill.system.adjustments.experience, 10) + parseInt(amountGained, 10)
              })
            }
            check.#mythosGained = amountGained
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'roll-int-check':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            await check.rollInt()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'roll-san-loss':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            await check.rollSanLoss()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'rollSanCheck':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            await check.rollSan()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'reset-creature-san-data':
        {
          const check = await CoC7SanCheckCard.loadFromMessage(message)
          if (check) {
            await check.clearSanLossReason()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
    }
  }

  /**
   * If Actor is Mythos Hardened and it is enabled half the sanity loss
   * @param {integer} sanLoss
   * @returns {integer}
   */
  async applyMythosHardened (sanLoss) {
    const actor = (await this.actor)
    return actor.useMythosHardened ? Math.floor(sanLoss / 2) : sanLoss
  }

  /**
   * Roll Sanity check
   */
  async rollSan () {
    const actor = (await this.actor)
    if (!this.#skipSanRoll) {
      this.#diceSanPool.threshold = actor.system.attribs.san.value
      await this.#diceSanPool.roll()
      this.#involuntaryActionPerformed = this.#diceSanPool.isSuccess
    }
    this.#sanRolled = true
    if (!await this.isActorLosingSan()) {
      if (actor.hasTempoInsane) {
        this.#immuneAlreadyInBout = true
        if (this.#diceSanPool.isSuccess) {
          this.#cardOpen = false
        }
      } else {
        this.#cardOpen = false
      }
      this.#sanLossRolled = true
      this.#sanLossApplied = true
      this.#intRolled = true
      this.#hasInsanity = false
      this.#preHardenedSanLoss = 0
      this.#rolledSanLoss = 0
    } else if (typeof this.sanLossFormula === 'number') {
      this.#sanLossRolled = true
      this.#rolledSanLoss = this.sanLossFormula
      if (this.#sanReason) {
        const max = actor.maxLossToSanReason(this.#sanReason, this.#sanMax)
        this.#preHardenedSanLoss = this.#rolledSanLoss
        if (this.#preHardenedSanLoss > max) {
          this.#preHardenedSanLoss = max
          this.#limitedLossToCreature = true
        }
      } else {
        this.#preHardenedSanLoss = this.#rolledSanLoss
      }
    } else if (this.#diceSanPool.isFumble) {
      this.#sanLossRolled = true
      this.#rolledSanLoss = new Roll(this.#sanMax).evaluateSync({ maximize: true }).total
      this.#preHardenedSanLoss = actor.maxLossToSanReason(this.#sanReason, this.#rolledSanLoss)
    } else if (this.#sanReason) {
      const min = new Roll(this.sanLossFormula).evaluateSync({ minimize: true }).total
      const max = actor.maxLossToSanReason(this.#sanReason, this.#sanMax)
      if (min >= max) {
        this.#sanLossRolled = true
        this.#preHardenedSanLoss = this.#rolledSanLoss = max
        this.#limitedLossToCreature = true
      }
    }

    this.#sanLossFinal = await this.applyMythosHardened(this.#preHardenedSanLoss)
  }

  /**
   * Roll Sanity Loss
   */
  async rollSanLoss () {
    const sanLossRoll = await new Roll(this.sanLossFormula.toString(), {}, { reason: 'sanloss' }).roll()
    this.message.rolls.push(sanLossRoll)

    const actor = (await this.actor)
    const max = actor.maxLossToSanReason(this.#sanReason, this.#sanMax)

    if (sanLossRoll.total > max) {
      this.#limitedLossToCreature = true
    }

    this.#rolledSanLoss = sanLossRoll.total
    this.#preHardenedSanLoss = Math.min(this.#rolledSanLoss, max)
    this.#sanLossFinal = await this.applyMythosHardened(this.#preHardenedSanLoss)
    this.#sanLossRolled = true
  }

  /**
   * Apply Sanity Loss
   */
  async applySanLoss () {
    const actor = (await this.actor)
    await actor.loseSan(this.#sanReason, this.#sanLossFinal)

    if (this.#sanLossFinal > 0) {
      this.#actorLostSan = true
    }
    this.#sanLossApplied = true
    if (actor.system.attribs.san.value <= 0) {
      this.#intRolled = true
      this.#boutOfMadnessOver = true

      this.#hasInsanity = true
      this.#permanentlyInsane = true

      this.#cardOpen = false
      return
    }

    if (this.#sanLossFinal < 5) {
      this.#intRolled = true
      if (actor.hasIndefInsane) {
        this.#hasInsanity = true
        this.#cardOpen = true
        this.#intRolled = true
      } else {
        this.#hasInsanity = false
        this.#cardOpen = false
      }
    } else {
      this.#intRolled = false
    }

    if (actor.system.attribs.san.dailyLoss >= actor.system.attribs.san.dailyLimit) {
      this.#hasInsanity = true
      this.#intRolled = true
      this.#indefinitelyInsane = true
      this.#cardOpen = true
    }
  }

  /**
   * Roll Intelligence check
   */
  async rollInt () {
    const actor = (await this.actor)
    this.#diceIntPool.threshold = actor.system.characteristics.int.value
    await this.#diceIntPool.roll()
    this.#intRolled = true
    if (this.#diceIntPool.isSuccess || this.#alreadyInsane) {
      this.#hasInsanity = true
      this.#temporaryInsane = true
    } else {
      this.#hasInsanity = false
      this.#memoryRepressed = true
      this.#cardOpen = false
    }
  }

  /**
   * Trigger Insanity on actor if required
   */
  async triggerInsanity () {
    this.#boutOfMadnessOver = true
    if (this.#indefinitelyInsane) {
      const actor = (await this.actor)
      await actor.conditionsSet([STATUS_EFFECTS.indefInsane])
    }
    this.#cardOpen = false
  }

  /**
   * Clear Sanity Loss to this reason
   */
  async clearSanLossReason () {
    const actor = (await this.actor)
    await actor.setReasonSanLoss(this.#sanReason, 0)
  }

  /**
   * Template to use for sanity check message
   * @returns {string}
   */
  static get template () {
    return 'systems/' + FOLDER_ID + '/templates/chat/san-check.hbs'
  }

  /**
   * Send san card to each targeted actor
   * @param {object} sanData
   */
  static checkTargets (sanData) {
    const targets = [...game.user.targets]
    if (targets.length) {
      for (const target of targets) {
        CoC7SanCheckCard.create(CoC7Utilities.getActorUuid(target), sanData)
      }
    } else {
      ui.notifications.warn('CoC7.WarnNoTargetsSanCheck', { localize: true })
    }
  }

  /**
   * Constructor
   * @param {string} actorUuid
   * @param {object} sanData
   * @param {string} sanData.sanMax
   * @param {string} sanData.sanMin
   * @param {string} sanData.sanReason
   * @param {string} sanData.sourceUuid
   * @param {integer|false} sanData.difficulty
   * @param {integer} sanData.poolModifier
   * @param {boolean} sanData.skipSanRoll
   */
  static async create (actorUuid, sanData) {
    const sanDataNormalized = foundry.utils.mergeObject({ sanMax: '0', sanMin: '0', sanReason: '', sourceUuid: '', difficulty: false, poolModifier: 0, skipSanRoll: false, flavor: null }, sanData)
    if (typeof sanDataNormalized.modifier !== 'undefined') {
      deprecated.warningLogger({
        was: 'roll.modifier',
        now: 'roll.poolModifier',
        until: 15
      })
      sanDataNormalized.poolModifier = sanDataNormalized.modifier ?? 0
      delete sanDataNormalized.modifier
    }
    const chatCard = new CoC7SanCheckCard()
    chatCard.actor = actorUuid
    chatCard.source = sanDataNormalized.sourceUuid
    chatCard.#sanMax = sanDataNormalized.sanMax
    chatCard.#sanMin = sanDataNormalized.sanMin
    chatCard.#sanReason = sanDataNormalized.sanReason
    if (typeof sanDataNormalized.poolModifier !== 'undefined') {
      chatCard.#diceSanPool.poolModifier = sanDataNormalized.poolModifier
    }
    if (typeof sanDataNormalized.poolModifier !== 'undefined' && sanDataNormalized.difficulty !== false) {
      chatCard.#diceSanPool.difficulty = sanDataNormalized.difficulty
    }

    const actor = (await chatCard.actor)
    if (actor.hasIndefInsane) {
      chatCard.#alreadyInsane = true
    }
    if (actor.system.attribs.san.value <= 0) {
      chatCard.#intRolled = true
      chatCard.#boutOfMadnessOver = true
      chatCard.#hasInsanity = true
      chatCard.#permanentlyInsane = true
      chatCard.#cardOpen = false
    }

    if (sanDataNormalized.skipSanRoll) {
      chatCard.#skipSanRoll = true
      chatCard.#involuntaryActionPerformed = true
      await chatCard.rollSan()
    }

    chatCard.toMessage({ flavor: sanDataNormalized.flavor })
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
   * Get source document promise
   * @returns {Promise<Document>} async Actor
   */
  get source () {
    return this.#asyncSource
  }

  /**
   * Set source document from document/uuid
   * @param {string} value
   */
  set source (value) {
    this.#asyncSource = (typeof value === 'string' && value.length ? fromUuid(value) : undefined)
  }

  /**
   * Create Message Data object
   * @returns {object}
   */
  async getTemplateData () {
    const actor = (await this.actor)
    const source = (await this.source)
    const data = {
      actorLostSan: this.#actorLostSan,
      actorHasTempoInsane: actor?.hasTempoInsane,
      actorImg: (actor?.isToken ? actor.token.texture.src : (actor instanceof TokenDocument ? actor.texture.src : actor?.img)),
      actorInt: actor?.system.characteristics.int.value,
      actorName: (actor?.isToken ? actor.token.name : actor?.name),
      actorSan: actor?.system.attribs.san.value,
      actorTempoInsaneDurationText: actor?.getTempoInsaneDurationText,
      actorUseMythosHardened: actor?.useMythosHardened,
      actorUuid: CoC7Utilities.getActorUuid(actor),
      alreadyInsane: this.#alreadyInsane,
      bonusDice: Math.abs(this.#diceSanPool.poolModifier),
      bonusType: game.i18n.localize(this.#diceSanPool.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus'),
      boutDuration: this.#boutDuration,
      boutOfMadnessOver: this.#boutOfMadnessOver,
      boutOfMadnessResolved: this.#boutOfMadnessResolved,
      boutRealTime: this.#boutRealTime,
      boutSummary: this.#boutSummary,
      boutResult: this.#boutResult,
      cardOpen: this.#cardOpen,
      cthulhuMythosAwarded: this.#cthulhuMythosAwarded,
      diceGroup: this.#diceSanPool.diceGroups[0],
      firstEncounter: !actor?.mythosInsanityExperienced,
      flavor: game.i18n.format('CoC7.CheckResult', {
        name: CoC7Utilities.getAttributeNames('san')?.label ?? '?',
        value: this.#diceSanPool.thresholdString,
        difficulty: CoC7DicePool.difficultyString(this.#diceSanPool.difficulty)
      }),
      foundryGeneration: game.release.generation,
      hasInsanity: this.#hasInsanity,
      immuneAlreadyInBout: this.#immuneAlreadyInBout,
      immuneToCreature: this.#immuneToCreature,
      intBonusDice: Math.abs(this.#diceIntPool.poolModifier),
      intBonusType: game.i18n.localize(this.#diceIntPool.poolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus'),
      intDiceGroup: this.#diceIntPool.diceGroups[0],
      intRolled: this.#intRolled,
      indefinitelyInsane: this.#indefinitelyInsane,
      involuntaryActionPerformed: this.#involuntaryActionPerformed,
      keepCreatureSanData: this.#keepCreatureSanData,
      limitedLossToCreature: this.#limitedLossToCreature,
      memoryRepressed: this.#memoryRepressed,
      mythosGained: this.#mythosGained,
      maxPossibleSanLoss: actor?.maxLossToSanReason(this.#sanReason, this.#sanMax),
      maxRollableSanLoss: new Roll(this.#sanMax.toString()).evaluateSync({ maximize: true }).total,
      permanentlyInsane: this.#permanentlyInsane,
      preHardenedSanLoss: this.#preHardenedSanLoss,
      rolledSanLoss: this.#rolledSanLoss,
      sanCheckFailed: this.#diceSanPool.isRolled && !this.#diceSanPool.isSuccess,
      sanCheckPassed: this.#skipSanRoll || (this.#diceSanPool.isRolled && this.#diceSanPool.isSuccess),
      sanLossApplied: this.#sanLossApplied,
      sanLossFinal: this.#sanLossFinal,
      sanLossFormula: this.sanLossFormula,
      sanLostToReason: actor?.sanLostToReason(this.#sanReason),
      sanLossReasonEncountered: actor?.sanLossReasonEncountered(this.#sanReason),
      sanLossRolled: this.#sanLossRolled,
      sanLossRoll: await this.message?.rolls?.find(r => r.options?.reason === 'sanloss')?.render(),
      sanMax: this.#sanMax,
      sanMin: this.#sanMin,
      sanReason: this.#sanReason,
      sanRolled: this.#sanRolled,
      skipSanRoll: this.#skipSanRoll,
      sourceImg: (source ? (source.isToken ? source.token.texture.src : (source instanceof TokenDocument ? source.texture.src : source.img)) : ''),
      sourceName: (source ? (source.isToken ? source.token.name : source.name) : ''),
      sourceUuid: CoC7Utilities.getActorUuid(source),
      temporaryInsane: this.#temporaryInsane,
      youGainCthulhuMythosString: (this.#mythosGained ? game.i18n.format('CoC7.YouGainedCthulhuMythos', { value: this.#mythosGained }) : '')
    }
    return data
  }

  /**
   * Create Chat Message object
   * @returns {object}
   */
  async getChatData () {
    const data = await this.getTemplateData()
    const chatData = {
      flags: {
        [FOLDER_ID]: {
          load: {
            as: 'CoC7SanCheckCard',
            actorUuid: data.actorUuid,
            actorLostSan: this.#actorLostSan,
            alreadyInsane: this.#alreadyInsane,
            boutDuration: this.#boutDuration,
            boutOfMadnessOver: this.#boutOfMadnessOver,
            boutOfMadnessResolved: this.#boutOfMadnessResolved,
            boutRealTime: this.#boutRealTime,
            boutSummary: this.#boutSummary,
            boutResult: this.#boutResult,
            cardOpen: this.#cardOpen,
            cthulhuMythosAwarded: this.#cthulhuMythosAwarded,
            diceIntPool: this.#diceIntPool.toObject(),
            diceSanPool: this.#diceSanPool.toObject(),
            hasInsanity: this.#hasInsanity,
            immuneAlreadyInBout: this.#immuneAlreadyInBout,
            immuneToCreature: this.#immuneToCreature,
            intRolled: this.#intRolled,
            indefinitelyInsane: this.#indefinitelyInsane,
            involuntaryActionPerformed: this.#involuntaryActionPerformed,
            keepCreatureSanData: this.#keepCreatureSanData,
            limitedLossToCreature: this.#limitedLossToCreature,
            memoryRepressed: this.#memoryRepressed,
            mythosGained: this.#mythosGained,
            permanentlyInsane: this.#permanentlyInsane,
            preHardenedSanLoss: this.#preHardenedSanLoss,
            rolledSanLoss: this.#rolledSanLoss,
            sanLossApplied: this.#sanLossApplied,
            sanLossFinal: this.#sanLossFinal,
            sanLossRolled: this.#sanLossRolled,
            sanMax: this.#sanMax,
            sanMin: this.#sanMin,
            sanReason: this.#sanReason,
            sanRolled: this.#sanRolled,
            skipSanRoll: this.#skipSanRoll,
            sourceUuid: data.sourceUuid,
            temporaryInsane: this.#temporaryInsane
          }
        }
      },
      rolls: (this.message?.rolls ?? []).concat(this.#diceSanPool.newRolls).concat(this.#diceIntPool.newRolls),
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(CoC7SanCheckCard.template, data)
    }
    if (typeof this.message?.whisper === 'undefined') {
      if ([CONST.DICE_ROLL_MODES.PRIVATE].includes(game.settings.get('core', 'rollMode'))) {
        chatData.whisper = ChatMessage.getWhisperRecipients('GM')
      } else if (CONST.DICE_ROLL_MODES.BLIND === game.settings.get('core', 'rollMode')) {
        chatData.blind = true
      }
    }

    return chatData
  }

  /**
   * Create CoC7SanCheckCard from message
   * @param {Document} message
   * @returns {CoC7SanCheckCard}
   */
  static async loadFromMessage (message) {
    const keys = [
      'actorUuid',
      'actorLostSan',
      'alreadyInsane',
      'boutDuration',
      'boutOfMadnessOver',
      'boutOfMadnessResolved',
      'boutRealTime',
      'boutResult',
      'boutSummary',
      'cardOpen',
      'cthulhuMythosAwarded',
      'hasInsanity',
      'immuneAlreadyInBout',
      'immuneToCreature',
      'indefinitelyInsane',
      'intRolled',
      'involuntaryActionPerformed',
      'keepCreatureSanData',
      'limitedLossToCreature',
      'memoryRepressed',
      'mythosGained',
      'permanentlyInsane',
      'preHardenedSanLoss',
      'rolledSanLoss',
      'sanLossApplied',
      'sanLossFinal',
      'sanLossRolled',
      'sanMax',
      'sanMin',
      // 'sanReason' - Not always required
      'sanRolled',
      'skipSanRoll',
      // 'sourceUuid' - Not always required
      'temporaryInsane'
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7SanCheckCard' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined') && CoC7DicePool.isValidPool(message.flags[FOLDER_ID]?.load?.diceIntPool) && CoC7DicePool.isValidPool(message.flags[FOLDER_ID]?.load?.diceSanPool)) {
      const check = new CoC7SanCheckCard()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.actor = load.actorUuid
      check.#actorLostSan = load.actorLostSan
      check.#alreadyInsane = load.alreadyInsane
      check.#boutDuration = load.boutDuration
      check.#boutOfMadnessOver = load.boutOfMadnessOver
      check.#boutOfMadnessResolved = load.boutOfMadnessResolved
      check.#boutRealTime = load.boutRealTime
      check.#boutSummary = load.boutSummary
      check.#boutResult = load.boutResult
      check.#cardOpen = load.cardOpen
      check.#cthulhuMythosAwarded = load.cthulhuMythosAwarded
      check.#diceIntPool = CoC7DicePool.fromObject(load.diceIntPool)
      check.#diceSanPool = CoC7DicePool.fromObject(load.diceSanPool)
      check.#hasInsanity = load.hasInsanity
      check.#immuneAlreadyInBout = load.immuneAlreadyInBout
      check.#immuneToCreature = load.immuneToCreature
      check.#intRolled = load.intRolled
      check.#indefinitelyInsane = load.indefinitelyInsane
      check.#involuntaryActionPerformed = load.involuntaryActionPerformed
      check.#keepCreatureSanData = load.keepCreatureSanData
      check.#limitedLossToCreature = load.limitedLossToCreature
      check.#memoryRepressed = load.memoryRepressed
      check.#mythosGained = load.mythosGained
      check.#permanentlyInsane = load.permanentlyInsane
      check.#preHardenedSanLoss = load.preHardenedSanLoss
      check.#rolledSanLoss = load.rolledSanLoss
      check.#sanLossApplied = load.sanLossApplied
      check.#sanLossFinal = load.sanLossFinal
      check.#sanLossRolled = load.sanLossRolled
      check.#sanMax = load.sanMax
      check.#sanMin = load.sanMin
      check.#sanReason = load.sanReason
      check.#sanRolled = load.sanRolled
      check.#skipSanRoll = load.skipSanRoll
      check.source = load.sourceUuid
      check.#temporaryInsane = load.temporaryInsane
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
  }

  /**
   * Create a Chat Message
   * @param {object} options
   * @param {string|null} options.flavor
   */
  async toMessage ({ flavor = null } = {}) {
    const chatData = await this.getChatData()
    if (flavor) {
      chatData.flavor = flavor
    }
    this.message = (await ChatMessage.create(chatData))
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
      }
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
        element.addEventListener('click', event => CoC7SanCheckCard._onClickEvent(event, message))
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
      const dataSet = JSON.parse(decodeURIComponent(contents.dataset.object))
      const intPoolModifier = dataSet.intCheck?._diceModifier ?? 0
      const intRolls = dataSet.intCheck?.dices?.tens ?? []
      const sanPoolModifier = dataSet.sanCheck?._diceModifier ?? 0
      const sanRolls = dataSet.sanCheck?.dices?.tens ?? []
      const update = {
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7SanCheckCard',
        ['flags.' + FOLDER_ID + '.load.actorUuid']: actorUuid,
        ['flags.' + FOLDER_ID + '.load.actorLostSan']: dataSet.state?.sanLossApplied ?? false,
        ['flags.' + FOLDER_ID + '.load.alreadyInsane']: dataSet.state?.alreadyInsane ?? false,
        ['flags.' + FOLDER_ID + '.load.boutDuration']: dataSet.boutDuration ?? 0,
        ['flags.' + FOLDER_ID + '.load.boutOfMadnessOver']: dataSet.state?.boutOfMadnessOver ?? false,
        ['flags.' + FOLDER_ID + '.load.boutOfMadnessResolved']: dataSet.state?.boutOfMadnessResolved ?? false,
        ['flags.' + FOLDER_ID + '.load.boutRealTime']: dataSet.state?.boutRealTime ?? false,
        ['flags.' + FOLDER_ID + '.load.boutSummary']: dataSet.state?.boutSummary ?? false,
        ['flags.' + FOLDER_ID + '.load.boutResult']: dataSet.state?.boutResult ?? false,
        ['flags.' + FOLDER_ID + '.load.cardOpen']: dataSet.state?.finish ?? true,
        ['flags.' + FOLDER_ID + '.load.cthulhuMythosAwarded']: typeof dataSet.mythosGain !== 'undefined',
        ['flags.' + FOLDER_ID + '.load.diceIntPool.bonusCount']: Math.min(0, intPoolModifier),
        ['flags.' + FOLDER_ID + '.load.diceIntPool.currentPoolModifier']: intPoolModifier,
        ['flags.' + FOLDER_ID + '.load.diceIntPool.difficulty']: dataSet.intCheck?.dices?.difficulty ?? CoC7DicePool.difficultyLevel.regular,
        ['flags.' + FOLDER_ID + '.load.diceIntPool.flatDiceModifier']: dataSet.intCheck?.flatDiceModifier ?? 0,
        ['flags.' + FOLDER_ID + '.load.diceIntPool.flatThresholdModifier']: dataSet.intCheck?.flatThresholdModifier ?? 0,
        ['flags.' + FOLDER_ID + '.load.diceIntPool.luckSpent']: 0,
        ['flags.' + FOLDER_ID + '.load.diceIntPool.groups']: [],
        ['flags.' + FOLDER_ID + '.load.diceIntPool.penaltyCount']: Math.max(0, intPoolModifier),
        ['flags.' + FOLDER_ID + '.load.diceIntPool.rolledDice']: [
          {
            rolled: typeof dataSet.intCheck?.dices?.total !== 'undefined',
            baseDie: (intRolls.shift())?.value ?? 0,
            bonusDice: (intPoolModifier > 0 ? intRolls.map(r => r.value) : []),
            penaltyDice: (intPoolModifier < 0 ? intRolls.map(r => r.value) : []),
            unitDie: dataSet.intCheck?.dices?.unit?.value ?? 0
          }
        ],
        ['flags.' + FOLDER_ID + '.load.diceIntPool.suppressRollData']: false,
        ['flags.' + FOLDER_ID + '.load.diceSanPool.bonusCount']: Math.min(0, sanPoolModifier),
        ['flags.' + FOLDER_ID + '.load.diceSanPool.currentPoolModifier']: sanPoolModifier,
        ['flags.' + FOLDER_ID + '.load.diceSanPool.difficulty']: dataSet.sanCheck?.dices?.difficulty ?? CoC7DicePool.difficultyLevel.regular,
        ['flags.' + FOLDER_ID + '.load.diceSanPool.flatDiceModifier']: dataSet.sanCheck?.flatDiceModifier ?? 0,
        ['flags.' + FOLDER_ID + '.load.diceSanPool.flatThresholdModifier']: dataSet.sanCheck?.flatThresholdModifier ?? 0,
        ['flags.' + FOLDER_ID + '.load.diceSanPool.luckSpent']: 0,
        ['flags.' + FOLDER_ID + '.load.diceSanPool.groups']: [],
        ['flags.' + FOLDER_ID + '.load.diceSanPool.penaltyCount']: Math.max(0, sanPoolModifier),
        ['flags.' + FOLDER_ID + '.load.diceSanPool.rolledDice']: [
          {
            rolled: typeof dataSet.sanCheck?.dices?.total !== 'undefined',
            baseDie: (sanRolls.shift())?.value ?? 0,
            bonusDice: (sanPoolModifier > 0 ? sanRolls.map(r => r.value) : []),
            penaltyDice: (sanPoolModifier < 0 ? sanRolls.map(r => r.value) : []),
            unitDie: dataSet.sanCheck?.dices?.unit?.value ?? 0
          }
        ],
        ['flags.' + FOLDER_ID + '.load.diceSanPool.suppressRollData']: false,
        ['flags.' + FOLDER_ID + '.load.hasInsanity']: dataSet.state?.insanity ?? false,
        ['flags.' + FOLDER_ID + '.load.immuneAlreadyInBout']: dataSet.state?.immuneAlreadyInBout ?? false,
        ['flags.' + FOLDER_ID + '.load.immuneToCreature']: dataSet.state?.immuneToCreature ?? false,
        ['flags.' + FOLDER_ID + '.load.intRolled']: dataSet.state?.intRolled ?? false,
        ['flags.' + FOLDER_ID + '.load.indefinitelyInsane']: dataSet.state?.indefinitelyInsane ?? false,
        ['flags.' + FOLDER_ID + '.load.involuntaryActionPerformed']: dataSet.state?.involuntaryActionPerformed ?? false,
        ['flags.' + FOLDER_ID + '.load.keepCreatureSanData']: dataSet.state?.keepCreatureSanData ?? false,
        ['flags.' + FOLDER_ID + '.load.limitedLossToCreature']: dataSet.state?.limitedLossToCreature ?? false,
        ['flags.' + FOLDER_ID + '.load.memoryRepressed']: dataSet.state?.memoryRepressed ?? false,
        ['flags.' + FOLDER_ID + '.load.mythosGained']: dataSet.mythosGain ?? 0,
        ['flags.' + FOLDER_ID + '.load.permanentlyInsane']: dataSet.state?.permanentlyInsane ?? false,
        ['flags.' + FOLDER_ID + '.load.preHardenedSanLoss']: dataSet.state?.preHardenedSanLoss ?? 0,
        ['flags.' + FOLDER_ID + '.load.rolledSanLoss']: dataSet.originalSanLoss ?? 0,
        ['flags.' + FOLDER_ID + '.load.sanLossApplied']: dataSet.state?.sanLossApplied ?? false,
        ['flags.' + FOLDER_ID + '.load.sanLossFinal']: dataSet.sanLoss ?? false,
        ['flags.' + FOLDER_ID + '.load.sanLossRolled']: dataSet.state?.sanLossRolled ?? false,
        ['flags.' + FOLDER_ID + '.load.sanMax']: dataSet.sanData?.sanMax ?? '0',
        ['flags.' + FOLDER_ID + '.load.sanMin']: dataSet.sanData?.sanMin ?? '0',
        ['flags.' + FOLDER_ID + '.load.sanReason']: dataSet.sanData?.sanReason ?? '0',
        ['flags.' + FOLDER_ID + '.load.sanRolled']: dataSet.state?.sanRolled ?? false,
        ['flags.' + FOLDER_ID + '.load.skipSanRoll']: dataSet.skipSanRoll ?? false,
        ['flags.' + FOLDER_ID + '.load.sourceUuid']: '',
        ['flags.' + FOLDER_ID + '.load.temporaryInsane']: dataSet.state?.temporaryInsane ?? false
      }
      const matches = dataSet.sanData?.tokenKey.match(/^([^.]+)/)
      if (matches) {
        update['flags.' + FOLDER_ID + '.load.sourceUuid'] = CoC7Utilities.oldStyleToUuid(dataSet.sanData?.tokenKey)
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7SanCheckCard.loadFromMessage(merged)
      const data = await check.getTemplateData()
      data.actorHasTempoInsane = update['flags.' + FOLDER_ID + '.load.temporaryInsane']
      data.actorImg = ''
      data.actorName = ''
      data.actorTempoInsaneDurationText = ''
      if (typeof data.actorInt === 'undefined') {
        data.actorInt = dataSet.intCheck?._rawValue ?? 0
      }
      if (typeof data.actorSan === 'undefined') {
        data.actorSan = dataSet.sanCheck?._rawValue ?? 0
      }
      data.actorUseMythosHardened = (dataSet.sanLoss ?? 0) < (dataSet.preHardenedSanLoss ?? 0)
      update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(CoC7SanCheckCard.template, data)
      update._id = message.id
      updates.push(update)
    }
  }
}
