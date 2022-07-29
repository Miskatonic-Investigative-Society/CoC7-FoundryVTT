/* global Actor, game, ui, fetch */
import { CoC7DirectoryPicker } from '../scripts/coc7-directory-picker.js'
import { CoC7Item } from '../items/item.js'
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
    let backstory = '<h2>Backstory</h2>\n'
    const biography = []
    if (backstoryJSON.description !== null) {
      backstory += `<h3>Description</h3>
      <div class="description">
      ${backstoryJSON.description}
      </div>\n`
      biography.push({
        title: 'Description',
        value: backstoryJSON.description
      })
    }
    if (backstoryJSON.traits !== null) {
      backstory += `<h3>Traits</h3>
      <div class="traits">
      ${backstoryJSON.traits}
      <div>\n`
      biography.push({
        title: 'Traits',
        value: backstoryJSON.traits
      })
    }
    if (backstoryJSON.ideology !== null) {
      backstory += `<h3>Ideology</h3>
      <div class="ideology">
      ${backstoryJSON.ideology}
      <div>\n`
      biography.push({
        title: 'Ideology',
        value: backstoryJSON.ideology
      })
    }
    if (backstoryJSON.injurues !== null) {
      backstory += `<h3>Injuries</h3>
      <div class="injuries">
      ${backstoryJSON.injurues}
      <div>\n`
      biography.push({
        title: 'Injuries',
        value: backstoryJSON.injurues
      })
    }
    if (backstoryJSON.people !== null) {
      backstory += `<h3>People</h3>
      <div class="people">
      ${backstoryJSON.people}
      <div>\n`
      biography.push({
        title: 'People',
        value: backstoryJSON.people
      })
    }
    if (backstoryJSON.phobias !== null) {
      backstory += `<h3>Phobias</h3>
      <div class="phobias">
      ${backstoryJSON.phobias}
      <div>\n`
      biography.push({
        title: 'Phobias',
        value: backstoryJSON.phobias
      })
    }
    if (backstoryJSON.locations !== null) {
      backstory += `<h3>Locations</h3>
      <div class="locations">
      ${backstoryJSON.locations}
      <div>\n`
      biography.push({
        title: 'Locations',
        value: backstoryJSON.locations
      })
    }
    if (backstoryJSON.tomes !== null) {
      backstory += `<h3>Tomes</h3>
      <div class="tomes">
      ${backstoryJSON.tomes}
      <div>\n`
      biography.push({
        title: 'Tomes',
        value: backstoryJSON.tomes
      })
    }
    if (backstoryJSON.possessions !== null) {
      backstory += `<h3>Possessions</h3>
      <div class="possessions">
      ${backstoryJSON.possessions}
      <div>\n`
      biography.push({
        title: 'Possessions',
        value: backstoryJSON.possessions
      })
    }
    if (backstoryJSON.encounters !== null) {
      backstory += `<h3>Encounters</h3>
      <div class="encounters">
      ${backstoryJSON.encounters}
      <div>\n`
      biography.push({
        title: 'Encounters',
        value: backstoryJSON.encounters
      })
    }
    return {
      backstory: backstory,
      biography: biography
    }
  }

  /**
   *
   * @param {JSON} dholeHouseData DholeHouseJSON
   * @returns
   */
  static convertDholeHouseCharacterData (dholeHouseData) {
    console.log(dholeHouseData)
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
            value: dholeHouseData.Characteristics.Move,
            max: dholeHouseData.Characteristics.Move
          },
          db: { value: dholeHouseData.Characteristics.DamageBonus },
          build: { value: dholeHouseData.Characteristics.Build }
        },
        infos: {
          occupation: dholeHouseData.PersonalDetails.Occupation,
          age: dholeHouseData.PersonalDetails.Age,
          sex: dholeHouseData.PersonalDetails.Gender,
          residence: dholeHouseData.PersonalDetails.Residence,
          birthplace: dholeHouseData.PersonalDetails.Birthplace
        },
        backstory: backstories.backstory,
        biography: backstories.biography,
        description: {
          keeper: game.i18n.localize('CoC7.DholeHouseActorImporterSource')
        },
        indefiniteInsanityLevel: {
          max: Math.floor(dholeHouseData.Characteristics.Sanity / 5)
        }
      },
      skills: CoC7DholeHouseActorImporter.extractSkills(
        dholeHouseData.Skills.Skill ?? []
      ),
      possesions: CoC7DholeHouseActorImporter.extractPossessions(
        dholeHouseData.Possessions?.item ?? []
      )
    }
    return cData
  }

  static extractSkills (dholeHousekills) {
    const skills = []
    for (const skill of dholeHousekills) {
      let name = skill.name
      let specialization = ''
      let isSpecial = false
      let isOccupational = false
      const value = skill.value
      if (
        skill.subskill === 'None' &&
        skill.value === '1' &&
        skill.half === '0' &&
        skill.fifth === '0'
      ) {
        continue
      }
      if (skill.subskill && skill.subskill !== 'None') {
        name = skill.subskill
        specialization = skill.name
        isSpecial = true
      }
      if (skill.occupation) {
        isOccupational = true
      }
      console.log(
        'skill name: ',
        name,
        ' skill value: ',
        value,
        ' specialization: ',
        specialization
      )
      const skillName = name
      if (['Language (Other)', 'Language (Own)'].includes(specialization)) {
        specialization = 'Language'
      }
      if (isSpecial) {
        const parts = CoC7Item.getNamePartsSpec(skillName, specialization)
        name = parts.name
      }
      skills.push({
        type: 'skill',
        name: name,
        data: {
          skillName: skillName,
          specialization: specialization,
          properties: {
            special: isSpecial,
            fighting: specialization === 'Fighting',
            firearm: specialization === 'Firearms',
            combat:
              specialization === 'Fighting' || specialization === 'Firearms'
          },
          flags: { occupation: isOccupational },
          base: Number(value),
          value: Number(value)
        }
      })
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

  static extractPossessions (dholehousePossessions) {
    const items = []
    for (const item of dholehousePossessions) {
      items.push({
        name: item.description,
        type: 'item',
        description: {
          value: item.description
        },
        quantity: 1,
        weight: 0,
        attributes: {}
      })
    }
    return items
  }

  static extractWeapons (dholehouseWeapons, character) {
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
      weapons.push({
        name: weapon.name,
        type: 'weapon',
        data: {
          description: {
            value: weapon.Name
          },
          wpnType: '',
          skill: {
            main: {
              name: skill?.name ?? '',
              id: skill?.id ?? ''
            },
            alternativ: {
              name: '',
              id: ''
            }
          },
          range: {
            normal: {
              value: 0,
              units: '',
              damage: damage
            },
            long: {
              value: 0,
              units: '',
              damage: ''
            },
            extreme: {
              value: 0,
              units: '',
              damage: ''
            }
          },
          usesPerRound: {
            normal: 1,
            max: null,
            burst: null
          },
          bullets: null,
          ammo: weapon.ammo,
          malfunction: weapon.malf,
          blastRadius: null,
          properties: {
            melee: skill?.data.data.properties?.fighting ?? false,
            rngd: skill?.data.data.properties?.firearm ?? false,
            addb: addb
          },
          eras: {},
          price: {}
        }
      })
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

  static async createNPCFromDholeHouse (dholeHouseCharacterData) {
    if (!game.user?.can('FILES_UPLOAD')) {
      ui.notifications.error(
        game.i18n.localize('CoC7.ActorImporterUploadError')
      )
      return false
    }
    const characterData =
      CoC7DholeHouseActorImporter.convertDholeHouseCharacterData(
        dholeHouseCharacterData
      )
    console.log(characterData)
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

    console.log(characterData.items)
    await npc.createEmbeddedDocuments('Item', characterData.skills, {
      renderSheet: false
    })
    await npc.createEmbeddedDocuments('Item', characterData.possesions, {
      renderSheet: false
    })
    const weapons = CoC7DholeHouseActorImporter.extractWeapons(
      dholeHouseCharacterData.Investigator.Weapons?.weapon ?? [],
      npc
    )
    console.log('weapons', weapons)
    await npc.createEmbeddedDocuments('Item', weapons, {
      renderSheet: false
    })

    return npc
  }
}
