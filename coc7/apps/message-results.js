/* global ChatMessage game */
import { FOLDER_ID } from '../constants.js'
import CoC7ChatCombinedMessage from './chat-combined-message.js'
import CoC7ChatOpposedMessage from './chat-opposed-message.js'
import CoC7Check from './check.js'
import CoC7ChatCombatMelee from './chat-combat-melee.js'
import CoC7ChatCombatRanged from './chat-combat-ranged.js'

export default class CoC7MessageResults {
  /**
   * Get CoC7DicePool from a message for third party to easily see results
   * @param {Document} message
   * @returns {object}
   */
  static async loadMessage (message) {
    if (typeof message === 'string') {
      message = game.messages.get(message)
    }
    if (message instanceof ChatMessage) {
      let check
      switch (message.flags?.[FOLDER_ID]?.load?.as) {
        case 'CoC7ChatCombatMelee':
          check = await CoC7ChatCombatMelee.loadFromMessage(message)
          break
        case 'CoC7ChatCombatRanged':
          check = await CoC7ChatCombatRanged.loadFromMessage(message)
          break
        case 'CoC7ChatCombinedMessage':
          check = await CoC7ChatCombinedMessage.loadFromMessage(message)
          break
        case 'CoC7ChatOpposedMessage':
          check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          break
        case 'CoC7Check':
          check = await CoC7Check.loadFromMessage(message)
          break
      }
      if (typeof check !== 'undefined') {
        // XXXX need global format
        return await check.results()
      }
      throw new Error('Not a dice pool message')
    }
    throw new Error('Not a chat message')
  }
}
