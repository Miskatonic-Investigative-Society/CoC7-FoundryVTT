const { SchemaField, StringField, NumberField, ArrayField, BooleanField, HTMLField } = foundry.data.fields

export class ArchetypeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      source: new StringField({ nullable: true, initial: null }),
      bonusPoints: new NumberField({ required: true, integer: true, min: 0, initial: 100 }),
      coreCharacteristics: new SchemaField({
        str: new BooleanField({ initial: false }),
        con: new BooleanField({ initial: false }),
        siz: new BooleanField({ initial: false }),
        dex: new BooleanField({ initial: false }),
        app: new BooleanField({ initial: false }),
        int: new BooleanField({ initial: false }),
        pow: new BooleanField({ initial: false }),
        edu: new BooleanField({ initial: false })
      }),
      coreCharacteristicsFormula: new SchemaField({
        enabled: new BooleanField({ initial: true }),
        value: new StringField({ initial: '(1D6+13)*5' })
      }),
      suggestedOccupations: new HTMLField({ initial: '' }),
      suggestedTraits: new HTMLField({ initial: '' }),
      talents: new NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      skills: new ArrayField(new StringField(), { initial: [] })
    }
  }
}
