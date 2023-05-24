/* global game */
import { CoC7Link } from './coc7-link.js'

export class CoC7Canvas {
  static get COC7_TYPES_SUPPORTED () {
    return ['CoC7Link']
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

        // This does not appear to be called in FoundryVTT v10, remove if not needed
        // COC7_TYPES_SUPPORTED chase has been removed because of this
        // default:
        //   if (data.docUuid && data.callBack) {
        //     const doc = CoC7Utilities.SfromUuid(data.docUuid)
        //     if (
        //       doc[data.callBack] &&
        //       typeof doc[data.callBack] === 'function'
        //     ) {
        //       try {
        //         data.scene = canvas.scene.uuid
        //         doc[data.callBack](data)
        //       } catch (error) {
        //         console.warn(error.message)
        //       }
        //     }
        //   }
        //   break
      }
    }
  }
}
