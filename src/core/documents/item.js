/* global CONFIG, foundry, fromUuid, game, Item, Roll, TextEditor, Token, ui */
import { COC7 } from '../config.js'
import { CoC7Utilities } from '../../shared/utilities.js'
import { CoCIDEditor } from '../../features/coc-id-system/apps/coc-id-editor.js'

/**
 * Override and extend the basic :class:`Item` implementation
 */
export class CoC7Item extends Item {
  /** Create derived document classes for specific Item types */
  constructor (data, context) {
    /** @see CONFIG.Item.documentClasses in module/scripts/configure-documents */
    if (data.type in CONFIG.Item.documentClasses && !context?.extended) {
      /**
       * When the constructor for the new class will call it's super(),
       * the extended flag will be true, thus bypassing this whole process
       * and resume default behavior
       */
      return new CONFIG.Item.documentClasses[data.type](data, {
        ...{ extended: true },
        ...context
      })
    }
    if (typeof data.img === 'undefined') {
      if (data.type === 'skill') {
        data.img = 'systems/CoC7/assets/icons/skills.svg'
      } else if (data.type === 'status') {
        data.img = 'icons/svg/aura.svg'
      } else if (data.type === 'weapon') {
        data.img = 'icons/svg/sword.svg'
      }
    }
    /** Default behavior, just call super() and do all the default Item inits */
    super(data, context)
  }

  async _createDocumentLink (eventData, { relativeTo, label } = {}) {
    if (typeof eventData.type === 'string' && typeof eventData.uuid === 'string' && eventData.type === 'Item' && eventData.uuid.match(/^Actor\./) && relativeTo instanceof CONFIG.JournalEntryPage.documentClass) {
      // If dropping a skill/weapon from an Actor onto a Journal Entry Page convert to a check link
      const item = await fromUuid(eventData.uuid)
      if (['skill', 'weapon'].includes(item.type)) {
        return '@coc7.check[type:' + item.type + ',name:' + item.name + ']'
      }
    }
    return super._createDocumentLink(eventData, { relativeTo, label })
  }

  static get iconLanguage () {
    return 'systems/CoC7/assets/icons/skills/language.svg'
  }

  static get flags () {
    return {
      malfunction: 'malfc'
    }
  }

