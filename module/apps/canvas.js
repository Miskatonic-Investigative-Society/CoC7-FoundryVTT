/* global game, ui */
import { chatHelper } from '../chat/helper.js'
import { CoC7Utilities } from '../utilities.js'
import { CoC7Link } from './link.js'

export class CoC7Canvas {
  static get COC7_TYPES_SUPPORTED () {
    return ['link', 'chase']
  }

  static async onDropSomething (canvas, data) {
    if (
      data.CoC7Type &&
      CoC7Canvas.COC7_TYPES_SUPPORTED.includes(data.CoC7Type)
    ) {
      const gridSize = canvas.scene.data.grid
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
      switch (data.CoC7Type) {
        case 'link':
          {
            const link = await CoC7Link.fromData(data)
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
              for (const u of whisperTargets) {
                option.whisper = [u]
                chatHelper.createMessage(
                  null,
                  game.i18n.format('CoC7.MessageTargetCheckRequested', {
                    name: u.character.name,
                    check: link.link
                  }),
                  option
                )
              }
            } else {
              for (const t of dropTargetTokens) {
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
              }
            }
          }
          break

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
