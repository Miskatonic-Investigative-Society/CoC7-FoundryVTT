/* global Actor CONFIG fetch foundry game ui */
// cSpell:words injurues malf subskill skillname
import { FOLDER_ID } from '../constants.js'
import CoC7ModelsItemSkillSystem from '../models/item/skill-system.js'
import CoC7DirectoryPicker from './directory-picker.js'
import CoC7Utilities from './utilities.js'
import deprecated from '../deprecated.js'

export default class CoC7DholeHouseActorImporter {
  /**
   * Convert backstory key into html
   * @param {object} backstoryJSON
   * @returns {object}
   */
  static getBackstory (backstoryJSON) {
    // <key>, <title>, <class name ?? key>
    const sections = [
      ['description', 'Description'],
      ['traits', 'Traits'],
      ['ideology', 'Ideology'],
      ['injurues', 'Injuries', 'injuries'],
      ['people', 'People'],
      ['phobias', 'Phobias'],
      ['locations', 'Locations'],
      ['tomes', 'Tomes'],
      ['possessions', 'Possessions'],
      ['encounters', 'Encounters']
    ]
    const backstory = {
      block: [],
      sections: []
    }
    for (const section of sections) {
      if (backstoryJSON[section[0]] !== null) {
        if (typeof section[2] === 'undefined' || section[2] === '') {
          section[2] = section[0]
        }
        backstory.block.push(`<h3>${section[1]}</h3>\n<div class="${section[2]}">\n${backstoryJSON[section[0]]}\n</div>`)
        backstory.sections.push({
          title: section[1],
          value: backstoryJSON[section[0]]
        })
      }
    }
    backstory.block = '<h2>Backstory</h2>\n' + backstory.block.join('\n', backstory.block)
    return backstory
  }

  /**
   * Convert Dholehouse JSON into Foundry Actor JSON
   * @param {object} dholeHouseData
   * @param {object} options
   * @param {string} options.source
   * @param {object} progressBar
   * @returns {object}
   */
  static async convertDholeHouseCharacterData (dholeHouseData, options, progressBar) {
    if (CONFIG.debug.CoC7Importer) {
      console.log('Source:', dholeHouseData)
    }
    dholeHouseData = dholeHouseData.Investigator
    const backstories = CoC7DholeHouseActorImporter.getBackstory(dholeHouseData.Backstory ?? {})
    const cData = {
      name: dholeHouseData.PersonalDetails.Name,
      actor: {
        characteristics: {
          str: { value: parseInt(dholeHouseData.Characteristics.STR, 10) },
          con: { value: parseInt(dholeHouseData.Characteristics.CON, 10) },
          siz: { value: parseInt(dholeHouseData.Characteristics.SIZ, 10) },
          dex: { value: parseInt(dholeHouseData.Characteristics.DEX, 10) },
          app: { value: parseInt(dholeHouseData.Characteristics.APP, 10) },
          int: { value: parseInt(dholeHouseData.Characteristics.INT, 10) },
          pow: { value: parseInt(dholeHouseData.Characteristics.POW, 10) },
          edu: { value: parseInt(dholeHouseData.Characteristics.EDU, 10) }
        },
        attribs: {
          san: {
            value: parseInt(dholeHouseData.Characteristics.Sanity, 10),
            max: parseInt(dholeHouseData.Characteristics.SanityMax, 10),
            dailyLimit: Math.floor(dholeHouseData.Characteristics.Sanity / 5)
          },
          hp: {
            value: parseInt(dholeHouseData.Characteristics.HitPts, 10),
            max: parseInt(dholeHouseData.Characteristics.HitPtsMax, 10)
          },
          mp: {
            value: parseInt(dholeHouseData.Characteristics.MagicPts, 10),
            max: parseInt(dholeHouseData.Characteristics.MagicPtsMax, 10)
          },
          lck: { value: parseInt(dholeHouseData.Characteristics.Luck, 10) },
          mov: { value: parseInt(dholeHouseData.Characteristics.Move, 10) },
          db: { value: dholeHouseData.Characteristics.DamageBonus },
          build: { value: parseInt(dholeHouseData.Characteristics.Build, 10) }
        },
        infos: {
          occupation: dholeHouseData.PersonalDetails.Occupation,
          age: dholeHouseData.PersonalDetails.Age,
          sex: dholeHouseData.PersonalDetails.Gender,
          residence: dholeHouseData.PersonalDetails.Residence,
          birthplace: dholeHouseData.PersonalDetails.Birthplace
        },
        backstory: backstories.block,
        biography: backstories.sections,
        description: {
          keeper: game.i18n.localize('CoC7.DholeHouseActorImporterSource')
        }
      },
      skills: await CoC7DholeHouseActorImporter.extractSkills(dholeHouseData.Skills.Skill ?? [], options, progressBar),
      possessions: await CoC7DholeHouseActorImporter.extractPossessions(dholeHouseData.Possessions?.item ?? [], options, progressBar)
    }
    return cData
  }

