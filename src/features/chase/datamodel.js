const { SchemaField, NumberField, ArrayField, ObjectField, BooleanField, HTMLField } = foundry.data.fields

export class ChaseData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        keeper: new HTMLField({ initial: '' })
      }),
      locations: new SchemaField({
        total: new NumberField({ integer: true, min: 0, initial: 0 }),
        startingRange: new NumberField({ integer: true, min: 0, initial: 1 }),
        list: new ArrayField(new ObjectField(), { initial: [] })
      }),
      includeEscaped: new BooleanField({ initial: false }),
      includeLatecomers: new BooleanField({ initial: false }),
      showTokenMovement: new BooleanField({ initial: true }),
      startingRange: new NumberField({ integer: true, min: 0, initial: 2 }),
      startingIndex: new NumberField({ integer: true, initial: 0 }),
      started: new BooleanField({ initial: false }),
      vehicle: new BooleanField({ initial: false }),
      participants: new ArrayField(new ObjectField(), { initial: [] })
    }
  }
}
