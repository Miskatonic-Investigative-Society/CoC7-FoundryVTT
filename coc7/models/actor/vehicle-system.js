/* global foundry */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorGlobalSystem from './global-system.js'

export default class CoC7ModelsActorVehicleSystem extends CoC7ModelsActorGlobalSystem {
  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      infos: new fields.SchemaField({
        type: new fields.StringField({ initial: '' }),
        origin: new fields.StringField({ initial: '' })
      }),
      description: new fields.SchemaField({
        value: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' })
      }),
      crew: new fields.SchemaField({
        total: new fields.StringField({ initial: '' }),
        count: new fields.SchemaField({
        })
      }),
      properties: new fields.SchemaField({
        armed: new fields.BooleanField({ initial: false })
      }),
      stats: new fields.SchemaField({
        hp: new fields.NumberField({ nullable: true, initial: null }),
        mov: new fields.NumberField({ nullable: true, initial: null }),
        build: new fields.SchemaField({
          value: new fields.NumberField({ nullable: true, initial: null }),
          current: new fields.NumberField({ nullable: true, initial: null })
        }),
        armor: new fields.SchemaField({
          value: new fields.NumberField({ nullable: true, initial: null }),
          localized: new fields.BooleanField({ initial: false }),
          locations: new fields.ArrayField(
            new fields.SchemaField({
              name: new fields.StringField({ initial: '' }),
              value: new fields.StringField({ initial: '' })
            })
          )
        })
      })
    }
  }

  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/jeep.svg'
  }
}
