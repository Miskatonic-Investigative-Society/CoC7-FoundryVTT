const { SchemaField, StringField, NumberField, ArrayField, BooleanField, HTMLField, ObjectField } = foundry.data.fields

export class ExperiencePackageData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      age: new StringField({ initial: '' }),
      properties: new SchemaField({
        cthulhuGain: new BooleanField({ initial: false }),
        sanityLoss: new BooleanField({ initial: false }),
        sanitySame: new BooleanField({ initial: false })
      }),
      cthulhuGain: new StringField({ initial: '' }),
      sanityLoss: new StringField({ initial: '' }),
      backgroundQty: new NumberField({ integer: true, min: 0, initial: 1 }),
      backgroundInjury: new BooleanField({ initial: false }),
      backgroundStatus: new BooleanField({ initial: false }),
      backgroundEncounter: new BooleanField({ initial: false }),
      immunity: new ArrayField(new StringField(), { initial: [] }),
      addSpells: new BooleanField({ initial: false }),
      points: new NumberField({ integer: true, min: 0, initial: 0 }),
      skills: new ArrayField(new StringField(), { initial: [] }),
      groups: new ArrayField(new ObjectField(), { initial: [] })
    }
  }
}
