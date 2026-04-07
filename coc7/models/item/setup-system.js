/* global foundry */
import { MONETARY_FORMAT_KEYS, MONETARY_TYPE_KEYS } from '../../constants.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemSetupSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    const monetaryTypes = Object.keys(MONETARY_TYPE_KEYS)
    return {
      description: new fields.SchemaField({
        value: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' })
      }),
      characteristics: new fields.SchemaField({
        points: new fields.SchemaField({
          enabled: new fields.BooleanField({ initial: false }),
          value: new fields.NumberField({ nullable: false, initial: 460 })
        }),
        rolls: new fields.SchemaField({
          enabled: new fields.BooleanField({ initial: true }),
          /* // FoundryVTT V13 - not required
          enableIndividualRolls: true,
          */
          str: new fields.StringField({ nullable: false, initial: '(3D6)*5' }),
          con: new fields.StringField({ nullable: false, initial: '(3D6)*5' }),
          siz: new fields.StringField({ nullable: false, initial: '(2D6+6)*5' }),
          dex: new fields.StringField({ nullable: false, initial: '(3D6)*5' }),
          app: new fields.StringField({ nullable: false, initial: '(3D6)*5' }),
          int: new fields.StringField({ nullable: false, initial: '(2D6+6)*5' }),
          pow: new fields.StringField({ nullable: false, initial: '(3D6)*5' }),
          edu: new fields.StringField({ nullable: false, initial: '(2D6+6)*5' }),
          luck: new fields.StringField({ nullable: false, initial: '(3D6)*5' })
        })
        /* // FoundryVTT V13 - not required
        values: new fields.SchemaField({
          str: null,
          con: null,
          siz: null,
          dex: null,
          app: null,
          int: null,
          pow: null,
          edu: null,
          luck: null
        })
        */
      }),
      monetary: new fields.SchemaField({
        format: new fields.StringField({
          choices: Object.keys(MONETARY_FORMAT_KEYS),
          initial: MONETARY_FORMAT_KEYS.decimalLeft
        }),
        symbol: new fields.StringField({ initial: '$' }),
        values: new fields.ArrayField(
          new fields.SchemaField({
            name: new fields.StringField({ }),
            min: new fields.NumberField({ nullable: true }),
            max: new fields.NumberField({ nullable: true }),
            cashType: new fields.StringField({ choices: monetaryTypes, initial: monetaryTypes[0] }),
            cashValue: new fields.NumberField({ nullable: false }),
            assetsType: new fields.StringField({ choices: monetaryTypes, initial: monetaryTypes[0] }),
            assetsValue: new fields.NumberField({ nullable: false }),
            spendingType: new fields.StringField({ choices: monetaryTypes, initial: monetaryTypes[0] }),
            spendingValue: new fields.NumberField({ nullable: false })
          }),
          {
            initial: [
              {
                name: 'CoC7.MonetaryDefaultPenniless',
                min: null,
                max: 0,
                cashType: MONETARY_TYPE_KEYS.value,
                cashValue: 0.5,
                assetsType: MONETARY_TYPE_KEYS.value,
                assetsValue: 0,
                spendingType: MONETARY_TYPE_KEYS.value,
                spendingValue: 0.5
              },
              {
                name: 'CoC7.MonetaryDefaultPoor',
                min: 1,
                max: 9,
                cashType: MONETARY_TYPE_KEYS.multiplier,
                cashValue: 1,
                assetsType: MONETARY_TYPE_KEYS.multiplier,
                assetsValue: 10,
                spendingType: MONETARY_TYPE_KEYS.value,
                spendingValue: 2
              },
              {
                name: 'CoC7.MonetaryDefaultAverage',
                min: 10,
                max: 49,
                cashType: MONETARY_TYPE_KEYS.multiplier,
                cashValue: 2,
                assetsType: MONETARY_TYPE_KEYS.multiplier,
                assetsValue: 50,
                spendingType: MONETARY_TYPE_KEYS.value,
                spendingValue: 10
              },
              {
                name: 'CoC7.MonetaryDefaultWealthy',
                min: 50,
                max: 89,
                cashType: MONETARY_TYPE_KEYS.multiplier,
                cashValue: 5,
                assetsType: MONETARY_TYPE_KEYS.multiplier,
                assetsValue: 500,
                spendingType: MONETARY_TYPE_KEYS.value,
                spendingValue: 50
              },
              {
                name: 'CoC7.MonetaryDefaultRich',
                min: 90,
                max: 98,
                cashType: MONETARY_TYPE_KEYS.multiplier,
                cashValue: 20,
                assetsType: MONETARY_TYPE_KEYS.multiplier,
                assetsValue: 2000,
                spendingType: MONETARY_TYPE_KEYS.value,
                spendingValue: 250
              },
              {
                name: 'CoC7.MonetaryDefaultSuperRich',
                min: 99,
                max: null,
                cashType: MONETARY_TYPE_KEYS.value,
                cashValue: 50000,
                assetsType: MONETARY_TYPE_KEYS.value,
                assetsValue: 5000000,
                spendingType: MONETARY_TYPE_KEYS.value,
                spendingValue: 5000
              }
            ]
          }
        )
      }),
      source: new fields.StringField({ initial: '' }),
      enableCharacterisitics: new fields.BooleanField({ initial: true }),
      /* // FoundryVTT V13 - not required
      attributes: {},
      properties: {},
      flags: {},
      */
      itemDocuments: new fields.ArrayField(
        new fields.JSONField({ })
      ),
      itemKeys: new fields.ArrayField(
        new fields.StringField({ initial: '' })
      ),
      bioSections: new fields.ArrayField(
        new fields.StringField({ initial: '' })
      ),
      backstory: new fields.HTMLField({ initial: '' })
    }
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Old system.items array could contain mix of CoC IDs and Documents split into StringField and JSONField arrays
    if (typeof source.items !== 'undefined' && typeof source.itemDocuments === 'undefined' && typeof source.itemKeys === 'undefined') {
      source.itemDocuments = source.items.filter(x => typeof x !== 'string')
      source.itemKeys = source.items.filter(x => typeof x === 'string')
    }
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description.value', source.description)
    }
    return super.migrateData(source)
  }

  /**
   * Get JSON version of all items
   * @returns {Array}
   */
  async items () {
    return CoC7Utilities.getEmbeddedItems(this.parent, 'system')
  }

  /**
   * Create update object
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   * @returns {object}
   */
  async prepareToggleUpdate (property, key, { isCtrlKey = false } = {}) {
    const changes = await super.prepareToggleUpdate(property, key, { isCtrlKey })
    if (typeof changes['system.characteristics.points.enabled'] !== 'undefined') {
      changes['system.characteristics.rolls.enabled'] = !changes['system.characteristics.points.enabled']
    } else if (typeof changes['system.characteristics.rolls.enabled'] !== 'undefined') {
      changes['system.characteristics.points.enabled'] = !changes['system.characteristics.rolls.enabled']
    }
    return changes
  }
}
