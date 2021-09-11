/* global game, socketlib, ui */
import { CoC7MeleeTarget } from '../chat/combat/melee-target.js'

export function CoC7Socket (hasSocket = true) {
  if (hasSocket) {
    game.CoC7socket = socketlib.registerSystem('CoC7')
    game.CoC7socket.register('gmcreatemessageas', gmcreatemessageas)
  } else {
    game.CoC7socket = {
      executeAsGM: function (func, data) {
        ui.notifications.error('socketlib is required', { permanent: true })
        switch (func) {
          case 'gmcreatemessageas':
            return gmcreatemessageas(data)
        }
        ui.notifications.error(game.i18n.format('socketlib fallback function {function} not registered', { function: func }))
        return ''
      }
    }
  }
}

async function gmcreatemessageas (data) {
  const meleeTarget = new CoC7MeleeTarget(
    data.targetKey,
    data.messageId,
    data.fastForward
  )
  meleeTarget.initiatorKey = data.actorKey
  const message = await meleeTarget.createChatCard()
  return message
}
