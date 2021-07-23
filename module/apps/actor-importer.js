'use strict'

import { COC7 } from '../config.js';
import { CoC7ActorImporterRegExp } from './actor-importer-regexp.js';

// Default values

/**
 * defaultSkillProperties is an object with the default properties to use when creating an skill
 */
const defaultSkillProperties = {
  special: false,
  rarity: false,
  push: true,
  combat: false
}

/**
 * defaultWeaponSkillAdjustments is an object with default values to use when creating a weapon skill
 */
const defaultWeaponSkillAdjustments = {
  personal: null,
  occupation: null,
  archetype: null,
  experience: null
}
/**
 * CoC7ActorImporter helper class to import an Actor from the raw text description.
 */
export class CoC7ActorImporter {

  // CoC7ActorImporterRgExp contains localized regular expressions to extract data from raw text
  RE = new CoC7ActorImporterRegExp().RE

  /**
   * parseCharacter extracts information from the raw text description of an entity (NPC or Creature)
   * @param {String} text the raw text of the entity
   * @returns extractedData object with the entity data
   */
  async parseCharacter(text) {
    const extractedData = {}
    extractedData.name = this.processName(text)
    extractedData.age = this.extractValue(text, this.RE.ageRegExp)
    console.debug('age', extractedData.age)
    extractedData.str = Number(this.extractValue(text, this.RE.strRegExp))
    extractedData.con = Number(this.extractValue(text, this.RE.conRegExp))
    extractedData.siz = Number(this.extractValue(text, this.RE.sizRegExp))
    extractedData.int = Number(this.extractValue(text, this.RE.intRegExp))
    extractedData.pow = Number(this.extractValue(text, this.RE.powRegExp))
    extractedData.dex = Number(this.extractValue(text, this.RE.dexRegExp))
    extractedData.app = Number(this.extractValue(text, this.RE.appRegExp))
    extractedData.edu = Number(this.extractValue(text, this.RE.eduRegExp))
    extractedData.san = Number(this.extractValue(text, this.RE.sanRegExp))
    extractedData.hp = Number(this.extractValue(text, this.RE.hpRegExp))
    extractedData.mp = Number(this.extractValue(text, this.RE.mpRegExp))
    extractedData.db = this.extractValue(text, this.RE.dbRegExp)
    extractedData.build = this.extractValue(text, this.RE.buildRegExp)
    extractedData.armor = this.extractValue(text, this.RE.armorRegExp)
    console.debug('armor', extractedData.armor)
    extractedData.mov = Number(this.extractValue(text, this.RE.moveRegExp))
    extractedData.lck = Number(this.extractValue(text, this.RE.luckRegExp))
    extractedData.sanLoss = this.extractValue(text, this.RE.sanLossRegExp)
    extractedData.attacksPerRound = this.extractValue(text, this.RE.attacksPerRoundRegExp)

    const attacks = this.extractValue(text, this.RE.attacksRegExp)
    console.debug(attacks)
    extractedData.attacks = await this.processAttacks(attacks)
    const spells = this.extractValue(text, this.RE.spellsRegExp)
    console.debug(spells)
    extractedData.spells = await this.processSpells(spells)
    const skills = this.extractValue(text, this.RE.skillsRegExp)
    console.debug(skills)
    extractedData.skills = await this.processSkills(skills)
    const dodge = this.RE.dodgeRegExp.exec(text)
    if (dodge !== null) {
      extractedData.skills.push({
        name: this.cleanString(dodge.groups.name),
        value: Number(dodge.groups.percentage)
      })
    }
    const languages = this.extractValue(text, this.RE.languagesRegExp)
    console.debug(languages)
    extractedData.languages = await this.processSkills(languages)

    return extractedData
  }

  /**
   * processName extracts the Character name from the first line of the `text` 
   * @param {string} text raw character name text 
   * @returns the character name or 'Imported unnamed character' if the name was not found 
   */
  processName(text) {
    const nameFound = this.RE.nameRegExp.exec(text)
    if (nameFound !== null) {
      return nameFound.groups.name
    }
    return game.i18n.localize('COC7.ImportedUnnamedCharacter') 
  }

