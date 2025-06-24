/* global $, foundry, game, renderTemplate, Roll, ui */
import { COC7 } from '../../../core/config.js'
import { CoC7Check } from '../../../core/check.js'
import { CoC7Dice } from '../../../shared/dice/dice.js'
import { ChatCardActor } from '../../../shared/chat/card-actor.js'
import { createInlineRoll, chatHelper } from '../../../shared/dice/helper.js'

function replacer (key, value) {
  if (key.startsWith('__')) {
    return undefined // remove from result
  }

  const exclude = ['_actor']
  if (exclude.includes(key)) {
    return undefined
  }

  const checks = ['sanCheck', 'intCheck']
  if (checks.includes(key)) {
    return value.JSONRollData
  }

  return value // return as is
}

export class SanCheckCard extends ChatCardActor {
  constructor (actorKey = null, sanData = {}, options = {}) {
    super(
      actorKey,
      typeof options.fastForward !== 'undefined'
        ? Boolean(options.fastForward)
        : false
    )
    sanData.sanReason = sanData.sanReason ?? ''
    this.sanData = sanData
    this.options = options
    if (sanData.modifier && !isNaN(Number(sanData.modifier))) {
      this.options.sanModifier = Number(sanData.modifier)
    }
    if (sanData.difficulty && !isNaN(Number(sanData.difficulty))) {
      this.options.sanDifficulty = Number(sanData.difficulty)
    }
    this.state = {}
  }

  get isBlind () {
    return typeof this.options.isBlind !== 'undefined'
      ? Boolean(this.options.isBlind)
      : super.isBlind
  }

  get difficulty () {
    return typeof this.options.difficulty !== 'undefined'
      ? this.options.difficulty
      : CoC7Check.difficultyLevel.regular
  }

  get modifier () {
    return typeof this.options.modifier !== 'undefined'
      ? this.options.modifier
      : 0
  }

  get sanLossSource () {
    if (!this.sanData.tokenKey) return null
    return chatHelper.getActorFromKey(this.sanData.tokenKey)
  }

  get involuntaryAction () {
    if (
      this.state.sanRolled &&
      (this.sanCheck.isFailure || this.sanCheck.isFumble)
    ) {
      return true
    }
    return false
  }

  get sanLossFormula () {
    if (this.state.sanRolled) {
      if (this.sanData.sanMax && this.sanCheck.failed) {
        return !isNaN(Number(this.sanData.sanMax))
          ? Number(this.sanData.sanMax)
          : this.sanData.sanMax
      }
      if (this.sanData.sanMin && this.sanCheck.passed) {
        return !isNaN(Number(this.sanData.sanMin))
          ? Number(this.sanData.sanMin)
          : this.sanData.sanMin
      }
      return 0
    }
    return null
  }

  get sanLostToReason () {
    return this.actor.sanLostToReason(this.sanData.sanReason)
  }

  get maxPossibleSanLoss () {
    return this.actor.maxLossToSanReason(
      this.sanData.sanReason,
      this.sanData.sanMax
    )
  }

