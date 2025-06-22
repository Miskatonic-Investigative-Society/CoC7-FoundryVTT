/* global Actor, Application, CONFIG, CONST, Dialog, Die, foundry, fromUuid, fromUuidSync, game, Hooks, Roll, TextEditor, Token, ui */
import { AverageRoll } from '../apps/average-roll.js'
import { COC7 } from '../config.js'
import CoC7ActiveEffect from '../active-effect.js'
import { CoC7ChatMessage } from '../apps/coc7-chat-message.js'
import { CoC7Check } from '../check.js'
import { CoC7ConCheck } from '../chat/concheck.js'
import { RollDialog } from '../apps/roll-dialog.js'
import { SkillSelectDialog } from '../apps/skill-selection-dialog.js'
import { PointSelectDialog } from '../apps/point-selection-dialog.js'
import { CharacSelectDialog } from '../apps/char-selection-dialog.js'
import { CharacRollDialog } from '../apps/char-roll-dialog.js'
import { ExperiencePackageDialog } from '../apps/experience-package-dialog.js'
import { SkillSpecSelectDialog } from '../apps/skill-spec-select-dialog.js'
import { SkillSpecializationSelectDialog } from '../apps/skill-specialization-select-dialog.js'
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
  /** Create derived document classes for specific Item types */
  constructor (data, context) {
    /** @see CONFIG.Actor.documentClasses in module/scripts/configure-documents */
    if (data.type in CONFIG.Actor.documentClasses && !context?.extended) {
      /**
       * When the constructor for the new class will call it's super(),
       * the extended flag will be true, thus bypassing this whole process
       * and resume default behavior
       */
      return new CONFIG.Actor.documentClasses[data.type](data, {
        ...{ extended: true },
        ...context
      })
    }
    // if (typeof data.img === 'undefined') {
    //   if (data.type === 'skill') {
    //     data.img = 'systems/CoC7/assets/icons/skills.svg'
    //   } else if (data.type === 'status') {
    //     data.img = 'icons/svg/aura.svg'
    //   } else if (data.type === 'weapon') {
    //     data.img = 'icons/svg/sword.svg'
    //   }
    // }
    /** Default behavior, just call super() and do all the default Item inits */
    super(data, context)
  }

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

  /**
   * @override
   * Prepare data related to this Document itself, before any embedded Documents or derived data is computed.
   * @memberof ClientDocumentMixin#
   */
  prepareBaseData () {
    if (['character', 'npc', 'creature'].includes(this.type)) {
      this.system.skills = {}
      for (const i of this.items) {
        if (i.type !== 'skill') continue
        this.system.skills[`${i.itemIdentifier}`] = { foundryID: i.id, cocid: i.flags?.CoC7?.cocidFlag?.id, value: i.rawValue, bonusDice: i.system.bonusDice }
      }

      /**
     * Removal of 1/5 sanity
     * this is to remove the
     * actor.data.attribs.san.oneFifthSanity to be removed from template
     * and indefiniteInsanityLevel to be removed from template
     */
      if (typeof this.system.attribs.san.dailyLimit === 'undefined') {
        if (this.system.attribs.san.oneFifthSanity) {
          const s = this.system.attribs.san.oneFifthSanity.split('/')
          if (s[1] && !isNaN(Number(s[1]))) {
            this.system.attribs.san.dailyLimit = Number(s[1])
          } else {
            this.system.attribs.san.dailyLimit = 0
          }
        } else {
          this.system.attribs.san.dailyLimit = 0
        }
      }

      // return computed values or fixed values if not auto.
      this.system.attribs.mov.value = this.rawMov
      this.system.attribs.db.value = this.rawDb
      this.system.attribs.build.value = this.rawBuild

      // For vehicle only :
      this.system.attribs.build.current = this.hp

      // if (
      //   data.data.attribs.mp.value > data.data.attribs.mp.max ||
      //   data.data.attribs.mp.max == null
      // ) {
      //   data.data.attribs.mp.value = data.data.attribs.mp.max
      // }
      // if (
      //   data.data.attribs.hp.value > data.data.attribs.hp.max ||
      //   data.data.attribs.hp.max == null
      // ) {
      //   data.data.attribs.hp.value = data.data.attribs.hp.max
      // }

    // if (
    //   data.data.attribs.hp.value == null &&
    //   data.data.attribs.hp.max != null
    // ) {
    //   data.data.attribs.hp.value = data.data.attribs.hp.max
    // }
    // if (
    //   data.data.attribs.mp.value == null &&
    //   data.data.attribs.mp.max != null
    // ) {
    //   data.data.attribs.mp.value = data.data.attribs.mp.max
    // }
    }
    super.prepareBaseData()
  }

  /**
   * @override
   * Prepare all embedded Document instances which exist within this primary Document.
   * @memberof ClientDocumentMixin#
   * active effects are applied
   */
  prepareEmbeddedDocuments () {
    super.prepareEmbeddedDocuments()
  }

  /**
   * @override
   * Apply transformations or derivations to the values of the source data object.
   * Compute data fields whose values are not stored to the database.
   * @memberof ClientDocumentMixin#
   */
  prepareDerivedData () {
    if (['character', 'npc', 'creature'].includes(this.type)) {
      super.prepareDerivedData()
      // Set hpMax, mpMax, sanMax, mov, db, build. This is to allow calculation of derived value with modifed characteristics.
      this.system.attribs.mov.value = this.rawMov
      this.system.attribs.db.value = this.rawDb
      this.system.attribs.build.value = this.rawBuild

      this.system.attribs.hp.max = this.rawHpMax
      if (this.hp === null) this.system.attribs.hp.value = this.rawHpMax

      this.system.attribs.mp.max = this.rawMpMax
      if (this.mp === null) this.system.attribs.mp.value = this.rawMpMax

      this.system.attribs.san.max = this.rawSanMax
      if (this.san === null) this.system.attribs.san.value = this.rawSanMax

      // Apply effects to automaticaly calculated values.
      const filterMatrix = []

      if (this.system.attribs.hp.auto) filterMatrix.push('system.attribs.hp.max')
      if (this.system.attribs.mp.auto) filterMatrix.push('system.attribs.mp.max')
      if (this.system.attribs.san.auto) filterMatrix.push('system.attribs.san.max')
      if (this.system.attribs.mov.auto) filterMatrix.push('system.attribs.mov.value')
      if (this.system.attribs.db.auto) filterMatrix.push('system.attribs.db.value')
      if (this.system.attribs.build.auto) filterMatrix.push('system.attribs.build.value')

      const changes = this.effects.reduce((changes, e) => {
        if (e.disabled || e.isSuppressed) return changes
        return changes.concat(
          e.changes.map(c => {
            c = foundry.utils.duplicate(c)
            c.effect = e
            c.priority = c.priority ?? c.mode * 10
            return c
          })
        )
      }, [])
      changes.sort((a, b) => a.priority - b.priority)

      const selectChanges = changes.filter(e => filterMatrix.includes(e.key))

      // Apply all changes
      for (const change of selectChanges) {
        change.effect.apply(this, change)
      }

      if (this.hpMax && this.hpMax < this.hp) { this.system.attribs.hp.value = this.hpMax }
      if (this.mpMax && this.mpMax < this.mp) { this.system.attribs.mp.value = this.mpMax }
      if (this.sanMax && this.sanMax < this.san) { this.system.attribs.san.value = this.sanMax }
    }
  }

  static defaultImg (type) {
    switch (type) {
      case 'container':
        return 'icons/svg/chest.svg'
      case 'creature':
        return 'systems/CoC7/assets/icons/floating-tentacles.svg'
      case 'npc':
        return 'systems/CoC7/assets/icons/cultist.svg'
    }
  }

  /** @override */
  static async create (data, options = {}) {
    if (data.type === 'character') {
      data.prototypeToken = foundry.utils.mergeObject(data.prototypeToken || {}, {
        actorLink: true,
        disposition: 1,
        sight: {
          enabled: true
        }
      })
    } else if (data.type === 'npc') {
      if (typeof data.img === 'undefined' || data.img === 'icons/svg/mystery-man.svg') {
        data.img = CoCActor.defaultImg(data.type)
      }
    } else if (data.type === 'creature') {
      if (typeof data.img === 'undefined' || data.img === 'icons/svg/mystery-man.svg') {
        data.img = CoCActor.defaultImg(data.type)
      }
    } else if (data.type === 'container') {
      if (typeof data.img === 'undefined' || data.img === 'icons/svg/mystery-man.svg') {
        data.img = CoCActor.defaultImg(data.type)
      }
      data.prototypeToken = foundry.utils.mergeObject(data.prototypeToken || {}, {
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
    if (this.system.attribs?.hp?.auto === undefined) {
      returnData.attribs.hp.auto = true
    }
    if (this.system.attribs?.mp?.auto === undefined) {
      returnData.attribs.mp.auto = true
    }
    if (this.system.attribs?.san?.auto === undefined) {
      returnData.attribs.san.auto = true
    }
    if (this.system.attribs?.mov?.auto === undefined) {
      returnData.attribs.mov.auto = true
    }
    if (this.system.attribs?.db?.auto === undefined) {
      returnData.attribs.db.auto = true
    }
    if (this.system.attribs?.build?.auto === undefined) {
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
    if (this.system.characteristics) {
      for (const [key, value] of Object.entries(
        this.system.characteristics
      )) {
        characteristics[key] = {
          key,
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

  get hasTempoInsane () {
    return this.hasConditionStatus(COC7.status.tempoInsane)
  }

  get getTempoInsaneDurationText () {
    return this.hasConditionValue(COC7.status.tempoInsane, 'durationText')
  }

  get hasIndefInsane () {
    return this.hasConditionStatus(COC7.status.indefInsane)
  }

  get portrait () {
    if (!game.settings.get('CoC7', 'useToken')) return this.img
    return this.token?.texture?.src || this.prototypeToken?.texture?.src || this.img
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
          CONST.TABLE_RESULT_TYPES.DOCUMENT ===
          result.tableRoll.results[0].type
        ) {
          const item = game.items.get(result.tableRoll.results[0].documentId)
          if (typeof item !== 'undefined') {
            if (item.system?.type?.phobia) result.phobia = true
            if (item.system?.type?.mania) result.mania = true
            result.description = `${item.name}:` + await TextEditor.enrichHTML(
              item.system.description.value,
              { async: true }
            )
            result.name = item.name
            const itemData = item.toObject()
            delete itemData._id
            await this.createEmbeddedDocuments('Item', [itemData])
          } else {
            ui.notifications.error(
              game.i18n.localize('CoC7.MessageBoutOfMadnessItemNotFound')
            )
          }
        }
        if (
          CONST.TABLE_RESULT_TYPES.TEXT ===
          result.tableRoll.results[0].type
        ) {
          result.description = await TextEditor.enrichHTML(
            result.tableRoll.results[0].text,
            { async: true }
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

    this.setCondition(COC7.status.tempoInsane, {
      realTime,
      duration
    })

    // const effect = this.effects.get( effectData._id);
    // effect.sheet.render(true);

    return result
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

  static emptySkill (
    skillName,
    value,
    {
      rarity = false,
      push = true,
      combat = false,
      img = false,
      specialization = false
    } = {}
  ) {
    const data = {
      name: skillName,
      type: 'skill',
      system: {
        value,
        skillName,
        specialization: '',
        properties: {
          special: false,
          rarity,
          push,
          combat
        }
      }
    }
    if (img !== false) {
      data.img = img
    }
    if (specialization !== false) {
      const parts = CoC7Item.getNamePartsSpec(skillName, specialization)
      data.system.specialization = parts.specialization
      data.system.skillName = parts.skillName
      data.name = parts.name
      data.system.properties.special = true
    }
    return data
  }

  /**
   * Clean list of skills by removing specialization from name
   */
  // async cleanSkills () {
  //   Dialog.confirm({
  //     title: `${game.i18n.localize('CoC7.CleanSkillList')}`,
  //     content: `<p>${game.i18n.localize('CoC7.CleanSkillListHint')}</p>`,
  //     yes: () => clean(this)
  //   })
  //   async function clean (actor) {
  //     const update = []
  //     actor.skills.forEach(s => {
  //       if (s.system.properties.special) {
  //         const clean = CoC7Item.getNameWithoutSpec(s)?.trim()
  //         if (clean.toLowerCase() != s.name.toLowerCase() || clean.toLowerCase() != s.data.name.toLowerCase()) {
  //           update.push({
  //             _id: s.id,
  //             name: clean
  //           })
  //         }
  //       }
  //     })
  //     if (update.length != 0){
  //       await actor.updateEmbeddedDocuments('Item', update)
  //       ui.notifications.info( `Skills : ${Array.from( update, e => e.name).join(', ')} updated.`)
  //     } else {
  //       ui.notifications.info( 'Skill list was clean already !')
  //     }
  //   }
  // }

  /** @override */
  async createSkill (skillName, value, showSheet = false) {
    const data = CoCActor.emptySkill(skillName, value)
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
    if (skillData === false) {
      return
    }
    const value = Number(skillData.get('base-value'))
    const parts = CoC7Item.getNamePartsSpec(
      name,
      game.i18n.localize(
        firearms
          ? 'CoC7.FirearmSpecializationName'
          : 'CoC7.FightingSpecializationName'
      )
    )
    const data = {
      name: parts.name,
      type: 'skill',
      system: {
        base: isNaN(value) ? 0 : value,
        adjustments: {
          personal: null,
          occupation: null,
          archetype: null,
          experience: null
        },
        skillName: parts.skillName,
        specialization: parts.specialization,
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
    if (this.type !== 'creature') return
    if (this.getActorFlag('initialized')) return // Change to return skill ?

    // Check if fighting skills exists, if not create it and the associated attack.
    const skills = this.getSkillsByName(
      game.i18n.localize(COC7.creatureFightingSkill)
    )
    if (skills.length === 0) {
      // Creating natural attack skill
      try {
        const parts = CoC7Item.getNamePartsSpec(
          game.i18n.localize(COC7.creatureFightingSkill),
          game.i18n.localize(COC7.fightingSpecializationName)
        )
        const data = {
          type: 'skill',
          name: parts.name,
          system: {
            base: 0,
            value: null,
            skillName: parts.skillName,
            specialization: parts.specialization,
            properties: {
              combat: true,
              fighting: true,
              special: true
            },
            flags: {}
          }
        }
        const skill = await this.createEmbeddedDocuments('Item', [data], {
          renderSheet: false
        })

        const attack = await this.createEmbeddedDocuments(
          'Item',
          [
            {
              name: 'Innate attack',
              type: 'weapon',
              system: {
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
            'system.skill.main.id': skill[0].id,
            'system.skill.main.name': skill[0].name
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
      system: {
        quantity
      }
    }
    const created = await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: showSheet
    })
    return created
  }

  async createEmptyArmor (event = null) {
    const showSheet = event ? !event.shiftKey : true
    const data = {
      name: game.i18n.localize('CoC7.Entities.Armor'),
      type: 'armor',
      effects: [
        {
          name: game.i18n.localize('CoC7.Entities.Armor'),
          changes: [
            {
              key: 'system.attribs.armor.value',
              mode: 2,
              value: '0'
            }
          ]
        }
      ]
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
      system: {}
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

  static emptySpell (itemName) {
    const data = {
      name: itemName,
      type: 'spell',
      system: {}
    }
    return data
  }

  async createSpell (itemName, showSheet = false) {
    const data = CoCActor.emptySpell(itemName)
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
        (this.type !== 'character' ? 1 : null),
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

  async createEmptyWeapon (event = null, properties = {}) {
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
      system: {
        properties: {}
      }
    }

    for (const [key] of Object.entries(COC7.weaponProperties)) {
      data.system.properties[key] =
        Object.prototype.hasOwnProperty.call(properties, key) ?? false
    }

    await this.createEmbeddedDocuments('Item', [data], {
      renderSheet: showSheet
    })
  }

  async createBioSection (title = null) {
    const bio = this.system.biography
      ? foundry.utils.duplicate(this.system.biography)
      : []
    bio.push({
      title,
      value: null
    })
    await this.update({ 'system.biography': bio }, { renderSheet: false })
  }

  async updateBioValue (index, content) {
    const bio = foundry.utils.duplicate(this.system.biography)
    bio[index].value = content
    await this.update({ 'system.biography': bio }, { render: false })
  }

  async updateBioTitle (index, title) {
    const bio = foundry.utils.duplicate(this.system.biography)
    bio[index].title = title
    await this.update({ 'system.biography': bio })
  }

  async deleteBioSection (index) {
    const bio = foundry.utils.duplicate(this.system.biography)
    bio.splice(index, 1)
    await this.update({ 'system.biography': bio })
  }

  async moveBioSectionUp (index) {
    if (index === 0) return
    const bio = foundry.utils.duplicate(this.system.biography)
    if (index >= bio.length) return
    const elem = bio.splice(index, 1)[0]
    bio.splice(index - 1, 0, elem)
    await this.update({ 'system.biography': bio })
  }

  async moveBioSectionDown (index) {
    const bio = foundry.utils.duplicate(this.system.biography)
    if (index >= bio.length - 1) return
    const elem = bio.splice(index, 1)[0]
    bio.splice(index + 1, 0, elem)
    await this.update({ 'system.biography': bio })
  }

  async updateTextArea (textArea) {
    const name = 'system.' + textArea.dataset.areaName
    await this.update({ [name]: textArea.value })
  }

  // async _updateEmbeddedDocuments (documentClass, parent, { updates, options, pack }, user) {
  //   const pouet = 'toto'
  // }

  // async preUpdateActiveEffect (a,b,c,d) {
  //   const pouet = 'toto'
  // }

  // async updateActiveEffect (a,b,c,d) {
  //   const pouet = 'toto'
  // }

  /**
   * Create an item for that actor.
   * If it's a skill first check if the skill is already owned. If it is don't create a second time.
   * Fill the value of the skill with base or try to evaluate the formula.
   * @param {*} embeddedName
   * @param {*} data
   * @param {*} options
   */
  async createEmbeddedDocuments (embeddedName, dataArray, options) {
    const processedDataArray = []
    let baseValue = 0
    let baseCalculated = 0
    let archetype = false
    let occupation = false
    const actorChanges = {}
    const itemChanges = []
    for (let data of dataArray) {
      switch (data.type) {
        case 'skill': {
          baseValue = data.system.base
          baseCalculated = await CoC7Item.calculateBase(this, data)
          if (this.type !== 'character') {
            // If not a PC set skill value to base
            if (this.getItemIdByName(data.name)) return // If skill with this name exist return

            if (baseValue) {
              if (String(baseValue) !== String(data.system.value)) {
                data.system.value = baseCalculated
              }
            }

            if (isNaN(Number(data.system.value))) {
              let value
              try {
                value = (
                  await new Roll(
                    data.system.value,
                    this.parseCharacteristics()
                  ).evaluate({ async: true })
                ).total
              } catch (err) {
                value = null
              }
              if (value) data.system.value = Math.floor(value)
            }
          } else {
            data.system.value = null
          }

          let addThis = true

          if (CoC7Item.isAnySpec(data)) {
            const isAnyButNotFlagged = (!(data.system.properties?.requiresname) ?? false) && !(data.system.properties?.picknameonly ?? false)
            let skillList = []
            const group = game.system.api.cocid.guessGroupFromDocument(data)
            if (group) {
              skillList = (await game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: new RegExp('^' + CoC7Utilities.quoteRegExp(group) + '.+$'), type: 'i' })).filter(item => {
                return (item.system.properties?.special ?? false) && !(item.system.properties?.requiresname ?? false) && !(item.system.properties?.picknameonly ?? false)
              })
            }
            if (data.system?.flags?.occupation || data.system?.flags?.archetype) {
              const existingSkills = this.skills.filter(el => {
                if (!el.system.specialization) return false
                if (
                  data.system?.flags?.occupation &&
                  el.system.flags?.occupation
                ) {
                  return false
                }
                if (
                  data.system?.flags?.archetype &&
                  el.system.flags?.archetype
                ) {
                  return false
                }
                return (
                  data.system.specialization.toLocaleLowerCase() ===
                  el.system.specialization.toLocaleLowerCase()
                )
              })
              if (existingSkills.length > 0) {
                if (skillList.length > 0) {
                  for (let i = existingSkills.length - 1; i >= 0; i--) {
                    const found = skillList.findIndex(item => {
                      return item.name === existingSkills[i].name || item.flags?.CoC7?.cocidFlag?.id === existingSkills[i].flags?.CoC7?.cocidFlag?.id
                    })
                    if (found > -1) {
                      skillList.splice(found, 1)
                    }
                  }
                  skillList = skillList.concat(existingSkills)
                } else {
                  skillList = existingSkills
                }
              }
            }
            if (skillList.length > 0) {
              skillList.sort(CoC7Utilities.sortByNameKey)
            }
            const skillData = await SkillSpecializationSelectDialog.create({
              skills: skillList,
              allowCustom: (isAnyButNotFlagged || (data.system.properties?.requiresname ?? false)),
              fixedBaseValue: (data.system.properties?.keepbasevalue ?? false),
              specializationName: data.system.specialization,
              label: data.name,
              baseValue: data.system.base
            })
            if (Object.prototype.hasOwnProperty.call(skillData, 'selected')) {
              if (skillData.selected) {
                const existingItem = this.items.get(
                  skillData.selected
                )
                if (existingItem) {
                  const changes = {}
                  if (!(data.system.properties?.keepbasevalue ?? false)) {
                    if (skillData.baseValue !== '') {
                      baseCalculated = skillData.baseValue
                      changes['system.value'] = baseCalculated
                    }
                  }
                  for (const [key, value] of Object.entries(data.system.flags)) {
                    if (value) {
                      changes[`system.flags.${key}`] = true
                    }
                  }
                  if (Object.keys(changes).length > 0) {
                    changes._id = existingItem.id
                    await this.updateEmbeddedDocuments('Item', [changes])
                  }
                  data.name = CoC7Item.getNameWithoutSpec(existingItem)
                  addThis = false
                } else {
                  const existing = skillList.find(i => i.id === skillData.selected)
                  if (existing) {
                    const flags = data.system?.flags
                    const keepBase = (data.system.properties?.keepbasevalue ?? false)
                    if (keepBase) {
                      const parts = CoC7Item.getNamePartsSpec(
                        existing.system.skillName,
                        data.system.specialization
                      )
      
                      data.system.skillName = parts.skillName
                      data.name = parts.name
                      for (const [key, value] of Object.entries(flags)) {
                        if (value) {
                          data.system.flags[key] = true
                        }
                      }
                      baseValue = data.system.base
                      baseCalculated = await CoC7Item.calculateBase(this, data)
                    } else {
                      data = foundry.utils.duplicate(existing)
                      for (const [key, value] of Object.entries(flags)) {
                        if (value) {
                          data.system.flags[key] = true
                        }
                      }
                      if (skillData.baseValue !== '') {
                        data.system.base = skillData.baseValue
                      }
                      baseValue = data.system.base
                      baseCalculated = await CoC7Item.calculateBase(this, data)
                    }
                  }
                }
              } else {
                const parts = CoC7Item.getNamePartsSpec(
                  skillData.name,
                  data.system.specialization
                )
                if (!(data.system.properties?.keepbasevalue ?? false)) {
                  if (skillData.baseValue !== '') {
                    data.system.base = skillData.baseValue
                  }
                  baseValue = skillData.baseValue
                  baseCalculated = await CoC7Item.calculateBase(this, data)
                }
                data.system.skillName = parts.skillName
                data.name = parts.name
              }
            }
          }

          if (addThis) {
            if (String(baseValue) !== String(baseCalculated)) {
              data.system.base = baseCalculated
            }

            processedDataArray.push(foundry.utils.duplicate(data))
          }
          break
        }

        case 'weapon': {
          if (this.type !== 'container') {
            const mainSkill = data.system?.skill?.main?.name
            if (mainSkill) {
              let skill = this.getSkillsByName(mainSkill)[0]
              if (!skill) {
                const name = mainSkill.match(/\(([^)]+)\)/)
                  ? mainSkill.match(/\(([^)]+)\)/)[1]
                  : mainSkill
                if (name.match(/i\.skill\./)) {
                  const availableSkills = await game.system.api.cocid.fromCoCIDBest({ cocid: name, showLoading: true })
                  if (availableSkills.length) {
                    await this.addItems([availableSkills[0]])
                    skill = await this.getSkillsByName(mainSkill)[0]
                  }
                }
                if (!skill) {
                  const existing = game.items.find(
                    item => item.type === 'skill' &&
                      (item.name.toLocaleLowerCase() === name.toLocaleLowerCase() || item.system.skillName?.toLocaleLowerCase() === name.toLocaleLowerCase())
                  )
                  if (typeof existing !== 'undefined') {
                    await this.addItems([existing])
                    skill = await this.getSkillsByName(mainSkill)[0]
                    // skill = existing.toObject()
                  } else {
                    skill = await this.createWeaponSkill(
                      name,
                      !!data.system.properties?.rngd
                    )
                  }
                }
              }
              if (skill) data.system.skill.main.id = skill.id
            }

            const secondSkill = data.system?.skill?.alternativ?.name
            if (secondSkill) {
              let skill = this.getSkillsByName(secondSkill)[0]
              if (!skill) {
                const name = secondSkill.match(/\(([^)]+)\)/)
                  ? secondSkill.match(/\(([^)]+)\)/)[1]
                  : secondSkill
                if (name.match(/i\.skill\./)) {
                  const availableSkills = await game.system.api.cocid.fromCoCIDBest({ cocid: name, showLoading: true })
                  if (availableSkills.length) {
                    await this.addItems([availableSkills[0]])
                    skill = await this.getSkillsByName(secondSkill)[0]
                  }
                }
                if (!skill) {
                  const existing = game.items.find(
                    item => item.type === 'skill' &&
                      (item.name.toLocaleLowerCase() === name.toLocaleLowerCase() || item.system.skillName?.toLocaleLowerCase() === name.toLocaleLowerCase())
                  )
                  if (typeof existing !== 'undefined') {
                    await this.addItems([existing])
                    skill = await this.getSkillsByName(secondSkill)[0]
                    // skill = existing.toObject()
                  } else {
                    skill = await this.createWeaponSkill(
                      name,
                      !!data.system.properties?.rngd
                    )
                  }
                }
              }
              if (skill) data.system.skill.alternativ.id = skill.id
            }
          }

          processedDataArray.push(foundry.utils.duplicate(data))
          break
        }

        case 'setup': {
          if (data.system.enableCharacterisitics) {
            data.system.characteristics.list = {}
            data.system.characteristics.list.str = this.getCharacteristic('str')
            data.system.characteristics.list.con = this.getCharacteristic('con')
            data.system.characteristics.list.siz = this.getCharacteristic('siz')
            data.system.characteristics.list.dex = this.getCharacteristic('dex')
            data.system.characteristics.list.app = this.getCharacteristic('app')
            data.system.characteristics.list.int = this.getCharacteristic('int')
            data.system.characteristics.list.pow = this.getCharacteristic('pow')
            data.system.characteristics.list.edu = this.getCharacteristic('edu')

            data.system.characteristics.list.luck = {}
            data.system.characteristics.list.luck.value = isNaN(this.luck)
              ? null
              : this.luck
            data.system.characteristics.list.luck.label = game.i18n.localize(
              'CoC7.Luck'
            )
            data.system.characteristics.list.luck.shortName = game.i18n.localize(
              'CoC7.Luck'
            )

            if (!data.system.characteristics.values) {
              data.system.characteristics.values = {}
            }
            data.system.characteristics.values.str =
              data.system.characteristics.list.str.value
            data.system.characteristics.values.con =
              data.system.characteristics.list.con.value
            data.system.characteristics.values.siz =
              data.system.characteristics.list.siz.value
            data.system.characteristics.values.dex =
              data.system.characteristics.list.dex.value
            data.system.characteristics.values.app =
              data.system.characteristics.list.app.value
            data.system.characteristics.values.int =
              data.system.characteristics.list.int.value
            data.system.characteristics.values.pow =
              data.system.characteristics.list.pow.value
            data.system.characteristics.values.edu =
              data.system.characteristics.list.edu.value
            data.system.characteristics.values.luck =
              data.system.characteristics.list.luck.value
            if (data.system.characteristics.points.enabled) {
              data.system.title = game.i18n.localize('CoC7.SpendPoints')
            } else {
              data.system.title = game.i18n.localize('CoC7.RollCharac')
            }
            data.system.pointsWarning = !(
              data.system.characteristics.values.str !== null &&
              data.system.characteristics.values.con !== null &&
              data.system.characteristics.values.siz !== null &&
              data.system.characteristics.values.dex !== null &&
              data.system.characteristics.values.app !== null &&
              data.system.characteristics.values.int !== null &&
              data.system.characteristics.values.pow !== null &&
              data.system.characteristics.values.edu !== null
            )
            const rolled = await CharacRollDialog.create(data.system)
            if (rolled) {
              const updateData = {}
              for (const key of [
                'str',
                'con',
                'siz',
                'dex',
                'app',
                'int',
                'pow',
                'edu'
              ]) {
                if (data.system.characteristics.values[key]) {
                  updateData[`system.characteristics.${key}.value`] =
                    data.system.characteristics.values[key]
                  updateData[`system.characteristics.${key}.formula`] =
                    data.system.characteristics.rolls[key]
                }
              }
              if (data.system.characteristics.values.luck) {
                updateData['system.attribs.lck.value'] =
                  data.system.characteristics.values.luck
              }
              if (data.system.characteristics.values.pow) {
                updateData['system.attribs.san.value'] =
                  data.system.characteristics.values.pow
                updateData['system.attribs.san.dailyLimit'] = Math.floor(
                  data.system.characteristics.values.pow / 5
                )
                updateData['system.attribs.mp.max'] = Math.floor(
                  data.system.characteristics.values.pow / 5
                )
              }
              await this.update(updateData, { renderSheet: false })
              await this.update({
                'system.attribs.hp.value': this.rawHpMax,
                'system.attribs.hp.max': this.rawHpMax
              }, { renderSheet: false })
            } else {
              return
            }
          }
          const era = Object.entries(data.flags?.CoC7?.cocidFlag?.eras).filter(e => e[1]).map(e => e[0])
          const items = await game.system.api.cocid.expandItemArray({ itemList: data.system.items, era: (typeof era[0] !== 'undefined' ? era[0] : true) })
          const skills = items.filter(it => it.type === 'skill')
          const othersItems = items.filter(it => it.type !== 'skill')
          await this.addUniqueItems(skills)
          await this.addItems(othersItems)
          if (game.settings.get('CoC7', 'oneBlockBackstory')) {
            await this.update({ 'system.backstory': data.system.backstory }, { renderSheet: false })
          } else {
            for (const sectionName of data.system.bioSections) {
              if (
                !this.system.biography?.find(
                  el => sectionName === el.title
                ) &&
                sectionName
              ) {
                await this.createBioSection(game.i18n.localize(sectionName))
              }
            }
          }
          // refactor this
          const monetary = foundry.utils.mergeObject(this.system.monetary, foundry.utils.duplicate(data.system.monetary))
          const sheet = this.sheet
          let state = false
          do {
            state = await new Promise(resolve => setTimeout(() => {
              resolve(sheet._state)
            }, 100))
          } while (state === Application.RENDER_STATES.RENDERING)
          await this.update({
            'system.monetary': monetary
          })
          Hooks.call('setupFinishedCoC7')
          break
        }
        case 'archetype':
          if (this.type === 'character') {
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
            for (const entry of Object.entries(data.system.coreCharacteristics)) {
              const [key, value] = entry
              data.system.coreCharacteristics[key] = false
              if (value) {
                const char = this.getCharacteristic(key)
                char.key = key
                coreCharac.push(char)
              }
            }

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
            data.system.coreCharacteristics[charac] = true
            if (data.system.coreCharacteristicsFormula.enabled) {
              let value = Number(data.system.coreCharacteristicsFormula.value)
              if (isNaN(value)) {
                const char = this.getCharacteristic(charac)
                const roll = new Roll(
                  data.system.coreCharacteristicsFormula.value
                )
                await roll.roll({ async: true })
                roll.toMessage({
                  flavor: game.i18n.format(
                    'CoC7.MessageRollingCharacteristic',
                    {
                      label: char.label,
                      formula: data.system.coreCharacteristicsFormula.value
                    }
                  )
                })
                value = char.value < roll.total ? roll.total : char.value
              }
              await this.update({
                [`system.characteristics.${charac}.value`]: value
              })
            }

            // Add all skills
            data.system.skills = await game.system.api.cocid.expandItemArray({ itemList: data.system.skills })
            await this.addUniqueItems(data.system.skills, 'archetype')

            processedDataArray.push(foundry.utils.duplicate(data))
            archetype = true
          }

          break
        case 'occupation':
          if (this.type === 'character') {
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

            // Convert CoCIDs to items
            data.system.skills = await game.system.api.cocid.expandItemArray({ itemList: data.system.skills })

            if (Number(data.system.creditRating.max) > 0) {
              // Occupations with a credit rating require a credit rating skill
              const actorCreditRating = game.system.api.cocid.findCocIdInList('i.skill.credit-rating', data.system.skills)
              if (actorCreditRating.length === 0) {
                if (game.system.api.cocid.findCocIdInList('i.skill.credit-rating', this.items).length === 0) {
                  data.system.skills.push('i.skill.credit-rating')
                  data.system.skills = await game.system.api.cocid.expandItemArray({ itemList: data.system.skills })
                }
              } else {
                if (game.system.api.cocid.findCocIdInList('i.skill.credit-rating', this.items).length === 0) {
                  data.system.skills.push(actorCreditRating[0])
                }
              }
            }

            // Select characteristic
            const pointsDialogData = {}
            pointsDialogData.characteristics = data.system.occupationSkillPoints
            let total = 0
            let optionalChar = false
            for (const entry of Object.entries(
              data.system.occupationSkillPoints
            )) {
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
            }
            pointsDialogData.total = total
            if (optionalChar) {
              // Is there any optional char to choose for points calc ?
              const result = await PointSelectDialog.create(pointsDialogData)
              if (!result) return // Point not selected => exit.
            }

            // Add optional skills
            for (let index = 0; index < data.system.groups.length; index++) {
              // Convert CoCIds to items
              data.system.groups[index].skills = await game.system.api.cocid.expandItemArray({ itemList: data.system.groups[index].skills })

              const dialogData = {}
              dialogData.skills = []
              dialogData.type = 'occupation'
              dialogData.actorId = this.id
              dialogData.optionsCount = Number(data.system.groups[index].options)
              dialogData.title = game.i18n.localize('CoC7.SkillSelectionWindow')

              // Select only skills that are not present or are not flagged as occupation.
              for (const value of data.system.groups[index].skills) {
                if (CoC7Item.isAnySpec(value)) dialogData.skills.push(value)
                // If it's a generic spec we always add it
                else {
                  const skill = this.items.find(item => {
                    return item.name === value.name && item.type === 'skill'
                  })
                  if (!skill || !skill.system.flags?.occupation) {
                    // if skill was added to skill list previously, remove it
                    const alreadySelectedSkill = data.system.skills.find(item => {
                      return item.name === value.name
                    })
                    if (!alreadySelectedSkill) dialogData.skills.push(value)
                  }
                }
              }

              // if there's none, do nothing.
              if (dialogData.skills.length !== 0) {
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
                    data.system.skills,
                    dialogData.skills
                  )
                  data.system.skills = merged
                } else {
                  // Wait for skill selection.
                  const selected = await SkillSelectDialog.create(dialogData)
                  if (!selected) return
                  const merged = CoC7Item.mergeOptionalSkills(
                    data.system.skills,
                    selected
                  )
                  data.system.skills = merged
                }
              } else {
                ui.notifications.info(
                  game.i18n.localize('CoC7.InfoAllSkillsAlreadySelected')
                )
              }
            }

            // Add extra skills
            if (Number(data.system.personal)) {
              const dialogData = {}
              dialogData.skills = []
              dialogData.type = 'occupation'
              dialogData.actorId = this.id
              dialogData.optionsCount = Number(data.system.personal)
              dialogData.title = game.i18n.format('CoC7.SelectPersonalSkills', {
                number: Number(data.system.personal)
              })

              // Select only skills that are not present or are not flagged as occupation.
              for (const s of this.skills) {
                // Select all skills that are not already flagged as occupation, can have adjustments and XP.
                if (
                  !s.system.flags.occupation &&
                  !s.system.properties.noadjustments &&
                  !s.system.properties.noxpgain
                ) {
                  // if skill already selected don't add it
                  const alreadySelectedSkill = data.system.skills.find(item => {
                    return item.name === s.name
                  })
                  if (!alreadySelectedSkill) dialogData.skills.push(s)
                }
              }

              // if there's none, do nothing.
              if (dialogData.skills.length !== 0) {
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
                    data.system.skills,
                    dialogData.skills
                  )
                  data.system.skills = merged
                } else {
                  // Wait for skill selection.
                  const selected = await SkillSelectDialog.create(dialogData) // Dialog data bug ???
                  if (!selected) return
                  const merged = CoC7Item.mergeOptionalSkills(
                    data.system.skills,
                    selected
                  )
                  data.system.skills = merged
                }
              } else {
                ui.notifications.info(
                  game.i18n.localize('CoC7.InfoAllSkillsAlreadySelected')
                )
              }
            }

            // Add all skills
            await this.addUniqueItems(data.system.skills, 'occupation')
            // Credit rating is always part of occupation
            await this.creditRatingSkill?.setItemFlag('occupation')
            // setting it to min credit rating
            await this.creditRatingSkill?.update({
              'system.adjustments.occupation': Number(data.system.creditRating.min)
            })

            processedDataArray.push(foundry.utils.duplicate(data))
            occupation = true
          }
          break

        case 'experiencePackage':
          if (this.experiencePackage) {
            // NOP
          } else if (game.settings.get('CoC7', 'pulpRuleArchetype')) {
            ui.notifications.error('CoC7.ErrorExperiencePackageArchetype', { localize: true })
          } else if (this.type !== 'character') {
            ui.notifications.error('CoC7.ErrorExperiencePackageNotInvestigator', { localize: true })
          } else if (!game.user.isGM) {
            ui.notifications.error('CoC7.ErrorExperiencePackageNotGM', { localize: true })
          } else {
            const rolled = await ExperiencePackageDialog.create(data.system)
            if (rolled) {
              data.system.skills = await game.system.api.cocid.expandItemArray({ itemList: data.system.skills })
              // Add optional skills
              for (let index = 0; index < data.system.groups.length; index++) {
                // Convert CoCIds to items
                data.system.groups[index].skills = await game.system.api.cocid.expandItemArray({ itemList: data.system.groups[index].skills })

                const dialogData = {}
                dialogData.skills = []
                dialogData.type = 'experiencePackage'
                dialogData.actorId = this.id
                dialogData.optionsCount = Number(data.system.groups[index].options)
                dialogData.title = game.i18n.localize('CoC7.SkillSelectionWindow')

                // Select only skills that are not present or are not flagged as occupation.
                for (const value of data.system.groups[index].skills) {
                  if (CoC7Item.isAnySpec(value)) {
                    // If it's a generic spec we always add it
                    dialogData.skills.push(value)
                  } else {
                    const skill = this.items.find(item => {
                      return item.name === value.name && item.type === 'skill'
                    })
                    if (!skill || !skill.system.flags?.occupation) {
                      // if skill was added to skill list previously, remove it
                      const alreadySelectedSkill = data.system.skills.find(item => {
                        return item.name === value.name
                      })
                      if (!alreadySelectedSkill) dialogData.skills.push(value)
                    }
                  }
                }

                // if there's none, do nothing.
                if (dialogData.skills.length !== 0) {
                  if (dialogData.skills.length <= dialogData.optionsCount) {
                    // If there's is less skill than options, add them all.
                    ui.notifications.info(
                      game.i18n.format('CoC7.InfoLessSkillThanOptions', {
                        skillCount: dialogData.skills.length,
                        optionsCount: dialogData.optionsCount
                      })
                    )
                    const merged = CoC7Item.mergeOptionalSkills(
                      data.system.skills,
                      dialogData.skills
                    )
                    data.system.skills = merged
                  } else {
                    // Wait for skill selection.
                    const selected = await SkillSelectDialog.create(dialogData)
                    if (!selected) return
                    const merged = CoC7Item.mergeOptionalSkills(
                      data.system.skills,
                      selected
                    )
                    data.system.skills = merged
                  }
                } else {
                  ui.notifications.info(
                    game.i18n.localize('CoC7.InfoAllSkillsAlreadySelected')
                  )
                }
              }
              // Add all skills
              await this.addUniqueItems(data.system.skills, 'experiencePackage')
              if (rolled['i.skill.cthulhu-mythos'] > 0) {
                let skill = this.getFirstItemByCoCID('i.skill.cthulhu-mythos')
                if (typeof skill === 'undefined') {
                  const skills = await game.system.api.cocid.fromCoCIDBest({ cocid: 'i.skill.cthulhu-mythos', showLoading: true })
                  if (skills.length) {
                    skill = foundry.utils.duplicate(skills[0])
                    skill.system.adjustments.experience = rolled['i.skill.cthulhu-mythos']
                    skill.system.value = Object.values(skill.system.adjustments).filter(v => v).reduce((c, v) => { c = c + parseInt(v, 10); return c }, 0)
                    console.log('skill', skill, skill.system.adjustments, skill.system.value)
                    processedDataArray.push(skill)
                  }
                } else {
                  itemChanges.push({
                    'system.adjustments.experience': parseInt(skill.system.adjustments.experience ?? 0, 10) + rolled['i.skill.cthulhu-mythos'],
                    'system.value': Object.values(skill.system.adjustments).filter(v => v).reduce((c, v) => { c = c + parseInt(v, 10); return c }, rolled['i.skill.cthulhu-mythos']),
                    _id: skill._id
                  })
                }
              }
              if (rolled.SAN > 0) {
                actorChanges['system.attribs.san.value'] = parseInt(this.system.attribs.san.value, 10) - rolled.SAN
              }
              if (rolled.encounters.length > 0) {
                actorChanges['system.sanityLossEvents'] = this.system.sanityLossEvents.concat(rolled.encounters)
              }
              if (rolled.backstory.length > 0) {
                actorChanges['system.biography'] = this.system.biography
                const name = game.i18n.localize('CoC7.CoCIDFlag.keys.rt..backstory-injuries-and-scars')
                const index = actorChanges['system.biography'].findIndex(b => b.title === name)
                if (index > -1) {
                  actorChanges['system.biography'][index].value = actorChanges['system.biography'][index].value + rolled.backstory.join('')
                } else {
                  actorChanges['system.biography'].push({
                    title: name,
                    value: rolled.backstory.join('')
                  })
                }
              }
              for (const doc of rolled.items) {
                processedDataArray.push(foundry.utils.duplicate(doc))
              }
              actorChanges['system.development.experiencePackage'] = data.system.points
              processedDataArray.push(foundry.utils.duplicate(data))
            }
          }
          break

        default:
          processedDataArray.push(foundry.utils.duplicate(data))
      }
    }
    if (processedDataArray.length === 0) {
      return []
    }
    const processed = await super.createEmbeddedDocuments(
      embeddedName,
      processedDataArray,
      options
    )

    if (archetype) {
      // setting points
      await this.update({
        'system.development.archetype': this.archetypePoints
      })
      Hooks.call('archetypeFinishedCoC7')
    }
    if (occupation) {
      // setting points
      await this.update({
        'system.development.occupation': this.occupationPoints,
        'system.development.personal': this.personalPoints
      })
      Hooks.call('occupationFinishedCoC7')
    }

    if (Object.keys(actorChanges).length > 0 || itemChanges.length > 0) {
      // Doesn't work without delay (with other changes)
      const actor = this
      setTimeout(async function () {
        if (Object.keys(actorChanges).length > 0) {
          await actor.update(actorChanges, { renderSheet: true })
        }
        if (itemChanges.length > 0) {
          await actor.updateEmbeddedDocuments('Item', itemChanges, { renderSheet: true })
        }
      }, 1000)
    }

    return processed
  }

  // getSkillIdByName( skillName){
  //   let id = null;
  //    for (const [map, key, value] of this.items) {
  //     if( value.name == skillName) id = value.id;
  //   };

  //   return id;
  // }

  getItemIdByName (itemName) {
    let id = null
    const name = itemName.match(/\(([^)]+)\)/)
      ? itemName.match(/\(([^)]+)\)/)[1]
      : itemName
    for (const value of this.items) {
      if (
        CoC7Item.getNameWithoutSpec(value).toLowerCase() === name.toLowerCase()
      ) {
        id = value.id
      }
    }

    return id
  }

  getItemsByName (itemName) {
    const itemList = []
    for (const value of this.items) {
      if (value.name === itemName) itemList.push(value)
    }

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

    for (const value of this.items) {
      if (
        (
          CoC7Item.getNameWithoutSpec(value).toLowerCase() === name.toLowerCase() ||
          value.flags?.CoC7?.cocidFlag?.id === skillName
        ) &&
        value.type === 'skill'
      ) {
        skillList.push(value)
      }
    }
    return skillList
  }

  getFirstItemByCoCID (cocid) {
    return this.items.find(i => i.flags?.CoC7?.cocidFlag?.id === cocid)
  }

  // parseFormula (formula) {
  //   let parsedFormula = formula
  //   for (const [key, value] of Object.entries(COC7.formula.actor)) {
  //     parsedFormula = parsedFormula.replace(key, value)
  //   }
  //   return parsedFormula
  // }

  parseCharacteristics () {
    const parsed = {}
    for (const [key, value] of Object.entries(COC7.formula.actor)) {
      if (key.startsWith('@') && value.startsWith('this.')) {
        parsed[key.substring(1)] = foundry.utils.getProperty(this, value.substring(5))
      }
    }
    return parsed
  }

  static getCharacteristicDefinition () {
    const characteristics = []
    /* // FoundryVTT v11 */
    const characteristicList = (!foundry.utils.isNewerVersion(game.version, '12') ? game.system.template.Actor.templates.characteristics.characteristics : game.system.template.Actor.character.characteristics)
    for (const [key, value] of Object.entries(characteristicList)) {
      characteristics.push({
        key,
        shortName: game.i18n.localize(value.short),
        label: game.i18n.localize(value.label)
      })
    }
    return characteristics
  }

  getCharacteristic (charName) {
    if (this.system.characteristics) {
      for (const [key, value] of Object.entries(
        this.system.characteristics
      )) {
        if (
          game.i18n.localize(value.short).toLowerCase() ===
            charName.toLowerCase() ||
          game.i18n.localize(value.label).toLowerCase() ===
            charName.toLowerCase() ||
          key === charName.toLowerCase()
        ) {
          return {
            key,
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
        value: this.system.attribs.lck.value
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
        value: this.system.attribs.san.value
      }
    }
    return null
  }

  async runRoll (options = {}) {
    if (typeof options.cardType === 'undefined') {
      options.cardType = CoC7ChatMessage.CARD_TYPE_NORMAL
    }
    if (typeof options.preventStandby === 'undefined') {
      options.preventStandby = true
    }
    options.actor = this
    const results = await CoC7ChatMessage.trigger(options)
    return results
  }

  get occupation () {
    const occupation = this.items.filter(item => item.type === 'occupation')
    return occupation[0]
  }

  get archetype () {
    const archetype = this.items.filter(item => item.type === 'archetype')
    return archetype[0]
  }

  get experiencePackage () {
    return this.items.find(item => item.type === 'experiencePackage')
  }

  async resetExperiencePackage () {
    const skills = this.items.filter(item =>
      item.getItemFlag('experiencePackage')
    )
    for (let index = 0; index < skills.length; index++) {
      await skills[index].unsetItemFlag('occupation')
    }
    if (this.experiencePackage) await this.experiencePackage.delete()
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
    await this.update({ 'system.development.occupation': null })
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
    await this.update({ 'system.development.archetype': null })
  }

  get luck () {
    return parseInt(this.system.attribs?.lck?.value)
  }

  async setLuck (value) {
    return await this.update({ 'system.attribs.lck.value': value })
  }

  async spendLuck (amount) {
    amount = parseInt(amount)
    if (!(this.luck >= amount)) return false
    return this.setLuck(this.luck - amount)
  }

  get hp () {
    return parseInt(this.system.attribs.hp.value)
  }

  get rawHpMax () {
    if (this.system.attribs.hp.auto) {
      if (
        this.system.characteristics.siz.value != null &&
        this.system.characteristics.con.value != null
      ) {
        return CoCActor.hpFromCharacteristics(this.system.characteristics, this.type)
      }
      if (this.system.attribs.hp.max) {
        return parseInt(this.system.attribs.hp.max)
      }
      return null
    }
    return parseInt(this.system.attribs.hp.max)
  }

  get hpMax () {
    return parseInt(this.system.attribs.hp.max)
  }

  async _setHp (value) {
    if (value < 0) value = 0
    if (value > this.system.attribs.hp.max) {
      value = parseInt(this.system.attribs.hp.max)
    }
    return await this.update({ 'system.attribs.hp.value': value })
  }

  async addUniqueItems (skillList, flag = null) {
    const processed = []
    for (let skill of skillList) {
      skill = foundry.utils.duplicate(skill)
      if (flag) {
        if (!Object.prototype.hasOwnProperty.call(skill.system, 'flags')) {
          skill.system.flags = {}
        }
        skill.system.flags[flag] = true
      }
      if (CoC7Item.isAnySpec(skill)) {
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

  async addItems (itemList, flag = null) {
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
    return await this.createEmbeddedDocuments('Item', processed, {
      renderSheet: false
    })
  }

  async addUniqueItem (skill, flag = null) {
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

  get rawMpMax () {
    if (this.system.attribs.mp.auto) {
      if (this.system.characteristics.pow.value != null) {
        return CoCActor.mpFromCharacteristics(this.system.characteristics)
      } else return 0
    }
    return parseInt(this.system.attribs.mp.max)
  }

  getReasonSanLoss (sanReason) {
    if (typeof sanReason === 'string') {
      return (
        this.system.sanityLossEvents.filter(
          r => r.type.toLocaleLowerCase() === sanReason.toLocaleLowerCase()
        )[0] ?? { type: '', totalLoss: 0, immunity: false }
      )
    }
    return { type: '', totalLoss: 0, immunity: false }
  }

  sanLostToReason (sanReason) {
    if (sanReason) {
      const sanityLossEvent = this.getReasonSanLoss(sanReason)
      return sanityLossEvent.totalLoss
    }
    return 0
  }

  sanLossReasonEncountered (sanReason) {
    if (sanReason) {
      const sanityLossEvent = this.getReasonSanLoss(sanReason)
      return sanityLossEvent.type !== ''
    }
    return false
  }

  setReasonSanLoss (sanReason, sanLoss) {
    if (typeof sanReason === 'string' && sanReason !== '') {
      const sanityLossEvents = foundry.utils.duplicate(this.system.sanityLossEvents)
      const index = sanityLossEvents.findIndex(
        r => r.type.toLocaleLowerCase() === sanReason.toLocaleLowerCase()
      )
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
  }

  maxLossToSanReason (sanReason, sanMaxFormula) {
    const sanMax = new Roll(sanMaxFormula.toString())[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
    const sanityLossEvent = this.getReasonSanLoss(sanReason)
    if (sanityLossEvent.immunity) {
      return 0
    }
    return Math.max(0, sanMax - sanityLossEvent.totalLoss)
  }

  async looseSan (sanReason, sanLoss) {
    const sanityLossEvent = this.getReasonSanLoss(sanReason)
    if (!sanityLossEvent.immunity) {
      await this.setSan(this.san - sanLoss)
      if (sanLoss > 0) this.setReasonSanLoss(sanReason, sanLoss)
      return sanLoss
    }
    return 0
  }

  sanLoss (checkPassed) {
    if (checkPassed) return this.sanLossCheckPassed
    return this.sanLossCheckFailled
  }

  get sanLossCheckPassed () {
    return this.system.special?.sanLoss?.checkPassed
  }

  get sanLossCheckFailled () {
    return this.system.special?.sanLoss?.checkFailled
  }

  get sanLossMax () {
    if (this.sanLossCheckFailled) {
      if (!isNaN(Number(this.sanLossCheckFailled))) {
        return Number(this.sanLossCheckFailled)
      }
      return new Roll(this.sanLossCheckFailled)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
    }
    return 0
  }

  get sanLossMin () {
    if (this.sanLossCheckPassed) {
      if (!isNaN(Number(this.sanLossCheckPassed))) {
        return Number(this.sanLossCheckPassed)
      }
      return new Roll(this.sanLossCheckPassed)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
    }
    return 0
  }

  get dailySanLoss () {
    return this.system.attribs.san?.dailyLoss || 0
  }

  get dailySanLimit () {
    return this.system.attribs.san?.dailyLimit || 0
  }

  get rawSanMax () {
    if (!this.system.attribs) return undefined
    if (this.system.attribs?.san?.auto) {
      if (this.cthulhuMythos) return Math.max(99 - this.cthulhuMythos, 0)
      return 99
    }
    return parseInt(this.system.attribs.san.max)
  }

  get sanMax () {
    return parseInt(this.system.attribs.san.max)
  }

  get mp () {
    return parseInt(this.system.attribs.mp.value)
  }

  get mpMax () {
    if (this.system.attribs.mp.auto) {
      // TODO if any is null set max back to null.
      if (this.system.characteristics.pow.value != null) {
        return Math.floor(this.system.characteristics.pow.value / 5)
      }
      return 0
    }
    return parseInt(this.system.attribs.mp.max)
  }

  async setMp (value) {
    if (value < 0) value = 0
    if (value > parseInt(this.system.attribs.mp.max)) { value = parseInt(this.system.attribs.mp.max) }
    return await this.update({ 'system.attribs.mp.value': value })
  }

  get san () {
    return parseInt(this.system.attribs.san.value)
  }

  get int () {
    return this.getCharacteristic('int')
  }

  get occupationPointsSpent () {
    let occupationPoints = 0
    for (const skill of this.skills) {
      if (skill.system.adjustments?.occupation) {
        occupationPoints += skill.system.adjustments.occupation
      }
    }
    return occupationPoints
  }

  get occupationPoints () {
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

  async resetOccupationPoints () {
    await this.update({
      'system.development.occupation': this.occupationPoints
    })
  }

  async resetArchetypePoints () {
    await this.update({
      'system.development.archetype': this.occupationPoints
    })
  }

  async resetPersonalPoints () {
    await this.update({
      'system.development.personal': this.personalPoints
    })
  }

  get ExperiencePackagePointsSpent () {
    let count = 0
    for (const skill of this.skills) {
      if (skill.system.adjustments?.experiencePackage) {
        count += skill.system.adjustments.experiencePackage
      }
    }
    return count
  }

  get ExperiencePackagePoints () {
    if (!this.experiencePackage) return 0
    return this.experiencePackage.system.points
  }

  get archetypePointsSpent () {
    let archetypePoints = 0
    for (const skill of this.skills) {
      if (skill.system.adjustments?.archetype) {
        archetypePoints += skill.system.adjustments.archetype
      }
    }
    return archetypePoints
  }

  get archetypePoints () {
    if (!this.archetype) return 0
    return this.archetype.system.bonusPoints
  }

  get experiencePoints () {
    let experiencePoints = 0
    for (const skill of this.skills) {
      if (skill.system.adjustments?.experience) {
        experiencePoints += skill.system.adjustments.experience
      }
    }
    return experiencePoints
  }

  get personalPointsSpent () {
    let personalPoints = 0
    for (const skill of this.skills) {
      if (skill.system.adjustments?.personal) {
        personalPoints += skill.system.adjustments.personal
      }
    }
    return personalPoints
  }

  get personalPoints () {
    return 2 * Number(this.system.characteristics.int.value)
  }

  get hasDevelopmentPhase () {
    for (const skill of this.skills) {
      if (skill.system.flags?.developement) return true
    }
    if (this.onlyRunOncePerSession) {
      return false
    }
    for (const sanityLossEvent of this.system.sanityLossEvents) {
      if (!sanityLossEvent.immunity) return true
    }
    return false
  }

  async setSan (value) {
    if (value < 0) value = 0
    if (value > this.system.attribs.san.max) { value = this.system.attribs.san.max }
    const loss = parseInt(this.system.attribs.san.value) - value

    if (loss > 0) {
      let totalLoss = parseInt(this.system.attribs.san.dailyLoss)
        ? parseInt(this.system.attribs.san.dailyLoss)
        : 0
      totalLoss = totalLoss + loss
      if (loss >= 5) await this.setCondition(COC7.status.tempoInsane)
      if (totalLoss >= this.system.attribs.san.dailyLimit) {
        await this.setCondition(COC7.status.indefInsane)
      }
      await this.update({
        'system.attribs.san.value': value,
        'system.attribs.san.dailyLoss': totalLoss
      })
    } else await this.update({ 'system.attribs.san.value': value })
    return value
  }

  async setAttribAuto (value, attrib) {
    const updatedKey = `system.attribs.${attrib}.auto`
    return await this.update({ [updatedKey]: value })
  }

  async toggleAttribAuto (attrib) {
    this.setAttribAuto(!this.system.attribs[attrib].auto, attrib)
  }

  static dbFromCharacteristics (characteristics) {
    const sum = (characteristics.str.value ?? 0) + (characteristics.siz.value ?? 0)
    if (sum < 65) return -2
    if (sum < 85) return -1
    if (sum < 125) return 0
    if (sum < 165) return '1D4'
    return `${Math.floor((sum - 45) / 80)}D6`
  }

  static buildFromCharacteristics (characteristics) {
    const sum = (characteristics.str.value ?? 0) + (characteristics.siz.value ?? 0)
    if (sum < 65) return -2
    if (sum < 85) return -1
    if (sum < 125) return 0
    if (sum < 165) return 1
    return Math.floor((sum - 45) / 80) + 1
  }

  static hpFromCharacteristics (characteristics, type) {
    const sum = parseInt(characteristics.siz.value ?? 0, 10) + parseInt(characteristics.con.value ?? 0, 10)
    const divisor = (game.settings.get('CoC7', 'pulpRuleDoubleMaxHealth') && type === 'character' ? 5 : 10)
    return Math.floor(sum / divisor)
  }

  static mpFromCharacteristics (characteristics) {
    return Math.floor(characteristics.pow.value / 5)
  }

  static movFromCharacteristics (characteristics, type, age) {
    let MOV
    if (characteristics.dex.value > characteristics.siz.value && characteristics.str.value > characteristics.siz.value) {
      MOV = 9 // Bug correction by AdmiralNyar.
    } else if (characteristics.dex.value >= characteristics.siz.value || characteristics.str.value >= characteristics.siz.value) {
      MOV = 8
    } else {
      MOV = 7
    }
    if (type !== 'creature' && !game.settings.get('CoC7', 'pulpRuleIgnoreAgePenalties')) {
      if (!isNaN(parseInt(age))) {
        MOV = parseInt(age) >= 40 ? MOV - Math.floor(parseInt(age) / 10) + 3 : MOV
      }
    }
    return Math.max(0, MOV)
  }

  get rawBuild () {
    if (!this.system.attribs) return null
    if (!this.system.attribs.build) return null
    if (this.system.attribs.build.value === 'auto') {
      this.system.attribs.build.auto = true
    }
    if (this.system.attribs.build.auto) {
      return CoCActor.buildFromCharacteristics(this.system.characteristics)
    }

    return this.system.attribs.build.value
  }

  get build () {
    return this.system.attribs.build.value
  }

  get rawDb () {
    if (!this.system.attribs) return null
    if (!this.system.attribs.db) return null
    if (this.system.attribs.db.value === 'auto') {
      this.system.attribs.db.auto = true
    }
    if (this.system.attribs.db.auto) {
      return CoCActor.dbFromCharacteristics(this.system.characteristics)
    }
    return this.system.attribs.db.value
  }

  get db () {
    return this.system.attribs.db.value
  }

  get rawMov () {
    if (!this.system.attribs) return null
    if (!this.system.attribs.mov) return null
    if (this.system.attribs.mov.value === 'auto') {
      this.system.attribs.mov.auto = true
    }
    if (this.system.attribs.mov.auto) {
      const MOV = CoCActor.movFromCharacteristics(this.system.characteristics, this.system.type, this.system.infos.age)
      if (MOV > 0) return MOV
    }
    return this.system.attribs.mov.value
  }

  get mov () {
    return this.system.attribs.mov.value
  }

  get tokenId () {
    // TODO clarifier ca et tokenkey
    return this.token ? `${this.token.scene._id}.${this.token.id}` : null // REFACTORING (2)
  }

  get locked () {
    if (!this.system.flags) {
      this.system.flags = {}
      this.system.flags.locked = true // Locked by default
      this.update({ 'system.flags': {} })
      this.update({ 'system.flags.locked': false })
    }

    return this.system.flags.locked
  }

  getItemsFromName (name) {
    return this.items.filter(i => i.name === name)
  }

  set locked (value) {
    this.update({ 'system.flags.locked': value })
  }

  async toggleActorFlag (flagName) {
    const flagValue = !this.system.flags[flagName]
    const name = `system.flags.${flagName}`
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

  static toolTipSkillText () {
    if (
      typeof game.CoC7Tooltips.ToolTipHover !== 'undefined' &&
      game.CoC7Tooltips.ToolTipHover !== null
    ) {
      const isCombat = game.CoC7Tooltips.ToolTipHover.classList?.contains(
        'combat'
      )
      const skillId = game.CoC7Tooltips.ToolTipHover.closest('.item')?.dataset.skillId
      const actorAppId = game.CoC7Tooltips.ToolTipHover.closest('.window-app')?.dataset?.appid
      if (typeof skillId !== 'undefined' && typeof actorAppId !== 'undefined' && typeof ui.windows[actorAppId]?.actor?.id !== 'undefined') {
        const actorId = ui.windows[actorAppId].actor.id
        const actor = game.actors.get(actorId)
        if (actor) {
          const skill = actor.items.get(skillId)
          if (skill) {
            let toolTip = game.i18n.format(
              isCombat ? 'CoC7.ToolTipCombat' : 'CoC7.ToolTipSkill',
              {
                skill: skill.name,
                regular: skill.value,
                hard: Math.floor(skill.value / 2),
                extreme: Math.floor(skill.value / 5)
              }
            )
            if (game.user.isGM) {
              toolTip =
                toolTip +
                game.i18n.format('CoC7.ToolTipKeeperSkill', {
                  other:
                    game.settings.get('CoC7', 'stanbyGMRolls') &&
                    actor.hasPlayerOwner
                      ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
                        name: actor.name
                      })
                      : ''
                })
            }
            return toolTip
          }
        }
      }
    }
    return false
  }

  async getItemOrAdd (itemIdentifier, type = 'skill') {
    const typeCoCID = itemIdentifier.match(/^i\.([^\\.]+)\../)
    if (typeCoCID) {
      // Attempt to load from actor by CoC ID
      let item = this.getFirstItemByCoCID(itemIdentifier)
      if (!item) {
        const newItems = await game.system.api.cocid.fromCoCIDBest({ cocid: itemIdentifier, showLoading: true })
        if (newItems.length === 1) {
          await this.createEmbeddedDocuments('Item', newItems)
          item = this.getFirstItemByCoCID(itemIdentifier)
          if (item) {
            if (item.type === 'skill') {
              ui.notifications.info(game.i18n.format('CoC7.InfoSkillAddedAtBase', {
                name: item.name,
                percent: item.value
              }))
            } else if (item.type === 'weapon') {
              await item.reload()
              const updates = {}
              if (item.system.skill.main.id === '' && item.system.skill.main.name !== '') {
                const skill = await this.getItemOrAdd(item.system.skill.main.name, 'skill')
                if (skill.length) {
                  updates['system.skill.main.id'] = skill[0].id
                  updates['system.skill.main.name'] = skill[0].name
                }
              }
              if (item.system.skill.alternativ.id === '' && item.system.skill.alternativ.name !== '') {
                const skill = await this.getItemOrAdd(item.system.skill.alternativ.name, 'skill')
                if (skill.length) {
                  updates['system.skill.alternativ.id'] = skill[0].id
                  updates['system.skill.alternativ.name'] = skill[0].name
                }
              }
              if (Object.keys(updates).length) {
                await item.update(updates)
              }
            }
          }
        }
      }
      if (item) {
        return [item]
      }
    }
    // Attempt to load for actor by name
    let myItems = this.getSkillsByName(itemIdentifier)
    if (!myItems.length) {
      const era = game.settings.get('CoC7', 'worldEra')
      // Attempt to load item from world
      const newItem = game.items.find((d) => {
        if (d.type === type && d.name === itemIdentifier) {
          const eras = newItem.flags?.CoC7?.cocidFlag?.eras
          if (eras && Object.keys(eras).length > 0 && !(eras[era] ?? false)) {
            return false
          } else {
            return true
          }
        }
        return false
      })
      if (newItem) {
        myItems.push(newItem)
      }
      if (myItems.length === 0) {
        // Attempt to load item from compendiums
        for (const pack of game.packs) {
          if (pack.metadata?.type === 'Item') {
            await pack.getDocuments()
            const newItem = game.items.find((d) => {
              if (d.type === type && d.name === itemIdentifier) {
                const eras = newItem.flags?.CoC7?.cocidFlag?.eras
                if (eras && Object.keys(eras).length > 0 && !(eras[era] ?? false)) {
                  return false
                } else {
                  return true
                }
              }
              return false
            })
            if (newItem) {
              myItems.push(newItem)
            }
          }
        }
      }
      if (myItems.length === 1) {
        await this.createEmbeddedDocuments('Item', myItems)
        myItems = this.getSkillsByName(itemIdentifier)
        if (myItems.length === 1) {
          if (myItems[0].type === 'skill') {
            ui.notifications.info(game.i18n.format('CoC7.InfoSkillAddedAtBase', {
              name: myItems[0].name,
              percent: myItems[0].value
            }))
          } else if (myItems[0].type === 'weapon') {
            await myItems[0].reload()
            const updates = {}
            if (myItems[0].system.skill.main.id === '' && myItems[0].system.skill.main.name !== '') {
              const skill = await this.getItemOrAdd(myItems[0].system.skill.main.name, 'skill')
              if (skill.length) {
                updates['system.skill.main.id'] = skill[0].id
                updates['system.skill.main.name'] = skill[0].name
              }
            }
            if (myItems[0].system.skill.alternativ.id === '' && myItems[0].system.skill.alternativ.name !== '') {
              const skill = await this.getItemOrAdd(myItems[0].system.skill.alternativ.name, 'skill')
              if (skill.length) {
                updates['system.skill.alternativ.id'] = skill[0].id
                updates['system.skill.alternativ.name'] = skill[0].name
              }
            }
            if (Object.keys(updates).length) {
              await myItems[0].update(updates)
            }
          }
        }
      }
    }
    return myItems
  }

  async skillCheck (skillData, fastForward, options = {}) {
    const skillIdentifier = skillData.name ? skillData.name : skillData
    let skill = await this.getItemOrAdd(skillIdentifier, 'skill')
    if (skill.length) {
      options.name = skill[0].name
    }
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
          game.i18n.format('CoC7.NoSkill') + ' ' +
            game.i18n.format('CoC7.ErrorNotFoundForActor', {
              missing: skillIdentifier,
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
        await this.createEmbeddedDocuments('Item', [foundry.utils.duplicate(item)])
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

    if (typeof options.modifier !== 'undefined') {
      check.diceModifier = Number(options.modifier)
    }
    if (typeof options.difficulty !== 'undefined') {
      check.difficulty = CoC7Utilities.convertDifficulty(options.difficulty)
    }

    if (!fastForward) {
      if (typeof options.difficulty === 'undefined' || typeof options.modifier === 'undefined') {
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
    if (options.pushing === 'false') check.pushing = false
    else check.pushing = !!options.pushing
    await check.roll()
    check.toMessage(check.pushing)
    return check
  }

  async weaponCheck (weaponData, fastForward = false) {
    let weapon
    if (typeof weaponData.uuid !== 'undefined') {
      weapon = await fromUuid(weaponData.uuid)
    }
    if (typeof weaponData.id !== 'undefined') {
      weapon = this.items.get(weaponData.id)
    }
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
            game.i18n.format('CoC7.ErrorActorHasNoWeaponNamed', {
              actorName: this.name,
              weaponName: weaponData.name
            })
          )
          return
        }
      } else if (weapons.length > 1) {
        ui.notifications.warn(
          game.i18n.format('CoC7.ErrorActorHasTooManyWeaponsNamed', {
            actorName: this.name,
            weaponName: weaponData.name
          })
        )
      }
      weapon = weapons[0]
    }

    if (!weapon.system.properties.rngd) {
      if (game.user.targets.size > 1) {
        ui.notifications.warn(game.i18n.localize('CoC7.WarnTooManyTarget'))
      }

      const card = new CoC7MeleeInitiator(this.tokenKey, (weaponData.uuid || weapon.id), fastForward)
      card.createChatCard()
    }
    if (weapon.system.properties.rngd) {
      const card = new CoC7RangeInitiator(this.tokenKey, (weaponData.uuid || weapon.id), fastForward)
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
          roll.successLevel + this.system.characteristics.dex.value / 100
        )
      }

      default:
        return hasGun
          ? this.system.characteristics.dex.value + 50
          : this.system.characteristics.dex.value
    }
  }

  getActorFlag (flagName) {
    if (!this.system.flags) {
      this.system.flags = {}
      this.system.flags.locked = true
      this.update({ 'system.flags': {} })
      return false
    }

    if (!this.system.flags[flagName]) return false
    return this.system.flags[flagName]
  }

  async setActorFlag (flagName) {
    await this.update({ [`system.flags.${flagName}`]: true })
  }

  async unsetActorFlag (flagName) {
    await this.update({ [`system.flags.${flagName}`]: false })
  }

  getWeaponSkills (itemId) {
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

    if (weapon.usesAlternativeSkill && weapon.system.skill.alternativ.id) {
      skills.push(this.items.get(weapon.system.skill.alternativ.id))
    }
    return skills
  }

  /** Try to find a characteristic, attribute or skill that matches the name */
  find (name) {
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

  get pilotSkills () {
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

  get driveSkills () {
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

  get tokenUuid () {
    if (this.sheet.token) {
      return this.sheet.token.uuid
    }
    return null
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
    if (this.prototypeToken.actorLink) return this.id // REFACTORING (2)
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

  get hasRollableCharacteristics () {
    for (const [, value] of Object.entries(this.system.characteristics)) {
      if (isNaN(Number(value.formula))) return true
    }
    return false
  }

  get hosRollableSkills () {
    for (const skill of this.skills) {
      if (isNaN(skill.system?.value)) return true
    }
    return false
  }

  /**
   * Use the formula if available to roll some characteritics.
   */
  async rollCharacteristicsValue () {
    const characteristics = {}
    for (const [key, value] of Object.entries(this.system.characteristics)) {
      if (value.formula && !value.formula.startsWith('@')) {
        const r = new Roll(value.formula)
        await r.roll({ async: true })
        if (r.total) {
          characteristics[`system.characteristics.${key}.value`] = Math.floor(
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
    for (const [key, value] of Object.entries(this.system.characteristics)) {
      if (value.formula && !value.formula.startsWith('@')) {
        const average = new AverageRoll('(' + value.formula + ')')[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ minimize: true, maximize: true }).total
        characteristics[`system.characteristics.${key}.value`] = average
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
    for (const [key, value] of Object.entries(this.system.characteristics)) {
      if (value.formula && value.formula.startsWith('@')) {
        let charValue
        try {
          charValue = new Roll(
            value.formula,
            this.parseCharacteristics()
          )[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
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
    let skillsRolled = 0
    let message = '<p class="chat-card">'
    for (const item of this.items) {
      if (item.type === 'skill') {
        if (item.developementFlag) {
          skillsRolled++
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
                  sanGained,
                  skill: item.name,
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
                item: item.name,
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
                item: item.name,
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
    const sanityLossEvents = []
    let changed = false
    for (const sanityLossEvent of this.system.sanityLossEvents) {
      if (sanityLossEvent.immunity) {
        sanityLossEvents.push(sanityLossEvent)
      } else if (sanityLossEvent.totalLoss > 1) {
        sanityLossEvent.totalLoss--
        sanityLossEvents.push(sanityLossEvent)
        changed = true
      } else {
        changed = true
      }
    }
    if (changed) {
      if (skillsRolled) {
        message += '<br>'
      }
      message += `<span>${game.i18n.format('CoC7.ReduceSanityLimits')}</span>`
      await this.update({
        'system.sanityLossEvents': sanityLossEvents
      })
    }
    if (!fastForward) {
      message += '</p>'
      const speaker = { actor: this }
      await chatHelper.createMessage(skillsRolled ? title : '', message, {
        speaker
      })
      this.onlyRunOncePerSession = true
    }
    return { failure, success }
  }

  async developLuck (fastForward = false) {
    const currentLuck = this.system.attribs.lck.value
    if (!currentLuck) await this.update({ 'system.attribs.lck.value': 0 })
    const pulpRuleDevelopmentRollLuck = game.settings.get(
      'CoC7',
      'pulpRuleDevelopmentRollLuck'
    )
    const upgradeRoll = (await new Roll('1D100').roll({ async: true })).total
    const higherThanCurrentLuck = upgradeRoll > currentLuck
    let augmentRoll
    if (pulpRuleDevelopmentRollLuck) {
      higherThanCurrentLuck
        ? (augmentRoll = '2D10+10')
        : (augmentRoll = '1D10+5')
    } else if (higherThanCurrentLuck) {
      augmentRoll = '1D10'
    }
    const title = game.i18n.localize('CoC7.RollLuck4Dev')
    let message = '<p class="chat-card">'
    if (pulpRuleDevelopmentRollLuck || higherThanCurrentLuck) {
      const augmentValue = (await new Roll(augmentRoll).roll({ async: true }))
        .total
      await this.update({
        'system.attribs.lck.value':
          this.system.attribs.lck.value + augmentValue
      })
      message += `<span class="upgrade-success">${game.i18n.format(
        'CoC7.LuckIncreased',
        {
          die: upgradeRoll,
          score: currentLuck,
          augment: augmentValue
        }
      )}</span>`
    } else {
      message += `<span class="upgrade-failed">${game.i18n.format(
        'CoC7.LuckNotIncreased',
        { die: upgradeRoll, score: currentLuck }
      )}</span>`
    }
    if (!fastForward) {
      message += '</p>'
      const speaker = { actor: this }
      await chatHelper.createMessage(title, message, { speaker })
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
    await chatHelper.createMessage(title, message, { speaker })
    await skill.unflagForDevelopement()
  }

  hasConditionStatus (conditionName) {
    const conditionValue = this.system.conditions?.[conditionName]?.value
    if (typeof conditionValue !== 'boolean') {
      return false // Necessary, incorrect template initialization
    }
    return conditionValue
  }

  hasConditionValue (conditionName, field) {
    if (!this.hasConditionStatus(conditionName)) {
      return undefined
    }
    if (conditionName === COC7.status.tempoInsane && field === 'durationText') {
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

  async toggleCondition (conditionName) {
    const conditionValue = this.hasConditionStatus(conditionName)
    if (!conditionValue) {
      await this.setCondition(conditionName)
    } else {
      await this.unsetCondition(conditionName)
    }
  }

  async setCondition (
    conditionName,
    {
      forceValue = false,
      justThis = false,
      realTime = null,
      duration = null
    } = {}
  ) {
    if (!forceValue && game.settings.get('CoC7', 'enableStatusIcons')) {
      const effects = this.effects
        .filter(effect => CoC7ActiveEffect.filterActiveEffects(effect, conditionName))
        .map(effect => effect.id)
      const custom = {}
      switch (conditionName) {
        case COC7.status.dead:
          custom.flags = {
            core: {
              overlay: true
            }
          }
          break
        case COC7.status.tempoInsane:
          custom.flags = {
            CoC7: {
              realTime: undefined
            }
          }
          custom.duration = {
            rounds: undefined,
            seconds: undefined
          }
          if (realTime === true || realTime === false) {
            custom.flags.CoC7.realTime = realTime
            custom.flags = {
              CoC7: {
                realTime
              }
            }
            if (duration !== null && typeof duration !== 'undefined') {
              if (realTime) {
                custom.duration.rounds = duration
              } else {
                custom.duration.seconds = duration * 3600
              }
            }
          }
          break
      }
      if (effects.length === 0) {
        const effect = CONFIG.statusEffects.filter(
          effect => effect.id === conditionName
        )
        if (effect.length === 1) {
          const source = {
            icon: effect[0].icon,
            disabled: false
          }
          source.name = game.i18n.localize(effect[0].name)
          source.statuses = [effect[0].id]
          const effectData = foundry.utils.mergeObject(source, custom)
          await super.createEmbeddedDocuments('ActiveEffect', [effectData])
        } else {
          // This doesn't exist in FoundryVTT ActiveEffects?
          forceValue = true
        }
      } else {
        custom._id = effects[0]
        await super.updateEmbeddedDocuments('ActiveEffect', [custom])
        forceValue = true
      }
    }
    if (forceValue || !game.settings.get('CoC7', 'enableStatusIcons')) {
      switch (conditionName) {
        case COC7.status.indefInsane:
        case COC7.status.unconscious:
        case COC7.status.criticalWounds:
        case COC7.status.dying:
        case COC7.status.prone:
        case COC7.status.dead:
          await this.update({
            [`system.conditions.${conditionName}.value`]: true
          })
          break
        case COC7.status.tempoInsane:
          {
            const fields = {}
            fields[`system.conditions.${conditionName}.value`] = true
            if (realTime === true || realTime === false) {
              fields[`system.conditions.${conditionName}.realTime`] = realTime
              if (duration !== null && typeof duration !== 'undefined') {
                fields[`system.conditions.${conditionName}.duration`] = duration
              }
            }
            if (
              !Object.prototype.hasOwnProperty.call(
                fields,
                `system.conditions.${conditionName}.realTime`
              )
            ) {
              fields[`system.conditions.${conditionName}.-=realTime`] = null
            }
            if (
              !Object.prototype.hasOwnProperty.call(
                fields,
                `system.conditions.${conditionName}.duration`
              )
            ) {
              fields[`system.conditions.${conditionName}.-=duration`] = null
            }
            await this.update(fields)
          }
          break
      }
      if (!justThis) {
        // Does setting the condition also trigger other actions?
        // - If ActiveEffects are added hasConditionStatus for recently added conditions may return incorrectly
        switch (conditionName) {
          case COC7.status.criticalWounds:
            await this.setCondition(COC7.status.prone)
            if (
              !this.hasConditionStatus(COC7.status.unconscious) &&
              !this.hasConditionStatus(COC7.status.dead)
            ) {
              const conCheck = new CoC7ConCheck(
                this.isToken ? this.tokenKey : this.id
              )
              conCheck.toMessage()
            }
            break
          case COC7.status.dead:
            await this.unsetCondition(COC7.status.criticalWounds)
            await this.unsetCondition(COC7.status.dying)
            await this.unsetCondition(COC7.status.unconscious)
            break
        }
      }
    }
  }

  async unsetCondition (conditionName, { forceValue = false } = {}) {
    if (!forceValue && game.settings.get('CoC7', 'enableStatusIcons')) {
      const effects = this.effects
        .filter(effect => CoC7ActiveEffect.filterActiveEffects(effect, conditionName))
        .map(effect => effect.id)
      if (effects.length > 0) {
        await super.deleteEmbeddedDocuments('ActiveEffect', effects)
      } else {
        forceValue = true
      }
    }
    if (forceValue || !game.settings.get('CoC7', 'enableStatusIcons')) {
      switch (conditionName) {
        case COC7.status.tempoInsane:
        case COC7.status.indefInsane:
        case COC7.status.unconscious:
        case COC7.status.criticalWounds:
        case COC7.status.dying:
        case COC7.status.prone:
        case COC7.status.dead:
          await this.update({
            [`system.conditions.${conditionName}.-=value`]: null
          })
          await this.update({
            [`system.conditions.${conditionName}.value`]: false
          })
          break
      }
    }
  }

  // TODO : check if ever used
  async resetCounter (counter) {
    await this.update({ [counter]: 0 })
  }

  async resetDailySanity () {
    await this.update({
      'system.attribs.san.dailyLimit': Math.floor(
        this.system.attribs.san.value / 5
      ),
      'system.attribs.san.dailyLoss': 0
    })
  }

  get fightingSkills () {
    const skillList = []
    for (const value of this.items) {
      if (value.type === 'skill' && value.system.properties.fighting) {
        skillList.push(value)
      }
    }

    skillList.sort(CoC7Utilities.sortByNameKey)

    return skillList
  }

  get closeCombatWeapons () {
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

  get firearmSkills () {
    const skillList = []
    for (const value of this.items) {
      if (value.type === 'skill' && (value.system.properties.firearm || value.system.properties.ranged || value.flags.CoC7?.cocidFlag?.id === 'i.skill.fighting-throw')) {
        skillList.push(value)
      }
    }

    skillList.sort(CoC7Utilities.sortByNameKey)

    return skillList
  }

  weaponSkillGroups (rangedFirst = false) {
    const skills = []
    for (const item of this.items) {
      if (item.type === 'skill') {
        let sort = 3
        let group = 'CoC7.Skills'
        let name = item.name
        if (item.system.properties.fighting) {
          sort = (rangedFirst ? 2 : 0)
          group = 'CoC7.SkillFighting'
          /* // FoundryVTT V11 */
          if (foundry.utils.isNewerVersion(game.version, '12')) {
            name = item.system.skillName
          }
        } else if (item.system.properties.firearm) {
          sort = (rangedFirst ? 0 : 1)
          group = 'CoC7.SkillFirearm'
          /* // FoundryVTT V11 */
          if (foundry.utils.isNewerVersion(game.version, '12')) {
            name = item.system.skillName
          }
        } else if (item.system.properties.ranged) {
          sort = (rangedFirst ? 1 : 2)
          group = 'CoC7.SkillRanged'
          /* // FoundryVTT V11 */
          if (foundry.utils.isNewerVersion(game.version, '12')) {
            name = item.system.skillName
          }
        }
        skills.push({
          id: item.id,
          name,
          group,
          sort
        })
      }
    }
    skills.sort((a, b) => {
      if (a.sort === b.sort) {
        return a.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase()
          .localeCompare(
            b.name
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLocaleLowerCase()
          )
      }
      return a.sort - b.sort
    })
    return skills
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

  get creditRatingSkill () {
    const skill = this.getFirstItemByCoCID('i.skill.credit-rating')
    if (skill) {
      return skill
    }
    const skillList = this.getSkillsByName(
      game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.credit-rating')
    )
    if (skillList.length !== 0) return skillList[0]
    return null
  }

  get cthulhuMythosSkill () {
    const skill = this.getFirstItemByCoCID('i.skill.cthulhu-mythos')
    if (skill) {
      return skill
    }
    const skillList = this.getSkillsByName(
      game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.cthulhu-mythos')
    )
    if (skillList.length !== 0) return skillList[0]
    return null
  }

  get cthulhuMythos () {
    const CM = this.cthulhuMythosSkill
    if (CM) {
      const value = CM.value
      if (value) return value
      return parseInt(CM.system.value)
    }
    return 0
  }

  get mythosHardened () {
    return this.getFlag('CoC7', 'mythosHardened') || false
  }

  get useMythosHardened () {
    return this.mythosHardened && game.settings.get('CoC7', 'allowMythosHardened')
  }

  async setMythosHardened () {
    await this.setFlag('CoC7', 'mythosHardened', true)
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
      return parseInt(CR.system.value)
    }
    return 0
  }

  static monetaryFormat (format, symbol, value) {
    switch (format) {
      case COC7.monetaryFormatKeys.lsd:
        return Math.floor(value / 240) + '/' + (Math.floor(value / 12) % 20) + '/' + (value % 12)
      case COC7.monetaryFormatKeys.roman:
        return (Math.floor(value / 400)) + '/' + (Math.floor(value / 16) % 25) + '/' + (Math.floor(value / 8) % 2) + '/' + (Math.floor(value / 4) % 2) + '/' + (value % 4)
      case COC7.monetaryFormatKeys.decimalLeft:
        return symbol + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }).replace(/\.00$/, '')
      case COC7.monetaryFormatKeys.decimalRight:
        return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }).replace(/\.00$/, '') + ' ' + symbol
      case COC7.monetaryFormatKeys.integerLeft:
        return symbol + Number(value).toLocaleString()
      case COC7.monetaryFormatKeys.integerRight:
        return Number(value).toLocaleString() + ' ' + symbol
    }
    return '0'
  }

  static monetaryValue (format, values, CR, type, value) {
    CR = CR || 0
    const row = values.find(r => (typeof r.min === 'object' || r.min <= CR) && (typeof r.max === 'object' || r.max >= CR))
    if (typeof row !== 'undefined' && typeof row[type] !== 'undefined' && typeof row[value] !== 'undefined') {
      switch (format) {
        case COC7.monetaryFormatKeys.lsd:
          switch (row[type]) {
            case COC7.monetaryTypeKeys.multiplier:
              return 240 * CR * row[value]
            case COC7.monetaryTypeKeys.value:
              return 240 * row[value]
            case COC7.monetaryTypeKeys.s:
              return 12 * row[value]
            case COC7.monetaryTypeKeys.d:
              return 1 * row[value]
          }
          break
        case COC7.monetaryFormatKeys.roman:
          switch (row[type]) {
            case COC7.monetaryTypeKeys.multiplier:
              return 400 * CR * row[value]
            case COC7.monetaryTypeKeys.value:
              return 400 * row[value]
            case COC7.monetaryTypeKeys.denarii:
              return 16 * row[value]
            case COC7.monetaryTypeKeys.quinarii:
              return 8 * row[value]
            case COC7.monetaryTypeKeys.sestertii:
              return 4 * row[value]
            case COC7.monetaryTypeKeys.asses:
              return 1 * row[value]
          }
          break
        default:
          switch (row[type]) {
            case COC7.monetaryTypeKeys.multiplier:
              return CR * row[value]
            case COC7.monetaryTypeKeys.value:
              return 1 * row[value]
          }
          break
      }
    }
    return 0
  }

  get spendingLevel () {
    return CoCActor.monetaryValue(this.system.monetary.format, this.system.monetary.values, this.creditRating, 'spendingType', 'spendingValue')
  }

  get cash () {
    return CoCActor.monetaryValue(this.system.monetary.format, this.system.monetary.values, this.creditRating, 'cashType', 'cashValue')
  }

  get assets () {
    return CoCActor.monetaryValue(this.system.monetary.format, this.system.monetary.values, this.creditRating, 'assetsType', 'assetsValue')
  }

  get skills () {
    const skillList = []
    for (const value of this.items) {
      if (value.type === 'skill') skillList.push(value)
    }

    skillList.sort(CoC7Utilities.sortByNameKey)

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

  async setHp (value) {
    if (value < 0) value = 0
    if (value > this.system.attribs.hp.max) {
      value = this.system.attribs.hp.max
    }
    const healthBefore = this.hp
    let damageTaken
    // is healing
    if (isNaN(healthBefore) || value >= healthBefore) {
      await this._setHp(value)
    } else {
      damageTaken = healthBefore - value
      await this.dealDamage(damageTaken, { ignoreArmor: true })
    }
    return value
  }

  async dealDamage (amount, options = {}) {
    // TODO: Change options to list of values
    const armorData = options.armor
      ? options.armor
      : this.system.attribs.armor // if there armor value passed we use it
    const grossDamage = parseInt(amount)
    let armorValue = 0
    if (!options.ignoreArmor) {
      if (armorData === null) {
        // nop
      } else if (CoC7Utilities.isFormula(armorData)) {
        armorValue = (await new Roll(armorData).roll({ async: true })).total
      } else if (!isNaN(Number(armorData))) {
        armorValue = Number(armorData)
      } else if (!isNaN(Number(armorData?.value))) {
        armorValue = Number(armorData.value)
      } else {
        ui.notifications.warn(
          game.i18n.format('CoC7.ErrorUnableToParseArmorFormula', {
            value: armorData
          })
        )
      }
    }
    const netDamage = grossDamage - armorValue
    if (netDamage <= 0) return 0
    await this._setHp(this.hp - netDamage)
    if (netDamage >= this.system.attribs.hp.max) {
      await this.setCondition(COC7.status.dead)
    } else {
      if (game.settings.get('CoC7', 'pulpRuleIgnoreMajorWounds')) {
        if (this.hp === 0) {
          if (netDamage >= Math.ceil(this.system.attribs.hp.max / 2)) {
            this.setCondition(COC7.status.dying)
          } else {
            this.setCondition(COC7.status.unconscious)
          }
        } else if (netDamage >= Math.ceil(this.system.attribs.hp.max / 2)) {
          const conCheck = new CoC7ConCheck(
            this.isToken ? this.tokenKey : this.id
          )
          conCheck.toMessage()
        }
      } else {
        let hasMajorWound = false
        if (netDamage >= Math.ceil(this.system.attribs.hp.max / 2)) {
          await this.setCondition(COC7.status.criticalWounds)
          hasMajorWound = true
        } else {
          hasMajorWound = this.hasConditionStatus(COC7.status.criticalWounds)
        }
        if (this.hp === 0) {
          await this.setCondition(COC7.status.unconscious)
          if (hasMajorWound) {
            this.setCondition(COC7.status.dying)
          }
        }
      }
    }
    return netDamage
  }

  get majorWound () {
    return this.hasConditionStatus(COC7.status.criticalWounds)
  }

  get dying () {
    return this.hasConditionStatus(COC7.status.dying)
  }

  get unconscious () {
    return this.hasConditionStatus(COC7.status.unconscious)
  }

  get dead () {
    return this.hasConditionStatus(COC7.status.dead)
  }

  get prone () {
    return this.hasConditionStatus(COC7.status.prone)
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

  // async update (data = {}, context = {}) {
  //   console.log('>>>>', data, context)
  //   super.update(data, context)
  // }
}
