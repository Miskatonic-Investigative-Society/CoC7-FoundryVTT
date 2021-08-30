import { CoC7Item } from '../item.js'

export class CoC7Book extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') data.img = 'icons/svg/book.svg'
    super(data, context)
  }
}
