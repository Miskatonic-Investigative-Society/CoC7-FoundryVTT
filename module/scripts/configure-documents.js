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
  
  // Register all actor types including container
  CONFIG.Actor.documentClasses = {
    vehicle: CoC7Vehicle,
    container: CoCActor
  }

  // Register all item types
  CONFIG.Item.documentClass = CoC7Item
  CONFIG.Item.documentClasses = {
    book: CoC7Book,
    spell: CoC7Spell,
    chase: CoC7Chase,
    skill: CoC7Skill
  }

  // Add hooks for item-piles integration
  Hooks.on('preCreateActor', (actor, data, options, userId) => {
    // Ensure type is set for item-piles
    if (options?.pack === 'item-piles' || data.flags?.['item-piles']) {
      data.type = 'container'
      // Ensure system data exists
      if (!data.system) {
        data.system = {
          attribs: {
            hp: { value: 0, max: 0 },
            mp: { value: 0, max: 0 },
            san: { value: 0, max: 0 },
            mov: { value: 0 },
            db: { value: 0 },
            build: { value: 0 }
          },
          characteristics: {
            str: { value: 0 },
            con: { value: 0 },
            siz: { value: 0 },
            dex: { value: 0 },
            app: { value: 0 },
            int: { value: 0 },
            pow: { value: 0 },
            edu: { value: 0 }
          }
        }
      }
    }
  })

  // Add hook to handle item-piles token creation
  Hooks.on('preCreateToken', (token, data, options, userId) => {
    if (token.actor?.type === 'container') {
      // Set default token settings for item-piles
      data.actorLink = true
      data.disposition = 0
      data.displayBars = 0
      data.displayName = 0
    }
  })

  // Add hook to handle item-piles actor updates
  Hooks.on('preUpdateActor', (actor, data, options, userId) => {
    if (actor.type === 'container' && !data.type) {
      data.type = 'container'
    }
  })

  // Add hook to handle item-piles document creation
  Hooks.on('preCreateDocumentArray', (documents, data, options, userId) => {
    if (documents[0]?.constructor.name === 'CoCActor') {
      data.forEach(d => {
        if (!d.type) {
          if (options?.pack === 'item-piles' || d.flags?.['item-piles']) {
            d.type = 'container'
          } else {
            d.type = 'character'
          }
        }
      })
    }
  })
}
