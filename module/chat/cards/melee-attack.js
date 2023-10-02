/* global foundry */
import { EnhancedChatCard } from '../../common/chatcardlib/src/chatcardlib.js'

export class MeleeAttackCard extends EnhancedChatCard {
  /**
   * Extend and override the default options
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/chat/cards/melee-attack.html'
    })
  }

  async getData () {
    const data = await super.getData()
    data.mySelectOptions = {
      0: 'option 1',
      1: 'option 2'
    }

    return data
  }
}
