/* global Actor, CONFIG, fetch, foundry, game, ui */
import { CoCActor } from '../../core/documents/actor.js'
import { CoC7DirectoryPicker } from '../../core/system/coc7-directory-picker.js'
import { CoC7Utilities } from '../../shared/utilities.js'

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
        backstory.block.push(
          `<h3>${section[1]}</h3>\n<div class="${section[2]}">\n${
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
      dholeHouseData.Backstory ?? {}
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

  static async extractSkills (dholeHouseskills, options) {
    const skills = []
    for (const skill of dholeHouseskills) {
      if (skill.subskill === 'None') {
        continue
      }
      const parts = CoC7DholeHouseActorImporter.makeSkillName(
        skill.name,
        skill.subskill ?? ''
      )
      const existing = await CoC7Utilities.guessItem('skill', parts.name, {
        source: options.source,
        fallbackAny: true
      })
      let cloned = null
      if (typeof existing !== 'undefined') {
        cloned = foundry.utils.duplicate(existing.toObject())
        cloned.name = parts.name
        cloned.system.skillName = parts.skillName
        cloned.system.specialization = parts.specialization
        if (cloned.system.properties?.requiresname ?? false) {
          cloned.system.properties.requiresname = false
        }
        if (cloned.system.properties?.picknameonly ?? false) {
          cloned.system.properties.picknameonly = false
        }
      } else {
        cloned = CoCActor.emptySkill(
          parts.skillName,
          parseInt(skill.value ?? 0, 10),
          {
            specialization:
              parts.specialization === '' ? false : parts.specialization
          }
        )
        cloned.system.properties = cloned.system.properties ?? {}
        if (parts.specialization === 'Fighting') {
          cloned.system.properties.fighting = true
          cloned.system.properties.combat = true
          cloned.system.properties.push = false
        } else if (parts.specialization === 'Firearms') {
          cloned.system.properties.firearm = true
          cloned.system.properties.combat = true
          cloned.system.properties.push = false
        } else if (parts.skillName === 'Dodge') {
          cloned.system.properties.push = false
        }
      }
      if (cloned.system.skillName === 'Any') {
        cloned.name = cloned.name.replace(' (Any)', ' (None)')
        cloned.system.skillName = 'None'
      }
      cloned.system.base = parseInt(skill.value ?? 0, 10)
      cloned.system.value = parseInt(skill.value ?? 0, 10)
      cloned.system.flags = cloned.system.flags ?? {}
      cloned.system.flags.occupation =
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
        i.system?.skillName === checkName ||
        i.system?.skillName?.indexOf(checkName) > -1
      )
    })
    return characterSkill
  }

  static async extractPossessions (dholehousePossessions, options) {
    const items = []
    if (!Array.isArray(dholehousePossessions) && dholehousePossessions != null) {
      dholehousePossessions = [dholehousePossessions]
    }
    for (const item of dholehousePossessions) {
      const existing = await CoC7Utilities.guessItem('item', item.description, {
        source: options.source
      })
      let cloned = null
      if (typeof existing !== 'undefined') {
        cloned = foundry.utils.duplicate(existing.toObject())
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
      const existing = await CoC7Utilities.guessItem('weapon', weapon.name, {
        source: options.source
      })
      let cloned = null
      if (typeof existing !== 'undefined') {
        cloned = foundry.utils.duplicate(existing.toObject())
        cloned.system.skill.main.name = skill?.name ?? ''
        cloned.system.skill.main.id = skill?.id ?? ''
        cloned.system.range = cloned.system.range ?? {}
        cloned.system.range.normal = cloned.system.range.normal ?? {}
        cloned.system.range.normal.damage = damage
        cloned.system.ammo = weapon.ammo
        cloned.system.malfunction = weapon.malf
        cloned.system.properties = cloned.system.properties ?? {}
        cloned.system.properties.melee =
          skill?.system.properties?.fighting ?? false
        cloned.system.properties.rngd =
          skill?.system.properties?.firearm ?? false
        cloned.system.properties.addb = addb
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
            ammo: weapon.ammo,
            malfunction: weapon.malf,
            properties: {
              melee: skill?.system.properties?.fighting ?? false,
              rngd: skill?.system.properties?.firearm ?? false,
              addb
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
      system: characterData.actor
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
