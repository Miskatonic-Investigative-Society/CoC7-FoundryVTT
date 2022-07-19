/* global Actor, game */
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
    if (backstoryJSON.description !== null) {
      backstory += `<h3>Description</h3>
      <div class="description">
      ${backstoryJSON.description}
      </div>\n`
    }
    if (backstoryJSON.traits !== null) {
      backstory += `<h3>Traits</h3>
      <div class="traits">
      ${backstoryJSON.traits}
      <div>\n`
    }
    if (backstoryJSON.ideology !== null) {
      backstory += `<h3>Ideology</h3>
      <div class="ideology">
      ${backstoryJSON.ideology}
      <div>\n`
    }
    if (backstoryJSON.injurues !== null) {
      backstory += `<h3>Injuries</h3>
      <div class="injuries">
      ${backstoryJSON.injurues}
      <div>\n`
    }
    if (backstoryJSON.people !== null) {
      backstory += `<h3>People</h3>
      <div class="people">
      ${backstoryJSON.people}
      <div>\n`
    }
    if (backstoryJSON.phobias !== null) {
      backstory += `<h3>Phobias</h3>
      <div class="phobias">
      ${backstoryJSON.phobias}
      <div>\n`
    }
    if (backstoryJSON.locations !== null) {
      backstory += `<h3>Locations</h3>
      <div class="locations">
      ${backstoryJSON.locations}
      <div>\n`
    }
    if (backstoryJSON.tomes !== null) {
      backstory += `<h3>Tomes</h3>
      <div class="tomes">
      ${backstoryJSON.tomes}
      <div>\n`
    }
    if (backstoryJSON.possessions !== null) {
      backstory += `<h3>Possessions</h3>
      <div class="possessions">
      ${backstoryJSON.possessions}
      <div>\n`
    }
    if (backstoryJSON.encounters !== null) {
      backstory += `<h3>Encounters</h3>
      <div class="encounters">
      ${backstoryJSON.encounters}
      <div>\n`
    }
    return backstory
  }

  /**
   *
   * @param {JSON} dholeHouseData DholeHouseJSON
   * @returns
   */
  static convertDholeHouseCharacterData (dholeHouseData) {
    console.log(dholeHouseData)
    dholeHouseData = dholeHouseData.Investigator
    const cData = {
      name: dholeHouseData.PersonalDetails.Name,
      actor: {
        characteristics: {
          str: { value: dholeHouseData.Characteristics.STR },
          con: { value: dholeHouseData.Characteristics.CON },
          siz: { value: dholeHouseData.Characteristics.SIZ },
          dex: { value: dholeHouseData.Characteristics.DEX },
          app: { value: dholeHouseData.Characteristics.APP },
          int: { value: dholeHouseData.Characteristics.INT },
          pow: { value: dholeHouseData.Characteristics.POW },
          edu: { value: dholeHouseData.Characteristics.EDU }
        },
        attribs: {
          san: {
            value: dholeHouseData.Characteristics.Sanity,
            max: dholeHouseData.Characteristics.SanityMax
          },
          hp: {
            value: dholeHouseData.Characteristics.HitPts,
            max: dholeHouseData.Characteristics.HitPtsMax
          },
          mp: {
            value: dholeHouseData.Characteristics.MagicPts,
            max: dholeHouseData.Characteristics.MagicPtsMax
          },
          lck: {
            value: dholeHouseData.Characteristics.Luck,
            max: dholeHouseData.Characteristics.LuckMax
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
        backstory: CoC7DholeHouseActorImporter.getBackstory(
          dholeHouseData.Backstory
        ),
        description: {
          keeper: game.i18n.localize('CoC7.DholeHouseActorImporterSource')
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
    console.log(skills)
    return skills
  }

  static findWeaponSkillId (skillName, character) {
    const skills = character.getEmbeddedCollection('Item')
    const checkName = skillName.replace(/^\((.+)\)$/, '$1')
    const characterSkill = skills.find(i => {
      return (
        i.data.data?.skillName === checkName ||
        i.data.data?.skillName.indexOf(checkName) !== false
      )
    })
    return characterSkill?.id
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
      weapons.push({
        name: weapon.name,
        type: 'weapon',
        description: {
          value: weapon.Name
        },
        wpnType: '',
        skill: {
          main: {
            name: weapon.skillname,
            id: CoC7DholeHouseActorImporter.findWeaponSkillId(
              weapon.skillname,
              character
            )
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
            damage: weapon.damage
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
          melee: weapon.skillname === 'Brawl',
          // "rngd": weapon.skillname === "Handgun" || weapon.skillname === "Throw",
          rngd: weapon.range !== 'None' || weapon.skillname !== '-',
          thrown: weapon.skillname === 'Throw'
        },
        eras: {},
        price: {}
      })
    }
    return weapons
  }

  static async createNPCFromDholeHouse (dholeHouseCharacterData) {
    const characterData =
      CoC7DholeHouseActorImporter.convertDholeHouseCharacterData(
        dholeHouseCharacterData
      )
    console.log(characterData)
    const importedCharactersFolder =
      await CoC7Utilities.createImportCharactersFolderIfNotExists()
    const actorData = {
      name: characterData.name,
      type: 'character',
      img:
        'data:image/png;base64,' +
        dholeHouseCharacterData.Investigator.PersonalDetails.Portrait,
      folder: importedCharactersFolder.id,
      data: characterData.actor
    }
    const npc = await Actor.create(actorData)
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
