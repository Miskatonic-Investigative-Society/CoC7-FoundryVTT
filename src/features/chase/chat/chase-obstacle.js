/* global foundry, game, Roll, ui */
import { _participant } from '../participant.js'
import { CoC7Check } from '../../../core/check.js'
import { EnhancedChatCard } from '../../../shared/chatcardlib/src/chatcardlib.js'
import { CoC7Dice } from '../../../shared/dice/dice.js'
import { createInlineRoll } from '../../../shared/dice/helper.js'
import { CoC7Utilities } from '../../../shared/utilities.js'

export class ChaseObstacleCard extends EnhancedChatCard {
  /** @override */
  static get defaultOptions () {
    const options = foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/chase-obstacle.html',
      GMUpdate: true
    })
    options.classes.push('obstacle-card')
    return options
  }

  /** @override */
  async getData () {
    const data = await super.getData()

    data.status = []
    data.strings = {}
    data.displayActorOnCard = game.settings.get('CoC7', 'displayActorOnCard')
    // data.participant = new _participant(this.participantData)

    data.status.push({
      name:
        game.i18n.localize('CoC7.ActionCost') + ` :${this.data.totalActionCost}`
    })

    data.card.breakableObstacle =
      data.data.obstacle?.barrier && data.data.obstacle.hasHitPoints // TODO: Check if usefull
    data.card.validCheck = false

    if (
      data.data.states?.obstacleDefined &&
      (data.data.obstacle.hazard ||
        (data.data.obstacle.barrier && !data.data.obstacle.hasHitPoints))
    ) {
      data.data.states.tryToNegotiate = true
      data.data.states.tryToBreak = false
      data.data.states.breakOrNegotiateDefined = true
    }

    if (this.participant?.actor) {
      data.skill = this.participant.actor.find(data.data.obstacle.checkName)
      data.checkOptions = this.chase.getActorSkillsAndCharacteristics(
        this.data.participantUuid
      )
      if (data.skill) {
        data.validCheck = true
        data.validSkill = true
      } else if (data.data.obstacle.checkName && data.data.checkThreshold) {
        data.validCheck = true
      }
    } else {
      data.checkOptions = this.chase.allSkillsAndCharacteristics
      data.dummyActor = true
      if (data.data.obstacle.checkName && data.data.checkThreshold) {
        data.validCheck = true
      }
    }

    if (!data.data.bonusDice) data.data.bonusDice = 0

    if (
      data.data.bonusDice < 2 &&
      data.data.totalActionCost < data.data.movementAction
    ) {
      data.canTakeCautiousApproach = true
    }

    data.customWeapon = false
    if (this.data.weaponChoice === '0') {
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
        value
      })
      if (data.data.bonusDice !== 0) {
        if (data.data.bonusDice > 0) {
          data.strings.checkRollRequest += ` (+${data.data.bonusDice})`
        } else data.strings.checkRollRequest += ` (${data.data.bonusDice})`
      }
    }

    if (data.data.states?.obstacleDefined) {
      data.strings.obstacleDefined = game.i18n.format('CoC7.FacingObstacle', {
        type: data.data.obstacle.barrier
          ? game.i18n.localize('CoC7.ABarrier')
          : game.i18n.localize('CoC7.AHazard')
      })
      if (data.data.obstacle.name) {
        data.strings.obstacleDefined += ` (${data.data.obstacle.name})`
      }

      data.data.states.canAskRoll = true
      // data.data.states.obstacleCanBeBroken = false
      if (data.data.obstacle.barrier) {
        data.status.push({ name: game.i18n.localize('CoC7.Barrier') })
        if (data.data.obstacle.hasHitPoints) {
          data.status.push({ name: game.i18n.localize('CoC7.Breakable') })
          // data.data.states.obstacleCanBeBroken = true
        }
      }
      if (data.data.obstacle.hazard) {
        data.status.push({ name: game.i18n.localize('CoC7.Hazard') })
      }

      if (this.data.states.tryToNegotiate) {
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
      }

      if (this.data.states.tryToBreak) {
        let damageStatus = game.i18n.localize('CoC7.BreakDown')
        if (this.data.objects?.obstacleDamageRoll?.total) {
          damageStatus += ` : ${this.data.objects.obstacleDamageRoll.total}`
        }
        data.status.push({
          name: damageStatus
        })

        if (this.data.states.obstacleDamageRolled) {
          if (this.data.objects?.obstacleDamageRoll?.total <= 0) {
            data.strings.obstacleDamage =
              game.i18n.localize('CoC7.NoDamageDealt')
          } else {
            data.inlineDamageRoll = createInlineRoll(
              this.data.objects.obstacleDamageRoll
            )?.outerHTML
            data.strings.obstacleDamage = game.i18n.format('CoC7.DamageDealt', {
              value: data.inlineDamageRoll
            })
          }
        }
      }

      if (this.data.states.tryToNegotiate) {
        data.status.push({ name: game.i18n.localize('CoC7.Negotiate') })
      }

      if (this.data.totalCautiousApproach) {
        const cautiousStatus = {
          name: game.i18n.localize('CoC7.Cautious'),
          css: ''
        }
        if (this.data.totalCautiousApproach > 1) {
          cautiousStatus.css = 'strong'
          data.strings.cautiousApproachType = game.i18n.localize(
            'CoC7.BeingVeryCautious'
          )
        } else {
          data.strings.cautiousApproachType =
            game.i18n.localize('CoC7.BeingCautious')
        }

        if (this.data.flags.consumeBonusDice) cautiousStatus.css += ' consume'
        data.status.push(cautiousStatus)
      }

      if (this.data.objects?.check) {
        if (this.data.obstacle.hazard) this.data.movePlayer = true // On hazard, you pass even if you fail your roll
        if (this.data.objects.check.passed) {
          if (typeof this.data.movePlayer === 'undefined') this.data.movePlayer = true
          data.strings.obstaclePassed = game.i18n.localize(
            'CoC7.ObstaclePassed'
          )
          if (this.data.objects.check.luckSpent) {
            data.strings.obstaclePassed += ` (${game.i18n.localize(
              'CoC7.GotLucky'
            )})`
          }
          data.status.push({
            name: game.i18n.localize('CoC7.Success'),
            css: 'success'
          })
        } else if (this.data.objects.check.isFumble) {
          data.strings.checkFailed = game.i18n.localize('CoC7.ObstacleFumble')
          data.status.push({
            name: game.i18n.localize('CoC7.Fumble'),
            css: 'fumble'
          })
        } else {
          data.strings.checkFailed = game.i18n.localize('CoC7.ObstacleFail')
          data.status.push({
            name: game.i18n.localize('CoC7.Failure'),
            css: 'failure'
          })
        }
      }
    }

    if (this.data.states.playerActionDefined) {
      if (this.data.obstacle.hazard) {
        data.strings.playerIntentions = game.i18n.localize(
          'CoC7.TryToNegotiateHazard'
        )
      } else if (this.data.obstacle.barrier) {
        if (this.data.states.tryToNegotiate) {
          data.strings.playerIntentions = game.i18n.localize(
            'CoC7.TryToGetPastBarriers'
          )
        } else if (this.data.states.tryToBreak) {
          data.strings.playerIntentions = game.i18n.localize('CoC7.TryToBreak')
        }
      }
    }

    if (this.data.states.checkRolled) {
      if (this.data.states.cardResolved) {
        // If the card is resolved the check is frozen
        data.htmlCheck = await this.data.objects.check.inlineCheck?.outerHTML
      } else data.htmlCheck = await this.data.objects.check.getHtmlRoll()
    }

    // if (this.data.objects?.failedDamageRoll) {
    //   if (!data.data.armor) {
    //     if (this.participant.actor)
    //       data.data.armor =
    //         this.participant.actor.data.data.attribs.armor.value || 0
    //   }
    //   if (data.data.armor) {
    //     if (isNaN(Number(data.data.armor))) data.data.armor = null
    //   }
    // }

    if (this.data.states.cardResolved) {
      data.playerDamageTaken = false
      data.obstalceDefinitionChanged = false

      // Has the obstacle changed ?
      const diff = this.listChanges()
      if (diff.changes) {
        data.obstalceDefinitionChanged = true
      }

      // Is player taking damage
      if (this.data.obstacle.hasDamage && this.data.objects?.check?.isFailure) {
        data.playerDamageTaken = true
        data.inlineDamageTakenRoll = createInlineRoll(
          this.data.objects.failedDamageRoll
        )?.outerHTML
        // if (data.data.totalPlayerDamageTaken < 0)
        //   data.data.totalPlayerDamageTaken = 0

        if (data.data.totalPlayerDamageTaken === 0) {
          data.strings.damageTaken = game.i18n.localize('CoC7.YouTakeNoDamage')
        } else {
          data.strings.damageTaken = game.i18n.format(
            'CoC7.YouTakeSomeDamage',
            { amount: data.data.totalPlayerDamageTaken }
          )
        }
        data.status.push({
          name:
            game.i18n.localize('CoC7.TotalDamage') +
            ` :${data.data.totalPlayerDamageTaken}`
        })
      }

      if (
        this.data.obstacle.hasActionCost &&
        this.data.obstacle.hazard &&
        this.data.objects?.check?.isFailure
      ) {
        data.actionLost = true
        data.strings.actionLost = game.i18n.localize('CoC7.YouLostTime')
        data.inlineActionLostRoll = createInlineRoll(
          this.data.objects.failedActionRoll
        )?.outerHTML
      }

      data.status.push({
        name: game.i18n.localize('CoC7.CardResolved')
      })
    }

    if (this.data.states.closed) {
      if (this.data.movePlayer) {
        data.strings.finalOutcome = game.i18n.localize('CoC7.MoveToLocation')
      } else {
        data.strings.finalOutcome = game.i18n.localize(
          'CoC7.DontMoveToLocation'
        )
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
      // Card is resolved, compute all formulas and damage.
      if (this.data.objects?.failedDamageRoll?.total) {
        const totalDamage = this.data.objects.failedDamageRoll.total
        const armorValue = this.data.flags.ignoreArmor ? 0 : this.data.armor
        if (CoC7Utilities.isFormula(armorValue)) {
          this.data.armor = (
            await new Roll(armorValue).roll({ async: true })
          ).total
        } else if (!isNaN(Number(armorValue))) {
          this.data.armor = Number(armorValue)
        }

        if (typeof this.data.totalPlayerDamageTaken === 'undefined') {
          this.data.totalPlayerDamageTaken = totalDamage - this.data.armor
          if (this.data.totalPlayerDamageTaken < 0) {
            this.data.totalPlayerDamageTaken = 0
          }
        }
      }

      if (undefined === this.data.reflectObstaleChanges) {
        this.data.reflectObstaleChanges = true // By default reflect changes
      }

      if (undefined === this.data.movePlayer) {
        this.data.movePlayer =
          (this.data.states.tryToNegotiate || this.data.obstacle.hazard) &&
          !this.data.states.failedConsequencesRolled
      }

      if (
        this.data.obstacle.barrier &&
        this.data.obstacle.hasHitPoints &&
        this.data.objects?.obstacleDamageRoll?.total
      ) {
        if (undefined === this.data.totalObstacleDamage) {
          this.data.totalObstacleDamage =
            this.data.objects.obstacleDamageRoll.total
        }
        if (undefined === this.data.flags.obstacleDestoyed) {
          this.data.flags.obstacleDestoyed =
            this.data.obstacle.HitPoints - this.data.totalObstacleDamage <= 0
        }
      }
    }

    if (this.data.states.closed) {
      this.data.movementActionArray = foundry.utils.duplicate(
        this.participant.movementActionArray
      )
      this.data.EEC_ACTION = { detachData: true }
    }
  }

  /** @override */
  async localCompute () {}

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
    if (typeof this.chase.activeParticipantData?.uuid === 'undefined') {
      return
    }

    if (typeof this.data === 'undefined') this.data = {}
    if (typeof this.data.states === 'undefined') this.data.states = {}

    // const location = chase.getLocationData(this.data.locationUuid)
    this.data.obstacle = this.location?.obstacleDetails // Feed the obstacle definition
    // this.data.participantData = chase.activeParticipantData
    this.data.participantUuid = this.chase.activeParticipantData.uuid

    if (this.participantData?.bonusDice > 0) {
      this.data.bonusDice = this.participantData.bonusDice
      this.data.flags.consumeBonusDice = true
      this.data.flags.hasBonusDice = this.participant.hasBonusDice
    }

    this.data.movementActionArray = foundry.utils.duplicate(
      this.participant.movementActionArray
    )
    this.data.movementAction = this.participant.currentMovementActions
    this.data.totalActionCost = 0
  }

  get participant () {
    if (!this.participantData) return undefined
    // if (!this._participant)
    //   this._participant = new _participant(this.participantData)
    // return this._participant
    return new _participant(this.participantData) // TO RESET
  }

  get participantData () {
    if (!this.chase) return undefined
    if (!this.data.participantUuid) return undefined
    return this.chase.getParticipantData(this.data.participantUuid)
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
    if (!this._chase) this._chase = CoC7Utilities.SfromUuid(this.data.chaseUuid)
    return this._chase
  }

  get roll () {
    let rollData
    if (this.participant.actor && this.data.obstacle.checkName) {
      const actorSkill = this.participant.actor.find(
        this.data.obstacle.checkName
      )
      if (typeof actorSkill !== 'undefined') {
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
        typeof this.data.obstacle.failedCheckDamage === 'number'
          ? `${this.data.obstacle.failedCheckDamage}`
          : this.data.obstacle.failedCheckDamage
      if (!this.data.obstacle.failedCheckDamage) return false
      if (
        this.data.obstacle.failedCheckDamage &&
        !Roll.validate(damage) // Validate only take a string, if damage is a number convert to a string
      ) {
        return false
      }
    }
    if (this.data.obstacle.hazard && this.data.obstacle.hasActionCost) {
      const actionCost =
        typeof this.data.obstacle.failedActionCost === 'number'
          ? `${this.data.obstacle.failedActionCost}`
          : this.data.obstacle.failedActionCost
      if (!this.data.obstacle.failedActionCost) return false
      if (this.data.obstacle.failedActionCost && !Roll.validate(actionCost)) {
        return false
      }
    }
    return true
  }

  get weaponsOptions () {
    const weapons = []
    this.participant.actor?.itemTypes?.weapon?.forEach(w => {
      let formula = w.system.range.normal.damage
      let db = this.participant.actor.db
      if (db === null || Number(db) === 0) {
        db = ''
      } else {
        db = `${db}`
      }

      if (db && !db.startsWith('-')) db = '+' + db
      if (w.system.properties.addb) formula = formula + db
      if (w.system.properties.ahbd) formula = formula + db + '/2'
      weapons.push({
        name: `${w.name} (${formula})`,
        damage: formula,
        uuid: w.uuid
      })
    })
    weapons.sort(CoC7Utilities.sortByNameKey)

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
        if (db === null || Number(db) === 0) db = ''
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
      if (!this.data) this.data = {} // useless !!!
      this.data.weaponChoice = this.weaponsOptions[0].uuid
    }

    if (this.data.weaponChoice) {
      const weapon = this.weaponsOptions.find(
        e => e.uuid === this.data.weaponChoice
      )
      if (weapon) return weapon
    }
  }

  get inflictedDamageFormula () {
    if (this.usedWeapon) {
      const weapon = this.usedWeapon
      if (weapon && weapon.damage && Roll.validate(weapon.damage)) {
        return weapon.damage
      }
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
    ) {
      return true
    }
    return false
  }

  get strings () {
    const strings = {}
    strings.damageRollRequest = this.usedWeapon.name

    return strings
  }

  // Actions :
  async validateCard (options) {
    let loactionChanged
    let participantChaged = false
    const obstacleUpdate = {}
    obstacleUpdate.obstacleDetails = {}
    const participantUpdate = {}
    if (this.data.flags.obstacleDestoyed) {
      loactionChanged = true
      obstacleUpdate.obstacle = false
      obstacleUpdate.obstacleDetails.hazard = false
      obstacleUpdate.obstacleDetails.barrier = false
    }

    const diff = this.listChanges()
    if (diff.changes) {
      if (this.data.reflectObstaleChanges) {
        for (const [key, value] of Object.entries(diff.obstacle)) {
          if (key !== 'type') {
            obstacleUpdate.obstacleDetails[value.key] = value.new
            loactionChanged = true
          }
        }
      }
    }

    if (this.data.totalObstacleDamage > 0 && this.data.obstacle.hasHitPoints) {
      let remainingHp = this.data.obstacle.HitPoints
      remainingHp -= this.data.totalObstacleDamage
      if (remainingHp < 0) remainingHp = 0
      if (this.obstacle.HitPoints !== remainingHp) {
        obstacleUpdate.obstacleDetails.HitPoints = remainingHp
        this.data.obstacle.HitPoints = remainingHp
        loactionChanged = true
      }
    }

    if (this.data.totalPlayerDamageTaken > 0) {
      participantChaged = true
      if (this.participant.actor) {
        await this.participant.actor.dealDamage(
          this.data.totalPlayerDamageTaken,
          { ignoreArmor: true }
        )
      } else {
        participantUpdate.hp = this.participantData.hp
        participantUpdate.hp -= this.data.totalPlayerDamageTaken
        if (participantUpdate.hp < 0) participantUpdate.hp = 0
      }
    }

    if (this.data.totalActionCost > 0) {
      participantChaged = true
      participantUpdate.currentMovementActions =
        this.participantData.currentMovementActions
      participantUpdate.currentMovementActions -= this.data.totalActionCost
    }

    if (typeof this.data.flags.consumeBonusDice === 'undefined') this.data.flags.consumeBonusDice = true // Bonus dice awarded during flow are being consumed

    if (this.data.flags.consumeBonusDice) {
      participantChaged = true
      participantUpdate.bonusDice = 0
    } else {
      if (
        !isNaN(this.data.bonusDice) &&
        this.data.bonusDice !== this.participant.bonusDice
      ) {
        participantUpdate.bonusDice = this.data.bonusDice
      }
    }

    if (this.data.movePlayer) {
      let targetLocation
      if (this.data.forward) {
        targetLocation = this.location
      } else {
        targetLocation = this.chase.getLocationShift(this.location.uuid, {
          skip: -1
        })
      }

      if (targetLocation.uuid) {
        await this.chase.moveParticipantToLocation(
          this.participantData.uuid,
          targetLocation.uuid,
          {
            scrollToLocation: true,
            activateLocation: false,
            render: false
          }
        )
      }
    }

    if (loactionChanged) {
      await this.chase.updateLocation(this.location.uuid, obstacleUpdate, {
        render: false
      })
    }
    if (participantChaged) {
      await this.chase.updateParticipant(
        this.participantData.uuid,
        participantUpdate,
        { render: false }
      )
    }
    this.data.states.closed = true
    await this.chase.activateNextParticipantTurn() // Render will be done there !
    return true
  }

  async defineObstacle (options) {
    if (!this.data.states) this.data.states = {}
    this.data.states.obstacleDefined = true
    return true
  }

  async tryToNegotiateObstacle (options) {
    this.data.states.breakOrNegotiateDefined = true
    this.data.states.tryToNegotiate = true
    this.data.states.tryToBreak = false
    return true
  }

  async tryToBreakDownObstacle (options) {
    this.data.states.breakOrNegotiateDefined = true
    this.data.states.tryToNegotiate = false
    this.data.states.tryToBreak = true
    return true
  }

  async cancelObstacleDefinition (options) {
    this.data.states.obstacleDefined = false
    this.data.states.breakOrNegotiateDefined = false
    this.data.states.tryToNegotiate = false
    this.data.states.tryToBreak = false
    return true
  }

  async cancelBreakOrPassChoice (options) {
    if (!this.data.obstacle.hasHitPoints) return this.cancelObstacleDefinition()
    this.data.states.breakOrNegotiateDefined = false
    this.data.states.tryToNegotiate = false
    this.data.states.tryToBreak = false
    return true
  }

  async requestRoll (options) {
    this.data.states.playerActionDefined = true
    return true
  }

  async takeCautiousApproach (options) {
    if (!this.data.totalCautiousApproach) this.data.totalCautiousApproach = 0
    this.data.totalCautiousApproach += 1
    this.data.bonusDice += 1
    this.data.totalActionCost += 1
    if (!this.data.flags.consumeBonusDice) {
      this.data.flags.consumeBonusDice = true
    }
    if (!this.data.flags.hasBonusDice) {
      this.data.flags.hasBonusDice = true
    }
    if (this.data.movementAction <= this.data.totalActionCost) { // All mov action have been used to take cuatious approach.
      this.data.flags.consumeBonusDice = false // Do not consume the bonus dice.
      this.data.states.cardResolved = true
      this.data.movePlayer = false
    }
    return true
  }

  async rollSkillCheck (options) {
    const target = options.event.currentTarget
    if (target.classList.contains('disabled')) return
    target.classList.toggle('disabled')
    if (!this.roll) {
      ui.notifications.error(game.i18n.localize('CoC7.NothingToRoll'))
      return
    }
    if (!this.data.objects) this.data.objects = {}
    this.data.objects.check = CoC7Check.createFromActorRollData(this.roll)
    if (!this.data.objects.check) return false
    this.data.objects.check.denyPush = true // Obstacle check can't be pushed
    await this.data.objects.check._perform({ forceDSN: true })
    this.data.totalActionCost += 1
    this.data.states.checkRolled = true
    target.classList.toggle('disabled')
    if (this.data.objects.check.passed) {
      this.data.movePlayer = true
      this.data.states.cardResolved = true
    } else {
      if (typeof this.data.armor === 'undefined' && this.participant.actor) {
        this.data.armor =
          this.participant.actor.system.attribs.armor.value || 0
      }
    }

    return true
  }

  async useLuck (options) {
    await CoC7Check.alter(this.data.objects.check, 'useLuck', {
      target: options.event.currentTarget,
      update: false
    })
    if (this.data.objects.check.passed) {
      this.data.states.cardResolved = true
      this.data.movePlayer = true
      this.data.totalActionCost += 1
    }
    return true
  }

  async rollFailConsequences (options) {
    if (!this.data.objects) this.data.objects = {}
    if (this.data.obstacle.hasDamage && this.data.objects.check?.isFailure) {
      const damage =
        typeof this.data.obstacle.failedCheckDamage === 'number'
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
          typeof this.data.obstacle.failedActionCost === 'number'
            ? `${this.data.obstacle.failedActionCost}`
            : this.data.obstacle.failedActionCost
        this.data.objects.failedActionRoll = new Roll(actionCost)
        await this.data.objects.failedActionRoll.evaluate({ async: true })
        this.data.totalActionCost += (this.data.objects.failedActionRoll.total - 1) // 1 action already spend for skill check
      }
    }

    this.data.states.failedConsequencesRolled = true
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
    this.data.totalActionCost += 1
    this.data.states.cardResolved = true
    return true
  }

  // List all changes
  listChanges (validate = false) {
    const diff = {
      obstacle: {},
      player: {},
      changes: false
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
      // if ('barrier' == key || 'hazard' == key)
      // {
      //   diff.changes = true
      //   diff.obstacle.type = {
      //     old: game.i18n.localize(
      //       this.obstacle.barrier ? 'CoC7.Barrier' : 'CoC7.Hazard'
      //     ),
      //     new: game.i18n.localize(
      //       this.data.obstacle.barrier ? 'CoC7.Barrier' : 'CoC7.Hazard'
      //     ),
      //     key: 'type',
      //     name: game.i18n.localize('CoC7.Type')
      //   }
      //   if (validate) {
      //     this.data.validation[key] = true
      //     this.data.validation.type = true
      //   }
      // }
      // else
      // {
      if (
        !(
          (newObstacle[key] === '' && this.obstacle[key] === null) ||
          (!isNaN(Number(newObstacle[key])) &&
            Number(newObstacle[key]) === this.obstacle[key])
        )
      ) {
        diff.changes = true

        diff.obstacle[key] = {
          old: this.obstacle[key],
          new: newObstacle[key],
          name: names[key],
          key
        }
        if (validate) this.data.validation[key] = true
      }
      // }
    }

    return diff
  }
}
