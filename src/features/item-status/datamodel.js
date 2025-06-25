const { SchemaField, StringField, BooleanField, NumberField, HTMLField } = foundry.data.fields

export class StatusData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      active: new BooleanField({ initial: false }),
      source: new StringField({ nullable: true, initial: null }),
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        chat: new HTMLField({ initial: '' }),
        notes: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      duration: new SchemaField({
        permanent: new BooleanField({ initial: true }),
        hours: new NumberField({ nullable: true, initial: null }),
        minutes: new NumberField({ nullable: true, initial: null }),
        rounds: new NumberField({ nullable: true, initial: null })
      }),
      type: new SchemaField({
        mania: new BooleanField({ initial: false }),
        phobia: new BooleanField({ initial: false })
      })
    }
  }
}
