/* global game */
import { COC7 } from '../config.js'
import CoC7ActiveEffect from '../documents/active-effect.js'

export default function (data, options, userId) {
  if (game.userId === userId) {
    const statusKey = CoC7ActiveEffect.getStatusKey(data)
    if (statusKey) {
      switch (statusKey) {
        case COC7.status.indefInsane:
        case COC7.status.unconscious:
        case COC7.status.criticalWounds:
        case COC7.status.dying:
        case COC7.status.prone:
        case COC7.status.dead:
          data.parent.setCondition(statusKey, {
            forceValue: true
          })
          break
        case COC7.status.tempoInsane:
          {
            const realTime = data.flags.CoC7?.realTime
            let duration = null
            if (realTime === true) {
              duration = data.duration?.rounds
            } else if (realTime === false) {
              duration = data.duration?.seconds
              if (!isNaN(duration)) {
                duration = Math.floor(duration / 3600)
              }
            }
            data.parent.setCondition(COC7.status.tempoInsane, {
              forceValue: true,
              realTime,
              duration
            })
          }
          break
      }
    }
  }
}
