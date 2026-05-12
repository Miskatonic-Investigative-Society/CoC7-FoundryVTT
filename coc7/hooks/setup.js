/* global CONFIG foundry */
import { FOLDER_ID, STATUS_EFFECTS } from '../constants.js'

export default function () {
  const statusEffects = foundry.utils.duplicate(CONFIG.statusEffects)
  for (const effectIndex in statusEffects) {
    statusEffects[effectIndex].sort = 2
  }
  let effectIndex = statusEffects.findIndex(t => t.id === STATUS_EFFECTS.dead)
  if (effectIndex !== -1) {
    statusEffects[effectIndex].img = 'systems/' + FOLDER_ID + '/assets/icons/tombstone.svg'
  }
  effectIndex = statusEffects.findIndex(t => t.id === STATUS_EFFECTS.unconscious)
  if (effectIndex !== -1) {
    statusEffects[effectIndex].img = 'systems/' + FOLDER_ID + '/assets/icons/knocked-out-stars.svg'
  }
  statusEffects.unshift(
    {
      id: STATUS_EFFECTS.tempoInsane,
      name: 'CoC7.BoutOfMadnessName',
      img: 'systems/' + FOLDER_ID + '/assets/icons/hanging-spider.svg',
      sort: 1
    },
    {
      id: STATUS_EFFECTS.indefInsane,
      name: 'CoC7.InsanityName',
      img: 'systems/' + FOLDER_ID + '/assets/icons/tentacles-skull.svg',
      sort: 1
    },
    {
      id: STATUS_EFFECTS.criticalWounds,
      name: 'CoC7.CriticalWounds',
      img: 'systems/' + FOLDER_ID + '/assets/icons/arm-sling.svg',
      sort: 1
    },
    {
      id: STATUS_EFFECTS.dying,
      name: 'CoC7.Dying',
      img: 'systems/' + FOLDER_ID + '/assets/icons/heart-beats.svg',
      sort: 1
    }
  )
  CONFIG.statusEffects = statusEffects
}
