/* global CONFIG foundry fromUuid game renderTemplate */
import { FOLDER_ID, TARGET_ALLOWED } from '../../constants.js'
import CoC7Check from '../../apps/check.js'
import CoC7DicePool from '../../apps/dice-pool.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ChaseParticipant {
  #actionsOffset
  #actor
  #canAssist
  #listOptions
  #isFirstLocation
  #isLastLocation
  #isTooFast
  #isTooSlow
  #participant
  #speedCheckResult

  /**
   * Constructor
   * @param {Array} participants
   * @param {integer} offset
   */
  constructor (participants, offset) {
    this.#participant = participants[offset]
    this.#actionsOffset = 0
    this.#canAssist = false
    this.#isFirstLocation = false
    this.#isLastLocation = false
    for (const participant of participants) {
      if (participant.chaser === this.#participant.chaser) {
        this.#canAssist = true
        break
      }
    }
    for (const key in this.#participant) {
      Object.defineProperty(this, key, {
        get: function () { return this.#participant[key] }
      })
    }
  }

  /**
   * Get the actor
   * @throws Error if not loaded
   * @returns {Document|null}
   */
  get actor () {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    return this.#actor
  }

  /**
   * Is this an Actor that can be in a chase
   * @throws Error if not loaded
   * @returns {boolean}
   */
  get isActor () {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    return TARGET_ALLOWED.includes(this.#actor?.type)
  }

  /**
   * Get actor icon or default icon
   * @throws Error if not loaded
   * @returns {string}
   */
  get icon () {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    if (this.#actor?.isToken) {
      return this.#actor.token.texture.src
    }
    if (this.#actor?.img) {
      return this.#actor.img
    }
    return 'systems/' + FOLDER_ID + '/assets/icons/question-circle-regular.svg'
  }

  /**
   * Set actions offset value
   */
  set actions (value) {
    this.#actionsOffset = Number(value)
  }

  /**
   * Get actions available (MOV - participant minimum movement + 1)
   * @returns {integer}
   */
  get actions () {
    return this.adjustedMov - this.#actionsOffset + 1
  }

  /**
   * Get Actor HP
   * @returns {integer}
   */
  get hp () {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    return this.#actor?.system.attribs.hp.value ?? this.syntheticHp
  }

  /**
   * Get available attributes, characteristics, and skills
   * @returns {Array}
   */
  get listOptions () {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    return this.#listOptions
  }

  /**
   * Is Speed Roll Set and not yet rolled
   * @returns {boolean}
   */
  get rollableSpeedCheck () {
    return (this.#participant.speedCheck?.name.length && this.#participant.speedCheck?.score > 0)
  }

  /**
   * Is Speed Roll Set and not yet rolled
   * @returns {boolean}
   */
  get rolledSpeedCheck () {
    return typeof this.#participant.speedCheck?.checkData?.flags !== 'undefined'
  }

  /**
   * Is Speed Roll in progress
   * @returns {boolean}
   */
  get rollingSpeedCheck () {
    return this.#participant.speedCheck?.checkData?.rolling === true
  }

  /**
   * Get speed roll movement modification
   * @returns {integer}
   */
  get movAdjustment () {
    if (CoC7DicePool.isValidPool(this.#participant.speedCheck?.checkData?.flags?.[FOLDER_ID].load?.dicePool)) {
      const dicePool = CoC7DicePool.fromObject(this.#participant.speedCheck.checkData.flags[FOLDER_ID].load.dicePool)
      if (dicePool.isCritical) {
        return 1
      } else if (!dicePool.isSuccess) {
        return -1
      }
    }
    return 0
  }

  /**
   * Get participants movement modified by speed roll
   * @returns {integer}
   */
  get adjustedMov () {
    return parseInt(this.#participant.mov || 0, 10) + this.movAdjustment
  }

  /**
   * Get movement css classes
   * @returns {string}
   */
  get adjustedMovClasses () {
    const movAdjustment = this.movAdjustment
    if (movAdjustment < 0) {
      return ' downgrade'
    } else if (movAdjustment > 0) {
      return ' upgrade'
    }
    return ''
  }

  /**
   * Get speed check result
   * @returns {object}
   */
  get speedCheckResult () {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    return this.#speedCheckResult
  }

  /**
   * Has a speed check threshold
   * @returns {boolean}
   */
  get hasSpeedCheckValue () {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    const value = this.#listOptions.find(row => row.name === this.#participant.speedCheck.name)
    return !!(value?.value)
  }

  /**
   * Is participant too fast to be included
   * @returns {boolean}
   */
  get tooFast () {
    return this.#isTooFast === true
  }

  /**
   * Is participant too slow to be included
   * @returns {boolean}
   */
  get tooSlow () {
    return this.#isTooSlow === true
  }

  /**
   * Is participant at first location
   * @returns {boolean}
   */
  get isFirstLocation () {
    return this.#isFirstLocation === true
  }

  /**
   * Is participant at last location
   * @returns {boolean}
   */
  get isLastLocation () {
    return this.#isLastLocation === true
  }

  /**
   * Can assist
   * @returns {boolean}
   */
  get canAssist () {
    return this.#canAssist === true
  }

  /**
   * Array of css classes for actions
   * @returns {Array}
   */
  get movementActionArray () {
    const baseArray = Array(this.actions).fill('base')
    if (this.currentMovementActions >= 0) {
      for (let i = 0; i < this.currentMovementActions; i++) {
        baseArray[i] = 'base available'
      }
      return baseArray
    }
    const deficitArray = Array(Math.abs(this.currentMovementActions)).fill('deficit')
    return deficitArray.concat(baseArray)
  }

  /**
   * Get in total initiative value
   * @returns {integer}
   */
  get initiativeValue () {
    return this.dex + (this.hasAGunReady ? 50 : 0)
  }

  /**
   * Hax maximum movement actions
   * @returns {boolean}
   */
  get hasMaxMvtActions () {
    return this.actions === this.currentMovementActions
  }

  /**
   * Check too fast or slow
   * @param {object} options
   * @param {integer} options.fastestChaser
   * @param {integer} options.slowestPrey
   * @param {boolean} options.includeEscaped
   * @param {boolean} options.includeLatecomers
   */
  setFastSlow ({ fastestChaser, slowestPrey, includeEscaped, includeLatecomers }) {
    if (this.chaser) {
      this.#isTooFast = false
      if (this.adjustedMov < slowestPrey) {
        this.#isTooSlow = !includeLatecomers
      }
    } else {
      this.#isTooSlow = false
      if (this.adjustedMov > fastestChaser) {
        this.#isTooFast = !includeEscaped
      }
    }
  }

  /**
   * Is at first or last location
   * @param {boolean} isFirstLocation
   * @param {boolean} isLastLocation
   */
  setFirstLast (isFirstLocation, isLastLocation) {
    this.#isFirstLocation = isFirstLocation
    this.#isLastLocation = isLastLocation
  }

  /**
   * Preload the async functions
   */
  async loadUuids () {
    if (this.#participant.docUuid) {
      this.#actor = await fromUuid(this.#participant.docUuid)
    } else {
      this.#actor = null
    }
    this.#listOptions = await CONFIG.Actor.documentClass.everyField(this.#actor)
    this.#speedCheckResult = await this.runSpeedCheck()
  }

  /**
   * Parse speed check message
   * @returns {object}
   */
  async runSpeedCheck () {
    if (this.rolledSpeedCheck) {
      const merged = foundry.utils.duplicate(this.#participant.speedCheck.checkData)
      merged.id = 'X'
      const check = await CoC7Check.loadFromMessage(merged)
      const data = await check.getTemplateData()
      data.messageFlavor = check.flavor
      return {
        isCritical: check.isCritical,
        isFumble: check.isFumble,
        isRegularFailure: check.isRegularFailure,
        isSuccess: check.isSuccess,
        tooltip: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/inline-roll.hbs', data),
        value: check.total
      }
    }
    return {
      isCritical: false,
      isFumble: false,
      isRegularFailure: false,
      isSuccess: false,
      tooltip: '',
      value: ''
    }
  }

  /**
   * Attempt to get value for skill base or actors value
   * @param {string} key
   * @returns {object}
   */
  async getRollableValue (key) {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    let output = 0
    const value = this.#listOptions.find(row => row.name === key)
    if (value?.value) {
      output = {
        exiting: true,
        value: value.value
      }
    } else if (value && this.#actor) {
      const parsedValues = this.#actor.parsedValues()
      const skills = [
        {
          system: {
            base: value.base,
            adjustments: {
              base: 0
            }
          }
        }
      ]
      await CoC7Utilities.setMultipleSkillBases(parsedValues, skills)
      output = {
        exiting: false,
        value: skills[0].system.adjustments.base
      }
    }
    return output
  }

  /**
   * Get the actor weapons
   * @param {string} otherDamage
   * @throws Error if not loaded
   * @returns {object}
   */
  actorWeapons (otherDamage) {
    if (typeof this.#actor === 'undefined') {
      throw new Error('Did not participant.loadUuids')
    }
    const weapons = this.#actor?.items.filter(doc => doc.type === 'weapon').map(doc => {
      const damageWithoutDB = doc.system.range.normal.damage
      let damageFormula = damageWithoutDB
      if (doc.system.properties.addb) {
        damageFormula = damageFormula + '+' + (this.#actor.system.attribs.db.value || '0')
      }
      if (doc.system.properties.ahdb) {
        damageFormula = damageFormula + CoC7Utilities.halfDB((this.#actor.system.attribs.db.value || '0'))
      }
      return {
        name: doc.name,
        cocidFlagId: doc.flags?.[FOLDER_ID]?.cocidFlag?.id ?? '',
        damage: damageFormula,
        editableDamage: false,
        label: doc.name + ' (' + damageFormula + ')',
        value: doc.uuid,
        uuid: doc.uuid
      }
    })
    weapons.sort(CoC7Utilities.sortByNameKey)

    const unarmedName = game.i18n.localize('CoC7.UnarmedWeaponName').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    const unarmedIndex = weapons.findIndex(w => w.cocidFlagId === 'i.weapon.brawl' || w.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase() === unarmedName)
    if (unarmedIndex === -1) {
      const damageFormula = '1D3' + '+' + (this.#actor?.system.attribs.db.value || '0')
      weapons.unshift({
        name: game.i18n.localize('CoC7.UnarmedWeaponName'),
        cocidFlagId: 'i.weapon.brawl',
        damage: damageFormula,
        editableDamage: false,
        label: game.i18n.localize('CoC7.UnarmedWeaponName') + ' (' + damageFormula + ')',
        value: 'unarmed',
        uuid: ''
      })
    }

    weapons.push({
      name: game.i18n.localize('CoC7.Other'),
      cocidFlagId: '',
      damage: otherDamage,
      editableDamage: true,
      label: game.i18n.localize('CoC7.Other'),
      value: 'other',
      uuid: ''
    })
    return weapons
  }

  /**
   * Attempt to get value for skill base or actors value
   * @param {Document|null} actor
   * @param {Array} listOptions
   * @param {string} key
   * @returns {integer}
   */
  static async getPercentValue (actor, listOptions, key) {
    let output = 0
    const value = listOptions.find(row => row.name === key)
    if (value?.value) {
      output = value.value
    } else if (value && actor) {
      const parsedValues = actor.parsedValues()
      const skills = [
        {
          system: {
            base: value.base,
            adjustments: {
              base: 0
            }
          }
        }
      ]
      await CoC7Utilities.setMultipleSkillBases(parsedValues, skills)
      output = skills[0].system.adjustments.base
    }
    return output
  }
}