  /**
   * processAttacks extract the information related to the attacks and returns an array of weapons basic data
   * @param {String} attacks raw text for the Attacks data
   * @returns array of weapon data. 
   */
  processAttacks(attacks) {
    const results = []
    if (attacks != null) {
      let weapon = this.RE.weaponRegExp.exec(attacks)
      while (weapon !== null) {
        // Attempt to guess some of the weapon properties
        const cleanWeapon = this.cleanString(weapon.groups.weapon)
        const doesDamageBonus = this.RE.dbRegExp.test(weapon.groups.damage)
        const isRanged = this.RE.handgunRegExp.test(cleanWeapon) || this.RE.rifleRegExp.test(cleanWeapon) ||
          this.RE.smbRegExp.test(cleanWeapon) || this.RE.machineGunRegExp.test(cleanWeapon)
        // Basic weapon data
        const data = {
          name: cleanWeapon,
          type: 'weapon',
          data: {
            properties: {},
            range: {
              normal: {
                value: Number(weapon.groups.percentage),
                damage: weapon.groups.damage
              }
            }
          }
        };
        for (let [key] of Object.entries(COC7['weaponProperties'])) {
          data.data.properties[key] = false;
        }
        // Set some of the properties
        data.data.properties.rngd = isRanged;
        data.data.properties.melee = doesDamageBonus; // if a weapon doesDamageBonus usually means it's a melee weapon
        data.data.properties.addb = doesDamageBonus;
        results.push(data)
        weapon = this.RE.weaponRegExp.exec(attacks)
      }
    }
    console.debug('attacks', results)
    return results
  }

  /**
   * processSpells converts the raw text with the spells to an `Array` of `String` with the spells
   * @param {String} spells raw text of the spells
   * @returns {Array[String]} of spells
   */
  processSpells(spells) {
    const results = []
    if (spells !== null) {
      const spellsArr = spells.replace(/(\n|\r)/g, ' ').split(',')
      spellsArr.forEach(s => {
        results.push(this.cleanString(s))
      })
    }
    console.debug('spells', results)
    return results
  }

  /**
   * basicWeaponData creates a basic object with the default basic data for a weapon skill
   * @param {boolean} firearms true if the weapon uses firearms, false if it's a melee one.
   * @returns object with default values for the weapon
   */
  basicWeaponSkillData(firearms) {
    return {
      specialization: game.i18n.localize(firearms ? 'CoC7.FirearmSpecializationName' : 'CoC7.FightingSpecializationName'),
      adjustments: defaultWeaponSkillAdjustments,
      properties: {
        special: true,
        fighting: !firearms,
        firearm: firearms,
        combat: true
      }
    }
  }

  /**
   * processSkills extract skill information from the raw text of the skills section of an entity (NPC or Creature) 
   * @param {String} skills raw text of the skills to be processed 
   * @returns array of skills with the `name` of the skill and the `value` (percentage) 
   */
  processSkills(skills) {
    const results = []
    console.debug('skills string', skills)
    if (skills !== null) {
      const skillsArr = skills.replace(/(\n|\r)/g, ' ').split(',')
      console.debug('skillsArr', skillsArr)
      skillsArr.forEach(skill => {
        const parsedSkill = this.RE.skillRegExp.exec(skill)
        console.debug('parsedSkill', parsedSkill)
        if (parsedSkill !== null) {
          const skillName = this.cleanString(parsedSkill.groups.skill)
          results.push({
            name: skillName,
            value: Number(parsedSkill.groups.percentage)
          })
        }
      })
    }
    console.debug('skills', results)
    return results
  }

  /**
   * extractValue expects to receive a regular expression `re` that
   * includes one parenthesis group, and returns the value matching the first
   * parenthesis group or `null`
   */
  extractValue(text, re) {
    const results = re.exec(text)
    if (results !== null) {
      return results[1]
    }
    return null
  }

  /**
   * cleanString, removes new line and carrier return character and lateral spaces from a string
   * @param {String} s the sting to clean
   * @returns {String} the cleaned string
   */
  cleanString(s) {
    return s.replace(/(\n|\r)/g, ' ').replace(/^\s*/, '').replace(/\s*\.?\s*$/, '')
  }

  /**
   * Determines the entity type to use (`npc` or `creature`) depending on the user selection on the dialog
   * helps to validate / clean the input, in case of an unknown entity type shows a warning and returns `npc` 
   * as a default value.
   * @param {String} entityTypeString string with the entity type as selected by the users
   * @returns {String} `npc` or `creature` 
   */
  entityType(entityTypeString) {
    switch (entityTypeString) {
      case 'coc-npc':
        return 'npc'
      case 'coc-creature':
        return 'creature'
    }
    console.warn('entity type: ', entityTypeString);
    return 'npc'
  }


