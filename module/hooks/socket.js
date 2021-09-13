/* global game, socketlib */
import { CoC7MeleeTarget } from '../chat/combat/melee-target.js'

export function CoC7Socket () {
  game.CoC7socket = socketlib.registerSystem('CoC7')
  game.CoC7socket.register('gmcreatemessageas', gmcreatemessageas)
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