  /**
   * Convert Dholehouse skill name to system skill name
   * @param {string} name
   * @param {string} specialization
   * @returns {object}
   */
  static makeSkillName (name, specialization) {
    if (specialization === 'None') {
      specialization = 'Any'
    }
    let isOwn = false
    if (name === 'Language (Other)' || name === 'Language (Own)') {
      name = 'Language'
      isOwn = (name === 'Language (Own)')
    } else if (name === 'Operate Heavy Machine') {
      name = 'Operate Heavy Machinery'
    } else if (name === 'Throw' && specialization === '') {
      name = 'Fighting'
      specialization = 'Throw'
    }
    return {
      isOwn,
      skillName: specialization === '' ? name : specialization,
      specialization: specialization === '' ? '' : name,
      name: name + (specialization === '' ? '' : ' (' + specialization + ')')
    }
  }

  /**
   * Create skill objects
   * @param {Array} dholeHouseSkills
   * @param {object} options
   * @param {string} options.source
   * @param {object} progressBar
   * @returns {Array}
   */
  static async extractSkills (dholeHouseSkills, options, progressBar) {
    const lookFor = []
    for (const skill of dholeHouseSkills) {
      if (skill.subskill === 'None') {
        continue
      }
      const parts = CoC7DholeHouseActorImporter.makeSkillName(skill.name, skill.subskill ?? '')
      lookFor.push({
        isOwn: parts.isOwn,
        skillName: parts.skillName,
        specialization: parts.specialization,
        name: parts.name,
        value: parseInt(skill.value ?? 0, 10),
        occupation: (skill.occupation === true || skill.occupation === 'true')
      })
    }
    const foundItems = await CoC7Utilities.guessItems('skill', lookFor.map(i => i.name), { source: options.source, fallbackAny: true })
    const skills = []
    for (const skill of lookFor) {
      progressBar.bar.update({ pct: progressBar.current / progressBar.max })
      progressBar.current++
      let cloned
      if (typeof foundItems[skill.name] !== 'undefined') {
        cloned = foundry.utils.duplicate(foundItems[skill.name])
        foundry.utils.setProperty(cloned, 'name', skill.name)
        foundry.utils.setProperty(cloned, 'system.skillName', skill.skillName)
        foundry.utils.setProperty(cloned, 'system.specialization', skill.specialization)
        foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.skill.' + CoC7Utilities.toKebabCase(skill.name))
        if (cloned.system.properties?.requiresname ?? false) {
          foundry.utils.setProperty(cloned, 'system.properties.requiresname', false)
        }
        if (cloned.system.properties?.picknameonly ?? false) {
          foundry.utils.setProperty(cloned, 'system.properties.picknameonly', false)
        }
      } else {
        cloned = CoC7ModelsItemSkillSystem.emptyObject({
          name: skill.name
        })
        if (skill.specialization === 'Fighting') {
          foundry.utils.setProperty(cloned, 'system.properties.fighting', true)
          foundry.utils.setProperty(cloned, 'system.properties.push', false)
        } else if (skill.specialization === 'Firearms') {
          foundry.utils.setProperty(cloned, 'system.properties.firearm', true)
          foundry.utils.setProperty(cloned, 'system.properties.push', false)
        } else if (skill.skillName === 'Dodge') {
          foundry.utils.setProperty(cloned, 'system.properties.push', false)
        }
        foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.skill.' + CoC7Utilities.toKebabCase(cloned.name))
      }
      if (cloned.system.skillName === 'Any') {
        foundry.utils.setProperty(cloned, 'name', cloned.name.replace(' (Any)', ' (None)'))
        foundry.utils.setProperty(cloned, 'system.skillName', 'None')
        foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.skill.' + CoC7Utilities.toKebabCase(cloned.name))
      }
      foundry.utils.setProperty(cloned, 'system.adjustments.base', parseInt(skill.value ?? 0, 10))
      foundry.utils.setProperty(cloned, 'system.flags.occupation', (skill.occupation === true || skill.occupation === 'true'))
      if (skill.isOwn) {
        foundry.utils.setProperty(cloned, 'system.properties.own', true)
      }
      skills.push(cloned)
    }
    return skills
  }

  /**
   * Find skill used by weapon
   * @param {string} skillName
   * @param {Actor} character
   * @returns {Item|undefined}
   */
  static findWeaponSkillId (skillName, character) {
    const skills = character.getEmbeddedCollection('Item')
    const checkName = skillName.replace(/^\((.+)\)$/, '$1')
    const characterSkill = skills.find(doc => doc.system?.skillName === checkName || doc.system?.skillName?.indexOf(checkName) > -1)
    return characterSkill
  }

