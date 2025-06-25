const { SchemaField, BooleanField, HTMLField } = foundry.data.fields

export class ContainerData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      flags: new SchemaField({
        locked: new BooleanField({ initial: false })
      })
    }
  }
}