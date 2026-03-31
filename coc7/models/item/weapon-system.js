/* global foundry game Roll */
// cSpell:words dbrl brst slnt
import { FOLDER_ID, ERAS } from '../../constants.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'

export default class CoC7ModelsItemWeaponSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'icons/svg/sword.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      description: new fields.SchemaField({
        value: new fields.HTMLField({ initial: '' }),
        /* // FoundryVTT V13 - not required
        chat: '',
        */
        special: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' })
      }),
      /* // FoundryVTT V13 - not required
      wpnType: '',
      */
      skill: new fields.SchemaField({
        main: new fields.SchemaField({
          name: new fields.StringField({ initial: '' }),
          id: new fields.StringField({ initial: '' })
        }),
        alternativ: new fields.SchemaField({
          name: new fields.StringField({ initial: '' }),
          id: new fields.StringField({ initial: '' })
        })
      }),
      range: new fields.SchemaField({
        normal: new fields.SchemaField({
          value: new fields.StringField({ initial: '' }),
          /* // FoundryVTT V13 - not required
          units: '',
          */
          damage: new fields.StringField({ initial: '' })
        }),
        long: new fields.SchemaField({
          value: new fields.StringField({ initial: '' }),
          /* // FoundryVTT V13 - not required
          units: '',
          */
          damage: new fields.StringField({ initial: '' })
        }),
        extreme: new fields.SchemaField({
          value: new fields.StringField({ initial: '' }),
          /* // FoundryVTT V13 - not required
          units: '',
          */
          damage: new fields.StringField({ initial: '' })
        })
      }),
      usesPerRound: new fields.SchemaField({
        normal: new fields.StringField({ initial: '1' }),
        max: new fields.StringField({ nullable: true, initial: null }),
        burst: new fields.StringField({ nullable: true, initial: null })
      }),
      bullets: new fields.NumberField({ nullable: true, initial: null }),
      ammo: new fields.NumberField({ nullable: false, initial: 0 }),
      malfunction: new fields.NumberField({ nullable: true, initial: null }),
      blastRadius: new fields.NumberField({ nullable: true, initial: null }),
      properties: new fields.SchemaField({
        rngd: new fields.BooleanField({ label: 'CoC7.WeaponRanged', initial: false }),
        mnvr: new fields.BooleanField({ label: 'CoC7.WeaponManeuver', initial: false }),
        thrown: new fields.BooleanField({ label: 'CoC7.Weapon.Property.Thrown', initial: false }),
        shotgun: new fields.BooleanField({ label: 'CoC7.Weapon.Property.Shotgun', initial: false }),
        dbrl: new fields.BooleanField({ label: 'CoC7.WeaponDualBarrel', initial: false }),
        impl: new fields.BooleanField({ label: 'CoC7.WeaponImpl', initial: false }),
        brst: new fields.BooleanField({ label: 'CoC7.WeaponBurst', initial: false }),
        auto: new fields.BooleanField({ label: 'CoC7.WeaponAuto', initial: false }),
        ahdb: new fields.BooleanField({ label: 'CoC7.WeaponAddHalfDb', initial: false }),
        addb: new fields.BooleanField({ label: 'CoC7.WeaponAddDb', initial: false }),
        slnt: new fields.BooleanField({ label: 'CoC7.WeaponSilent', initial: false }),
        spcl: new fields.BooleanField({ label: 'CoC7.WeaponSpecial', initial: false }),
        mont: new fields.BooleanField({ label: 'CoC7.WeaponMont', initial: false }),
        blst: new fields.BooleanField({ label: 'CoC7.WeaponBlast', initial: false }),
        stun: new fields.BooleanField({ label: 'CoC7.WeaponStun', initial: false }),
        rare: new fields.BooleanField({ label: 'CoC7.WeaponRare', initial: false }),
        burn: new fields.BooleanField({ label: 'CoC7.Weapon.Property.Burn', initial: false })
      }),
      /* // FoundryVTT V12 */
      price: (foundry.utils.isNewerVersion(game.version, 13)
        ? new fields.TypedObjectField(
          new fields.StringField({ nullable: true, initial: null }),
          {
            validateKey: (key) => typeof ERAS[key] !== 'undefined'
          }
        )
        : new fields.ObjectField())
    }
  }

  /**
   * Create empty object for this item type
   * @param {object} options
   * @returns {object}
   */
  static emptyObject (options) {
    const object = foundry.utils.mergeObject({
      name: game.i18n.localize('CoC7.NewWeaponName'),
      type: 'weapon',
      system: new CoC7ModelsItemWeaponSystem().toObject()
    }, options)
    return object
  }

  /**
   * Get parsed chat data for Item
   * @param {object|Document} object
   * @param {object} output
   * @param {object} options
   * @param {boolean} options.editable
   * @param {null|Document} options.actor
   */
  static async getChatData (object, output, { editable = false, actor = null } = {}) {
    const skills = []
    await CoC7ModelsItemWeaponSystem.#getChatDataSkill(object.system.skill?.main, skills, actor)
    await CoC7ModelsItemWeaponSystem.#getChatDataSkill(object.system.skill?.alternativ, skills, actor)

    if (skills.length) {
      output.labels.push({
        name: game.i18n.localize((skills.length === 1 ? 'CoC7.Skill' : 'CoC7.Skills')),
        value: skills.join('/')
      })
    }

    output.labels.push({
      name: game.i18n.localize('CoC7.WeaponUsesPerRound'),
      value: CoC7ModelsItemWeaponSystem.usesPerRoundString(object)
    })

    output.labels.push({
      name: game.i18n.localize('CoC7.WeaponMalfunction'),
      value: object.system.malfunction ? object.system.malfunction : '-'
    })

    if (object.system.bullets) {
      output.labels.push({
        name: game.i18n.localize('CoC7.WeaponBulletsInMag'),
        value: object.system.bullets
      })
    }
  }

  /**
   * Check if weapon skill exists
   * @param {object} object
   * @param {object} skills
   * @param {null|Document} actor
   */
  static async #getChatDataSkill (object, skills, actor) {
    let found = false
    if (object.id) {
      // Get skill from actor
      if (actor) {
        const skill = actor.items.get(object.id)
        if (skill) {
          skills.push(skill.system.skillName)
          found = true
        }
      }
    }
    if (!found && object.name) {
      // get main skill for coc id
      if (object.name.match(/^i\.skill\..+$/)) {
        const skill = await game.CoC7.cocid.fromCoCIDBest({ cocid: object.name })
        if (skill.length) {
          skills.push(skill[0].system.skillName)
          found = true
        }
      }
      // use name as main skill
      if (!found) {
        skills.push(object.name)
      }
    }
  }

  /**
   * Uses per round
   * @param {object|Document} object
   * @returns {string}
   */
  static usesPerRoundString (object) {
    let usesPerRound
    if (object.system.usesPerRound.normal) {
      usesPerRound = object.system.usesPerRound.normal
    } else {
      usesPerRound = '1'
    }
    if (object.system.usesPerRound.max) {
      usesPerRound += `(${object.system.usesPerRound.max})`
    }
    if (object.system.properties.auto) {
      usesPerRound += ` ${game.i18n.localize('CoC7.WeaponAuto')}`
    }
    if (object.system.properties.brst) {
      usesPerRound += ` ${game.i18n.localize('CoC7.WeaponBurst')}`
      if (object.system.usesPerRound.burst) {
        usesPerRound += `(${object.system.usesPerRound.burst})`
      }
    }
    return usesPerRound
  }

  /**
   * Has the weapon skill been set to a valid skill
   * @returns {bool}
   */
  get isSkillSet () {
    if (this.parent.parent) {
      if (this.skill.main.id) {
        const skill = this.parent.parent.items.get(this.skill.main.id)
        if (skill) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Has the weapon skill been set to a valid skill or empty
   * @returns {bool}
   */
  get isAlternativeSkillSet () {
    if (this.parent.parent) {
      if (this.skill.alternativ.id) {
        const skill = this.parent.parent.items.get(this.skill.alternativ.id)
        if (skill) {
          return true
        }
      } else {
        return true
      }
    }
    return false
  }

  /**
   * Get skill from owner if available
   * @returns {document|undefined}
   */
  get skillAlternative () {
    if (this.parent.parent) {
      if (this.skill.alternativ.id) {
        return this.parent.parent.items.get(this.skill.alternativ.id)
      }
    }
    return this.skillMain
  }

  /**
   * Get skill from owner if available
   * @returns {document|undefined}
   */
  get skillMain () {
    if (this.parent.parent) {
      if (this.skill.main.id) {
        return this.parent.parent.items.get(this.skill.main.id)
      }
    }
    return undefined
  }

  /**
   * Use alternative Skill
   * @returns {bool}
   */
  get usesAlternateSkill () {
    return this.properties.auto === true || this.properties.brst === true || this.properties.thrown === true
  }

  /**
   * Create update object
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   * @returns {object}
   */
  async prepareToggleUpdate (property, key, { isCtrlKey = false } = {}) {
    if (property === 'properties' && key === 'melee') {
      key = 'rngd'
    }
    const changes = await super.prepareToggleUpdate(property, key, { isCtrlKey })
    if (typeof changes['system.properties.rngd'] !== 'undefined' && !changes['system.properties.rngd']) {
      changes['system.properties.shotgun'] = false
      changes['system.properties.dbrl'] = false
      changes['system.properties.brst'] = false
      changes['system.properties.auto'] = false
    }
    if (typeof changes['system.properties.ahdb'] !== 'undefined') {
      if (changes['system.properties.ahdb']) {
        changes['system.properties.addb'] = false
      }
    } else if (typeof changes['system.properties.addb'] !== 'undefined') {
      if (changes['system.properties.addb']) {
        changes['system.properties.ahdb'] = false
      }
    }
    if (typeof changes['system.properties.shotgun'] !== 'undefined') {
      if (changes['system.properties.shotgun']) {
        changes['system.properties.rngd'] = true
      } else {
        changes['system.range.long.value'] = null
        changes['system.range.long.damage'] = null
        changes['system.range.extreme.value'] = null
        changes['system.range.extreme.damage'] = null
      }
    }
    return changes
  }

  /**
   * Reload weapon to bullets value
   */
  async reload () {
    const updates = await this.reloadUpdates()
    await this.parent.update(updates)
  }

  /**
   * Get changes object to reload weapon to bullets value
   * @returns {object}
   */
  async reloadUpdates () {
    return this.setBulletsUpdates(this.bullets)
  }

  /**
   * Add ammunition if possible
   */
  async addAmmunition () {
    const bullets = parseInt(this.ammo ?? 0, 10)
    const maxBullets = parseInt(this.bullets ?? 0, 10)
    await this.setBullets(Math.min(bullets + 1, maxBullets))
  }

  /**
   * Shoot ammunition
   * @param {int} bullets
   * @returns {bool}
   */
  async shootAmmunition (bullets) {
    const ammo = parseInt(this.ammo ?? 0, 10)
    if (bullets <= ammo) {
      await this.setBullets(ammo - bullets)
      return true
    }
    return false
  }

  /**
   * Set bullets to specific value
   * @param {int} bullets
   */
  async setBullets (bullets) {
    const updates = await this.setBulletsUpdates(bullets)
    await this.parent.update(updates)
  }

  /**
   * Get changes object to set bullets to specific value
   * @param {int} bullets
   * @returns {object}
   */
  async setBulletsUpdates (bullets) {
    return {
      'system.ammo': bullets
    }
  }

  /**
   * Toggle flag
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   */
  async toggleProperty (property, key, { isCtrlKey = false } = {}) {
    await super.toggleProperty(property, key, isCtrlKey)
    if (property === 'eras' && this.parent.flags[FOLDER_ID]?.cocidFlag?.eras?.[key] !== true) {
      this.parent.update({
        /* // FoundryVTT V13 */
        ['system.price.-=' + key]: null
      })
    }
  }

  /**
   * Is Multiple Shot
   * @returns {boolean}
   */
  get multipleShots () {
    const value = this.usesPerRound.max.toString()
    const roll = new Roll(value)
    if (value !== '' && roll.isDeterministic) {
      return roll.evaluateSync().total > 1
    }
    return false
  }

  /**
   * Is Single Shot
   * @returns {boolean}
   */
  get singleShot () {
    const value = this.usesPerRound.normal.toString()
    const roll = new Roll(value)
    if (value !== '' && roll.isDeterministic) {
      return roll.evaluateSync().total > 0
    }
    return false
  }

  /**
   * Get base range
   * @returns {integer|float}
   */
  async baseRange () {
    return (await new Roll((this.range.normal.value || 0).toString(), this.parent?.actor?.parsedValues() ?? {}).roll()).total
  }

  /**
   * Get long range
   * @returns {integer|float}
   */
  async longRange () {
    if (this.properties.rngd) {
      if (this.properties.shotgun) {
        return (await new Roll((this.range.long.value || 0).toString(), this.parent?.actor?.parsedValues() ?? {}).roll()).total
      } else {
        return (await this.baseRange()) * 2
      }
    }
    return 0
  }

  /**
   * Get extreme range
   * @returns {integer|float}
   */
  async extremeRange () {
    if (this.properties.rngd) {
      if (this.properties.shotgun) {
        return (await new Roll((this.range.extreme.value || 0).toString(), this.parent?.actor?.parsedValues() ?? {}).roll()).total
      } else {
        return (await this.baseRange()) * 4
      }
    }
    return 0
  }

  /**
   * Uses alternative skill
   * @returns {boolean}
   */
  get usesAlternativeSkill () {
    return (this.properties.auto === true || this.properties.brst === true || this.properties.thrown === true)
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Empty string becomes 0
    if (source.malfunction === '') {
      foundry.utils.setProperty(source, 'malfunction', null)
    }
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description.value', source.description)
    }
    return super.migrateData(source)
  }
}