  /**
   * Create skill objects
   * @param {Array|object} dholehousePossessions
   * @param {object} options
   * @param {string} options.source
   * @param {object} progressBar
   * @returns {Array}
   */
  static async extractPossessions (dholehousePossessions, options, progressBar) {
    const foundItems = await CoC7Utilities.guessItems('item', dholehousePossessions.map(i => i.description), { source: options.source })
    const items = []
    if (!Array.isArray(dholehousePossessions) && dholehousePossessions != null) {
      dholehousePossessions = [dholehousePossessions]
    }
    for (const item of dholehousePossessions) {
      progressBar.bar.update({ pct: progressBar.current / progressBar.max })
      progressBar.current++
      let cloned = null
      if (typeof foundItems[item.description] !== 'undefined') {
        cloned = foundry.utils.duplicate(foundItems[item.description])
      } else {
        cloned = {
          name: item.description,
          type: 'item'
        }
      }
      foundry.utils.setProperty(cloned, 'name', item.description)
      foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.item.' + CoC7Utilities.toKebabCase(item.description))
      items.push(cloned)
    }
    return items
  }

  /**
   * Take weapon data and return array of Weapon Items
   * @param {Array|object} dholehouseWeapons
   * @param {Actor} character
   * @param {object} options
   * @param {string} options.source
   * @param {object} progressBar
   * @returns {Array}
   */
  static async extractWeapons (dholehouseWeapons, character, options, progressBar) {
    const foundItems = await CoC7Utilities.guessItems('weapon', dholehouseWeapons.map(i => i.name), { source: options.source })
    const weapons = []
    if (!Array.isArray(dholehouseWeapons)) {
      dholehouseWeapons = [dholehouseWeapons]
    }
    for (const weapon of dholehouseWeapons) {
      progressBar.bar.update({ pct: progressBar.current / progressBar.max })
      progressBar.current++
      const skill = CoC7DholeHouseActorImporter.findWeaponSkillId(weapon.skillname, character)
      const damage = weapon.damage.replace(/\+DB/i, '')
      const addb = damage !== weapon.damage
      let cloned = null
      if (typeof foundItems[weapon.name] !== 'undefined') {
        cloned = foundry.utils.duplicate(foundItems[weapon.name])
        cloned.system.skill.main.name = skill?.name ?? ''
        cloned.system.skill.main.id = skill?.id ?? ''
        cloned.system.range = cloned.system.range ?? {}
        cloned.system.range.normal = cloned.system.range.normal ?? {}
        cloned.system.range.normal.damage = damage
        cloned.system.ammo = parseInt(weapon.ammo, 10)
        cloned.system.bullets = parseInt(weapon.ammo, 10)
        cloned.system.malfunction = parseInt(weapon.malf, 10)
        cloned.system.properties = cloned.system.properties ?? {}
        cloned.system.properties.melee = skill?.system.properties?.fighting ?? false
        cloned.system.properties.rngd = skill?.system.properties?.firearm ?? false
        cloned.system.properties.addb = addb
        foundry.utils.setProperty(cloned, 'name', weapon.name)
        foundry.utils.setProperty(cloned, 'flags.' + FOLDER_ID + '.cocidFlag.id', 'i.weapon.' + CoC7Utilities.toKebabCase(weapon.name))
      } else {
        cloned = {
          name: weapon.name,
          type: 'weapon',
          system: {
            skill: {
              main: {
                name: skill?.name ?? '',
                id: skill?.id ?? ''
              }
            },
            range: {
              normal: {
                damage
              }
            },
            ammo: parseInt(weapon.ammo, 10),
            bullets: parseInt(weapon.ammo, 10),
            malfunction: parseInt(weapon.malf, 10),
            properties: {
              melee: skill?.system.properties?.fighting ?? false,
              rngd: skill?.system.properties?.firearm ?? false,
              addb
            }
          },
          flags: {
            [FOLDER_ID]: {
              cocidFlag: {
                id: 'i.weapon.' + CoC7Utilities.toKebabCase(weapon.name)
              }
            }
          }
        }
      }
      weapons.push(cloned)
    }
    return weapons
  }

  /**
   * Convert base 64 png data to png and save
   * @param {string} base64Portrait
   * @param {string} fileName
   * @returns {string}
   */
  static async savePortrait (base64Portrait, fileName) {
    const base64Response = await fetch('data:image/png;base64,' + base64Portrait)
    const imageBlob = await base64Response.blob()
    const filePath = CoC7DirectoryPicker.uploadToDefaultDirectory(
      imageBlob,
      fileName
    )
    return filePath
  }

