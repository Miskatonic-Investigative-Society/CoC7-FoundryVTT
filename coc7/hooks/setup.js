import { FOLDER_ID, STATUS_EFFECTS } from '../constants.js'

export default function () {
  /* // FoundryVTT V13 */
  const orderKey = (game.release.generation === 13 ? 'sort' : 'order')
  const statusEffects = foundry.utils.duplicate(CONFIG.statusEffects)
  for (const effectIndex in statusEffects) {
    statusEffects[effectIndex][orderKey] = 6
  }
  let effectIndex = statusEffects.findIndex(t => t.id === STATUS_EFFECTS.dead)
  if (effectIndex !== -1) {
    statusEffects[effectIndex].img = 'systems/' + FOLDER_ID + '/assets/game-icons/lorc/tombstone.svg'
    statusEffects[effectIndex][orderKey] = 2
  }
  effectIndex = statusEffects.findIndex(t => t.id === STATUS_EFFECTS.unconscious)
  if (effectIndex !== -1) {
    statusEffects[effectIndex].img = 'systems/' + FOLDER_ID + '/assets/game-icons/delapouite/knocked-out-stars.svg'
    statusEffects[effectIndex][orderKey] = 3
  }
  statusEffects.unshift(
    {
      id: STATUS_EFFECTS.tempoInsane,
      name: 'CoC7.BoutOfMadnessName',
      img: 'systems/' + FOLDER_ID + '/assets/game-icons/lorc/hanging-spider.svg',
      [orderKey]: 4
    },
    {
      id: STATUS_EFFECTS.indefInsane,
      name: 'CoC7.InsanityName',
      img: 'systems/' + FOLDER_ID + '/assets/game-icons/lorc/tentacles-skull.svg',
      [orderKey]: 5
    },
    {
      id: STATUS_EFFECTS.criticalWounds,
      name: 'CoC7.CriticalWounds',
      img: 'systems/' + FOLDER_ID + '/assets/game-icons/delapouite/arm-sling.svg',
      [orderKey]: 0
    },
    {
      id: STATUS_EFFECTS.dying,
      name: 'CoC7.Dying',
      img: 'systems/' + FOLDER_ID + '/assets/game-icons/delapouite/heart-beats.svg',
      [orderKey]: 1
    }
  )
  statusEffects.sort((a, b) => {
    if (a[orderKey] === b[orderKey]) {
      return game.i18n.localize(a.name).localeCompare(game.i18n.localize(b.name), game.i18n.lang)
    }
    return a[orderKey] - b[orderKey]
  })
  for (const effectIndex in statusEffects) {
    statusEffects[effectIndex][orderKey] = effectIndex
  }
  CONFIG.statusEffects = statusEffects
}
