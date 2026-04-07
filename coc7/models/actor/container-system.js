/* global foundry */
import CoC7ModelsActorGlobalSystem from './global-system.js'

export default class CoC7ModelsActorContainerSystem extends CoC7ModelsActorGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'icons/svg/chest.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      description: new fields.SchemaField({
        value: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' })
      }),
      flags: new fields.SchemaField({
        locked: new fields.BooleanField({ initial: false }),
        panelInventoryItems: new fields.BooleanField({ initial: true }),
        panelInventoryBooks: new fields.BooleanField({ initial: true }),
        panelInventorySpells: new fields.BooleanField({ initial: true }),
        panelInventoryWeapons: new fields.BooleanField({ initial: true }),
        panelInventoryArmor: new fields.BooleanField({ initial: true })
      })
    }
  }

  /**
   * @inheritdoc
   * @param {object} changes
   * @param {object} data
   * @param {object} options
   * @param {documents.BaseUser} user
   * @returns {object}
   */
  static _preCreateChanges (changes, data, options, user) {
    changes = foundry.utils.mergeObject(changes, {
      prototypeToken: {
        actorLink: true
      }
    })
    return changes
  }
}
