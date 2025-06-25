const { SchemaField, StringField, NumberField, ObjectField, ArrayField, BooleanField, HTMLField } = foundry.data.fields

const OccupationSkillPointsSchema = () => new SchemaField({
  multiplier: new NumberField({ nullable: true, initial: null }),
  selected: new BooleanField({ initial: false }),
  optional: new BooleanField({ initial: false }),
  active: new BooleanField({ initial: false })
})

export class OccupationData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),
      source: new StringField({ nullable: true, initial: null }),
      type: new SchemaField({
        classic: new BooleanField({ initial: false }),
        lovecraftian: new BooleanField({ initial: false }),
        modern: new BooleanField({ initial: false }),
        pulp: new BooleanField({ initial: false })
      }),
      related: new StringField({ nullable: true, initial: null }),
      occupationSkillPoints: new SchemaField({
        str: OccupationSkillPointsSchema(),
        con: OccupationSkillPointsSchema(),
        siz: OccupationSkillPointsSchema(),
        dex: OccupationSkillPointsSchema(),
        app: OccupationSkillPointsSchema(),
        int: OccupationSkillPointsSchema(),
        pow: OccupationSkillPointsSchema(),
        edu: OccupationSkillPointsSchema()
      }),
      creditRating: new SchemaField({
        min: new NumberField({ nullable: true, initial: null }),
        max: new NumberField({ nullable: true, initial: null })
      }),
      suggestedContacts: new StringField({ initial: '' }),
      skills: new ArrayField(new StringField(), { initial: [] }),
      groups: new ArrayField(new ObjectField(), { initial: [] }),
      personal: new NumberField({ nullable: true, initial: null }),
      personalText: new StringField({ initial: '' })
    }
  }
}