  get maxSanLoss () {
    return new Roll(this.sanData.sanMax.toString())[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
  }

  get sanLossReasonEncountered () {
    return this.actor.sanLossReasonEncountered(this.sanData.sanReason)
  }

  get firstEncounter () {
    return !this.actor.mythosInsanityExperienced
  }

  get isActorLoosingSan () {
    // No san loss during bout of mad.
    if (this.actor.hasTempoInsane) {
      return false
    }

    // The san loss is a 0
    if (this.sanLossFormula === 0) return false

    if (
      this.sanData.sanReason &&
      this.actor.maxLossToSanReason(
        this.sanData.sanReason,
        this.sanData.sanMax
      ) === 0
    ) {
      this.state.immuneToCreature = true
      return false
    }

    return true
  }

  get boutDurationText () {
    if (this.boutDuration) {
      if (this.boutRealTime) {
        return `${this.boutDuration} ${game.i18n.localize('CoC7.rounds')}`
      }
      if (this.boutSummary) {
        return `${this.boutDuration} ${game.i18n.localize('CoC7.hours')}`
      }
    }
    return null
  }

  get youGainCthulhuMythosString () {
    if (this.mythosGain) {
      return game.i18n.format('CoC7.YouGainedCthulhuMythos', {
        value: this.mythosGain
      })
    }
    return null
  }

  async advanceState (state) {
    switch (state) {
      case 'keepCreatureSanData': {
        this.state.keepCreatureSanData = true
        break
      }
      case 'involuntaryActionPerformed': {
        this.state[state] = true
        if (!this.isActorLoosingSan) this.state.finish = true
        break
      }
      case 'sanLossApplied': {
        await this.applySanLoss()
        break
      }
      case 'enterBoutOfMadnessRealTime': {
        this.boutDuration = (await new Roll('1D10').roll({ async: true })).total
        this.boutRealTime = true
        this.boutSummary = false
        this.boutResult = await this.actor.enterBoutOfMadness(
          true,
          this.boutDuration
        )
        this.state.boutOfMadnessResolved = true
        this.state.boutOfMadnessOver = false
        break
      }
      case 'enterBoutOfMadnessSummary': {
        this.boutDuration = (await new Roll('1D10').roll({ async: true })).total
        this.boutRealTime = false
        this.boutSummary = true
        this.boutResult = await this.actor.enterBoutOfMadness(
          false,
          this.boutDuration
        )
        this.state.boutOfMadnessResolved = true
        await this.triggerInsanity()
        break
      }
      case 'boutOfMadnessOver': {
        await this.actor.unsetCondition(COC7.status.tempoInsane)
        await this.triggerInsanity()
        break
      }
      case 'noMythosGained': {
        this.state.cthulhuMythosAwarded = true
        this.mythosGain = 0
        break
      }
      case 'cthulhuMythosAwarded': {
        let amountGained = 1
        if (!this.actor.mythosInsanityExperienced) {
          amountGained = 5
          await this.actor.experienceFirstMythosInsanity()
        }
        this.state.cthulhuMythosAwarded = true
        const cthulhuMythosSkill = this.actor.cthulhuMythosSkill
        const oldValue =
          cthulhuMythosSkill.system.adjustments.experience || 0
        if (cthulhuMythosSkill) {
          await cthulhuMythosSkill.update({
            'system.adjustments.experience': oldValue + amountGained
          })
        }
        this.mythosGain = amountGained
        break
      }
    }
  }

  async bypassRollSan () {
    this.isBypassed = true
    this.sanCheck = new CoC7Check()
    this.sanCheck.actor = this.actorKey
    this.sanCheck.attribute = 'san'
    this.sanCheck.difficulty =
      this.options.sanDifficulty || CoC7Check.difficultyLevel.regular
    this.sanCheck.diceModifier = this.options.sanModifier || 0
    await this.sanCheck._perform({ forceDSN: true })
    this.state.sanRolled = true
    this.state.involuntaryActionPerformed = this.sanCheck.passed
    this.state.sanLossRolled = true
    this.state.ignoreSanCheck = true
    this.preHardenedSanLoss = this.originalSanLoss = this.sanLossFormula
    this.sanLoss = this.applyMythosHardened(this.preHardenedSanLoss)
  }

  applyMythosHardened (sanLoss) {
    return this.actor.useMythosHardened ? Math.floor(sanLoss / 2) : sanLoss
  }

  async rollSan () {
    this.sanCheck = new CoC7Check()
    this.sanCheck.actor = this.actorKey
    this.sanCheck.attribute = 'san'
    this.sanCheck.difficulty =
      this.options.sanDifficulty || CoC7Check.difficultyLevel.regular
    this.sanCheck.diceModifier = this.options.sanModifier || 0
    await this.sanCheck._perform({ forceDSN: true })
    this.state.sanRolled = true
    this.state.involuntaryActionPerformed = this.sanCheck.passed
    if (!this.isActorLoosingSan) {
      this.state.finish = true
      if (this.actor.hasTempoInsane) {
        this.state.immuneAlreadyInBout = true
        if (!this.sanCheck.passed) this.state.finish = false
      }
      this.state.sanLossRolled = true
      this.state.sanLossApplied = true
      this.state.intRolled = true
      this.state.insanity = false
      this.preHardenedSanLoss = 0
      this.originalSanLoss = 0
    } else if (typeof this.sanLossFormula === 'number') {
      this.state.sanLossRolled = true
      this.originalSanLoss = this.sanLossFormula
      if (this.sanData.sanReason) {
        const max = this.actor.maxLossToSanReason(
          this.sanData.sanReason,
          this.sanData.sanMax
        )
        this.preHardenedSanLoss = this.originalSanLoss
        if (this.preHardenedSanLoss > max) {
          this.preHardenedSanLoss = max
          this.state.limitedLossToCreature = true
        }
      } else {
        this.preHardenedSanLoss = this.originalSanLoss
      }
    } else if (this.sanCheck.isFumble) {
      this.state.sanLossRolled = true
      this.originalSanLoss = new Roll(this.sanData.sanMax)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
      this.preHardenedSanLoss = this.actor.maxLossToSanReason(
        this.sanData.sanReason,
        this.originalSanLoss
      )
    } else if (this.sanData.sanReason) {
      const min = new Roll(this.sanLossFormula)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ minimize: true }).total
      const max = this.actor.maxLossToSanReason(
        this.sanData.sanReason,
        this.sanData.sanMax
      )
      if (min >= max) {
        this.state.sanLossRolled = true
        this.preHardenedSanLoss = this.originalSanLoss = this.max
        this.state.limitedLossToCreature = true
      }
    }

