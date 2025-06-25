const { SchemaField, NumberField, ObjectField, HTMLField } = foundry.data.fields

export class GenericItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      quantity: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      weight: new NumberField({ required: true, min: 0, initial: 0 }),
      price: new ObjectField({ initial: {} }),
      attributes: new ObjectField({ initial: {} })
    }
  }
}
