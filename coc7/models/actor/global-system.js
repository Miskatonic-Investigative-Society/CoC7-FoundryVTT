/* global CONFIG foundry */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorDocumentClass from './document-class.js'
import CoC7StringField from '../fields/string-field.js'

export default class CoC7ModelsActorGlobalSystem extends foundry.abstract.TypeDataModel {
  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchemaAttribs () {
    const fields = foundry.data.fields
    return new fields.SchemaField({
      hp: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null }),
        max: new fields.NumberField({ nullable: true, initial: null }),
        auto: new fields.BooleanField({ initial: true })
      }, {
        label: 'CoC7.HP',
        hint: 'CoC7.HitPoints'
      }),
      mp: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null }),
        max: new fields.NumberField({ nullable: true, initial: null }),
        auto: new fields.BooleanField({ initial: true })
      }, {
        label: 'CoC7.MP',
        hint: 'CoC7.MagicPoints'
      }),
      lck: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CoC7.Lck',
        hint: 'CoC7.Luck'
      }),
      san: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null }),
        max: new fields.NumberField({ initial: 99 }),
        dailyLoss: new fields.NumberField({ initial: 0 }),
        dailyLimit: new fields.NumberField({ initial: 0 }),
        auto: new fields.BooleanField({ initial: true })
      }, {
        label: 'CoC7.SAN',
        hint: 'CoC7.Sanity'
      }),
      mov: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null }),
        auto: new fields.BooleanField({ initial: true }),
        type: new fields.StringField({
          choices: Object.keys(CONFIG.Token.movement.actions),
          initial: 'walk'
        })
      }, {
        label: 'CoC7.Mov',
        hint: 'CoC7.Movement'
      }),
      db: new fields.SchemaField({
        value: new CoC7StringField({ nullable: true, initial: null }),
        auto: new fields.BooleanField({ initial: true })
      }, {
        label: 'CoC7.DB',
        hint: 'CoC7.BonusDamage'
      }),
      build: new fields.SchemaField({
        value: new fields.NumberField({ nullable: true, initial: null }),
        auto: new fields.BooleanField({ initial: true })
      }, {
        label: 'CoC7.Build',
        hint: 'CoC7.Build'
      }),
      armor: new fields.SchemaField({
        notes: new fields.BooleanField({ initial: false }),
        value: new CoC7StringField({ nullable: true, initial: null })
      }, {
        label: 'CoC7.Armor',
        hint: 'CoC7.Armor'
      })
    })
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchemaBooks () {
    const fields = foundry.data.fields
    return new fields.ArrayField(
      new fields.SchemaField({
        id: new fields.StringField({
          validate: value => {
            if (!foundry.data.validators.isValidId(value)) {
              throw new Error('must be a valid 16-character alphanumeric ID')
            }
          }
        }),
        cocid: new fields.StringField({ localize: false }),
        name: new fields.StringField({ localize: false }),
        initialReading: new fields.BooleanField({ initial: false }),
        fullStudies: new fields.NumberField({ nullable: false, initial: 0 }),
        necessary: new fields.NumberField({ initial: 0 }),
        progress: new fields.NumberField({ initial: 0 }),
        units: new fields.StringField({ initial: 'CoC7.weeks' }),
        spellsLearned: new fields.ArrayField(
          new fields.StringField({
            validate: value => {
              if (!foundry.data.validators.isValidId(value)) {
                throw new Error('must be a valid 16-character alphanumeric ID')
              }
            }
          })
        )
      })
    )
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchemaCharacteristics () {
    const fields = foundry.data.fields
    return new fields.SchemaField({
      str: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.STR',
        hint: 'CHARAC.Strength'
      }),
      con: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.CON',
        hint: 'CHARAC.Constitution'
      }),
      siz: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.SIZ',
        hint: 'CHARAC.Size'
      }),
      dex: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.DEX',
        hint: 'CHARAC.Dexterity'
      }),
      app: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.APP',
        hint: 'CHARAC.Appearance'
      }),
      int: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.INT',
        hint: 'CHARAC.Intelligence'
      }),
      pow: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.POW',
        hint: 'CHARAC.Power'
      }),
      edu: new fields.SchemaField({
        formula: new fields.StringField({ initial: '' }),
        value: new fields.NumberField({ nullable: true, initial: null })
      }, {
        label: 'CHARAC.EDU',
        hint: 'CHARAC.Education'
      })
    })
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchemaConditions () {
    const fields = foundry.data.fields
    return new fields.SchemaField({
      criticalWounds: new fields.SchemaField({
        value: new fields.BooleanField({ initial: false })
      }),
      unconscious: new fields.SchemaField({
        value: new fields.BooleanField({ initial: false })
      }),
      dying: new fields.SchemaField({
        value: new fields.BooleanField({ initial: false })
      }),
      dead: new fields.SchemaField({
        value: new fields.BooleanField({ initial: false })
      }),
      prone: new fields.SchemaField({
        value: new fields.BooleanField({ initial: false })
      }),
      tempoInsane: new fields.SchemaField({
        value: new fields.BooleanField({ initial: false }),
        realTime: new fields.BooleanField({ initial: false }),
        duration: new fields.NumberField({ initial: 0 })
      }),
      indefInsane: new fields.SchemaField({
        value: new fields.BooleanField({ initial: false })
      })
    })
  }

  /**
   * @inheritdoc
   */
  prepareBaseData () {
    super.prepareBaseData()

    if (typeof this.attribs !== 'undefined' && typeof this.characteristics !== 'undefined') {
      if (this.attribs.build.auto) {
        this.attribs.build.value = CoC7ModelsActorDocumentClass.buildFromCharacteristics(this.characteristics)
      }
      if (this.attribs.db.auto) {
        this.attribs.db.value = CoC7ModelsActorDocumentClass.dbFromCharacteristics(this.characteristics)
      }
      if (this.attribs.hp.auto) {
        const maxValue = (this.attribs.hp.value === this.attribs.hp.max)
        this.attribs.hp.max = CoC7ModelsActorDocumentClass.hpFromCharacteristics(this.characteristics, this.parent.type)
        if (maxValue) {
          this.attribs.hp.value = this.attribs.hp.max
        }
      }
      if (this.attribs.mov.auto) {
        this.attribs.mov.value = CoC7ModelsActorDocumentClass.movFromCharacteristics(this.characteristics, this.parent.type, this.infos.age)
      }
      if (this.attribs.mp.auto) {
        const maxValue = (this.attribs.mp.value === this.attribs.mp.max)
        this.attribs.mp.max = CoC7ModelsActorDocumentClass.mpFromCharacteristics(this.characteristics, this.parent.type)
        if (maxValue) {
          this.attribs.mp.value = this.attribs.mp.max
        }
      }
    }
  }

  /**
   * @inheritdoc
   */
  prepareDerivedData () {
    super.prepareDerivedData()

    if (typeof this.attribs !== 'undefined' && typeof this.characteristics !== 'undefined') {
      // If Active Effects has altered the derived values since prepareBaseData don't replacement
      const overrides = foundry.utils.flattenObject(this.parent.overrides)

      if (this.attribs.build.auto && typeof overrides['system.attribs.build.value'] === 'undefined') {
        this.attribs.build.value = CoC7ModelsActorDocumentClass.buildFromCharacteristics(this.characteristics)
      }
      if (this.attribs.db.auto && typeof overrides['system.attribs.db.value'] === 'undefined') {
        this.attribs.db.value = CoC7ModelsActorDocumentClass.dbFromCharacteristics(this.characteristics)
      }
      if (this.attribs.hp.auto && typeof overrides['system.attribs.db.max'] === 'undefined') {
        const maxValue = (this.attribs.hp.value === this.attribs.hp.max)
        this.attribs.hp.max = CoC7ModelsActorDocumentClass.hpFromCharacteristics(this.characteristics, this.parent.type)
        if (maxValue) {
          this.attribs.hp.value = this.attribs.hp.max
        }
      }
      if (this.attribs.hp.max && this.attribs.hp.max < this.attribs.hp.value) {
        this.attribs.hp.value = this.attribs.hp.max
      }
      if (this.attribs.mov.auto && typeof overrides['system.attribs.mov.value'] === 'undefined') {
        this.attribs.mov.value = CoC7ModelsActorDocumentClass.movFromCharacteristics(this.characteristics, this.parent.type, this.infos.age)
      }
      if (this.attribs.mp.auto && typeof overrides['system.attribs.mp.max'] === 'undefined') {
        const maxValue = (this.attribs.mp.value === this.attribs.mp.max)
        this.attribs.mp.max = CoC7ModelsActorDocumentClass.mpFromCharacteristics(this.characteristics, this.parent.type)
        if (maxValue) {
          this.attribs.mp.value = this.attribs.mp.max
        }
      }
      if (this.attribs.mp.max && this.attribs.mp.max < this.attribs.mp.value) {
        this.attribs.mp.value = this.attribs.mp.max
      }
      if (this.attribs.san.auto) {
        const maxValue = (this.attribs.san.value === this.attribs.san.max)
        this.attribs.san.max = this.parent.sanityMaximum()
        if (maxValue) {
          this.attribs.san.value = this.attribs.san.max
        }
      }
      if (this.attribs.san.max && this.attribs.san.max < this.attribs.san.value) {
        this.attribs.san.value = this.attribs.san.max
      }
    }
  }

  /**
   * Find this book data on Actor
   * @param {Document} document
   * @returns {object}
   */
  getBook (document) {
    return this.books.find(field => field.id === document.id || field.cocid === (document.flags[FOLDER_ID]?.cocidFlag?.id ?? ''))
  }

  /**
   * Update/add book to Actor
   * @param {Document} document
   * @param {object} updates
   */
  async updateBook (document, updates) {
    const books = foundry.utils.duplicate(this.books)
    let offset = books.findIndex(field => field.id === document.id || field.cocid === (document.flags[FOLDER_ID]?.cocidFlag?.id ?? ''))
    if (offset === -1) {
      const book = foundry.utils.mergeObject({
        id: document.id,
        cocid: (document.flags[FOLDER_ID]?.cocidFlag?.id ?? ''),
        name: document.name,
        initialReading: false,
        fullStudies: 0,
        necessary: document.system.study.necessary,
        progress: 0,
        units: document.system.study.units,
        spellsLearned: []
      }, updates)
      offset = books.length
      books.push(book)
    } else {
      foundry.utils.mergeObject(books[offset], updates)
    }
    if (books[offset].progress >= books[offset].necessary) {
      books[offset].progress = books[offset].necessary
      books[offset].fullStudies++
      // Grant Full Study
      if (document.system.type.mythos && document.system.mythosRating > 0) {
        if ((await document.system.checkExhaustion()) === false) {
          const cthulhuMythosSkill = this.parent.cthulhuMythosSkill
          if (cthulhuMythosSkill) {
            const mythosIncrease = Math.min(document.system.mythosRating, cthulhuMythosSkill.system.value + document.system.gains.cthulhuMythos.final) - cthulhuMythosSkill.system.value
            if (mythosIncrease > 0) {
              const developments = [{
                name: cthulhuMythosSkill.name,
                gain: mythosIncrease
              },
              {
                name: document.system.language,
                gain: 'development'
              }]
              await document.system.grantSkillDevelopment(developments)
              await document.system.rollSanityLoss()
            }
          }
        }
      }
    }
    await this.parent.update({ 'system.books': books })
  }
}
