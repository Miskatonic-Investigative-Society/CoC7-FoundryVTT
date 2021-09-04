/* global game, ui */

import { chatHelper } from '../chat/helper.js'
import { CoC7Link } from './link.js'

export class CoC7Canvas {
  static get COC7_TYPES_SUPPORTED () {
    return ['link']
  }

  static async onDropSomething (canvas, item) {
    if (
      item.CoC7Type &&
      CoC7Canvas.COC7_TYPES_SUPPORTED.includes(item.CoC7Type)
    ) {
      const gridSize = canvas.scene.data.grid
      const x = item.x - gridSize / 2
      const y = item.y - gridSize / 2
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
      switch (item.CoC7Type) {
        case 'link':
          {
            const link = await CoC7Link.fromData(item)
            if (!link.link) {
              ui.notifications.error('Invalid link')
            }

            const option = {}
            option.speaker = {
              alias: game.user.name
            }

            if (!dropTargetTokens.length) {
              const whisperTargets = game.users.players.filter(
                u => !!u.character
              ) // User with at least a character
              whisperTargets.forEach(u => {
                option.whisper = [u]
                chatHelper.createMessage(
                  null,
                  game.i18n.format('CoC7.MessageTargetCheckRequested', {
                    name: u.character.name,
                    check: link.link
                  }),
                  option
                )
              })
            } else {
              dropTargetTokens.forEach(t => {
                if (t.actor.hasPlayerOwner) {
                  option.whisper = t.actor.owners
                  chatHelper.createMessage(
                    null,
                    game.i18n.format('CoC7.MessageTargetCheckRequested', {
                      name: t.actor.name,
                      check: link.link
                    }),
                    option
                  )
                }
              })
            }
          }
          break

        default:
          break
      }
    }
  }
}
