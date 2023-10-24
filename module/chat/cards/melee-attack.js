/* global foundry, game, fromUuidSync,ui */
import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'
import { CoCID } from '../../../module/scripts/coc-id.js'
import { CoC7Check } from '../../check.js'

export class MeleeAttackCard extends EnhancedChatCard {
  get rollStates () {
    return {
      notRequested: -1,
      requested: 1,
      rolled: 2,
      closed: 3
    }
  }

  /**
   * Data initialisation before sending message to chat.
   * @override
   */
  async initialize () {
    this.data.states = {}
    this.data.objects = {}
    this.data.flags.rulesMode = this.hasTaget // By default, automatic mode is enabled
    this.data.flags.manualMode = !this.hasTaget
    this.data.flags.outnumbered = (this.defender && this.defender.isOutnumbered) // Check if there's a target and that taget is outnumbered already
    this.data.flags.autoHit = true // By default, surprise attacks hit automatically
    const skill = this.attacker.hasPlayerOwner ? await CoCID.fromCoCID('i.skill.stealth') : await CoCID.fromCoCID('i.skill.spot-hidden')
    const skillName = skill.length > 0 ? skill[0].name : ''
    this.data.checks = {
      detection: {
        name: skillName,
        difficulty: CoC7Check.difficultyLevel.regular,
        state: this.rollStates.notRequested
      }
    } // If the target is surprised, and the GM allows we roll by default Stealth for attack, Listen for defence (player should alsways perform the check)
  }

  /**
   * Extend and override the default options
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/melee-attack.hbs'
    })
  }

  /** @override */
  async assignObjects () {
    if (
      this.data.checks.detection.roll &&
      this.data.checks.detection.roll?.constructor?.name === 'Object'
    ) {
      this.data.checks.detection.roll = CoC7Check.fromData(this.data.checks.detection.roll)
    }
  }

  async getData () {
    const data = await super.getData()

    // Get card settings
    data.displayActorOnCard = game.settings.get('CoC7', 'displayActorOnCard')

    // Get card rolls
    if (this.data.checks.detection.roll && (this.data.checks.detection.state >= this.rollStates.rolled)) {
      data.htmlDetectionCheck = await this.data.checks.detection.roll.getHtmlRoll()
      data.htmlDetectionCheckInline = await this.data.checks.detection.roll.inlineCheck?.outerHTML
    }
    return data
  }

  get attacker () {
    if (!this.data.actorUuid) return undefined
    if (!this._actor) this._actor = fromUuidSync(this.data.actorUuid)
    return this._actor
  }

  get attackerWeapon () {
    if (!this.data.weaponUuid) return undefined
    if (!this._weapon) this._weapon = fromUuidSync(this.data.weaponUuid)
    return this._weapon
  }

  get defender () {
    if (!this.data.targetUuid) return { name: game.i18n.localize('CoC7.Dummy'), img: 'icons/svg/mystery-man-black.svg', type: undefined }
    if (!this._target) this._target = fromUuidSync(this.data.targetUuid)
    return this._target
  }

  get hasTaget () {
    return undefined !== this.defender.type
  }

  get detectionCheckActor () {
    if (this.attacker.hasPlayerOwner) return this.attacker
    if (this.defender.hasPlayerOwner) return this.defender
    return this.attacker
  }

  /**
   * Return the skillcheck to perform for detection
   */
  get detectionCheck () {
    const actor = this.detectionCheckActor
    if (actor) {
      const skill = actor.getSkillsByName(this.data.checks.detection.name)
      if (skill.length > 0) return skill[0]
    }
    return null
  }

  /**
   * Return true if the card has a valid detection check to propose.
   */
  get hasValidDetectionCheck () {
    return !!this.detectionCheck
  }

  async validateDetectionCheck (options) {
    this.data.checks.detection.state = this.rollStates.requested
    return true
  }

  async rollDetectionCheck (options) {
    this.data.checks.detection.roll = new CoC7Check
    this.data.checks.detection.roll.actor = this.detectionCheckActor
    this.data.checks.detection.roll.skill = this.detectionCheck
    this.data.checks.detection.roll.difficulty = this.data.checks.detection.difficulty

    if (!this.data.checks.detection.roll) return false
    await this.data.checks.detection.roll._perform({ forceDSN: true })
    this.data.checks.detection.state = this.rollStates.rolled
    return true
  }

  async useLuck (options) {
    const div = options.event.currentTarget.closest('[data-roll]')
    const roll = div.dataset.roll
    await CoC7Check.alter(this.data.checks[roll].roll, 'useLuck', {
      target: options.event.currentTarget,
      update: false
    })
    return true
  }

  async resolveSurpriseAttack (options) {
    this.data.checks.detection.state = this.rollStates.closed
    return true
  }
}
