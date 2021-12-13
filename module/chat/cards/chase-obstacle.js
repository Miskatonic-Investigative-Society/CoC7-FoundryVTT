import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'
import { _participant } from '../../items/chase/participant.js'

export class ChaseObstacleCard extends EnhancedChatCard {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/chase-obstacle.html',
      GMUpdate: true
    })
  }

  /** @override */
  async getData () {
    const data = await super.getData()

    data.chase = await fromUuid(this._data.chaseUuid)
    data.location = data.chase.getLocationData( this._data.locationUuid)

    if( !data.data.checkName){
      data.data.checkName = data.location.obstacleDetails.checkName
    }

    data.displayActorOnCard = game.settings.get('CoC7', 'displayActorOnCard')
    data.activeParticipant = new _participant( data.chase.activeParticipant)

    if( data.chase.activeActor){
      data.skill = data.chase.activeActor.find( data.data.checkName)
    }

    return data
  }

  /** @override */
  async GMUpdate () {}

  // activateListeners (html) {
  //   super.activateListeners(html)
  // }
}
