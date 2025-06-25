/* global game, socketlib, ui */
import { CoC7MeleeTarget } from '../../features/combat/melee-target.js'

export default function () {
  game.CoC7socket = socketlib.registerSystem('CoC7')
  game.CoC7socket.register('gmcreatemessageas', gmcreatemessageas)
  game.CoC7socket.register('gmtradeitemto', gmtradeitemto)
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

async function gmtradeitemto (data) {
  try {
    let actor
    if (data.scene) {
      actor = game.scenes.get(data.scene).tokens.get(data.actorFrom).actor
    } else {
      actor = game.actors.get(data.actorFrom)
    }
    const item = actor.items.get(data.item)
    const created = await game.actors
      .get(data.actorTo)
      .createEmbeddedDocuments('Item', [item.toJSON()])
    if (created) {
      actor.deleteEmbeddedDocuments('Item', [item.id])
    }
  } catch (e) {
    ui.notifications.error(e)
    return false
  }
  return true
}