    this.sanLoss = this.applyMythosHardened(this.preHardenedSanLoss)
  }

  async rollSanLoss () {
    this.sanLossRoll = new Roll(`${this.sanLossFormula}`)

    await this.sanLossRoll.roll({ async: true })

    await CoC7Dice.showRollDice3d(this.sanLossRoll)

    const max = this.actor.maxLossToSanReason(
      this.sanData.sanReason,
      this.sanData.sanMax
    )

    if (this.sanLossRoll.total > max) {
      this.state.limitedLossToCreature = true
    }

    this.originalSanLoss = this.sanLossRoll.total
    this.preHardenedSanLoss = Math.min(this.originalSanLoss, max)
    this.sanLoss = this.applyMythosHardened(this.preHardenedSanLoss)
    this.state.sanLossRolled = true
  }

  async applySanLoss () {
    await this.actor.looseSan(this.sanData.sanReason, this.sanLoss)

    if (this.sanLoss > 0) this.state.actorLostSan = true
    this.state.sanLossApplied = true
    if (this.actor.san <= 0) {
      this.state.intRolled = true
      this.state.boutOfMadnessOver = true

      this.state.insanity = true
      this.state.permanentlyInsane = true

      this.state.finish = true
      return
    }

    if (this.sanLoss < 5) {
      this.state.intRolled = true
      if (this.actor.hasIndefInsane) {
        this.state.insanity = true
        this.state.shaken = true
        this.state.insanityTableRolled = false
        this.state.finish = false
        this.state.intRolled = true
      } else {
        this.state.insanity = false
        this.state.shaken = true
        this.state.insanityTableRolled = true
        this.state.finish = true
      }
    } else {
      this.state.intRolled = false
    }

    if (this.actor.dailySanLoss >= this.actor.dailySanLimit) {
      // this.actor.san/5
      this.state.insanity = true
      this.state.intRolled = true
      this.state.temporaryInsane = false
      this.state.indefinitelyInsane = true
      this.state.insanityTableRolled = false
      this.state.memoryRepressed = false
      this.state.finish = false
    }
  }

  async rollInt () {
    this.intCheck = new CoC7Check()
    this.intCheck.actor = this.actorKey
    this.intCheck.characteristic = 'int'
    this.intCheck.difficulty =
      this.options.intDifficulty || CoC7Check.difficultyLevel.regular
    this.intCheck.diceModifier = this.options.intModifier || 0
    await this.intCheck._perform({ forceDSN: true })
    this.state.intRolled = true
    if (this.intCheck.passed || this.state.alreadyInsane) {
      this.state.insanity = true
      this.state.temporaryInsane = true
      this.state.indefinitelyInsane = false
      this.state.memoryRepressed = false
    } else {
      this.state.insanity = false
      this.state.temporaryInsane = false
      this.state.indefinitelyInsane = false
      this.state.memoryRepressed = true
      this.state.finish = true
    }
  }

  async triggerInsanity () {
    this.state.boutOfMadnessOver = true
    if (this.state.indefinitelyInsane) {
      await this.actor.setCondition(COC7.status.indefInsane)
    }
    this.state.finish = true
  }

  async clearSanLossReason () {
    await this.actor.setReasonSanLoss(this.sanData.sanReason, 0)
    if (!this.sanLossReasonEncountered) {
      this.state.keepCreatureSanData = true
    }
  }

  async updateChatCard () {
    // Attache the sanCheck result to the message.
    if (this.state.sanRolled) {
      this.__inlineSanCheck = this.sanCheck.inlineCheck.outerHTML
    }

    if (this.sanLossRoll) {
      const a = createInlineRoll(this.sanLossRoll)
      this.__inlineSanLossRoll = a.outerHTML
    }

    if (this.state.intRolled && this.intCheck) {
      this.__inlineIntCheck = this.intCheck.inlineCheck.outerHTML
    }

    const html = await renderTemplate(SanCheckCard.template, this)
    const htmlCardElement = $.parseHTML(html)[0]

    // Attach the sanCheckCard object to the message.
    htmlCardElement.dataset.object = escape(JSON.stringify(this, replacer))

    // Update the message.
    const chatMessage = game.messages.get(this.messageId)

    const msg = await chatMessage.update({
      content: htmlCardElement.outerHTML
    })
    await ui.chat.updateMessage(msg, false)
    return msg
  }

  static get template () {
    return 'systems/CoC7/templates/chat/cards/san-check.html'
  }

  static checkTargets (sanData, fastForward = false) {
    const targets = [...game.user.targets]
    if (targets.length) {
      for (const t of targets) {
        if (t.actor.isToken) {
          SanCheckCard.create(t.actor.tokenKey, sanData, {
            fastForward
          })
        } else {
          SanCheckCard.create(t.actor.id, sanData, { fastForward })
        }
      }
    } else {
      ui.notifications.warn(game.i18n.localize('CoC7.WarnNoTargetsSanCheck'))
    }
  }

  static async create (...args) {
    const chatCard = new SanCheckCard(...args)
    if (chatCard.actor.hasIndefInsane) {
      chatCard.state.alreadyInsane = true
    }

    if (chatCard.actor.san <= 0) {
      chatCard.state.intRolled = true
      chatCard.state.boutOfMadnessOver = true

      chatCard.state.insanity = true
      chatCard.state.permanentlyInsane = true

      chatCard.state.finish = true
    }

    const html = await renderTemplate(SanCheckCard.template, chatCard)
    const htmlCardElement = $.parseHTML(html)[0]

    htmlCardElement.dataset.object = escape(JSON.stringify(chatCard, replacer))
    await chatCard.say(htmlCardElement.outerHTML)
  }

  static getFromMessageId (messageId) {
    const message = game.messages.get(messageId)
    const htmlMessage = $.parseHTML(message.content)[0]

    const htmlCard = htmlMessage.querySelector('.chat-card')

    return SanCheckCard.getFromCard(htmlCard)
  }

  static getFromCard (card) {
    const sanCheckCardData = JSON.parse(unescape(card.dataset.object))

    const sanCheckCard = new SanCheckCard()
    Object.assign(sanCheckCard, sanCheckCardData)
    if (!sanCheckCard.messageId) {
      sanCheckCard.messageId = card.closest('.message').dataset.messageId
    }

    if (sanCheckCard.sanCheck?.constructor?.name === 'Object') {
      sanCheckCard.sanCheck = Object.assign(
        new CoC7Check(),
        sanCheckCard.sanCheck
      )
    }

    if (sanCheckCard.intCheck?.constructor?.name === 'Object') {
      sanCheckCard.intCheck = Object.assign(
        new CoC7Check(),
        sanCheckCard.intCheck
      )
    }

    if (sanCheckCard.sanLossRoll?.constructor?.name === 'Object') {
      sanCheckCard.sanLossRoll = Roll.fromData(sanCheckCard.sanLossRoll)
    }

    return sanCheckCard
  }
}
