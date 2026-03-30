/* global CONFIG game  */
import { COC7 } from '../config.js'

export default function () {
  // Localize CONFIG objects once up-front
  const toLocalize = [
    'spellProperties',
    'bookType',
    'talentType',
    'occupationProperties',
    'statusType'
  ]

  for (const o of toLocalize) {
    const localized = Object.entries(COC7[o]).map(e => {
      return [e[0], game.i18n.localize(e[1])]
    })
    COC7[o] = localized.reduce((obj, e) => {
      obj[e[0]] = e[1]
      return obj
    }, {})
  }

  let effectIndex = CONFIG.statusEffects.findIndex(
    t => t.id === COC7.status.dead
  )
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].icon =
      'systems/CoC7/assets/icons/tombstone.svg'
  }
  effectIndex = CONFIG.statusEffects.findIndex(
    t => t.id === COC7.status.unconscious
  )
  if (effectIndex !== -1) {
    CONFIG.statusEffects[effectIndex].icon =
      'systems/CoC7/assets/icons/knocked-out-stars.svg'
  }
  CONFIG.statusEffects.unshift(
    {
      id: COC7.status.tempoInsane,
      name: 'CoC7.BoutOfMadnessName',
      icon: 'systems/CoC7/assets/icons/hanging-spider.svg'
    },
    {
      id: COC7.status.indefInsane,
      name: 'CoC7.InsanityName',
      icon: 'systems/CoC7/assets/icons/tentacles-skull.svg'
    },
    {
      id: COC7.status.criticalWounds,
      name: 'CoC7.CriticalWounds',
      icon: 'systems/CoC7/assets/icons/arm-sling.svg'
    },
    {
      id: COC7.status.dying,
      name: 'CoC7.Dying',
      icon: 'systems/CoC7/assets/icons/heart-beats.svg'
    }
  )
}
