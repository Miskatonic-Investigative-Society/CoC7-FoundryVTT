import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'
import { _participant } from '../../items/chase/participant.js'

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

    data.chase = await fromUuid(this.data.chaseUuid)

    data.displayActorOnCard = game.settings.get('CoC7', 'displayActorOnCard')
    data.participant = new _participant(data.data.participantData)

    data.card.breakableObstacle =
      data.data.obstacle.barrier && data.data.obstacle.hasHitPoints
    data.card.validCheck = false

    if (
      data.data.obstacle.hazard ||
      (data.data.obstacle.barrier && !data.data.obstacle.hasHitPoints)
    ) {
      data.data.states.actionDefined = true
      data.data.states.tryToPass = true
      data.data.states.tryToBreak = false
    }

    if (data.participant.actor) {
      data.skill = data.participant.actor.find(data.data.obstacle.checkName)
      data.checkOptions = data.chase.activeActorSkillsAndCharacteristics
      if (data.skill) data.card.validCheck = true
      data.weaponsOptions = []
      if (data.card.breakableObstacle && data.data.states.breakThrougObstacle) {
        data.participant.actor?.itemTypes?.weapon?.forEach(w => {
          let formula = w.data.data.range.normal.damage
          let db = data.participant.actor.db
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
      data.checkOptions = data.chase.allSkillsAndCharacteristics
    }

    data.actions = {
      player: {},
      gm: {}
    }
    data.status = []
    data.strings = {}
    data.strings.somethinInTheWay = game.i18n.localize('CoC7.SomethingInTheWay')
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

      if (!data.card.validCheck) {
        data.status.push({
          name: game.i18n.localize('CoC7.NoValidCheck'),
          css: 'warning'
        })
        data.strings.EnterValuePlaceHolder = game.i18n.format(
          'CoC7.EnterXXXBaseValue',
          { name: data.data.obstacle.checkName }
        )
        if (!data.data.card.checkThreshold) data.data.states.canAskRoll = false
      }
    }
    return data
  }

  /** @override */
  async GMUpdate () {}

  /** @override */
  async initialize () {
    const chase = await fromUuid(this.data.chaseUuid)
    if (!chase) return

    if (undefined == this.data.card) this.data.card = {}
    if (undefined == this.data.states) this.data.states = {}

    const location = chase.getLocationData(this.data.locationUuid)
    this.data.obstacle = location.obstacleDetails
    this.data.participantData = chase.activeParticipantData
    if (this.data.participantData.bonusDice > 0) {
      this.data.card.bonusDice = this.data.participantData.bonusDice
      this.data.flags.consumeBonusDice = true
    }
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

  // activateListeners (html) {
  //   super.activateListeners(html)
  // }
}
