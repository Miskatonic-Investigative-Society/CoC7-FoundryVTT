import { CoC7Check } from '../../check.js'
import { CoC7Item } from '../item.js'

export class CoC7Book extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') data.img = 'icons/svg/book.svg'
    super(data, context)
  }

  static convertDifficulty (difficulty) {
    switch (difficulty) {
      case 'hard':
        return CoC7Check.difficultyLevel.hard
      case 'extreme':
        return CoC7Check.difficultyLevel.extreme
      case 'critical':
        return CoC7Check.difficultyLevel.critical
      case 'unreadable':
        return CoC7Check.difficultyLevel.impossible
      default:
        return CoC7Check.difficultyLevel.regular
    }
  }
}
