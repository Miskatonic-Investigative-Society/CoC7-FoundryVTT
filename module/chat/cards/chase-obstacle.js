import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'

export class ChaseObstacleCard extends EnhancedChatCard {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/test.html'
    })
  }

  /** @override */
  async getData () {
    const data = await super.getData()
    data.mySelectOptions = {
      0: 'option 1',
      1: 'option 2'
    }
    const chaseItem = await fromUuid(this._data.chaseUuid)
    await chaseItem.activateLocation('szb0qfp1oehux6be')

    return data
  }

  // activateListeners (html) {
  //   super.activateListeners(html)
  // }
}