  /**
   * Toggle on of the item property in data.data.properties
   * @param {String} propertyId : name for the property to toggle
   */
  async toggleProperty (propertyId, override = false) {
    let checkedProps = {}
    let fighting
    let firearms
    let ranged
    if (typeof COC7.eras[propertyId] !== 'undefined') {
      return CoCIDEditor.eraToggle(this, propertyId)
    } else if (this.type === 'weapon' && !override) {
      if (propertyId === 'ahdb') {
        if (!this.system.properties.ahdb) {
          checkedProps = {
            'system.properties.ahdb': true,
            'system.properties.addb': false
          }
        } else {
          checkedProps = {
            'system.properties.ahdb': false
          }
        }
      }

      if (propertyId === 'addb') {
        if (!this.system.properties.addb) {
          checkedProps = {
            'system.properties.addb': true,
            'system.properties.ahdb': false
          }
        } else {
          checkedProps = {
            'system.properties.addb': false
          }
        }
      }

      if (propertyId === 'shotgun') {
        if (!this.system.properties.shotgun) {
          checkedProps = {
            'system.properties.rngd': true,
            'system.properties.melee': false,
            'system.properties.shotgun': true
          }
        } else {
          checkedProps = {
            'system.properties.shotgun': false,
            'system.range.extreme.value': null,
            'system.range.extreme.damage': null,
            'system.range.long.value': null,
            'system.range.long.damage': null
          }
        }
      }

      if (propertyId === 'melee' || propertyId === 'rngd') {
        let meleeWeapon
        if (propertyId === 'melee' && !this.system.properties.melee) {
          meleeWeapon = true
        }
        if (propertyId === 'melee' && this.system.properties.melee) {
          meleeWeapon = false
        }
        if (propertyId === 'rngd' && !this.system.properties.rngd) {
          meleeWeapon = false
        }
        if (propertyId === 'rngd' && this.system.properties.rngd) {
          meleeWeapon = true
        }
        if (meleeWeapon) {
          checkedProps = {
            'system.properties.melee': true,
            'system.properties.rngd': false,
            'system.properties.shotgun': false,
            'system.properties.brst': false,
            'system.properties.auto': false,
            'system.properties.dbrl': false
          }
        } else {
          checkedProps = {
            'system.properties.melee': false,
            'system.properties.rngd': true
          }
        }
      }
    } else if (this.type === 'skill' && !override) {
      let modif = false
      switch (propertyId) {
        case 'combat':
          if (!this.system.properties.combat) {
            // Close combat by default
            fighting = true
          } else {
            checkedProps = {
              'system.properties.combat': false,
              'system.properties.special': false,
              'system.properties.fighting': false,
              'system.properties.firearm': false,
              'system.properties.ranged': false,
              'system.specialization': '',
              name: this.system.skillName
            }
          }
          modif = true
          break
        case 'fighting':
          if (!this.system.properties.fighting) {
            modif = true
            firearms = false
            ranged = false
            fighting = true
          }
          break
        case 'firearm':
          if (!this.system.properties.firearm) {
            modif = true
            firearms = true
            ranged = false
            fighting = false
          }
          modif = true
          break
        case 'ranged':
          if (!this.system.properties.ranged) {
            modif = true
            firearms = false
            ranged = true
            fighting = false
          }
          modif = true
          break
      }

      if (modif) {
        // set specialisation if fighting or firearm
        if (fighting) {
          checkedProps = {
            'system.properties.fighting': true,
            'system.properties.firearm': false,
            'system.properties.ranged': false,
            'system.properties.combat': true,
            'system.properties.special': true
          }
          const parts = CoC7Item.getNamePartsSpec(
            this.system.skillName,
            game.i18n.localize(COC7.fightingSpecializationName)
          )
          checkedProps.name = parts.name
          checkedProps.skillName = parts.skillName
          checkedProps['system.specialization'] = parts.specialization
        } else if (firearms) {
          checkedProps = {
            'system.properties.fighting': false,
            'system.properties.firearm': true,
            'system.properties.ranged': false,
            'system.properties.combat': true,
            'system.properties.special': true
          }
          const parts = CoC7Item.getNamePartsSpec(
            this.system.skillName,
            game.i18n.localize(COC7.firearmSpecializationName)
          )
          checkedProps.name = parts.name
          checkedProps.skillName = parts.skillName
          checkedProps['system.specialization'] = parts.specialization
        } else if (ranged) {
          checkedProps = {
            'system.properties.fighting': false,
            'system.properties.firearm': false,
            'system.properties.ranged': true,
            'system.properties.combat': true,
            'system.properties.special': true
          }
          const parts = CoC7Item.getNamePartsSpec(
            this.system.skillName,
            game.i18n.localize(COC7.rangedSpecializationName)
          )
          checkedProps.name = parts.name
          checkedProps.skillName = parts.skillName
          checkedProps['system.specialization'] = parts.specialization
        }
      }
    }

    if (propertyId === 'special') {
      if (this.system.properties[propertyId]) {
        checkedProps = {
          'system.properties.special': false,
          'system.properties.fighting': false,
          'system.properties.firearm': false,
          'system.properties.ranged': false,
          'system.properties.combat': false,
          'system.specialization': '',
          name: this.system.skillName
        }
      } else {
        checkedProps = {
          'system.properties.special': true,
          name: this.system.specialization + ' (' + this.system.skillName + ')'
        }
      }
    }

    if (Object.keys(checkedProps).length > 0) {
      const item = await this.update(checkedProps)
      return item
    } else {
      const propName = `system.properties.${propertyId}`
      const propValue = !this.system.properties[propertyId]
      await this.update({ [propName]: propValue }).then(item => {
        return item
      })
    }
  }

  hasProperty (propertyId) {
    return this.isIncludedInSet('properties', propertyId)
  }

