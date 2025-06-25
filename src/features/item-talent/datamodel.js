const { SchemaField, StringField, BooleanField, HTMLField } = foundry.data.fields

export class TalentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: new StringField({ nullable: true, initial: null }),
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        chat: new HTMLField({ initial: '' }),
        notes: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      type: new SchemaField({
        physical: new BooleanField({ initial: false }),
        mental: new BooleanField({ initial: false }),
        combat: new BooleanField({ initial: false }),
        miscellaneous: new BooleanField({ initial: false }),
        basic: new BooleanField({ initial: false }),
        insane: new BooleanField({ initial: false }),
        other: new BooleanField({ initial: false })
      })
    }
  }
}
