/* global Actor ChatMessage CONFIG CONST foundry fromUuid fromUuidSync game Hooks Roll TextEditor Token ui */
import { FOLDER_ID, STATUS_EFFECTS } from '../../constants.js'
import CoC7AverageRoll from '../../apps/average-roll.js'
import CoC7CharacteristicRollDialog from '../../apps/characteristic-roll-dialog.js'
import CoC7CharacteristicSelectionDialog from '../../apps/characteristic-selection-dialog.js'
import CoC7ChatCombatMelee from '../../apps/chat-combat-melee.js'
import CoC7ChatCombatRanged from '../../apps/chat-combat-ranged.js'
import CoC7Check from '../../apps/check.js'
import CoC7ConCheck from '../../apps/con-check.js'
import CoC7DicePool from '../../apps/dice-pool.js'
import CoC7ExperiencePackageDialog from '../../apps/experience-package-dialog.js'
import CoC7ModelsItemDocumentClass from '../item/document-class.js'
import CoC7ModelsItemArmorSystem from '../item/armor-system.js'
import CoC7ModelsItemBookSystem from '../item/book-system.js'
import CoC7ModelsItemItemSystem from '../item/item-system.js'
import CoC7ModelsItemSkillSystem from '../item/skill-system.js'
import CoC7ModelsItemSpellSystem from '../item/spell-system.js'
import CoC7ModelsItemWeaponSystem from '../item/weapon-system.js'
import CoC7PointSelectionDialog from '../../apps/point-selection-dialog.js'
import CoC7RollNormalize from '../../apps/roll-normalize.js'
import CoC7SkillSelectionDialog from '../../apps/skill-selection-dialog.js'
import CoC7SkillSpecializationSelectDialog from '../../apps/skill-specialization-select-dialog.js'
import CoC7Utilities from '../../apps/utilities.js'
import deprecated from '../../deprecated.js'

export default class CoC7ModelsActorDocumentClass extends Actor {
  /**
   * Not required
   * @deprecated No replacement
   */
  async initialize () {
    deprecated.noLongerAvailable({ was: 'Actor.initialize' })
  }

  /**
   * Before Data Models a single Actor class was used
   * @deprecated Temporary forward
   * @param {string} type
   * @returns {string}
   */
  static defaultImg (type) {
    deprecated.warningLogger({
      was: 'Actor.defaultImg(?)',
      now: 'TypeDataModel.defaultImg',
      until: 15
    })
    switch (type) {
      case 'container':
        return 'icons/svg/chest.svg'
      case 'creature':
        return 'systems/CoC7/assets/icons/floating-tentacles.svg'
      case 'npc':
        return 'systems/CoC7/assets/icons/cultist.svg'
    }
  }

  /**
   * Not required
   * @deprecated No replacement
   */
  get characteristics () { // eslint-disable-line getter-return
    deprecated.noLongerAvailable({ was: 'Actor.initialize' })
  }

  /**
   * Actor has Temporary Insanity
   * @returns {boolean}
   */
  get hasTempoInsane () {
    return this.hasConditionStatus(STATUS_EFFECTS.tempoInsane)
  }

  /**
   * Get Temporary insanity duration string
   * @returns {string}
   */
  get getTempoInsaneDurationText () {
    if (this.system.conditions.tempoInsane.value && this.system.conditions.tempoInsane.duration > 0) {
      return this.system.conditions.tempoInsane.duration + ' ' + game.i18n.localize(this.system.conditions.tempoInsane.realTime ? 'CoC7.rounds' : 'CoC7.hours')
    }
    return ''
  }

  /**
   * Actor has Indefinite Insanity
   * @returns {boolean}
   */
  get hasIndefInsane () {
    return this.hasConditionStatus(STATUS_EFFECTS.indefInsane)
  }

  /**
   * Portrait from token, prototype token, or actor
   * @returns {string}
   */
  get portrait () {
    if (!game.settings.get(FOLDER_ID, 'useToken')) return this.img
    return this.token?.texture?.src || this.prototypeToken?.texture?.src || this.img
  }