  get shortName () {
    if (this.system.properties.special) {
      return this.system.skillName
    }
    return this.name
  }

  async updateRoll (roll) {
    if ('updateRoll' in this.sheet) return await this.sheet.updateRoll(roll)
    else if ('updateRoll' in this) return await this.updateRoll(roll)
    return undefined
  }

  static getNamePartsSpec (skillName, specialization) {
    if (!specialization) {
      return {
        name: skillName,
        specialization: '',
        skillName
      }
    }
    const specNameRegex = new RegExp(
      '^(' + CoC7Utilities.quoteRegExp(specialization) + ')\\s*\\((.+)\\)$',
      'i'
    )
    const match = skillName.match(specNameRegex)
    if (match) {
      specialization = match[1]
      skillName = match[2]
    }
    return {
      name: specialization + ' (' + skillName + ')',
      specialization,
      skillName
    }
  }

  static getNameWithoutSpec (item) {
    if (item instanceof CoC7Item) {
      if (item.system?.properties?.special && typeof item.system.skillName !== 'undefined') {
        return item.system.skillName
      }
    } else {
      if (item.properties?.special && typeof item.skillName !== 'undefined') {
        return item.skillName
      }
    }
    return item.name
  }

  static isAnySpec (item) {
    if (item.type !== 'skill' || !item.system.properties?.special) {
      return false
    }
    if (item.system.properties?.requiresname || item.system.properties?.picknameonly) {
      return true
    }
    return [
      game.i18n.localize('CoC7.AnySpecName').toLowerCase(),
      'any'
    ].includes(CONFIG.Item.documentClasses.skill.guessNameParts(item.name).skillName.toLowerCase())
  }

  async checkSkillProperties () {
    if (this.type !== 'skill') return
    const checkedProps = {}
    if (this.system.properties.combat) {
      // if skill is not a specialisation make it a specialisation
      if (!this.system.properties.special) {
        this.system.properties.special = true
        checkedProps['system.properties.special'] = true
      }

      // If skill is combat skill and no specialisation set then make it a fighting( closecombat) skill
      if (
        !this.system.properties.fighting &&
        !this.system.properties.firearm
      ) {
        this.system.properties.fighting = true
        checkedProps['system.properties.fighting'] = true
      }

      // if skill is close combat without specialisation name make set it according to the fightingSpecializationName
      if (
        this.system.properties.fighting &&
        (!this.system.specialization || this.system.specialization === '')
      ) {
        this.system.specialization = game.i18n.localize(
          COC7.fightingSpecializationName
        )
        checkedProps['system.specialization'] = game.i18n.localize(
          COC7.fightingSpecializationName
        )
      }

      // if skill is range combat without a specialisation name make set it according to the firearmSpecializationName
      if (
        this.system.properties.firearm &&
        (!this.system.specialization || this.system.specialization === '')
      ) {
        this.system.specialization = game.i18n.localize(
          COC7.firearmSpecializationName
        )
        checkedProps['system.specialization'] = game.i18n.localize(
          COC7.firearmSpecializationName
        )
      }
    } else {
      if (this.system.properties.fighting) {
        this.system.properties.fighting = false
        checkedProps['system.properties.fighting'] = false
      }
      if (this.system.properties.firearm) {
        this.system.properties.firearm = false
        checkedProps['system.properties.firearm'] = false
      }
    }

    if (Object.keys(checkedProps).length > 0) {
      await this.update(checkedProps)
    }

    return checkedProps
  }

  isIncludedInSet (set, propertyId) {
    if (!this.system[set]) this.system[set] = []
    const propertyIndex = this.system[set].indexOf(propertyId)
    if (propertyIndex > -1) return true
    return false
  }

  async flagForDevelopement () {
    if (game.settings.get('CoC7', 'xpEnabled') || game.user.isGM) {
      if (!this.system.flags) {
        await this.update({ 'system.flags': {} })
      }
      await this.update({ 'system.flags.developement': true })
    }
  }

