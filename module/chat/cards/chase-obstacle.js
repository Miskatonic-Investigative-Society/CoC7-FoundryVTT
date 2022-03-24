import { CoC7Check } from '../../check.js'
import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'
import { CoC7Dice } from '../../dice.js'
import { _participant } from '../../items/chase/participant.js'
import { CoC7Utilities } from '../../utilities.js'
import { createInlineRoll } from '../helper.js'

export class ChaseObstacleCard extends EnhancedChatCard {
  /** @override */
  static get defaultOptions () {
    const options = mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/chase-obstacle.html',
      GMUpdate: true
    })
    options.classes.push('obstacle-card')
    return options
  }

  /** @override */
  async getData () {
    const data = await super.getData()

    const ppp = this.participant

    // data.chase = CoC7Utilities.fromUuid(this.data.chaseUuid)
    data.status = []
    data.strings = {}

    data.displayActorOnCard = game.settings.get('CoC7', 'displayActorOnCard')
    // data.participant = new _participant(this.participantData)

    data.card.breakableObstacle =
      data.data.obstacle.barrier && data.data.obstacle.hasHitPoints
    data.card.validCheck = false

    if (
      data.data.states.obstacleDefined &&
      (data.data.obstacle.hazard ||
        (data.data.obstacle.barrier && !data.data.obstacle.hasHitPoints))
    ) {
      data.data.states.tryToNegotiate = true
      data.data.states.tryToBreak = false
      data.data.states.breakOrPassDefined = true
    }

    if (this.participant.actor) {
      data.skill = this.participant.actor.find(data.data.obstacle.checkName)
      data.checkOptions = this.chase.activeActorSkillsAndCharacteristics
      if (data.skill) {
        data.validCheck = true
        data.validSkill = true
      } else if (data.data.obstacle.checkName && data.data.card.checkThreshold)
        data.validCheck = true
    } else {
      data.checkOptions = this.chase.allSkillsAndCharacteristics
      data.dummyActor = true
      if (data.data.obstacle.checkName && data.data.card.checkThreshold)
        data.validCheck = true
    }

    data.customWeapon = false
    if ('0' === this.data.card.weaponChoice) {
      data.customWeapon = true
    }

    if (data.validCheck) {
      let checkName, value
      if (data.skill) {
        checkName = data.skill.value.name
        value = data.skill.value.value
      } else {
        checkName = data.data.obstacle.checkName
        value = data.data.card.checkThreshold
      }
      data.strings.checkRollRequest = game.i18n.format('CoC7.AskRoll', {
        name: checkName,
        value: value
      })
      if (data.data.card.bonusDice != 0) {
        if (data.data.card.bonusDice > 0)
          data.strings.checkRollRequest += ` (+${data.data.card.bonusDice})`
        else data.strings.checkRollRequest += ` (${data.data.card.bonusDice})`
      }
    }

    if (data.data.states?.obstacleDefined) {
      data.strings.obstacleDefined = game.i18n.format('CoC7.FacingObstacle', {
        type: data.data.obstacle.barrier
          ? game.i18n.localize('CoC7.ABarrier')
          : game.i18n.localize('CoC7.AHazard')
      })
      if (data.data.obstacle.name)
        data.strings.obstacleDefined += ` (${data.data.obstacle.name})`

      data.data.states.canAskRoll = true
      data.data.states.obstacleCanBeBroken = false
      if (data.data.obstacle.barrier) {
        data.status.push({ name: game.i18n.localize('CoC7.Barrier') })
        if (data.data.obstacle.hasHitPoints) {
          data.status.push({ name: game.i18n.localize('CoC7.Breakable') })
          data.data.states.obstacleCanBeBroken = true
        }
      }
      if (data.data.obstacle.hazard)
        data.status.push({ name: game.i18n.localize('CoC7.Hazard') })

      if (!data.validCheck) {
        data.status.push({
          name: game.i18n.localize('CoC7.NoValidCheck'),
          css: 'error'
        })
        data.strings.EnterValueTitle = game.i18n.format(
          'CoC7.SkillSelectBase',
          { name: data.data.obstacle.checkName }
        )
        if (!data.data.card.checkThreshold) data.data.states.canAskRoll = false
      } else if (!data.validSkill) {
        data.status.push({
          name: game.i18n.localize('CoC7.NoValidSkill'),
          css: 'warning'
        })
      }

      if (this.data.states.tryToBreak) {
        let damageStatus = game.i18n.localize('CoC7.BreakDown')
        if (this.data.objects?.obstacleDamageRoll?.total)
          damageStatus += ` :${this.data.objects.obstacleDamageRoll.total}`
        data.status.push({
          name: damageStatus
        })
      }

      if (this.data.states.tryToNegotiate) {
        data.status.push({ name: game.i18n.localize('CoC7.Negotiate') })
      }

      if (this.data.objects?.check) {
        if (this.data.objects.check.passed)
          data.status.push({
            name: game.i18n.localize('CoC7.Success'),
            css: 'success'
          })
        else if (this.data.objects.check.isFumble)
          data.status.push({
            name: game.i18n.localize('CoC7.Fumble'),
            css: 'fumble'
          })
        else
          data.status.push({
            name: game.i18n.localize('CoC7.Failure'),
            css: 'failure'
          })
      }
    }

    if (this.data.states.checkRolled) {
      if (this.data.states.cardResolved)
        data.htmlCheck = await this.data.objects.check.inlineCheck?.outerHTML
      else data.htmlCheck = await this.data.objects.check.getHtmlRoll()
    }

    if (this.data.objects?.failedDamageRoll) {
      if (!data.data.card.armor) {
        if (this.participant.actor)
          data.data.card.armor =
            this.participant.actor.data.data.attribs.armor.value || 0
      }
      if (data.data.card.armor) {
        if (isNaN(Number(data.data.card.armor))) data.data.card.armor = null
      }
    }

    if (this.data.states.cardResolved) {
      if (this.data.obstacle.hasDamage && this.data.objects?.check?.isFailure) {
        data.damageTaken = true
        data.inlineDamageTakenRoll = createInlineRoll(
          this.data.objects.failedDamageRoll
        )?.outerHTML
        data.status.push({
          name:
            game.i18n.localize('CoC7.TotalDamage') +
            ` :${this.data.objects.failedDamageRoll.total}`
        })
      }

      if (
        this.data.obstacle.hasActionCost &&
        this.data.obstacle.hazard &&
        this.data.objects?.check?.isFailure
      ) {
        data.actionLost = true
        data.inlineActionLostRoll = createInlineRoll(
          this.data.objects.failedActionRoll
        )?.outerHTML
        data.status.push({
          name:
            game.i18n.localize('CoC7.ActionCost') +
            ` :${this.data.objects.failedActionRoll.total}`
        })
      }
    }
    return data
  }

  /** @override */
  async GMUpdate () {
    if (!game.user.isGM) {
      console.error('CoC7: GMUpdate called from non GM user')
      return
    }
    if (this.data.states.cardResolved) {
      if (this.data.states.failedConsequencesRolled) {
        if (this.data.objects?.failedActionRoll?.total)
          await this.chase.alterParticipantMovementAction(
            this.participant.uuid,
            0 - this.data.objects.failedActionRoll.total
          )
        if (this.data.objects?.failedDamageRoll?.total) {
          if (this.participant.actor)
            await this.participant.actor.dealDamage(
              this.data.objects.failedDamageRoll.total,
              { ignoreArmor: false }
            )
        }
      } else {
        const move = this.data.forward ? 1 : -1
        const targetLocation = this.chase.getLocationShift(this.location.uuid, { skip: move})
        if (!targetLocation || !targetLocation.uuid) return
        await this.chase.alterParticipantMovementAction(
          this.participant.uuid,
          0 - Math.abs(move)
        )
        await this.chase.moveParticipantToLocation(
          this.participant.uuid,
          targetLocation.uuid,
          { render: true }
        )

        this._chase = null
        this._participant = null
      }
    }
  }

  /** @override */
  async localCompute () {
    if (this.data.states.checkRolled && this.data.objects?.check?.passed)
      this.data.states.cardResolved = true
  }

  /** @override */
  async assignObjects () {
    if (
      this.data.objects?.check &&
      this.data.objects.check?.constructor?.name === 'Object'
    ) {
      this.data.objects.check = CoC7Check.fromData(this.data.objects.check)
    }

    if (
      this.data.objects?.obstacleDamageRoll &&
      this.data.objects.obstacleDamageRoll?.constructor?.name === 'Object'
    ) {
      this.data.objects.obstacleDamageRoll = Roll.fromData(
        this.data.objects.obstacleDamageRoll
      )
    }
    if (
      this.data.objects?.failedDamageRoll &&
      this.data.objects.failedDamageRoll?.constructor?.name === 'Object'
    ) {
      this.data.objects.failedDamageRoll = Roll.fromData(
        this.data.objects.failedDamageRoll
      )
    }
    if (
      this.data.objects?.failedActionRoll &&
      this.data.objects.failedActionRoll?.constructor?.name === 'Object'
    ) {
      this.data.objects.failedActionRoll = Roll.fromData(
        this.data.objects.failedActionRoll
      )
    }
  }

  /** @override */
  async initialize () {
    // const chase = await fromUuid(this.data.chaseUuid)
    if (!this.chase) return

    if (undefined == this.data.card) this.data.card = {}
    if (undefined == this.data.states) this.data.states = {}

    // const location = chase.getLocationData(this.data.locationUuid)
    this.data.obstacle = this.location?.obstacleDetails
    // this.data.participantData = chase.activeParticipantData
    if (this.participantData?.bonusDice > 0) {
      this.data.card.bonusDice = this.participantData.bonusDice
      this.data.flags.consumeBonusDice = true
    }
  }

  get participant () {
    if (!this.participantData) return undefined
    // if (!this._participant)
    //   this._participant = new _participant(this.participantData)
    // return this._participant
    return new _participant( this.participantData) //TO RESET 
  }

  get participantData () {
    if (!this.chase) return undefined
    return this.chase.activeParticipantData
  }

  get location () {
    if (!this.chase) return undefined
    return this.chase.getLocationData(this.data.locationUuid)
  }

  get obstacle () {
    if (!this.location) return undefined
    return this.location.obstacleDetails
  }

  get chase () {
    if (!this.data.chaseUuid) return undefined
    if (!this._chase) this._chase = CoC7Utilities.fromUuid(this.data.chaseUuid)
    return this._chase
  }

  get roll () {
    let rollData
    if (this.participant.actor && this.data.obstacle.checkName) {
      rollData = this.participant.actor.find(this.data.obstacle.checkName)
      rollData.actor = { actorKey: this.participant.actor.id }
    } else {
      if (this.data.obstacle.checkName && this.data.card.checkThreshold) {
        rollData = {
          type: 'value',
          value: {
            name: this.data.obstacle.checkName,
            threshold: this.data.card.checkThreshold
          },
          actor: {
            name: this.participant.name
          }
        }
      }
    }
    if (rollData) {
      rollData.diceModifier = this.data.card?.bonusDice || 0
      rollData.difficulty = CoC7Check.difficultyLevel.regular
    }
    return rollData || undefined
  }

  get validFailedRolls () {
    if (!this.data.objects?.check?.isFailure) return false
    if (this.data.obstacle.hasDamage) {
      if (!this.data.obstacle.failedCheckDamage) return false
      if (
        this.data.obstacle.failedCheckDamage &&
        !Roll.validate(this.data.obstacle.failedCheckDamage)
      )
        return false
    }
    if (this.data.obstacle.hazard && this.data.obstacle.hasActionCost) {
      if (!this.data.obstacle.failedActionCost) return false
      if (
        this.data.obstacle.failedActionCost &&
        !Roll.validate(this.data.obstacle.failedActionCost)
      )
        return false
    }
    return true
  }

  get weaponsOptions () {
    const weapons = []
    this.participant.actor?.itemTypes?.weapon?.forEach(w => {
      let formula = w.data.data.range.normal.damage
      let db = this.participant.actor.db
      if (null === db || 0 === Number(db)) {
        db = ''
      } else {
        db = `${db}`
      }

      if (db && !db.startsWith('-')) db = '+' + db
      if (w.data.data.properties.addb) formula = formula + db
      if (w.data.data.properties.ahbd) formula = formula + db + '/2'
      weapons.push({
        name: `${w.data.name} (${formula})`,
        damage: formula,
        uuid: w.uuid
      })
    })
    weapons.sort((a, b) => {
      var nameA = a.name.toUpperCase()
      var nameB = b.name.toUpperCase()
      if (nameA < nameB) return -1
      if (nameA > nameB) return 1
      return 0
    })

    if (
      !weapons.find(w =>
        w.name
          .toUpperCase()
          .startsWith(
            game.i18n.localize('CoC7.UnarmedWeaponName')?.toUpperCase()
          )
      )
    ) {
      let db = ''
      if (this.participant.actor) {
        db = this.participant.actor.db
        if (db && !db.startsWith('-')) db = '+' + db
        if (null === db || 0 === Number(db)) db = ''
      }

      weapons.unshift({
        name: `${game.i18n.localize('CoC7.UnarmedWeaponName')} (1D3${db})`,
        damage: `1D3${db}`,
        uuid: 'unarmed'
      })
    }

    weapons.push({
      name: game.i18n.localize('CoC7.Other'),
      damage: this.data.card?.customWeaponDamage || null,
      uuid: 0
    })
    return weapons
  }

  get usedWeapon () {
    if (!this.data.card?.weaponChoice) {
      if (!this.weaponsOptions) return undefined
      if (!this.data.card) this.data.card = {}
      this.data.card.weaponChoice = this.weaponsOptions[0].uuid
    }

    if (this.data.card.weaponChoice) {
      const weapon = this.weaponsOptions.find(
        e => e.uuid == this.data.card.weaponChoice
      )
      if (weapon) return weapon
    }
  }

  get inflictedDamageFormula () {
    if (this.usedWeapon) {
      const weapon = this.usedWeapon
      if (weapon && weapon.damage && Roll.validate(weapon.damage))
        return weapon.damage
      return undefined
    }
    return undefined
  }

  get validObstacleDamage () {
    if (
      this.data.obstacle.hasHitPoints &&
      !isNaN(Number(this.data.obstacle.HitPoints)) &&
      Number(this.data.obstacle.HitPoints) > 0 &&
      this.inflictedDamageFormula
    )
      return true
    return false
  }

  get strings () {
    const strings = {}
    strings.damageRollRequest = this.usedWeapon.name

    return strings
  }

  //Actions :
  async defineObstacle (options) {
    if (!this.data.states) this.data.states = {}
    this.data.states.obstacleDefined = true
    return true
  }

  async tryToNegotiateObstacle (options) {
    this.data.states.breakOrPassDefined = true
    this.data.states.tryToNegotiate = true
    this.data.states.tryToBreak = false
    return true
  }

  async tryToBreakDownObstacle (options) {
    this.data.states.breakOrPassDefined = true
    this.data.states.tryToNegotiate = false
    this.data.states.tryToBreak = true
    return true
  }

  async cancelObstacleDefinition (options) {
    this.data.states.obstacleDefined = false
    this.data.states.breakOrPassDefined = false
    this.data.states.tryToNegotiate = false
    this.data.states.tryToBreak = false
    return true
  }

  async cancelBreakOrPassChoice (options) {
    if (!this.data.obstacle.hasHitPoints) return this.cancelObstacleDefinition()
    this.data.states.breakOrPassDefined = false
    this.data.states.tryToNegotiate = false
    this.data.states.tryToBreak = false
    return true
  }

  async requestRoll (options) {
    this.data.states.playerActionDefined = true
    return true
  }

  async rollSkillCheck (options) {
    const target = options.event.currentTarget
    if (target.classList.contains('disabled')) return
    target.classList.toggle('disabled')
    if (!this.roll) {
      ui.notifications.error('Nothing to roll !!')
      return
    }
    if (!this.data.objects) this.data.objects = {}
    this.data.objects.check = CoC7Check.createFromActorRollData(this.roll)
    if (!this.data.objects.check) return false
    this.data.objects.check.canBePushed = false //Obstacle check can't be pushed
    await this.data.objects.check._perform({ forceDSN: true })
    this.data.states.checkRolled = true
    target.classList.toggle('disabled')
    return true
  }

  async useLuck (options) {
    await CoC7Check.alter(this.data.objects.check, 'useLuck', {
      target: options.event.currentTarget,
      update: false
    })
    return true
  }

  async rollFailConsequences (options) {
    if (!this.data.objects) this.data.objects = {}
    if (this.data.obstacle.hasDamage && this.data.objects.check?.isFailure) {
      this.data.objects.failedDamageRoll = new Roll(
        this.data.obstacle.failedCheckDamage
      )
      await this.data.objects.failedDamageRoll.evaluate({ async: true })
    }
    if (this.data.obstacle.hazard) {
      if (
        this.data.obstacle.hasActionCost &&
        this.data.objects.check?.isFailure
      ) {
        this.data.objects.failedActionRoll = new Roll(
          this.data.obstacle.failedActionCost
        )
        await this.data.objects.failedActionRoll.evaluate({ async: true })
      }
    }

    this.data.states.failedConsequencesRolled = true
    if (!this.data.objects?.failedDamageRoll?.total)
      this.data.states.cardResolved = true
    return true
  }

  async askRollObstacleDamage (options) {
    this.data.states.playerActionDefined = true
    return true
  }

  async rollObstacleDamage (options) {
    if (!this.data.objects) this.data.objects = {}
    this.data.objects.obstacleDamageRoll = new Roll(this.usedWeapon?.damage)
    await this.data.objects.obstacleDamageRoll.evaluate({ async: true })
    await CoC7Dice.showRollDice3d(this.data.objects.obstacleDamageRoll)
    this.data.states.obstacleDamageRolled = true
    return true
  }
}
