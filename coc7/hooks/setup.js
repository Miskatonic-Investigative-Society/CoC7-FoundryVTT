/* global CONFIG  */
import { FOLDER_ID, STATUS_EFFECTS } from '../constants.js'

export default function () {
  let effectIndex = CONFIG.statusEffects.findIndex(t => t.id === STATUS_EFFECTS.dead)
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].img = 'systems/' + FOLDER_ID + '/assets/icons/tombstone.svg'
  }
  effectIndex = CONFIG.statusEffects.findIndex(t => t.id === STATUS_EFFECTS.unconscious)
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].img = 'systems/' + FOLDER_ID + '/assets/icons/knocked-out-stars.svg'
  }
  CONFIG.statusEffects.unshift(
    {
      id: STATUS_EFFECTS.tempoInsane,
      name: 'CoC7.BoutOfMadnessName',
      img: 'systems/' + FOLDER_ID + '/assets/icons/hanging-spider.svg'
    },
    {
      id: STATUS_EFFECTS.indefInsane,
      name: 'CoC7.InsanityName',
      img: 'systems/' + FOLDER_ID + '/assets/icons/tentacles-skull.svg'
    },
    {
      id: STATUS_EFFECTS.criticalWounds,
      name: 'CoC7.CriticalWounds',
      img: 'systems/' + FOLDER_ID + '/assets/icons/arm-sling.svg'
    },
    {
      id: STATUS_EFFECTS.dying,
      name: 'CoC7.Dying',
      img: 'systems/' + FOLDER_ID + '/assets/icons/heart-beats.svg'
    }
  )
}