  async unflagForDevelopement () {
    if (game.settings.get('CoC7', 'xpEnabled') || game.user.isGM) {
      if (!this.system.flags) {
        await this.update({ 'system.flags': {} })
      }
      await this.update({ 'system.flags.developement': false })
    }
  }

  get developementFlag () {
    return this.getItemFlag('developement')
  }

  async toggleItemFlag (flagName, eraseAdjustment = true) {
    const flagValue = !this.getItemFlag(flagName)
    const name = `system.flags.${flagName}`
    if (
      (flagName === 'occupation' || flagName === 'archetype') &&
      !flagValue &&
      eraseAdjustment
    ) {
      await this.update({
        [`system.adjustments.${flagName}`]: null,
        [name]: flagValue
      })
    } else if (flagName === 'developement') {
      if (game.settings.get('CoC7', 'xpEnabled') || game.user.isGM) {
        await this.update({ [name]: flagValue })
      } else {
        ui.notifications.info(game.i18n.localize('CoC7.SkillXpGainDisabled'))
      }
    } else await this.update({ [name]: flagValue })
  }

  async setItemFlag (flagName) {
    await this.update({ [`system.flags.${flagName}`]: true })
  }

  async unsetItemFlag (flagName, eraseAdjustment = true) {
    const name = `system.flags.${flagName}`
    if (
      (flagName === 'occupation' || flagName === 'archetype') &&
      eraseAdjustment
    ) {
      await this.update({
        [`system.adjustments.${flagName}`]: null,
        [name]: false
      })
    } else await this.update({ [name]: false })
  }

  getItemFlag (flagName) {
    if (!this.system.flags) {
      this.system.flags = {}
      this.system.flags.locked = true
      this.update({ 'system.flags': {} })
      return false
    }

    if (!this.system.flags[flagName]) return false
    return this.system.flags[flagName]
  }

  get usesAlternativeSkill () {
    return (
      this.type === 'weapon' &&
      (this.system.properties?.auto === true ||
        this.system.properties?.brst === true ||
        this.system.properties?.thrown === true)
    )
  }

  get maxUsesPerRound () {
    if (this.type !== 'weapon') return null
    const multiShot = parseInt(this.system.usesPerRound.max)
    if (isNaN(multiShot)) return 0
    return multiShot
  }

  get usesPerRound () {
    if (this.type !== 'weapon') return null
    const singleShot = parseInt(this.system.usesPerRound.normal)
    if (isNaN(singleShot)) return 0
    return singleShot
  }

  get usesPerRoundString () {
    let usesPerRound
    if (this.system.usesPerRound.normal) {
      usesPerRound = this.system.usesPerRound.normal
    } else {
      usesPerRound = '1'
    }
    if (this.system.usesPerRound.max) {
      usesPerRound += `(${this.system.usesPerRound.max})`
    }
    if (this.system.properties.auto) {
      usesPerRound += ` ${game.i18n.localize('CoC7.WeaponAuto')}`
    }
    if (this.system.properties.brst) {
      usesPerRound += ` ${game.i18n.localize('CoC7.WeaponBrst')}`
      if (this.system.usesPerRound.burst) {
        usesPerRound += `(${this.system.usesPerRound.burst})`
      }
    }

    return usesPerRound
  }

  get multipleShots () {
    if (this.type !== 'weapon') return null
    if (this.maxUsesPerRound <= 1) {
      return false
    }
    return true
  }

  get singleShot () {
    if (this.type !== 'weapon') return null
    if (!this.usesPerRound) {
      return false
    }
    return true
  }

  get baseRange () {
    const result = parseInt(this.system.range.normal.value)
    if (!isNaN(result)) {
      return result
    }
    return new Roll(
      this.system.range.normal.value,
      this.parent?.parseCharacteristics() ?? {}
    ).evaluateSync().total
  }

  get longRange () {
    const result = parseInt(this.system.range.long.value)
    if (!isNaN(result)) {
      return result
    }
    return new Roll(
      this.system.range.long.value,
      this.parent?.parseCharacteristics() ?? {}
    ).evaluateSync().total
  }

