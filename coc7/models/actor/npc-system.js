/* global CONFIG foundry */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorCharacterSystem from './character-system.js'
import CoC7ModelsActorGlobalSystem from './global-system.js'

export default class CoC7ModelsActorNPCSystem extends CoC7ModelsActorGlobalSystem {
  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      characteristics: CoC7ModelsActorCharacterSystem.defineSchemaCharacteristics(),
      attribs: CoC7ModelsActorCharacterSystem.defineSchemaAttribs(),
      conditions: CoC7ModelsActorCharacterSystem.defineSchemaConditions(),
      books: CoC7ModelsActorCharacterSystem.defineSchemaBooks(),
      biography: new fields.SchemaField({
        personalDescription: new fields.SchemaField({
          value: new fields.HTMLField({ initial: '' })
        })
      }),
      description: new fields.SchemaField({
        keeper: new fields.HTMLField({ initial: '' })
      }),
      special: new fields.SchemaField({
        sanLoss: new fields.SchemaField({
          checkPassed: new fields.StringField({ nullable: true, initial: null }),
          checkFailled: new fields.StringField({ nullable: true, initial: null })
        }),
        attacksPerRound: new fields.StringField({ initial: '1' }),
        movement: new fields.ArrayField(
          new fields.SchemaField({
            value: new fields.NumberField({ initial: 0 }),
            type: new fields.StringField({
              choices: Object.keys(CONFIG.Token.movement.actions),
              initial: 'walk'
            })
          })
        ),
        macros: new fields.ArrayField(
          new fields.SchemaField({
            uuid: new fields.DocumentUUIDField({ initial: undefined })
          })
        )
      }),
      infos: new fields.SchemaField({
        type: new fields.StringField({ initial: '' }),
        occupation: new fields.StringField({ initial: '' }),
        organization: new fields.StringField({ initial: '' }),
        age: new fields.StringField({ initial: '' })
      }),
      flags: new fields.SchemaField({
        locked: new fields.BooleanField({ initial: false }),
        displayFormula: new fields.BooleanField({ initial: false }),
        panelSkills: new fields.BooleanField({ initial: true }),
        panelCombat: new fields.BooleanField({ initial: true }),
        panelInventory: new fields.BooleanField({ initial: true }),
        panelInventoryItems: new fields.BooleanField({ initial: true }),
        panelInventoryBooks: new fields.BooleanField({ initial: true }),
        panelInventorySpells: new fields.BooleanField({ initial: true }),
        panelInventoryTalents: new fields.BooleanField({ initial: true }),
        panelInventoryWeapons: new fields.BooleanField({ initial: true }),
        panelInventoryArmor: new fields.BooleanField({ initial: true }),
        panelInventoryStatuses: new fields.BooleanField({ initial: true }),
        panelNotes: new fields.BooleanField({ initial: true }),
        panelMacros: new fields.BooleanField({ initial: true }),
        panelEffects: new fields.BooleanField({ initial: false }),
        panelKeeper: new fields.BooleanField({ initial: false })
      })
    }
  }

  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/cultist.svg'
  }
}
