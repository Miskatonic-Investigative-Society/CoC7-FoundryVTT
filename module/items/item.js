/* global CONFIG, duplicate, game, getProperty, Item, Roll, TextEditor, Token, ui */
import { CoC7Parser } from '../apps/parser.js'
import { COC7 } from '../config.js'
import { CoC7Utilities } from '../utilities.js'

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
    if (typeof COC7.eras[propertyId] !== 'undefined') {
      checkedProps = {
        ['data.eras.' + propertyId]: !(this.data.data.eras[propertyId] ?? false)
      }
    } else if (this.type === 'weapon' && !override) {
      if (propertyId === 'ahdb') {
        if (!this.data.data.properties.ahdb) {
          checkedProps = {
            'data.properties.ahdb': true,
            'data.properties.addb': false
          }
        } else {
          checkedProps = {
            'data.properties.ahdb': false
          }
        }
      }

      if (propertyId === 'addb') {
        if (!this.data.data.properties.addb) {
          checkedProps = {
            'data.properties.addb': true,
            'data.properties.ahdb': false
          }
        } else {
          checkedProps = {
            'data.properties.addb': false
          }
        }
      }

      if (propertyId === 'shotgun') {
        if (!this.data.data.properties.shotgun) {
          checkedProps = {
            'data.properties.rngd': true,
            'data.properties.melee': false,
            'data.properties.shotgun': true
          }
        } else {
          checkedProps = {
            'data.properties.shotgun': false,
            'data.range.extreme.value': null,
            'data.range.extreme.damage': null,
            'data.range.long.value': null,
            'data.range.long.damage': null
          }
        }
      }

      if (propertyId === 'melee' || propertyId === 'rngd') {
        let meleeWeapon
        if (propertyId === 'melee' && !this.data.data.properties.melee) {
          meleeWeapon = true
        }
        if (propertyId === 'melee' && this.data.data.properties.melee) {
          meleeWeapon = false
        }
        if (propertyId === 'rngd' && !this.data.data.properties.rngd) {
          meleeWeapon = false
        }
        if (propertyId === 'rngd' && this.data.data.properties.rngd) {
          meleeWeapon = true
        }
        if (meleeWeapon) {
          checkedProps = {
            'data.properties.melee': true,
            'data.properties.rngd': false,
            'data.properties.shotgun': false,
            'data.properties.brst': false,
            'data.properties.auto': false,
            'data.properties.dbrl': false
          }
        } else {
          checkedProps = {
            'data.properties.melee': false,
            'data.properties.rngd': true
          }
        }
      }
    } else if (this.type === 'skill' && !override) {
      let modif = false
      if (propertyId === 'combat') {
        if (!this.data.data.properties.combat) {
          // Close combat by default
          if (!this.data.data.properties.firearm) {
            fighting = true
          } else firearms = true
        } else {
          checkedProps = {
            'data.properties.combat': false,
            'data.properties.special': false,
            'data.properties.fighting': false,
            'data.properties.firearm': false,
            'data.specialization': '',
            name: this.data.data.skillName
          }
        }
        modif = true
      }

      if (propertyId === 'fighting') {
        if (!this.data.data.properties.fighting) {
          firearms = false
          fighting = true
        } else {
          firearms = true
          fighting = false
        }
        modif = true
      }

      if (propertyId === 'firearm') {
        if (!this.data.data.properties.firearm) {
          firearms = true
          fighting = false
        } else {
          firearms = false
          fighting = true
        }
        modif = true
      }

      if (modif) {
        // set specialisation if fighting or firearm
        if (fighting) {
          checkedProps = {
            'data.properties.fighting': true,
            'data.properties.firearm': false,
            'data.properties.combat': true,
            'data.properties.special': true
          }
          const parts = CoC7Item.getNamePartsSpec(
            this.data.data.skillName,
            game.i18n.localize(COC7.fightingSpecializationName)
          )
          checkedProps.name = parts.name
          checkedProps.skillName = parts.skillName
          checkedProps['data.specialization'] = parts.specialization
        }
        if (firearms) {
          checkedProps = {
            'data.properties.fighting': false,
            'data.properties.firearm': true,
            'data.properties.combat': true,
            'data.properties.special': true
          }
          const parts = CoC7Item.getNamePartsSpec(
            this.data.data.skillName,
            game.i18n.localize(COC7.firearmSpecializationName)
          )
          checkedProps.name = parts.name
          checkedProps.skillName = parts.skillName
          checkedProps['data.specialization'] = parts.specialization
        }
      }
    }

    if (propertyId === 'special') {
      if (this.data.data.properties[propertyId]) {
        checkedProps = {
          'data.properties.special': false,
          'data.properties.fighting': false,
          'data.properties.firearm': false,
          'data.properties.combat': false,
          'data.specialization': '',
          name: this.data.data.skillName
        }
      } else {
        checkedProps = {
          'data.properties.special': true,
          name:
            this.data.data.specialization +
            ' (' +
            this.data.data.skillName +
            ')'
        }
      }
    }

    if (Object.keys(checkedProps).length > 0) {
      const item = await this.update(checkedProps)
      return item
    } else {
      const propName = `data.properties.${propertyId}`
      const propValue = !this.data.data.properties[propertyId]
      await this.update({ [propName]: propValue }).then(item => {
        return item
      })
    }
  }

  hasProperty (propertyId) {
    return this.isIncludedInSet('properties', propertyId)
  }

  get shortName () {
    if (this.data.data.properties.special) {
      return this.data.data.skillName
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
        skillName: skillName
      }
    }
    const specNameRegex = new RegExp(
      '^(' + CoC7Utilities.quoteRegExp(specialization) + ')\\s*\\((.+)\\)$',
      'i'
    )
    const match = skillName.match(specNameRegex)
    if (match) {
      return {
        name: match[0],
        specialization: match[1],
        skillName: match[2]
      }
    }
    return {
      name: specialization + ' (' + skillName + ')',
      specialization: specialization,
      skillName: skillName
    }
  }

  static getNameWithoutSpec (item) {
    if (item instanceof CoC7Item) {
      if (item.data.data?.properties?.special) {
        return item.data.data.skillName
      }
    } else {
      if (item.data.properties?.special) {
        return item.data.skillName
      }
    }
    return item.name
  }

  static isAnySpec (item) {
    if (item instanceof CoC7Item) {
      if (item.type !== 'skill' || !item.data.data.properties?.special) {
        return false
      }
      return [
        game.i18n.localize('CoC7.AnySpecName').toLowerCase(),
        'any'
      ].includes(CoC7Item.getNameWithoutSpec(item).toLowerCase())
    } else {
      // Assume it's data only
      if (item.type !== 'skill' || !item.data.properties?.special) return false
      return [
        game.i18n.localize('CoC7.AnySpecName').toLowerCase(),
        'any'
      ].includes(CoC7Item.getNameWithoutSpec(item).toLowerCase())
    }
  }

  async checkSkillProperties () {
    if (this.type !== 'skill') return
    const checkedProps = {}
    if (this.data.data.properties.combat) {
      // if skill is not a specialisation make it a specialisation
      if (!this.data.data.properties.special) {
        this.data.data.properties.special = true
        checkedProps['data.properties.special'] = true
      }

      // If skill is combat skill and no specialisation set then make it a fighting( closecombat) skill
      if (
        !this.data.data.properties.fighting &&
        !this.data.data.properties.firearm
      ) {
        this.data.data.properties.fighting = true
        checkedProps['data.properties.fighting'] = true
      }

      // if skill is close combat without specialisation name make set it according to the fightingSpecializationName
      if (
        this.data.data.properties.fighting &&
        (!this.data.data.specialization || this.data.data.specialization === '')
      ) {
        this.data.data.specialization = game.i18n.localize(
          COC7.fightingSpecializationName
        )
        checkedProps['data.specialization'] = game.i18n.localize(
          COC7.fightingSpecializationName
        )
      }

      // if skill is range combat without a specialisation name make set it according to the firearmSpecializationName
      if (
        this.data.data.properties.firearm &&
        (!this.data.data.specialization || this.data.data.specialization === '')
      ) {
        this.data.data.specialization = game.i18n.localize(
          COC7.firearmSpecializationName
        )
        checkedProps['data.specialization'] = game.i18n.localize(
          COC7.firearmSpecializationName
        )
      }
    } else {
      if (this.data.data.properties.fighting) {
        this.data.data.properties.fighting = false
        checkedProps['data.properties.fighting'] = false
      }
      if (this.data.data.properties.firearm) {
        this.data.data.properties.firearm = false
        checkedProps['data.properties.firearm'] = false
      }
    }

    if (Object.keys(checkedProps).length > 0) {
      await this.update(checkedProps)
    }

    return checkedProps

    // for (const property in this.data.data.properties) {
    //  checkedProps[`data.data.properties${property}`] = true;
    // }
  }

  // async toggleInSet( set, propertyId){
  //  if( this.data.data[set][propertyId] == "false") this.data.data[set][propertyId] = "true"; else this.data.data[set][propertyId] = "false";
  // }

  isIncludedInSet (set, propertyId) {
    if (!this.data.data[set]) this.data.data[set] = []
    const propertyIndex = this.data.data[set].indexOf(propertyId)
    if (propertyIndex > -1) return true
    return false
  }

  async flagForDevelopement () {
    if (game.settings.get('CoC7', 'xpEnabled') || game.user.isGM) {
      if (!this.data.data.flags) {
        await this.update({ 'data.flags': {} })
      }
      await this.update({ 'data.flags.developement': true })
    }
  }

  async unflagForDevelopement () {
    if (game.settings.get('CoC7', 'xpEnabled') || game.user.isGM) {
      if (!this.data.data.flags) {
        await this.update({ 'data.flags': {} })
      }
      await this.update({ 'data.flags.developement': false })
    }
  }

  get developementFlag () {
    return this.getItemFlag('developement')
  }

  async toggleItemFlag (flagName, eraseAdjustment = true) {
    const flagValue = !this.getItemFlag(flagName)
    const name = `data.flags.${flagName}`
    if (
      (flagName === 'occupation' || flagName === 'archetype') &&
      !flagValue &&
      eraseAdjustment
    ) {
      await this.update({
        [`data.adjustments.${flagName}`]: null,
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
    await this.update({ [`data.flags.${flagName}`]: true })
  }

  async unsetItemFlag (flagName, eraseAdjustment = true) {
    const name = `data.flags.${flagName}`
    if (
      (flagName === 'occupation' || flagName === 'archetype') &&
      eraseAdjustment
    ) {
      await this.update({
        [`data.adjustments.${flagName}`]: null,
        [name]: false
      })
    } else await this.update({ [name]: false })
  }

  getItemFlag (flagName) {
    if (!this.data.data.flags) {
      this.data.data.flags = {}
      this.data.data.flags.locked = true
      this.update({ 'data.flags': {} })
      return false
    }

    if (!this.data.data.flags[flagName]) return false
    return this.data.data.flags[flagName]
  }

  get usesAlternativeSkill () {
    return (
      this.type === 'weapon' &&
      (this.data.data.properties?.auto === true ||
        this.data.data.properties?.brst === true ||
        this.data.data.properties?.thrown === true)
    )
  }

  get maxUsesPerRound () {
    if (this.type !== 'weapon') return null
    const multiShot = parseInt(this.data.data.usesPerRound.max)
    if (isNaN(multiShot)) return 0
    return multiShot
  }

  get usesPerRound () {
    if (this.type !== 'weapon') return null
    const singleShot = parseInt(this.data.data.usesPerRound.normal)
    if (isNaN(singleShot)) return 0
    return singleShot
  }

  get usesPerRoundString () {
    let usesPerRound
    if (this.data.data.usesPerRound.normal) {
      usesPerRound = this.data.data.usesPerRound.normal
    } else {
      usesPerRound = '1'
    }
    if (this.data.data.usesPerRound.max) {
      usesPerRound += `(${this.data.data.usesPerRound.max})`
    }
    if (this.data.data.properties.auto) {
      usesPerRound += ` ${game.i18n.localize('CoC7.WeaponAuto')}`
    }
    if (this.data.data.properties.brst) {
      usesPerRound += ` ${game.i18n.localize('CoC7.WeaponBrst')}`
      if (this.data.data.usesPerRound.burst) {
        usesPerRound += `(${this.data.data.usesPerRound.burst})`
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
    return parseInt(this.data.data.range.normal.value)
  }

  get longRange () {
    return parseInt(this.data.data.range.long.value)
  }

  get extremeRange () {
    return parseInt(this.data.data.range.extreme.value)
  }

  get skillProperties () {
    if (this.type !== 'skill') return []

    const skillProperties = []
    for (const [key, value] of Object.entries(COC7.skillProperties)) {
      if (this.data.data.properties[key] === true) {
        skillProperties.push(game.i18n.localize(value))
      }
    }
    return skillProperties
  }

  static async calculateBase (actor, data) {
    if (data.type !== 'skill') return null
    if (String(data.data.base).includes('@')) {
      const parsed = {}
      for (const [key, value] of Object.entries(COC7.formula.actorsheet)) {
        if (key.startsWith('@') && value.startsWith('this.actor.')) {
          parsed[key.substring(1)] = getProperty(actor, value.substring(11))
        }
      }
      let value
      try {
        value = Math.floor(
          new Roll(data.data.base, parsed).evaluate({
            maximize: true
          }).total
        )
      } catch (err) {
        value = 0
      }
      return value
    }
    return !isNaN(parseInt(data.data.base)) ? parseInt(data.data.base) : null
  }

  get _base () {
    if (this.type !== 'skill') return [null, false]
    if (typeof this.data.data.base !== 'string') {
      return [this.data.data.base, false]
    }

    if (this.data.data.base.includes('@')) {
      const parsed = {}
      for (const [key, value] of Object.entries(COC7.formula.actorsheet)) {
        if (key.startsWith('@') && value.startsWith('this.')) {
          parsed[key.substring(1)] = getProperty(this, value.substring(5))
        }
      }
      let value
      try {
        value = Math.floor(
          new Roll(this.data.data.base, parsed).evaluate({
            maximize: true
          }).total
        )
      } catch (err) {
        value = 0
      }

      return [value, true]
    }
    return [
      !isNaN(parseInt(this.data.data.base))
        ? parseInt(this.data.data.base)
        : null,
      false
    ]
  }

  async asyncBase () {
    const e = this._base
    if (e[1]) {
      await this.update({ 'data.base': e[0] })
    }
    return e[0]
  }

  get base () {
    const e = this._base
    if (e[1]) {
      this.update({ 'data.base': e[0] })
    }
    return e[0]
  }

  get value () {
    if (this.type !== 'skill') return null
    let value = 0
    if (this.actor.data.type === 'character') {
      value = this.base
      value += this.data.data.adjustments?.personal
        ? parseInt(this.data.data.adjustments?.personal)
        : 0
      value += this.data.data.adjustments?.occupation
        ? parseInt(this.data.data.adjustments?.occupation)
        : 0
      value += this.data.data.adjustments?.experience
        ? parseInt(this.data.data.adjustments?.experience)
        : 0
      if (
        game.settings.get('CoC7', 'pulpRuleArchetype') &&
        this.data.data.adjustments?.archetype
      ) {
        value += parseInt(this.data.data.adjustments?.archetype)
      }
    } else {
      value = parseInt(this.data.data.value)
    }
    return !isNaN(value) ? value : null
  }

  async updateValue (value) {
    if (this.type !== 'skill') return null
    if (this.actor.data.type === 'character') {
      const delta = parseInt(value) - this.value
      const exp =
        (this.data.data.adjustments?.experience
          ? parseInt(this.data.data.adjustments.experience)
          : 0) + delta
      await this.update({
        'data.adjustments.experience': exp > 0 ? exp : 0
      })
    } else await this.update({ 'data.value': value })
  }

  async increaseExperience (x) {
    if (this.type !== 'skill') return null
    if (this.actor.data.type === 'character') {
      const exp =
        (this.data.data.adjustments?.experience
          ? parseInt(this.data.data.adjustments.experience)
          : 0) + parseInt(x)
      await this.update({
        'data.adjustments.experience': exp > 0 ? exp : 0
      })
    }
  }

  getBulletLeft () {
    if (this.type !== 'weapon') return null
    if (!this.data.data.ammo) {
      this.setBullets(0)
      return 0
    }
    return this.data.data.ammo
  }

  async reload () {
    if (this.type !== 'weapon') return null
    const maxBullet = this.data.data.bullets
      ? parseInt(this.data.data.bullets)
      : 1
    await this.setBullets(maxBullet)
  }

  async setBullets (bullets) {
    if (this.type !== 'weapon') return null
    await this.update({ 'data.ammo': bullets || 0 })
  }

  async addBullet () {
    if (this.type !== 'weapon') return null
    const bullets = await this.getBulletLeft()
    const maxBullets = this.data.data.bullets
      ? parseInt(this.data.data.bullets)
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
      .sort((a, b) => {
        return a.name
          .toLocaleLowerCase()
          .localeCompare(b.name.toLocaleLowerCase())
      })
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
  getChatData (htmlOptions = {}) {
    const data = duplicate(this.data.data)
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
    data.description.value = TextEditor.enrichHTML(
      data.description.value,
      htmlOptions
    )
    data.description.value = CoC7Parser.enrichHTML(data.description.value)
    data.description.special = TextEditor.enrichHTML(
      data.description.special,
      htmlOptions
    )
    data.description.special = CoC7Parser.enrichHTML(data.description.special)

    // Item type specific properties
    const props = []
    const fn = this[`_${this.data.type}ChatData`]
    if (fn) fn.bind(this)(data, labels, props, htmlOptions)

    if (this.type === 'skill') {
      for (const [key, value] of Object.entries(COC7.skillProperties)) {
        if (this.data.data.properties[key] === true) props.push(value)
      }
    }

    // Filter properties and return
    data.properties = props.filter(p => !!p)
    data.labels = labels
    return data
  }

  _weaponChatData (data, labels, props) {
    for (const [key, value] of Object.entries(COC7.weaponProperties)) {
      if (this.data.data.properties[key] === true) props.push(value)
    }

    let skillLabel = game.i18n.localize('CoC7.Skill')
    let skillName = ''
    let found = false
    if (this.data.data.skill.main.id) {
      const skill = this.actor?.items.get(this.data.data.skill.main.id)
      if (skill) {
        skillName += CoC7Item.getNameWithoutSpec(skill)
        found = true
      }
    }

    if (this.usesAlternativeSkill && this.data.data.skill.alternativ.id) {
      skillLabel = game.i18n.localize('CoC7.Skills')
      const skill = this.actor?.items.get(this.data.data.skill.alternativ.id)
      if (skill) {
        skillName += `/${CoC7Item.getNameWithoutSpec(skill)}`
        found = true
      }
    }

    if (!found) {
      skillName = this.data.data.skill.main.name
      if (this.usesAlternativeSkill && this.data.data.skill.alternativ.name) {
        skillName += `/${this.data.data.skill.alternativ.name}`
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
      value: this.data.data.malfunction ? this.data.data.malfunction : '-'
    })

    if (this.data.data.bullets) {
      labels.push({
        name: game.i18n.localize('CoC7.WeaponBulletsInMag'),
        value: this.data.data.bullets
      })
    }
  }

  canBePushed () {
    if (this.type === 'skill' && this.data.data.properties.push) return true
    return false
  }

  get impale () {
    return this.data.data.properties.impl
  }

  get isDodge () {
    if (this.type !== 'skill') return false
    return (
      this.name.toLowerCase() ===
      game.i18n.localize('CoC7.DodgeSkillName').toLowerCase()
    )
  }
}