  get extremeRange () {
    const result = parseInt(this.system.range.extreme.value)
    if (!isNaN(result)) {
      return result
    }
    return new Roll(
      this.system.range.extreme.value,
      this.parent?.parseCharacteristics() ?? {}
    ).evaluateSync().total
  }

  get skillProperties () {
    if (this.type !== 'skill') return []

    const skillProperties = []
    for (const [key, value] of Object.entries(COC7.skillProperties)) {
      if (this.system.properties[key] === true) {
        skillProperties.push(game.i18n.localize(value))
      }
    }
    return skillProperties
  }

  static async calculateBase (actor, data) {
    if (data.type !== 'skill') return null
    if (String(data.system.base).includes('@')) {
      const parsed = {}
      for (const [key, value] of Object.entries(COC7.formula.actorsheet)) {
        if (key.startsWith('@') && value.startsWith('this.actor.')) {
          parsed[key.substring(1)] = foundry.utils.getProperty(actor, value.substring(11))
        }
      }
      let value
      try {
        value = Math.floor(
          new Roll(data.system.base, parsed)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
        )
      } catch (err) {
        value = 0
      }
      return value
    }
    return !isNaN(parseInt(data.system.base)) ? parseInt(data.system.base) : null
  }

  get _base () {
    if (this.type !== 'skill') return [null, false]
    if (typeof this.system.base !== 'string') {
      return [this.system.base, false]
    }

    if (this.system.base.includes('@')) {
      const parsed = {}
      for (const [key, value] of Object.entries(COC7.formula.actorsheet)) {
        if (key.startsWith('@') && value.startsWith('this.')) {
          parsed[key.substring(1)] = foundry.utils.getProperty(this, value.substring(5))
        }
      }
      let value
      try {
        value = Math.floor(
          new Roll(this.system.base, parsed)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
        )
      } catch (err) {
        value = 0
      }

      return [value, true]
    }
    return [
      !isNaN(parseInt(this.system.base))
        ? parseInt(this.system.base)
        : null,
      false
    ]
  }

  async asyncBase () {
    const e = this._base
    if (e[1]) {
      console.info(
        `[COC7] (${this.parent?.name}) Evaluating skill ${this.name}:${this.system.base} to ${e[0]}`
      )
      await this.update({ 'system.base': e[0] })
    }
    return e[0]
  }

  get base () {
    const e = this._base
    if (e[1]) {
      this.update({ 'system.base': e[0] })
    }
    return e[0]
  }

  getBulletLeft () {
    if (this.type !== 'weapon') return null
    if (!this.system.ammo) {
      this.setBullets(0)
      return 0
    }
    return this.system.ammo
  }

  async reload () {
    if (this.type !== 'weapon') return null
    const maxBullet = this.system.bullets
      ? parseInt(this.system.bullets)
      : 1
    await this.setBullets(maxBullet)
  }

  async setBullets (bullets) {
    if (this.type !== 'weapon') return null
    await this.update({ 'system.ammo': bullets || 0 })
  }

  async addBullet () {
    if (this.type !== 'weapon') return null
    const bullets = await this.getBulletLeft()
    const maxBullets = this.system.bullets
      ? parseInt(this.system.bullets)
      : 1
    if (bullets + 1 >= maxBullets) await this.setBullets(maxBullets)
    else await this.setBullets(bullets + 1)
  }

  async shootBullets (x) {
    if (this.type !== 'weapon') return null
    const bullets = await this.getBulletLeft()
    if (x > bullets) await this.setBullets(0)
    else await this.setBullets(bullets - x)
  }

  static mergeOptionalSkills (skillList, options) {
    const jointArray = skillList.concat(options)
    return jointArray
      .reduce((newArray, item) => {
        // If skill is not a generic spec and is already included we don't add item
        if (
          !CoC7Item.isAnySpec(item) &&
          newArray.find(skill => skill.name === item.name)
        ) {
          return newArray
        }
        // Else item is added
        return [...newArray, item]
      }, [])
      .sort(CoC7Utilities.sortByNameKey)
  }

