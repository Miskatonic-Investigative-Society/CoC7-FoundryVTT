/* global CONFIG */

import { CoCActor } from '../actors/actor.js'
import { CoC7Book } from '../items/book/data.js'
import { CoC7Item } from '../items/item.js'
import { CoC7Spell } from '../items/spell/data.js'

export function configureDocuments () {
  CONFIG.Actor.documentClass = CoCActor
  CONFIG.Actor.documentClasses = {}
  CONFIG.Item.documentClass = CoC7Item
  CONFIG.Item.documentClasses = {
    book: CoC7Book,
    spell: CoC7Spell
  }
}
