import { CoC7Item } from '../item.js'

export class CoC7Chase extends CoC7Item {
    constructor (data, context) {
        if (typeof data.img === 'undefined') {
            data.img = 'systems/CoC7/assets/icons/running-solid.svg'
          }
          super(data, context)
          this.context = context
    }
}