  /** TODO : rien a faire ici !!
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static _getChatCardActor (card) {
    // Case 1 - a synthetic actor from a Token
    const tokenKey = card.dataset.tokenId
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split('.')
      if (sceneId === 'TOKEN') {
        return game.actors.tokens[tokenId] // REFACTORING (2)
      } else {
        const scene = game.scenes.get(sceneId)
        if (!scene) return null
        const tokenData = scene.getEmbeddedDocument('Token', tokenId)
        if (!tokenData) return null
        const token = new Token(tokenData)
        return token.actor
      }
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId
    return game.actors.get(actorId) || null
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  /**
   * Prepare an object of chat data used to display a card for the Item in the chat log
   * @param {Object} htmlOptions    Options used by the TextEditor.enrichHTML function
   * @return {Object}               An object of chat data to render
   */
  async getChatData (htmlOptions = {}) {
    // FoundryVTT v11
    htmlOptions.async = true
    const data = foundry.utils.duplicate(this.system)
    // Fix : data can have description directly in field, not under value.
    if (typeof data.description === 'string') {
      data.description = {
        value: data.description,
        special: ''
      }
    }
    if (typeof data.description.value === 'undefined') {
      data.description.value = ''
    }
    if (typeof data.description.special === 'undefined') {
      data.description.special = ''
    }
    const labels = []

    // Rich text description
    data.description.value = await TextEditor.enrichHTML(
      data.description.value,
      htmlOptions
    )
    data.description.special = await TextEditor.enrichHTML(
      data.description.special,
      htmlOptions
    )

    // Item type specific properties
    const props = []
    const fn = this[`_${this.type}ChatData`]
    if (fn) fn.bind(this)(data, labels, props, htmlOptions)

    if (this.type === 'skill') {
      for (const [key, value] of Object.entries(COC7.skillProperties)) {
        if (this.system.properties[key] === true) props.push(value)
      }
    }

    // Filter properties and return
    data.properties = props.filter(p => !!p)
    data.labels = labels
    return data
  }

  _weaponChatData (data, labels, props) {
    for (const [key, value] of Object.entries(COC7.weaponProperties)) {
      if (this.system.properties[key] === true) props.push(value)
    }

    let skillLabel = game.i18n.localize('CoC7.Skill')
    let skillName = ''
    let found = false
    if (this.system.skill.main.id) {
      const skill = this.actor?.items.get(this.system.skill.main.id)
      if (skill) {
        skillName += CoC7Item.getNameWithoutSpec(skill)
        found = true
      }
    }

    if (this.usesAlternativeSkill && this.system.skill.alternativ.id) {
      skillLabel = game.i18n.localize('CoC7.Skills')
      const skill = this.actor?.items.get(this.system.skill.alternativ.id)
      if (skill) {
        skillName += `/${CoC7Item.getNameWithoutSpec(skill)}`
        found = true
      }
    }

    if (!found) {
      skillName = this.system.skill.main.name
      if (this.usesAlternativeSkill && this.system.skill.alternativ.name) {
        skillName += `/${this.system.skill.alternativ.name}`
      }
    }

    if (skillName) {
      labels.push({
        name: skillLabel,
        value: skillName
      })
    }

    labels.push({
      name: game.i18n.localize('CoC7.WeaponUsesPerRound'),
      value: this.usesPerRoundString
    })

    labels.push({
      name: game.i18n.localize('CoC7.WeaponMalfunction'),
      value: this.system.malfunction ? this.system.malfunction : '-'
    })

    if (this.system.bullets) {
      labels.push({
        name: game.i18n.localize('CoC7.WeaponBulletsInMag'),
        value: this.system.bullets
      })
    }
  }

  canBePushed () {
    if (this.type === 'skill' && this.system.properties.push) return true
    return false
  }

  get impale () {
    return this.system.properties.impl
  }

  get isDodge () {
    if (this.type !== 'skill') return false
    return (
      this.name.toLowerCase() ===
      game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.dodge').toLowerCase()
    )
  }
}
