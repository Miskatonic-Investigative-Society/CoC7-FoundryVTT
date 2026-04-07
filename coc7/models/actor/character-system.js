/* global foundry */
import { FOLDER_ID, MONETARY_FORMAT_KEYS, MONETARY_TYPE_KEYS } from '../../constants.js'
import CoC7ModelsActorGlobalSystem from './global-system.js'

export default class CoC7ModelsActorCharacterSystem extends CoC7ModelsActorGlobalSystem {
  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    const monetaryTypes = Object.keys(MONETARY_TYPE_KEYS)
    return {
      characteristics: CoC7ModelsActorCharacterSystem.defineSchemaCharacteristics(),
      attribs: CoC7ModelsActorCharacterSystem.defineSchemaAttribs(),
      conditions: CoC7ModelsActorCharacterSystem.defineSchemaConditions(),
      books: CoC7ModelsActorCharacterSystem.defineSchemaBooks(),
      infos: new fields.SchemaField({
        occupation: new fields.StringField({ initial: '' }),
        age: new fields.StringField({ initial: '' }),
        sex: new fields.StringField({ initial: '' }),
        residence: new fields.StringField({ initial: '' }),
        birthplace: new fields.StringField({ initial: '' }),
        archetype: new fields.StringField({ initial: '' }),
        organization: new fields.StringField({ initial: '' }),
        playername: new fields.StringField({ initial: '' })
      }),
      flags: new fields.SchemaField({
        locked: new fields.BooleanField({ initial: true }),
        manualCredit: new fields.BooleanField({ initial: false }),
        mythosHardened: new fields.BooleanField({ initial: false }),
        mythosInsanityExperienced: new fields.BooleanField({ initial: false }),
        skillListMode: new fields.BooleanField({ initial: false }),
        skillShowUncommon: new fields.BooleanField({ initial: true })
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
            cashType: new fields.StringField({ choices: monetaryTypes }),
            cashValue: new fields.NumberField({ nullable: false }),
            assetsType: new fields.StringField({ choices: monetaryTypes }),
            assetsValue: new fields.NumberField({ nullable: false }),
            spendingType: new fields.StringField({ choices: monetaryTypes }),
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
        ),
        spent: new fields.StringField({ initial: '' }),
        assetsDetails: new fields.StringField({ initial: '' }),
        spendingLevel: new fields.StringField({ initial: '' }),
        cash: new fields.StringField({ initial: '' }),
        assets: new fields.StringField({ initial: '' })
      }),
      development: new fields.SchemaField({
        personal: new fields.NumberField({ nullable: false, initial: 0 }),
        occupation: new fields.NumberField({ nullable: false, initial: 0 }),
        archetype: new fields.NumberField({ nullable: false, initial: 0 }),
        experiencePackage: new fields.NumberField({ nullable: false, initial: 0 })
      }),
      biography: new fields.ArrayField(
        new fields.SchemaField({
          title: new fields.StringField({ initial: '' }),
          value: new fields.HTMLField({ initial: '' })
        })
      ),
      sanityLossEvents: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ initial: '' }),
          totalLoss: new fields.NumberField({ nullable: true, initial: null }),
          immunity: new fields.BooleanField({ initial: false })
        })
      ),
      backstory: new fields.HTMLField({ initial: '' }),
      /* // FoundryVTT V13 - not required
      indefiniteInsanityLevel: {
        value: 0,
        max: 0
      }
      */
      description: new fields.SchemaField({
        keeper: new fields.HTMLField({ initial: '' })
      }),
      notes: new fields.StringField({ initial: '' })
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
        actorLink: true,
        disposition: 1,
        sight: {
          enabled: true
        }
      }
    })
    return changes
  }

  /**
   * List of skills used for Active Effects
   * @returns {Array}
   */
  get skills () {
    const options = this.parent.items.reduce((c, d) => {
      if (d.type === 'skill') {
        const id = d.flags?.[FOLDER_ID]?.cocidFlag?.id
        if (id) {
          c[id.replace(/\./g, '>>')] = d
        }
        c[d.name] = d
      }
      return c
    }, {})
    return options
  }

  /**
   * Active Effects set values
   * @param {object} setValues
   */
  set skills (setValues) {
    const object = foundry.utils.flattenObject(setValues)
    for (const [key, value] of Object.entries(object)) {
      const match = key.match(/^(i>>skill>>[^.]+)\.(.+)$/)
      if (match) {
        const item = this.parent.getFirstItemByCoCID(match[1].replace(/>>/g, '.'))
        if (item) {
          foundry.utils.setProperty(item, match[2], value)
        }
      } else {
        const match = key.match(/^([^.]+)\.(.+)$/)
        if (match) {
          const item = this.parent.items.getName(match[1])
          if (item) {
            foundry.utils.setProperty(item, match[2], value)
          }
        }
      }
    }
    //
  }

  /**
   * Format monetary value
   * @param {string} type
   * @returns {string}
   */
  formattedMonetaryValue (type) {
    const typeKey = type + 'Type'
    const valueKey = type + 'Value'
    const creditRating = this.parent.creditRatingSkill?.system.value ?? 0
    const row = this.monetary.values.find(r => (typeof r.min === 'object' || r.min <= creditRating) && (typeof r.max === 'object' || r.max >= creditRating))
    let value = 0
    if (typeof row !== 'undefined' && typeof row[typeKey] !== 'undefined' && typeof row[valueKey] !== 'undefined') {
      switch (this.monetary.format) {
        case MONETARY_FORMAT_KEYS.lsd:
          switch (row[typeKey]) {
            case MONETARY_TYPE_KEYS.multiplier:
              value = 240 * creditRating * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.value:
              value = 240 * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.s:
              value = 12 * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.d:
              value = 1 * row[valueKey]
              break
          }
          break
        case MONETARY_FORMAT_KEYS.roman:
          switch (row[typeKey]) {
            case MONETARY_TYPE_KEYS.multiplier:
              value = 400 * creditRating * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.value:
              value = 400 * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.denarii:
              value = 16 * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.quinarii:
              value = 8 * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.sestertii:
              value = 4 * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.asses:
              value = 1 * row[valueKey]
              break
          }
          break
        default:
          switch (row[typeKey]) {
            case MONETARY_TYPE_KEYS.multiplier:
              value = creditRating * row[valueKey]
              break
            case MONETARY_TYPE_KEYS.value:
              value = 1 * row[valueKey]
              break
          }
          break
      }
    }
    switch (this.monetary.format) {
      case MONETARY_FORMAT_KEYS.lsd:
        return Math.floor(value / 240) + '/' + (Math.floor(value / 12) % 20) + '/' + (value % 12)
      case MONETARY_FORMAT_KEYS.roman:
        return (Math.floor(value / 400)) + '/' + (Math.floor(value / 16) % 25) + '/' + (Math.floor(value / 8) % 2) + '/' + (Math.floor(value / 4) % 2) + '/' + (value % 4)
      case MONETARY_FORMAT_KEYS.decimalLeft:
        return this.monetary.symbol + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }).replace(/\.00$/, '')
      case MONETARY_FORMAT_KEYS.decimalRight:
        return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }).replace(/\.00$/, '') + ' ' + this.monetary.symbol
      case MONETARY_FORMAT_KEYS.integerLeft:
        return this.monetary.symbol + Number(value).toLocaleString()
      case MONETARY_FORMAT_KEYS.integerRight:
        return Number(value).toLocaleString() + ' ' + this.monetary.symbol
    }
    return '0'
  }
}
