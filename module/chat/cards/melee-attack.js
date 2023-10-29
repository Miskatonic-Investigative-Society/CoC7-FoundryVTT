/* global foundry, game, fromUuidSync */
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
      },
      attack: {
        state: this.rollStates.notRequested
      },
      defense: {
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

  get strings () {
    return {
      youPerformManeuver: () => { return game.i18n.format('CoC7.YouPerformManeuver', { name: this.attackerWeapon.name }) },
      youPerformAttack: () => { return game.i18n.format('CoC7.YouPerformAttack', { name: this.attackerWeapon.name }) }
    }
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

  get attackerSkills () {
    if (!this.attackerWeapon) return null
    if (this.attackerWeapon.type === 'skill') return [this.attackerWeapon]
    return this.attacker.getWeaponSkills(this.data.weaponUuid)
  }

  get isAttackManeuver () {
    if (!this.attackerWeapon) return false
    if (this.attackerWeapon.type === 'skill') return true
    if (this.attackerWeapon.type === 'weapon') return this.attackerWeapon.system.properties.mnvr
    return false
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
    if (this.defender?.hasPlayerOwner) return this.defender
    return this.attacker
  }

  get statusList () {
    const statusList = []
    if (this.isAttackManeuver) {
      statusList.push({ name: game.i18n.localize('CoC7.AttackManeuver') })
      if (this.defender) statusList.push({ name: `${game.i18n.localize('CoC7.Build')}:${this.attacker.build}/${this.defender.build}` })
    }
    if (this.data.flags.overrideRules) statusList.push({ name: game.i18n.localize('CoC7.OverrideRules'), hint: game.i18n.localize('CoC7.hint.OverrideRules') })
    if (this.data.flags.outnumbered) statusList.push({ name: game.i18n.localize('CoC7.Outnumbered'), hint: game.i18n.localize('CoC7.hint.TargetOutnumbered') })
    if (this.data.flags.surprised) {
      statusList.push({ name: game.i18n.localize('CoC7.SurpriseAttack'), hint: game.i18n.localize('CoC7.hint.SurpriseAttack') })
      if (this.data.flags.canDetect) {
        if (this.attacker.hasPlayerOwner) statusList.push({ name: game.i18n.localize('CoC7.PlayerTryToSurprise'), hint: game.i18n.localize('CoC7.hint.PlayerShouldBeRolling') })
        else statusList.push({ name: game.i18n.localize('CoC7.PlayerTryToDetect'), hint: game.i18n.localize('CoC7.hint.PlayerShouldBeRolling') })
        if (this.data.checks.detection.state > this.rollStates.notRequested) {
          if (this.hasValidDetectionCheck) statusList.push({ name: `${game.i18n.format('CoC7.Roll')}: ${this.data.checks.detection.name}` })
          if (this.data.checks.detection.state >= this.rollStates.rolled) {
            if (this.data.checks.detection.roll?.passed) statusList.push({ name: game.i18n.localize('CoC7.Success'), css: 'success' })
            else if (this.data.checks.detection.roll.isFumble) statusList.push({ name: game.i18n.localize('CoC7.Fumble'), css: 'fumble' })
            else statusList.push({ name: game.i18n.localize('CoC7.Failure'), css: 'failure' })
          }
        }
      }
      if (this.attackGetSurpriseBonus) {
        if (this.data.flags.suprisedBonusDice) statusList.push({ name: game.i18n.localize('CoC7.GainBonusDie') })
        if (this.data.flags.autoHit) statusList.push({ name: game.i18n.localize('CoC7.AutoHit'), hint: game.i18n.localize('CoC7.hint.AutoHit') })
      }
    }

    if (this.totalAttackBonus !== 0) {
      statusList.push({ name: `${game.i18n.localize('CoC7.AttackModifier')}: ${this.totalAttackBonus}` })
    }

    return statusList
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

  get surpriseResolved () {
    return !this.data.flags.surprised || (this.data.checks.detection.state === this.rollStates.closed)
  }

  get attackGetSurpriseBonus () {
    return (this.data.flags.surprised && !this.data.flags.canDetect) || // Suprise can't be avoided
    (this.attacker.hasPlayerOwner && this.data.flags.canDetect && this.data.checks.detection.roll?.passed) || // Suprise can be avoided, player initiate attack, check success
    (!this.attacker.hasPlayerOwner && this.data.flags.canDetect && this.data.checks.detection.roll?.isFailure) // Suprise can be avoided, player receive attack, check fail
  }

  get totalAttackBonus () {
    if (this.data.flags.overrideRules) return this.data.bonusDice
    if (this.data.flags.surprised && this.data.flags.autoHit) return 0
    let totalBonus = 0
    if (this.attackGetSurpriseBonus && this.data.flags.suprisedBonusDice) totalBonus += 1
    if (this.data.flags.outnumbered) totalBonus += 1
    return totalBonus
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
    this.data.checks.detection.roll = new CoC7Check()
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

  async requestAttack (options) {
    this.data.checks.attack.state = this.rollStates.requested
    if (!this.data.flags.surprised || (this.data.flags.surprised && !this.data.flags.autoHit)) this.data.checks.defense.state = this.rollStates.requested
    return true
  }

  async rollAttackCheck (options) {
    return true
  }

  async rollDefenseCheck (options) {
    return true
  }

  async fightBack (options) {
    this.data.checks.defense.fightBack = true
    this.data.checks.defense.dodge = false
    this.data.checks.defense.maneuver = false
    this.data.checks.defense.doNothing = false
    // ui.notifications.info('fightBack')
    return true
  }
}
