/* global foundry */
import CoC7ModelsItemGlobalSystem from './global-system.js'

export default class CoC7ModelsItemTalentSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
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
        physical: new fields.BooleanField({ label: 'CoC7.PhysicalTalent', initial: false }),
        mental: new fields.BooleanField({ label: 'CoC7.MentalTalent', initial: false }),
        combat: new fields.BooleanField({ label: 'CoC7.CombatTalent', initial: false }),
        miscellaneous: new fields.BooleanField({ label: 'CoC7.MiscellaneousTalent', initial: false }),
        basic: new fields.BooleanField({ label: 'CoC7.BasicTalent', initial: false }),
        insane: new fields.BooleanField({ label: 'CoC7.InsaneTalent', initial: false }),
        other: new fields.BooleanField({ label: 'CoC7.OtherTalent', initial: false })
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
