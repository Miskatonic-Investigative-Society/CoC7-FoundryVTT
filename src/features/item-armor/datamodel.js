const { SchemaField, HTMLField } = foundry.data.fields

export class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      })
    }
  }
}