  /**
   * Create an entity (`npc`or `creature`) from the object with the already parsed entity data 
   * @param {Object} pc object with the data extracted from the character as returned from `parseCharacter`
   * @param {String} entityTypeString entity type obtained from the user input, will be sanitized by calling `entityType`
   * @returns {Actor} the created foundry `Actor` 
   */
  async createEntity(pc, entityTypeString) {
    let importedCharactersFolder = await this.createImportCharactersFolderIfNotExists()

    const npc = await Actor.create({
      name: pc.name,
      type: this.entityType(entityTypeString),
      folder: importedCharactersFolder.id,
      data: {}
    })
    // debugger
    // Add the skills
    await this.addTheSkills(pc, npc)
    // Add the languages
    await this.addTheLanguages(pc, npc)
    // Add the spells
    await this.addTheSpells(pc, npc)
    // Handle the attacks
    await this.handleTheAttacks(pc, npc)
    await this.updateActorData(pc, npc)

    return npc
  }

  /**
   * Creates a folder on the actors tab called "Imported Characters" if the folder doesn't exist.
   * @returns {Folder} the importedCharactersFolder
   */
  async createImportCharactersFolderIfNotExists() {
    let importedCharactersFolder = game.folders.find(entry => entry.data.name === 'Imported characters' && entry.data.type === 'Actor')
    if (importedCharactersFolder === null || importedCharactersFolder === undefined) {
      // Create the folder
      importedCharactersFolder = await Folder.create({
        name: 'Imported characters',
        type: 'Actor',
        parent: null
      })
      ui.notifications.info(game.i18n.localize('COC7.CreatedImportedCharactersFolder'))
    }
    return importedCharactersFolder
  }

