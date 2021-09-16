/* global Actor, CONST, Dialog, Die, duplicate, game, getProperty, mergeObject, Roll, TextEditor, Token, ui */

import { COC7 } from '../config.js'
import { CoC7Check } from '../check.js'
import { CoC7ConCheck } from '../chat/concheck.js'
import { RollDialog } from '../apps/roll-dialog.js'
import { SkillSelectDialog } from '../apps/skill-selection-dialog.js'
import { PointSelectDialog } from '../apps/point-selection-dialog.js'
import { CharacSelectDialog } from '../apps/char-selection-dialog.js'
import { CharacRollDialog } from '../apps/char-roll-dialog.js'
import { SkillSpecSelectDialog } from '../apps/skill-spec-select-dialog.js'
import { SkillValueDialog } from '../apps/skill-value-dialog.js'
import { CoC7MeleeInitiator } from '../chat/combat/melee-initiator.js'
import { CoC7RangeInitiator } from '../chat/rangecombat.js'
import { chatHelper } from '../chat/helper.js'
import { CoC7Dice } from '../dice.js'
import { CoC7Item } from '../items/item.js'
import { CoC7Utilities } from '../utilities.js'

/**
 * Extend the base Actor class to implement additional logic specialized for CoC 7th.
 */
export class CoCActor extends Actor {
  async initialize () {
    super.initialize()
    await this.creatureInit() // TODO : move this in CoCActor.create(data, options)
  }

  // ********************** Testing
  // async update(data, options={}) {
  //   ui.notifications.info('return super.update(data, options);');
  //   ui.notifications.info(`int : ${this.characteristics.int}`);
  //   this.characteristics.int = 15;
  //   ui.notifications.info(`modified int : ${this.characteristics.int}`);
  //   return super.update(data, options);
  // }

  // get characteristics(){
  //   const actor = this;
  //     return {
  //       get int(){
  //         return actor.getProp('_int');
  //       },

  //       set int(x){
  //         actor.setProp('_int', x);
  //       }
  //    };
  // }

  // setProp(key, x){
  //   this[key] = x;
  // }

  // getProp(key){
  //   return this[key]||0;
  // }
  //

  /** @override */
  static async create (data, options = {}) {
    data.token = data.token || {}
    if (data.type === 'character') {
      mergeObject(
        data.token,
        {
          vision: true,
          dimSight: 30,
          brightSight: 0,
          actorLink: true,
          disposition: 1
        },
        { overwrite: false }
      )
    } else if (data.type === 'vehicle') {
      data.img = 'systems/CoC7/assets/icons/jeep.svg'
    } else if (data.type === 'container') {
      data.img = 'icons/svg/chest.svg'
      mergeObject(data.token, {
        actorLink: true
      })
    }
    return super.create(data, options)
  }

  /**
   * Early version on templates did not include possibility of auto calc
   * Just check if auto is undefined, in which case it will be set to true
   */
  checkUndefinedAuto () {
    const returnData = {
      attribs: {
        hp: {},
        mp: {},
        san: {},
        mov: {},
        db: {},
        build: {}
      }
    }
    if (this.data.data.attribs?.hp?.auto === undefined) {
      returnData.attribs.hp.auto = true
    }
    if (this.data.data.attribs?.mp?.auto === undefined) {
      returnData.attribs.mp.auto = true
    }
    if (this.data.data.attribs?.san?.auto === undefined) {
      returnData.attribs.san.auto = true
    }
    if (this.data.data.attribs?.mov?.auto === undefined) {
      returnData.attribs.mov.auto = true
    }
    if (this.data.data.attribs?.db?.auto === undefined) {
      returnData.attribs.db.auto = true
    }
    if (this.data.data.attribs?.build?.auto === undefined) {
      returnData.attribs.build.auto = true
    }

    return returnData
  }

  get characteristics () {
    const characteristics = {
      str: {
        value: null,
        shortName: 'CHARAC.STR',
        label: 'CHARAC.Strength',
        formula: null
      },
      con: {
        value: null,
        shortName: 'CHARAC.CON',
        label: 'CHARAC.Constitution',
        formula: null
      },
      siz: {
        value: null,
        shortName: 'CHARAC.SIZ',
        label: 'CHARAC.Size',
        formula: null
      },
      dex: {
        value: null,
        shortName: 'CHARAC.DEX',
        label: 'CHARAC.Dexterity',
        formula: null
      },
      app: {
        value: null,
        shortName: 'CHARAC.APP',
        label: 'CHARAC.Appearance',
        formula: null
      },
      int: {
        value: null,
        shortName: 'CHARAC.INT',
        label: 'CHARAC.Intelligence',
        formula: null
      },
      pow: {
        value: null,
        shortName: 'CHARAC.POW',
        label: 'CHARAC.Power',
        formula: null
      },
      edu: {
        value: null,
        shortName: 'CHARAC.EDU',
        label: 'CHARAC.Education',
        formula: null
      }
    }
    if (this.data.data.characteristics) {
      for (const [key, value] of Object.entries(
        this.data.data.characteristics
      )) {
        characteristics[key] = {
          key: key,
          shortName: game.i18n.localize(value.short),
          label: game.i18n.localize(value.label),
          value: value.value,
          hard: Math.floor(value.value / 2) || null,
          extreme: Math.floor(value.value / 5) || null,
          formula: value.formula
        }
      }
    }
    return characteristics
  }

  /**
   * Called upon token creation from preCreateActor hook
   * @param {*} createData
   */
  static async initToken (createData) {
    // called upon token creation.active
    if (createData) {
      //
    }
  }

  get boutOfMadness () {
    return this.effects.find(
      e => e.data.label === game.i18n.localize('CoC7.BoutOfMadnessName')
    )
  }

  get insanity () {
    return this.effects.find(
      e => e.data.label === game.i18n.localize('CoC7.InsanityName')
    )
  }

  get isInABoutOfMadness () {
    if (!this.boutOfMadness) return false
    return !this.boutOfMadness.data.disabled
  }

  get isInsane () {
    if (!this.insanity) return false
    return !this.insanity.data.disabled
  }

  get sanity () {
    const boutRealTime = !!this.boutOfMadness?.data.flags?.CoC7?.realTime
    let duration = boutRealTime
      ? this.boutOfMadness?.data?.duration?.rounds
      : this.boutOfMadness?.data?.duration.seconds
    if (!boutRealTime && duration) duration = Math.round(duration / 3600)
    let indefiniteInstanity = !!this.insanity?.data.flags?.CoC7?.indefinite
    let insaneDuration = indefiniteInstanity
      ? null
      : this.insanity?.data?.duration.seconds
    if (!indefiniteInstanity && insaneDuration) {
      insaneDuration = insaneDuration / 3600
    }
    let boutDurationText = this.isInABoutOfMadness
      ? boutRealTime
        ? `${duration} ${game.i18n.localize('CoC7.rounds')}`
        : `${duration} ${game.i18n.localize('CoC7.hours')}`
      : null
    const insanityDurationText = insaneDuration
      ? this.isInsane
        ? indefiniteInstanity
          ? null
          : `${insaneDuration} ${game.i18n.localize('CoC7.hours')}`
        : null
      : null
    if (this.isInsane && !insanityDurationText && !indefiniteInstanity) {
      indefiniteInstanity = true
    }
    if (!duration) boutDurationText = ''

    return {
      boutOfMadness: {
        active: this.isInABoutOfMadness,
        realTime: this.isInABoutOfMadness ? boutRealTime : undefined,
        summary: this.isInABoutOfMadness ? !boutRealTime : undefined,
        duration: this.isInABoutOfMadness ? duration : undefined,
        durationText: boutDurationText || '',
        hint: this.isInABoutOfMadness
          ? `${game.i18n.localize('CoC7.BoutOfMadness')}${
              boutDurationText ? ': ' + boutDurationText : ''
            }`
          : game.i18n.localize('CoC7.BoutOfMadness')
      },
      underlying: {
        active: this.isInsane,
        indefintie: this.isInsane ? indefiniteInstanity : undefined,
        duration: insaneDuration,
        durationText: insanityDurationText || '',
        hint: this.isInsane
          ? indefiniteInstanity
            ? game.i18n.localize('CoC7.IndefiniteInsanity')
            : `${game.i18n.localize(
                'CoC7.TemporaryInsanity'
              )} ${insanityDurationText || ''}`
          : game.i18n.localize('CoC7.NotInsane')
      }
    }
  }

  get portrait () {
    if (!game.settings.get('CoC7', 'useToken')) return this.img
    if (this.isToken) {
      return this.token?.data?.img || this.img
    } else {
      return this.data.token?.img || this.img
    }
  }

  async enterBoutOfMadness (realTime = true, duration = 1) {
    // const duration = {rounds: 1,
    //   seconds: 17,
    //   startRound: 3,
    //   startTime: 58,
    //   startTurn: 4,
    //   turns: 2};
    // await this.boutOfMadness?.setFlag( 'CoC7', 'madness', true);

    let result = null
    const boutOfMadnessTableId = realTime
      ? game.settings.get('CoC7', 'boutOfMadnessRealTimeTable')
      : game.settings.get('CoC7', 'boutOfMadnessSummaryTable')
    if (boutOfMadnessTableId !== 'none') {
      result = {
        phobia: false,
        mania: false,
        description: null
      }
      const boutOfMadnessTable = game.tables.get(boutOfMadnessTableId)
      result.tableRoll = await boutOfMadnessTable.roll()
      if (typeof result.tableRoll.results[0] !== 'undefined') {
        if (
          CONST.TABLE_RESULT_TYPES.ENTITY ===
          result.tableRoll.results[0].data.type
        ) {
          const item = game.items.get(result.tableRoll.results[0].data.resultId)
          if (typeof item !== 'undefined') {
            if (item.data?.data?.type?.phobia) result.phobia = true
            if (item.data?.data?.type?.mania) result.mania = true
            result.description = `${item.name}:${TextEditor.enrichHTML(
              item.data.data.description.value
            )}`
            result.name = item.name
            delete item.data._id
            /** MODIF 0.8.x **/
            // await this.createOwnedItem( item.data);
            await this.createEmbeddedDocuments('Item', [item.data])
            /*****************/
          } else {
            ui.notifications.error(
              game.i18n.localize('CoC7.MessageBoutOfMadnessItemNotFound')
            )
          }
        }
        if (
          CONST.TABLE_RESULT_TYPES.TEXT ===
          result.tableRoll.results[0].data.type
        ) {
          result.description = TextEditor.enrichHTML(
            result.tableRoll.results[0].data.text
          )
        }
      } else {
        ui.notifications.error(
          game.i18n.localize('CoC7.MessageBoutOfMadnessTableNotFound')
        )
      }
    }

    // If it's not a real time no need to activate the bout
    if (!realTime) return result

    if (this.boutOfMadness) {
      await this.boutOfMadness.update({
        disabled: false,
        duration: {
          rounds: realTime && duration ? duration : undefined,
          seconds: realTime ? undefined : duration * 3600,
          turns: 1
        },
        flags: {
          CoC7: {
            realTime: realTime
          }
        }
      })
    } else {
      // const effectData =
      await super.createEmbeddedDocuments('ActiveEffect', [
        {
          label: game.i18n.localize('CoC7.BoutOfMadnessName'),
          icon: 'systems/CoC7/assets/icons/hanging-spider.svg',
          origin: this.uuid,
          duration: {
            rounds: realTime && duration ? duration : undefined,
            seconds: realTime ? undefined : duration * 3600,
            turns: 1
          },
          flags: {
            CoC7: {
              madness: true,
              realTime: realTime
            }
          },
          // tint: '#ff0000',
          disabled: false
        }
      ])
      // const effect = this.effects.get( effectData._id);
      // effect.sheet.render(true);
    }
    // const effect = this.effects.get( effectData._id);
    // effect.sheet.render(true);

    return result
  }

  async enterInsanity (indefinite = true, duration = undefined) {
    if (this.insanity) {
      await this.insanity.update({
        disabled: false,
        duration: {
          seconds: !indefinite && duration ? duration * 3600 : undefined,
          turns: 1
        },
        flags: {
          CoC7: {
            indefinite: indefinite
          }
        }
      })
    } else {
      await super.createEmbeddedDocuments('ActiveEffect', [
        {
          label: game.i18n.localize('CoC7.InsanityName'),
          icon: 'systems/CoC7/assets/icons/tentacles-skull.svg',
          origin: this.uuid,
          duration: {
            seconds: !indefinite && duration ? duration * 3600 : undefined,
            turns: 1
          },
          flags: {
            CoC7: {
              madness: true,
              indefinite: indefinite
            }
          },
          disabled: false
        }
      ])
    }
  }

  async exitBoutOfMadness () {
    return await this.boutOfMadness?.delete()
  }

  async exitInsanity () {
    return await this.insanity?.delete()
  }

  /**
   * Called upon new actor creation.
   * @param {*} data
   * @param {*} options
   */
  // static async create(data, options) {
  //  // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
  //  if (data.items) {
  //    return super.create(data, options);
  //  }
  //  return super.create(data, options);
  // }

