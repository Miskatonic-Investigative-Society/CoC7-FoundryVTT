/* global CONFIG */
import { CoCActor } from '../actors/actor.js'
import { CoC7Book } from '../items/book/data.js'
import { CoC7Item } from '../items/item.js'
import { CoC7Spell } from '../items/spell/data.js'
import { CoC7Chase } from '../items/chase/data.js'
import CoC7ActiveEffect from '../active-effect.js'
import { CoC7Skill } from '../items/skill/data.js'
import { CoC7Vehicle } from '../actors/vehicle/data.js'

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
