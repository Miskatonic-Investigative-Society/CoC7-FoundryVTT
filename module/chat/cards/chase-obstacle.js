import { CoC7Check } from '../../check.js'
import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'
import { _participant } from '../../items/chase/participant.js'
import { CoC7Utilities } from '../../utilities.js'
import { createInlineRoll } from '../helper.js'

export class ChaseObstacleCard extends EnhancedChatCard {
  /** @override */
  static get defaultOptions () {
    const options = mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/chase-obstacle.html',
      GMUpdate: false
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
      data.data.states.tryToPass = true
      data.data.states.tryToBreak = false
      data.data.states.actionDefined = true
    }

    if (this.participant.actor) {
      data.skill = this.participant.actor.find(data.data.obstacle.checkName)
      data.checkOptions = this.chase.activeActorSkillsAndCharacteristics
      if (data.skill) {
        data.validCheck = true
        data.validSkill = true
      } else if (data.data.obstacle.checkName && data.data.card.checkThreshold)
        data.validCheck = true
      data.weaponsOptions = []
      if (data.card.breakableObstacle && data.data.states.breakThrougObstacle) {
        this.participant.actor?.itemTypes?.weapon?.forEach(w => {
          let formula = w.data.data.range.normal.damage
          let db = this.participant.actor.db
          if (null === db) {
            db = ''
          } else {
            db = `${db}`
          }

          if (db && !db.startsWith('-')) db = '+' + db
          if (w.data.data.properties.addb) formula = formula + db
          if (w.data.data.properties.ahbd) formula = formula + db + '/2'
          data.weaponsOptions.push = {
            name: `${w.data.name} (${formula})`,
            damage: formula
          }
        })
      }
    } else {
      data.checkOptions = this.chase.allSkillsAndCharacteristics
      data.dummyActor = true
      if (data.data.obstacle.checkName && data.data.card.checkThreshold)
        data.validCheck = true
    }

    data.validFailledRolls = true

    if (data.validCheck) {
      let checkName, value
      if (data.skill) {
        checkName = data.skill.value.name
        value = data.skill.value.value
      } else {
        checkName = data.data.obstacle.checkName
        value = data.data.card.checkThreshold
      }
      data.strings.rollRequest = game.i18n.format('CoC7.AskRoll', {
        name: checkName,
        value: value
      })
      if (data.data.card.bonusDice != 0) {
        if (data.data.card.bonusDice > 0)
          data.strings.rollRequest += ` (+${data.data.card.bonusDice})`
        else data.strings.rollRequest += ` (${data.data.card.bonusDice})`
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

    if (this.data.states.cardResolved) {
      if (this.data.obstacle.hasDamage && this.data.objects?.check?.isFailure) {
        data.damageTaken = true
        data.inlineDamageTakenRoll = createInlineRoll(
          this.data.objects.failledDamageRoll
        )?.outerHTML
        data.status.push({
          name: game.i18n.localize('CoC7.TotalDamage') + ` :${this.data.objects.failledDamageRoll.total}`
        })
      }

      if( this.data.obstacle.hasActionCost && this.data.obstacle.hazard && this.data.objects?.check?.isFailure){
        data.actionLost = true
        data.inlineActionLostRoll = createInlineRoll(
          this.data.objects.failledActionRoll
        )?.outerHTML
        data.status.push({
          name: game.i18n.localize('CoC7.ActionCost') + ` :${this.data.objects.failledActionRoll.total}`
        })
      }
    }
    return data
  }

  /** @override */
  async GMUpdate () {}

  /** @override */
  async assignObjects () {
    if (this.data.states.checkRolled) {
      if (this.data.objects.check) {
        if (this.data.objects.check?.constructor?.name === 'Object') {
          this.data.objects.check = Object.assign(
            new CoC7Check(),
            this.data.objects.check
          )
        }
      }
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
    if (this.participantData.bonusDice > 0) {
      this.data.card.bonusDice = this.participantData.bonusDice
      this.data.flags.consumeBonusDice = true
    }
  }

  get participant () {
    if (!this.participantData) return undefined
    if (!this._participant)
      this._participant = new _participant(this.participantData)
    return this._participant
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

  //Actions :
  async defineObstacle (options) {
    if (!this.data.states) this.data.states = {}
    this.data.states.obstacleDefined = true
    return true
  }

  async tryToPassObstacle (options) {
    this.data.states.actionDefined = true
    this.data.states.tryToPass = true
    this.data.states.tryToBreak = false
    return true
  }

  async tryToreakThroughObstacle (options) {
    this.data.states.actionDefined = true
    this.data.states.tryToPass = false
    this.data.states.tryToBreak = true
    return true
  }

  async requestRoll (options) {
    this.data.states.waitForRoll = true
    this.data.states.checkDefined = true
    return true
  }

  async rollSkillCheck (options) {
    if (!this.roll) {
      ui.notifications.error('Nothing to roll !!')
      return
    }
    if (!this.data.objects) this.data.objects = {}
    this.data.objects.check = CoC7Check.createFromActorRollData(this.roll)
    if (!this.data.objects.check) return false
    this.data.objects.check.canBePushed = false //Obstacle check can't be pushed
    await this.data.objects.check.roll()
    this.data.states.checkRolled = true
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
      this.data.objects.failledDamageRoll = new Roll(
        this.data.obstacle.failedCheckDamage
      )
      await this.data.objects.failledDamageRoll.evaluate({ async: true })
    }
    if (this.data.obstacle.hazard) {
      if (
        this.data.obstacle.hasActionCost &&
        this.data.objects.check?.isFailure
      ) {
        this.data.objects.failledActionRoll = new Roll(
          this.data.obstacle.failedActionCost
        )
        await this.data.objects.failledActionRoll.evaluate({ async: true })
      }
    }

    this.data.states.cardResolved = true
    return true
  }

  // activateListeners (html) {
  //   super.activateListeners(html)
  // }
}
