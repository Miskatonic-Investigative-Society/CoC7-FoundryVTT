const { SchemaField, StringField, NumberField, ArrayField, ObjectField, BooleanField, HTMLField } = foundry.data.fields

export class CreatureData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const PoolResourceSchema = () => new SchemaField({
      value: new NumberField({ nullable: true, initial: null, integer: true }),
      max: new NumberField({ nullable: true, initial: null, integer: true }),
      auto: new BooleanField({ initial: true })
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
      biography: new SchemaField({
        personalDescription: new SchemaField({
          value: new HTMLField({ initial: '' })
        })
      }),
      description: new SchemaField({
        keeper: new HTMLField({ initial: '' })
      }),
      special: new SchemaField({
        sanLoss: new SchemaField({
          checkPassed: new StringField({ nullable: true, initial: null }),
          checkFailled: new StringField({ nullable: true, initial: null })
        }),
        attacksPerRound: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
        movement: new ArrayField(new ObjectField(), { initial: [] }), // Campo actualizado
        macros: new ArrayField(new ObjectField(), { initial: [] })
      }),
      infos: new SchemaField({
        type: new StringField({ nullable: true, initial: null })
      }),
      flags: new ObjectField({ initial: { locked: false, displayFormula: false } })
    }
  }

  /** @override */
  static migrateData(source) {
    // Migration for the old "special.attribs.move"
    if (source.special?.attribs?.move) {
      const movement = source.special.movement || []
      if (source.special.attribs.move.primary?.enabled && source.special.attribs.move.primary?.value) {
        movement.push({
          type: source.special.attribs.move.primary.type || 'walk',
          value: source.special.attribs.move.primary.value
        })
      }
      if (source.special.attribs.move.secondary?.enabled && source.special.attribs.move.secondary?.value) {
        movement.push({
          type: source.special.attribs.move.secondary.type || 'fly',
          value: source.special.attribs.move.secondary.value
        })
      }
      source.special.movement = movement
      delete source.special.attribs
    }
    return super.migrateData(source)
  }
}
