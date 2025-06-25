import { COC7 } from '../../core/config.js'
const { SchemaField, StringField, NumberField, ArrayField, ObjectField, HTMLField, BooleanField } = foundry.data.fields

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const PoolResourceSchema = () => new SchemaField({
      value: new NumberField({ nullable: true, initial: null, integer: true }),
      max: new NumberField({ nullable: true, initial: null, integer: true }),
      auto: new BooleanField({ initial: true })
    })

    const MonetaryValueSchema = () => new SchemaField({
      name: new StringField({ initial: '' }),
      min: new NumberField({ nullable: true, initial: null, integer: true }),
      max: new NumberField({ nullable: true, initial: null, integer: true }),
      cashType: new StringField({ initial: 'value' }),
      cashValue: new NumberField({ initial: 0 }),
      assetsType: new StringField({ initial: 'value' }),
      assetsValue: new NumberField({ initial: 0 }),
      spendingType: new StringField({ initial: 'value' }),
      spendingValue: new NumberField({ initial: 0 })
    })

    return {
      characteristics: new SchemaField({
        str: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.STR' }), label: new StringField({ initial: 'CHARAC.Strength' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) }),
        con: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.CON' }), label: new StringField({ initial: 'CHARAC.Constitution' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) }),
        siz: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.SIZ' }), label: new StringField({ initial: 'CHARAC.Size' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) }),
        dex: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.DEX' }), label: new StringField({ initial: 'CHARAC.Dexterity' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) }),
        app: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.APP' }), label: new StringField({ initial: 'CHARAC.Appearance' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) }),
        int: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.INT' }), label: new StringField({ initial: 'CHARAC.Intelligence' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) }),
        pow: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.POW' }), label: new StringField({ initial: 'CHARAC.Power' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) }),
        edu: new SchemaField({ value: new NumberField({ nullable: true, initial: null }), tempValue: new NumberField({ nullable: true, initial: null }), short: new StringField({ initial: 'CHARAC.EDU' }), label: new StringField({ initial: 'CHARAC.Education' }), formula: new StringField({ nullable: true, initial: null }), bonusDice: new NumberField({ integer: true, initial: 0 }) })
      }),
      attribs: new SchemaField({
        hp: PoolResourceSchema(),
        mp: PoolResourceSchema(),
        lck: new SchemaField({
          value: new NumberField({ nullable: true, initial: null }),
          max: new NumberField({ initial: 99 }),
          bonusDice: new NumberField({ integer: true, initial: 0 })
        }),
        san: new SchemaField({
          value: new NumberField({ nullable: true, initial: null }),
          max: new NumberField({ initial: 99 }),
          auto: new BooleanField({ initial: true }),
          dailyLoss: new NumberField({ integer: true, initial: 0 }),
          // oneFifthSanity: new StringField({ initial: ' / 0' }),
          bonusDice: new NumberField({ integer: true, initial: 0 })
        }),
        mov: new SchemaField({
          value: new NumberField({ nullable: true, initial: null }),
          auto: new BooleanField({ initial: true }),
          type: new StringField({ initial: 'walk' })
        }),
        db: new SchemaField({
          value: new StringField({ nullable: true, initial: null }),
          auto: new BooleanField({ initial: true })
        }),
        build: new SchemaField({
          current: new NumberField({ nullable: true, initial: null }),
          value: new NumberField({ nullable: true, initial: null }),
          auto: new BooleanField({ initial: true })
        }),
        armor: new SchemaField({
          value: new StringField({ nullable: true, initial: null }),
          localized: new BooleanField({ initial: false }),
          locations: new ArrayField(new ObjectField(), { initial: [] }),
          auto: new BooleanField({ initial: false })
        })
      }),
      conditions: new SchemaField({
        criticalWounds: new BooleanField({ initial: false }),
        unconscious: new BooleanField({ initial: false }),
        dying: new BooleanField({ initial: false }),
        dead: new BooleanField({ initial: false }),
        prone: new BooleanField({ initial: false }),
        tempoInsane: new BooleanField({ initial: false }),
        indefInsane: new BooleanField({ initial: false })
      }),
      infos: new SchemaField({
        occupation: new StringField({ initial: '' }),
        age: new StringField({ initial: '' }),
        sex: new StringField({ initial: '' }),
        residence: new StringField({ initial: '' }),
        birthplace: new StringField({ initial: '' }),
        archetype: new StringField({ initial: '' }),
        organization: new StringField({ initial: '' }),
        playername: new StringField({ initial: '' })
      }),
      monetary: new SchemaField({
        format: new StringField({ choices: Object.values(COC7.monetaryFormatKeys), initial: 'decimalLeft' }),
        symbol: new StringField({ initial: '$' }),
        values: new ArrayField(MonetaryValueSchema(), { initial: [] }),
        spent: new StringField({ nullable: true, initial: null }),
        assetsDetails: new HTMLField({ initial: '' })
      }),
      development: new SchemaField({
        personal: new NumberField({ nullable: true, initial: null }),
        occupation: new NumberField({ nullable: true, initial: null }),
        archetype: new NumberField({ nullable: true, initial: null }),
        experiencePackage: new NumberField({ nullable: true, initial: null })
      }),
      biography: new ArrayField(new ObjectField(), { initial: [] }),
      sanityLossEvents: new ArrayField(new ObjectField(), { initial: [] }),
      backstory: new HTMLField({ initial: '' }),
      indefiniteInsanityLevel: new SchemaField({
        value: new NumberField({ integer: true, initial: 0 }),
        max: new NumberField({ integer: true, initial: 0 })
      }),
      description: new SchemaField({ keeper: new HTMLField({ initial: '' }) }),
      notes: new HTMLField({ initial: '' }),
      flags: new ObjectField({ initial: { locked: true, manualCredit: false } })
    }
  }

  /** @override */
  static migrateData(source) {
    // Migration for the old sanity loss "oneFifthSanity" field
    if (source.attribs?.san?.oneFifthSanity) {
      delete source.attribs.san.oneFifthSanity
    }
    // Migration for old credit structure
    if (source.credit?.multiplier) {
      if (!source.monetary) source.monetary = {}
      source.monetary.symbol = source.credit.monetarySymbol || '$'
      source.monetary.spent = source.credit.spent
      source.monetary.assetsDetails = source.credit.assetsDetails
      delete source.credit
    }
    return super.migrateData(source)
  }
}
