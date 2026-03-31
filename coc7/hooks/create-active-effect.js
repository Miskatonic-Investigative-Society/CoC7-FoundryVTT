/* global game */
import { FOLDER_ID, STATUS_EFFECTS } from '../constants.js'
import CoC7ActiveEffect from '../apps/active-effect.js'

/**
 * Active Effect was added
 * @param {Document} document
 * @param {object} options
 * @param {string} userId
 */
export default function (document, options, userId) {
  if (game.userId === userId) {
    const statusKey = CoC7ActiveEffect.getStatusKey(document)
    if (statusKey) {
      switch (statusKey) {
        case STATUS_EFFECTS.indefInsane:
        case STATUS_EFFECTS.unconscious:
        case STATUS_EFFECTS.criticalWounds:
        case STATUS_EFFECTS.dying:
        case STATUS_EFFECTS.prone:
        case STATUS_EFFECTS.dead:
          document.parent.conditionsSet([statusKey], {
            forceValue: true
          })
          break
        case STATUS_EFFECTS.tempoInsane:
          {
            const realTime = document.flags[FOLDER_ID]?.realTime
            let duration = null
            if (realTime === true) {
              duration = document.duration?.rounds
            } else if (realTime === false) {
              duration = document.duration?.seconds
              if (!isNaN(duration)) {
                duration = Math.floor(duration / 3600)
              }
            }
            document.parent.conditionsSet([statusKey], {
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
