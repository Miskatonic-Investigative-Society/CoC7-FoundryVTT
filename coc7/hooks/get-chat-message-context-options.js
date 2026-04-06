/* global game */
import { FOLDER_ID } from '../constants.js'
import CoC7ChatChaseObstacle from '../apps/chat-chase-obstacle.js'
import CoC7ChatCombatMelee from '../apps/chat-combat-melee.js'
import CoC7ChatCombatRanged from '../apps/chat-combat-ranged.js'
import CoC7ChatCombinedMessage from '../apps/chat-combined-message.js'
import CoC7ChatDamage from '../apps/chat-damage.js'
import CoC7ChatOpposedMessage from '../apps/chat-opposed-message.js'
import CoC7Check from '../apps/check.js'
import CoC7ConCheck from '../apps/con-check.js'
import CoC7SanCheckCard from '../apps/san-check-card.js'

/**
 * Get config header buttons hook
 * @param {Application} application
 * @param {Array} menuItems
 */
export default function (application, menuItems) {
  menuItems.push({
    name: 'Refresh',
    icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
    condition: li => {
      const message = game.messages.get(li.dataset.messageId)
      return (game.user.isGM && message.flags[FOLDER_ID]?.load?.cardOpen && ['CoC7ChatChaseObstacle', 'CoC7ChatCombatMelee', 'CoC7ChatCombatRanged', 'CoC7ChatCombinedMessage', 'CoC7ChatDamage', 'CoC7ChatOpposedMessage', 'CoC7Check', 'CoC7ConCheck', 'CoC7SanCheckCard'].includes(message.flags[FOLDER_ID]?.load?.as))
    },
    callback: async li => {
      const message = game.messages.get(li.dataset.messageId)
      let check
      switch (message.flags[FOLDER_ID].load.as) {
        case 'CoC7ChatChaseObstacle':
          check = await CoC7ChatChaseObstacle.loadFromMessage(message)
          break
        case 'CoC7ChatCombatMelee':
          check = await CoC7ChatCombatMelee.loadFromMessage(message)
          break
        case 'CoC7ChatCombatRanged':
          check = await CoC7ChatCombatRanged.loadFromMessage(message)
          break
        case 'CoC7ChatCombinedMessage':
          check = await CoC7ChatCombinedMessage.loadFromMessage(message)
          break
        case 'CoC7ChatDamage':
          check = await CoC7ChatDamage.loadFromMessage(message)
          break
        case 'CoC7ChatOpposedMessage':
          check = await CoC7ChatOpposedMessage.loadFromMessage(message)
          break
        case 'CoC7Check':
          check = await CoC7Check.loadFromMessage(message)
          break
        case 'CoC7ConCheck':
          check = await CoC7ConCheck.loadFromMessage(message)
          break
        case 'CoC7SanCheckCard':
          check = await CoC7SanCheckCard.loadFromMessage(message)
          break
      }
      check.updateMessage()
      return true
    }
  })
}
