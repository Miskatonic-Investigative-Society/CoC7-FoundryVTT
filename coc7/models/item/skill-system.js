/* global CONFIG foundry game */
import { FOLDER_ID, FIGHTING_NAMES } from '../../constants.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'
import CoC7Utilities from '../../apps/utilities.js'
import deprecated from '../../deprecated.js'

export default class CoC7ModelsItemSkillSystem extends CoC7ModelsItemGlobalSystem {
  #bonusDice
  #value

  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/skills.svg'
  }

  /**
   * Return icon to use for languages
   * @returns {string}
   */
  static get iconLanguage () {
    return 'systems/' + FOLDER_ID + '/assets/icons/skills/language.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      skillName: new fields.StringField({ initial: '' }),
      specialization: new fields.StringField({ initial: '' }),
      description: new fields.SchemaField({
        value: new fields.HTMLField({ initial: '' }),
        /* // FoundryVTT V13 - not required
        opposingDifficulty: '',
        pushedFaillureConsequences: '', // cspell:disable-line
        chat: '',
        */
        keeper: new fields.HTMLField({ initial: '' })
      }),
      base: new fields.StringField({ initial: '' }),
      /* // FoundryVTT V13 - not required
      bonusDice: 0,
      value: -1,
      attributes: {},
      */
      adjustments: new fields.SchemaField({
        base: new fields.NumberField({ nullable: false, initial: 0 }),
        personal: new fields.NumberField({ nullable: false, initial: 0 }),
        occupation: new fields.NumberField({ nullable: false, initial: 0 }),
        archetype: new fields.NumberField({ nullable: false, initial: 0 }),
        experiencePackage: new fields.NumberField({ nullable: false, initial: 0 }),
        experience: new fields.NumberField({ nullable: false, initial: 0 })
      }),
      properties: new fields.SchemaField({
        noxpgain: new fields.BooleanField({ label: 'CoC7.SkillNoXpGain', hint: 'CoC7.SkillHintNoXpGain', initial: false }),
        special: new fields.BooleanField({ label: 'CoC7.SkillSpecial', initial: false }),
        rarity: new fields.BooleanField({ label: 'CoC7.SkillRarity', initial: false }),
        push: new fields.BooleanField({ label: 'CoC7.SkillPush', hint: 'CoC7.SkillHintPush', initial: false }),
        fighting: new fields.BooleanField({ label: 'CoC7.SkillFighting', hint: 'CoC7.SkillHintFighting', initial: false }),
        firearm: new fields.BooleanField({ label: 'CoC7.SkillFirearm', hint: 'CoC7.SkillHintFirearm', initial: false }),
        ranged: new fields.BooleanField({ label: 'CoC7.SkillRanged', hint: 'CoC7.SkillHintRanged', initial: false }),
        requiresname: new fields.BooleanField({ label: 'CoC7.SkillRequiresName', hint: 'CoC7.SkillHintRequiresName', initial: false }),
        picknameonly: new fields.BooleanField({ label: 'CoC7.SkillPickNameOnly', hint: 'CoC7.SkillHintPickNameOnly', initial: false }),
        own: new fields.BooleanField({ label: 'CoC7.SkillOwn', hint: 'CoC7.SkillHintOwn', initial: false }),
        keepbasevalue: new fields.BooleanField({ label: 'CoC7.SkillKeepBaseValue', hint: 'CoC7.SkillHintKeepBaseValue', initial: false })
      }),
      flags: new fields.SchemaField({
        archetype: new fields.BooleanField({ initial: false }),
        developement: new fields.BooleanField({ initial: false }),
        experiencePackage: new fields.BooleanField({ initial: false }),
        occupation: new fields.BooleanField({ initial: false })
      })
    }
  }

  /**
   * Get skill name parts from full name
   * @param {string} skillName
   * @returns {object}
   */
  static guessNameParts (skillName) {
    const output = {
      name: skillName,
      system: {
        skillName,
        specialization: '',
        properties: {
          fighting: false,
          firearm: false,
          special: false
        }
      }
    }

    const match = skillName.match(/^([^(]+)\s*\((.+)\)$/)
    if (match) {
      output.system.skillName = match[2].trim()
      output.system.properties.special = true

      const specialization = match[1].trim()
      output.system.specialization = specialization
      output.name = specialization + ' (' + output.system.skillName + ')'
      output.system.properties.fighting = specialization === game.i18n.localize('CoC7.FightingSpecializationName')
      output.system.properties.firearm = specialization === game.i18n.localize('CoC7.FirearmSpecializationName')
      output.system.properties.ranged = specialization === game.i18n.localize('CoC7.RangedSpecializationName')
    }
    return output
  }

  /**
   * Create empty object for this item type
   * @param {object} options
   * @returns {object}
   */
  static emptyObject (options) {
    const object = foundry.utils.mergeObject({
      name: game.i18n.localize('CoC7.NewSkillName'),
      type: 'skill',
      system: new CoC7ModelsItemSkillSystem().toObject()
    }, {
      system: {
        properties: {
          push: true // initial is set to false because keys were not forced before App v2 version
        }
      }
    })
    foundry.utils.mergeObject(object, options)
    foundry.utils.mergeObject(object, CoC7ModelsItemSkillSystem.guessNameParts(object.name))
    if (typeof options.system?.properties?.push === 'undefined' && (object.system.properties.fighting || object.system.properties.firearm || object.system.properties.ranged)) {
      object.system.properties.push = false
    }
    return object
  }

  /**
   * Get parts of skill name from name or parts
   * @param {string} skillName
   * @param {string} specialization
   * @returns {object}
   */
  static getNamePartsSpec (skillName, specialization) {
    if (!specialization) {
      return {
        name: skillName,
        specialization: '',
        skillName
      }
    }
    const specNameRegex = new RegExp('^(' + CoC7Utilities.quoteRegExp(specialization) + ')\\s*\\((.+)\\)$', 'i')
    const match = skillName.match(specNameRegex)
    if (match) {
      specialization = match[1]
      skillName = match[2]
    }
    return {
      name: (specialization.length ? specialization + ' (' + skillName + ')' : skillName),
      specialization,
      skillName
    }
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Set null adjustment values to 0
    for (const k in source.adjustments) {
      if (source.adjustments[k] === null) {
        foundry.utils.setProperty(source, 'adjustments.' + k, 0)
      }
    }
    // If value is a field and adjustments.base is not then initialize base and set experience to value difference
    if (typeof source.value !== 'undefined' && typeof source.adjustments?.base === 'undefined') {
      // If base is a number copy it to adjustments base
      if ((source.base ?? '').toString().match(/^\d+$/)) {
        foundry.utils.setProperty(source, 'adjustments.base', Number(source.base))
      }
      // If value is not null alter experience to get that value
      if (source.value !== null && source.value !== -1) {
        const total = Object.values(source.adjustments ?? {}).reduce((c, i) => { c = c + parseInt(i, 10); return c }, 0)
        foundry.utils.setProperty(source, 'adjustments.experience', Number(source.value) - total + Number(source.adjustments?.experience ?? 0))
      }
    }
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description.value', source.description)
    }
    return super.migrateData(source)
  }

  /**
   * @inheritdoc
   * @param {object} changes
   * @param {object} data
   * @param {object} options
   * @param {documents.BaseUser} user
   */
  static _preCreateChanges (changes, data, options, user) {
    if (data.name) {
      foundry.utils.mergeObject(changes, CoC7ModelsItemSkillSystem.guessNameParts(data.name))
    }
  }

  /**
   * Unique identifier should be used to store and obtain item to assess item uniqueness.
   * For old items without id, fallback of skillName may still be used
   * but if skill name is not unique it will cause problems.
   * @deprecated Temporary forward
   * @returns {string}
   */
  get itemIdentifier () {
    deprecated.noReplacement({
      was: 'actor.itemIdentifier',
      until: 15
    })
    return this.parent.name
  }

  /**
   * To be adjusted by ActiveEffects
   * @returns {int}
   */
  get bonusDice () {
    return this.#bonusDice ?? 0
  }

  /**
   * To be adjusted by ActiveEffects
   * @param {int} value
   */
  set bonusDice (value) {
    this.#bonusDice = value
  }

  /**
   * Is this skill "dodge"
   * @returns {bool}
   */
  get isDodge () {
    return this.isSpecificSkill('i.skill.dodge')
  }

  /**
   * Is this skill "dodge"
   * @returns {bool}
   */
  get isCreditRating () {
    return this.isSpecificSkill('i.skill.credit-rating')
  }

  /**
   * Get calculated value not modified by active effects
   * @returns {int}
   */
  get valueUnmodified () {
    return Object.values(this.adjustments).reduce((c, i) => { c = c + parseInt(i, 10); return c }, 0)
  }

  /**
   * Has this value been modified by an Active Effect
   * @returns {boolean}
   */
  get activeEffectValue () {
    return typeof this.#value !== 'undefined'
  }

  /**
   * Get calculated value can be modified by active effects
   * @returns {int}
   */
  get value () {
    if (typeof this.#value !== 'undefined') {
      return this.#value
    }
    return this.valueUnmodified
  }

  /**
   * To be adjusted by ActiveEffects
   * @param {int} value
   */
  set value (value) {
    this.#value = value
  }

  /**
   * Check if skill is the required type
   * @param {string} id
   * @returns {bool}
   */
  isSpecificSkill (id) {
    if (typeof this.parent.flags[FOLDER_ID]?.cocidFlag?.id === 'string') {
      return (this.parent.flags[FOLDER_ID]?.cocidFlag?.id === id)
    }
    const check = game.i18n.localize('CoC7.CoCIDFlag.keys.' + id).toLowerCase()
    if (this.parent.name.toLowerCase() === check) {
      return true
    }
    return (this.skillName.toLowerCase() === check)
  }

  /**
   * Is any skill
   * @returns {boolean}
   */
  get isAnySkill () {
    if (!this.properties.special) {
      return false
    }
    if (this.properties.requiresname || this.properties.picknameonly) {
      return true
    }
    return [
      game.i18n.localize('CoC7.AnySpecName').toLowerCase(),
      'any'
    ].includes(CONFIG.Item.dataModels.skill.guessNameParts(this.parent.name).system.skillName.toLowerCase())
  }

  /**
   * Create changes list to toggle boolean value
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   * @returns {object}
   */
  async prepareToggleUpdate (property, key, { isCtrlKey = false } = {}) {
    const changes = await super.prepareToggleUpdate(property, key, { isCtrlKey })
    if (property === 'properties' && key === 'special') {
      if (changes['system.properties.special']) {
        const parts = CoC7ModelsItemSkillSystem.getNamePartsSpec(this.skillName, this.specialization)
        changes.name = parts.name
      } else {
        changes['system.properties.fighting'] = false
        changes['system.properties.firearm'] = false
        changes['system.properties.ranged'] = false
        changes['system.properties.ranged'] = false
        changes['system.properties.requiresname'] = false
        changes['system.properties.keepbasevalue'] = false
        changes['system.properties.own'] = false
        changes['system.properties.picknameonly'] = false
        changes.name = this.skillName
      }
    } else if (property === 'properties' && ['fighting', 'firearm', 'ranged'].includes(key)) {
      const specialization = (isCtrlKey ? this.specialization : game.i18n.localize(FIGHTING_NAMES[key]))
      const parts = CoC7ModelsItemSkillSystem.getNamePartsSpec(this.skillName, specialization)
      changes['system.properties.special'] = true
      changes['system.properties.fighting'] = (key === 'fighting')
      changes['system.properties.firearm'] = (key === 'firearm')
      changes['system.properties.ranged'] = (key === 'ranged')
      changes.name = parts.name
      changes['system.skillName'] = parts.skillName
      changes['system.specialization'] = parts.specialization
    } else if (property === 'properties' && ['requiresname', 'keepbasevalue', 'own', 'picknameonly'].includes(key) && !this.properties.special) {
      changes['system.properties.special'] = true
      const parts = CoC7ModelsItemSkillSystem.getNamePartsSpec(this.skillName, this.specialization)
      changes.name = parts.name
    }
    return changes
  }

  /**
   * Adjust experience to set skill value
   * @deprecated Temporary forward
   * @param {integer} value
   * @returns {Promise<Document>}
   */
  async updateValue (value) {
    deprecated.noReplacement({
      was: 'actor.updateValue(?)',
      until: 15
    })
    if (this.actor.type === 'character') {
      const delta = parseInt(value) - this.rawValue
      const exp =
        (this.adjustments?.experience
          ? parseInt(this.adjustments.experience)
          : 0) + delta
      await this.parent.update({
        'system.adjustments.experience': exp > 0 ? exp : 0
      })
    } else await this.parent.update({ 'system.value': value })
  }

  /**
   * Adjust experience for skill
   * @deprecated Temporary forward
   * @param {integer} x
   */
  async increaseExperience (x) {
    deprecated.noReplacement({
      was: 'actor.increaseExperience(?)',
      until: 15
    })
    if (this.type !== 'skill') return
    if (this.actor.type === 'character') {
      const exp =
        (this.adjustments?.experience
          ? parseInt(this.adjustments.experience)
          : 0) + parseInt(x)
      await this.parent.update({
        'system.adjustments.experience': exp > 0 ? exp : 0
      })
    }
  }
}
