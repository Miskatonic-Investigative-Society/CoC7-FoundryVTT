/* global fromUuid */
import CoC7Link from '../apps/link.js'

/**
 * Useful data is dropped onto an ActorSheet.
 * @param {Actor} actor
 * @param {ActorSheet} sheet
 * @param {object} data
 */
export default async function (actor, sheet, data) {
  if (data.type === 'Item' && typeof data.uuid === 'string') {
    const item = await fromUuid(data.uuid)
    if (typeof item.actor?.id === 'undefined' || item.actor.id === actor.id) {
      return
    }
    switch (actor.type) {
      case 'character':
      case 'npc':
      case 'creature':
        if (['chase'].includes(item.type)) {
          return
        }
        break
      case 'vehicle':
        return
      case 'container':
        if (!['book', 'item', 'spell', 'weapon'].includes(item.type)) {
          return
        }
    }
    item.actor.deleteEmbeddedDocuments('Item', [item._id])
  } else if (data.type === 'CoC7Link' && data.check === CoC7Link.CHECK_TYPE.EFFECT) {
    CoC7Link._onLinkActorClick(actor, data)
  }
}
