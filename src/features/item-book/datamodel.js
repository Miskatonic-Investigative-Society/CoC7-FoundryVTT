const { SchemaField, StringField, NumberField, ArrayField, ObjectField, BooleanField, HTMLField } = foundry.data.fields

export class BookData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      author: new StringField({ initial: '' }),
      content: new HTMLField({ initial: '' }),
      date: new StringField({ initial: '' }),
      description: new SchemaField({
        chat: new StringField({ initial: '' }),
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      difficultyLevel: new StringField({ initial: 'regular' }),
      fullStudies: new NumberField({ integer: true, min: 0, initial: 0 }),
      gains: new SchemaField({
        cthulhuMythos: new SchemaField({
          final: new NumberField({ integer: true, min: 0, initial: 0 }),
          initial: new NumberField({ integer: true, min: 0, initial: 0 })
        }),
        occult: new NumberField({ integer: true, min: 0, initial: 0 }),
        others: new ArrayField(new ObjectField(), { initial: [] })
      }),
      initialReading: new BooleanField({ initial: false }),
      language: new StringField({ initial: '' }),
      mythosRating: new NumberField({ integer: true, min: 0, initial: 0 }),
      sanityLoss: new StringField({ initial: '0' }),
      spells: new ArrayField(new StringField(), { initial: [] }),
      study: new SchemaField({
        necessary: new NumberField({ integer: true, min: 0, initial: 0 }),
        progress: new NumberField({ integer: true, min: 0, initial: 0 }),
        units: new StringField({ initial: 'CoC7.weeks' })
      }),
      type: new SchemaField({
        mythos: new BooleanField({ initial: false }),
        occult: new BooleanField({ initial: false }),
        other: new BooleanField({ initial: false })
      })
    }
  }
}
