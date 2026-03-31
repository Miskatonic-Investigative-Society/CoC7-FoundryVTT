/* global CONFIG */
import CoC7DecaderDie from '../apps/decader-die.js'
import CoC7DecaderDieOther from '../apps/decader-die-other.js'

export default function () {
  CONFIG.Dice.terms.t = CoC7DecaderDie
  CONFIG.Dice.terms.o = CoC7DecaderDieOther
}
