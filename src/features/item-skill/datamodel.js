const {
  SchemaField,
  StringField,
  NumberField,
  BooleanField,
  HTMLField
} = foundry.data.fields
import { CoC7Utilities } from '../../shared/utilities.js'

/**
 * DataModel for Items of type 'skill'.
 * Defines the schema for `item.system`.
 */
export class SkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // Skill name without specialization. Ex: "Fighting"
      skillName: new StringField({ required: true, blank: false, initial: '' }),

      // Specialization name. Ex: "Brawl"
      specialization: new StringField({ required: true, blank: true, initial: '' }),

      // Description and Keeper notes
      description: new SchemaField({
        value: new HTMLField({ initial: '' }),
        opposingDifficulty: new StringField({ initial: '' }),
        pushedFaillureConsequences: new StringField({ initial: '' }),
        chat: new StringField({ initial: '' }),
        keeper: new HTMLField({ initial: '' })
      }),

      // Base value of the skill. Can be a number or formula like "@EDU".
      // We use StringField to allow formulas. Calculation logic will be in the document class.
      base: new StringField({ required: true, blank: false, initial: '0' }),

      // Bonus/penalty dice modifier.
      bonusDice: new NumberField({ required: true, integer: true, initial: 0 }),

      // Skill point adjustments from different sources.
      adjustments: new SchemaField({
        personal: new NumberField({ required: true, integer: true, nullable: true, initial: null }),
        occupation: new NumberField({ required: true, integer: true, nullable: true, initial: null }),
        archetype: new NumberField({ required: true, integer: true, nullable: true, initial: null }),
        experiencePackage: new NumberField({ required: true, integer: true, nullable: true, initial: null }),
        experience: new NumberField({ required: true, integer: true, nullable: true, initial: null })
      }),

      // Legacy value field for compatibility
      value: new NumberField({ integer: true, initial: -1 }),

      // Boolean properties of the skill.
      properties: new SchemaField({
        noadjustments: new BooleanField({ initial: false }),
        noxpgain: new BooleanField({ initial: false }),
        special: new BooleanField({ initial: false }),
        rarity: new BooleanField({ initial: false }),
        push: new BooleanField({ initial: true }),
        combat: new BooleanField({ initial: false }),
        fighting: new BooleanField({ initial: false }),
        firearm: new BooleanField({ initial: false }),
        ranged: new BooleanField({ initial: false }),
        requiresname: new BooleanField({ initial: false }),
        keepbasevalue: new BooleanField({ initial: false }),
        picknameonly: new BooleanField({ initial: false }),
        onlyone: new BooleanField({ initial: false })
      }),

      // Flags for character sheet state (e.g. marked for development)
      // Keep this within `system` and not in top-level `flags`.
      flags: new SchemaField({
        developement: new BooleanField({ initial: false }),
        occupation: new BooleanField({ initial: false }),
        archetype: new BooleanField({ initial: false }),
        experiencePackage: new BooleanField({ initial: false })
      })
    }
  }

  /**
   * Migra los datos de formatos antiguos.
   * Esto reemplaza la lógica del constructor personalizado.
   */
  static migrateData(source) {
    if (typeof source.skillName === 'undefined' || source.skillName === '') {
      const { name, skillName, specialization, ...newProperties } = CoC7Utilities.guessSkillNameParts(source.name)
      source.name = name
      source.skillName = skillName
      source.specialization = specialization
      source.properties = { ...source.properties, ...newProperties }
    }
    return super.migrateData(source)
  }
}
