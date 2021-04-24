'use strict'

import { CoC7ActorImporterRegExp } from './actor-importer-regexp.js';



// Default values

const defaultProperties = {
  special: false,
  rarity: false,
  push: true,
  combat: false
}

const defaultWeaponSkillAdjustments = {
  personal: null,
  occupation: null,
  archetype: null,
  experience: null
}

export class CoC7ActorImporter {

  RE = new CoC7ActorImporterRegExp().RE

  async parseCharacter(text) {
    const r = {}
    r.name = this.processName(text)
    r.age = this.extractValue(text, this.RE.ageRegExp)
    console.debug('age', r.age)
    r.str = Number(this.extractValue(text, this.RE.strRegExp))
    r.con = Number(this.extractValue(text, this.RE.conRegExp))
    r.siz = Number(this.extractValue(text, this.RE.sizRegExp))
    r.int = Number(this.extractValue(text, this.RE.intRegExp))
    r.pow = Number(this.extractValue(text, this.RE.powRegExp))
    r.dex = Number(this.extractValue(text, this.RE.dexRegExp))
    r.app = Number(this.extractValue(text, this.RE.appRegExp))
    r.edu = Number(this.extractValue(text, this.RE.eduRegExp))
    r.san = Number(this.extractValue(text, this.RE.sanRegExp))
    r.hp = Number(this.extractValue(text, this.RE.hpRegExp))
    r.mp = Number(this.extractValue(text, this.RE.mpRegExp))
    r.db = this.extractValue(text, this.RE.dbRegExp)
    r.build = this.extractValue(text, this.RE.buildRegExp)
    r.armor = this.extractValue(text, this.RE.armorRegExp)
    console.debug('armor', r.armor)
    r.mov = Number(this.extractValue(text, this.RE.moveRegExp))
    r.lck = Number(this.extractValue(text, this.RE.luckRegExp))
    r.sanLoss = this.extractValue(text, this.RE.sanLossRegExp)
    r.attacksPerRound = this.extractValue(text, this.RE.attacksPerRoundRegExp)

    const attacks = this.extractValue(text, this.RE.attacksRegExp)
    // console.log(attacks)
    r.attacks = await this.processAttacks(attacks)
    const spells = this.extractValue(text, this.RE.spellsRegExp)
    // console.log(spells)
    r.spells = await this.processSpells(spells)
    const skills = this.extractValue(text, this.RE.skillsRegExp)
    console.log(skills)
    r.skills = await this.processSkills(skills)
    const dodge = this.RE.dodgeRegExp.exec(text)
    if (dodge !== null) {
      r.skills.push({
        name: this.cleanString(dodge.groups.name),
        value: Number(dodge.groups.percentage)
      })
    }
    const languages = this.extractValue(text, this.RE.languagesRegExp)
    // console.log(languages)
    // r.languages = processLanguages(languages)
    r.languages = await this.processSkills(languages)

    return r
  }

  /**
   * processName extracts the Character name from the first line of the `text` 
   * @param {string} text 
   * @returns the character name or 'Imported unnamed character' if the name was not found 
   */
  processName(text) {
    const nameFound = this.RE.nameRegExp.exec(text)
    if (nameFound !== null) {
      return nameFound.groups.name
    }
    return 'Imported unnamed character'
  }

