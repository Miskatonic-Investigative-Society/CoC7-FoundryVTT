/* global foundry */
import CoC7ModelsItemGlobalSystem from './global-system.js'

export default class CoC7ModelsItemStatusSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'icons/svg/aura.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      /* // FoundryVTT V13 - not required
      active: false,
      duration: {
        permanent: true,
        hours: null,
        minutes: null,
        rounds: null
      },
      */
      source: new fields.StringField({ initial: '' }),
      description: new fields.SchemaField({
        value: new fields.HTMLField({ initial: '' }),
        /* // FoundryVTT V13 - not required
        chat: '',
        */
        notes: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' })
      }),
      type: new fields.SchemaField({
        mania: new fields.BooleanField({ label: 'CoC7.Mania', initial: false }),
        phobia: new fields.BooleanField({ label: 'CoC7.Phobia', initial: false })
      })
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
      foundry.utils.setProperty(source, 'description.value', source.description)
    }
    return super.migrateData(source)
  }
}
