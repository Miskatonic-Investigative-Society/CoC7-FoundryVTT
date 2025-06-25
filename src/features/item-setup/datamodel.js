const { SchemaField, StringField, NumberField, ArrayField, BooleanField, ObjectField, HTMLField } = foundry.data.fields

export class SetupData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      characteristics: new SchemaField({
        points: new SchemaField({
          enabled: new BooleanField({ initial: false }),
          value: new NumberField({ integer: true, initial: 460 })
        }),
        rolls: new SchemaField({
          enabled: new BooleanField({ initial: true }),
          enableIndividualRolls: new BooleanField({ initial: true }),
          str: new StringField({ initial: '(3D6)*5' }),
          con: new StringField({ initial: '(3D6)*5' }),
          siz: new StringField({ initial: '(2D6+6)*5' }),
          dex: new StringField({ initial: '(3D6)*5' }),
          app: new StringField({ initial: '(3D6)*5' }),
          int: new StringField({ initial: '(2D6+6)*5' }),
          pow: new StringField({ initial: '(3D6)*5' }),
          edu: new StringField({ initial: '(2D6+6)*5' }),
          luck: new StringField({ initial: '(3D6)*5' })
        })
      }),
      monetary: new SchemaField({
        format: new StringField({ initial: 'decimalLeft' }),
        symbol: new StringField({ initial: '$' }),
        values: new ArrayField(new ObjectField(), { initial: [] })
      }),
      source: new StringField({ nullable: true, initial: null }),
      enableCharacterisitics: new BooleanField({ initial: true }),
      items: new ArrayField(new StringField(), { initial: [] }), // Array de CoCIDs o UUIDs
      bioSections: new ArrayField(new StringField(), { initial: [] }),
      backstory: new HTMLField({ initial: '' })
    }
  }
}
