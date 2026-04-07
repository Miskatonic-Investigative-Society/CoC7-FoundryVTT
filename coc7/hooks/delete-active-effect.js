/* global game */
import { STATUS_EFFECTS } from '../constants.js'
import CoC7ActiveEffect from '../apps/active-effect.js'

/**
 * Active Effect was deleted
 * @param {Document} document
 * @param {object} options
 * @param {string} userId
 */
export default function (document, options, userId) {
  if (game.userId === userId) {
    const statusKey = CoC7ActiveEffect.getStatusKey(document)
    if (statusKey) {
      switch (statusKey) {
        case STATUS_EFFECTS.tempoInsane:
        case STATUS_EFFECTS.indefInsane:
        case STATUS_EFFECTS.unconscious:
        case STATUS_EFFECTS.criticalWounds:
        case STATUS_EFFECTS.dying:
        case STATUS_EFFECTS.prone:
        case STATUS_EFFECTS.dead:
          document.parent.conditionsUnset([statusKey], {
            forceValue: true
          })
          break
      }
    }
  }
}
