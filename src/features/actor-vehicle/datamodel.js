const { SchemaField, StringField, NumberField, ArrayField, ObjectField, BooleanField, HTMLField } = foundry.data.fields

export class VehicleData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attribs: new SchemaField({
        build: new SchemaField({
          value: new NumberField({ nullable: true, initial: null }),
          current: new NumberField({ nullable: true, initial: null })
        }),
        mov: new SchemaField({
          value: new NumberField({ nullable: true, initial: null })
        }),
        armor: new SchemaField({
          value: new StringField({ nullable: true, initial: null }),
          localized: new BooleanField({ initial: false }),
          locations: new ArrayField(new ObjectField(), { initial: [] })
        })
      }),
      
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        chat: new HTMLField({ initial: '' }),
        notes: new HTMLField({ initial: '' })
      }),
      
      infos: new SchemaField({
        origin: new StringField({ nullable: true, initial: null }),
        type: new StringField({ nullable: true, initial: null })
      }),
      
      crew: new SchemaField({
        total: new NumberField({ nullable: true, initial: null }),
        count: new SchemaField({
          driver: new NumberField({ nullable: true, initial: null }),
          gunner: new NumberField({ nullable: true, initial: null }),
          pax: new NumberField({ nullable: true, initial: null })
        }),
        list: new ArrayField(new ObjectField(), { initial: [] })
      }),
      
      skill: new SchemaField({ // Habilidad necesaria para operarlo
        driving: new StringField({ nullable: true, initial: null }),
        active: new ArrayField(new StringField(), { initial: [] })
      }),
      
      properties: new SchemaField({
        armed: new BooleanField({ initial: false })
      })
    }
  }
}
