/* global CONFIG */
import { CoCActor } from '../../core/documents/actor.js'
import { CoC7Book } from '../../features/item-book/data.js'
import { CoC7Item } from '../../core/documents/item.js'
import { CoC7Spell } from '../../features/item-spell/data.js'
import { CoC7Chase } from '../../features/chase/data.js'
import CoC7ActiveEffect from '../../core/documents/active-effect.js'
import { CoC7Skill } from '../../features/item-skill/data.js'
import { CoC7Vehicle } from '../../features/actor-vehicle/data.js'

export function configureDocuments () {
  CONFIG.ActiveEffect.documentClass = CoC7ActiveEffect
  CONFIG.Actor.documentClass = CoCActor
  CONFIG.Actor.documentClasses = {
    vehicle: CoC7Vehicle
  }
  CONFIG.Item.documentClass = CoC7Item
  CONFIG.Item.documentClasses = {
    book: CoC7Book,
    spell: CoC7Spell,
    chase: CoC7Chase,
    skill: CoC7Skill
  }
}
