/* global CONFIG foundry fromUuidSync game Item Roll TextEditor ui */
// cSpell:words mdrn drka glit nvct
import { FOLDER_ID } from '../../constants.js'
import deprecated from '../../deprecated.js'

export default class CoC7ModelsItemDocumentClass extends Item {
  /**
   * Create a content link for this document.
   * @param {object} eventData
   * @param {object} options
   * @param {ClientDocument} options.relativeTo
   * @param {string} options.label
   * @returns {string}
   */
  _createDocumentLink (eventData, { relativeTo, label } = {}) {
    if (typeof eventData.type === 'string' && typeof eventData.uuid === 'string' && eventData.type === 'Item' && eventData.uuid.match(/^Actor\./) && relativeTo instanceof CONFIG.JournalEntryPage.documentClass) {
      // If dropping a skill/weapon from an Actor onto a Journal Entry Page convert to a check link
      const item = fromUuidSync(eventData.uuid)
      if (['skill', 'weapon'].includes(item.type)) {
        return '@coc7.check[type:' + item.type + ',name:' + item.name + ']'
      }
    }
    return super._createDocumentLink(eventData, { relativeTo, label })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  hasProperty (propertyId) {
    deprecated.noReplacement({
      was: 'Item.hasProperty(propertyId)',
      until: 15
    })
    return this.isIncludedInSet('properties', propertyId)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get shortName () {
    deprecated.noReplacement({
      was: 'Item.shortName',
      until: 15
    })
    if (this.system.properties.special) {
      return this.system.skillName
    }
    return this.name
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async updateRoll (roll) {
    deprecated.noReplacement({
      was: 'Item.updateRoll(roll)',
      until: 15
    })
    if ('updateRoll' in this.sheet) return await this.sheet.updateRoll(roll)
    return undefined
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static getNamePartsSpec (skillName, specialization) {
    deprecated.warningLogger({
      was: 'Item.getNamePartsSpec(skillName, specialization)',
      now: 'CONFIG.Item.dataModels.skill.getNamePartsSpec(skillName, specialization)',
      until: 15
    })
    if (this.type === 'skill') {
      return CONFIG.Item.dataModels.skill.getNamePartsSpec(skillName, specialization)
    }
    return {
      name: skillName,
      specialization,
      skillName
    }
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static getNameWithoutSpec (item) {
    deprecated.noReplacement({
      was: 'Item.getNameWithoutSpec(item)',
      until: 15
    })
    if (item instanceof Item) {
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

  /**
   * Is item an any specialization skill
   * @param {object} document
   * @returns {boolean}
   */
  static isAnySpec (document) {
    if (document.type !== 'skill' || !document.system.properties.special) {
      return false
    }
    if (document.system.properties.requiresname || document.system.properties.picknameonly) {
      return true
    }
    return [
      game.i18n.localize('CoC7.AnySpecName').toLowerCase(),
      'any'
    ].includes(CONFIG.Item.dataModels.skill.guessNameParts(document.name).system.skillName.toLowerCase())
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  isIncludedInSet (set, propertyId) {
    deprecated.noReplacement({
      was: 'Item.isIncludedInSet(set, propertyId)',
      until: 15
    })
    if (!this.system[set]) this.system[set] = []
    const propertyIndex = this.system[set].indexOf(propertyId)
    if (propertyIndex > -1) return true
    return false
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async flagForDevelopement () {
    deprecated.warningLogger({
      was: 'Item.flagForDevelopement()',
      now: 'Skill.system.flags.developement',
      until: 15
    })
    if (this.type === 'skill') {
      if (game.settings.get(FOLDER_ID, 'xpEnabled') || game.user.isGM) {
        await this.update({ 'system.flags.developement': true })
      }
    }
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async unflagForDevelopement () {
    deprecated.warningLogger({
      was: 'Item.unflagForDevelopement()',
      now: 'Skill.system.flags.developement',
      until: 15
    })
    if (this.type === 'skill') {
      if (game.settings.get(FOLDER_ID, 'xpEnabled') || game.user.isGM) {
        await this.update({ 'system.flags.developement': false })
      }
    }
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get developementFlag () {
    deprecated.warningLogger({
      was: 'Item.developementFlag',
      now: 'Skill.system.flags.developement',
      until: 15
    })
    if (this.type !== 'skill') {
      return false
    }
    return this.system.flags.developement
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async toggleItemFlag (flagName, eraseAdjustment = true) {
    deprecated.warningLogger({
      was: 'Item.toggleItemFlag(flagName, eraseAdjustment)',
      now: 'Item.system.flags.(flagName)',
      until: 15
    })
    const flagValue = !(this.system.flags[flagName] ?? false)
    const updates = {
      ['system.flags.' + flagName]: flagValue
    }
    if ((flagName === 'occupation' || flagName === 'archetype') && !flagValue && eraseAdjustment) {
      updates['system.adjustments.' + flagName] = null
    } else if (flagName === 'developement') {
      if (!(game.settings.get(FOLDER_ID, 'xpEnabled') || game.user.isGM)) {
        ui.notifications.info(game.i18n.localize('CoC7.SkillXpGainDisabled'))
        return
      }
    }
    this.update(updates)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async setItemFlag (flagName) {
    deprecated.warningLogger({
      was: 'Item.setItemFlag(flagName)',
      now: 'Item.system.flags.(flagName)',
      until: 15
    })
    await this.update({ ['system.flags.' + flagName]: true })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async unsetItemFlag (flagName, eraseAdjustment = true) {
    deprecated.warningLogger({
      was: 'Item.unsetItemFlag(flagName, eraseAdjustment)',
      now: 'Item.system.flags.(flagName)',
      until: 15
    })
    const updates = {
      ['system.flags.' + flagName]: false
    }
    if ((flagName === 'occupation' || flagName === 'archetype') && eraseAdjustment) {
      updates['system.adjustments.' + flagName] = null
    }
    this.update(updates)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  getItemFlag (flagName) {
    deprecated.warningLogger({
      was: 'Item.getItemFlag(flagName)',
      now: 'Item.system.flags.(flagName)',
      until: 15
    })
    return this.system.flags[flagName] ?? false
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get usesAlternativeSkill () {
    deprecated.warningLogger({
      was: 'Item.usesAlternativeSkill',
      now: 'Weapon.system.usesAlternativeSkill',
      until: 15
    })
    if (this.type !== 'weapon') {
      return false
    }
    return this.system.usesAlternativeSkill
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get maxUsesPerRound () {
    deprecated.warningLogger({
      was: 'Item.maxUsesPerRound',
      now: 'Weapon.system.usesPerRound.max',
      until: 15
    })
    if (this.type !== 'weapon') {
      return 0
    }
    const max = parseInt(this.system.usesPerRound.max)
    if (isNaN(max)) {
      return 0
    }
    return max
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get usesPerRound () {
    deprecated.warningLogger({
      was: 'Item.usesPerRound',
      now: 'Weapon.system.usesPerRound.normal',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    return this.system.usesPerRound.normal
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get usesPerRoundString () {
    deprecated.warningLogger({
      was: 'Item.usesPerRoundString',
      now: 'Weapon.system.usesPerRoundString',
      until: 15
    })
    return this.system.usesPerRoundString
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get multipleShots () {
    deprecated.warningLogger({
      was: 'Item.multipleShots',
      now: 'Weapon.system.multipleShots',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    return this.system.multipleShots
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get singleShot () {
    deprecated.warningLogger({
      was: 'Item.singleShot',
      now: 'Weapon.system.singleShot',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    return this.system.singleShot
  }

  /**
   * @inheritdoc
   * @deprecated Temporary return non async value
   */
  get baseRange () {
    deprecated.warningLogger({
      was: 'Item.baseRange',
      now: 'async Weapon.system.baseRange()',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    const result = parseInt(this.system.range.normal.value)
    if (!isNaN(result)) {
      return result
    }
    return new Roll(this.system.range.normal.value, this.parent?.parsedValues() ?? {}).evaluateSync().total
  }

  /**
   * @inheritdoc
   * @deprecated Temporary return non async value
   */
  get longRange () {
    deprecated.warningLogger({
      was: 'Item.longRange',
      now: 'async Weapon.system.longRange()',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    const result = parseInt(this.system.range.long.value)
    if (!isNaN(result)) {
      return result
    }
    return new Roll(this.system.range.long.value, this.parent?.parsedValues() ?? {}).evaluateSync().total
  }

  /**
   * @inheritdoc
   * @deprecated Temporary return non async value
   */
  get extremeRange () {
    deprecated.warningLogger({
      was: 'Item.extremeRange',
      now: 'async Weapon.system.extremeRange()',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    const result = parseInt(this.system.range.extreme.value)
    if (!isNaN(result)) {
      return result
    }
    return new Roll(this.system.range.extreme.value, this.parent?.parsedValues() ?? {}).evaluateSync().total
  }

  /**
   * @inheritdoc
   * @deprecated No replacement
   */
  get skillProperties () {
    deprecated.noLongerAvailable({ was: 'Item.skillProperties' })
    return []
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  getBulletLeft () {
    deprecated.warningLogger({
      was: 'Item.getBulletLeft()',
      now: 'Weapon.system.ammo',
      until: 15
    })
    if (this.type !== 'weapon') {
      return 0
    }
    return this.system.ammo
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async reload () {
    deprecated.warningLogger({
      was: 'Item.reload()',
      now: 'Weapon.system.reload()',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    return this.system.reload()
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async setBullets (x) {
    deprecated.warningLogger({
      was: 'Item.setBullets(?)',
      now: 'Weapon.system.setBullets(?)',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    return this.system.setBullets(x)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async addBullet () {
    deprecated.warningLogger({
      was: 'Item.addBullet()',
      now: 'Weapon.system.addAmmunition()',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    return this.system.addAmmunition()
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async shootBullets (x) {
    deprecated.warningLogger({
      was: 'Item.shootBullets(?)',
      now: 'Weapon.system.shootAmmunition(?)',
      until: 15
    })
    if (this.type !== 'weapon') {
      return null
    }
    return this.system.shootAmmunition(x)
  }

  /**
   * Get parsed chat data for Item
   * @param {object|Document} object
   * @param {object} options
   * @param {boolean} options.editable
   * @param {null|Document} options.actor
   * @returns {object}
   */
  static async getChatData (object, { editable = false, actor = null } = {}) {
    const output = {
      description: {
        value: '',
        special: ''
      },
      labels: [],
      properties: []
    }
    if (typeof object.system.description.value !== 'undefined') {
      /* // FoundryVTT V12 */
      output.description.value = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
        object.system.description.value,
        {
          async: true,
          secrets: editable
        }
      )
    }
    if (typeof object.system.description.special !== 'undefined') {
      /* // FoundryVTT V12 */
      output.description.special = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
        object.system.description.special,
        {
          async: true,
          secrets: editable
        }
      )
    }
    for (const key in object.system.properties) {
      if (object.system.properties[key]) {
        output.properties.push(game.i18n.localize(CONFIG.Item.dataModels[object.type].defineSchema().properties.getField(key).label))
      }
    }
    if (typeof CONFIG.Item.dataModels[object.type]?.getChatData === 'function') {
      await CONFIG.Item.dataModels[object.type].getChatData(object, output, { editable, actor })
    }
    return output
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  canBePushed () {
    deprecated.warningLogger({
      was: 'Item.canBePushed',
      now: 'Skill.system.properties.push',
      until: 15
    })
    if (this.type === 'skill') {
      return this.system.properties.push
    }
    return false
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get impale () {
    deprecated.warningLogger({
      was: 'Item.impale',
      now: 'Weapon.system.properties.impl',
      until: 15
    })
    if (this.type === 'weapon') {
      return this.system.properties.impl
    }
    return false
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get isDodge () {
    deprecated.warningLogger({
      was: 'Item.isDodge',
      now: 'Skill.system.isDodge',
      until: 15
    })
    if (this.type === 'skill') {
      return this.system.isDodge
    }
    return false
  }

  /**
   * @inheritdoc
   * @param {object} data
   * @param {object} options
   * @param {documents.BaseUser} user
   * @returns {Promise<boolean|void>}
   */
  async _preCreate (data, options, user) {
    const changes = {}
    if (typeof data.img === 'undefined' && typeof CONFIG.Item.dataModels[data.type]?.defaultImg === 'string') {
      changes.img = CONFIG.Item.dataModels[data.type]?.defaultImg
    }
    if (typeof CONFIG.Item.dataModels[data.type]?._preCreateChanges === 'function') {
      CONFIG.Item.dataModels[data.type]._preCreateChanges(changes, data, options, user)
    }
    if (Object.keys(changes).length) {
      this.updateSource(changes)
    }
    return super._preCreate(data, options, user)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  get value () {
    deprecated.warningLogger({
      was: 'Item.value',
      now: 'Skill.system.value',
      until: 15
    })
    return this.system.value
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async cast (priv) {
    deprecated.warningLogger({
      was: 'Item.cast',
      now: 'Item.system.cast',
      until: 15
    })
    return this.system.cast(priv)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async attemptInitialReading () {
    deprecated.warningLogger({
      was: 'Item.attemptInitialReading()',
      now: 'Item.system.attemptInitialReading()',
      until: 15
    })
    return this.system.attemptInitialReading()
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async grantInitialReading () {
    deprecated.warningLogger({
      was: 'Item.grantInitialReading()',
      now: 'Item.system.grantInitialReading()',
      until: 15
    })
    return this.system.grantInitialReading()
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async grantSkillDevelopment (developments) {
    deprecated.warningLogger({
      was: 'Item.grantSkillDevelopment(?)',
      now: 'Item.system.grantSkillDevelopment(?)',
      until: 15
    })
    return this.system.grantSkillDevelopment(developments)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async showDevelopmentsTable (developments) {
    deprecated.warningLogger({
      was: 'Item.showDevelopmentsTable(?)',
      now: 'Item.system.showDevelopmentsTable(?)',
      until: 15
    })
    return this.system.showDevelopmentsTable(developments)
  }

  /**
   * Not required
   * @deprecated Temporary forward
   * @param {string} mode
   * @param {integer|undefined} value
   */
  async changeProgress (mode, value) {
    if (mode === 'increase' || mode === 'decrease') {
      deprecated.warningLogger({
        was: 'Item.changeProgress("' + mode + '")',
        now: 'CoC7ModelsItemBookSystem.alterProgress(?)',
        until: 15
      })
      this.system.alterProgress(mode === 'increase' ? 1 : -1)
    } else if (mode === 'reset') {
      deprecated.noLongerAvailable({ was: 'Item.changeProgress("reset", ?)' })
    }
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Migrate old Eras to coc id flag
    if (typeof source.system?.eras !== 'undefined' && typeof source.flags?.[FOLDER_ID]?.cocidFlag === 'undefined') {
      // 1920 => standard
      // mdrn => modern / modernPulp
      // pulp => pulp
      // ddts => downDarkerTrails / downDarkerTrailsPulp
      // drka => darkAges / darkAgesPulp
      // glit => gasLight
      // nvct => invictus
      let eras = {}
      for (const [key, value] of Object.entries(source.system.eras)) {
        if (value === true || (typeof value !== 'string' && typeof value.selected !== 'undefined')) {
          switch (key) {
            case '1920':
              eras.standard = true
              break
            case 'mdrn':
              eras.modern = true
              eras.modernPulp = true
              break
            case 'pulp':
              eras.pulp = true
              break
            case 'ddts':
              eras.downDarkerTrails = true
              eras.downDarkerTrailsPulp = true
              break
            case 'drka':
              eras.darkAges = true
              eras.darkAgesPulp = true
              break
            case 'glit':
              eras.gasLight = true
              break
            case 'nvct':
              eras.invictus = true
              break
          }
        }
      }
      if (source.type === 'setup') {
        // If more than one era take the first one only
        const key = Object.keys(eras)[0]
        if (key) {
          eras = { [key]: true }
        } else {
          // If no eras default to standard
          eras = { standard: true }
        }
      }
      foundry.utils.setProperty(source, 'flags.' + FOLDER_ID + '.cocidFlag', {
        id: '',
        lang: game.i18n.lang,
        priority: 0,
        eras
      })
    }
    return super.migrateData(source)
  }
}
