import { CoC7Item } from '../item.js'

export class CoC7Spell extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      data.img = 'systems/CoC7/assets/icons/pentagram-rose.svg'
    }
    super(data, context)
  }
}