  /** @override */
  async createSkill (skillName, value, showSheet = false) {
    const data = {
      name: skillName,
      type: 'skill',
      data: {
        value: value,
        properties: {
          special: false,
          rarity: false,
          push: true,
          combat: false
        }
      }
    }
    const created = await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: showSheet
    })
    return created
  }

  async createWeaponSkill (name, firearms = false, base = null) {
    // TODO : Ask for base value if null

    const skillData = await SkillSpecSelectDialog.create(
      [],
      game.i18n.localize(
        firearms
          ? 'CoC7.FirearmSpecializationName'
          : 'CoC7.FightingSpecializationName'
      ),
      0,
      name
    )
    const value = Number(skillData.get('base-value'))
    const data = {
      name: name,
      type: 'skill',
      data: {
        specialization: game.i18n.localize(
          firearms
            ? 'CoC7.FirearmSpecializationName'
            : 'CoC7.FightingSpecializationName'
        ),
        base: isNaN(value) ? 0 : value,
        adjustments: {
          personal: null,
          occupation: null,
          archetype: null,
          experience: null
        },
        properties: {
          special: true,
          fighting: !firearms,
          firearm: firearms,
          combat: true
        }
      }
    }
    await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: !base
    })
    const skill = this.getSkillsByName(name)
    return skill[0]
  }

  /**
   * Initialize a creature with minimums skills
   */
  async creatureInit () {
    if (this.data.type !== 'creature') return
    if (this.getActorFlag('initialized')) return // Change to return skill ?

    // Check if fighting skills exists, if not create it and the associated attack.
    const skills = this.getSkillsByName(
      game.i18n.localize(COC7.creatureFightingSkill)
    )
    if (skills.length === 0) {
      // Creating natural attack skill
      try {
        const skill = await this.createEmbeddedDocuments(
          'Item', // MODIF: 0.8.x 'OwnedItmem' => 'Item
          [
            {
              name: game.i18n.localize(COC7.creatureFightingSkill),
              type: 'skill',
              data: {
                base: 0,
                value: null,
                specialization: game.i18n.localize(
                  COC7.fightingSpecializationName
                ),
                properties: {
                  combat: true,
                  fighting: true,
                  special: true
                },
                flags: {}
              }
            }
          ],
          { renderSheet: false }
        )

        const attack = await this.createEmbeddedDocuments(
          'Item',
          [
            {
              name: 'Innate attack',
              type: 'weapon',
              data: {
                description: {
                  value: "Creature's natural attack",
                  chat: "Creature's natural attack"
                },
                wpnType: 'innate',
                properties: {
                  addb: true,
                  slnt: true
                }
              }
            }
          ],
          { renderSheet: false }
        )
        if (skill.length > 0 && attack.length > 0) {
          const createdAttack = this.items.get(attack[0].id)
          await createdAttack.update({
            'data.skill.main.id': skill[0].id,
            'data.skill.main.name': skill[0].name
          })
        }
      } catch (err) {
        console.error('Creature init: ' + err.message)
      }
      // console.log( 'Skill created');
      await this.setActorFlag('initialized')
      // Creating corresponding weapon.
    }
  }

  async createItem (itemName, quantity = 1, showSheet = false) {
    const data = {
      name: itemName,
      type: 'item',
      data: {
        quantity: quantity
      }
    }
    const created = await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: showSheet
    })
    return created
  }

  async createEmptyBook (event = null) {
    const showSheet = event ? !event.shiftKey : true
    if (!this.getItemIdByName(game.i18n.localize(COC7.newBookName))) {
      return this.createBook(game.i18n.localize(COC7.newBookName), showSheet)
    }
    let index = 0
    let itemName = game.i18n.localize(COC7.newBookName) + ' ' + index
    while (this.getItemIdByName(itemName)) {
      index++
      itemName = game.i18n.localize(COC7.newBookName) + ' ' + index
    }
    return this.createBook(itemName, showSheet)
  }

  async createBook (itemName, showSheet = false) {
    const data = {
      name: itemName,
      type: 'book',
      data: {}
    }
    const created = await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: showSheet
    })
    return created
  }

  async createEmptySpell (event = null) {
    const showSheet = event ? !event.shiftKey : true
    if (!this.getItemIdByName(game.i18n.localize(COC7.newSpellName))) {
      return this.createSpell(game.i18n.localize(COC7.newSpellName), showSheet)
    }
    let index = 0
    let itemName = game.i18n.localize(COC7.newSpellName) + ' ' + index
    while (this.getItemIdByName(itemName)) {
      index++
      itemName = game.i18n.localize(COC7.newSpellName) + ' ' + index
    }
    return this.createSpell(itemName, showSheet)
  }

  async createSpell (itemName, showSheet = false) {
    const data = {
      name: itemName,
      type: 'spell',
      data: {}
    }
    const created = await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: showSheet
    })
    return created
  }

  async createEmptySkill (event = null) {
    const showSheet = event ? !event.shiftKey : true
    if (!this.getItemIdByName(game.i18n.localize(COC7.newSkillName))) {
      return this.createSkill(
        game.i18n.localize(COC7.newSkillName),
        null,
        showSheet
      )
    }
    let index = 0
    let skillName = game.i18n.localize(COC7.newSkillName) + ' ' + index
    while (this.getItemIdByName(skillName)) {
      index++
      skillName = game.i18n.localize(COC7.newSkillName) + ' ' + index
    }

    return this.createSkill(skillName, null, showSheet)
  }

  async createEmptyItem (event = null) {
    const showSheet = event ? !event.shiftKey : true
    if (!this.getItemIdByName(game.i18n.localize(COC7.newItemName))) {
      return this.createItem(game.i18n.localize(COC7.newItemName), 1, showSheet)
    }
    let index = 0
    let itemName = game.i18n.localize(COC7.newItemName) + ' ' + index
    while (this.getItemIdByName(itemName)) {
      index++
      itemName = game.i18n.localize(COC7.newItemName) + ' ' + index
    }
    return this.createItem(itemName, 1, showSheet)
  }

  async createEmptyWeapon (event = null) {
    const showSheet = event ? !event.shiftKey : true
    let weaponName = game.i18n.localize(COC7.newWeaponName)
    if (this.getItemIdByName(game.i18n.localize(COC7.newWeaponName))) {
      let index = 0
      weaponName = game.i18n.localize(COC7.newWeaponName) + ' ' + index
      while (this.getItemIdByName(weaponName)) {
        index++
        weaponName = game.i18n.localize(COC7.newWeaponName) + ' ' + index
      }
    }

    const data = {
      name: weaponName,
      type: 'weapon',
      data: {
        properties: {}
      }
    }

    for (const [key] of Object.entries(COC7.weaponProperties)) {
      data.data.properties[key] = false
    }
    await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: showSheet
    })
  }

  async createBioSection (title = null) {
    const bio = this.data.data.biography
      ? duplicate(this.data.data.biography)
      : []
    bio.push({
      title: title,
      value: null
    })
    await this.update({ 'data.biography': bio })
  }

  async updateBioValue (index, content) {
    const bio = duplicate(this.data.data.biography)
    bio[index].value = content
    await this.update({ 'data.biography': bio }, { render: false })
  }

  async updateBioTitle (index, title) {
    const bio = duplicate(this.data.data.biography)
    bio[index].title = title
    await this.update({ 'data.biography': bio })
  }

  async deleteBioSection (index) {
    const bio = duplicate(this.data.data.biography)
    bio.splice(index, 1)
    await this.update({ 'data.biography': bio })
  }

  async moveBioSectionUp (index) {
    if (index === 0) return
    const bio = duplicate(this.data.data.biography)
    if (index >= bio.length) return
    const elem = bio.splice(index, 1)[0]
    bio.splice(index - 1, 0, elem)
    await this.update({ 'data.biography': bio })
  }

  async moveBioSectionDown (index) {
    const bio = duplicate(this.data.data.biography)
    if (index >= bio.length - 1) return
    const elem = bio.splice(index, 1)[0]
    bio.splice(index + 1, 0, elem)
    await this.update({ 'data.biography': bio })
  }

  async updateTextArea (textArea) {
    const name = 'data.' + textArea.dataset.areaName
    await this.update({ [name]: textArea.value })
  }

  /**
   * Create an item for that actor.
   * If it's a skill first check if the skill is already owned. If it is don't create a second time.
   * Fill the value of the skill with base or try to evaluate the formula.
   * @param {*} embeddedName
   * @param {*} data
   * @param {*} options
   */
  async createEmbeddedDocuments (embeddedName, dataArray, options) {
    const output = []
    let allCreated = []
    for (const data of dataArray) {
      switch (data.type) {
        case 'skill':
          if (this.data.type !== 'character') {
            // If not a PC set skill value to base
            if (this.getItemIdByName(data.name)) return // If skill with this name exist return

            if (data.data.base) {
              if (String(data.data.base) !== String(data.data.value)) {
                data.data.value = data.data.base
              }
            }

            if (isNaN(Number(data.data.value))) {
              let value
              try {
                value = (
                  await new Roll(
                    data.data.value,
                    this.parseCharacteristics()
                  ).evaluate({ async: true })
                ).total
              } catch (err) {
                value = null
              }
              if (value) data.data.value = Math.floor(value)
            }
          } else data.data.value = null

          if (CoC7Item.isAnySpec(data)) {
            const specialization = data.data.specialization?.toLowerCase()
            if (specialization) {
              let skillList = []
              if (data.data?.flags?.occupation || data.data?.flags?.archetype) {
                skillList = this.skills.filter(el => {
                  if (!el.data.data.specialization) return false
                  if (
                    data.data?.flags?.occupation &&
                    el.data.data.flags?.occupation
                  ) {
                    return false
                  }
                  if (
                    data.data?.flags?.archetype &&
                    el.data.data.flags?.archetype
                  ) {
                    return false
                  }
                  return (
                    specialization.toLowerCase() ===
                    el.data.data.specialization?.toLowerCase()
                  )
                })
              }
              // if( 1 <= skillList.length) {
              const skillData = await SkillSpecSelectDialog.create(
                skillList,
                data.data.specialization,
                data.data.base
              )
              if (skillData) {
                if (skillData.get('existing-skill')) {
                  const existingItem = this.items.get(
                    skillData.get('existing-skill')
                  )
                  for (const [key, value] of Object.entries(data.data.flags)) {
                    if (value) await existingItem.setItemFlag(key)
                  }
                  data.name = CoC7Item.getNameWithoutSpec(existingItem)
                  return
                } else {
                  if (skillData.get('new-skill-name')) {
                    data.name = skillData.get('new-skill-name')
                  } else data.name = CoC7Item.getNameWithoutSpec(data)

                  if (skillData.get('base-value')) {
                    const value = Number(skillData.get('base-value'))
                    if (!isNaN(value)) data.data.base = value
                  }
                }
              }
            }
            // }
          } else {
            const specialization = data.data.specialization
            if (specialization) {
              data.name = CoC7Item.getNameWithoutSpec(data)
            }
          }

          allCreated = await super.createEmbeddedDocuments(
            embeddedName,
            [data],
            options
          )
          for (const created of allCreated) {
            output.push(created)
          }
          break

        case 'weapon': {
          const mainSkill = data.data?.skill?.main?.name
          if (mainSkill) {
            let skill = this.getSkillsByName(mainSkill)[0]
            if (!skill) {
              const name = mainSkill.match(/\(([^)]+)\)/)
                ? mainSkill.match(/\(([^)]+)\)/)[1]
                : mainSkill
              skill = await this.createWeaponSkill(
                name,
                !!data.data.properties?.rngd
              )
            }
            if (skill) data.data.skill.main.id = skill.id
          } // TODO : Else : selectionner le skill dans la liste ou en créer un nouveau.

          const secondSkill = data.data?.skill?.alternativ?.name
          if (secondSkill) {
            let skill = this.getSkillsByName(secondSkill)[0]
            if (!skill) {
              const name = mainSkill.match(/\(([^)]+)\)/)
                ? mainSkill.match(/\(([^)]+)\)/)[1]
                : mainSkill
              skill = await this.createWeaponSkill(
                name,
                !!data.data.properties?.rngd
              )
            }
            if (skill) data.data.skill.alternativ.id = skill.id
          } // TODO : Else : selectionner le skill dans la liste ou en créer un nouveau.

          allCreated = await super.createEmbeddedDocuments(
            embeddedName,
            [duplicate(data)],
            options
          )
          for (const created of allCreated) {
            output.push(created)
          }
          break
        }

        case 'setup': {
          if (data.data.enableCharacterisitics) {
            data.data.characteristics.list = {}
            data.data.characteristics.list.str = this.getCharacteristic('str')
            data.data.characteristics.list.con = this.getCharacteristic('con')
            data.data.characteristics.list.siz = this.getCharacteristic('siz')
            data.data.characteristics.list.dex = this.getCharacteristic('dex')
            data.data.characteristics.list.app = this.getCharacteristic('app')
            data.data.characteristics.list.int = this.getCharacteristic('int')
            data.data.characteristics.list.pow = this.getCharacteristic('pow')
            data.data.characteristics.list.edu = this.getCharacteristic('edu')

            data.data.characteristics.list.luck = {}
            data.data.characteristics.list.luck.value = isNaN(this.luck)
              ? null
              : this.luck
            data.data.characteristics.list.luck.label = game.i18n.localize(
              'CoC7.Luck'
            )
            data.data.characteristics.list.luck.shortName = game.i18n.localize(
              'CoC7.Luck'
            )

            if (!data.data.characteristics.values) {
              data.data.characteristics.values = {}
            }
            data.data.characteristics.values.str =
              data.data.characteristics.list.str.value
            data.data.characteristics.values.con =
              data.data.characteristics.list.con.value
            data.data.characteristics.values.siz =
              data.data.characteristics.list.siz.value
            data.data.characteristics.values.dex =
              data.data.characteristics.list.dex.value
            data.data.characteristics.values.app =
              data.data.characteristics.list.app.value
            data.data.characteristics.values.int =
              data.data.characteristics.list.int.value
            data.data.characteristics.values.pow =
              data.data.characteristics.list.pow.value
            data.data.characteristics.values.edu =
              data.data.characteristics.list.edu.value
            data.data.characteristics.values.luck =
              data.data.characteristics.list.luck.value
            if (data.data.characteristics.points.enabled) {
              data.data.title = game.i18n.localize('CoC7.SpendPoints')
            } else {
              data.data.title = game.i18n.localize('CoC7.RollCharac')
            }
            data.data.pointsWarning = !(
              data.data.characteristics.values.str !== null &&
              data.data.characteristics.values.con !== null &&
              data.data.characteristics.values.siz !== null &&
              data.data.characteristics.values.dex !== null &&
              data.data.characteristics.values.app !== null &&
              data.data.characteristics.values.int !== null &&
              data.data.characteristics.values.pow !== null &&
              data.data.characteristics.values.edu !== null
            )
            const rolled = await CharacRollDialog.create(data.data)
            if (rolled) {
              const updateData = {}
              ;['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu'].forEach(
                key => {
                  if (data.data.characteristics.values[key]) {
                    updateData[`data.characteristics.${key}.value`] =
                      data.data.characteristics.values[key]
                    updateData[`data.characteristics.${key}.formula`] =
                      data.data.characteristics.rolls[key]
                  }
                }
              )
              if (data.data.characteristics.values.luck) {
                updateData['data.attribs.lck.value'] =
                  data.data.characteristics.values.luck
              }
              if (data.data.characteristics.values.pow) {
                updateData['data.attribs.san.value'] =
                  data.data.characteristics.values.pow
                updateData['data.attribs.san.oneFifthSanity'] =
                  ' / ' + Math.floor(data.data.characteristics.values.pow / 5)
                updateData['data.indefiniteInsanityLevel.max'] = updateData[
                  'data.attribs.mp.value'
                ] = updateData['data.attribs.mp.max'] = Math.floor(
                  data.data.characteristics.values.pow / 5
                )
              }
              await this.update(updateData)
              await this.update({
                'data.attribs.hp.value': this.hpMax,
                'data.attribs.hp.max': this.hpMax
              })
            } else return
          }
          const skills = data.data.items.filter(it => it.type === 'skill')
          const othersItems = data.data.items.filter(it => it.type !== 'skill')
          await this.addUniqueItems(skills)
          await this.addItems(othersItems)
          if (game.settings.get('CoC7', 'oneBlockBackstory')) {
            await this.update({ 'data.backstory': data.data.backstory })
          } else {
            for (const sectionName of data.data.bioSections) {
              if (
                !this.data.data.biography?.find(
                  el => sectionName === el.title
                ) &&
                sectionName
              ) {
                await this.createBioSection(sectionName)
              }
            }
          }
          break
        }
        case 'archetype':
          if (this.data.type === 'character') {
            // Archetypre only for PCs
            if (this.archetype) {
              let resetArchetype = false
              await Dialog.confirm({
                title: game.i18n.localize('CoC7.ResetArchetype'),
                content: `<p>${game.i18n.format('CoC7.ResetArchetypeHint', {
                  name: this.name
                })}</p>`,
                yes: () => {
                  resetArchetype = true
                },
                defaultYes: false
              })
              if (resetArchetype) await this.resetArchetype()
              else return
            }

            const coreCharac = []
            Object.entries(data.data.coreCharacteristics).forEach(entry => {
              const [key, value] = entry
              data.data.coreCharacteristics[key] = false
              if (value) {
                const char = this.getCharacteristic(key)
                char.key = key
                coreCharac.push(char)
              }
            })

            let charac

            if (coreCharac.length > 1) {
              const charDialogData = {}
              charDialogData.characteristics = coreCharac
              charDialogData.title = game.i18n.localize('CoC7.SelectCoreCharac')
              charac = await CharacSelectDialog.create(charDialogData)
            } else if (coreCharac.length === 1) {
              charac = coreCharac[0].key
            }

            if (!charac) return
            data.data.coreCharacteristics[charac] = true
            if (data.data.coreCharacteristicsFormula.enabled) {
              let value = Number(data.data.coreCharacteristicsFormula.value)
              if (isNaN(value)) {
                const char = this.getCharacteristic(charac)
                const roll = new Roll(
                  data.data.coreCharacteristicsFormula.value
                )
                await roll.roll({ async: true })
                roll.toMessage({
                  flavor: `Rolling characterisitic ${char.label}: ${data.data.coreCharacteristicsFormula.value}`
                })
                value = char.value < roll.total ? roll.total : char.value
              }
              await this.update({
                [`data.characteristics.${charac}.value`]: value
              })
            }

            // Add all skills
            await this.addUniqueItems(data.data.skills, 'archetype')

            const allCreated = await super.createEmbeddedDocuments(
              embeddedName,
              [data],
              options
            )
            // setting points
            await this.update({
              'data.development.archetype': this.archetypePoints
            })

            for (const created of allCreated) {
              output.push(created)
            }
          }

          break
        case 'occupation':
          if (this.data.type === 'character') {
            // Occupation only for PCs
            if (this.occupation) {
              let resetOccupation = false
              await Dialog.confirm({
                title: game.i18n.localize('CoC7.ResetOccupation'),
                content: `<p>${game.i18n.format('CoC7.ResetOccupationHint', {
                  name: this.name
                })}</p>`,
                yes: () => {
                  resetOccupation = true
                },
                defaultYes: false
              })
              if (resetOccupation) await this.resetOccupation()
              else return
            }

            // Select characteristic
            const pointsDialogData = {}
            pointsDialogData.characteristics = data.data.occupationSkillPoints
            let total = 0
            let optionalChar = false
            Object.entries(data.data.occupationSkillPoints).forEach(entry => {
              const [key, value] = entry
              const char = this.getCharacteristic(key)
              pointsDialogData.characteristics[key].name = char.label
              pointsDialogData.characteristics[key].value = char.value
              if (value.selected) {
                pointsDialogData.characteristics[key].total =
                  char.value *
                  Number(pointsDialogData.characteristics[key].multiplier)
                if (!value.optional) {
                  total += pointsDialogData.characteristics[key].total
                } else {
                  optionalChar = true
                }
              }
            })
            pointsDialogData.total = total
            if (optionalChar) {
              // Is there any optional char to choose for points calc ?
              const result = await PointSelectDialog.create(pointsDialogData)
              if (!result) return // Point not selected => exit.
            }

            // Add optional skills
            for (let index = 0; index < data.data.groups.length; index++) {
              const dialogData = {}
              dialogData.skills = []
              dialogData.type = 'occupation'
              dialogData.actorId = this.id
              dialogData.optionsCount = Number(data.data.groups[index].options)
              dialogData.title = game.i18n.localize('CoC7.SkillSelectionWindow')

              // Select only skills that are not present or are not flagged as occupation.
              data.data.groups[index].skills.forEach(value => {
                if (CoC7Item.isAnySpec(value)) dialogData.skills.push(value)
                // If it's a generic spec we always add it
                else {
                  const skill = this.items.find(item => {
                    return item.name === value.name && item.type === 'skill'
                  })
                  if (!skill || !skill.data.data.flags?.occupation) {
                    // if skill was added to skill list previously, remove it
                    const alreadySelectedSkill = data.data.skills.find(item => {
                      return item.name === value.name
                    })
                    if (!alreadySelectedSkill) dialogData.skills.push(value)
                  }
                }
              })

              // if there's none, do nothing.
              if (dialogData.skills.length !== 0) {
                dialogData.skills.forEach(skill => {
                  if (
                    skill.data.specialization &&
                    !skill.name.includes(skill.data.specialization)
                  ) {
                    skill.displayName = `${skill.data.specialization} (${skill.name})`
                  } else skill.displayName = skill.name
                })

                if (dialogData.skills.length <= dialogData.optionsCount) {
                  // If there's is less skill than options, add them all.
                  ui.notifications.info(
                    game.i18n.format('CoC7.InfoLessSkillThanOptions', {
                      skillCount: dialogData.skills.length,
                      optionsCount: dialogData.optionsCount
                    })
                  )
                  // await this.addUniqueItems( dialogData.skills, 'occupation');
                  const merged = CoC7Item.mergeOptionalSkills(
                    data.data.skills,
                    dialogData.skills
                  )
                  data.data.skills = merged
                } else {
                  // Wait for skill selection.
                  const selected = await SkillSelectDialog.create(dialogData)
                  if (!selected) return
                  const merged = CoC7Item.mergeOptionalSkills(
                    data.data.skills,
                    selected
                  )
                  data.data.skills = merged
                }
              } else {
                ui.notifications.info(
                  game.i18n.localize('CoC7.InfoAllSkillsAlreadySelected')
                )
              }
            }

            // Add extra skills
            if (Number(data.data.personal)) {
              const dialogData = {}
              dialogData.skills = []
              dialogData.type = 'occupation'
              dialogData.actorId = this.id
              dialogData.optionsCount = Number(data.data.personal)
              dialogData.title = game.i18n.format('CoC7.SelectPersonalSkills', {
                number: Number(data.data.personal)
              })

              // Select only skills that are not present or are not flagged as occupation.
              this.skills.forEach(s => {
                // Select all skills that are not already flagged as occupation, can have adjustments and XP.
                if (
                  !s.data.data.flags.occupation &&
                  !s.data.data.properties.noadjustments &&
                  !s.data.data.properties.noxpgain
                ) {
                  // if skill already selected don't add it
                  const alreadySelectedSkill = data.data.skills.find(item => {
                    return item.name === s.name
                  })
                  if (!alreadySelectedSkill) dialogData.skills.push(s.data)
                }
              })

              // if there's none, do nothing.
              if (dialogData.skills.length !== 0) {
                dialogData.skills.forEach(skill => {
                  if (
                    skill.data.specialization &&
                    !skill.name.includes(skill.data.specialization)
                  ) {
                    skill.displayName = `${skill.data.specialization} (${skill.name})`
                  } else skill.displayName = skill.name
                })
                if (dialogData.skills.length <= dialogData.optionsCount) {
                  // If there's is less skill than options, add them all.
                  ui.notifications.info(
                    game.i18n.format('CoC7.InfoLessSkillThanOptions', {
                      skillCount: dialogData.skills.length,
                      optionsCount: dialogData.optionsCount
                    })
                  )
                  // await this.addUniqueItems( dialogData.skills, 'occupation');
                  const merged = CoC7Item.mergeOptionalSkills(
                    data.data.skills,
                    dialogData.skills
                  )
                  data.data.skills = merged
                } else {
                  // Wait for skill selection.
                  const selected = await SkillSelectDialog.create(dialogData) // Dialog data bug ???
                  if (!selected) return
                  const merged = CoC7Item.mergeOptionalSkills(
                    data.data.skills,
                    selected
                  )
                  data.data.skills = merged
                }
              } else {
                ui.notifications.info(
                  game.i18n.localize('CoC7.InfoAllSkillsAlreadySelected')
                )
              }
            }

            // Add all skills
            await this.addUniqueItems(data.data.skills, 'occupation')
            // Credit rating is always part of occupation
            await this.creditRatingSkill?.setItemFlag('occupation')
            // setting it to min credit rating
            await this.creditRatingSkill?.update({
              'data.adjustments.occupation': Number(data.data.creditRating.min)
            })

            allCreated = await super.createEmbeddedDocuments(
              embeddedName,
              [data],
              options
            )
            // setting points
            await this.update({
              'data.development.occupation': this.occupationPoints,
              'data.development.personal': this.personalPoints
            })

            for (const created of allCreated) {
              output.push(created)
            }
          }
          break

        default:
          allCreated = await super.createEmbeddedDocuments(
            embeddedName,
            [data],
            options
          )
          for (const created of allCreated) {
            output.push(created)
          }
      }
    }
    return output
  }

  // getSkillIdByName( skillName){
  //   let id = null;
  //    this.items.forEach( (value, key, map) => {
  //     if( value.name == skillName) id = value.id;
  //   });

  //   return id;
  // }

  getItemIdByName (itemName) {
    let id = null
    const name = itemName.match(/\(([^)]+)\)/)
      ? itemName.match(/\(([^)]+)\)/)[1]
      : itemName
    this.items.forEach(value => {
      if (
        CoC7Item.getNameWithoutSpec(value).toLowerCase() === name.toLowerCase()
      ) {
        id = value.id
      }
    })

    return id
  }

  getItemsByName (itemName) {
    const itemList = []
    this.items.forEach(value => {
      if (value.name === itemName) itemList.push(value)
    })

    return itemList
  }

  /**
   *
   *
   */
  getSkillsByName (skillName) {
    // TODO : more aggressive finding including specs
    const skillList = []
    const name = skillName.match(/\(([^)]+)\)/)
      ? skillName.match(/\(([^)]+)\)/)[1]
      : skillName

    this.items.forEach(value => {
      if (
        CoC7Item.getNameWithoutSpec(value).toLowerCase() ===
          name.toLowerCase() &&
        value.type === 'skill'
      ) {
        skillList.push(value)
      }
    })
    return skillList
  }

  parseFormula (formula) {
    let parsedFormula = formula
    for (const [key, value] of Object.entries(COC7.formula.actor)) {
      parsedFormula = parsedFormula.replace(key, value)
    }
    return parsedFormula
  }

  parseCharacteristics () {
    const parsed = {}
    for (const [key, value] of Object.entries(COC7.formula.actor)) {
      if (key.startsWith('@') && value.startsWith('this.')) {
        parsed[key.substring(1)] = getProperty(this, value.substring(5))
      }
    }
    return parsed
  }

  static getCharacteristicDefinition () {
    const characteristics = []
    for (const [key, value] of Object.entries(
      game.system.template.Actor.templates.characteristics.characteristics
    )) {
      characteristics.push({
        key: key,
        shortName: game.i18n.localize(value.short),
        label: game.i18n.localize(value.label)
      })
    }
    return characteristics
  }

  getCharacteristic (charName) {
    if (this.data.data.characteristics) {
      for (const [key, value] of Object.entries(
        this.data.data.characteristics
      )) {
        if (
          game.i18n.localize(value.short).toLowerCase() ===
            charName.toLowerCase() ||
          game.i18n.localize(value.label).toLowerCase() ===
            charName.toLowerCase() ||
          key === charName.toLowerCase()
        ) {
          return {
            key: key,
            shortName: game.i18n.localize(value.short),
            label: game.i18n.localize(value.label),
            value: value.value
          }
        }
      }
    }
    return null
  }

  getAttribute (attribName) {
    if (
      ['lck', 'luck', game.i18n.localize('CoC7.Luck').toLowerCase()].includes(
        attribName.toLowerCase()
      )
    ) {
      return {
        key: 'lck',
        shortName: 'luck',
        label: game.i18n.localize('CoC7.Luck'),
        value: this.data.data.attribs.lck.value
      }
    }
    if (
      [
        'san',
        game.i18n.localize('CoC7.SAN').toLowerCase(),
        game.i18n.localize('CoC7.Sanity').toLowerCase()
      ].includes(attribName.toLowerCase())
    ) {
      return {
        key: 'san',
        shortName: game.i18n.localize('CoC7.SAN'),
        label: game.i18n.localize('CoC7.Sanity'),
        value: this.data.data.attribs.san.value
      }
    }
    return null
  }

  get occupation () {
    const occupation = this.items.filter(item => item.type === 'occupation')
    return occupation[0]
  }

  get archetype () {
    const archetype = this.items.filter(item => item.type === 'archetype')
    return archetype[0]
  }

  async resetOccupation (eraseOld = true) {
    if (eraseOld) {
      const occupationSkill = this.items.filter(item =>
        item.getItemFlag('occupation')
      )
      for (let index = 0; index < occupationSkill.length; index++) {
        await occupationSkill[index].unsetItemFlag('occupation')
      }
    }
    if (this.occupation) await this.occupation.delete()
    await this.update({ 'data.development.occupation': null })
  }

  async resetArchetype (eraseOld = true) {
    if (eraseOld) {
      const archetypeSkill = this.items.filter(item =>
        item.getItemFlag('archetype')
      )
      for (let index = 0; index < archetypeSkill.length; index++) {
        await archetypeSkill[index].unsetItemFlag('archetype')
      }
    }
    if (this.archetype) await this.archetype.delete()
    await this.update({ 'data.development.archetype': null })
  }

  get luck () {
    return parseInt(this.data.data.attribs?.lck?.value)
  }

  async setLuck (value) {
    return await this.update({ 'data.attribs.lck.value': value })
  }

  async spendLuck (amount) {
    amount = parseInt(amount)
    if (!(this.luck >= amount)) return false
    return this.setLuck(this.luck - amount)
  }

  get hp () {
    if (['vehicle'].includes(this.data.type)) {
      if (
        this.data.data.attribs.build.current === null ||
        undefined === this.data.data.attribs.build.current ||
        this.data.data.attribs.build.current === ''
      ) {
        return this.build
      }
      if (
        this.data.data.attribs.build.current >
        this.data.data.attribs.build.value
      ) {
        return this.build
      }
      const hp = parseInt(this.data.data.attribs.build.current)
      return isNaN(hp) ? null : hp
    }
    return parseInt(this.data.data.attribs.hp.value)
  }

  get hpMax () {
    if (['vehicle'].includes(this.data.type)) return this.build
    if (this.data.data.attribs.hp.auto) {
      if (
        this.data.data.characteristics.siz.value != null &&
        this.data.data.characteristics.con.value != null
      ) {
        const maxHP = Math.floor(
          (this.data.data.characteristics.siz.value +
            this.data.data.characteristics.con.value) /
            10
        )
        return game.settings.get('CoC7', 'pulpRules') &&
          this.data.type === 'character'
          ? maxHP * 2
          : maxHP
      }
      if (this.data.data.attribs.hp.max) {
        return parseInt(this.data.data.attribs.hp.max)
      }
      return null
    }
    return parseInt(this.data.data.attribs.hp.max)
  }

  async setHp (value) {
    if (value < 0) value = 0
    if (['vehicle'].includes(this.data.type)) {
      if (value > this.build) value = parseInt(this.build)
      return await this.update({ 'data.attribs.build.current': value })
    }
    if (value > this.hpMax) value = parseInt(this.hpMax)
    return await this.update({ 'data.attribs.hp.value': value })
  }

  async addUniqueItems (skillList, flag = null) {
    for (const skill of skillList) {
      if (CoC7Item.isAnySpec(skill)) {
        if (!skill.data.flags) skill.data.flags = {}
        if (flag) skill.data.flags[flag] = true
        /** MODIF 0.8.x **/
        // await this.createOwnedItem( skill, {renderSheet:false});
        await this.createEmbeddedDocuments('Item', [skill], {
          renderSheet: false
        })
        /*****************/
      } else {
        const itemId = this.getItemIdByName(skill.name)
        if (!itemId) {
          if (flag) {
            if (!skill.data.flags) skill.data.flags = {}
            skill.data.flags[flag] = true
          }
          /** MODIF 0.8.x **/
          // await this.createOwnedItem( skill, {renderSheet:false});
          await this.createEmbeddedDocuments('Item', [skill], {
            renderSheet: false
          })
          /*****************/
        } else if (flag) {
          const item = this.items.get(itemId)
          await item.setItemFlag(flag)
        }
      }
    }
  }

  async addItems (itemList, flag = null) {
    const output = []
    for (const item of itemList) {
      if (flag) {
        if (!item.data.flags) item.data.flags = {}
        item.data.flags[flag] = true
      }
      /** MODIF 0.8.x **/
      // await this.createOwnedItem( item, {renderSheet:false});
      output.push(
        await this.createEmbeddedDocuments('Item', [item], {
          renderSheet: false
        })
      )
      /*****************/
    }
    return output
  }

  async addUniqueItem (skill, flag = null) {
    const itemId = this.getItemIdByName(skill.name)
    if (!itemId) {
      if (flag) {
        if (!skill.data.flags) skill.data.flags = {}
        skill.data.flags[flag] = true
      }
      /** MODIF 0.8.x **/
      // await this.createOwnedItem( skill, {renderSheet:false});
      await this.createEmbeddedDocuments('Item', [skill], {
        renderSheet: false
      })
      /*****************/
    } else if (flag) {
      const item = this.items.get(itemId)
      await item.setItemFlag(flag)
    }
  }

  get mpMax () {
    if (this.data.data.attribs.mp.auto) {
      if (this.data.data.characteristics.pow.value != null) {
        return Math.floor(this.data.data.characteristics.pow.value / 5)
      } else return null
    }
    return parseInt(this.data.data.attribs.mp.max)
  }

  encounteredCreaturesSanData (creature) {
    const i = this.encounteredCreaturesSanDataIndex(creature)
    if (i !== -1) return this.data.data.encounteredCreatures[i]
    return null
  }

  encounteredCreaturesSanDataIndex (creature) {
    const sanData = CoC7Utilities.getCreatureSanData(creature)
    return this.data.data.encounteredCreatures.findIndex(cd => {
      return (
        cd.id === sanData?.id ||
        cd.name.toLowerCase() === sanData.name?.toLocaleLowerCase()
      )
    })
  }

  sanLostToCreature (creature) {
    const sanData = this.encounteredCreaturesSanData(creature)
    if (sanData) {
      // check for if specie already encountered return max of both;
      if (sanData.specie) {
        return Math.max(sanData.specie.totalLoss || 0, sanData.totalLoss)
      }

      return sanData.totalLoss || 0
    } else {
      // That creature was never encountered. What about his specie.
      const creatureSanData = CoC7Utilities.getCreatureSanData(creature)
      if (creatureSanData.specie) {
        const specieEncountered = this.encounteredCreaturesSanData(
          creatureSanData.specie
        )
        if (specieEncountered) return specieEncountered.totalLoss
      }
      return 0 // Never encountered that specie or this creature.
    }
  }

  maxPossibleSanLossToCreature (creature) {
    // Do we know you ?
    const sanData = this.encounteredCreaturesSanData(creature)
    const creatureSanData = CoC7Utilities.getCreatureSanData(creature)

    if (sanData) {
      // Was there any update to that creature ?
      let changes = false
      if (creatureSanData.sanLossMax !== sanData.sanLossMax) {
        sanData.sanLossMax = creatureSanData.sanLossMax
        changes = true
      }
      if (creatureSanData.specie && !sanData.specie) {
        sanData.specie = creatureSanData.specie
        changes = true
      }
      if (
        creatureSanData.specie &&
        creatureSanData.specie.sanLossMax !== sanData.specie.sanLossMax
      ) {
        sanData.specie.sanLossMax = creatureSanData.specie.sanLossMax
        changes = true
      }
      if (sanData.totalLoss > sanData.sanLossMax) {
        sanData.totalLoss = sanData.sanLossMax
        changes = true
      }
      if (
        sanData.specie &&
        sanData.specie.totalLoss > sanData.specie.sanLossMax
      ) {
        sanData.specie.totalLoss = sanData.specie.sanLossMax
        changes = true
      }

      if (changes) {
        const encounteredCreaturesList = this.data.data.encounteredCreatures
          ? duplicate(this.data.data.encounteredCreatures)
          : []
        const sanDataIndex = this.encounteredCreaturesSanDataIndex(creature)
        encounteredCreaturesList[sanDataIndex] = sanData
        if (sanData.specie) {
          this._updateAllOfSameSpecie(encounteredCreaturesList, sanData.specie)
        }

        this.update({
          'data.encounteredCreatures': encounteredCreaturesList
        })
      }

      return sanData.sanLossMax - sanData.totalLoss
    }
    // We don't know you.
    if (creatureSanData) {
      const sanLostToCreature = this.sanLostToCreature(creature)
      return Math.max(0, creatureSanData.sanLossMax - sanLostToCreature)
    }
    return 99
  }

  creatureEncountered (creature) {
    return !!~this.encounteredCreaturesSanDataIndex(creature)
  }

  creatureSpecieEncountered (creature) {
    const creatureSanData = CoC7Utilities.getCreatureSanData(creature)
    if (creatureSanData.specie) {
      return !!~this.encounteredCreaturesSanDataIndex(creatureSanData.specie)
    }
    return this.creatureEncountered(creature)
  }

  _updateAllOfSameSpecie (encounteredCreaturesList, specieSanData) {
    for (let index = 0; index < encounteredCreaturesList.length; index++) {
      if (
        encounteredCreaturesList[index].specie?.id === specieSanData.id ||
        encounteredCreaturesList[index].specie?.name.toLowerCase() ===
          specieSanData.name?.toLowerCase()
      ) {
        // New encounter with that specie.
        if (
          encounteredCreaturesList[index].specie.totalLoss !==
          specieSanData.totalLoss
        ) {
          const delta =
            specieSanData.totalLoss -
            encounteredCreaturesList[index].specie.totalLoss
          if (delta > 0) {
            encounteredCreaturesList[index].specie = specieSanData
            encounteredCreaturesList[index].totalLoss += delta
            encounteredCreaturesList[index].totalLoss = Math.min(
              encounteredCreaturesList[index].totalLoss,
              encounteredCreaturesList[index].sanLossMax
            )
          }
        }
      }
    }
  }

  _removeSpecie (encounteredCreaturesList, specieSanData) {
    for (let index = 0; index < encounteredCreaturesList.length; index++) {
      if (
        encounteredCreaturesList[index].specie?.id === specieSanData.id ||
        encounteredCreaturesList[index].specie?.name.toLowerCase() ===
          specieSanData.name?.toLowerCase()
      ) {
        const previousSpecieLost =
          encounteredCreaturesList[index].specie.totalLoss
        delete encounteredCreaturesList[index].specie

        encounteredCreaturesList[index].totalLoss =
          encounteredCreaturesList[index].totalLoss - previousSpecieLost
        if (encounteredCreaturesList[index].totalLoss < 0) {
          encounteredCreaturesList[index].totalLoss = 0
        }
      }
    }
  }

  async resetCreature (creature) {
    const indexSanData = this.encounteredCreaturesSanDataIndex(creature)
    if (~indexSanData) {
      const creatureSanData = CoC7Utilities.getCreatureSanData(creature)
      const encounteredCreaturesList = this.data.data.encounteredCreatures
        ? duplicate(this.data.data.encounteredCreatures)
        : []
      encounteredCreaturesList.splice(indexSanData, 1)
      creatureSanData.totalLoss = 0
      if (creatureSanData.specie) delete creatureSanData.specie
      this._updateAllOfSameSpecie(encounteredCreaturesList, creatureSanData)
      await this.update({
        'data.encounteredCreatures': encounteredCreaturesList
      })
    }
  }

  async resetSpecie (creature) {
    const encounteredCreaturesList = this.data.data.encounteredCreatures
      ? duplicate(this.data.data.encounteredCreatures)
      : []
    const creatureSanData = CoC7Utilities.getCreatureSanData(creature)
    if (!creatureSanData.specie) return
    const indexSanData = this.encounteredCreaturesSanDataIndex(
      creatureSanData.specie
    )
    if (~indexSanData) {
      encounteredCreaturesList.splice(indexSanData, 1)
    }
    this._removeSpecie(encounteredCreaturesList, creatureSanData.specie)
    await this.update({
      'data.encounteredCreatures': encounteredCreaturesList
    })

    return false
  }

  async looseSanToCreature (sanLoss, creature) {
    let exactSanLoss = sanLoss
    // Get that creature SAN data.
    const creatureSanData = CoC7Utilities.getCreatureSanData(creature)

    // Get actor SAN data for that creature.
    const indexSanData = this.encounteredCreaturesSanDataIndex(creature)

    // Check if that creature belongs to a specie and have we already encoutered it.
    let indexSpeciesSanData = -1
    if (creatureSanData.specie?.id) {
      indexSpeciesSanData = this.encounteredCreaturesSanDataIndex(
        creatureSanData.specie.id
      )
    }
    if (indexSpeciesSanData === -1 && creatureSanData.specie?.name) {
      indexSpeciesSanData = this.encounteredCreaturesSanDataIndex(
        creatureSanData.specie.name
      )
    }

    // Copy the array for updating.
    const encounteredCreaturesList = this.data.data.encounteredCreatures
      ? duplicate(this.data.data.encounteredCreatures)
      : []

    // Creature already encountered.
    if (~indexSanData) {
      const oldSanData = encounteredCreaturesList[indexSanData]
      let newSanData
      // Update sanData with new SAN data (might have been updated ?)
      if (creatureSanData) {
        newSanData = creatureSanData
        newSanData.totalLoss = oldSanData.totalLoss || 0
        if (newSanData.specie) {
          newSanData.specie.totalLoss = oldSanData.specie?.totalLoss
            ? oldSanData.specie.totalLoss
            : 0
        } else {
          if (oldSanData.specie) newSanData.specie = oldSanData.specie // Should never happen
        }
      }

      newSanData.totalLoss = newSanData.totalLoss
        ? newSanData.totalLoss + sanLoss
        : sanLoss
      if (newSanData.totalLoss > newSanData.sanLossMax) {
        exactSanLoss =
          exactSanLoss - (newSanData.totalLoss - newSanData.sanLossMax)
        newSanData.totalLoss = newSanData.sanLossMax
      }

      // Credit the loss to that creature specie as well if it exists.
      if (newSanData.specie) {
        newSanData.specie.totalLoss = newSanData.specie.totalLoss
          ? newSanData.specie.totalLoss + exactSanLoss
          : exactSanLoss
        if (newSanData.specie.totalLoss > newSanData.specie.sanLossMax) {
          newSanData.specie.totalLoss = newSanData.specie.sanLossMax
        }

        // Update all creture from the same specie.
        this._updateAllOfSameSpecie(encounteredCreaturesList, newSanData.specie)
      }

      encounteredCreaturesList[indexSanData] = newSanData
      // Update the specie also :
      if (~indexSpeciesSanData && newSanData.specie) {
        encounteredCreaturesList[indexSpeciesSanData] = newSanData.specie
      } else {
        // We already encoutered that specie
        // Should never happen (encountered that creature but never his specie).
        if (newSanData.specie) encounteredCreaturesList.push(newSanData.specie)
      }
    } else {
      // Creature never encountered.
      const newSanData = creatureSanData
      newSanData.totalLoss = 0

      if (newSanData.specie) {
        // Specie already encountered.
        if (~indexSpeciesSanData) {
          newSanData.specie.totalLoss =
            encounteredCreaturesList[indexSpeciesSanData].totalLoss

          // We already loss SAN to this specie of creature. The base los for this creature is the specie base loss.
          newSanData.totalLoss = newSanData.specie.totalLoss
          if (newSanData.totalLoss > newSanData.sanLossMax) {
            newSanData.totalLoss = newSanData.sanLossMax
          }
        } else {
          // We never encountered specie or creature.
          newSanData.specie.totalLoss = 0
          newSanData.totalLoss = 0
        }
      }

      // Apply the san loss to that creature.
      newSanData.totalLoss = newSanData.totalLoss + sanLoss

      // If loss is more thant creature Max.
      if (newSanData.totalLoss > newSanData.sanLossMax) {
        // Get the exact san loss = loss - (overflow - max)
        exactSanLoss =
          exactSanLoss - (newSanData.totalLoss - newSanData.sanLossMax)
        newSanData.totalLoss = newSanData.sanLossMax
      }

      // Deduct the exact loss to that specie.
      if (newSanData.specie) {
        // Wait for exact san LOSS before deduciting it from specie.
        newSanData.specie.totalLoss = newSanData.specie.totalLoss + exactSanLoss
        if (newSanData.specie.totalLoss > newSanData.specie.sanLossMax) {
          newSanData.specie.totalLoss = newSanData.specie.sanLossMax
        }

        // If we now that specie update it. If we don't add it.
        if (~indexSpeciesSanData) {
          encounteredCreaturesList[indexSpeciesSanData] = newSanData.specie
        } else {
          encounteredCreaturesList.push(newSanData.specie)
        }

        // Update all creature from the same specie.
        this._updateAllOfSameSpecie(encounteredCreaturesList, newSanData.specie)
      }

      encounteredCreaturesList.push(newSanData)
    }

    await this.setSan(this.san - exactSanLoss)
    await this.update({
      'data.encounteredCreatures': encounteredCreaturesList
    })
    return exactSanLoss
  }

  async looseSan (sanLoss, creature = null) {
    if (creature) await this.looseSanToCreature(sanLoss, creature)
    else await this.setSan(this.san - sanLoss)
  }

  get sanData () {
    return CoC7Utilities.getCreatureSanData(this)
  }

  sanLoss (checkPassed) {
    if (checkPassed) return this.sanLossCheckPassed
    return this.sanLossCheckFailled
  }

  get sanLossCheckPassed () {
    return this.data.data.special?.sanLoss?.checkPassed
  }

  get sanLossCheckFailled () {
    return this.data.data.special?.sanLoss?.checkFailled
  }

  get sanLossMax () {
    if (this.sanLossCheckFailled) {
      if (!isNaN(Number(this.sanLossCheckFailled))) {
        return Number(this.sanLossCheckFailled)
      }
      return new Roll(this.sanLossCheckFailled).evaluate({
        maximize: true
      }).total
    }
    return 0
  }

  get sanLossMin () {
    if (this.sanLossCheckPassed) {
      if (!isNaN(Number(this.sanLossCheckPassed))) {
        return Number(this.sanLossCheckPassed)
      }
      return new Roll(this.sanLossCheckPassed).evaluate({
        maximize: true
      }).total
    }
    return 0
  }

  get dailySanLoss () {
    return this.data.data.attribs.san?.dailyLoss || 0
  }

  get sanMax () {
    if (!this.data.data.attribs) return undefined
    if (this.data.data.attribs?.san?.auto) {
      if (this.cthulhuMythos) return Math.max(99 - this.cthulhuMythos, 0)
      return 99
    }
    return parseInt(this.data.data.attribs.san.max)
  }

  get mp () {
    return parseInt(this.data.data.attribs.mp.value)
  }

  async setMp (value) {
    if (value < 0) value = 0
    if (value > parseInt(this.mpMax)) value = parseInt(this.mpMax)
    return await this.update({ 'data.attribs.mp.value': value })
  }

  get san () {
    return parseInt(this.data.data.attribs.san.value)
  }

  get int () {
    return this.getCharacteristic('int')
  }

  get occupationPointsSpent () {
    let occupationPoints = 0
    for (const skill of this.skills) {
      if (skill.data.data.adjustments?.occupation) {
        occupationPoints += skill.data.data.adjustments.occupation
      }
    }
    return occupationPoints
  }

  get occupationPoints () {
    if (!this.occupation) return 0
    let points = 0
    Object.entries(this.occupation.data.data.occupationSkillPoints).forEach(
      entry => {
        const [key, value] = entry
        const char = this.getCharacteristic(key)
        if (value.selected) {
          points += char.value * Number(value.multiplier)
        }
      }
    )
    return points
  }

  async resetOccupationPoints () {
    await this.update({
      'data.development.occupation': this.occupationPoints
    })
  }

  async resetArchetypePoints () {
    await this.update({
      'data.development.archetype': this.occupationPoints
    })
  }

  async resetPersonalPoints () {
    await this.update({
      'data.development.personal': this.personalPoints
    })
  }

  get archetypePointsSpent () {
    let archetypePoints = 0
    for (const skill of this.skills) {
      if (skill.data.data.adjustments?.archetype) {
        archetypePoints += skill.data.data.adjustments.archetype
      }
    }
    return archetypePoints
  }

  get archetypePoints () {
    if (!this.archetype) return 0
    return this.archetype.data.data.bonusPoints
  }

  get experiencePoints () {
    let experiencePoints = 0
    for (const skill of this.skills) {
      if (skill.data.data.adjustments?.experience) {
        experiencePoints += skill.data.data.adjustments.experience
      }
    }
    return experiencePoints
  }

  get personalPointsSpent () {
    let personalPoints = 0
    for (const skill of this.skills) {
      if (skill.data.data.adjustments?.personal) {
        personalPoints += skill.data.data.adjustments.personal
      }
    }
    return personalPoints
  }

  get personalPoints () {
    return 2 * Number(this.data.data.characteristics.int.value)
  }

  get hasSkillFlaggedForExp () {
    for (const skill of this.skills) {
      if (skill.data.data.flags?.developement) return true
    }
    return false
  }

  async setSan (value) {
    if (value < 0) value = 0
    if (value > this.sanMax) value = this.sanMax
    const loss = parseInt(this.data.data.attribs.san.value) - value
    // if( creatureData){
    //  const creatureIndex = this.data.data.encounteredCreatures.findIndex( c => {
    //    if( c.id && c.id == creatureData.id) return true;
    //    if( c.name && c.name.toLowerCase() == creatureData.name?.toLowerCase()) return true;
    //    return false;});
    //  let encounteredCreaturesList;
    //  if( -1 < creatureIndex){
    //    encounteredCreaturesList = this.data.data.encounteredCreatures ? duplicate( this.data.data.encounteredCreatures) : [];
    //    const maxLossRemaining = encounteredCreaturesList[creatureIndex].maxLoss - encounteredCreaturesList[creatureIndex].totalLoss;
    //    if( loss > maxLossRemaining) loss = maxLossRemaining;
    //    encounteredCreaturesList[creatureIndex].totalLoss += loss;
    //  } else {
    //    if( loss > createData.maxLoss) loss = createData.maxLoss;
    //    encounteredCreaturesList = [{
    //        id: creatureData.id,
    //        name: creatureData.name,
    //        maxLoss: createData.maxLoss,
    //        totalLoss: loss
    //      }];
    //  }

    //  await this.item.update( { ['data.encounteredCreatures'] : encounteredCreaturesList});
    // }

    if (loss > 0) {
      let totalLoss = parseInt(this.data.data.attribs.san.dailyLoss)
        ? parseInt(this.data.data.attribs.san.dailyLoss)
        : 0
      totalLoss = totalLoss + loss
      if (loss >= 5) this.setStatus(COC7.status.tempoInsane)
      if (totalLoss >= Math.floor(this.san / 5)) {
        this.setStatus(COC7.status.indefInsane)
      }
      return await this.update({
        'data.attribs.san.value': value,
        'data.attribs.san.dailyLoss': totalLoss
      })
    } else return await this.update({ 'data.attribs.san.value': value })
  }

  async setAttribAuto (value, attrib) {
    const updatedKey = `data.attribs.${attrib}.auto`
    return await this.update({ [updatedKey]: value })
  }

  async toggleAttribAuto (attrib) {
    this.setAttribAuto(!this.data.data.attribs[attrib].auto, attrib)
  }

  get build () {
    if (['vehicle'].includes(this.data.type)) {
      const build = parseInt(this.data.data.attribs.build.value)
      return isNaN(build) ? null : build
    }
    if (!this.data.data.attribs) return null
    if (!this.data.data.attribs.build) return null
    if (this.data.data.attribs.build.value === 'auto') {
      this.data.data.attribs.build.auto = true
    }
    if (this.data.data.attribs.build.auto) {
      const sum =
        this.data.data.characteristics.str.value +
        this.data.data.characteristics.siz.value
      if (sum > 164) return Math.floor((sum - 45) / 80) + 1
      if (sum < 65) return -2
      if (sum < 85) return -1
      if (sum < 125) return 0
      if (sum < 165) return 1
    }

    return this.data.data.attribs.build.value
  }

  get db () {
    if (['vehicle'].includes(this.data.type)) return 0
    if (!this.data.data.attribs) return null
    if (!this.data.data.attribs.db) return null
    if (this.data.data.attribs.db.value === 'auto') {
      this.data.data.attribs.db.auto = true
    }
    if (this.data.data.attribs.db.auto) {
      const sum =
        this.data.data.characteristics.str.value +
        this.data.data.characteristics.siz.value
      if (sum > 164) return `${Math.floor((sum - 45) / 80)}D6`
      if (sum < 65) return -2
      if (sum < 85) return -1
      if (sum < 125) return 0
      if (sum < 165) return '1D4'
    }
    return this.data.data.attribs.db.value
  }

  get mov () {
    if (['vehicle'].includes(this.data.type)) {
      return this.data.data.attribs.mov.value
    }
    if (!this.data.data.attribs) return null
    if (!this.data.data.attribs.mov) return null
    if (this.data.data.attribs.mov.value === 'auto') {
      this.data.data.attribs.mov.auto = true
    }
    if (this.data.data.attribs.mov.auto) {
      let MOV
      if (
        this.data.data.characteristics.dex.value >
          this.data.data.characteristics.siz.value &&
        this.data.data.characteristics.str.value >
          this.data.data.characteristics.siz.value
      ) {
        MOV = 9 // Bug correction by AdmiralNyar.
      } else if (
        this.data.data.characteristics.dex.value >=
          this.data.data.characteristics.siz.value ||
        this.data.data.characteristics.str.value >=
          this.data.data.characteristics.siz.value
      ) {
        MOV = 8
      } else {
        MOV = 7
      }
      if (this.data.data.type !== 'creature') {
        if (!isNaN(parseInt(this.data.data.infos.age))) {
          MOV =
            parseInt(this.data.data.infos.age) >= 40
              ? MOV - Math.floor(parseInt(this.data.data.infos.age) / 10) + 3
              : MOV
        }
      }
      if (MOV > 0) return MOV
    }
    return this.data.data.attribs.mov.value
  }

  get tokenId () {
    // TODO clarifier ca et tokenkey
    return this.token ? `${this.token.scene._id}.${this.token.id}` : null // REFACTORING (2)
  }

  get locked () {
    if (!this.data.data.flags) {
      this.data.data.flags = {}
      this.data.data.flags.locked = true // Locked by default
      this.update({ 'data.flags': {} })
      this.update({ 'data.flags.locked': false })
    }

    return this.data.data.flags.locked
  }

  getItemsFromName (name) {
    return this.items.filter(i => i.name === name)
  }

  set locked (value) {
    this.update({ 'data.flags.locked': value })
  }

  async toggleActorFlag (flagName) {
    const flagValue = !this.data.data.flags[flagName]
    const name = `data.flags.${flagName}`
    await this.update({ [name]: flagValue })
  }

  /**
   *
   * @param {*} attributeName key of attribute to check in ['lck']
   * @param {*} fastForward
   * @param {*} options difficulty in CoC7Check.difficultyLevel, modifier (-2 +2), name
   */
  async attributeCheck (attributeName, fastForward = false, options = {}) {
    const attrib = this.getAttribute(attributeName.toLowerCase())
    if (!attrib) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorNotFound', {
          missing: attributeName
        })
      )
      return null
    }

    const check = new CoC7Check()

    if (options.modifier) check.diceModifier = Number(options.modifier)
    if (options.difficulty) {
      check.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }

    if (!fastForward) {
      if (undefined === options.difficulty || undefined === options.modifier) {
        const usage = await RollDialog.create(options)
        if (usage) {
          check.diceModifier = Number(usage.get('bonusDice'))
          check.difficulty = Number(usage.get('difficulty'))
          check.flatDiceModifier = Number(usage.get('flatDiceModifier'))
          check.flatThresholdModifier = Number(
            usage.get('flatThresholdModifier')
          )
        }
      }
    }

    check.actor = this.tokenKey
    if (options.blind === 'false') check.isBlind = false
    else check.isBlind = !!options.blind
    await check.rollAttribute(attrib.key)
    check.toMessage()
  }

  /**
   *
   * @param {*} characteristicName key of characteristic to check in ['str','con','siz','dex','app','int','pow','edu']
   * @param {*} fastForward
   * @param {*} options difficulty in CoC7Check.difficultyLevel, modifier (-2 +2), name
   */
  async characteristicCheck (
    characteristicName,
    fastForward = false,
    options = {}
  ) {
    const char = this.getCharacteristic(characteristicName)

    if (!char) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorNotFoundForActor', {
          missing: characteristicName,
          actor: this.name
        })
      )
      return
    }

    const check = new CoC7Check()

    if (options.modifier) check.diceModifier = Number(options.modifier)
    if (options.difficulty) {
      check.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }

    if (!fastForward) {
      if (undefined === options.difficulty || undefined === options.modifier) {
        options.displayName = char.label
        const usage = await RollDialog.create(options)
        if (usage) {
          check.diceModifier = Number(usage.get('bonusDice'))
          check.difficulty = Number(usage.get('difficulty'))
          check.flatDiceModifier = Number(usage.get('flatDiceModifier'))
          check.flatThresholdModifier = Number(
            usage.get('flatThresholdModifier')
          )
        }
      }
    }

    check.actor = this.tokenKey
    if (options.blind === 'false') check.isBlind = false
    else check.isBlind = !!options.blind
    await check.rollCharacteristic(char.key)
    check.toMessage()
  }

  async skillCheck (skillData, fastForward, options = {}) {
    let skill = this.getSkillsByName(
      skillData.name ? skillData.name : skillData
    )
    if (!skill.length) {
      let item = null
      if (skillData.pack) {
        const pack = game.packs.get(skillData.pack)
        if (pack.metadata.entity !== 'Item') return
        item = await pack.getDocument(skillData.id)
      } else if (skillData.id) {
        item = game.items.get(skillData.id)
      }

      // No skill found, try to get get it from compendium !
      if (!item) {
        // TODO: Implement retrieval of skill from compendium !!
        // game.settings.get( 'CoC7', 'DefaultCompendium');
        const check = new CoC7Check()
        check._rawValue = '?'
        await check.roll()
        check.toMessage()
      }
      if (!item) {
        return ui.notifications.warn(
          game.i18n.format('CoC7.NoSkill') +
            game.i18n.format('CoC7.ErrorNotFoundForActor', {
              missing: skillData.name ? skillData.name : skillData,
              actor: this.name
            })
        )
      }

      let create = false
      await Dialog.confirm({
        title: `${game.i18n.localize('CoC7.AddWeapon')}`,
        content: `<p>${game.i18n.format('CoC7.AddWeapontHint', {
          weapon: skillData.name,
          actor: this.name
        })}</p>`,
        yes: () => {
          create = true
        }
      })

      if (create === true) {
        await this.createEmbeddedDocuments('Item', [duplicate(item)])
      } else return

      skill = this.getSkillsByName(item.name)

      if (!skill.length) return

      if (game.user.isGM) {
        const skillValue = await SkillValueDialog.create(
          skill[0].name,
          skill[0].base
        )
        const value = Number(skillValue.get('base-value'))
        await skill[0].updateValue(value)
      }
    }

    const check = new CoC7Check()

    if (undefined !== options.modifier) {
      check.diceModifier = Number(options.modifier)
    }
    if (undefined !== options.difficulty) {
      check.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }

    if (!fastForward) {
      if (undefined === options.difficulty || undefined === options.modifier) {
        const usage = await RollDialog.create(options)
        if (usage) {
          check.diceModifier = Number(usage.get('bonusDice'))
          check.difficulty = Number(usage.get('difficulty'))
          check.flatDiceModifier = Number(usage.get('flatDiceModifier'))
          check.flatThresholdModifier = Number(
            usage.get('flatThresholdModifier')
          )
        }
      }
    }

    check.actor = this.tokenKey
    check.skill = skill[0].id
    if (options.blind === 'false') check.isBlind = false
    else check.isBlind = !!options.blind
    await check.roll()
    check.toMessage()
  }

  async weaponCheck (weaponData, fastForward = false) {
    const itemId = weaponData.id
    let weapon
    weapon = this.items.get(itemId)
    if (!weapon) {
      let weapons = this.getItemsFromName(weaponData.name)
      if (weapons.length === 0) {
        if (game.user.isGM) {
          let item = null
          const pack = weaponData.pack ? game.packs.get(weaponData.pack) : null
          if (pack) {
            if (pack.metadata.entity !== 'Item') return
            item = await pack.getDocument(weaponData.id)
          } else if (weaponData.id) {
            item = game.items.get(weaponData.id)
          }

          if (!item) {
            return ui.notifications.warn(
              game.i18n.localize('CoC7.WarnMacroNoItemFound')
            )
          }

          let create = false
          await Dialog.confirm({
            title: `${game.i18n.localize('CoC7.AddWeapon')}`,
            content: `<p>${game.i18n.format('CoC7.AddWeapontHint', {
              weapon: weaponData.name,
              actor: this.name
            })}</p>`,
            yes: () => {
              create = true
            }
          })
          const actor =
            typeof this.parent?.actor !== 'undefined' ? this.parent.actor : this

          if (create === true) {
            await actor.createEmbeddedDocuments('Item', [item.toJSON()])
          } else return
          weapons = actor.getItemsFromName(item.name)
          if (!weapons.length) return
          await weapons[0].reload()
        } else {
          ui.notifications.warn(
            `Actor ${this.name} has no weapon named ${weaponData.name}`
          )
          return
        }
      } else if (weapons.length > 1) {
        ui.notifications.warn(
          `Actor ${this.name} has more than one weapon named ${weaponData.name}. The first found will be used`
        )
      }
      weapon = weapons[0]
    }

    if (!weapon.data.data.properties.rngd) {
      if (game.user.targets.size > 1) {
        ui.notifications.warn(game.i18n.localize('CoC7.WarnTooManyTarget'))
      }

      const card = new CoC7MeleeInitiator(this.tokenKey, weapon.id, fastForward)
      card.createChatCard()
    }
    if (weapon.data.data.properties.rngd) {
      const card = new CoC7RangeInitiator(this.tokenKey, weapon.id, fastForward)
      card.createChatCard()
    }
  }

  async rollInitiative (hasGun = false) {
    switch (game.settings.get('CoC7', 'initiativeRule')) {
      case 'optional': {
        const roll = new CoC7Check(this.actorKey)
        roll.denyPush = true
        roll.denyLuck = true
        roll.denyBlindTampering = true
        roll.hideDice = game.settings.get('CoC7', 'displayInitDices') === false
        roll.flavor = 'Initiative roll'
        await roll.rollCharacteristic('dex', hasGun ? 1 : 0)
        roll.toMessage()
        return (
          roll.successLevel + this.data.data.characteristics.dex.value / 100
        )
      }

      default:
        return hasGun
          ? this.data.data.characteristics.dex.value + 50
          : this.data.data.characteristics.dex.value
    }
  }

  getActorFlag (flagName) {
    if (!this.data.data.flags) {
      this.data.data.flags = {}
      this.data.data.flags.locked = true
      this.update({ 'data.flags': {} })
      return false
    }

    if (!this.data.data.flags[flagName]) return false
    return this.data.data.flags[flagName]
  }

  async setActorFlag (flagName) {
    await this.update({ [`data.flags.${flagName}`]: true })
  }

  async unsetActorFlag (flagName) {
    await this.update({ [`data.flags.${flagName}`]: false })
  }

  getWeaponSkills (itemId) {
    const weapon = this.items.get(itemId)
    if (weapon.data.type !== 'weapon') return null
    const skills = []
    if (weapon.data.data.skill.main.id) {
      skills.push(this.items.get(weapon.data.data.skill.main.id))
    }

    if (weapon.usesAlternativeSkill && weapon.data.data.skill.alternativ.id) {
      skills.push(this.items.get(weapon.data.data.skill.alternativ.id))
    }

    return skills
  }

  /** Try to find a characteristic, attribute or skill that matches the name */
  find (name) {
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
          s.sName.toLocaleLowerCase().replace(/\s/g, '') ===
            name.toLocaleLowerCase().replace(/\s/g, '') ||
          s.sName.toLocaleLowerCase().replace(/\s/g, '') ===
            shortName?.toLocaleLowerCase().replace(/\s/g, ''))
      )
    })
    if (skill.length) return { type: 'item', value: skill[0] }

    // Try to find a characteristic.
    const charKey = ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu']
    for (let i = 0; i < charKey.length; i++) {
      const char = this.getCharacteristic(charKey[i])
      if (char) {
        if (char.key?.toLocaleLowerCase() === name.toLowerCase()) {
          return { type: 'characteristic', value: char }
        }
        if (char.shortName?.toLocaleLowerCase() === name.toLowerCase()) {
          return { type: 'characteristic', value: char }
        }
        if (char.label?.toLocaleLowerCase() === name.toLowerCase()) {
          return { type: 'characteristic', value: char }
        }
      }
    }

    // Try to find a attribute.
    const attribKey = ['lck', 'san']
    for (let i = 0; i < attribKey.length; i++) {
      const attr = this.getAttribute(attribKey[i])
      if (attr) {
        if (attr.key?.toLocaleLowerCase() === name.toLowerCase()) {
          return { type: 'attribute', value: attr }
        }
        if (attr.shortName?.toLocaleLowerCase() === name.toLowerCase()) {
          return { type: 'attribute', value: attr }
        }
        if (attr.label?.toLocaleLowerCase() === name.toLowerCase()) {
          return { type: 'attribute', value: attr }
        }
      }
    }

    // Try with partial ??
    return undefined
  }

  get pilotSkills () {
    return this.skills.filter(s => {
      return (
        !!s.data.data.specialization &&
        s.data.data.specialization.length &&
        s.data.data.specialization?.toLocaleLowerCase() ===
          game.i18n
            .localize('CoC7.PilotSpecializationName')
            ?.toLocaleLowerCase()
      )
    })
  }

  get driveSkills () {
    return this.skills.filter(s => {
      return (
        !!s.data.data.specialization &&
        s.data.data.specialization.length &&
        s.data.data.specialization?.toLocaleLowerCase() ===
          game.i18n
            .localize('CoC7.DriveSpecializationName')
            ?.toLocaleLowerCase()
      )
    })
  }

  get tokenKey () {
    // Clarifier ca et tokenid
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

  get actorKey () {
    if (this.data.token.actorLink) return this.id // REFACTORING (2)
    return this.tokenKey
  }

  static getActorFromKey (key) {
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
   * Use the formula if available to roll some characteritics.
   */
  async rollCharacteristicsValue () {
    const characteristics = {}
    for (const [key, value] of Object.entries(this.data.data.characteristics)) {
      if (value.formula && !value.formula.startsWith('@')) {
        const r = new Roll(value.formula)
        await r.roll({ async: true })
        if (r.total) {
          characteristics[`data.characteristics.${key}.value`] = Math.floor(
            r.total
          )
        }
      }
    }

    await this.update(characteristics)
    await this.reportCharactedriticsValue()
  }

  /**
   * If there is a formula, will set the characteristic to the average value ,if divisible by 5, or the closest 10.
   */
  async averageCharacteristicsValue () {
    const characteristics = {}
    for (const [key, value] of Object.entries(this.data.data.characteristics)) {
      if (value.formula && !value.formula.startsWith('@')) {
        const max = new Roll(value.formula).evaluate({ maximize: true }).total
        const min = new Roll(value.formula).evaluate({ minimize: true }).total
        const average = Math.floor((max + min) / 2)
        const charValue =
          average % 5 === 0 ? average : Math.round(average / 10) * 10
        if (charValue) {
          characteristics[`data.characteristics.${key}.value`] = charValue
        }
      }
    }

    await this.update(characteristics)
    await this.reportCharactedriticsValue()
  }

  /**
   * Test if a characterisitc formula is a reference to an other characteristic and set it accordingly.
   */
  async reportCharactedriticsValue () {
    const characteristics = {}
    for (const [key, value] of Object.entries(this.data.data.characteristics)) {
      if (value.formula && value.formula.startsWith('@')) {
        let charValue
        try {
          charValue = new Roll(
            value.formula,
            this.parseCharacteristics()
          ).evaluate({ maximize: true }).total
        } catch (err) {
          charValue = null
        }
        if (charValue) {
          characteristics[`data.characteristics.${key}.value`] = charValue
        }
      }
    }

    await this.update(characteristics)
  }

  async setCharacteristic (name, value) {
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

  async developementPhase (fastForward = false) {
    const failure = []
    const success = []
    const skillMasteringThreshold = 90
    const alwaysSuccessThreshold = 95

    const title = game.i18n.localize('CoC7.RollAll4Dev')
    let message = '<p class="chat-card">'
    for (const item of this.items) {
      if (item.type === 'skill') {
        if (item.developementFlag) {
          const die = await new Die({ faces: 100 }).evaluate({ async: true })
          const skillValue = item.value
          let augment = null
          let skillMasteringMessage = null
          if (die.total > skillValue || die.total >= alwaysSuccessThreshold) {
            const augmentDie = await new Die({ faces: 10 }).evaluate({
              async: true
            })
            success.push(item.id)
            // Check for SAN augment when the skill goes beyond the skill mastering threshold.
            if (
              skillValue < skillMasteringThreshold &&
              skillValue + augmentDie.total >= skillMasteringThreshold
            ) {
              const augmentSANDie = await new Die({
                faces: 6,
                number: 2
              }).evaluate({ async: true })
              const sanGained = augmentSANDie.total
              const sanGainedMessage = `Gained 2d6 (${augmentSANDie.values[0]} + ${augmentSANDie.values[1]} = ${sanGained}) SAN`
              console.debug(sanGainedMessage)
              skillMasteringMessage = `<span class="upgrade-success">${game.i18n.format(
                'CoC7.SanGained',
                {
                  results: `${augmentSANDie.values[0]} + ${augmentSANDie.values[1]}`,
                  sanGained: sanGained,
                  skill: item.data.name,
                  skillValue: skillValue + augmentDie.total
                }
              )}</span><br>`
              // Set san controls that it doesn't augment beyond sanMax
              await this.setSan(this.san + sanGained)
            }
            augment += augmentDie.total
            message += `<span class="upgrade-success">${game.i18n.format(
              'CoC7.DevSuccess',
              {
                item: item.data.name,
                die: die.total,
                score: item.value,
                augment: augmentDie.total
              }
            )}</span><br>`
            if (skillMasteringMessage !== null) {
              message += skillMasteringMessage
            }
            await item.increaseExperience(augment)
          } else {
            message += `<span class="upgrade-failed">${game.i18n.format(
              'CoC7.DevFailure',
              {
                item: item.data.name,
                die: die.total,
                score: item.value
              }
            )}</span><br>`
            failure.push(item.id)
          }
          await item.unflagForDevelopement()
        }
      }
    }
    if (!fastForward) {
      message += '</p>'
      const speaker = { actor: this.actor }
      await chatHelper.createMessage(title, message, { speaker: speaker })
    }
    return { failure: failure, success: success }
  }

  async developLuck (fastForward = false) {
    const luck = this.data.data.attribs.lck
    const upgradeRoll = new Roll('1D100')
    const title = game.i18n.localize('CoC7.RollLuck4Dev')
    let message = '<p class="chat-card">'
    await upgradeRoll.roll({ async: true })
    if (!fastForward) await CoC7Dice.showRollDice3d(upgradeRoll)
    if (upgradeRoll.total > luck.value) {
      const augmentRoll = new Roll('1D10')
      await augmentRoll.roll({ async: true })
      if (!fastForward) await CoC7Dice.showRollDice3d(augmentRoll)
      if (luck.value + augmentRoll.total <= 99) {
        await this.update({
          'data.attribs.lck.value':
            this.data.data.attribs.lck.value + augmentRoll.total
        })
        message += `<span class="upgrade-success">${game.i18n.format(
          'CoC7.LuckIncreased',
          {
            die: upgradeRoll.total,
            score: luck.value,
            augment: augmentRoll.total
          }
        )}</span>`
      } else {
        let correctedValue
        for (let i = 1; i <= 10; i++) {
          if (luck.value + augmentRoll.total - i <= 99) {
            correctedValue = augmentRoll.total - i
            break
          }
        }
        await this.update({
          'data.attribs.lck.value':
            this.data.data.attribs.lck.value + correctedValue
        })
        message += `<span class="upgrade-success">${game.i18n.format(
          'CoC7.LuckIncreased',
          {
            die: upgradeRoll.total,
            score: luck.value,
            augment: correctedValue
          }
        )}</span>`
      }
    } else {
      message += `<span class="upgrade-failed">${game.i18n.format(
        'CoC7.LuckNotIncreased',
        { die: upgradeRoll.total, score: luck.value }
      )}</span>`
    }
    if (!fastForward) {
      message += '</p>'
      const speaker = { actor: this.actor }
      await chatHelper.createMessage(title, message, { speaker: speaker })
    }
  }

  async developSkill (skillId, fastForward = false) {
    const skill = this.items.get(skillId)
    if (!skill) return
    let title = ''
    let message = ''
    const upgradeRoll = new Roll('1D100')
    await upgradeRoll.roll({ async: true })
    if (!fastForward) await CoC7Dice.showRollDice3d(upgradeRoll)
    if (upgradeRoll.total > skill.value || upgradeRoll.total >= 95) {
      const augmentRoll = new Roll('1D10')
      await augmentRoll.roll({ async: true })
      if (!fastForward) await CoC7Dice.showRollDice3d(augmentRoll)
      message = game.i18n.format('CoC7.DevSuccessDetails', {
        item: skill.name,
        augment: augmentRoll.total
      })
      title = game.i18n.format('CoC7.DevRollTitle', {
        item: skill.name,
        die: upgradeRoll.total,
        score: skill.value
      })
      await skill.increaseExperience(augmentRoll.total)
    } else {
      title = game.i18n.format('CoC7.DevRollTitle', {
        item: skill.name,
        die: upgradeRoll.total,
        score: skill.value
      })
      message = game.i18n.format('CoC7.DevFailureDetails', {
        item: skill.name
      })
    }
    const speaker = { actor: this._id }
    await chatHelper.createMessage(title, message, { speaker: speaker })
    await skill.unflagForDevelopement()
  }

  async toggleStatus (statusName) {
    let statusValue = this.data.data.status[statusName]?.value
    if (!(typeof statusValue === 'boolean')) {
      statusValue = statusValue === 'false' // Necessary, incorrect template initialization
    }
    if (COC7.status.criticalWounds === statusName) {
      if (statusValue) await this.cureMajorWound()
      else await this.inflictMajorWound()
      return
    }
    // await this.update({ [`data.status.${statusName}.value`]: !statusValue })
    let effectEffect
    switch (statusName) {
      case 'dead':
        if (statusValue) {
          await this.unsetStatus('dead')
          effectEffect = await this.hasActiveEffect('dead')
          if (effectEffect.length > 0) {
            effectEffect.forEach(effect => effect.delete())
          }
        } else this.fallDead()
        break
      case 'dying':
        if (statusValue) {
          await this.unsetStatus('dying')
          effectEffect = await this.hasActiveEffect('dying')
          if (effectEffect.length > 0) {
            effectEffect.forEach(effect => effect.delete())
          }
        } else this.fallDying()
        break
      case 'prone':
        if (statusValue) {
          await this.unsetStatus('prone')
          effectEffect = await this.hasActiveEffect('prone')
          if (effectEffect.length > 0) {
            effectEffect.forEach(effect => effect.delete())
          }
        } else this.fallProne()
        break
      case 'unconscious':
        if (statusValue) {
          await this.unsetStatus('unconscious')
          effectEffect = await this.hasActiveEffect('unconscious')
          if (effectEffect.length > 0) {
            effectEffect.forEach(effect => effect.delete())
          }
        } else this.fallUnconscious()
        break
    }
  }

  async hasActiveEffect (effectLabel) {
    const effectList = this.effects
      .map(effect => {
        return effect
      })
      .filter(effect => effect.data.label === effectLabel)
    return effectList
  }

  async toggleEffect (effectName) {
    switch (effectName) {
      case 'boutOfMadness':
        if (this.boutOfMadness) {
          await this.boutOfMadness.delete()
          // if( boutOfMadness){
          //   await boutOfMadness.update({ disabled: !boutOfMadness.data.disabled, duration: {seconds: undefined, rounds: undefined, turns: 1}});
          // }
        } else {
          await super.createEmbeddedDocuments('ActiveEffect', [
            {
              label: game.i18n.localize('CoC7.BoutOfMadnessName'),
              icon: game.settings.get('CoC7', 'enableStatusIcons')
                ? 'systems/CoC7/assets/icons/hanging-spider.svg'
                : null,
              origin: this.uuid,
              duration: {
                seconds: undefined,
                rounds: undefined,
                turns: 1
              },
              flags: {
                CoC7: {
                  madness: true,
                  realTime: true
                }
              },
              disabled: false
            }
          ])
        }

        break
      case 'insanity':
        if (this.insanity) {
          this.insanity.delete()
          // if( insanity){
          //   await insanity.update({ disabled: !insanity.data.disabled, duration: {seconds: undefined, rounds: undefined, turns: 1}});
          // }
        } else {
          await super.createEmbeddedDocuments('ActiveEffect', [
            {
              label: game.i18n.localize('CoC7.InsanityName'),
              icon: game.settings.get('CoC7', 'enableStatusIcons')
                ? 'systems/CoC7/assets/icons/tentacles-skull.svg'
                : null,
              origin: this.uuid,
              duration: {
                seconds: undefined,
                rounds: undefined,
                turns: 1
              },
              flags: {
                CoC7: {
                  madness: true,
                  indefinite: true
                }
              },
              // tint: '#ff0000',
              disabled: false
            }
          ])
        }
        break

      default:
        break
    }
  }

  getStatus (statusName) {
    if (!this.data.data.status) return false
    let statusValue = this.data.data.status[statusName]?.value
    if (undefined === statusValue) return false
    if (!(typeof statusValue === 'boolean')) {
      statusValue = statusValue === 'false' // Necessary, incorrect template initialization
    }
    return statusValue
  }

  async setStatus (statusName) {
    await this.update({ [`data.status.${statusName}.value`]: true })
  }

  async unsetStatus (statusName) {
    await this.update({ [`data.status.${statusName}.value`]: false })
  }

  async resetCounter (counter) {
    await this.update({ [counter]: 0 })
  }

  async setOneFifthSanity (oneFifthSanity) {
    await this.update({ 'data.attribs.san.oneFifthSanity': oneFifthSanity })
  }

  get fightingSkills () {
    const skillList = []
    this.items.forEach(value => {
      if (value.type === 'skill' && value.data.data.properties.fighting) {
        skillList.push(value)
      }
    })

    skillList.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    return skillList
  }

  get closeCombatWeapons () {
    const weaponList = []
    this.items.forEach(value => {
      if (value.type === 'weapon' && !value.data.data.properties.rngd) {
        const skill = this.items.get(value.data.data.skill.main.id)
        value.data.data.skill.main.value = skill ? skill.value : 0
        weaponList.push(value)
      }
    })

    weaponList.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    return weaponList
  }

  get firearmSkills () {
    const skillList = []
    this.items.forEach(value => {
      if (value.type === 'skill' && value.data.data.properties.firearm) {
        skillList.push(value)
      }
    })

    skillList.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    return skillList
  }

  get user () {
    // is that actor impersonanted by a user ?
    return game.users.find(user => {
      if (user.character) {
        if (user.character.id === this.id) return true
      }
      return false
    })
  }

  get dodgeSkill () {
    const skillList = this.getSkillsByName(
      game.i18n.localize(COC7.dodgeSkillName)
    )
    if (skillList.length !== 0) return skillList[0]
    return null
  }

  get creditRatingSkill () {
    const skillList = this.getSkillsByName(
      game.i18n.localize(COC7.creditRatingSkillName)
    )
    if (skillList.length !== 0) return skillList[0]
    return null
  }

  get cthulhuMythosSkill () {
    const skillList = this.getSkillsByName(
      game.i18n.localize(COC7.CthulhuMythosName)
    )
    if (skillList.length !== 0) return skillList[0]
    return null
  }

  get cthulhuMythos () {
    const CM = this.cthulhuMythosSkill
    if (CM) {
      const value = CM.value
      if (value) return value
      return parseInt(CM.data.data.value)
    }
    return 0
  }

  get mythosInsanityExperienced () {
    return this.getFlag('CoC7', 'mythosInsanityExperienced') || false
  }

  async experienceFirstMythosInsanity () {
    await this.setFlag('CoC7', 'mythosInsanityExperienced', true)
  }

  get creditRating () {
    const CR = this.creditRatingSkill
    if (CR) {
      const value = CR.value
      if (value) return value
      return parseInt(CR.data.data.value)
    }
    return 0
  }

  get spendingLevel () {
    const CR = this.creditRating
    if (CR >= 99) return 5000
    if (CR >= 90) return 250
    if (CR >= 50) return 50
    if (CR >= 10) return 10
    if (CR >= 1) return 2
    return 0.5
  }

  get cash () {
    const CR = this.creditRating
    if (CR >= 99) return 50000
    if (CR >= 90) return CR * 20
    if (CR >= 50) return CR * 5
    if (CR >= 10) return CR * 2
    if (CR >= 1) return CR
    return 0.5
  }

  get assets () {
    const CR = this.creditRating
    if (CR >= 99) return 5000000
    if (CR >= 90) return CR * 2000
    if (CR >= 50) return CR * 500
    if (CR >= 10) return CR * 50
    if (CR >= 1) return CR * 10
    return 0
  }

  get skills () {
    const skillList = []
    this.items.forEach(value => {
      if (value.type === 'skill') skillList.push(value)
    })

    skillList.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    return skillList
  }

  get owners () {
    return game.users.filter(
      u => this.testUserPermission(u, 'OWNER') && !u.isGM
    )
  }

  get player () {
    return this.owners.filter(u => u.character?.id === this.id)
  }

  get characterUser () {
    return (
      game.users.contents.filter(u => u.character?.id === this.id)[0] || null
    )
  }

  async setHealthStatusManually (event) {
    event.preventDefault()
    if (event.originalEvent) {
      const healthBefore = parseInt(
        event.originalEvent.currentTarget.defaultValue
      )
      const healthAfter = parseInt(event.originalEvent.currentTarget.value)
      let damageTaken
      // is healing
      if (healthAfter > healthBefore) return await this.setHp(healthAfter)
      else if (healthAfter < 0) damageTaken = Math.abs(healthAfter)
      else damageTaken = healthBefore - healthAfter
      this.render(true) // needed, or negative values will not work
      return await this.dealDamage(damageTaken, { ignoreArmor: true })
    }
  }

  async dealDamage (amount, options = {}) {
    let total = parseInt(amount)
    // let initialHp = this.hp;
    if (this.data.data.attribs.armor.value && !options.ignoreArmor) {
      let armorValue
      if (CoC7Utilities.isFormula(this.data.data.attribs.armor.value)) {
        const armorRoll = await new Roll(
          this.data.data.attribs.armor.value
        ).roll({ async: true })
        armorValue = armorRoll.total
      } else if (!isNaN(Number(this.data.data.attribs.armor.value))) {
        armorValue = Number(this.data.data.attribs.armor.value)
      } else {
        ui.notifications.warn(
          `Unable to process armor value :${this.data.data.attribs.armor.value}. Ignoring armor`
        )
        armorValue = 0
      }
      total = total - armorValue
    }
    if (total <= 0) return 0
    await this.setHp(this.hp - total)
    if (total >= this.hpMax) {
      await this.fallDead()
      // return this.hpMax;
    } else {
      if (total >= Math.floor(this.hpMax / 2)) await this.inflictMajorWound()
      if (this.hp === 0) {
        if (!this.getStatus(COC7.status.unconscious)) {
          await this.fallUnconscious()
        }
        if (this.majorWound) this.fallDying()
      }
    }
    // if( total>initialHp) return initialHp;
    return total
  }

  async inflictMajorWound () {
    if (!this.majorWound) {
      await this.setStatus(COC7.status.criticalWounds)
      const criticalWoundsEffect = await this.hasActiveEffect('criticalWounds')
      if (criticalWoundsEffect.length === 0) {
        await super.createEmbeddedDocuments('ActiveEffect', [
          {
            label: 'criticalWounds',
            icon: game.settings.get('CoC7', 'enableStatusIcons')
              ? 'systems/CoC7/assets/icons/arm-sling.svg'
              : null,
            origin: this.uuid,
            duration: {
              seconds: undefined,
              rounds: undefined,
              turns: 1
            },
            disabled: false
          }
        ])
      }
    }
    await this.fallProne()
    if (!this.getStatus(COC7.status.unconscious)) {
      const conCheck = new CoC7ConCheck(this.isToken ? this.tokenKey : this.id)
      conCheck.toMessage()
    }
  }

  async cureMajorWound () {
    await this.unsetStatus(COC7.status.criticalWounds)
    const criticalWoundsEffect = await this.hasActiveEffect('criticalWounds')
    if (criticalWoundsEffect.length > 0) {
      criticalWoundsEffect.forEach(effect => effect.delete())
    }
  }

  async fallProne () {
    await this.setStatus(COC7.status.prone)
    const proneEffect = await this.hasActiveEffect('prone')
    if (proneEffect.length === 0) {
      await super.createEmbeddedDocuments('ActiveEffect', [
        {
          label: 'prone',
          icon: game.settings.get('CoC7', 'enableStatusIcons')
            ? 'systems/CoC7/assets/icons/falling.svg'
            : null,
          origin: this.uuid,
          duration: {
            seconds: undefined,
            rounds: undefined,
            turns: 1
          },
          disabled: false
        }
      ])
    }
  }

  async fallUnconscious () {
    await this.setStatus(COC7.status.unconscious)
    const unconsciousEffect = await this.hasActiveEffect('unconscious')
    if (unconsciousEffect.length === 0) {
      await super.createEmbeddedDocuments('ActiveEffect', [
        {
          label: 'unconscious',
          icon: game.settings.get('CoC7', 'enableStatusIcons')
            ? 'systems/CoC7/assets/icons/knocked-out-stars.svg'
            : null,
          origin: this.uuid,
          duration: {
            seconds: undefined,
            rounds: undefined,
            turns: 1
          },
          disabled: false
        }
      ])
    }
  }

  async fallDying () {
    await this.setStatus(COC7.status.dying)
    const dyingEffect = await this.hasActiveEffect('dying')
    if (dyingEffect.length === 0) {
      await super.createEmbeddedDocuments('ActiveEffect', [
        {
          label: 'dying',
          icon: game.settings.get('CoC7', 'enableStatusIcons')
            ? 'systems/CoC7/assets/icons/heart-beats.svg'
            : null,
          origin: this.uuid,
          duration: {
            seconds: undefined,
            rounds: undefined,
            turns: 1
          },
          disabled: false
        }
      ])
    }
  }

  async fallDead () {
    await this.inflictMajorWound()
    await this.unsetStatus(COC7.status.dying)
    await this.fallUnconscious()
    await this.setStatus(COC7.status.dead)
    const deadEffect = await this.hasActiveEffect('dead')
    if (deadEffect.length === 0) {
      await super.createEmbeddedDocuments('ActiveEffect', [
        {
          label: 'dead',
          icon: game.settings.get('CoC7', 'enableStatusIcons')
            ? 'systems/CoC7/assets/icons/tombstone.svg'
            : null,
          origin: this.uuid,
          duration: {
            seconds: undefined,
            rounds: undefined,
            turns: 1
          },
          disabled: false
        }
      ])
    }
    const dyingEffect = await this.hasActiveEffect('dying')
    if (!this.dying && dyingEffect.length > 0) {
      dyingEffect.forEach(effect => effect.delete())
    }
  }

  get majorWound () {
    return this.getStatus(COC7.status.criticalWounds)
  }

  get dying () {
    return this.getStatus(COC7.status.dying)
  }

  get unconscious () {
    return this.getStatus(COC7.status.unconscious)
  }

  get dead () {
    return this.getStatus(COC7.status.dead)
  }

  get prone () {
    return this.getStatus(COC7.status.prone)
  }

  // static updateActor( actor, dataUpdate){
  //   if( game.user.isGM){
  //     // ui.notifications.info( `updating actor ${actor.name}`);
  //     const prone = dataUpdate?.flags?.CoC7[COC7.status.prone];
  //     const unconscious = dataUpdate?.flags?.CoC7[COC7.status.unconscious];
  //     const criticalWounds = dataUpdate?.flags?.CoC7[COC7.status.criticalWounds];
  //     const dying = dataUpdate?.flags?.CoC7[COC7.status.dying];
  //     if( prone) ui.notifications.info( game.i18n.format('CoC7.InfoActorProne', {actor: actor.name}));
  //     if( unconscious) ui.notifications.info( game.i18n.format('CoC7.InfoActorUnconscious', {actor: actor.name}));
  //     if( criticalWounds) ui.notifications.info( game.i18n.format('CoC7.InfoActorMajorWound', {actor: actor.name}));
  //     if( dying) ui.notifications.info( game.i18n.format('CoC7.InfoActorDying', {actor: actor.name}));
  //   }
  //   return;
  // }

  // "CoC7.InfoActorProne": "{actor} fall prone",
  // "CoC7.InfoActorUnconscious": "{actor} fall unconscious",
  // "CoC7.InfoActorMajorWound": "{actor} get a major wound",
  // "CoC7.InfoActorDying": "{acor} is dying",
  // "CoC7.InfoActorInjuried": "{actor} is injuried",

  // static updateToken( scene, token, dataUpdate){
  //   const injuried = dataUpdate?.actorData?.flags?.CoC7?.injuried;
  //   if( injuried) ui.notifications.info( game.i18n.format('CoC7.InfoActorInjuried', {actor: token.name}));
  //   return;
  // }
}