  processAttacks(attacks) {
    const results = []
    if (attacks != null) {
      // results = attacks.split(',')
      let weapon = this.RE.weaponRegExp.exec(attacks)
      while (weapon !== null) {
        // Attempt to guess some of the weapon properties
        const cleanWeapon = this.cleanString(weapon.groups.weapon)
        const doesDamageBonus = this.RE.dbRegExp.test(weapon.groups.damage)
        const isRanged = this.RE.handgunRegExp.test(cleanWeapon) || this.RE.rifleRegExp.test(cleanWeapon) ||
          this.RE.smbRegExp.test(cleanWeapon) || this.RE.machineGunRegExp.test(cleanWeapon)
        const data = {
          name: cleanWeapon,
          type: 'weapon',
          data: {
            properties: {
              "rngd": isRanged,
              "melee": doesDamageBonus, // if a weapon doesDamageBonus usually means it's a melee weapon
              "addb": doesDamageBonus
            },
            range: {
              normal: {
                value: Number(weapon.groups.percentage),
                damage: weapon.groups.damage
              }
            }
          }
        }
        results.push(data)
        weapon = this.RE.weaponRegExp.exec(attacks)
      }
    }
    console.debug('attacks', results)
    return results
  }

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
   * basicWeaponData creates a basic object with the default basic data for a weapon
   * @param {boolean} firearms true if the weapon uses firearms, false if it's a melee one.
   * @returns 
   */
  basicWeaponData(firearms) {
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
          // results[parsedSkill.groups]
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

  cleanString(s) {
    return s.replace(/(\n|\r)/g, ' ').replace(/^\s*/, '').replace(/\s*\.?\s*$/, '')
  }

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

  // TODO: split in several methods
  async createEntity(pc, entityTypeString) {
    let importedCharactersFolder = await this.createImportCharactersFolderIfNotExists()

    // const npcData = setCharacteristics(pc)
    const npc = await Actor.create({
      name: pc.name,
      type: this.entityType(entityTypeString),
      folder: importedCharactersFolder._id,
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

  async createImportCharactersFolderIfNotExists() {
    let importedCharactersFolder = game.folders.find(entry => entry.data.name === 'Imported characters' && entry.data.type === 'Actor')
    if (importedCharactersFolder === null) {
      // Create the folder
      importedCharactersFolder = await Folder.create({
        name: 'Imported characters',
        type: 'Actor',
        parent: null
      })
      ui.notifications.info('Created Imported Characters folder')
    }
    return importedCharactersFolder
  }

  async updateActorData(pc, npc) {
    let updateData = {};
    ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu'].forEach(key => {
      updateData[`data.characteristics.${key}.value`] = Number(pc[key])
    })
    await npc.update(updateData)
    updateData = {};
    ['hp', 'mp', 'lck', 'san', 'mov', 'db', 'build', 'armor'].forEach(key => {
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
      let newSkill = null
      for (let i = 0; i < pc.attacks.length; i++) {
        const attack = pc.attacks[i]
        console.debug('attack', attack)
        const skill = await this.weaponSkill(attack.name)
        if (skill !== null) {
          console.debug('skill', skill)
          const skillClone = duplicate(skill)
          // cloneObj(skill)
          delete skillClone._id
          skillClone.data.value = attack.data.range.normal.value
          console.debug('skillClone', skillClone)
          newSkill = await npc.createOwnedItem(skillClone)
          if (newSkill !== null && newSkill !== undefined) {
            newSkill.data.value = attack.data?.range?.normal?.value
          } else { // Maybe the skill aready exists.
            const newSkillId = await npc.getItemIdByName(skillClone.name)
            newSkill = await npc.getOwnedItem(newSkillId)
            if (newSkill !== null && newSkill !== undefined) {
              newSkill.data.value = attack.data?.range?.normal?.value
            }
          }
          console.debug('newSkill', newSkill)
        } else {
          console.debug('Weapon skill not found for ' + attack.name)
          const skill = {
            name: attack.name,
            type: 'skill',
            data: this.basicWeaponData(false)
          }
          skill.data.base = attack.data?.range?.normal?.value
          skill.data.value = attack.data?.range?.normal?.value
          console.debug('skill', skill)
          newSkill = await npc.createOwnedItem(skill)
          console.debug('newSkill', newSkill)
        }
        const weapon = await npc.createOwnedItem(attack)
        console.debug('weapon', weapon)
        if (newSkill !== null) {
          const createdAttack = npc.getOwnedItem(weapon._id)
          await createdAttack.update({
            'data.skill.main.id': newSkill._id,
            'data.skill.main.name': newSkill.name,
            'data.properties': newSkill.data.properties,
            'data.adjustments': newSkill.data.adjustments,
            'data.specialization': newSkill.data.specialization
          })
        }
      }
    }
  }

  async addTheSpells(pc, npc) {
    if (pc.spells !== null) {
      for (let i = 0; i < pc.spells.length; i++) {
        const created = await npc.addItems([{
          name: pc.spells[i],
          type: 'spell'
        }])
        console.debug(created)
      }
    };
  }

  async addTheLanguages(pc, npc) {
    if (pc.languages !== null) {
      for (let i = 0; i < pc.languages.length; i++) {
        const newSkill = await this.createSkill(pc.languages[i])
        const created = await npc.createOwnedItem(newSkill)
        console.debug(created)
      }
    }
  }

  async addTheSkills(pc, npc) {
    if (pc.skills !== null) {
      for (let i = 0; i < pc.skills.length; i++) {
        const newSkill = await this.createSkill(pc.skills[i])
        const created = await npc.createOwnedItem(newSkill)
        console.debug(created)
      }
    }
  }

  async createSkill(skill) {
    const skillName = skill.name
    const existingSkill = await game.items.find(i => i.data.type === 'skill' && i.data.name === skillName)
    let icon = null
    let newData = {
      value: skill.value,
      properties: defaultProperties
    }
    if (existingSkill != null) {
      icon = existingSkill.data.img
      newData = existingSkill.data.data
      newData.base = skill.value // TODO: find a way to keep the base
      newData.value = skill.value
    }
    return {
      name: skillName,
      type: 'skill',
      data: newData,
      img: icon
    }
  }

  async weaponSkill(weapon) {
    let skill = null
    if (this.RE.handgunRegExp.exec(weapon)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Handgun')
      console.log(weapon + ' uses Handgun skill: ' + skill)
    } else if (this.RE.rifleRegExp.exec(weapon)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Rifle/Shotgun')
      console.log(weapon + ' uses Rifle skill ' + skill)
    } else if (this.RE.smbRegExp.exec(weapon)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Submachine Gun')
      console.log(weapon + ' uses Submachine Gun skill ' + skill)
    } else if (this.RE.machineGunRegExp.exec(weapon)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Machine Gun')
      console.log(weapon + ' uses Machine Gun skill ' + skill)
    } else if (this.RE.launchedWeapons.exec(weapon)) {
      skill = await game.items.find(i => i.data.type === 'skill' && i.data.name === 'Launch')
      console.log(weapon + ' uses Launch skill ' + skill)
    }
    return skill
  }

  /**
   * needsConversion does an evaluation to see if the given npc needs to be converted to 7th Edition
   * Returns true when any of the Characteristics value it's above 29
   */
  needsConversion(npc) {
    let needsConversionResult = true;
    ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu'].forEach(key => {
      if (npc[key] > 30) {
        needsConversionResult = false;
      }
    })
    console.log('needsConversion:', needsConversionResult)
    return needsConversionResult
  }

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
   * convert7E Converts the given creature from 6 edition to 7 edition 
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