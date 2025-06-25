const { SchemaField, StringField, NumberField, ObjectField, HTMLField } = foundry.data.fields

export class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        chat: new HTMLField({ initial: '' }),
        special: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      wpnType: new StringField({ initial: '' }),
      skill: new SchemaField({
        main: new SchemaField({
          name: new StringField({ initial: '' }),
          id: new StringField({ initial: '' })
        }),
        alternativ: new SchemaField({
          name: new StringField({ initial: '' }),
          id: new StringField({ initial: '' })
        })
      }),
      range: new SchemaField({
        normal: new SchemaField({
          value: new StringField({ initial: '0' }),
          units: new StringField({ initial: '' }),
          damage: new StringField({ initial: '' })
        }),
        long: new SchemaField({
          value: new StringField({ initial: '0' }),
          units: new StringField({ initial: '' }),
          damage: new StringField({ initial: '' })
        }),
        extreme: new SchemaField({
          value: new StringField({ initial: '0' }),
          units: new StringField({ initial: '' }),
          damage: new StringField({ initial: '' })
        })
      }),
      usesPerRound: new SchemaField({
        normal: new NumberField({ required: true, integer: true, initial: 1 }),
        max: new NumberField({ nullable: true, initial: null }),
        burst: new NumberField({ nullable: true, initial: null })
      }),
      bullets: new NumberField({ nullable: true, initial: null }),
      ammo: new NumberField({ required: true, integer: true, initial: 0 }),
      malfunction: new NumberField({ nullable: true, initial: null }),
      blastRadius: new StringField({ nullable: true, initial: null }),
      properties: new ObjectField({ initial: {} }),
      price: new ObjectField({ initial: {} })
    }
  }
}
