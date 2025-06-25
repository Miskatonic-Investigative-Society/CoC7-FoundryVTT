/* global game */
import { COC7 } from '../config.js'
import CoC7ActiveEffect from '../documents/active-effect.js'

export default function (data, options, userId) {
  if (game.userId === userId) {
    const statusKey = CoC7ActiveEffect.getStatusKey(data)
    if (statusKey) {
      switch (statusKey) {
        case COC7.status.tempoInsane:
        case COC7.status.indefInsane:
        case COC7.status.unconscious:
        case COC7.status.criticalWounds:
        case COC7.status.dying:
        case COC7.status.prone:
        case COC7.status.dead:
          data.parent.unsetCondition(statusKey, {
            forceValue: true
          })
      }
    }
  }
}
