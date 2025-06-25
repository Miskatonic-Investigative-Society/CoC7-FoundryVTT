const { SchemaField, StringField, BooleanField, HTMLField } = foundry.data.fields

export class SpellData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      castingTime: new StringField({ initial: '' }),
      costs: new SchemaField({
        hitPoints: new StringField({ initial: '0' }),
        magicPoints: new StringField({ initial: '0' }),
        others: new StringField({ initial: '' }),
        sanity: new StringField({ initial: '0' }),
        power: new StringField({ initial: '0' })
      }),
      description: new SchemaField({
        chat: new HTMLField({ initial: '' }),
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' }),
        alternativeNames: new HTMLField({ initial: '' })
      }),
      source: new StringField({ initial: '' }),
      learned: new BooleanField({ initial: false }),
      type: new SchemaField({
        bind: new BooleanField({ initial: false }),
        call: new BooleanField({ initial: false }),
        combat: new BooleanField({ initial: false }),
        contact: new BooleanField({ initial: false }),
        dismiss: new BooleanField({ initial: false }),
        enchantment: new BooleanField({ initial: false }),
        gate: new BooleanField({ initial: false }),
        summon: new BooleanField({ initial: false })
      })
    }
  }
}
