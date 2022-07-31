/* global Actor, CONFIG, duplicate, game, ui, fetch */
import { CoCActor } from '../actors/actor.js'
import { CoC7DirectoryPicker } from '../scripts/coc7-directory-picker.js'
import { CoC7Utilities } from '../utilities.js'

/**
 * CoC7ActorImporter helper class to import an Actor from the raw text description.
 */
export class CoC7DholeHouseActorImporter {
  /**
   * Compose the Backstory from the different blocks.
   * @param {} backstoryJSON DholeHouse backstory JSON
   * @returns HTML with the formatted backstory
   */
  static getBackstory (backstoryJSON) {
    const sections = [
      ['description', 'Description'],
      ['traits', 'Traits'],
      ['ideology', 'Ideology'],
      ['injurues', 'Injuries'],
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
        backstory.block.push(
          `<h3>${section[1]}</h3>\n<div class="${section[0]}">\n${
            backstoryJSON[section[0]]
          }\n</div>`
        )
        backstory.sections.push({
          title: section[1],
          value: backstoryJSON[section[0]]
        })
      }
    }
    backstory.block =
      '<h2>Backstory</h2>\n' + backstory.block.join('\n', backstory.block)
    return backstory
  }

  /**
   *
   * @param {JSON} dholeHouseData DholeHouseJSON
   * @returns
   */
  static async convertDholeHouseCharacterData (dholeHouseData, options) {
    if (CONFIG.debug.CoC7Importer) {
      console.log('Source:', dholeHouseData)
    }
    dholeHouseData = dholeHouseData.Investigator
    const backstories = CoC7DholeHouseActorImporter.getBackstory(
      dholeHouseData.Backstory
    )
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
            max: parseInt(dholeHouseData.Characteristics.SanityMax, 10)
          },
          hp: {
            value: parseInt(dholeHouseData.Characteristics.HitPts, 10),
            max: parseInt(dholeHouseData.Characteristics.HitPtsMax, 10)
          },
          mp: {
            value: parseInt(dholeHouseData.Characteristics.MagicPts, 10),
            max: parseInt(dholeHouseData.Characteristics.MagicPtsMax, 10)
          },
          lck: {
            value: parseInt(dholeHouseData.Characteristics.Luck, 10)
          },
          mov: {
            value: parseInt(dholeHouseData.Characteristics.Move, 10),
            max: parseInt(dholeHouseData.Characteristics.Move, 10)
          },
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
        },
        indefiniteInsanityLevel: {
          max: Math.floor(dholeHouseData.Characteristics.Sanity / 5)
        }
      },
      skills: await CoC7DholeHouseActorImporter.extractSkills(
        dholeHouseData.Skills.Skill ?? [],
        options
      ),
      possesions: await CoC7DholeHouseActorImporter.extractPossessions(
        dholeHouseData.Possessions?.item ?? [],
        options
      )
    }
    return cData
  }

  static makeSkillName (name, specialization) {
    if (specialization === 'None') {
      specialization = 'Any'
    }
    if (name === 'Language (Other)' || name === 'Language (Own)') {
      name = 'Language'
    } else if (name === 'Operate Heavy Machine') {
      name = 'Operate Heavy Machinery'
    } else if (name === 'Throw' && specialization === '') {
      name = 'Fighting'
      specialization = 'Throw'
    }
    return {
      skillName: specialization === '' ? name : specialization,
      specialization: specialization === '' ? '' : name,
      name: name + (specialization === '' ? '' : ' (' + specialization + ')')
    }
  }

  /**
   * guessItem, try and find the item in the locations defined in source i = Item Directory, w = World Compendiums, m = Module Compendiums, s = System Compendiums
   * @param {String} type Item type to find
   * @param {String} name Name of item to find
   * @param {Object} combat null (default). If boolean combat property of skill must match
   * @param {Object} source '' (default). Check order
   * @returns {Object} formatted Actor data Item or null
   */
  static async guessItem (type, name, { combat = null, source = '' } = {}) {
    let existing = null
    name = name.toLowerCase()
    for (let o = 0, oM = source.length; o < oM; o++) {
      switch (source.substring(o, o + 1)) {
        case 'i':
          existing = game.items.find(
            item =>
              item.data.type === type &&
              item.data.name.toLowerCase() === name &&
              (combat === null || item.data.properties.combat === combat)
          )
          if (existing) {
            return existing
          }
          break
        case 'w':
        case 'm':
        case 's':
          for (const pack of game.packs) {
            if (
              pack.metadata.type === 'Item' &&
              ((source[o] === 'w' && pack.metadata.package === 'world') ||
                (source[o] === 'S' && pack.metadata.package === 'CoC7') ||
                (source[o] === 's' &&
                  !['world', 'CoC7'].includes(pack.metadata.package)))
            ) {
              const documents = await pack.getDocuments()
              existing = documents.find(
                item =>
                  item.data.type === type &&
                  item.data.name.toLowerCase() === name &&
                  (combat === null || item.data.properties.combat === combat)
              )
              if (existing) {
                return existing
              }
            }
          }
          break
      }
    }
    if (type === 'skill') {
      const match = name.match(/^(.+ \()(?!any).+(\))$/)
      if (match) {
        return await CoC7DholeHouseActorImporter.guessItem(
          type,
          match[1] + 'any' + match[2],
          { combat: combat, source: source }
        )
      }
    }
  }

  static async extractSkills (dholeHouseskills, options) {
    const skills = []
    for (const skill of dholeHouseskills) {
      if (
        skill.subskill === 'None' &&
        skill.value === '1' &&
        skill.half === '0' &&
        skill.fifth === '0'
      ) {
        continue
      }
      const parts = CoC7DholeHouseActorImporter.makeSkillName(
        skill.name,
        skill.subskill ?? ''
      )
      const existing = await CoC7DholeHouseActorImporter.guessItem(
        'skill',
        parts.name,
        {
          source: options.source
        }
      )
      let cloned = null
      if (typeof existing !== 'undefined') {
        cloned = duplicate(existing.toObject())
        cloned.name = parts.name
        cloned.data.skillName = parts.skillName
        cloned.data.specialization = parts.specialization
      } else {
        cloned = CoCActor.emptySkill(
          parts.skillName,
          parseInt(skill.value ?? 0, 10),
          {
            specialization:
              parts.specialization === '' ? false : parts.specialization
          }
        )
        cloned.data.properties = cloned.data.properties ?? {}
        if (parts.specialization === 'Fighting') {
          cloned.data.properties.fighting = true
          cloned.data.properties.combat = true
          cloned.data.properties.push = false
        } else if (parts.specialization === 'Firearms') {
          cloned.data.properties.firearm = true
          cloned.data.properties.combat = true
          cloned.data.properties.push = false
        } else if (parts.skillName === 'Dodge') {
          cloned.data.properties.push = false
        }
      }
      if (cloned.data.skillName === 'Any') {
        cloned.name = cloned.name.replace(' (Any)', ' (None)')
        cloned.data.skillName = 'None'
      }
      cloned.data.base = parseInt(skill.value ?? 0, 10)
      cloned.data.value = parseInt(skill.value ?? 0, 10)
      cloned.data.flags = cloned.data.flags ?? {}
      cloned.data.flags.occupation =
        skill.occupation === true || skill.occupation === 'true'
      skills.push(cloned)
    }
    return skills
  }

  static findWeaponSkillId (skillName, character) {
    const skills = character.getEmbeddedCollection('Item')
    const checkName = skillName.replace(/^\((.+)\)$/, '$1')
    const characterSkill = skills.find(i => {
      return (
        i.data.data?.skillName === checkName ||
        i.data.data?.skillName?.indexOf(checkName) > -1
      )
    })
    return characterSkill
  }

  static async extractPossessions (dholehousePossessions, options) {
    const items = []
    for (const item of dholehousePossessions) {
      const existing = await CoC7DholeHouseActorImporter.guessItem(
        'item',
        item.description,
        {
          source: options.source
        }
      )
      let cloned = null
      if (typeof existing !== 'undefined') {
        cloned = duplicate(existing.toObject())
      } else {
        cloned = {
          name: item.description,
          type: 'item'
        }
      }
      items.push(cloned)
    }
    return items
  }

  static async extractWeapons (dholehouseWeapons, character, options) {
    const weapons = []
    if (!Array.isArray(dholehouseWeapons)) {
      dholehouseWeapons = [dholehouseWeapons]
    }
    for (const weapon of dholehouseWeapons) {
      const skill = CoC7DholeHouseActorImporter.findWeaponSkillId(
        weapon.skillname,
        character
      )
      const damage = weapon.damage.replace(/\+DB/i, '')
      const addb = damage !== weapon.damage
      const existing = await CoC7DholeHouseActorImporter.guessItem(
        'weapon',
        weapon.name,
        {
          source: options.source
        }
      )
      let cloned = null
      if (typeof existing !== 'undefined') {
        cloned = duplicate(existing.toObject())
        cloned.data.skill.main.name = skill?.name ?? ''
        cloned.data.skill.main.id = skill?.id ?? ''
        cloned.data.range = cloned.data.range ?? {}
        cloned.data.range.normal = cloned.data.range.normal ?? {}
        cloned.data.range.normal.damage = damage
        cloned.data.ammo = weapon.ammo
        cloned.data.malfunction = weapon.malf
        cloned.data.properties = cloned.data.properties ?? {}
        cloned.data.properties.melee =
          skill?.data.data.properties?.fighting ?? false
        cloned.data.properties.rngd =
          skill?.data.data.properties?.firearm ?? false
        cloned.data.properties.addb = addb
      } else {
        cloned = {
          name: weapon.name,
          type: 'weapon',
          data: {
            skill: {
              main: {
                name: skill?.name ?? '',
                id: skill?.id ?? ''
              }
            },
            range: {
              normal: {
                damage: damage
              }
            },
            ammo: weapon.ammo,
            malfunction: weapon.malf,
            properties: {
              melee: skill?.data.data.properties?.fighting ?? false,
              rngd: skill?.data.data.properties?.firearm ?? false,
              addb: addb
            }
          }
        }
      }
      weapons.push(cloned)
    }
    return weapons
  }

  static async savePortrait (base64Portrait, fileName) {
    const base64Response = await fetch(
      'data:image/png;base64,' + base64Portrait
    )
    const imageBlob = await base64Response.blob()
    const filePath = CoC7DirectoryPicker.uploadToDefaultDirectory(
      imageBlob,
      fileName
    )
    return filePath
  }

  static async createNPCFromDholeHouse (dholeHouseCharacterData, options) {
    if (!game.user?.can('FILES_UPLOAD')) {
      ui.notifications.error(
        game.i18n.localize('CoC7.ActorImporterUploadError')
      )
      return false
    }
    const characterData =
      await CoC7DholeHouseActorImporter.convertDholeHouseCharacterData(
        dholeHouseCharacterData,
        options
      )
    if (CONFIG.debug.CoC7Importer) {
      console.log('Character Data:', characterData)
    }
    const importedCharactersFolder =
      await CoC7Utilities.createImportCharactersFolderIfNotExists()
    if (!CoC7DirectoryPicker.createDefaultDirectory()) {
      return false
    }
    const actorData = {
      name: characterData.name,
      type: 'character',
      folder: importedCharactersFolder.id,
      data: characterData.actor
    }
    const npc = await Actor.create(actorData)
    // If possible upload the image portrait
    if (
      dholeHouseCharacterData.Investigator.PersonalDetails.Portrait?.length > 10
    ) {
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
      console.log('Items: ', characterData.items)
    }
    await npc.createEmbeddedDocuments('Item', characterData.skills, {
      renderSheet: false
    })
    await npc.createEmbeddedDocuments('Item', characterData.possesions, {
      renderSheet: false
    })
    const weapons = await CoC7DholeHouseActorImporter.extractWeapons(
      dholeHouseCharacterData.Investigator.Weapons?.weapon ?? [],
      npc,
      options
    )
    if (CONFIG.debug.CoC7Importer) {
      console.log('Weapons: ', weapons)
    }
    await npc.createEmbeddedDocuments('Item', weapons, {
      renderSheet: false
    })

    return npc
  }
}
