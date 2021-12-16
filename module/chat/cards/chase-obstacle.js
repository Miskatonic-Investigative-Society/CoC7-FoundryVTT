import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'
import { _participant } from '../../items/chase/participant.js'

export class ChaseObstacleCard extends EnhancedChatCard {
  /** @override */
  static get defaultOptions () {
    const options =  mergeObject(super.defaultOptions, {
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

    data.validCheck = false
    if (data.participant.actor) {
      data.skill = data.participant.actor.find(data.data.obstacle.checkName)
      data.checkOptions = data.chase.activeActorSkillsAndCharacteristics
      if( data.skill) data.validCheck = true
    } else {
      data.checkOptions = data.chase.allSkillsAndCharacteristics
    }

    return data
  }

  /** @override */
  async GMUpdate () {}

  /** @override */
  async initialize () {
    const chase = await fromUuid(this.data.chaseUuid)
    if (!chase) return
    const location = chase.getLocationData(this.data.locationUuid)
    this.data.obstacle = location.obstacleDetails
    this.data.participantData = chase.activeParticipantData
  }

  // activateListeners (html) {
  //   super.activateListeners(html)
  // }
}
