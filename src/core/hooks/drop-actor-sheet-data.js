/* global game */
export default function (actor, sheet, data) {
  /* // FoundryVTT V10 */
  if (data.type === 'Item' && data.actorId) {
    if (actor.data._id === data.actorId) {
      return
    }
    let actorFrom = null
    if (data.sceneId && data.tokenId) {
      actorFrom = game.scenes.get(data.sceneId).tokens.get(data.tokenId).actor
    } else {
      actorFrom = game.actors.get(data.actorId)
    }
    switch (actor.data.type) {
      case 'character':
      case 'npc':
      case 'creature':
        if (!['chase'].includes(data.data.type)) {
          return
        }
        break
      case 'vehicle':
        return
      case 'container':
        if (!['book', 'item', 'spell', 'weapon'].includes(data.data.type)) {
          return
        }
    }
    if (actorFrom) {
      actorFrom.deleteEmbeddedDocuments('Item', [data.data._id])
    }
  }
}
