/* global CONFIG */

import { CoCActor } from '../actors/actor.js'
import { CoC7Item } from '../items/item.js'

export function configureDocuments () {
  CONFIG.Actor.documentClass = CoCActor
  CONFIG.Actor.documentClasses = {}
  CONFIG.Item.documentClass = CoC7Item
  CONFIG.Item.documentClasses = {}
}
