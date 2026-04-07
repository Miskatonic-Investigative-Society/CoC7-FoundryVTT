/* global foundry */
import CoC7ModelsItemGlobalSystem from './global-system.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemArchetypeSystem extends CoC7ModelsItemGlobalSystem {
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
      source: new fields.StringField({ initial: '' }),
      bonusPoints: new fields.NumberField({ nullable: false, initial: 100 }),
      coreCharacteristics: new fields.SchemaField({
        str: new fields.BooleanField({ label: 'CHARAC.Strength', initial: false }),
        con: new fields.BooleanField({ label: 'CHARAC.Constitution', initial: false }),
        siz: new fields.BooleanField({ label: 'CHARAC.Size', initial: false }),
        dex: new fields.BooleanField({ label: 'CHARAC.Dexterity', initial: false }),
        app: new fields.BooleanField({ label: 'CHARAC.Appearance', initial: false }),
        int: new fields.BooleanField({ label: 'CHARAC.Intelligence', initial: false }),
        pow: new fields.BooleanField({ label: 'CHARAC.Power', initial: false }),
        edu: new fields.BooleanField({ label: 'CHARAC.Education', initial: false })
      }),
      coreCharacteristicsFormula: new fields.SchemaField({
        enabled: new fields.BooleanField({ initial: true }),
        value: new fields.StringField({ initial: '(1D6+13)*5' })
      }),
      suggestedOccupations: new fields.HTMLField({ initial: '' }),
      suggestedTraits: new fields.HTMLField({ initial: '' }),
      talents: new fields.NumberField({ nullable: false, initial: 2 }),
      /* // FoundryVTT V13 - not required
      type: {
        classic: false,
        lovecraftian: false,
        modern: false
      },
      attributes: {},
      properties: {},
      flags: {},
      */
      itemDocuments: new fields.ArrayField(
        new fields.JSONField({ })
      ),
      itemKeys: new fields.ArrayField(
        new fields.StringField({ initial: '' })
      )
    }
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Old system.skills array could contain mix of CoC IDs and Documents split into StringField and JSONField arrays
    if (typeof source.skills !== 'undefined' && typeof source.itemDocuments === 'undefined' && typeof source.itemKeys === 'undefined') {
      source.itemDocuments = source.skills.filter(x => typeof x !== 'string')
      source.itemKeys = source.skills.filter(x => typeof x === 'string')
    }
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description.value', source.description)
    }

    return super.migrateData(source)
  }

  /**
   * Get JSON version of all skills
   * @returns {Array}
   */
  async items () {
    return CoC7Utilities.getEmbeddedItems(this.parent, 'system')
  }
}
