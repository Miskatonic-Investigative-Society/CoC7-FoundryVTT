/* global foundry game */
import CoC7ModelsItemGlobalSystem from './global-system.js'

export default class CoC7ModelsItemArmorSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'icons/svg/shield.svg'
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
      })
    }
  }

  /**
   * Create empty object for this item type
   * @param {object} options
   * @returns {object}
   */
  static emptyObject (options) {
    const object = foundry.utils.mergeObject({
      name: game.i18n.localize('CoC7.NewArmorName'),
      type: 'armor',
      system: new CoC7ModelsItemArmorSystem().toObject()
    }, options)
    return object
  }
}
