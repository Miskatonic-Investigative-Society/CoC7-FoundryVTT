/* global CONFIG */
import { CoCActor } from '../actors/actor.js'
import CoC7Book from '../models/item/book-system.js'
import CoC7Item from '../models/item/document-class.js'
import CoC7Spell from '../models/item/spell-system.js'
import CoC7Chase from '../models/item/chase-system.js'
import CoC7ActiveEffect from '../apps/active-effect.js'
import CoC7Skill from '../models/item/skill-system.js'
import { CoC7Vehicle } from '../actors/vehicle/data.js'

export default function () {
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