  /**
   * Pure Actor into a Bout of Madness
   * @param {boolean} realTime
   * @param {integer} duration
   * @returns {object}
   */
  async enterBoutOfMadness (realTime = true, duration = 1) {
    const result = {
      phobia: false,
      mania: false,
      name: '',
      description: null
    }
    const boutOfMadnessTableUuid = realTime ? game.settings.get(FOLDER_ID, 'boutOfMadnessRealTimeTable') : game.settings.get(FOLDER_ID, 'boutOfMadnessSummaryTable')
    if (boutOfMadnessTableUuid !== 'none') {
      const boutOfMadnessTable = await fromUuid(boutOfMadnessTableUuid)
      if (boutOfMadnessTable) {
        const tableRoll = await boutOfMadnessTable.roll()
        for (const tableResult of tableRoll.results) {
          /* // FoundryVTT V12 */
          let document
          if (game.release.generation === 12 && tableResult.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM) {
            document = await game.packs.get(tableResult.documentCollection)?.getDocument(tableResult.documentId)
            tableResult.type = CONST.TABLE_RESULT_TYPES.DOCUMENT
          }
          switch (tableResult.type) {
            case CONST.TABLE_RESULT_TYPES.DOCUMENT:
              /* // FoundryVTT V12 */
              if (typeof document === 'undefined') {
                const documentUuid = (tableResult.documentUuid ?? tableResult.documentCollection + '.' + tableResult.documentId)
                document = await fromUuid(documentUuid)
              }
              if (document && ['status'].includes(document.type)) {
                if (document.type === 'status') {
                  if (document.system.type.phobia) {
                    result.phobia = true
                  }
                  if (document.system.type.mania) {
                    result.mania = true
                  }
                }
                /* // FoundryVTT V12 */
                result.description = document.name + ':' + await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
                  document.system.description.value,
                  { async: true }
                )
                result.name = document.name
                const itemData = document.toObject()
                delete itemData._id
                await this.createEmbeddedDocuments('Item', [itemData])
              } else {
                ui.notifications.error('CoC7.MessageBoutOfMadnessItemNotFound', { localize: true })
              }
              break
            case CONST.TABLE_RESULT_TYPES.TEXT:
              /* // FoundryVTT V12 */
              result.description = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
                /* // FoundryVTT V12 */
                (game.release.generation === 12 ? tableResult.text : tableResult.name + (tableResult.name.length && tableResult.description.length ? ':' : '') + tableResult.description),
                { async: true }
              )
              break
          }
        }
      } else {
        ui.notifications.error('CoC7.MessageBoutOfMadnessTableNotFound', { localize: true })
      }
    }

    if (realTime) {
      this.conditionsSet([STATUS_EFFECTS.tempoInsane], {
        realTime,
        duration
      })
    }

    return result
  }

  /**
   * Not required
   * @deprecated Temporary forward
   * @param {string} skillName
   * @param {int|null} value
   * @param {object} options
   * @param {boolean} options.rarity
   * @param {boolean} options.push
   * @param {boolean} options.combat
   * @param {string} options.img
   * @param {boolean} options.specialization
   * @returns {object}
   */
  static emptySkill (skillName, value, { rarity = false, push = true, combat = false, img = false, specialization = false } = {}) {
    deprecated.warningLogger({
      was: 'Actor.emptySkill(?, ?, { ? })',
      now: 'CoC7ModelsItemSkillSystem.emptyObject({ ? })',
      until: 15
    })
    return CoC7ModelsItemSkillSystem.emptyObject({
      name: skillName,
      img: img ?? null,
      system: {
        value,
        properties: {
          combat,
          specialization,
          rarity,
          push
        }
      }
    })
  }

  /**
   * Create skill document in actor
   * @param {string} name
   * @param {int|null} value
   * @param {boolean} showSheet
   * @returns {Promise<Item[]>}
   */
  async createSkill (name, value, showSheet = false) {
    const data = CoC7ModelsItemSkillSystem.emptyObject({ name, system: { value } })
    const created = await this.createEmbeddedDocuments('Item', [data], {
      render: showSheet
    })
    return created
  }

  /**
   * Not required
   * @deprecated No replacement
   * @param {string} name
   * @param {bool} firearms
   * @param {int|null} base
   */
  async createWeaponSkill (name, firearms = false, base = null) {
    deprecated.noLongerAvailable({ was: 'Actor.createWeaponSkill(?, ?, ?)' })
  }

  /**
   * Not required
   * @deprecated No replacement
   */
  async creatureInit () {
    deprecated.noLongerAvailable({ was: 'Actor.creatureInit()' })
  }

  /**
   * Create item document in actor
   * @param {string} name
   * @param {int} quantity
   * @param {boolean} showSheet
   * @returns {Promise<Item[]>}
   */
  async createItem (name, quantity = 1, showSheet = false) {
    const data = CoC7ModelsItemItemSystem.emptyObject({ name, system: { quantity } })
    const created = await this.createEmbeddedDocuments('Item', [data], {
      render: showSheet
    })
    return created
  }

  /**
   * Create armor document in actor
   * @param {ClickEvent|null} event
   * @returns {Promise<Item[]>}
   */
  async createEmptyArmor (event = null) {
    const showSheet = event ? !event.shiftKey : true
    const uniqueName = this.uniqueItemName(game.i18n.localize('CoC7.NewArmorName'), 'armor')
    return this.createArmor(uniqueName, 1, showSheet)
  }

  /**
   * Create armor document in actor
   * @param {string} name
   * @param {int} value
   * @param {boolean} showSheet
   * @returns {Promise<Item[]>}
   */
  async createArmor (name, value = 0, showSheet = false) {
    const data = CoC7ModelsItemArmorSystem.emptyObject({
      name,
      effects: [
        {
          name: game.i18n.localize('TYPES.Item.armor'),
          img: 'icons/svg/shield.svg',
          changes: [
            {
              key: 'system.attribs.armor.value',
              mode: 2,
              value
            }
          ]
        }
      ]
    })
    const created = await this.createEmbeddedDocuments('Item', [data], {
      render: showSheet
    })
    return created
  }

  /**
   * Create book document in actor
   * @param {ClickEvent|null} event
   * @returns {Promise<Item[]>}
   */
  async createEmptyBook (event = null) {
    const showSheet = event ? !event.shiftKey : true
    const uniqueName = this.uniqueItemName(game.i18n.localize('CoC7.NewBookName'), 'book')
    return this.createBook(uniqueName, showSheet)
  }

  /**
   * Create book document in actor
   * @param {string} name
   * @param {boolean} showSheet
   * @returns {Promise<Item[]>}
   */
  async createBook (name, showSheet = false) {
    const data = CoC7ModelsItemBookSystem.emptyObject({ name })
    const created = await this.createEmbeddedDocuments('Item', [data], {
      render: showSheet
    })
    return created
  }

  /**
   * Create spell document in actor
   * @param {ClickEvent|null} event
   * @returns {Promise<Item[]>}
   */
  async createEmptySpell (event = null) {
    const showSheet = event ? !event.shiftKey : true
    const uniqueName = this.uniqueItemName(game.i18n.localize('CoC7.NewSpellName'), 'spell')
    return this.createSpell(uniqueName, showSheet)
  }

  /**
   * Not required
   * @deprecated Temporary forward
   * @param {string} itemName
   * @returns {object}
   */
  static emptySpell (itemName) {
    deprecated.warningLogger({
      was: 'Actor.emptySpell(?)',
      now: 'CoC7ModelsItemSpellSystem.emptyObject({ ? })',
      until: 15
    })
    return CoC7ModelsItemSpellSystem.emptyObject({ name: itemName })
  }

  /**
   * Create spell document in actor
   * @param {string} name
   * @param {boolean} showSheet
   * @returns {Promise<Item[]>}
   */
  async createSpell (name, showSheet = false) {
    const data = CoC7ModelsItemSpellSystem.emptyObject({ name })
    const created = await this.createEmbeddedDocuments('Item', [data], {
      render: showSheet
    })
    return created
  }

  /**
   * Create skill document in actor
   * @param {ClickEvent|null} event
   * @returns {Promise<Item[]>}
   */
  async createEmptySkill (event = null) {
    const showSheet = event ? !event.shiftKey : true
    const uniqueName = this.uniqueItemName(game.i18n.localize('CoC7.NewSkillName'), 'skill')
    return this.createSkill(uniqueName, (this.type !== 'character' ? 1 : null), showSheet)
  }

  /**
   * Create item document in actor
   * @param {ClickEvent|null} event
   * @returns {Promise<Item[]>}
   */
  async createEmptyItem (event = null) {
    const showSheet = event ? !event.shiftKey : true
    const uniqueName = this.uniqueItemName(game.i18n.localize('CoC7.NewItemName'), 'item')
    return this.createItem(uniqueName, 1, showSheet)
  }

  /**
   * Create weapon document in actor
   * @param {ClickEvent|null} event
   * @returns {Promise<Item[]>}
   */
  async createEmptyWeapon (event = null) {
    const showSheet = event ? !event.shiftKey : true
    const uniqueName = this.uniqueItemName(game.i18n.localize('CoC7.NewWeaponName'), 'weapon')
    const rngd = (event.currentTarget?.dataset.rngd?.toString() === 'true' || (event.currentTarget?.dataset.melee?.toString() ?? 'true') !== 'true')
    return this.createWeapon(uniqueName, rngd, showSheet)
  }

  /**
   * Create weapon document in actor
   * @param {string} name
   * @param {boolean} rngd
   * @param {boolean} showSheet
   * @returns {Promise<Item[]>}
   */
  async createWeapon (name, rngd = false, showSheet = false) {
    const data = CoC7ModelsItemWeaponSystem.emptyObject({ name, system: { properties: { rngd } } })
    const created = await this.createEmbeddedDocuments('Item', [data], {
      render: showSheet
    })
    return created
  }

  /**
   * Add Biography object to array
   * @param {string|null} title
   * @returns {Promise<Document|undefined>}
   */
  async createBioSection (title = null) {
    if (this.sheet.rendered) {
      this.sheet.scrollToNewLast('section.bio-section')
    }
    const biography = foundry.utils.duplicate(this.system.biography)
    biography.push({
      title,
      value: null
    })
    return await this.update({ 'system.biography': biography })
  }

  /**
   * Not required
   * @deprecated No replacement
   * @param {int} index
   * @param {string} content
   */
  async updateBioValue (index, content) {
    deprecated.noLongerAvailable({ was: 'Actor.updateBioValue(?, ?)' })
  }

  /**
   * Not required
   * @deprecated No replacement
   * @param {int} index
   * @param {string} title
   */
  async updateBioTitle (index, title) {
    deprecated.noLongerAvailable({ was: 'Actor.updateBioTitle(?, ?)' })
  }

  /**
   * Remove Biography object from array
   * @param {int} index
   * @returns {Promise<Document|undefined>}
   */
  async deleteBioSection (index) {
    const biography = foundry.utils.duplicate(this.system.biography)
    biography.splice(index, 1)
    return await this.update({ 'system.biography': biography })
  }

  /**
   * Move Biography array row
   * @param {int} index
   * @returns {Promise<Document|undefined>}
   */
  async moveBioSectionUp (index) {
    const biography = foundry.utils.duplicate(this.system.biography)
    if (index === 0 || typeof biography[index] === 'undefined') return
    const row = biography.splice(index, 1)[0]
    biography.splice(index - 1, 0, row)
    return await this.update({ 'system.biography': biography })
  }

  /**
   * Move Biography array row
   * @param {int} index
   * @returns {Promise<Document|undefined>}
   */
  async moveBioSectionDown (index) {
    const biography = foundry.utils.duplicate(this.system.biography)
    if (typeof biography[index] === 'undefined') return
    const row = biography.splice(index, 1)[0]
    biography.splice(index + 1, 0, row)
    return await this.update({ 'system.biography': biography })
  }

  /**
   * Create multiple embedded Document instances within this parent Document using provided input data.
   * @param {string} embeddedName
   * @param {object[]} dataArray
   * @param {DatabaseCreateOperation} [operation]
   * @returns {Promise<Document[]>}
   */
  async createEmbeddedDocuments (embeddedName, dataArray = [], operation = {}) {
    if (embeddedName === 'Item') {
      let archetype = false
      let occupation = false
      let setup = false
      const itemByType = {}
      const processedDataArray = []
      const updateDocument = {}
      const updateEmbeddedDocuments = []
      for (const data of dataArray) {
        switch (data.type) {
          case 'skill':
          case 'weapon':
            if (typeof itemByType[data.type] === 'undefined') {
              itemByType[data.type] = []
            }
            itemByType[data.type].push(foundry.utils.duplicate(data))
            break
          case 'setup':
            await this.prepareEmbeddedSetup(data, updateDocument, itemByType)
            setup = true
            break
          case 'archetype':
            // archetypes are only for PCs
            if (this.type === 'character') {
              if ((await this.prepareEmbeddedArchetype(data, updateDocument, itemByType, processedDataArray)) === true) {
                archetype = true
              }
            }
            break
          case 'occupation':
            // occupations are only for PCs
            if (this.type === 'character') {
              if ((await this.prepareEmbeddedOccupation(data, updateDocument, itemByType, processedDataArray, updateEmbeddedDocuments)) === true) {
                occupation = true
              }
            }
            break
          case 'experiencePackage':
            // experience package are only for PCs
            if (this.type === 'character') {
              await this.prepareEmbeddedExperiencePackage(data, updateDocument, itemByType, processedDataArray, updateEmbeddedDocuments)
            }
            break
          default:
            processedDataArray.push(data)
            break
        }
      }
      if (Object.keys(updateDocument).length > 0) {
        await this.update(updateDocument, { renderSheet: false })
        Object.keys(updateDocument).map(k => delete updateDocument[k])
      }
      let processed = []
      if (typeof itemByType.skill !== 'undefined') {
        processed = processed.concat(await this.prepareEmbeddedSkills(itemByType.skill, updateDocument, updateEmbeddedDocuments))
        // Create the skills in case they are needed for weapons
        processed = processed.concat(await super.createEmbeddedDocuments('Item', itemByType.skill, operation))
      }
      if (typeof itemByType.weapon !== 'undefined') {
        await this.prepareEmbeddedWeapons(itemByType.weapon, updateDocument, processedDataArray, updateEmbeddedDocuments)
        processed = processed.concat(await super.createEmbeddedDocuments('Item', itemByType.weapon, operation))
      }
      if (Object.keys(updateEmbeddedDocuments).length > 0) {
        await this.updateEmbeddedDocuments('Item', updateEmbeddedDocuments, { renderSheet: false })
      }
      if (Object.keys(updateDocument).length > 0) {
        await this.update(updateDocument, { renderSheet: true })
      }
      if (processedDataArray.length > 0) {
        processed = processed.concat(await super.createEmbeddedDocuments('Item', processedDataArray, operation))
      }
      if (archetype) {
        Hooks.call('archetypeFinishedCoC7')
      }
      if (occupation) {
        Hooks.call('occupationFinishedCoC7')
      }
      if (setup) {
        Hooks.call('setupFinishedCoC7')
      }
      return processed
    }
    return super.createEmbeddedDocuments(embeddedName, dataArray, operation)
  }

  /**
   * Prepare skill data for embedding
   * @param {Array} skills
   * @param {object} updateDocument
   * @param {Array} updateEmbeddedDocuments
   * @returns {object}
   */
  async prepareEmbeddedSkills (skills, updateDocument, updateEmbeddedDocuments) {
    const existingCoCIds = this.items.filter(d => d.type === 'skill').reduce((c, d) => { if (d.flags[FOLDER_ID]?.cocidFlag?.id) { c[d.flags[FOLDER_ID].cocidFlag.id] = { _id: d._id, flags: d.system.flags } } return c }, {})
    const existingNames = this.items.filter(d => d.type === 'skill').reduce((c, d) => { c[d.name] = { _id: d._id, flags: d.system.flags }; return c }, {})
    let removable = []
    const processed = []
    const skillFlags = ['archetype', 'experiencePackage', 'occupation']
    for (const offset in skills) {
      const skill = skills[offset]
      const hasSkillFlag = skillFlags.some(flag => skill.system.flags?.[flag] === true)
      let isAnySpec = CoC7ModelsItemDocumentClass.isAnySpec(skill)
      if (isAnySpec) {
        let skillList = []
        if (hasSkillFlag) {
          skillList = this.items.filter(d => d.type === 'skill' && d.system.properties?.special && d.system.specialization === skill.system.specialization && skillFlags.some(flag => skill.system.flags?.[flag] === true && d.system.flags?.[flag] === false))
        }
        const group = game.CoC7.cocid.guessGroupFromDocument(skill)
        if (group) {
          const existingKeys = skillList.reduce((c, d) => {
            c.push(d.name)
            if (d.flags[FOLDER_ID]?.cocidFlag?.id) {
              c.push(d.flags[FOLDER_ID]?.cocidFlag?.id)
            }
            return c
          }, [])
          const others = (await game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: new RegExp('^' + CoC7Utilities.quoteRegExp(group) + '.+$'), type: 'i' })).filter(item => {
            return item.system.properties.special && !item.system.properties.requiresname && !item.system.properties.picknameonly
          })
          skillList = skillList.concat(others.filter(d => !existingKeys.includes(d.name) && (!d.flags[FOLDER_ID]?.cocidFlag?.id || !existingKeys.includes(d.flags[FOLDER_ID]?.cocidFlag?.id))))
        }
        if (skillList.length > 0) {
          skillList.sort(CoC7Utilities.sortByNameKey)
        }
        const skillData = await CoC7SkillSpecializationSelectDialog.create({
          skills: skillList,
          allowCustom: (skill.system.properties?.requiresname ?? false),
          fixedBaseValue: (skill.system.properties?.keepbasevalue ?? false),
          specializationName: skill.system.specialization,
          label: skill.name,
          baseValue: skill.system.base
        })
        if (skillData === false) {
          // Closed without selection
          removable.push(offset)
        } else if (skillData.selected) {
          // Existing skill
          skills[offset] = skillList.find(d => d._id === skillData.selected)
          if (hasSkillFlag) {
            for (const flag of skillFlags) {
              if (skill.system.flags[flag] === true && skills[offset].system.flags[flag] === false) {
                foundry.utils.setProperty(skills[offset], 'system.flags.' + flag, true)
              }
            }
          }
          isAnySpec = false
        } else {
          // Set name and base
          const parts = CoC7ModelsItemSkillSystem.getNamePartsSpec(skillData.name, skill.system.specialization)
          if (!skill.system.properties?.keepbasevalue) {
            skill.system.base = skillData.baseValue
          }
          skills[offset].name = parts.name
          skills[offset].system.skillName = parts.skillName
          foundry.utils.setProperty(skills[offset], 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.skill.' + CoC7Utilities.toKebabCase(skills[offset].name))
          foundry.utils.setProperty(skills[offset], 'system.properties.requiresname', false)
          foundry.utils.setProperty(skills[offset], 'system.properties.picknameonly', false)
          foundry.utils.setProperty(skills[offset], 'system.properties.keepbasevalue', false)
          isAnySpec = false
        }
      }
      if (!isAnySpec) {
        const skill = skills[offset]
        let existing = false
        if (Object.keys(existingCoCIds).includes(skill.flags?.[FOLDER_ID]?.cocidFlag?.id)) {
          existing = existingCoCIds[skill.flags[FOLDER_ID]?.cocidFlag?.id]
        } else if (Object.keys(existingNames).includes(skill.name)) {
          existing = existingNames[skill.name]
        }
        if (existing !== false) {
          // Existing skill, add skill to embedded documents and remove from list
          const changes = {}
          for (const flag of skillFlags) {
            if (skill.system.flags[flag] === true && existing.flags[flag] === false) {
              changes['system.flags.' + flag] = true
            }
          }
          if (Object.keys(changes).length) {
            changes._id = existing._id
            updateEmbeddedDocuments.push(changes)
          }
          processed.push(this.items.get(existing._id))
          removable.push(offset)
        }
      }
    }
    removable = removable.reverse()
    for (const offset of removable) {
      skills.splice(offset, 1)
    }
    const parsedValues = this.parsedValues()
    await CoC7Utilities.setMultipleSkillBases(parsedValues, skills)
    return processed
  }

  /**
   * Prepare skill data for embedding
   * @param {Array} weapons
   * @param {object} updateDocument
   * @param {Array} processedDataArray
   * @param {Array} updateEmbeddedDocuments
   * @returns {object}
   */
  async prepareEmbeddedWeapons (weapons, updateDocument, processedDataArray, updateEmbeddedDocuments) {
    if (!['container'].includes(this.type)) {
      for (const offset in weapons) {
        const weapon = weapons[offset]
        for (const key of ['main', 'alternativ']) {
          const skillName = weapon.system?.skill?.[key]?.name
          if (skillName) {
            const skill = await this.getItemOrAdd(skillName, 'skill')
            if (skill) {
              foundry.utils.setProperty(weapons[offset], 'system.skill.' + key + '.id', skill.id)
              foundry.utils.setProperty(weapons[offset], 'system.skill.' + key + '.name', skill.name)
            }
          }
        }
      }
    }
  }

  /**
   * Replace Setup Items
   * @param {object} data
   * @param {object} updateDocument
   * @param {object} itemByType
   * @returns {boolean|undefined}
   */
  async prepareEmbeddedSetup (data, updateDocument, itemByType) {
    if (data.system.enableCharacterisitics) {
      const config = {
        isPoints: data.system.characteristics.points.enabled,
        isRolls: data.system.characteristics.rolls.enabled,
        points: data.system.characteristics.points.value,
        attribs: {
          luck: {
            formula: data.system.characteristics.rolls.luck,
            value: this.system.attribs.lck.value
          }
        },
        characteristics: {}
      }
      for (const key of this.system.schema.getField('characteristics').keys()) {
        config.characteristics[key] = {
          formula: data.system.characteristics.rolls[key],
          value: this.system.characteristics[key].value
        }
      }
      const rolled = await CoC7CharacteristicRollDialog.create(config)
      updateDocument['system.attribs.lck.value'] = rolled.luck
      for (const key of this.system.schema.getField('characteristics').keys()) {
        if (key === 'luck') {
          updateDocument['system.attribs.' + key + '.value'] = rolled[key]
        } else {
          updateDocument['system.characteristics.' + key + '.value'] = rolled[key]
          updateDocument['system.characteristics.' + key + '.formula'] = data.system.characteristics.rolls[key]
        }
      }
      const characteristics = foundry.utils.expandObject(updateDocument).system.characteristics
      const hpMax = CoC7ModelsActorDocumentClass.hpFromCharacteristics(characteristics, this.type)
      updateDocument['system.attribs.hp.value'] = hpMax
      updateDocument['system.attribs.hp.max'] = hpMax
      updateDocument['system.attribs.san.value'] = updateDocument['system.characteristics.pow.value']
      updateDocument['system.attribs.mp.max'] = Math.floor(updateDocument['system.characteristics.pow.value'] / 5)
      updateDocument['system.attribs.san.dailyLimit'] = updateDocument['system.attribs.mp.max']
      updateDocument['system.attribs.mp.value'] = updateDocument['system.attribs.mp.max']
      updateDocument['system.development.personal'] = updateDocument['system.characteristics.int.value'] * 2
    }
    if (game.settings.get(FOLDER_ID, 'oneBlockBackstory')) {
      updateDocument['system.backstory'] = data.system.backstory
    } else {
      const bioSections = foundry.utils.duplicate(this.system.biography)
      let changed = false
      for (const sectionName of data.system.bioSections) {
        const title = game.i18n.localize(sectionName)
        if (!this.system.biography?.find(o => title === o.title) && sectionName) {
          bioSections.push({
            title,
            value: null
          })
          changed = true
        }
      }
      if (changed) {
        updateDocument['system.biography'] = bioSections
      }
    }
    updateDocument['system.monetary'] = foundry.utils.mergeObject(this.system.monetary, foundry.utils.duplicate(data.system.monetary))
    for (const item of await CoC7Utilities.getEmbeddedItems(data, 'system')) {
      if (typeof itemByType[item.type] === 'undefined') {
        itemByType[item.type] = []
      }
      itemByType[item.type].push(foundry.utils.duplicate(item))
    }
  }

  /**
   * Prepare Archetype Item
   * @param {object} data
   * @param {object} updateDocument
   * @param {object} itemByType
   * @param {Array} processedDataArray
   * @returns {boolean|undefined}
   */
  async prepareEmbeddedArchetype (data, updateDocument, itemByType, processedDataArray) {
    if (this.archetype) {
      const replace = await foundry.applications.api.DialogV2.wait({
        classes: ['coc7', 'dialog'],
        window: {
          title: game.i18n.localize('CoC7.ResetArchetype')
        },
        content: `<p>${game.i18n.format('CoC7.ResetArchetypeHint', { name: this.name })}</p>`,
        buttons: [
          {
            action: 'no',
            icon: 'fa-solid fa-times',
            label: game.i18n.localize('No')
          },
          {
            action: 'yes',
            icon: 'fa-solid fa-check',
            label: game.i18n.localize('Yes')
          }
        ]
      })
      if (replace === 'yes') {
        await this.resetArchetype()
      } else {
        return
      }
    }
    const coreCharacteristics = Object.entries(data.system.coreCharacteristics).filter(e => e[1]).map(e => {
      return {
        key: e[0],
        label: this.system.schema.getField('characteristics').getField(e[0]).hint,
        value: this.system.characteristics[e[0]].value
      }
    })
    let coreCharacteristic
    if (coreCharacteristics.length === 1) {
      coreCharacteristic = coreCharacteristics[0]
    } else if (coreCharacteristics.length > 1) {
      const key = await CoC7CharacteristicSelectionDialog.create({
        characteristics: coreCharacteristics,
        title: game.i18n.localize('CoC7.SelectCoreCharac')
      })
      coreCharacteristic = coreCharacteristics.find(o => o.key === key)
    }
    if (typeof coreCharacteristic.key === 'undefined') {
      return
    }
    Object.keys(data.system.coreCharacteristics).forEach(k => {
      if (k !== coreCharacteristic.key) {
        data.system.coreCharacteristics[k] = false
      }
    })
    if (data.system.coreCharacteristicsFormula.enabled) {
      const roll = await new Roll(data.system.coreCharacteristicsFormula.value).roll()
      roll.toMessage({
        flavor: game.i18n.format(
          'CoC7.MessageRollingCharacteristic',
          {
            label: game.i18n.localize(coreCharacteristic.label),
            formula: data.system.coreCharacteristicsFormula.value
          }
        )
      })
      if (roll.total > coreCharacteristic.value) {
        updateDocument['system.characteristics.' + coreCharacteristic.key + '.value'] = roll.total
        if (coreCharacteristic.key === 'int') {
          updateDocument['system.development.personal'] = updateDocument['system.characteristics.int.value'] * 2
        }
      }
    }
    for (const item of await CoC7Utilities.getEmbeddedItems(data, 'system')) {
      const newItem = foundry.utils.duplicate(item)
      if (typeof itemByType[newItem.type] === 'undefined') {
        itemByType[newItem.type] = []
      }
      if (newItem.type === 'skill') {
        newItem.system.flags.archetype = true
      }
      itemByType[newItem.type].push(newItem)
    }
    processedDataArray.push(data)
    updateDocument['system.development.archetype'] = data.system.bonusPoints
    return true
  }

  /**
   * Prepare Occupation Item
   * @param {object} data
   * @param {object} updateDocument
   * @param {object} itemByType
   * @param {Array} processedDataArray
   * @param {Array} updateEmbeddedDocuments
   * @returns {boolean|undefined}
   */
  async prepareEmbeddedOccupation (data, updateDocument, itemByType, processedDataArray, updateEmbeddedDocuments) {
    if (this.occupation) {
      const replace = await foundry.applications.api.DialogV2.wait({
        classes: ['coc7', 'dialog'],
        window: {
          title: game.i18n.localize('CoC7.ResetOccupation')
        },
        content: `<p>${game.i18n.format('CoC7.ResetOccupationHint', { name: this.name })}</p>`,
        buttons: [
          {
            action: 'no',
            icon: 'fa-solid fa-times',
            label: game.i18n.localize('No')
          },
          {
            action: 'yes',
            icon: 'fa-solid fa-check',
            label: game.i18n.localize('Yes')
          }
        ]
      })
      if (replace === 'yes') {
        await this.resetOccupation()
      } else {
        return
      }
    }
    const markedSkills = []
    for (const item of await CoC7Utilities.getEmbeddedItems(data, 'system')) {
      const newItem = foundry.utils.duplicate(item)
      if (typeof itemByType[newItem.type] === 'undefined') {
        itemByType[newItem.type] = []
      }
      if (newItem.type === 'skill') {
        newItem.system.flags.occupation = true
      }
      itemByType[newItem.type].push(newItem)
    }
    if (Number(data.system.creditRating.max) > 0) {
      // Occupations with a credit rating require a credit rating skill
      const actorCreditRating = game.CoC7.cocid.findCocIdInList('i.skill.credit-rating', itemByType.skill ?? [])
      if (actorCreditRating.length === 0) {
        const actorCreditRating = game.CoC7.cocid.findCocIdInList('i.skill.credit-rating', this.items)
        if (actorCreditRating.length === 0) {
          const actorCreditRating = await game.CoC7.cocid.fromCoCID('i.skill.credit-rating')
          if (actorCreditRating.length) {
            const newItem = foundry.utils.duplicate(actorCreditRating[0])
            if (typeof itemByType.skill === 'undefined') {
              itemByType.skill = []
            }
            newItem.system.flags.occupation = true
            newItem.system.adjustments.occupation = data.system.creditRating.min ?? 0
            itemByType.skill.push(newItem)
          }
        } else {
          updateEmbeddedDocuments.push({
            _id: actorCreditRating[0].id,
            'system.adjustments.occupation': data.system.creditRating.min ?? 0,
            'system.flags.occupation': true
          })
          markedSkills.push(actorCreditRating[0].name, 'i.skill.credit-rating')
        }
      } else {
        updateEmbeddedDocuments.push({
          _id: actorCreditRating[0].id,
          'system.adjustments.occupation': data.system.creditRating.min ?? 0,
          'system.flags.occupation': true
        })
        markedSkills.push(actorCreditRating[0].name, 'i.skill.credit-rating')
      }
    }

    const characteristicFixed = []
    const characteristicOptional = []
    let totalPoints = 0
    for (const key of this.system.schema.getField('characteristics').keys()) {
      if (data.system.occupationSkillPoints[key].selected) {
        const row = {
          key,
          label: this.system.schema.getField('characteristics').getField(key).hint,
          multiplier: data.system.occupationSkillPoints[key].multiplier,
          total: (data.system.occupationSkillPoints[key].multiplier ?? 0) * (this.system.characteristics[key].value ?? 0),
          value: this.system.characteristics[key].value
        }
        if (data.system.occupationSkillPoints[key].optional) {
          characteristicOptional.push(row)
        } else {
          characteristicFixed.push(row)
          totalPoints += row.total
        }
      }
    }
    if (characteristicOptional.length > 0) {
      const rolled = await CoC7PointSelectionDialog.create({ characteristicFixed, characteristicOptional })
      totalPoints += characteristicOptional.find(r => r.key === rolled).total
    }
    updateDocument['system.development.occupation'] = totalPoints
    for (const index in data.system.groups) {
      const skills = await CoC7Utilities.getEmbeddedItems(data, 'system.groups.' + index)
      if (skills.length <= data.system.groups[index].options) {
        /* // FoundryVTT V12 */
        ui.notifications.info(game.i18n.format('CoC7.InfoLessSkillThanOptions', {
          skillCount: skills.length,
          optionsCount: data.system.groups[index].options
        }))
        for (const item of skills) {
          const newItem = foundry.utils.duplicate(item)
          if (typeof itemByType[newItem.type] === 'undefined') {
            itemByType[newItem.type] = []
          }
          if (newItem.type === 'skill') {
            newItem.system.flags.occupation = true
          }
          itemByType[newItem.type].push(newItem)
        }
      } else {
        const rolled = await CoC7SkillSelectionDialog.create({ skills, optionsCount: data.system.groups[index].options })
        for (const item of skills) {
          if (rolled[item._id] === true) {
            const newItem = foundry.utils.duplicate(item)
            if (typeof itemByType[newItem.type] === 'undefined') {
              itemByType[newItem.type] = []
            }
            if (newItem.type === 'skill') {
              newItem.system.flags.occupation = true
            }
            itemByType[newItem.type].push(newItem)
          }
        }
      }
    }
    if (data.system.personal > 0) {
      for (const skill of itemByType.skill ?? []) {
        markedSkills.push(skill.name)
        if (skill.flags[FOLDER_ID]?.cocidFlag?.id) {
          markedSkills.push(skill.flags[FOLDER_ID].cocidFlag.id)
        }
      }
      const skills = this.items.filter(d => d.type === 'skill' && !d.system.flags.occupation && !d.system.properties.noxpgain && !markedSkills.includes(d.name) && !markedSkills.includes(d.flags[FOLDER_ID]?.cocidFlag?.id))
      if (skills.length < data.system.personal) {
        /* // FoundryVTT V12 */
        ui.notifications.info(game.i18n.format('CoC7.InfoLessSkillThanOptions', {
          skillCount: skills.length,
          optionsCount: data.system.personal
        }))
        for (const item of skills) {
          const newItem = foundry.utils.duplicate(item)
          if (typeof itemByType[newItem.type] === 'undefined') {
            itemByType[newItem.type] = []
          }
          if (newItem.type === 'skill') {
            newItem.system.flags.occupation = true
          }
          itemByType[newItem.type].push(newItem)
        }
      } else {
        skills.sort(CoC7Utilities.sortByNameKey)
        const title = data.system.personal + ' ' + game.i18n.localize(data.system.personalText === '' ? 'CoC7.PersonalSpecialityPlaceholder' : data.system.personalText)
        const rolled = await CoC7SkillSelectionDialog.create({ skills, optionsCount: data.system.personal, title })
        for (const item of skills) {
          if (rolled[item._id] === true) {
            const newItem = foundry.utils.duplicate(item)
            if (typeof itemByType[newItem.type] === 'undefined') {
              itemByType[newItem.type] = []
            }
            if (newItem.type === 'skill') {
              newItem.system.flags.occupation = true
            }
            itemByType[newItem.type].push(newItem)
          }
        }
      }
    }
    processedDataArray.push(data)
    return true
  }

  /**
   * Prepare Archetype Item
   * @param {object} data
   * @param {object} updateDocument
   * @param {object} itemByType
   * @param {Array} processedDataArray
   * @param {Array} updateEmbeddedDocuments
   * @returns {boolean|undefined}
   */
  async prepareEmbeddedExperiencePackage (data, updateDocument, itemByType, processedDataArray, updateEmbeddedDocuments) {
    if (this.experiencePackage) {
      // NOP
    } else if (game.settings.get(FOLDER_ID, 'pulpRuleArchetype')) {
      ui.notifications.error('CoC7.ErrorExperiencePackageArchetype', { localize: true })
    } else if (this.type !== 'character') {
      // experience packages are only for PCs
      ui.notifications.error('CoC7.ErrorExperiencePackageNotInvestigator', { localize: true })
    } else if (!game.user.isGM) {
      ui.notifications.error('CoC7.ErrorExperiencePackageNotGM', { localize: true })
    } else {
      const rolled = await CoC7ExperiencePackageDialog.create(data.system)
      if (rolled) {
        for (const item of await CoC7Utilities.getEmbeddedItems(data, 'system')) {
          const newItem = foundry.utils.duplicate(item)
          if (typeof itemByType[newItem.type] === 'undefined') {
            itemByType[newItem.type] = []
          }
          if (newItem.type === 'skill') {
            newItem.system.flags.experiencePackage = true
          }
          itemByType[newItem.type].push(newItem)
        }
        for (const index in data.system.groups) {
          const skills = await CoC7Utilities.getEmbeddedItems(data, 'system.groups.' + index)
          if (skills.length <= data.system.groups[index].options) {
            /* // FoundryVTT V12 */
            ui.notifications.info(game.i18n.format('CoC7.InfoLessSkillThanOptions', {
              skillCount: skills.length,
              optionsCount: data.system.groups[index].options
            }))
            for (const item of skills) {
              const newItem = foundry.utils.duplicate(item)
              if (typeof itemByType[newItem.type] === 'undefined') {
                itemByType[newItem.type] = []
              }
              if (newItem.type === 'skill') {
                newItem.system.flags.experiencePackage = true
              }
              itemByType[newItem.type].push(newItem)
            }
          } else {
            const rolled = await CoC7SkillSelectionDialog.create({ skills, optionsCount: data.system.groups[index].options })
            for (const item of skills) {
              if (rolled[item._id] === true) {
                const newItem = foundry.utils.duplicate(item)
                if (typeof itemByType[newItem.type] === 'undefined') {
                  itemByType[newItem.type] = []
                }
                if (newItem.type === 'skill') {
                  newItem.system.flags.experiencePackage = true
                }
                itemByType[newItem.type].push(newItem)
              }
            }
          }
        }
        if (rolled['i.skill.cthulhu-mythos'] > 0) {
          const cthulhuMythosSkill = game.CoC7.cocid.findCocIdInList('i.skill.cthulhu-mythos', itemByType.skill ?? [])
          if (cthulhuMythosSkill.length === 0) {
            const cthulhuMythosSkill = game.CoC7.cocid.findCocIdInList('i.skill.cthulhu-mythos', this.items)
            if (cthulhuMythosSkill.length === 0) {
              const cthulhuMythosSkill = await game.CoC7.cocid.fromCoCID('i.skill.cthulhu-mythos')
              if (cthulhuMythosSkill.length) {
                const newItem = foundry.utils.duplicate(cthulhuMythosSkill[0])
                if (typeof itemByType.skill === 'undefined') {
                  itemByType.skill = []
                }
                newItem.system.adjustments.experiencePackage = rolled['i.skill.cthulhu-mythos']
                itemByType.skill.push(newItem)
              }
            } else {
              updateEmbeddedDocuments.push({
                _id: cthulhuMythosSkill[0].id,
                'system.adjustments.experiencePackage': rolled['i.skill.cthulhu-mythos']
              })
            }
          } else {
            updateEmbeddedDocuments.push({
              _id: cthulhuMythosSkill[0].id,
              'system.adjustments.experiencePackage': rolled['i.skill.cthulhu-mythos']
            })
          }
        }
        if (rolled.SAN > 0) {
          updateDocument['system.attribs.san.value'] = parseInt(this.system.attribs.san.value ?? 0, 10) - rolled.SAN
        }
        if (rolled.encounters.length > 0) {
          updateDocument['system.sanityLossEvents'] = this.system.sanityLossEvents.concat(rolled.encounters)
        }
        if (rolled.backstory.length > 0) {
          updateDocument['system.biography'] = this.system.biography
          const name = game.i18n.localize('CoC7.CoCIDFlag.keys.rt..backstory-injuries-and-scars')
          const index = updateDocument['system.biography'].findIndex(b => b.title === name)
          if (index > -1) {
            updateDocument['system.biography'][index].value = updateDocument['system.biography'][index].value + rolled.backstory.join('')
          } else {
            updateDocument['system.biography'].push({
              title: name,
              value: rolled.backstory.join('')
            })
          }
        }
        for (const item of rolled.items) {
          const newItem = foundry.utils.duplicate(item)
          if (typeof itemByType[newItem.type] === 'undefined') {
            itemByType[newItem.type] = []
          }
          itemByType[newItem.type].push(newItem)
        }
        updateDocument['system.development.experiencePackage'] = parseInt(data.system.points, 10) + parseInt(rolled['i.skill.cthulhu-mythos'], 10)
        processedDataArray.push(foundry.utils.duplicate(data))
      }
    }
  }

  /**
   * Get Item ID by Name
   * @deprecated Temporary forward
   * @param {string} itemName
   * @returns {null|string}
   */
  getItemIdByName (itemName) {
    deprecated.warningLogger({
      was: 'actor.getItemIdByName(?)',
      now: 'actor.getItemByName(?)',
      until: 15
    })
    const name = (itemName.match(/\(([^)]+)\)/) ? itemName.match(/\(([^)]+)\)/)[1] : itemName).toLowerCase()
    return this.items.find(doc => (doc.system.skillName ?? doc.name).toLowerCase() === name) ?? null
  }

  /**
   * Get Items by Name
   * @deprecated Temporary forward
   * @param {string} itemName
   * @returns {Array}
   */
  getItemsByName (itemName) {
    deprecated.noReplacement({
      was: 'actor.getItemsByName(?)',
      until: 15
    })
    const itemList = []
    for (const value of this.items) {
      if (value.name === itemName) itemList.push(value)
    }
    return itemList
  }

  /**
   * Get array with document of skill matching name
   * @deprecated Temporary forward
   * @param {string} skillName
   * @returns {Array}
   */
  getSkillsByName (skillName) {
    deprecated.warningLogger({
      was: 'actor.getSkillsByName',
      now: 'actor.getSkillByName',
      until: 15
    })
    const skill = this.getSkillByName(skillName)
    if (skill) {
      return [skill]
    }
    return []
  }

  /**
   * Get document of skill matching name
   * @param {string} itemName
   * @returns {Document|undefined}
   */
  getSkillByName (itemName) {
    const parts = CoC7ModelsItemSkillSystem.guessNameParts(itemName)
    const name = (parts.system.skillName ?? parts.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    const found = this.items.find(d => d.type === 'skill' && (d.flags?.[FOLDER_ID]?.cocidFlag?.id === itemName || (d.system.skillName ?? d.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase() === name))
    return found
  }

  /**
   * Find matching item by CoC ID
   * @param {string} cocid
   * @returns {Document|undefined}
   */
  getFirstItemByCoCID (cocid) {
    return this.items.find(i => i.flags?.[FOLDER_ID]?.cocidFlag?.id === cocid)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  parseCharacteristics () {
    deprecated.warningLogger({
      was: 'actor.parseCharacteristics()',
      now: 'actor.parsedValues()',
      until: 15
    })
    return this.parsedValues()
  }

  /**
   * Get key values used in Roll
   * @returns {object}
   */
  parsedValues () {
    const parsed = {}
    for (const key of this.system.schema.getField('characteristics').keys()) {
      parsed[key] = foundry.utils.getProperty(this, 'system.characteristics.' + key + '.value')
    }
    for (const key of this.system.schema.getField('attribs').keys()) {
      const field = this.system.schema.getField('attribs').getField(key)
      const value = field.getField('value')
      const max = field.getField('max')
      if (typeof value !== 'undefined') {
        parsed[key] = foundry.utils.getProperty(this, 'system.attribs.' + key + '.value')
      }
      if (typeof max !== 'undefined') {
        parsed[key + 'Max'] = foundry.utils.getProperty(this, 'system.attribs.' + key + '.max')
      }
    }
    for (const item of this.items) {
      if (item.type === 'skill' && typeof item.flags?.[FOLDER_ID]?.cocidFlag?.id !== 'undefined') {
        parsed[item.flags[FOLDER_ID].cocidFlag.id] = item.system.value
      }
    }
    return parsed
  }

  /**
   * Get Characteristic Definitions
   * @deprecated Temporary forward
   * @returns {Array}
   */
  static getCharacteristicDefinition () {
    deprecated.warningLogger({
      was: 'Actor.getCharacteristicDefinition()',
      now: 'CONFIG.Actor.dataModels.character.schema.get("characteristics").fields',
      until: 15
    })
    const characteristics = []
    for (const [key, value] of Object.entries(CONFIG.Actor.dataModels.character.schema.get('characteristics').fields)) {
      characteristics.push({
        key,
        shortName: game.i18n.localize(value.label),
        label: game.i18n.localize(value.hint)
      })
    }
    return characteristics
  }

  /**
   * Get Characteristic Definition and Value
   * @param {string} charName
   * @deprecated Temporary forward
   * @returns {null|object}
   */
  getCharacteristic (charName) {
    deprecated.noReplacement({
      was: 'actor.getCharacteristic(?)',
      until: 15
    })
    const characteristic = CONFIG.Actor.dataModels.character.schema.get('characteristics').fields[charName.toLowerCase()]
    if (characteristic) {
      return {
        key: characteristic.name,
        shortName: game.i18n.localize(characteristic.label),
        label: game.i18n.localize(characteristic.hint),
        value: this.system.characteristics[characteristic.name].value
      }
    }
    return null
  }

  /**
   * Get Characteristic Definition and Value
   * @param {string} attribName
   * @returns {null|object}
   */
  getAttribute (attribName) {
    deprecated.noReplacement({
      was: 'actor.getAttribute(?)',
      until: 15
    })
    let key
    if (['lck', 'luck', game.i18n.localize('CoC7.Luck').toLowerCase()].includes(attribName.toLowerCase())) {
      key = 'lck'
    } else if (['san', game.i18n.localize('CoC7.SAN').toLowerCase(), game.i18n.localize('CoC7.Sanity').toLowerCase()].includes(attribName.toLowerCase())) {
      key = 'san'
    }
    if (key) {
      const attrib = CONFIG.Actor.dataModels.character.schema.get('attribs').fields[key]
      if (attrib) {
        return {
          key: attrib.name,
          shortName: game.i18n.localize(attrib.label),
          label: game.i18n.localize(attrib.hint),
          value: this.system.attribs[attrib.name].value
        }
      }
    }
    return null
  }

  /**
   * Third party trigger rolls
   * @param {object} options
   * @param {string} options.cardType (optional) 'Normal' - Only normal is implemented
   * @param {boolean} options.fastForward (optional) Skip bonus selection dialog
   * @param {boolean} options.chatMessage (optional) Create chat message from result
   * @param {boolean} options.forcedCardType (optional) Prevent card type changes on bonus selection dialog
   * @param {boolean} options.hideDifficulty (optional) Prevent difficulty changes on bonus selection dialog
   * @param {integer} options.difficulty (optional) This defaults to the world setting (regular: 1, hard: 2, extreme: 3, critical: 4)
   * @param {boolean} options.preventStandby (optional) Overwrite GM standby rolls world setting
   * @returns {object}
   */
  async runRoll (options = {}) {
    if (typeof options.cardType === 'undefined') {
      options.cardType = CoC7RollNormalize.CARD_TYPE.NORMAL
    }
    if (typeof options.preventStandby === 'undefined') {
      options.preventStandby = true
    }
    options.actor = this
    const check = await CoC7RollNormalize.trigger(options)
    return {
      result: check.total, // Final result
      successLevel: check.successLevel, // Success level
      isFumble: false, // Roll was a fumble
      isCritical: false, // Roll was a critical success
      successLevels: {
        1: check.successLevels[3][1], // Extreme success value
        2: check.successLevels[2][1], // Hard success value
        3: check.successLevels[1][1] // Regular success value
      },
      passed: check.isSuccess // Check passed
    }
  }

  /**
   * Get occupation Document from items
   * @returns {Document|undefined}
   */
  get occupation () {
    return this.items.find(item => item.type === 'occupation')
  }

  /**
   * Get archetype Document from items
   * @returns {Document|undefined}
   */
  get archetype () {
    return this.items.find(item => item.type === 'archetype')
  }

  /**
   * Get experience package Document from items
   * @returns {Document|undefined}
   */
  get experiencePackage () {
    return this.items.find(item => item.type === 'experiencePackage')
  }

  /**
   * Remove Experience Package and reset skills
   */
  async resetExperiencePackage () {
    this.#resetEmbeddedItem('experiencePackage', false)
  }

  /**
   * Remove Occupation and reset skills
   * @param {bool} eraseOld
   */
  async resetOccupation (eraseOld = true) {
    this.#resetEmbeddedItem('occupation', eraseOld)
  }

  /**
   * Remove Archetype and reset skills
   * @param {bool} eraseOld
   */
  async resetArchetype (eraseOld = true) {
    this.#resetEmbeddedItem('archetype', eraseOld)
  }

  /**
   * Remove archetype/occupation/experiencePackage and reset associated skills
   * @param {string} key
   * @param {bool} eraseOld
   */
  async #resetEmbeddedItem (key, eraseOld) {
    if (!['archetype', 'experiencePackage', 'occupation'].includes(key)) {
      return
    }
    if (eraseOld) {
      const updateEmbeddedItems = this.items.reduce((c, d) => {
        if (d.type === 'skill' && (d.system.flags[key] || d.system.adjustments[key] > 0)) {
          c.push({
            _id: d.id,
            ['system.flags.' + key]: false,
            ['system.adjustments.' + key]: 0
          })
        }
        return c
      }, [])
      if (updateEmbeddedItems.length > 0) {
        await this.updateEmbeddedDocuments('Item', updateEmbeddedItems)
      }
    }
    if (this[key]) {
      await this[key].delete()
    }
    await this.update({
      ['system.development.' + key]: 0
    })
  }

  /**
   * Get luck value
   * @deprecated Temporary forward
   * @returns {NaN|integer}
   */
  get luck () {
    deprecated.noReplacement({
      was: 'actor.luck',
      until: 15
    })
    return parseInt(this.system.attribs?.lck?.value)
  }

  /**
   * Set luck value
   * @deprecated Temporary forward
   * @param {integer} value
   * @returns {Promise<Document>}
   */
  async setLuck (value) {
    deprecated.noReplacement({
      was: 'actor.setLuck(?)',
      until: 15
    })
    return await this.update({ 'system.attribs.lck.value': value })
  }

  /**
   * Spend luck
   * @param {int} amount
   * @returns {Promise<Document|false>}
   */
  async spendLuck (amount) {
    const newLuck = parseInt(this.system.attribs.lck.value ?? 0, 10) - parseInt(amount, 10)
    if (newLuck >= 0) {
      return this.update({
        'system.attribs.lck.value': newLuck
      })
    }
    return false
  }

  /**
   * Get hp value
   * @deprecated Temporary forward
   * @returns {NaN|integer}
   */
  get hp () {
    deprecated.noReplacement({
      was: 'actor.hp',
      until: 15
    })
    return parseInt(this.system.attribs.hp.value)
  }

  /**
   * Get recalculated maximum hp value
   * @deprecated Temporary forward
   * @returns {NaN|null|integer}
   */
  get rawHpMax () {
    if (this.system.attribs.hp.auto) {
      if (
        this.system.characteristics.siz.value != null &&
        this.system.characteristics.con.value != null
      ) {
        return CoC7ModelsActorDocumentClass.hpFromCharacteristics(this.system.characteristics, this.type)
      }
      if (this.system.attribs.hp.max) {
        return parseInt(this.system.attribs.hp.max)
      }
      return null
    }
    return parseInt(this.system.attribs.hp.max)
  }

  /**
   * Get maximum hp value
   * @deprecated Temporary forward
   * @returns {NaN|integer}
   */
  get hpMax () {
    deprecated.noReplacement({
      was: 'actor.hpMax',
      until: 15
    })
    return parseInt(this.system.attribs.hp.max)
  }

  /**
   * Set HP without triggering health loss checks
   * @deprecated Temporary forward
   * @param {integer} value
   * @returns {NaN|integer}
   */
  async _setHp (value) {
    deprecated.noReplacement({
      was: 'actor._setHp(?)',
      until: 15
    })
    if (value < 0) value = 0
    if (value > this.system.attribs.hp.max) {
      value = parseInt(this.system.attribs.hp.max)
    }
    return await this.update({ 'system.attribs.hp.value': value })
  }

  /**
   * Add Skills
   * @deprecated Temporary forward
   * @param {Array} skillList
   * @param {string} flag
   */
  async addUniqueItems (skillList, flag = null) {
    deprecated.noReplacement({
      was: 'actor.addUniqueItems(?, ?)',
      until: 15
    })
    const processed = []
    for (let skill of skillList) {
      skill = foundry.utils.duplicate(skill)
      if (flag) {
        if (!Object.prototype.hasOwnProperty.call(skill.system, 'flags')) {
          skill.system.flags = {}
        }
        skill.system.flags[flag] = true
      }
      if (CoC7ModelsItemDocumentClass.isAnySpec(skill)) {
        processed.push(skill)
      } else {
        const itemId = this.getItemIdByName(skill.name)
        if (!itemId) {
          processed.push(skill)
        } else if (flag) {
          const item = this.items.get(itemId)
          await item.setItemFlag(flag)
        }
      }
    }
    if (processed.length === 0) {
      return
    }
    await this.createEmbeddedDocuments('Item', processed, {
      renderSheet: false
    })
  }

  /**
   * Add Items
   * @deprecated Temporary forward
   * @param {Array} itemList
   * @param {string|null} flag
   */
  async addItems (itemList, flag = null) {
    deprecated.noReplacement({
      was: 'actor.addItems(?, ?)',
      until: 15
    })
    const processed = []
    for (const item of itemList) {
      if (flag) {
        if (!item.system.flags) item.system.flags = {}
        item.system.flags[flag] = true
      }
      processed.push(foundry.utils.duplicate(item))
    }
    if (processed.length === 0) {
      return
    }
    await this.createEmbeddedDocuments('Item', processed, {
      renderSheet: false
    })
  }

  /**
   * Add Skills
   * @deprecated Temporary forward
   * @param {object} skill
   * @param {string} flag
   */
  async addUniqueItem (skill, flag = null) {
    deprecated.noReplacement({
      was: 'actor.addUniqueItem(?, ?)',
      until: 15
    })
    const itemId = this.getItemIdByName(skill.name)
    if (!itemId) {
      if (flag) {
        if (!skill.system.flags) skill.system.flags = {}
        skill.system.flags[flag] = true
      }
      await this.createEmbeddedDocuments('Item', [skill], {
        renderSheet: false
      })
    } else if (flag) {
      const item = this.items.get(itemId)
      await item.setItemFlag(flag)
    }
  }

  /**
   * Get maximum magic points value
   * @deprecated Temporary forward
   * @returns {NaN|integer}
   */
  get rawMpMax () {
    deprecated.noReplacement({
      was: 'actor.rawMpMax',
      until: 15
    })
    if (this.system.attribs.mp.auto) {
      if (this.system.characteristics.pow.value != null) {
        return CoC7ModelsActorDocumentClass.mpFromCharacteristics(this.system.characteristics)
      } else return 0
    }
    return parseInt(this.system.attribs.mp.max)
  }

  /**
   * Get sanity loss from reason default to none
   * @param {string} sanReason
   * @returns {object}
   */
  getReasonSanLoss (sanReason) {
    if (typeof sanReason === 'string') {
      const name = sanReason.toLocaleLowerCase()
      return (this.system.sanityLossEvents?.find(r => r.type.toLocaleLowerCase() === name) ?? { type: '', totalLoss: 0, immunity: false })
    }
    return { type: '', totalLoss: 0, immunity: false }
  }

  /**
   * Get sanity loss value from reason default to none
   * @param {string} sanReason
   * @returns {integer}
   */
  sanLostToReason (sanReason) {
    if (sanReason) {
      const sanityLossEvent = this.getReasonSanLoss(sanReason)
      return sanityLossEvent.totalLoss
    }
    return 0
  }

  /**
   * Has Actor experienced sanity loss reason
   * @param {string} sanReason
   * @returns {boolean}
   */
  sanLossReasonEncountered (sanReason) {
    if (sanReason) {
      const sanityLossEvent = this.getReasonSanLoss(sanReason)
      return sanityLossEvent.type !== ''
    }
    return false
  }

  /**
   * Add sanity loss value to reason, if 0 remove it
   * @param {string} sanReason
   * @param {integer} sanLoss
   * @returns {Promise<Document>|null}
   */
  setReasonSanLoss (sanReason, sanLoss) {
    if (typeof sanReason === 'string' && sanReason !== '') {
      const sanityLossEvents = foundry.utils.duplicate(this.system.sanityLossEvents)
      const name = sanReason.toLocaleLowerCase()
      const index = sanityLossEvents.findIndex(r => r.type.toLocaleLowerCase() === name)
      if (sanLoss > 0) {
        if (index === -1) {
          sanityLossEvents.push({
            type: sanReason,
            totalLoss: sanLoss,
            immunity: false
          })
        } else {
          sanityLossEvents[index].totalLoss += sanLoss
        }
      } else if (index > -1) {
        sanityLossEvents.splice(index, 1)
        sanityLossEvents.sort(function (left, right) {
          return left.type.localeCompare(right.type)
        })
      }
      return this.update({
        'system.sanityLossEvents': sanityLossEvents
      })
    }
    return null
  }

  /**
   * Get maximum allowed loss to sanity reason
   * @param {string} sanReason
   * @param {string} sanMaxFormula
   * @returns {integer}
   */
  maxLossToSanReason (sanReason, sanMaxFormula) {
    const sanMax = new Roll(sanMaxFormula.toString()).evaluateSync({ maximize: true }).total
    const sanityLossEvent = this.getReasonSanLoss(sanReason)
    if (sanityLossEvent.immunity) {
      return 0
    }
    return Math.max(0, sanMax - sanityLossEvent.totalLoss)
  }

  /**
   * Fix spelling mistake
   * @deprecated Temporary forward
   * @param {string} sanReason
   * @param {integer} sanLoss
   * @returns {integer}
   */
  async looseSan (sanReason, sanLoss) {
    deprecated.warningLogger({
      was: 'Actor.looseSan(?, ?)',
      now: 'Actor.loseSan(?, ?)',
      until: 15
    })
    return this.loseSan(sanReason, sanLoss)
  }

  /**
   * Reduce Sanity and increase Sanity lost to reason
   * @param {string} sanReason
   * @param {integer} sanLoss
   * @returns {integer}
   */
  async loseSan (sanReason, sanLoss) {
    const sanityLossEvent = this.getReasonSanLoss(sanReason)
    if (!sanityLossEvent.immunity) {
      await this.setSan(parseInt(this.system.attribs.san.value ?? 0, 10) - parseInt(sanLoss, 10))
      if (sanLoss > 0) {
        await this.setReasonSanLoss(sanReason, sanLoss)
      }
      return sanLoss
    }
    return 0
  }

  /**
   * Get san loss value for success or failure
   * @deprecated Temporary forward
   * @param {boolean} checkPassed
   * @returns {string}
   */
  sanLoss (checkPassed) {
    deprecated.noReplacement({
      was: 'actor.sanLoss(?)',
      until: 15
    })
    if (checkPassed) return this.sanLossCheckPassed
    return this.sanLossCheckFailled
  }

  /**
   * Get san loss value for success
   * @deprecated Temporary forward
   * @returns {string}
   */
  get sanLossCheckPassed () {
    deprecated.noReplacement({
      was: 'actor.sanLossCheckPassed',
      until: 15
    })
    return this.system.special?.sanLoss?.checkPassed
  }

  /**
   * Get san loss value for failure
   * @deprecated Temporary forward
   * @returns {string}
   */
  get sanLossCheckFailled () {
    deprecated.noReplacement({
      was: 'actor.sanLossCheckFailled',
      until: 15
    })
    return this.system.special?.sanLoss?.checkFailled
  }

  /**
   * Get maximum san loss
   * @deprecated Temporary forward
   * @returns {string|integer}
   */
  get sanLossMax () {
    deprecated.noReplacement({
      was: 'actor.sanLossMax',
      until: 15
    })
    if (this.sanLossCheckFailled) {
      if (!isNaN(Number(this.sanLossCheckFailled))) {
        return Number(this.sanLossCheckFailled)
      }
      return new Roll(this.sanLossCheckFailled).evaluateSync({ maximize: true }).total
    }
    return 0
  }

  /**
   * Get minimum san loss
   * @deprecated Temporary forward
   * @returns {string|integer}
   */
  get sanLossMin () {
    deprecated.noReplacement({
      was: 'actor.sanLossMin',
      until: 15
    })
    if (this.sanLossCheckPassed) {
      if (!isNaN(Number(this.sanLossCheckPassed))) {
        return Number(this.sanLossCheckPassed)
      }
      return new Roll(this.sanLossCheckPassed).evaluateSync({ maximize: true }).total
    }
    return 0
  }

  /**
   * Get daily sanity loss
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get dailySanLoss () {
    deprecated.noReplacement({
      was: 'actor.dailySanLoss',
      until: 15
    })
    return this.system.attribs.san?.dailyLoss || 0
  }

  /**
   * Get maximum daily sanity loss
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get dailySanLimit () {
    deprecated.noReplacement({
      was: 'actor.dailySanLimit',
      until: 15
    })
    return this.system.attribs.san?.dailyLimit || 0
  }

  /**
   * Get maximum sanity maximum recalculation
   * @deprecated Temporary forward
   * @returns {integer|NaN}
   */
  get rawSanMax () {
    deprecated.noReplacement({
      was: 'actor.rawSanMax',
      until: 15
    })
    if (!this.system.attribs) return undefined
    if (this.system.attribs?.san?.auto) {
      if (this.cthulhuMythos) return Math.max(99 - this.cthulhuMythos, 0)
      return 99
    }
    return parseInt(this.system.attribs.san.max)
  }

  /**
   * Get maximum sanity value
   * @deprecated Temporary forward
   * @returns {integer|NaN}
   */
  get sanMax () {
    deprecated.noReplacement({
      was: 'actor.sanMax',
      until: 15
    })
    return parseInt(this.system.attribs.san.max)
  }

  /**
   * Calculate maximum sanity value
   * @returns {integer}
   */
  sanityMaximum () {
    const cthulhuMythosSkill = this.cthulhuMythosSkill
    const value = (cthulhuMythosSkill ? cthulhuMythosSkill.system.value : 0)
    return Math.max(99 - value, 0)
  }

  /**
   * Get magic points
   * @deprecated Temporary forward
   * @returns {integer|NaN}
   */
  get mp () {
    deprecated.noReplacement({
      was: 'actor.mp',
      until: 15
    })
    return parseInt(this.system.attribs.mp.value)
  }

  /**
   * Get maximum magic points
   * @deprecated Temporary forward
   * @returns {integer|NaN}
   */
  get mpMax () {
    deprecated.noReplacement({
      was: 'actor.mpMax',
      until: 15
    })
    if (this.system.attribs.mp.auto) {
      if (this.system.characteristics.pow.value != null) {
        return Math.floor(this.system.characteristics.pow.value / 5)
      }
      return 0
    }
    return parseInt(this.system.attribs.mp.max)
  }

  /**
   * Set magic points
   * @deprecated Temporary forward
   * @param {integer} value
   * @returns {integer|NaN}
   */
  async setMp (value) {
    deprecated.noReplacement({
      was: 'actor.setMp(?)',
      until: 15
    })
    if (value < 0) value = 0
    if (value > parseInt(this.system.attribs.mp.max)) { value = parseInt(this.system.attribs.mp.max) }
    return await this.update({ 'system.attribs.mp.value': value })
  }

  /**
   * Get Sanity value
   * @deprecated Temporary forward
   * @returns {integer|NaN}
   */
  get san () {
    deprecated.noReplacement({
      was: 'actor.san',
      until: 15
    })
    return parseInt(this.system.attribs.san.value)
  }

  /**
   * Get INT value
   * @deprecated Temporary forward
   * @returns {object}
   */
  get int () {
    deprecated.noReplacement({
      was: 'actor.int',
      until: 15
    })
    return this.getCharacteristic('int')
  }

  /**
   * Total occupation points from skills
   * @returns {int}
   */
  get occupationPointsSpent () {
    return this.items.reduce((c, d) => {
      if (d.type === 'skill' && d.system.adjustments?.occupation) {
        c = c + d.system.adjustments.occupation
      }
      return c
    }, 0)
  }

  /**
   * Calculate occupation points
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get occupationPoints () {
    deprecated.noReplacement({
      was: 'actor.occupationPoints',
      until: 15
    })
    if (!this.occupation) return 0
    let points = 0
    for (const entry of Object.entries(
      this.occupation.system.occupationSkillPoints
    )) {
      const [key, value] = entry
      const char = this.getCharacteristic(key)
      if (value.selected) {
        points += char.value * Number(value.multiplier)
      }
    }
    return points
  }

  /**
   * Reset occupation points
   * @deprecated Temporary forward
   */
  async resetOccupationPoints () {
    deprecated.noReplacement({
      was: 'actor.resetOccupationPoints()',
      until: 15
    })
    await this.update({
      'system.development.occupation': this.occupationPoints
    })
  }

  /**
   * Reset archetype points
   * @deprecated Temporary forward
   */
  async resetArchetypePoints () {
    deprecated.noReplacement({
      was: 'actor.resetArchetypePoints()',
      until: 15
    })
    await this.update({
      'system.development.archetype': this.occupationPoints
    })
  }

  /**
   * Reset archetype points
   * @deprecated Temporary forward
   */
  async resetPersonalPoints () {
    deprecated.noReplacement({
      was: 'actor.resetPersonalPoints()',
      until: 15
    })
    await this.update({
      'system.development.personal': this.personalPoints
    })
  }

  /**
   * Total experience package points from skills
   * @deprecated Temporary forward
   * @returns {int}
   */
  get ExperiencePackagePointsSpent () {
    deprecated.warningLogger({
      was: 'actor.ExperiencePackagePointsSpent',
      now: 'actor.experiencePackagePointsSpent',
      until: 15
    })
    return this.experiencePackagePointsSpent
  }

  /**
   * Total experience package points from skills
   * @returns {int}
   */
  get experiencePackagePointsSpent () {
    return this.items.reduce((c, d) => {
      if (d.type === 'skill' && d.system.adjustments?.experiencePackage) {
        c = c + d.system.adjustments.experiencePackage
      }
      return c
    }, 0)
  }

  /**
   * Reset archetype points
   * @deprecated Temporary forward
   * @returns {integer|NaN}
   */
  get ExperiencePackagePoints () {
    deprecated.noReplacement({
      was: 'actor.ExperiencePackagePoints',
      until: 15
    })
    if (!this.experiencePackage) return 0
    return this.experiencePackage.system.points
  }

  /**
   * Total archetype points from skills
   * @returns {int}
   */
  get archetypePointsSpent () {
    return this.items.reduce((c, d) => {
      if (d.type === 'skill' && d.system.adjustments?.archetype) {
        c = c + d.system.adjustments.archetype
      }
      return c
    }, 0)
  }

  /**
   * Get archetype points
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get archetypePoints () {
    deprecated.noReplacement({
      was: 'actor.ExperiencePackagePoints',
      until: 15
    })
    if (!this.archetype) return 0
    return this.archetype.system.bonusPoints
  }

  /**
   * Total experience points from skills
   * @returns {int}
   */
  get experiencePoints () {
    return this.items.reduce((c, d) => {
      if (d.type === 'skill' && d.system.adjustments?.experience) {
        c = c + d.system.adjustments.experience
      }
      return c
    }, 0)
  }

  /**
   * Total personal points from skills
   * @returns {int}
   */
  get personalPointsSpent () {
    return this.items.reduce((c, d) => {
      if (d.type === 'skill' && d.system.adjustments?.personal) {
        c = c + d.system.adjustments.personal
      }
      return c
    }, 0)
  }

  /**
   * Get personal points
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get personalPoints () {
    deprecated.noReplacement({
      was: 'actor.personalPoints',
      until: 15
    })
    return 2 * Number(this.system.characteristics.int.value)
  }

  /**
   * Does this Actor have a development phase
   * @returns {boolean}
   */
  get hasDevelopmentPhase () {
    if (this.items.find(item => item.type === 'skill' && item.system.flags?.developement)) {
      return true
    }
    if (this.onlyRunOncePerSession === true) {
      return false
    }
    if (this.system.sanityLossEvents.find(sanityLossEvent => !sanityLossEvent.immunity)) {
      return true
    }
    return false
  }

  /**
   * Set Sanity Value
   * @param {integer} value
   * @returns {integer}
   */
  async setSan (value) {
    const sanMax = (this.system.attribs.san.max ?? 0)
    const changes = {
      'system.attribs.san.value': Math.min(sanMax, Math.max(0, value))
    }
    const difference = changes['system.attribs.san.value'] - (this.system.attribs.san.value ?? 0)
    if (difference < 0) {
      changes['system.attribs.san.dailyLoss'] = (this.system.attribs.san.dailyLoss ?? 0) - difference
      if (difference <= -5) {
        await this.conditionsSet([STATUS_EFFECTS.tempoInsane])
      }
      if (changes['system.attribs.san.dailyLoss'] >= (this.system.attribs.san.dailyLimit ?? 0)) {
        await this.conditionsSet([STATUS_EFFECTS.indefInsane])
      }
    }
    this.update(changes)
    return changes['system.attribs.san.value']
  }

  /**
   * Set attribute auto value
   * @deprecated Temporary forward
   * @param {boolean} value
   * @param {string} attrib
   * @returns {Promise<Document>}
   */
  async setAttribAuto (value, attrib) {
    deprecated.noReplacement({
      was: 'actor.setAttribAuto(?, ?)',
      until: 15
    })
    const updatedKey = `system.attribs.${attrib}.auto`
    return await this.update({ [updatedKey]: value })
  }

  /**
   * Toggle attribute auto value
   * @param {string} attrib
   * @deprecated Temporary forward
   */
  async toggleAttribAuto (attrib) {
    deprecated.noReplacement({
      was: 'actor.toggleAttribAuto(?)',
      until: 15
    })
    this.setAttribAuto(!this.system.attribs[attrib].auto, attrib)
  }

  /**
   * Calculate damage bonus value
   * @param {object} characteristics
   * @returns {int}
   */
  static dbFromCharacteristics (characteristics) {
    const sum = (characteristics.str.value ?? 0) + (characteristics.siz.value ?? 0)
    if (sum < 65) return -2
    if (sum < 85) return -1
    if (sum < 125) return 0
    if (sum < 165) return '1D4'
    return Math.floor((sum - 45) / 80) + 'D6'
  }

  /**
   * Calculate build value
   * @param {object} characteristics
   * @returns {int}
   */
  static buildFromCharacteristics (characteristics) {
    const sum = (characteristics.str.value ?? 0) + (characteristics.siz.value ?? 0)
    if (sum < 65) return -2
    if (sum < 85) return -1
    if (sum < 125) return 0
    if (sum < 165) return 1
    return Math.floor((sum - 45) / 80) + 1
  }

  /**
   * Calculate HP from Characteristics
   * @param {object} characteristics
   * @param {string} type
   * @returns {int}
   */
  static hpFromCharacteristics (characteristics, type) {
    const sum = parseInt(characteristics.siz.value ?? 0, 10) + parseInt(characteristics.con.value ?? 0, 10)
    const divisor = (game.settings.get(FOLDER_ID, 'pulpRuleDoubleMaxHealth') && type === 'character' ? 5 : 10)
    return Math.floor(sum / divisor)
  }

  /**
   * Calculate maximum magic points value
   * @param {object} characteristics
   * @returns {int}
   */
  static mpFromCharacteristics (characteristics) {
    return Math.floor((characteristics.pow.value ?? 0) / 5)
  }

  /**
   * Calculate HP from Characteristics
   * @param {object} characteristics
   * @param {string} type
   * @param {null|integer} age
   * @returns {int}
   */
  static movFromCharacteristics (characteristics, type, age) {
    let mov
    const dex = characteristics.dex.value ?? 0
    const siz = characteristics.siz.value ?? 0
    const str = characteristics.str.value ?? 0
    mov = (dex > siz && str > siz ? 9 : (dex >= siz || str >= siz ? 8 : 7))
    if (type !== 'creature' && !game.settings.get(FOLDER_ID, 'pulpRuleIgnoreAgePenalties')) {
      if (!isNaN(parseInt(age))) {
        mov = parseInt(age) >= 40 ? mov - Math.floor(parseInt(age) / 10) + 3 : mov
      }
    }
    return Math.max(0, mov)
  }

  /**
   * Get unmodified build
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get rawBuild () {
    deprecated.noReplacement({
      was: 'actor.rawBuild',
      until: 15
    })
    if (!this.system.attribs) return null
    if (!this.system.attribs.build) return null
    if (this.system.attribs.build.value === 'auto') {
      this.system.attribs.build.auto = true
    }
    if (this.system.attribs.build.auto) {
      return CoC7ModelsActorDocumentClass.buildFromCharacteristics(this.system.characteristics)
    }

    return this.system.attribs.build.value
  }

  /**
   * Get build
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get build () {
    deprecated.noReplacement({
      was: 'actor.build',
      until: 15
    })
    return this.system.attribs.build.value
  }

  /**
   * Get unmodified damage bonus
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get rawDb () {
    deprecated.noReplacement({
      was: 'actor.rawDb',
      until: 15
    })
    if (!this.system.attribs) return null
    if (!this.system.attribs.db) return null
    if (this.system.attribs.db.value === 'auto') {
      this.system.attribs.db.auto = true
    }
    if (this.system.attribs.db.auto) {
      return CoC7ModelsActorDocumentClass.dbFromCharacteristics(this.system.characteristics)
    }
    return this.system.attribs.db.value
  }

  /**
   * Get damage bonus
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get db () {
    deprecated.noReplacement({
      was: 'actor.db',
      until: 15
    })
    return this.system.attribs.db.value
  }

  /**
   * Get unmodified movement
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get rawMov () {
    deprecated.noReplacement({
      was: 'actor.rawMov',
      until: 15
    })
    if (!this.system.attribs) return null
    if (!this.system.attribs.mov) return null
    if (this.system.attribs.mov.value === 'auto') {
      this.system.attribs.mov.auto = true
    }
    if (this.system.attribs.mov.auto) {
      const MOV = CoC7ModelsActorDocumentClass.movFromCharacteristics(this.system.characteristics, this.system.type, this.system.infos.age)
      if (MOV > 0) return MOV
    }
    return this.system.attribs.mov.value
  }

  /**
   * Get movement
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get mov () {
    deprecated.noReplacement({
      was: 'actor.mov',
      until: 15
    })
    return this.system.attribs.mov.value
  }

  /**
   * Get token id
   * @deprecated Temporary forward
   * @returns {string|null}
   */
  get tokenId () {
    deprecated.noReplacement({
      was: 'actor.tokenId',
      until: 15
    })
    return this.token ? `${this.token.scene._id}.${this.token.id}` : null
  }

  /**
   * Get locked flag
   * @deprecated Temporary forward
   * @returns {boolean}
   */
  get locked () {
    deprecated.noReplacement({
      was: 'actor.locked',
      until: 15
    })
    if (!this.system.flags) {
      this.system.flags = {}
      this.system.flags.locked = true // Locked by default
      this.update({ 'system.flags': {} })
      this.update({ 'system.flags.locked': false })
    }

    return this.system.flags.locked
  }

  /**
   * Get Items with name
   * @deprecated Temporary forward
   * @param {string} name
   * @returns {Array}
   */
  getItemsFromName (name) {
    deprecated.noReplacement({
      was: 'actor.getItemsFromName(?)',
      until: 15
    })
    return this.items.filter(i => i.name === name)
  }

  /**
   * Set locked flag
   * @deprecated Temporary forward
   * @param {boolean} value
   */
  set locked (value) {
    deprecated.noReplacement({
      was: 'actor.locked(?)',
      until: 15
    })
    this.update({ 'system.flags.locked': value })
  }

  /**
   * Toggle actor flag
   * @deprecated Temporary forward
   * @param {string} flagName
   */
  async toggleActorFlag (flagName) {
    deprecated.noReplacement({
      was: 'actor.toggleActorFlag(?)',
      until: 15
    })
    const flagValue = !this.system.flags[flagName]
    const name = `system.flags.${flagName}`
    await this.update({ [name]: flagValue })
  }

  /**
   * Run attribute check
   * @param {string} attributeName
   * @param {boolean} fastForward
   * @param {object} options
   * @param {string|bool} options.blind
   * @param {int} options.difficulty
   * @param {int} options.poolModifier
   * @param {int} options.modifier deprecated use poolModifier instead
   */
  async attributeCheck (attributeName, fastForward = false, options = {}) {
    if (typeof options.modifier !== 'undefined' && typeof options.poolModifier === 'undefined') {
      deprecated.warningLogger({
        was: 'actor.attributeCheck(?, ?, { options: { modifier: 2 } })',
        now: 'actor.attributeCheck(?, ?, { options: { poolModifier: 2 } })',
        until: 15
      })
      options.poolModifier = options.modifier
    }
    if (typeof this.system.schema.getField('attribs')?.getField(attributeName.toLowerCase()) === 'undefined') {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ErrorNotFoundForActor', {
        missing: attributeName,
        actor: this.name
      }))
      return
    }
    const config = {
      rollType: CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE,
      cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
      attribute: attributeName.toLowerCase(),
      actor: this
    }
    if (typeof options.poolModifier !== 'undefined') {
      config.poolModifier = options.poolModifier
    }
    if (typeof options.difficulty !== 'undefined') {
      config.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }
    config.fastForward = fastForward
    if (typeof options.blind !== 'undefined') {
      config.isBlind = (options.blind === 'false' ? false : !!options.blind)
    }
    CoC7RollNormalize.trigger(config)
  }

  /**
   * Run characteristic check
   * @param {string} characteristicName
   * @param {boolean} fastForward
   * @param {object} options
   * @param {string|bool} options.blind
   * @param {int} options.difficulty
   * @param {int} options.poolModifier
   * @param {int} options.modifier deprecated use poolModifier instead
   */
  async characteristicCheck (characteristicName, fastForward = false, options = {}) {
    if (typeof options.modifier !== 'undefined' && typeof options.poolModifier === 'undefined') {
      deprecated.warningLogger({
        was: 'actor.characteristicCheck(?, ?, { options: { modifier: 2 } })',
        now: 'actor.characteristicCheck(?, ?, { options: { poolModifier: 2 } })',
        until: 15
      })
      options.poolModifier = options.modifier
    }
    if (typeof this.system.schema.getField('characteristics')?.getField(characteristicName.toLowerCase()) === 'undefined') {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ErrorNotFoundForActor', {
        missing: characteristicName,
        actor: this.name
      }))
      return
    }
    const config = {
      rollType: CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC,
      cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
      characteristic: characteristicName.toLowerCase(),
      actor: this
    }
    if (typeof options.poolModifier !== 'undefined') {
      config.poolModifier = options.poolModifier
    }
    if (typeof options.difficulty !== 'undefined') {
      config.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }
    config.fastForward = fastForward
    if (typeof options.blind !== 'undefined') {
      config.isBlind = (options.blind === 'false' ? false : !!options.blind)
    }
    CoC7RollNormalize.trigger(config)
  }

  /**
   * Migrated tooltips to FoundryVTT tooltips
   * @deprecated No replacement
   */
  static toolTipSkillText () {
    deprecated.noLongerAvailable({ was: 'Actor.toolTipSkillText' })
  }

  /**
   * Get item from actor.items, if not found attempt to add it first
   * @param {string} itemIdentifier
   * @param {string} type
   * @returns {Document|null}
   */
  async getItemOrAdd (itemIdentifier, type = 'skill') {
    const typeCoCID = itemIdentifier.match(/^i\.([^\\.]+)\../)
    if (typeCoCID) {
      // Attempt to load from actor by CoC ID
      let item = this.getFirstItemByCoCID(itemIdentifier)
      if (!item) {
        const newItems = await game.CoC7.cocid.fromCoCIDBest({ cocid: itemIdentifier, showLoading: true })
        if (newItems.length === 1) {
          item = await this.getItemAdding(newItems[0], itemIdentifier)
        }
      }
      if (item) {
        return item
      }
    }
    const uuidData = foundry.utils.parseUuid(itemIdentifier)
    if (uuidData) {
      let itemId = ''
      if (uuidData.documentType === 'Item') {
        itemId = uuidData.documentId
      } else {
        const index = uuidData.embedded.findIndex(t => t === 'Item')
        if (index > -1 && typeof uuidData.embedded[index + 1] === 'string') {
          itemId = uuidData.embedded[index + 1]
        }
      }
      if (itemId !== '') {
        let item = this.items.get(itemId)
        if (!item) {
          const newItem = await fromUuid(itemIdentifier)
          item = await this.getItemAdding(newItem)
        }
        if (item) {
          return item
        }
        throw new Error(game.i18n.format('CoC7.ErrorNotFound', { missing: itemId }))
      }
    }

    // Attempt to load for actor by name
    let item = this.getItemByName(itemIdentifier, type)
    if (item) {
      return item
    }
    const parts = CoC7ModelsItemSkillSystem.guessNameParts(itemIdentifier)
    const name = (parts.system.skillName ?? parts.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    const era = game.settings.get(FOLDER_ID, 'worldEra')
    // Attempt to load item from world
    let newItem = game.items.find((d) => {
      if (d.type === type && (d.name === itemIdentifier || (d.system.skillName ?? d.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase() === name)) {
        const eras = d.flags?.[FOLDER_ID]?.cocidFlag?.eras
        if (eras && Object.keys(eras).length > 0 && !(eras[era] ?? false)) {
          return false
        } else {
          return true
        }
      }
      return false
    })
    if (!newItem) {
      // Attempt to load item from compendiums
      for (const pack of game.packs) {
        if (pack.documentName === 'Item') {
          if (!pack.indexed) {
            await pack.getIndex()
          }
          newItem = pack.index.find((d) => {
            if (d.type === type && (d.name === itemIdentifier || (d.system.skillName ?? d.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase() === name)) {
              const eras = d.flags?.[FOLDER_ID]?.cocidFlag?.eras
              if (eras && Object.keys(eras).length > 0 && !(eras[era] ?? false)) {
                return false
              } else {
                return true
              }
            }
            return false
          })
        }
      }
    }
    if (!newItem) {
      return null
    }
    await this.createEmbeddedDocuments('Item', [newItem])
    item = this.getItemByName(itemIdentifier, type)
    if (item) {
      if (item.type === 'skill') {
        /* // FoundryVTT V12 */
        ui.notifications.info(game.i18n.format('CoC7.InfoSkillAddedAtBase', {
          name: item.name,
          percent: item.system.value
        }))
      } else if (item.type === 'weapon') {
        const updates = await item.system.reloadUpdates()
        if (item.system.skill.main.id === '' && item.system.skill.main.name !== '') {
          const skill = await this.getItemOrAdd(item.system.skill.main.name, 'skill')
          if (skill) {
            updates['system.skill.main.id'] = skill.id
            updates['system.skill.main.name'] = skill.name
          }
        }
        if (item.system.skill.alternativ.id === '' && item.system.skill.alternativ.name !== '') {
          const skill = await this.getItemOrAdd(item.system.skill.alternativ.name, 'skill')
          if (skill) {
            updates['system.skill.alternativ.id'] = skill.id
            updates['system.skill.alternativ.name'] = skill.name
          }
        }
        if (Object.keys(updates).length) {
          await item.update(updates)
        }
      }
      return item
    }
    return null
  }

  /**
   * Add item and basic configuration
   * @param {document} newItem
   * @returns {document|false}
   */
  async getItemAdding (newItem) {
    const items = await this.createEmbeddedDocuments('Item', [newItem])
    if (typeof items[0] !== 'undefined') {
      const item = items[0]
      if (item) {
        if (item.type === 'skill') {
          /* // FoundryVTT V12 */
          ui.notifications.info(game.i18n.format('CoC7.InfoSkillAddedAtBase', {
            name: item.name,
            percent: item.system.value
          }))
        } else if (item.type === 'weapon') {
          const updates = await item.system.reloadUpdates()
          if (item.system.skill.main.id === '' && item.system.skill.main.name !== '') {
            const skill = await this.getItemOrAdd(item.system.skill.main.name, 'skill')
            if (skill) {
              updates['system.skill.main.id'] = skill.id
              updates['system.skill.main.name'] = skill.name
            }
          }
          if (item.system.skill.alternativ.id === '' && item.system.skill.alternativ.name !== '') {
            const skill = await this.getItemOrAdd(item.system.skill.alternativ.name, 'skill')
            if (skill) {
              updates['system.skill.alternativ.id'] = skill.id
              updates['system.skill.alternativ.name'] = skill.name
            }
          }
          if (Object.keys(updates).length) {
            await item.update(updates)
          }
        }
        return item
      }
    }
    return false
  }

  /**
   * Run skill check
   * @param {object|string} skillData
   * @param {boolean} fastForward
   * @param {object} options
   * @param {string|bool} options.blind
   * @param {int} options.difficulty
   * @param {int} options.poolModifier
   * @param {int} options.modifier deprecated use poolModifier instead
   */
  async skillCheck (skillData, fastForward, options = {}) {
    if (typeof options.modifier !== 'undefined' && typeof options.poolModifier === 'undefined') {
      deprecated.warningLogger({
        was: 'actor.characteristicCheck(?, ?, { options: { modifier: 2 } })',
        now: 'actor.characteristicCheck(?, ?, { options: { poolModifier: 2 } })',
        until: 15
      })
      options.poolModifier = options.modifier
    }
    const skillIdentifier = skillData.name ? skillData.name : skillData
    const skill = await this.getItemOrAdd(skillIdentifier, 'skill')
    if (!skill) {
      return
    }
    const config = {
      rollType: CoC7RollNormalize.ROLL_TYPE.SKILL,
      cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
      itemUuid: skill.uuid,
      actor: this
    }
    if (typeof options.poolModifier !== 'undefined') {
      config.poolModifier = options.poolModifier
    }
    if (typeof options.difficulty !== 'undefined') {
      config.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }
    config.fastForward = fastForward
    if (typeof options.blind !== 'undefined') {
      config.isBlind = (options.blind === 'false' ? false : !!options.blind)
    }
    CoC7RollNormalize.trigger(config)
  }

  /**
   * Attempt a Weapon check
   * @param {object} weaponData
   * @param {string|undefined} weaponData.uuid
   * @param {string|undefined} weaponData.id
   * @param {string|undefined} weaponData.name
   * @param {boolean} fastForward
   */
  async weaponCheck (weaponData, fastForward = false) {
    let found
    let newWeapon
    if (typeof weaponData.uuid !== 'undefined') {
      const weapon = await fromUuid(weaponData.uuid)
      if (weapon && weapon.type === 'weapon') {
        if (weapon.parent.id === this.id) {
          found = weapon
        } else {
          const parsedUuid = foundry.utils.parseUuid(weaponData.uuid)
          if (typeof parsedUuid.id !== 'undefined') {
            found = this.items.get(parsedUuid.id)
            if (found?.type !== 'weapon') {
              found = undefined
            }
          }
          if (typeof found === 'undefined') {
            newWeapon = weapon
          }
        }
      }
    }
    if (typeof found === 'undefined' && typeof weaponData.id !== 'undefined') {
      found = this.items.get(weaponData.id)
      if (found?.type !== 'weapon') {
        found = undefined
      }
    }
    if (typeof found === 'undefined' && typeof weaponData.name !== 'undefined') {
      found = this.items.find(doc => doc.type === 'weapon' && doc.name === weaponData.name)
    }
    if (typeof found === 'undefined' && typeof newWeapon !== 'undefined') {
      const result = await this.createEmbeddedDocuments('Item', [newWeapon.toObject()], { keepId: true })
      found = result[0]
      await found.system.reload()
    }
    if (typeof found === 'undefined') {
      ui.notifications.warn('CoC7.WarnMacroNoItemFound', { localize: true })
    }
    this.weaponRoll(found, CoC7Utilities.getActorUuid(this))
  }

  /**
   * Trigger a Weapon Roll
   * @param {Document} weapon
   * @param {string} attackerUuid
   */
  async weaponRoll (weapon, attackerUuid) {
    let proceedWithoutTarget = game.settings.get(FOLDER_ID, 'disregardNoTargets')
    if (!proceedWithoutTarget && game.user.targets.size <= 0) {
      proceedWithoutTarget = await foundry.applications.api.DialogV2.wait({
        window: {
          title: 'CoC7.NoTargetTitle'
        },
        content: game.i18n.format('CoC7.NoTargetSelected', {
          weapon: weapon.name
        }),
        buttons: [{
          action: 'cancel',
          icon: 'fa-solid fa-times',
          label: 'CoC7.Cancel',
          default: true,
          callback: (event, button, dialog) => false
        }, {
          action: 'proceed',
          icon: 'fa-solid fa-check',
          label: 'CoC7.Proceed',
          callback: (event, button, dialog) => true
        }],
        position: {
          width: 400
        },
        classes: ['coc7', 'dialog']
      })
    }
    if (game.user.targets.size > 0 || proceedWithoutTarget) {
      if (!weapon.system.properties.rngd) {
        if (game.user.targets.size > 1) {
          ui.notifications.warn('CoC7.WarnTooManyTarget', { localize: true })
        }
        CoC7ChatCombatMelee.createMessage({ attackerUuid, itemUuid: weapon.uuid, targetUuid: CoC7Utilities.getActorUuid(Array.from(game.user.targets)[0]) })
      } else {
        const targets = [...game.user.targets].map(doc => CoC7Utilities.getActorUuid(doc))
        CoC7ChatCombatRanged.createMessage({ attackerUuid, itemUuid: weapon.uuid, targetUuids: targets })
      }
    }
  }

  /**
   * Get initiative
   * @param {boolean} hasGun
   * @returns {integer}
   */
  async rollInitiative (hasGun = false) {
    switch (game.settings.get(FOLDER_ID, 'initiativeRule')) {
      case 'optional':
        {
          const check = new CoC7Check()
          check.actor = this.uuid
          if (hasGun) {
            check.poolModifier = 1
          }
          check.flavor = game.i18n.localize('CoC7.InitiativeRoll')
          await check.rollCharacteristic('dex')
          if (game.settings.get(FOLDER_ID, 'displayInitDices') === false) {
            check.suppressRollData()
          }
          check.closeCard()
          check.initiativeRoll()
          check.toMessage()
          return check.successLevel + this.system.characteristics.dex.value / 100
        }
        break // eslint-disable-line no-unreachable
      default:
        return this.system.characteristics.dex.value + (hasGun ? 50 : 0)
    }
  }

  /**
   * Get actor flag
   * @deprecated Temporary forward
   * @param {string} flagName
   * @returns {boolean}
   */
  getActorFlag (flagName) {
    deprecated.noReplacement({
      was: 'actor.getActorFlag(?)',
      until: 15
    })
    if (!this.system.flags) {
      this.system.flags = {}
      this.system.flags.locked = true
      this.update({ 'system.flags': {} })
      return false
    }

    if (!this.system.flags[flagName]) return false
    return this.system.flags[flagName]
  }

  /**
   * Set actor flag to true
   * @deprecated Temporary forward
   * @param {string} flagName
   */
  async setActorFlag (flagName) {
    deprecated.noReplacement({
      was: 'actor.setActorFlag(?)',
      until: 15
    })
    await this.update({ [`system.flags.${flagName}`]: true })
  }

  /**
   * Set actor flag to false
   * @deprecated Temporary forward
   * @param {string} flagName
   */
  async unsetActorFlag (flagName) {
    deprecated.noReplacement({
      was: 'actor.unsetActorFlag(?)',
      until: 15
    })
    await this.update({ [`system.flags.${flagName}`]: false })
  }

  /**
   * Set actor flag to false
   * @deprecated Temporary forward
   * @param {string} itemId
   * @returns {Array}
   */
  getWeaponSkills (itemId) {
    deprecated.noReplacement({
      was: 'actor.getWeaponSkills(?)',
      until: 15
    })
    let weapon = fromUuidSync(itemId)
    if (!weapon) {
      weapon = this.items.get(itemId)
    } else if (typeof weapon.system === 'undefined') {
      weapon = game.packs.get(weapon.pack).get(weapon._id)
    }
    if (weapon.type !== 'weapon') return null
    const skills = []
    if (weapon.system.skill.main.id) {
      skills.push(this.items.get(weapon.system.skill.main.id))
    }

    if (weapon.system.usesAlternativeSkill && weapon.system.skill.alternativ.id) {
      skills.push(this.items.get(weapon.system.skill.alternativ.id))
    }
    return skills
  }

  /**
   * Try to find a characteristic, attribute or skill that matches the name
   * @deprecated Temporary forward
   * @param {string} name
   * @returns {undefined|object}
   */
  find (name) {
    deprecated.noReplacement({
      was: 'actor.find(?)',
      until: 15
    })
    if (!name) return undefined
    // Try ID
    const item = this.items.get(name)
    if (item) {
      return {
        type: 'item',
        value: item
      }
    }

    const regExp = /\(([^)]+)\)/
    const matches = regExp.exec(name)
    let shortName = null
    if (matches && matches.length) shortName = matches[1]
    // Try to find a skill with exact name.
    const skill = this.skills.filter(s => {
      return (
        !!s.name &&
        (s.name.toLocaleLowerCase().replace(/\s/g, '') ===
          name.toLocaleLowerCase().replace(/\s/g, '') ||
          s.name.toLocaleLowerCase().replace(/\s/g, '') ===
            name.toLocaleLowerCase().replace(/\s/g, '') ||
          s.name.toLocaleLowerCase().replace(/\s/g, '') ===
            shortName?.toLocaleLowerCase().replace(/\s/g, ''))
      )
    })
    if (skill.length) return { type: 'item', value: skill[0] }

    // Try to find a characteristic.
    const charKey = ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu']
    for (let i = 0; i < charKey.length; i++) {
      const char = this.getCharacteristic(charKey[i])
      if (char) {
        char.name = char.label
        if (
          char.key?.toLocaleLowerCase() === name.toLowerCase() ||
          char.key?.toLocaleLowerCase() === shortName?.toLowerCase()
        ) {
          return { type: 'characteristic', value: char }
        }
        if (
          char.shortName?.toLocaleLowerCase() === name.toLowerCase() ||
          char.shortName?.toLocaleLowerCase() === shortName?.toLowerCase()
        ) {
          return { type: 'characteristic', value: char }
        }
        if (
          char.label?.toLocaleLowerCase() === name.toLowerCase() ||
          char.label?.toLocaleLowerCase() === shortName?.toLowerCase()
        ) {
          return { type: 'characteristic', value: char }
        }
      }
    }

    // Try to find a attribute.
    const attribKey = ['lck', 'san']
    for (let i = 0; i < attribKey.length; i++) {
      const attr = this.getAttribute(attribKey[i])
      if (attr) {
        attr.name = attr.label
        if (
          attr.key?.toLocaleLowerCase() === name.toLowerCase() ||
          attr.key?.toLocaleLowerCase() === shortName?.toLowerCase()
        ) {
          return { type: 'attribute', value: attr }
        }
        if (
          attr.shortName?.toLocaleLowerCase() === name.toLowerCase() ||
          attr.shortName?.toLocaleLowerCase() === shortName?.toLowerCase()
        ) {
          return { type: 'attribute', value: attr }
        }
        if (
          attr.label?.toLocaleLowerCase() === name.toLowerCase() ||
          attr.label?.toLocaleLowerCase() === shortName?.toLowerCase()
        ) {
          return { type: 'attribute', value: attr }
        }
      }
    }

    // Try with partial ??
    return undefined
  }

  /**
   * Get Pilot Skills
   * @deprecated Temporary forward
   * @returns {Array}
   */
  get pilotSkills () {
    deprecated.noReplacement({
      was: 'actor.pilotSkills',
      until: 15
    })
    return this.skills.filter(s => {
      return (
        s.system.properties?.special &&
        s.system.specialization?.toLocaleLowerCase() ===
          game.i18n
            .localize('CoC7.PilotSpecializationName')
            ?.toLocaleLowerCase()
      )
    })
  }

  /**
   * Get Drive Skills
   * @deprecated Temporary forward
   * @returns {Array}
   */
  get driveSkills () {
    deprecated.noReplacement({
      was: 'actor.driveSkills',
      until: 15
    })
    return this.skills.filter(s => {
      return (
        s.system.properties?.special &&
        s.system.specialization?.toLocaleLowerCase() ===
          game.i18n
            .localize('CoC7.DriveSpecializationName')
            ?.toLocaleLowerCase()
      )
    })
  }

  /**
   * Get Token UUID
   * @deprecated Temporary forward
   * @returns {string|null}
   */
  get tokenUuid () {
    deprecated.noReplacement({
      was: 'actor.tokenUuid',
      until: 15
    })
    if (this.sheet.token) {
      return this.sheet.token.uuid
    }
    return null
  }

  /**
   * Get Token UUID
   * @deprecated Temporary forward
   * @returns {string}
   */
  get tokenKey () {
    deprecated.noReplacement({
      was: 'actor.tokenKey',
      until: 15
    })
    // Clarifier ca et token id
    /** * MODIF 0.8.x */
    // if this.sheet.token => was opened from token
    // if this.token => synthetic actor == this.isToken
    if (this.sheet.token) {
      return `${this.sheet.token.parent.id}.${this.sheet.token.id}`
    } else {
      // return null;
      return this.id
    }
    /*****************/
    // //Case 1: the actor is a synthetic actor and has a token, return token key.
    // if( this.isToken) return `${this.token.scene?._id?this.token.scene._id:'TOKEN'}.${this.token.id}`;  //REFACTORING (2)

    // //Case 2: the actor is not a token (linked actor). If the sheet have an associated token return the token key.
    // if( this.sheet.token) return `${this.sheet.token.scene?.id?this.sheet.token.scene.id:'TOKEN'}.${this.sheet.token.id}`;

    // //Case 3: Actor has no token return his ID;
    // return this.id;
  }

  /**
   * Get Actor Key
   * @deprecated Temporary forward
   * @returns {string}
   */
  get actorKey () {
    deprecated.noReplacement({
      was: 'actor.actorKey',
      until: 15
    })
    if (this.prototypeToken.actorLink) return this.id // REFACTORING (2)
    return this.tokenKey
  }

  /**
   * Get Actor Key
   * @deprecated Temporary forward
   * @param {string} key
   * @returns {string|null}
   */
  static getActorFromKey (key) {
    deprecated.noReplacement({
      was: 'actor.getActorFromKey(?)',
      until: 15
    })
    // Case 1 - a synthetic actor from a Token
    if (key.includes('.')) {
      // REFACTORING (2)
      const [sceneId, tokenId] = key.split('.')
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
    return game.actors.get(key) || null
  }

  /**
   * Does the Actor have both characteristics and formulas?
   * @returns {boolean}
   */
  get hasRollableCharacteristics () {
    if (this.system.characteristics) {
      for (const [, value] of Object.entries(this.system.characteristics)) {
        if (isNaN(Number(value.formula))) return true
      }
    }
    return false
  }

  /**
   * Before using DataModels values could be invalid
   * @deprecated No replacement
   * @returns {int}
   */
  get hosRollableSkills () {
    deprecated.noReplacement({
      was: 'actor.hosRollableSkills',
      until: 13
    })
    return false
  }

  /**
   * Roll characteristic values from formulas
   */
  async rollCharacteristicsValue () {
    this.generateCharacteristicValues(async (formula, parsed) => {
      return (await new Roll('(' + formula + ')', parsed).evaluate()).total
    })
  }

  /**
   * Generate characteristic values from formulas using function
   * @param {Function} fnRoll
   */
  async generateCharacteristicValues (fnRoll) {
    const keyPairs = {}
    const fnKeyToDotted = (key) => `system.characteristics.${key}.value`
    for (const key of this.system.schema.getField('characteristics').keys()) {
      const formula = this.system.characteristics[key].formula
      if (formula) {
        keyPairs[key] = formula
      }
    }
    await CoC7Utilities.setMultipleActorValues(this, keyPairs, fnKeyToDotted, fnRoll)
  }

  /**
   * Average characteristic values from formulas
   */
  async averageCharacteristicsValue () {
    this.generateCharacteristicValues(async (formula, parsed) => {
      return (await new CoC7AverageRoll('(' + formula + ')', parsed).evaluateSync({ minimize: true, maximize: true })).total
    })
  }

  /**
   * Test if a characteristic formula is a reference to an other characteristic and set it accordingly.
   * @deprecated Temporary forward
   * @returns {integer}
   */
  async reportCharactedriticsValue () {
    deprecated.noReplacement({
      was: 'actor.reportCharactedriticsValue',
      until: 15
    })
    const characteristics = {}
    for (const [key, value] of Object.entries(this.system.characteristics)) {
      if (value.formula && value.formula.startsWith('@')) {
        let charValue
        try {
          charValue = new Roll(
            value.formula,
            this.parseCharacteristics()
          ).evaluateSync({ maximize: true }).total
        } catch (err) {
          charValue = null
        }
        if (charValue) {
          characteristics[`system.characteristics.${key}.value`] = charValue
        }
      }
    }

    await this.update(characteristics)
  }

  /**
   * Set Characteristic value
   * @deprecated Temporary forward
   * @param {string} name
   * @param {integer} value
   * @returns {integer}
   */
  async setCharacteristic (name, value) {
    deprecated.noReplacement({
      was: 'actor.setCharacteristic(?, ?)',
      until: 15
    })
    const characteristic = {}
    const charValue = isNaN(parseInt(value)) ? null : parseInt(value)
    characteristic[name] = charValue
    if (!charValue) {
      if (value.startsWith('@')) {
        const formula = name.replace('.value', '.formula')
        characteristic[formula] = value
      }
    }

    await this.update(characteristic)
    await this.reportCharactedriticsValue()
  }

  /**
   * Remove condition and Active Effect if required
   * @deprecated Temporary forward
   * @param {bool} fastForward
   * @returns {object}
   */
  async developementPhase (fastForward = false) {
    deprecated.warningLogger({
      was: 'actor.developementPhase(?)',
      now: 'actor.developmentPhase(?)',
      until: 15
    })
    return await this.developmentPhase(fastForward, true)
  }

  /**
   * Development Phase
   * @param {bool} fastForward
   * @param {bool} isDeprecated \@deprecated
   * @returns {object} \@deprecated
   */
  async developmentPhase (fastForward = false, isDeprecated = false) {
    this.onlyRunOncePerSession = true
    let message = ''
    const rolls = []
    const skills = []
    for (const item of this.items) {
      if (item.type === 'skill') {
        if (item.system.flags.developement) {
          skills.push(item.uuid)
        }
      }
    }
    const development = await this.developSkills(skills, fastForward)
    rolls.push(...development.rolls)
    for (const messageRow of development.messageRows) {
      if (messageRow.success) {
        message += '<div class="coc7-upgrade-success">' + game.i18n.format('CoC7.DevSuccessDetails', {
          item: messageRow.name,
          augment: messageRow.augment
        }) + '</div>'
        if (messageRow.master) {
          message += '<div class="coc7-upgrade-success">' + game.i18n.format('CoC7.SanGained', {
            results: messageRow.dieOne + ' + ' + messageRow.dieTwo,
            sanGained: messageRow.sanity,
            skill: messageRow.name,
            skillValue: messageRow.value + messageRow.augment
          }) + '</div>'
        }
      } else {
        message += '<div class="coc7-upgrade-failed">' + game.i18n.format('CoC7.DevFailureDetails', {
          item: messageRow.name
        }) + '</div>'
      }
    }
    const sanityLossEvents = []
    let changed = false
    for (const sanityLossEvent of this.system.sanityLossEvents) {
      if (sanityLossEvent.immunity) {
        // Don't change
        sanityLossEvents.push(sanityLossEvent)
      } else if (sanityLossEvent.totalLoss > 1) {
        // Reduce by one
        sanityLossEvent.totalLoss--
        sanityLossEvents.push(sanityLossEvent)
        changed = true
      } else {
        // Zero so remove
        changed = true
      }
    }
    if (changed) {
      development.actorUpdate['system.sanityLossEvents'] = sanityLossEvents
      message += '<p>' + game.i18n.format('CoC7.ReduceSanityLimits') + '</p>'
    }
    if (!fastForward) {
      const messageData = {
        flavor: development.messageRows.length ? game.i18n.localize('CoC7.RollAll4Dev') : '',
        speaker: {
          actor: this.id
        },
        // rolls,
        content: message
      }
      ChatMessage.create(messageData)
    }
    if (Object.keys(development.actorUpdate).length > 0) {
      await this.update(development.actorUpdate)
    }
    if (development.updateEmbeddedItems.length > 0) {
      await this.updateEmbeddedDocuments('Item', development.updateEmbeddedItems)
    }
    /* // FoundryVTT V15 */
    if (isDeprecated) {
      const failure = []
      const success = []
      for (const roll in development.updateEmbeddedItems) {
        if (typeof roll['system.adjustments.experience'] !== 'undefined') {
          success.push(roll._id)
        } else {
          failure.push(roll._id)
        }
      }
      return {
        failure,
        success
      }
    }
  }

  /**
   * Roll luck during development phase
   * @param {bool} fastForward
   */
  async developLuck (fastForward = false) {
    const currentLuck = parseInt(this.system.attribs.lck.value, 10)
    const pulpRuleDevelopmentRollLuck = game.settings.get(FOLDER_ID, 'pulpRuleDevelopmentRollLuck')
    const upgradeRoll = await CoC7DicePool.rollNewPool({ })
    const rolls = []
    if (!fastForward) {
      rolls.push(...upgradeRoll.newRolls)
    }
    const higherThanCurrentLuck = upgradeRoll.total > currentLuck
    let augmentRoll
    let message = ''
    if (pulpRuleDevelopmentRollLuck) {
      augmentRoll = (higherThanCurrentLuck ? '2D10+10' : '1D10+5')
    } else if (higherThanCurrentLuck) {
      augmentRoll = '1D10'
    }
    if (augmentRoll) {
      const augmentValue = await new Roll(augmentRoll).evaluate()
      rolls.push(augmentValue)
      await this.update({
        'system.attribs.lck.value': currentLuck + parseInt(augmentValue.total, 10)
      })
      message = '<div class="coc7-upgrade-success">' + game.i18n.format('CoC7.LuckIncreased', {
        die: upgradeRoll.total,
        score: currentLuck,
        augment: augmentValue.total
      }) + '</div>'
    } else {
      message = '<div class="coc7-upgrade-failed">' + game.i18n.format('CoC7.LuckNotIncreased', {
        die: upgradeRoll.total,
        score: currentLuck
      }) + '</div>'
    }
    if (!fastForward) {
      const messageData = {
        flavor: game.i18n.localize('CoC7.RollLuck4Dev'),
        speaker: {
          actor: this.id
        },
        // rolls,
        content: message
      }
      ChatMessage.create(messageData)
    }
  }

  /**
   * Develop skill
   * @param {string} skillId
   * @param {bool} fastForward
   */
  async developSkill (skillId, fastForward = false) {
    const development = await this.developSkills([skillId], fastForward)
    let message = ''
    if (development.messageRows[0]?.success === true || development.messageRows[0]?.success === false) {
      const messageRow = development.messageRows[0]
      if (messageRow.success) {
        message = '<div class="coc7-upgrade-success">' + game.i18n.format('CoC7.DevSuccessDetails', {
          item: messageRow.name,
          augment: messageRow.augment
        }) + '</div>'
        if (messageRow.master) {
          message += '<div class="coc7-upgrade-success">' + game.i18n.format('CoC7.SanGained', {
            results: messageRow.dieOne + ' + ' + messageRow.dieTwo,
            sanGained: messageRow.sanity,
            skill: messageRow.name,
            skillValue: messageRow.value + messageRow.augment
          }) + '</div>'
        }
      } else {
        message = '<div class="coc7-upgrade-failed">' + game.i18n.format('CoC7.DevFailureDetails', {
          item: messageRow.name
        }) + '</div>'
      }
      const title = game.i18n.format('CoC7.DevRollTitle', {
        item: messageRow.name,
        die: messageRow.roll,
        score: messageRow.value
      })
      const messageData = {
        flavor: title,
        speaker: {
          actor: this.id
        },
        rolls: messageRow.rolls,
        content: message
      }
      ChatMessage.create(messageData)
    }
    if (Object.keys(development.actorUpdate).length > 0) {
      await this.update(development.actorUpdate)
    }
    if (development.updateEmbeddedItems.length > 0) {
      await this.updateEmbeddedDocuments('Item', development.updateEmbeddedItems)
    }
  }

  /**
   * Develop skills
   * @param {Array} uuids
   * @param {bool} fastForward
   * @returns {object}
   */
  async developSkills (uuids, fastForward = false) {
    const skillMasteringThreshold = 90
    const alwaysSuccessThreshold = 95
    const messageRows = []
    const actorUpdate = {}
    const rolls = []
    const updateEmbeddedItems = []
    let updateSanity = 0
    for (const uuid of uuids) {
      const item = await fromUuid(uuid)
      if (item && item.type === 'skill' && item.system.flags.developement) {
        const upgradeRoll = await CoC7DicePool.rollNewPool({ })
        if (!fastForward) {
          rolls.push(...upgradeRoll.newRolls)
        }
        const messageRow = {
          success: false,
          master: false,
          name: item.name,
          roll: upgradeRoll.total,
          value: item.system.value
        }
        if (upgradeRoll.total > item.system.value || upgradeRoll.total >= alwaysSuccessThreshold) {
          const augmentRoll = await new Roll('1D10').evaluate()
          if (!fastForward) {
            rolls.push(augmentRoll)
          }
          messageRow.success = true
          messageRow.augment = augmentRoll.total
          updateEmbeddedItems.push({
            _id: item.id,
            'system.adjustments.experience': item.system.adjustments.experience + messageRow.augment,
            'system.flags.developement': false
          })
          if (item.system.value < skillMasteringThreshold && item.system.value + augmentRoll.total >= skillMasteringThreshold) {
            const sanityRoll = await new Roll('2D6').evaluate()
            if (!fastForward) {
              rolls.push(sanityRoll)
            }
            messageRow.master = true
            messageRow.dieOne = sanityRoll.dice[0].values[0]
            messageRow.dieTwo = sanityRoll.dice[0].values[1]
            messageRow.sanity = sanityRoll.total
            updateSanity += messageRow.sanity
          }
        } else {
          updateEmbeddedItems.push({
            _id: item.id,
            'system.flags.developement': false
          })
        }
        messageRows.push(messageRow)
      }
    }
    if (updateSanity > 0) {
      actorUpdate['system.attribs.san.value'] = this.system.attribs.san.value + updateSanity
    }
    messageRows.sort(CoC7Utilities.sortByNameKey)
    return {
      actorUpdate,
      messageRows,
      rolls,
      updateEmbeddedItems
    }
  }

  /**
   * Is condition field set?
   * @param {string} conditionName
   * @returns {boolean}
   */
  hasConditionStatus (conditionName) {
    return this.system.conditions?.[conditionName]?.value ?? false
  }

  /**
   * Get condition value or empty string
   * @deprecated Temporary forward
   * @param {string} conditionName
   * @param {string} field
   * @returns {string}
   */
  hasConditionValue (conditionName, field) {
    deprecated.noReplacement({
      was: 'actor.hasConditionValue(?, ?)',
      until: 15
    })
    if (!this.hasConditionStatus(conditionName)) {
      return undefined
    }
    if (conditionName === STATUS_EFFECTS.tempoInsane && field === 'durationText') {
      const realTime = this.hasConditionValue(conditionName, 'realTime')
      const duration = this.hasConditionValue(conditionName, 'duration')
      if (typeof duration !== 'undefined') {
        if (realTime === true) {
          return duration + ' ' + game.i18n.localize('CoC7.rounds')
        } else if (realTime === false) {
          return duration + ' ' + game.i18n.localize('CoC7.hours')
        }
      }
      return ''
    }
    return this.system.conditions?.[conditionName]?.[field]
  }

  /**
   * Toggle status condition
   * @param {string} conditionName
   */
  async toggleCondition (conditionName) {
    const conditionValue = this.hasConditionStatus(conditionName)
    if (!conditionValue) {
      await this.conditionsSet([conditionName])
    } else {
      await this.conditionsUnset([conditionName])
    }
  }

  /**
   * Remove condition and Active Effect if required
   * @deprecated Temporary forward
   * @param {string} conditionName
   * @param {object} options
   * @param {boolean} options.forceValue
   * @param {boolean} options.realTime
   * @param {integer} options.duration
   */
  async setCondition (conditionName, { forceValue = false, realTime = null, duration = null } = {}) {
    deprecated.warningLogger({
      was: 'actor.setCondition([conditionName], { forceValue, realTime, duration })',
      now: 'actor.conditionsSet([conditionName], { forceValue, realTime, duration })',
      until: 15
    })
    await this.conditionsSet([conditionName], { forceValue, realTime, duration })
  }

  /**
   * Set the condition and Active Effect if required
   * @param {Array} conditionNames
   * @param {object} options
   * @param {boolean} options.forceValue
   * @param {boolean} options.realTime
   * @param {integer} options.duration
   */
  async conditionsSet (conditionNames, { forceValue = false, realTime = null, duration = null } = {}) {
    const createEmbeddedDocuments = []
    const updateEmbeddedDocuments = []
    const updates = {}
    if (!forceValue && game.settings.get(FOLDER_ID, 'enableStatusIcons')) {
      const systemStatuses = Object.keys(STATUS_EFFECTS)
      for (const conditionName of conditionNames) {
        if (systemStatuses.includes(conditionName)) {
          const custom = {}
          switch (conditionName) {
            case STATUS_EFFECTS.dead:
              custom.flags = {
                core: {
                  overlay: true
                }
              }
              break
            case STATUS_EFFECTS.tempoInsane:
              if (realTime === true || realTime === false) {
                foundry.utils.setProperty(custom, 'flags.' + FOLDER_ID + '.realTime', realTime)
                if (duration !== null && typeof duration !== 'undefined') {
                  if (realTime) {
                    foundry.utils.setProperty(custom, 'duration.rounds', duration)
                  } else {
                    foundry.utils.setProperty(custom, 'duration.seconds', duration * 3600)
                  }
                }
              }
              break
          }
          const found = this.effects.filter(effect => effect.statuses.has(conditionName)).map(effect => effect.id)
          if (found.length) {
            for (const id of found) {
              custom._id = id
              updateEmbeddedDocuments.push(custom)
            }
            updates[`system.conditions.${conditionName}.value`] = true
          } else {
            const effect = CONFIG.statusEffects.filter(effect => effect.id === conditionName)
            if (effect.length === 1) {
              const source = {
                img: effect[0].img,
                disabled: false
              }
              source.name = game.i18n.localize(effect[0].name)
              source.statuses = [effect[0].id]
              createEmbeddedDocuments.push(foundry.utils.mergeObject(source, custom))
            } else {
              updates[`system.conditions.${conditionName}.value`] = true
            }
          }
        } else {
          updates[`system.conditions.${conditionName}.value`] = true
        }
      }
    } else {
      for (const conditionName of conditionNames) {
        updates[`system.conditions.${conditionName}.value`] = true
      }
    }
    if (updates[`system.conditions.${STATUS_EFFECTS.tempoInsane}.value`] === true) {
      if (realTime === true || realTime === false) {
        updates[`system.conditions.${STATUS_EFFECTS.tempoInsane}.realTime`] = realTime
        if (duration !== null && typeof duration !== 'undefined') {
          updates[`system.conditions.${STATUS_EFFECTS.tempoInsane}.duration`] = duration
        }
      }
    }
    if (createEmbeddedDocuments.length > 0) {
      await this.createEmbeddedDocuments('ActiveEffect', createEmbeddedDocuments)
    }
    if (updateEmbeddedDocuments.length > 0) {
      await this.updateEmbeddedDocuments('ActiveEffect', updateEmbeddedDocuments)
    }
    if (Object.keys(updates).length > 0) {
      await this.update(updates)
    }
    // Does setting the condition also trigger other actions?
    if (!(!forceValue && game.settings.get(FOLDER_ID, 'enableStatusIcons'))) {
      // Only run this if status icons are not enabled or called from setting a status icon
      if (conditionNames.includes(STATUS_EFFECTS.criticalWounds)) {
        await this.conditionsSet([STATUS_EFFECTS.prone])
        if (!this.hasConditionStatus(STATUS_EFFECTS.unconscious) && !this.hasConditionStatus(STATUS_EFFECTS.dead)) {
          await CoC7ConCheck.create(this)
        }
      }
      if (conditionNames.includes(STATUS_EFFECTS.dead)) {
        await this.conditionsUnset([STATUS_EFFECTS.criticalWounds, STATUS_EFFECTS.dying, STATUS_EFFECTS.unconscious])
      }
    }
  }

  /**
   * Remove condition and Active Effect if required
   * @deprecated Temporary forward
   * @param {string} conditionName
   * @param {object} options
   * @param {boolean} options.forceValue
   */
  async unsetCondition (conditionName, { forceValue = false } = {}) {
    deprecated.warningLogger({
      was: 'actor.unsetCondition(conditionName, { forceValue })',
      now: 'actor.conditionsUnset([conditionName], { forceValue })',
      until: 15
    })
    await this.conditionsUnset([conditionName], { forceValue })
  }

  /**
   * Remove conditions and Active Effects if required
   * @param {Array} conditionNames
   * @param {object} options
   * @param {boolean} options.forceValue
   */
  async conditionsUnset (conditionNames, { forceValue = false } = {}) {
    let deleteIds = {}
    const updates = {}
    if (!forceValue && game.settings.get(FOLDER_ID, 'enableStatusIcons')) {
      const systemStatuses = Object.keys(STATUS_EFFECTS)
      for (const conditionName of conditionNames) {
        if (systemStatuses.includes(conditionName)) {
          const found = this.effects.filter(effect => effect.statuses.has(conditionName)).map(effect => effect.id)
          if (found.length) {
            deleteIds = found.reduce((c, id) => { c[id] = true; return c }, deleteIds)
          } else {
            updates[`system.conditions.${conditionName}.value`] = false
          }
        } else {
          updates[`system.conditions.${conditionName}.value`] = false
        }
      }
    } else {
      for (const conditionName of conditionNames) {
        updates[`system.conditions.${conditionName}.value`] = false
      }
    }
    if (Object.keys(deleteIds).length > 0) {
      await this.deleteEmbeddedDocuments('ActiveEffect', Object.keys(deleteIds))
    }
    if (Object.keys(updates).length > 0) {
      if (updates[`system.conditions.${STATUS_EFFECTS.tempoInsane}.value`] === false) {
        updates[`system.conditions.${STATUS_EFFECTS.tempoInsane}.realTime`] = false
        updates[`system.conditions.${STATUS_EFFECTS.tempoInsane}.duration`] = 0
      }
      await this.update(updates)
    }
  }

  /**
   * Not used
   * @deprecated No replacement
   * @param {string} counter
   */
  async resetCounter (counter) {
    deprecated.noLongerAvailable({ was: 'Actor.monetaryFormat(?, ?, ?)' })
    await this.update({ [counter]: 0 })
  }

  /**
   * Reset the daily sanity limit and loss
   */
  async resetDailySanity () {
    await this.update({
      'system.attribs.san.dailyLimit': Math.floor(this.system.attribs.san.value / 5),
      'system.attribs.san.dailyLoss': 0
    })
  }

  /**
   * Get Fighting Skills
   * @deprecated Temporary forward
   * @returns {Array}
   */
  get fightingSkills () {
    deprecated.noReplacement({
      was: 'actor.fightingSkills',
      until: 15
    })
    const skillList = []
    for (const value of this.items) {
      if (value.type === 'skill' && value.system.properties.fighting) {
        skillList.push(value)
      }
    }

    skillList.sort(CoC7Utilities.sortByNameKey)

    return skillList
  }

  /**
   * Get close combat weapons
   * @deprecated Temporary forward
   * @returns {Array}
   */
  get closeCombatWeapons () {
    deprecated.noReplacement({
      was: 'actor.closeCombatWeapons',
      until: 15
    })
    const weaponList = []
    for (const value of this.items) {
      if (value.type === 'weapon' && !value.system.properties.rngd) {
        const skill = this.items.get(value.system.skill.main.id)
        value.system.skill.main.value = skill ? skill.value : 0
        weaponList.push(value)
      }
    }

    weaponList.sort(CoC7Utilities.sortByNameKey)

    return weaponList
  }

  /**
   * Get Firearm Skills
   * @deprecated Temporary forward
   * @returns {Array}
   */
  get firearmSkills () {
    deprecated.noReplacement({
      was: 'actor.firearmSkills',
      until: 15
    })
    const skillList = []
    for (const value of this.items) {
      if (value.type === 'skill' && (value.system.properties.firearm || value.system.properties.ranged || value.flags.CoC7?.cocidFlag?.id === 'i.skill.fighting-throw')) {
        skillList.push(value)
      }
    }

    skillList.sort(CoC7Utilities.sortByNameKey)

    return skillList
  }

  /**
   * List all skills that could be used for weapons
   * @param {boolean} rangedFirst
   * @returns {object}
   */
  weaponSkillGroups (rangedFirst = false) {
    const skills = []
    for (const item of this.items) {
      if (item.type === 'skill') {
        let sort = 3
        let group = game.i18n.localize('CoC7.Skills')
        let name = item.name
        if (item.system.properties.fighting) {
          sort = (rangedFirst ? 2 : 0)
          group = game.i18n.localize('CoC7.SkillFighting')
          name = item.system.skillName
        } else if (item.system.properties.firearm) {
          sort = (rangedFirst ? 0 : 1)
          group = game.i18n.localize('CoC7.SkillFirearm')
          name = item.system.skillName
        } else if (item.system.properties.ranged) {
          sort = (rangedFirst ? 1 : 2)
          group = game.i18n.localize('CoC7.SkillRanged')
          name = item.system.skillName
        }
        skills.push({
          id: item.id,
          name,
          group,
          sort
        })
      }
    }
    skills.sort(CoC7Utilities.sortBySortThenNameKey)
    return skills
  }

  /**
   * Is Actor main Actor of User?
   * @deprecated Temporary forward
   * @returns {boolean}
   */
  get user () {
    deprecated.noReplacement({
      was: 'actor.user',
      until: 15
    })
    return game.users.find(user => {
      if (user.character) {
        if (user.character.id === this.id) return true
      }
      return false
    })
  }

  /**
   * Get Dodge Skill
   * @deprecated Temporary forward
   * @returns {Document|null}
   */
  get dodgeSkill () {
    deprecated.noReplacement({
      was: 'actor.dodgeSkill',
      until: 15
    })
    const skill = this.getFirstItemByCoCID('i.skill.dodge')
    if (skill) {
      return skill
    }
    const skillList = this.getSkillsByName(
      game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.dodge')
    )
    if (skillList.length !== 0) return skillList[0]
    return null
  }

  /**
   * Get credit rating Document from items
   * @returns {Document|undefined}
   */
  get creditRatingSkill () {
    const skill = this.getFirstItemByCoCID('i.skill.credit-rating')
    if (skill) {
      return skill
    }
    return this.items.getName(game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.credit-rating'))
  }

  /**
   * Get Cthulhu Mythos Document from items
   * @returns {Document|undefined}
   */
  get cthulhuMythosSkill () {
    const skill = this.getFirstItemByCoCID('i.skill.cthulhu-mythos')
    if (skill) {
      return skill
    }
    return this.items.getName(game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.cthulhu-mythos'))
  }

  /**
   * Get Cthulhu Mythos value
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get cthulhuMythos () {
    deprecated.noReplacement({
      was: 'actor.cthulhuMythos',
      until: 15
    })
    const CM = this.cthulhuMythosSkill
    if (CM) {
      const value = CM.value
      if (value) return value
      return parseInt(CM.system.value)
    }
    return 0
  }

  /**
   * Is Mythos Hardened
   * @deprecated Temporary forward
   * @returns {boolean}
   */
  get mythosHardened () {
    deprecated.noReplacement({
      was: 'actor.mythosHardened',
      until: 15
    })
    return this.getFlag('CoC7', 'mythosHardened') || false
  }

  /**
   * Is mythos hardened turned on and actor flagged for it
   * @returns {boolean}
   */
  get useMythosHardened () {
    return this.system.flags.mythosHardened && game.settings.get(FOLDER_ID, 'allowMythosHardened')
  }

  /**
   * Set Mythos Hardened to true
   * @deprecated Temporary forward
   * @returns {boolean}
   */
  async setMythosHardened () {
    deprecated.noReplacement({
      was: 'actor.setMythosHardened()',
      until: 15
    })
    await this.setFlag('CoC7', 'mythosHardened', true)
  }

  /**
   * Has the actor experienced the Mythos
   * @returns {boolean}
   */
  get mythosInsanityExperienced () {
    return this.system.flags.mythosInsanityExperienced
  }

  /**
   * Set Mythos Experienced flag
   */
  async experienceFirstMythosInsanity () {
    await this.update({
      'system.flags.mythosInsanityExperienced': true
    })
  }

  /**
   * Get Credit Rating value
   * @deprecated Temporary forward
   * @returns {integer}
   */
  get creditRating () {
    deprecated.noReplacement({
      was: 'actor.creditRating',
      until: 15
    })
    const CR = this.creditRatingSkill
    if (CR) {
      const value = CR.value
      if (value) return value
      return parseInt(CR.system.value)
    }
    return 0
  }

  /**
   * Not required
   * @deprecated No replacement
   * @param {string} format
   * @param {string} symbol
   * @param {int} value
   */
  static monetaryFormat (format, symbol, value) {
    deprecated.noLongerAvailable({ was: 'Actor.monetaryFormat(?, ?, ?)' })
  }

  /**
   * Not required
   * @deprecated No replacement
   * @param {string} format
   * @param {Array} values
   * @param {int} CR
   * @param {string} type
   * @param {int} value
   */
  static monetaryValue (format, values, CR, type, value) {
    deprecated.noLongerAvailable({ was: 'Actor.monetaryFormat(?, ?, ?, ?, ?)' })
  }

  /**
   * Not required
   * @deprecated Temporary forward
   * @returns {string}
   */
  get spendingLevel () {
    deprecated.warningLogger({
      was: 'Actor.spendingLevel',
      now: 'TypeDataModel.formattedMonetaryValue("spending")',
      until: 15
    })
    return this.system.formattedMonetaryValue('spending')
  }

  /**
   * Not required
   * @deprecated Temporary forward
   * @returns {string}
   */
  get cash () {
    deprecated.warningLogger({
      was: 'Actor.cash',
      now: 'TypeDataModel.formattedMonetaryValue("cash")',
      until: 15
    })
    return this.system.formattedMonetaryValue('cash')
  }

  /**
   * Not required
   * @deprecated Temporary forward
   * @returns {string}
   */
  get assets () {
    deprecated.warningLogger({
      was: 'Actor.assets',
      now: 'TypeDataModel.formattedMonetaryValue("assets")',
      until: 15
    })
    return this.system.formattedMonetaryValue('assets')
  }

  /**
   * Get skills
   * @deprecated Temporary forward
   * @returns {Array}
   */
  get skills () {
    deprecated.noLongerAvailable({
      was: 'Actor.skills',
      until: 15
    })
    const skillList = []
    for (const value of this.items) {
      if (value.type === 'skill') skillList.push(value)
    }

    skillList.sort(CoC7Utilities.sortByNameKey)

    return skillList
  }

  /**
   * Has user owners
   * @returns {Array}
   */
  get owners () {
    return game.users.filter(d => !d.isGM && this.testUserPermission(d, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER))
  }

  /**
   * Get players
   * @deprecated Temporary forward
   * @returns {Array}
   */
  get player () {
    deprecated.noLongerAvailable({
      was: 'Actor.player',
      until: 15
    })
    return this.owners.filter(u => u.character?.id === this.id)
  }

  /**
   * Get character user
   * @deprecated Temporary forward
   * @returns {Document|null}
   */
  get characterUser () {
    deprecated.noLongerAvailable({
      was: 'Actor.characterUser',
      until: 15
    })
    return (
      game.users.contents.filter(u => u.character?.id === this.id)[0] || null
    )
  }

  /**
   * Set HP value
   * @param {integer} value
   * @returns {integer}
   */
  async setHp (value) {
    const hpMax = (this.system.attribs.hp.max ?? 0)
    const newValue = Math.min(hpMax, Math.max(0, value))
    const hpValue = (this.system.attribs.hp.value ?? 0)
    if (newValue >= hpValue) {
      return this.#modifyHp(newValue)
    }
    const damage = await this.dealDamage(hpValue - newValue, { ignoreArmor: true })
    return hpValue - damage
  }

  /**
   * Modify HP value on Actor that has attrib.hp and attrib.armor
   * @param {int} modifyValue
   * @returns {int}
   */
  async #modifyHp (modifyValue) {
    if (this.system.schema.getField('attribs')?.getField('hp') && this.system.schema.getField('attribs')?.getField('armor')) {
      const hpMax = (this.system.attribs.hp.max ?? 0)
      const hpValue = (this.system.attribs.hp.value ?? 0)
      const hpNew = Math.min(hpMax, Math.max(0, hpValue + modifyValue))
      await this.update({ 'system.attribs.hp.value': hpNew })
      return hpNew
    }
    ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
    throw new Error('HALT')
  }

  /**
   * Deal damage to Actor that has attrib.hp and attrib.armor
   * @param {int} amount
   * @param {object} options
   * @param {string|null|int} options.armor
   * @param {boolean} options.ignoreArmor
   * @returns {int}
   */
  async dealDamage (amount, { armor = null, ignoreArmor = false } = {}) {
    if (this.system.schema.getField('attribs')?.getField('hp') && this.system.schema.getField('attribs')?.getField('armor')) {
      const damageValue = parseInt(amount, 10)
      if (isNaN(damageValue)) {
        /* // FoundryVTT V12 */
        ui.notifications.warn(game.i18n.format('CoC7.ErrorUnableToParseArmorFormula', { value: amount }))
        return 0
      }
      let armorValue = 0
      if (!ignoreArmor) {
        let armorFormula = armor ?? this.system.attribs.armor.value
        if (typeof armorFormula?.value !== 'undefined') {
          deprecated.warningLogger({
            was: 'Actor.dealDamage(?, { armor: { value: ? } })',
            now: 'Actor.dealDamage(?, { armor: ? })',
            until: 15
          })
          armorFormula = armorFormula.value
        }
        try {
          armorFormula = ((armorFormula ?? '').toString().trim() === '' ? 0 : armorFormula)
          armorValue = parseInt((await new Roll(armorFormula.toString()).roll()).total, 10)
        } catch (e) {
          /* // FoundryVTT V12 */
          ui.notifications.warn(game.i18n.format('CoC7.ErrorUnableToParseArmorFormula', { value: armorValue }))
          armorValue = 0
        }
      }
      const damageTotal = damageValue - armorValue
      if (damageTotal <= 0) return 0
      const hpNew = await this.#modifyHp(-damageTotal)
      const hpMax = (this.system.attribs.hp.max ?? 0)
      if (damageTotal >= hpMax) {
        await this.conditionsSet([STATUS_EFFECTS.dead])
      } else if (game.settings.get(FOLDER_ID, 'pulpRuleIgnoreMajorWounds')) {
        if (hpNew === 0) {
          if (damageTotal >= Math.ceil(hpMax / 2)) {
            this.conditionsSet([STATUS_EFFECTS.dying])
          } else {
            this.conditionsSet([STATUS_EFFECTS.unconscious])
          }
        } else if (damageTotal >= Math.ceil(hpMax / 2)) {
          await CoC7ConCheck.create(this)
        }
      } else {
        let hasMajorWound = false
        if (damageTotal >= Math.ceil(hpMax / 2)) {
          await this.conditionsSet([STATUS_EFFECTS.criticalWounds])
          hasMajorWound = true
        } else {
          hasMajorWound = this.hasConditionStatus(STATUS_EFFECTS.criticalWounds)
        }
        if (hpNew === 0) {
          if (hasMajorWound) {
            await this.conditionsSet([STATUS_EFFECTS.unconscious, STATUS_EFFECTS.dying])
          } else {
            await this.conditionsSet([STATUS_EFFECTS.unconscious])
          }
        }
      }
      return damageTotal
    }
    ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
    return 0
  }

  /**
   * Has status major wound
   * @deprecated Temporary forward
   * @returns {string}
   */
  get majorWound () {
    deprecated.noReplacement({
      was: 'actor.majorWound',
      until: 15
    })
    return this.hasConditionStatus(STATUS_EFFECTS.criticalWounds)
  }

  /**
   * Has status dying
   * @deprecated Temporary forward
   * @returns {string}
   */
  get dying () {
    deprecated.noReplacement({
      was: 'actor.dying',
      until: 15
    })
    return this.hasConditionStatus(STATUS_EFFECTS.dying)
  }

  /**
   * Has status unconscious
   * @deprecated Temporary forward
   * @returns {string}
   */
  get unconscious () {
    deprecated.noReplacement({
      was: 'actor.unconscious',
      until: 15
    })
    return this.hasConditionStatus(STATUS_EFFECTS.unconscious)
  }

  /**
   * Has status dead
   * @deprecated Temporary forward
   * @returns {string}
   */
  get dead () {
    deprecated.noReplacement({
      was: 'actor.dead',
      until: 15
    })
    return this.hasConditionStatus(STATUS_EFFECTS.dead)
  }

  /**
   * Has status prone
   * @deprecated Temporary forward
   * @returns {string}
   */
  get prone () {
    deprecated.noReplacement({
      was: 'actor.prone',
      until: 15
    })
    return this.hasConditionStatus(STATUS_EFFECTS.prone)
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
    if ((typeof data.img === 'undefined' || data.img === 'icons/svg/mystery-man.svg') && typeof CONFIG.Actor.dataModels[data.type]?.defaultImg === 'string') {
      changes.img = CONFIG.Actor.dataModels[data.type]?.defaultImg
    }
    if (typeof CONFIG.Actor.dataModels[data.type]?._preCreateChanges === 'function') {
      CONFIG.Actor.dataModels[data.type]._preCreateChanges(changes, data, options, user)
    }
    if (Object.keys(changes).length) {
      this.updateSource(changes)
    }
    return super._preCreate(data, options, user)
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    if (source.type === 'vehicle') {
      // Move vehicle attribs to vehicle stats
      if (typeof source.system?.description?.notes !== 'undefined' && typeof source.system?.description?.keeper === 'undefined') {
        foundry.utils.setProperty(source, 'system.description.keeper', source.system.description.notes)
      }
      if (typeof source.system?.attribs?.hp?.value !== 'undefined' && typeof source.system?.stats?.hp === 'undefined') {
        foundry.utils.setProperty(source, 'system.stats.hp', source.system.attribs.hp.value)
      }
      if (typeof source.system?.attribs?.mov?.value !== 'undefined' && typeof source.system?.stats?.mov === 'undefined') {
        foundry.utils.setProperty(source, 'system.stats.mov', source.system.attribs.mov.value)
      }
      if (typeof source.system?.attribs?.build?.value !== 'undefined' && typeof source.system?.stats?.build?.value === 'undefined') {
        foundry.utils.setProperty(source, 'system.stats.build.value', source.system.attribs.build.value)
      }
      if (typeof source.system?.attribs?.build?.current !== 'undefined' && typeof source.system?.stats?.build?.current === 'undefined') {
        foundry.utils.setProperty(source, 'system.stats.build.current', source.system.attribs.build.current)
      }
      if (typeof source.system?.attribs?.armor?.value !== 'undefined' && typeof source.system?.stats?.armor?.value === 'undefined') {
        foundry.utils.setProperty(source, 'system.stats.armor.value', source.system.attribs.armor.value)
      }
      if (typeof source.system?.attribs?.armor?.localized !== 'undefined' && typeof source.system?.stats?.armor?.localized === 'undefined') {
        foundry.utils.setProperty(source, 'system.stats.armor.localized', source.system.attribs.armor.localized)
      }
      if (typeof source.system?.attribs?.armor?.locations !== 'undefined' && typeof source.system?.stats?.armor?.locations === 'undefined') {
        foundry.utils.setProperty(source, 'system.stats.armor.locations', source.system.attribs.armor.locations)
      }
    }
    // Migrate status to conditions
    if (['character', 'npc', 'creature'].includes(source.type) && typeof source.system?.status !== 'undefined' && typeof source.system?.conditions === 'undefined') {
      if (source.system.status?.criticalWounds?.value) {
        foundry.utils.setProperty(source, 'system.conditions.criticalWounds.value', true)
      }
      if (source.system.status?.unconscious?.value) {
        foundry.utils.setProperty(source, 'system.conditions.unconscious.value', true)
      }
      if (source.system.status?.dying?.value) {
        foundry.utils.setProperty(source, 'system.conditions.dying.value', true)
      }
      if (source.system.status?.dead?.value) {
        foundry.utils.setProperty(source, 'system.conditions.dead.value', true)
      }
      if (source.system.status?.prone?.value) {
        foundry.utils.setProperty(source, 'system.conditions.prone.value', true)
      }
      if (source.system.status?.tempoInsane?.value) {
        foundry.utils.setProperty(source, 'system.conditions.tempoInsane.value', true)
      }
      if (source.system.status?.indefInsane?.value) {
        foundry.utils.setProperty(source, 'system.conditions.indefInsane.value', true)
      }
      for (const offset in source.effects ?? []) {
        const match = source.effects[offset].icon.match(/\/(hanging-spider|tentacles-skull|arm-sling|heart-beats|tombstone|knocked-out-stars|falling|skull|unconscious)\./)
        if (match) {
          let statusId = ''
          switch (match[1]) {
            case 'hanging-spider':
              statusId = 'tempoInsane'
              break
            case 'tentacles-skull':
              statusId = 'indefInsane'
              break
            case 'arm-sling':
              statusId = 'criticalWounds'
              break
            case 'heart-beats':
              statusId = 'dying'
              break
            case 'tombstone':
            case 'skull':
              statusId = 'dead'
              break
            case 'knocked-out-stars':
            case 'unconscious':
              statusId = 'unconscious'
              break
            case 'falling':
              statusId = 'prone'
              break
          }
          if (statusId !== '') {
            foundry.utils.setProperty(source, 'system.conditions.' + statusId + '.value', true)
          }
          if (source.effects[offset].flags?.core?.statusId !== statusId) {
            foundry.utils.setProperty(source.effects[offset], 'flags.core.statusId', statusId)
          }
        }
      }
    }
    // Migrate encounteredCreatures to sanityLossEvents
    if (source.type === 'character' && typeof source.system?.encounteredCreatures !== 'undefined' && typeof source.system?.sanityLossEvents === 'undefined') {
      const groups = {}
      for (const sanityLossEvent of source.system.encounteredCreatures) {
        if (sanityLossEvent.totalLoss > 0) {
          groups[sanityLossEvent.name] = Math.max(groups[sanityLossEvent.name] ?? 0, sanityLossEvent.totalLoss)
        }
      }
      const sanityLossEvents = []
      for (const name in groups) {
        sanityLossEvents.push({
          type: name,
          totalLoss: groups[name],
          immunity: false
        })
      }
      foundry.utils.setProperty(source, 'system.sanityLossEvents', sanityLossEvents)
    }
    // Migrate credit to monetary
    if (source.type === 'character' && typeof source.system?.credit?.multiplier !== 'undefined' && typeof source.system?.monetary === 'undefined') {
      foundry.utils.setProperty(source, 'system.monetary.symbol', (source.system.credit?.monetarySymbol ?? '').toString().trim() || '$')
      const multiplier = parseInt(source.system.credit.multiplier) || 1
      foundry.utils.setProperty(source, 'system.monetary.spent', source.system.credit.spent)
      foundry.utils.setProperty(source, 'system.monetary.assetsDetails', source.system.credit.assetsDetails)
      foundry.utils.setProperty(source, 'system.monetary.spendingLevel', source.system.credit.spendingLevel)
      foundry.utils.setProperty(source, 'system.monetary.cash', source.system.credit.cash)
      foundry.utils.setProperty(source, 'system.monetary.assets', source.system.credit.assets)
      foundry.utils.setProperty(source, 'system.monetary.values', foundry.utils.duplicate(CONFIG.Actor.dataModels.character.schema.getField('monetary').fields.values.initial))
      if (multiplier !== 1) {
        for (const offset in source.system.monetary.values) {
          foundry.utils.setProperty(source.system.monetary.values[offset], 'cashValue', multiplier * source.system.monetary.values[offset].cashValue)
          foundry.utils.setProperty(source.system.monetary.values[offset], 'assetsValue', multiplier * source.system.monetary.values[offset].assetsValue)
          foundry.utils.setProperty(source.system.monetary.values[offset], 'spendingValue', multiplier * source.system.monetary.values[offset].spendingValue)
        }
      }
    }
    return super.migrateData(source)
  }

  /**
   * Create unique name
   * @param {string} name
   * @param {string} type
   * @returns {string}
   */
  uniqueItemName (name, type = '') {
    let index = 2
    let uniqueName = name
    while (this.getItemByName(uniqueName, type)) {
      uniqueName = name + ' ' + index.toString()
      index++
    }
    return uniqueName
  }

  /**
   * Get document of item matching name
   * @param {string} itemName
   * @param {string} type
   * @returns {Document|undefined}
   */
  getItemByName (itemName, type = '') {
    const parts = CoC7ModelsItemSkillSystem.guessNameParts(itemName)
    const name = (parts.system.skillName ?? parts.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    const found = this.items.find(d => (type === '' || d.type === type) && (d.flags?.[FOLDER_ID]?.cocidFlag?.id === itemName || (d.system.skillName ?? d.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase() === name))
    return found
  }

  /**
   * Does the current user only have limited permission for this actor
   * @returns {boolean}
   */
  get isLimitedView () {
    return (!game.user.isGM && this.testUserPermission(game.user, 'LIMITED', { exact: true }))
  }

  /**
   * Has user owner
   * @returns {Document|undefined}
   */
  get userOwner () {
    const users = game.users.filter(d => !d.isGM && this.testUserPermission(d, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER))
    if (users.length === 1) {
      return users[0]
    }
    return users.find(u => u.character?.id === this.id)
  }

  /**
   * All skills and characteristics
   * @param {null|Document} actor
   * @returns {Promise<Array>}
   */
  static async everyField (actor) {
    const listOptions = {}
    for (const key of ['lck', 'san']) {
      const field = CONFIG.Actor.dataModels.character.schema.get('attribs').get(key)
      if (field) {
        const name = game.i18n.localize(field.hint)
        listOptions[name] = {
          type: 'attribs',
          key: field.name,
          name,
          shortName: game.i18n.localize(field.label),
          value: actor?.system.attribs[key].value
        }
      }
    }
    for (const field of Object.values(CONFIG.Actor.dataModels.character.schema.get('characteristics')?.fields ?? [])) {
      const name = game.i18n.localize(field.hint)
      listOptions[name] = {
        type: 'characteristics',
        key: field.name,
        name,
        shortName: game.i18n.localize(field.label),
        value: actor?.system.characteristics[field.name].value
      }
    }
    for (const item of Object.values(await game.CoC7.skillNames.getList())) {
      if (!item.system.isAnySkill) {
        listOptions[item.name] = {
          type: 'cocid',
          key: item.flags[FOLDER_ID].cocidFlag.id,
          name: item.name,
          shortName: item.name,
          base: item.system.base,
          value: null
        }
      }
    }
    if (actor) {
      for (const item of actor.items.filter(doc => doc.type === 'skill' && !doc.system.isAnySkill)) {
        listOptions[item.name] = {
          type: 'skill',
          key: item._id,
          name: item.name,
          shortName: item.name,
          uuid: item.uuid,
          value: item.system.value
        }
      }
    }
    return Object.values(listOptions).sort(CoC7Utilities.sortByNameKey)
  }
}
