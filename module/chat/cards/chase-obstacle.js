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
      } else if (data.data.obstacle.checkName && data.data.checkThreshold)
        data.validCheck = true
    } else {
      data.checkOptions = this.chase.allSkillsAndCharacteristics
      data.dummyActor = true
      if (data.data.obstacle.checkName && data.data.checkThreshold)
        data.validCheck = true
    }

    data.customWeapon = false
    if ('0' === this.data.weaponChoice) {
      data.customWeapon = true
    }

    if (data.validCheck) {
      let checkName, value
      if (data.skill) {
        checkName = data.skill.value.name
        value = data.skill.value.value
      } else {
        checkName = data.data.obstacle.checkName
        value = data.data.checkThreshold
      }
      data.strings.checkRollRequest = game.i18n.format('CoC7.AskRoll', {
        name: checkName,
        value: value
      })
      if (data.data.bonusDice != 0) {
        if (data.data.bonusDice > 0)
          data.strings.checkRollRequest += ` (+${data.data.bonusDice})`
        else data.strings.checkRollRequest += ` (${data.data.bonusDice})`
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
        if (!data.data.checkThreshold) data.data.states.canAskRoll = false
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
      if (!data.data.armor) {
        if (this.participant.actor)
          data.data.armor =
            this.participant.actor.data.data.attribs.armor.value || 0
      }
      if (data.data.armor) {
        if (isNaN(Number(data.data.armor))) data.data.armor = null
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
      //Card is resolved, list changes and ask for validation.
      if (!this.data.states.cardValidated) {
        if (!this.data.states.changesListed) {
          const diff = this.listChanges(true)
          this.data.states.changesListed = true
        }
      } else {
        if (this.data.states.failedConsequencesRolled) {
          if (this.data.objects?.failedActionRoll?.total)
            await this.chase.alterParticipantMovementAction(
              this.participant.uuid,
              0 - this.data.objects.failedActionRoll.total
            )
          if (this.data.objects?.failedDamageRoll?.total) {
            let totalDamage, armorValue, armorData
            totalDamage = this.data.objects.failedDamageRoll.total
            armorValue = this.data.flags.ignoreArmor ? 0 : this.data.data.armor
            if (CoC7Utilities.isFormula(armorData)) {
              armorValue = (await new Roll(armorData).roll({ async: true }))
                .total
            } else if (!isNaN(Number(armorData))) {
              armorValue = Number(armorData)
            }
            if (this.participant.actor) {
              totalDamage = await this.participant.actor.dealDamage(
                this.data.objects.failedDamageRoll.total,
                { ignoreArmor: false, armor: 3 }
              )
            } else {
            }
          }
        } else {
          let targetLocation
          if (this.data.forward) {
            targetLocation = this.location
          } else {
            targetLocation = this.chase.getLocationShift(this.location.uuid, {
              skip: -1
            })
          }
          if (!targetLocation || !targetLocation.uuid) return
          await this.chase.alterParticipantMovementAction(
            this.participant.uuid,
            -1
          )
          await this.chase.moveParticipantToLocation(
            this.participant.uuid,
            targetLocation.uuid,
            { render: true }
          )

          this.data.movementActionArray = this.participant.movementActionArray
        }
        await this.chase.activateNexParticpantTurn()
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

    if (undefined == this.data) this.data = {}
    if (undefined == this.data.states) this.data.states = {}

    // const location = chase.getLocationData(this.data.locationUuid)
    this.data.obstacle = this.location?.obstacleDetails //Feed the obstacle definition
    // this.data.participantData = chase.activeParticipantData
    if (this.participantData?.bonusDice > 0) {
      this.data.bonusDice = this.participantData.bonusDice
      this.data.flags.consumeBonusDice = true
    }
    this.data.movementActionArray = duplicate(
      this.participant.movementActionArray
    )
  }

  get participant () {
    if (!this.participantData) return undefined
    // if (!this._participant)
    //   this._participant = new _participant(this.participantData)
    // return this._participant
    return new _participant(this.participantData) //TO RESET
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
      const actorSkill = this.participant.actor.find(
        this.data.obstacle.checkName
      )
      if (undefined != actorSkill) {
        rollData = actorSkill
      } else {
        rollData = {
          type: 'value',
          value: {
            name: this.data.obstacle.checkName,
            threshold: this.data.checkThreshold
          }
        }
      }
      rollData.actor = { actorKey: this.participant.actor.id }
    } else {
      if (this.data.obstacle.checkName && this.data.checkThreshold) {
        rollData = {
          type: 'value',
          value: {
            name: this.data.obstacle.checkName,
            threshold: this.data.checkThreshold
          },
          actor: {
            name: this.participant.name
          }
        }
      }
    }
    if (rollData) {
      rollData.diceModifier = this.data?.bonusDice || 0
      rollData.difficulty = CoC7Check.difficultyLevel.regular
      rollData.denyPush = true
    }
    return rollData || undefined
  }

  get validFailedRolls () {
    if (!this.data.objects?.check?.isFailure) return false
    if (this.data.obstacle.hasDamage) {
      const damage =
        'number' == typeof this.data.obstacle.failedCheckDamage
          ? `${this.data.obstacle.failedCheckDamage}`
          : this.data.obstacle.failedCheckDamage
      if (!this.data.obstacle.failedCheckDamage) return false
      if (
        this.data.obstacle.failedCheckDamage &&
        !Roll.validate(damage) //Validate only take a string, if damage is a number convert to a string
      )
        return false
    }
    if (this.data.obstacle.hazard && this.data.obstacle.hasActionCost) {
      const actionCost =
        'number' == typeof this.data.obstacle.failedActionCost
          ? `${this.data.obstacle.failedActionCost}`
          : this.data.obstacle.failedActionCost
      if (!this.data.obstacle.failedActionCost) return false
      if (this.data.obstacle.failedActionCost && !Roll.validate(actionCost))
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
      damage: this.data?.customWeaponDamage || null,
      uuid: 0
    })
    return weapons
  }

  get usedWeapon () {
    if (!this.data?.weaponChoice) {
      if (!this.weaponsOptions) return undefined
      if (!this.data) this.data = {} //useless !!!
      this.data.weaponChoice = this.weaponsOptions[0].uuid
    }

    if (this.data.weaponChoice) {
      const weapon = this.weaponsOptions.find(
        e => e.uuid == this.data.weaponChoice
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
    this.data.objects.check.denyPush = true //Obstacle check can't be pushed
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
      const damage =
        'number' == typeof this.data.obstacle.failedCheckDamage
          ? `${this.data.obstacle.failedCheckDamage}`
          : this.data.obstacle.failedCheckDamage
      this.data.objects.failedDamageRoll = new Roll(damage)
      await this.data.objects.failedDamageRoll.evaluate({ async: true })
    }
    if (this.data.obstacle.hazard) {
      if (
        this.data.obstacle.hasActionCost &&
        this.data.objects.check?.isFailure
      ) {
        const actionCost =
          'number' == typeof this.data.obstacle.failedActionCost
            ? `${this.data.obstacle.failedActionCost}`
            : this.data.obstacle.failedActionCost
        this.data.objects.failedActionRoll = new Roll(actionCost)
        await this.data.objects.failedActionRoll.evaluate({ async: true })
      }
    }

    this.data.states.failedConsequencesRolled = true
    this.data.states.cardResolved = true

    // if (
    //   !this.data.objects?.failedDamageRoll?.total &&
    //   !this.data.objects?.failedActionRoll?.total
    // ) {
    //   this.data.states.cardResolved = true
    // }
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

  //List all changes
  listChanges (validate = false) {
    const diff = {
      obstacle: {},
      player: {}
    }
    const names = {
      barrier: game.i18n.localize('CoC7.Type'),
      hazard: game.i18n.localize('CoC7.Type'),
      hasHitPoints: game.i18n.localize('CoC7.Breakable'),
      HitPoints: game.i18n.localize('CoC7.HitPoints'),
      hasActionCost: game.i18n.localize('CoC7.ActionCost'),
      failedActionCost: game.i18n.localize('CoC7.ActionCost'),
      hasDamage: game.i18n.localize('CoC7.FightBack'),
      failedCheckDamage: game.i18n.localize('CoC7.WeaponDamage'),
      checkName: game.i18n.localize('CoC7.Check'),
      name: game.i18n.localize('CoC7.Name')
    }

    if (validate && !this.data.validation) {
      this.data.validation = {}
    }

    const newObstacle = foundry.utils.diffObject(
      this.obstacle,
      this.data.obstacle
    )
    // const oldObstacle = foundry.utils.diffObject(this.data.obstacle, this.obstacle)

    for (const [key] of Object.entries(newObstacle)) {
      if ('barrier' == key || 'hazard' == key) {
        diff.obstacle.type = {
          old: game.i18n.localize(
            this.obstacle.barrier ? 'CoC7.Barrier' : 'CoC7.Hazard'
          ),
          new: game.i18n.localize(
            this.data.obstacle.barrier ? 'CoC7.Barrier' : 'CoC7.Hazard'
          ),
          key: 'type',
          name: game.i18n.localize('CoC7.Type')
        }
        if (validate) {
          this.data.validation[key] = true
          this.data.validation.type = true
        }
      } else {
        diff.obstacle[key] = {
          old: this.obstacle[key],
          new: newObstacle[key],
          name: names[key],
          key: key
        }
        if (validate) this.data.validation[key] = true
      }
    }

    return diff
  }
}
