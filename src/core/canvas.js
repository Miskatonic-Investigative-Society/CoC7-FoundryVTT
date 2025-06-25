/* global game, ui */
import { CoC7Link } from '../features/link-creation/coc7-link.js'
import { CoC7Utilities } from '../shared/utilities.js'

export class CoC7Canvas {
  static get COC7_TYPES_SUPPORTED () {
    return ['CoC7Link', 'locator', 'getToken']
  }

  static async onDropSomething (canvas, data) {
    if (
      data.type &&
      CoC7Canvas.COC7_TYPES_SUPPORTED.includes(data.type)
    ) {
      const gridSize = canvas.scene.grid.size
      const x = data.x - gridSize / 2
      const y = data.y - gridSize / 2
      const height = gridSize
      const width = gridSize
      let dropTargetTokens = canvas.tokens.placeables.filter(obj => {
        const c = obj.center
        return (
          Number.between(c.x, x, x + width) &&
          Number.between(c.y, y, y + height)
        )
      }) // Find drop target.
      if (!dropTargetTokens.length) dropTargetTokens = canvas.tokens.controlled // If no target whisper to selected token
      switch (data.type) {
        case 'CoC7Link':
          if (data.check === CoC7Link.CHECK_TYPE.EFFECT) {
            if (dropTargetTokens.length) {
              for (const token of dropTargetTokens) {
                CoC7Link._onLinkActorClick(token.actor, data)
              }
            } else {
              // Apply to everyone ? or only players ? or nobody
            }
          } else if (dropTargetTokens.length) {
            CoC7Link.toWhisperMessage(data, dropTargetTokens.filter(t => t.actor.owners.length).map(t => t.actor))
          } else {
            CoC7Link.toWhisperMessage(data, game.users.players.filter(u => !!u.character).map(u => u.character))
          }
          break
        case 'getToken':
          if (typeof data.appId !== 'undefined' && typeof data.callBack === 'string' && typeof ui.windows[data.appId] !== 'undefined' && typeof ui.windows[data.appId][data.callBack] === 'function') {
            ui.windows[data.appId][data.callBack](dropTargetTokens)
          }
          break

        // Handles generic canva drop.
        // dataTransfer must include :
        // - docUuid : the Uuid of the document to call
        // - callBack : the name of the function to call in the document.
        // Used to select location for chase
        default:
          if (data.docUuid && data.callBack) {
            const doc = CoC7Utilities.SfromUuid(data.docUuid)
            if (
              doc[data.callBack] &&
              typeof doc[data.callBack] === 'function'
            ) {
              try {
                data.scene = canvas.scene.uuid
                doc[data.callBack](data)
              } catch (error) {
                console.warn(error.message)
              }
            }
          }
          break
      }
    }
  }
}