  async updateActorData(pc, npc) {
    let updateData = {};
    ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu'].forEach(key => {
      updateData[`data.characteristics.${key}.value`] = Number(pc[key])
    })
    await npc.update(updateData)
    await npc.setLuck(Number(pc['lck']))
    await npc.setHp(Number(pc['hp']))
    await npc.setMp(Number(pc['mp']))

    updateData = {};
    ['san', 'mov', 'db', 'build', 'armor'].forEach(key => {
      updateData[`data.attribs.${key}.value`] = Number(pc[key])
    })
    if (pc.age !== null) {
      updateData['data.infos.age'] = pc.age
    }
    if (pc.sanLoss !== null) {
      const [passed, failed] = pc.sanLoss.split('/')
      updateData['data.special.sanLoss.checkPassed'] = passed
      updateData['data.special.sanLoss.checkFailled'] = failed
    }
    if (pc.attacksPerRound !== null) {
      updateData['data.special.attacksPerRound'] = Number(pc.attacksPerRound)
    }
    console.debug('updateData:', updateData)
    await npc.update(updateData)
  }

  async handleTheAttacks(pc, npc) {
    if (pc.attacks !== null) {
      for (let i = 0; i < pc.attacks.length; i++) {
        const attack = pc.attacks[i]
        console.debug('attack', attack)
        const mainAttackSkill = await this.mainAttackSkill(attack)
        await npc.createEmbeddedDocuments('Item', [mainAttackSkill]).then(
          async newSkills => {
            //const newSkill = newSkills[0].clone()
            //newSkill.data.data.value = attack.data.range.normal.value
            await npc.createEmbeddedDocuments('Item', [attack]).then(
              async createdAttacks => {
                if (createdAttacks !== null && typeof createdAttacks !== undefined) {
                  const createdAttack = await this.setMainAttackSkill(createdAttacks[0], newSkills[0])
                  //createdAttack.data.data.range.normal.value = attack.data.range.normal.value
                  //createdAttack.data.data.range.normal.damage = attack.data.range.normal.damage
                  console.debug('createdAttack', createdAttack)
                }
              }
            )
          });
      }
    }
  }

  async mainAttackSkill(attack) {
    const skill = await this.weaponSkill(attack.name);
    if (skill !== null && typeof skill !== 'undefined') {
      console.debug('skill', skill);
      const skillClone = skill.clone({
        data: {
          value: attack.data.range.normal.value
        }
      });
      console.debug('skillClone', skillClone);
      return skillClone;
    }
    console.debug(`Weapon skill not found for ${attack.name}, creating a new one`);
    const newSkill = {
      name: attack.name,
      type: 'skill',
      data: this.basicWeaponSkillData(false)
    };
    newSkill.data.base = attack.data?.range?.normal?.value;
    newSkill.data.value = attack.data?.range?.normal?.value;
    console.debug('newSkill', newSkill);
    return newSkill;
  }

  /**
   * setMainWeaponSkill sets the main skill for a weapon
   * @param {CoC7Item} weapon 
   * @param {CoC7Item} skill 
   */
  async setMainAttackSkill(weapon, skill) {
    return await weapon.update({
      'data.skill.main.id': skill.id,
      'data.skill.main.name': skill.name,
      'data.properties': skill.data.properties,
      'data.adjustments': skill.data.adjustments,
      'data.specialization': skill.data.specialization
    })
  }

  async addTheSpells(pc, npc) {
    if (pc.spells !== null) {
      pc.spells.forEach(async spell => {
        const created = await npc.addItems([{
          name: spell,
          type: 'spell'
        }])
        console.debug(created)
      })
    };
  }

  async addTheLanguages(pc, npc) {
    if (pc.languages !== null) {
      for (const lang of pc.languages) {
        const created = await npc.createSkill(lang.name, lang.value)
        console.debug(created)
      }
    }
  }

  async addTheSkills(pc, npc) {
    if (pc.skills !== null) {
      for (const skill of pc.skills) {
        const existingSkill = await game.items.find(i => i.data.type === 'skill' && i.data.name === skill.name)
        if (existingSkill !== undefined) {
          const clonedSkill = existingSkill.toObject()
          clonedSkill.data.base = skill.value
          await npc.createEmbeddedDocuments('Item', [clonedSkill]).then(
            created => console.debug(created))
            //created.data.value = skill.value && console.debug(created))
        } else {
          await npc.createSkill(skill.name, skill.value).then(created => console.debug(created))
        }
      }
    }
  }

  /** weaponSkill tries ot guess what kind of weapon skill to use for weapon from it's name
   * @param weaponName: String, the weapon name
   */
  async weaponSkill(weaponName) {
    let skill = null
    if (this.RE.handgunRegExp.exec(weaponName)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Handgun')
      console.debug(`${weaponName} uses Handgun skill: ${skill}`)
    } else if (this.RE.rifleRegExp.exec(weaponName)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Rifle/Shotgun')
      console.debug(`${weaponName} uses Rifle skill: ${skill}`)
    } else if (this.RE.smbRegExp.exec(weaponName)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Submachine Gun')
      console.debug(`${weaponName} uses Submachine Gun skill: ${skill}`)
    } else if (this.RE.machineGunRegExp.exec(weaponName)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Machine Gun')
      console.debug(`${weaponName} uses Machine Gun skill: ${skill}`)
    } else if (this.RE.launchedWeapons.exec(weaponName)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Launch')
      console.debug(`${weaponName} uses Launch skill: ${skill}`)
    }
    return skill
  }

  /**
   * needsConversion does an evaluation to see if the given npc needs to be converted to 7th Edition
   * Returns `false` when any of the Characteristics value it's above 29
   */
  needsConversion(npc) {
    let needsConversionResult = true;
    ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu'].forEach(key => {
      if (npc[key] > 30) {
        needsConversionResult = false;
      }
    })
    console.debug('needsConversion:', needsConversionResult)
    return needsConversionResult
  }

  /**
   * createActor main method to create an `Actor` from a give user input, takes on account the lang, entity type, 
   * the convert to 7 Edition flag, and the raw entity data. 
   * @param {Object} inputs inputs from the form to create an Actor
   * @returns {Actor} the foundry `Actor` from the given `input` options
   */
  async createActor(inputs) {
    const lang = this.extractValue(inputs.lang, CoC7ActorImporterRegExp.optionLangRegExp) || "en"
    this.RE = CoC7ActorImporterRegExp.getRegularExpressions(lang)
    let character = await this.parseCharacter(inputs.text)
    console.debug(character)
    if ((inputs.convertFrom6E === "coc-guess" && this.needsConversion(character)) || (inputs.convertFrom6E === "coc-convert")) {
      character = await this.convert7E(character)
    }
    const npc = await this.createEntity(character, inputs.entity)
    return npc
  }

  /**
   * convert7E Converts the given entity from 6 edition to 7 edition 
   * @param {Object} the entity object as obtained from `parseCharacter`
   * @return the same object but with updated characteristics for 7 edition
   */
  async convert7E(creature) {
    console.debug('Converting creature', creature);
    ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow'].forEach(key => {
      creature[key] *= 5
    })
    if (creature.edu <= 18) {
      creature.edu *= 5
    } else if (creature.edu <= 26) {
      creature.edu = creature.edu + 90 - 18
    } else { // creature.edu >=28
      creature.edu = 99
    }
    if (creature.db === '-1d4') {
      creature.db = -1
    } else if (creature.db === '-1d6') {
      creature.db = -2
    }
    console.debug('Converted creature', creature)
    return creature
  }
}