  /**
   * Convert Dholehouse JSON into Foundry Actor
   * @param {object} dholeHouseCharacterData
   * @param {object} options
   * @param {string} options.source
   * @returns {false|object}
   */
  static async createNPCFromDholeHouse (dholeHouseCharacterData, options) {
    if (!game.user?.can('FILES_UPLOAD')) {
      ui.notifications.error('CoC7.ActorImporterUploadError', { localize: true })
      return false
    }
    // Normalize Skills, Possessions, and Weapons
    if (typeof dholeHouseCharacterData.Investigator?.Skills?.Skill === 'undefined' || dholeHouseCharacterData.Investigator.Skills.Skill === null) {
      foundry.setProperty(dholeHouseCharacterData, 'Investigator.Skills.Skill', [])
    } else if (!Array.isArray(dholeHouseCharacterData.Investigator.Skills.Skill)) {
      foundry.setProperty(dholeHouseCharacterData, 'Investigator.Skills.Skill', [dholeHouseCharacterData.Investigator.Skills.Skill])
    }
    if (typeof dholeHouseCharacterData.Investigator?.Possessions?.item === 'undefined' || dholeHouseCharacterData.Investigator.Possessions.item === null) {
      foundry.setProperty(dholeHouseCharacterData, 'Investigator.Possessions.item', [])
    } else if (!Array.isArray(dholeHouseCharacterData.Investigator.Possessions.item)) {
      foundry.setProperty(dholeHouseCharacterData, 'Investigator.Possessions.item', [dholeHouseCharacterData.Investigator.Possessions.item])
    }
    if (typeof dholeHouseCharacterData.Investigator?.Weapons?.weapon === 'undefined' || dholeHouseCharacterData.Investigator.Weapons.weapon === null) {
      foundry.setProperty(dholeHouseCharacterData, 'Investigator.Weapons.weapon', [])
    } else if (!Array.isArray(dholeHouseCharacterData.Investigator.Weapons.weapon)) {
      foundry.setProperty(dholeHouseCharacterData, 'Investigator.Weapons.weapon', [dholeHouseCharacterData.Investigator.Weapons.weapon])
    }
    const progressBar = {
      current: 0,
      max: dholeHouseCharacterData.Investigator.Skills.Skill.length + dholeHouseCharacterData.Investigator.Possessions.item.length + dholeHouseCharacterData.Investigator.Weapons.weapon.length + 1
    }
    /* // FoundryVTT V12 */
    if (foundry.utils.isNewerVersion(game.version, 13)) {
      progressBar.bar = ui.notifications.info('CoC7.CoCIDFlag.loading', { localize: true, progress: true, console: false })
    } else {
      progressBar.bar = deprecated.displayProgressBar(game.i18n.localize('CoC7.CoCIDFlag.loading'))
    }
    const characterData = await CoC7DholeHouseActorImporter.convertDholeHouseCharacterData(dholeHouseCharacterData, options, progressBar)
    if (CONFIG.debug.CoC7Importer) {
      console.log('Character Data:', characterData)
    }
    const importedCharactersFolder = await CoC7Utilities.createImportCharactersFolderIfNotExists()
    if (!CoC7DirectoryPicker.createDefaultDirectory()) {
      return false
    }
    const actorData = {
      name: characterData.name,
      type: 'character',
      folder: importedCharactersFolder.id,
      system: characterData.actor
    }
    const npc = await Actor.create(actorData)
    // If possible upload the image portrait
    if (dholeHouseCharacterData.Investigator.PersonalDetails.Portrait?.length > 10) {
      const fileName = 'avatar-' + npc.id + '.png'
      const portrait = await CoC7DholeHouseActorImporter.savePortrait(
        dholeHouseCharacterData.Investigator.PersonalDetails.Portrait,
        fileName
      )
      if (portrait !== false) {
        npc.update({
          img: portrait
        })
      }
    }
    if (CONFIG.debug.CoC7Importer) {
      console.log('Skills: ', characterData.skills)
    }
    if (characterData.skills.length > 0) {
      await npc.createEmbeddedDocuments('Item', characterData.skills, {
        renderSheet: false
      })
    }
    if (CONFIG.debug.CoC7Importer) {
      console.log('Possessions: ', characterData.possessions)
    }
    if (characterData.possessions.length > 0) {
      await npc.createEmbeddedDocuments('Item', characterData.possessions, {
        renderSheet: false
      })
    }
    const weapons = await CoC7DholeHouseActorImporter.extractWeapons(dholeHouseCharacterData.Investigator.Weapons?.weapon ?? [], npc, options, progressBar)
    if (CONFIG.debug.CoC7Importer) {
      console.log('Weapons: ', weapons)
    }
    if (weapons.length > 0) {
      await npc.createEmbeddedDocuments('Item', weapons, {
        renderSheet: false
      })
    }
    progressBar.bar.update({ pct: 1 })
    return npc
  }
}
