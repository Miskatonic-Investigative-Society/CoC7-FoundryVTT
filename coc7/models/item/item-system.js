import { FOLDER_ID, ERAS } from '../../constants.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'

export default class CoC7ModelsItemItemSystem extends CoC7ModelsItemGlobalSystem {
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
      quantity: new fields.NumberField({ nullable: false, initial: 1 }),
      weight: new fields.NumberField({ nullable: false, initial: 0 }),
      /* // FoundryVTT V13 - not required
      attributes: {},
      */
      price: new fields.TypedObjectField(
        new fields.StringField({ nullable: true, initial: null }),
        {
          validateKey: (key) => typeof ERAS[key] !== 'undefined'
        }
      )
    }
  }

  /**
   * Create empty object for this item type
   * @param {object} options
   * @returns {object}
   */
  static emptyObject (options) {
    const object = foundry.utils.mergeObject({
      name: game.i18n.localize('CoC7.NewItemName'),
      type: 'item',
      system: new CoC7ModelsItemItemSystem().toObject()
    }, options)
    return object
  }

  /**
   * Toggle flag
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   */
  async toggleProperty (property, key, { isCtrlKey = false } = {}) {
    await super.toggleProperty(property, key, isCtrlKey)
    if (property === 'eras' && this.parent.flags[FOLDER_ID]?.cocidFlag?.eras?.[key] !== true) {
      const updates = {}
      /* // FoundryVTT V13 */
      if (game.release.generation === 13) {
        updates['system.price.-=' + key] = null
      } else {
        updates['system.price.' + key] = new foundry.data.operators.ForcedDeletion()
      }
      this.parent.update(updates)
    }
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description', { value: source.description })
    }
    return super.migrateData(source)
  }
}
