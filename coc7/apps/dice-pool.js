/* global CONFIG foundry game Roll */
import { FOLDER_ID } from '../constants.js'

export default class CoC7DicePool {
  #bonusCount
  #currentPoolModifier
  #difficulty
  #flatDiceModifier
  #flatThresholdModifier
  #groups
  #luckSpent
  #malfunctionThreshold
  #penaltyCount
  #ranges
  #rolledDice
  #rollMethod
  #rollResults
  #rollsExisting
  #rollsNew
  #setSuccess
  #suppressRollData
  #threshold

  /**
   * Constructor
   */
  constructor () {
    this.#bonusCount = 0
    this.#currentPoolModifier = 0
    this.#difficulty = CoC7DicePool.difficultyLevel.regular
    this.#flatDiceModifier = 0
    this.#flatThresholdModifier = 0
    this.#groups = []
    this.#luckSpent = 0
    // this.#malfunctionThreshold
    this.#penaltyCount = 0
    this.#ranges = {}
    this.#rolledDice = []
    // this.#rollMethod
    this.#rollResults = []
    this.#rollsExisting = []
    this.#rollsNew = []
    // this.#setSuccess
    this.#suppressRollData = false
    // this.#threshold
  }

  /**
   * Difficulty Levels
   * @returns {object}
   */
  static get difficultyLevel () {
    return {
      unknown: -1,
      regular: 1,
      hard: 2,
      extreme: 3,
      critical: 4,
      impossible: 9
    }
  }

  /**
   * Get maximum allows bonus dice
   * @returns {integer}
   */
  static get maxDiceBonus () {
    return 2
  }

  /**
   * Get maximum allows penalty dice
   * @returns {integer}
   */
  static get maxDicePenalty () {
    return 2
  }

  /**
   * Get minimum weapon volley size
   * @returns {integer}
   */
  static get minVolleySize () {
    return 3
  }

  /**
   * Success Levels
   * @returns {object}
   */
  static get successLevel () {
    return {
      fumble: -99,
      failure: 0,
      regular: 1,
      hard: 2,
      extreme: 3,
      critical: 4
    }
  }

  /**
   * If using DSN allow custom formatting for bonus and penalty dice
   * @param {object} options
   * @param {integer} options.poolModifier
   * @returns {string}
   */
  static #alternativeDice ({ poolModifier = 0 } = {}) {
    let alternativeDice = ''
    if (game.modules.get('dice-so-nice')?.active) {
      if (poolModifier < 0) {
        alternativeDice = game.settings.get(FOLDER_ID, 'tenDiePenalty')
      } else if (poolModifier > 0) {
        alternativeDice = game.settings.get(FOLDER_ID, 'tenDieBonus')
        // Temporary fix for bronze texture in DsN
        /* // FoundryVTT v12 */
        if (alternativeDice === 'bronze' && !foundry.utils.isNewerVersion(game.modules.get('dice-so-nice').version, '5.0.5')) {
          alternativeDice = 'bronze01'
        }
      }
    }
    return alternativeDice
  }

  /**
   * Roll pool (initial)
   */
  async roll () {
    let rolls = []
    if ((game.settings.get('core', 'diceConfiguration').d10 ?? '') === '' && game.settings.get(FOLDER_ID, 'hiddendevmenu')) {
      const bonusDice = []
      const penaltyDice = []
      if (game.CoC7.dev.dice.alwaysCrit) {
        for (let offset = 0; offset < this.#penaltyCount; offset++) {
          penaltyDice.push(10)
        }
        for (let offset = 0; offset < this.#bonusCount; offset++) {
          bonusDice.push(Math.ceil((1 - CONFIG.Dice.randomUniform()) * 10))
        }
        rolls = CoC7DicePool.#createRollsFromResults({ baseDie: 10, bonusDice, penaltyDice, unitDie: 1 })
      } else if (game.CoC7.dev.dice.alwaysFumble) {
        let value = 100
        if (this.#minimumFumbleFromThreshold() === 96) {
          value = 95 + Math.ceil((1 - CONFIG.Dice.randomUniform()) * 5)
        }
        const unitDie = value % 10
        const baseDie = (unitDie === 0 ? 10 : 9)
        for (let offset = 0; offset < this.#penaltyCount; offset++) {
          penaltyDice.push(Math.ceil((1 - CONFIG.Dice.randomUniform()) * baseDie))
        }
        for (let offset = 0; offset < this.#bonusCount; offset++) {
          bonusDice.push(baseDie)
        }
        rolls = CoC7DicePool.#createRollsFromResults({ baseDie, bonusDice, penaltyDice, unitDie: (unitDie === 0 ? 10 : unitDie) })
      }
    }
    if (rolls.length === 0) {
      const dicePool = [
        '1dt+1d10'
      ]
      if (this.#penaltyCount > 0) {
        const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier: -this.#penaltyCount })
        dicePool.push('+' + this.#penaltyCount + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt'))
      }
      if (this.#bonusCount > 0) {
        const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier: this.#bonusCount })
        dicePool.push('+' + this.#bonusCount + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt'))
      }
      rolls = [await new Roll(dicePool.join('')).roll()]
    }
    this.#processRolls(0, rolls)
  }

  /**
   * Create fake Roll(s) based
   * @param {object} options
   * @param {integer} options.baseDie
   * @param {Array} options.bonusDice
   * @param {Array} options.groups
   * @param {string|undefined} options.rollMethod
   * @param {Array} options.penaltyDice
   * @param {integer} options.unitDie
   * @returns {Array}
   */
  static #createRollsFromResults ({ baseDie = 10, bonusDice = [], groups = [], rollMethod = undefined, penaltyDice = [], unitDie = 10 } = {}) {
    const rolls = []
    const diceGroups = [
      {
        formula: ['1dt', '1d10'],
        decaders: [baseDie]
      }
    ]
    const diceBonus = bonusDice.map(v => Math.max(1, Math.min(10, parseInt(v, 10))))
    const dicePenalty = penaltyDice.map(v => Math.max(1, Math.min(10, parseInt(v, 10))))
    for (let offset = groups.length - 1; offset >= 0; offset--) {
      const count = groups[offset]
      const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier: count })
      const diceGroup = {
        formula: [Math.abs(count) + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt')],
        decaders: []
      }
      if (count < 0) {
        diceGroup.decaders.push(dicePenalty.pop())
      } else if (count > 0) {
        diceGroup.decaders.push(diceBonus.pop())
      } else {
        throw new Error('Invalid groups')
      }
      diceGroups.push(diceGroup)
    }
    if (dicePenalty.length > 0) {
      const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier: -dicePenalty.length })
      diceGroups[0].formula.push('+' + dicePenalty.length + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt'))
      diceGroups[0].decaders = diceGroups[0].decaders.concat(dicePenalty)
    }
    if (diceBonus.length > 0) {
      const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier: diceBonus.length })
      diceGroups[0].formula.push('+' + diceBonus.length + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt'))
      diceGroups[0].decaders = diceGroups[0].decaders.concat(diceBonus)
    }
    const unit = (unitDie === 10 ? 0 : unitDie)
    for (const offsetDiceGroup in diceGroups) {
      const roll = new Roll(diceGroups[offsetDiceGroup].formula.join('+')).toJSON()
      const values = []
      for (const offsetRollTerm in roll.terms) {
        if (['CoC7DecaderDie', 'CoC7DecaderDieOther'].includes(roll.terms[offsetRollTerm].class)) {
          roll.terms[offsetRollTerm].evaluated = true
          for (let number = 0; number < roll.terms[offsetRollTerm].number; number++) {
            const nextDie = diceGroups[offsetDiceGroup].decaders.shift()
            roll.terms[offsetRollTerm].results.push({
              result: nextDie,
              active: true
            })
            const decader = (nextDie === 10 ? 0 : nextDie)
            if (decader === 0 && unit === 0) {
              values.push(100)
            } else {
              values.push(decader * 10 + unit)
            }
          }
          if (typeof rollMethod !== 'undefined') {
            roll.terms[offsetRollTerm].method = rollMethod
          }
        } else if (roll.terms[offsetRollTerm].class === 'Die') {
          roll.terms[offsetRollTerm].evaluated = true
          roll.terms[offsetRollTerm].results.push({
            result: unitDie,
            active: true
          })
          if (typeof rollMethod !== 'undefined' && rollMethod !== '') {
            roll.terms[offsetRollTerm].method = rollMethod
          }
        }
      }
      roll.total = 0
      roll.evaluated = true
      let found = true
      if (diceBonus.length === 0 && dicePenalty.length > 0) {
        roll.total = Math.max(...values)
        found = false
      } else if (diceBonus.length > 0 && dicePenalty.length === 0) {
        roll.total = Math.min(...values)
        found = false
      }
      if (!found) {
        for (const offset in roll.terms) {
          if (['CoC7DecaderDie', 'CoC7DecaderDieOther'].includes(roll.terms[offset].class)) {
            for (let number = 0; number < roll.terms[offset].number; number++) {
              const decader = (roll.terms[offset].results[0].result === 10 ? 0 : roll.terms[offset].results[0].result)
              if (decader === 0 && unit === 0) {
                if (!found && roll.total === 100) {
                  found = true
                } else {
                  roll.terms[offset].results[number].active = false
                }
              } else {
                if (!found && roll.total !== decader * 10 + unit) {
                  found = true
                } else {
                  roll.terms[offset].results[number].active = false
                }
              }
            }
          }
        }
      }
      rolls.push(Roll.fromData(roll))
    }
    return rolls
  }

  /**
   * Localize difficulty level
   * @param {string} difficultyLevel
   * @returns {string}
   */
  static difficultyString (difficultyLevel) {
    switch (!isNaN(Number(difficultyLevel)) ? Number(difficultyLevel) : difficultyLevel) {
      case '?':
      case CoC7DicePool.difficultyLevel.unknown:
        return game.i18n.localize('CoC7.UnknownDifficulty')
      case 0:
      case CoC7DicePool.difficultyLevel.regular:
        return game.i18n.localize('CoC7.RegularDifficulty')
      case '+':
      case CoC7DicePool.difficultyLevel.hard:
        return game.i18n.localize('CoC7.HardDifficulty')
      case '++':
      case CoC7DicePool.difficultyLevel.extreme:
        return game.i18n.localize('CoC7.ExtremeDifficulty')
      case '+++':
      case CoC7DicePool.difficultyLevel.critical:
        return game.i18n.localize('CoC7.CriticalDifficulty')
      default:
        return ''
    }
  }

  /**
   * Create CoC7DicePool from exported object
   * @param {object} object
   * @returns {boolean}
   */
  static fromObject (object) {
    if (CoC7DicePool.isValidPool(object)) {
      const output = new CoC7DicePool()
      output.#bonusCount = object.bonusCount
      output.#currentPoolModifier = object.currentPoolModifier
      output.#difficulty = object.difficulty
      output.#flatDiceModifier = object.flatDiceModifier
      output.#flatThresholdModifier = object.flatThresholdModifier
      output.#groups = object.groups
      output.#luckSpent = object.luckSpent
      output.#malfunctionThreshold = object.malfunctionThreshold
      output.#penaltyCount = object.penaltyCount
      output.#rolledDice = object.rolledDice
      output.#rollMethod = object.rollMethod
      output.#rollResults = []
      output.#suppressRollData = object.suppressRollData
      output.#setSuccess = object.setSuccess
      const roll = object.rolledDice.findLast(r => r.rolled)
      if (roll) {
        output.#rollsExisting = CoC7DicePool.#createRollsFromResults({
          baseDie: roll.baseDie,
          bonusDice: roll.bonusDice,
          groups: output.#groups,
          rollMethod: output.#rollMethod,
          penaltyDice: roll.penaltyDice,
          unitDie: roll.unitDie
        })
      }
      output.#rollsNew = []
      output.#threshold = object.threshold
      return output
    }
    throw new Error('Invalid Roll Object')
  }

  /**
   * Check pool object is valid to create a CoC7DicePool
   * @param {object} object
   * @returns {boolean}
   */
  static isValidPool (object) {
    const keys = [
      'bonusCount',
      'currentPoolModifier',
      'difficulty',
      'flatDiceModifier',
      'flatThresholdModifier',
      'groups',
      'luckSpent',
      // 'malfunctionThreshold' - only available for weapons
      'penaltyCount',
      'rolledDice',
      // 'rollMethod' - allow automatic rolls
      // 'setSuccess' - undefined by default
      'suppressRollData'
      // 'threshold' - allow no threshold
    ]
    if (keys.every(k => typeof object?.[k] !== 'undefined')) {
      const keys = [
        'baseDie',
        'bonusDice',
        'penaltyDice',
        'rolled',
        'unitDie'
      ]
      return object.rolledDice.every(r => keys.every(k => typeof r[k] !== 'undefined'))
    }
    return false
  }

  /**
   * Check pool modifiers to make sure they are all valid
   * @param {Array} poolModifiers
   * @returns {object}
   */
  static #parsePoolModifiers (poolModifiers) {
    if (!Array.isArray(poolModifiers)) {
      throw new Error('Invalid Pool Modifiers type should be an array of numbers')
    }
    if (poolModifiers.length === 0) {
      return {
        bonusCount: 0,
        penaltyCount: 0,
        currentPoolModifier: 0
      }
    }
    const parsed = [...new Set(poolModifiers.map(v => parseInt(v, 10)))]
    // Check all keys are valid otherwise throw an error allow maximum bonus and penalty just in case
    if (parsed.filter(v => isNaN(v) || v < -CoC7DicePool.maxDicePenalty || v > CoC7DicePool.maxDiceBonus).length) {
      throw new Error('Invalid Pool Modifier should be a number between ' + (-CoC7DicePool.maxDicePenalty) + ' and ' + CoC7DicePool.maxDiceBonus)
    }
    if (!parsed.includes(0)) {
      parsed.push(0)
    }
    return {
      bonusCount: Math.max(...parsed.filter(v => v >= 0)),
      penaltyCount: Math.abs(Math.min(...parsed.filter(v => v <= 0))),
      currentPoolModifier: parsed[0]
    }
  }

  /**
   * For a regular check return result ranges
   * @param {Int|undefined} threshold
   * @param {Int} flatThresholdModifier
   * @returns {object|false}
   */
  static thresholdRanges (threshold, flatThresholdModifier) {
    const output = new CoC7DicePool()
    if (isNaN(parseInt(threshold, 10))) {
      return false
    }
    output.#flatThresholdModifier = flatThresholdModifier
    output.#threshold = threshold
    return output.#populateThresholdRanges()
  }

  /**
   * Create a new poll and roll it
   * @param {object} options
   * @param {integer} options.difficulty
   * @param {integer} options.flatDiceModifier
   * @param {integer} options.flatThresholdModifier
   * @param {Array} options.poolModifiers
   * @param {integer|undefined} options.threshold
   * @param {integer|undefined} options.malfunctionThreshold
   * @returns {CoC7DicePool}
   */
  static newPool ({ difficulty = CoC7DicePool.difficultyLevel.regular, flatDiceModifier = 0, flatThresholdModifier = 0, poolModifiers = [], threshold = undefined, malfunctionThreshold = undefined } = {}) {
    const output = new CoC7DicePool()
    const poolContents = CoC7DicePool.#parsePoolModifiers(poolModifiers)
    output.#difficulty = parseInt(difficulty, 10)
    if (!Object.values(CoC7DicePool.difficultyLevel).includes(output.#difficulty)) {
      throw new Error('Invalid difficulty should ' + Object.keys(CoC7DicePool.difficultyLevel).join(' / '))
    }
    output.#flatDiceModifier = parseInt(flatDiceModifier, 10)
    if (isNaN(output.#flatDiceModifier)) {
      throw new Error('Invalid flat dice modifier should be a number')
    }
    output.#flatThresholdModifier = parseInt(flatThresholdModifier, 10)
    if (isNaN(output.#flatThresholdModifier)) {
      throw new Error('Invalid flat threshold modifier should be a number')
    }
    if (typeof threshold === 'undefined') {
      output.#threshold = undefined
    } else {
      output.#threshold = parseInt(threshold, 10)
      if (isNaN(output.#threshold)) {
        throw new Error('Invalid threshold should be a number')
      }
    }
    output.#bonusCount = poolContents.bonusCount
    output.#currentPoolModifier = poolContents.currentPoolModifier
    output.#groups = []
    output.#luckSpent = 0
    output.#penaltyCount = poolContents.penaltyCount
    output.#rolledDice = [{
      rolled: false,
      baseDie: 0,
      bonusDice: [],
      penaltyDice: [],
      unitDie: 0
    }]
    output.#rollMethod = undefined
    output.#rollResults = []
    output.#rollsExisting = []
    output.#rollsNew = []
    if (typeof malfunctionThreshold === 'undefined') {
      output.#malfunctionThreshold = undefined
    } else {
      output.#malfunctionThreshold = parseInt(malfunctionThreshold, 10)
      if (isNaN(output.#malfunctionThreshold)) {
        throw new Error('Invalid malfunction threshold should be a number')
      }
    }
    return output
  }

  /**
   * Create a new poll and roll it
   * @param {object} options
   * @param {integer} options.difficulty
   * @param {integer} options.flatDiceModifier
   * @param {integer} options.flatThresholdModifier
   * @param {integer} options.poolModifier
   * @param {integer|undefined} options.threshold
   * @param {integer|undefined} options.malfunctionThreshold
   * @returns {CoC7DicePool}
   */
  static async rollNewPool ({ difficulty = CoC7DicePool.difficultyLevel.regular, flatDiceModifier = 0, flatThresholdModifier = 0, poolModifier = 0, threshold = undefined, malfunctionThreshold = undefined } = {}) {
    return CoC7DicePool.rollNewMultiplePools({ difficulty, flatDiceModifier, flatThresholdModifier, poolModifiers: [poolModifier], threshold, malfunctionThreshold })
  }

  /**
   * Create a new poll with multiple pool modifiers and roll them
   * @param {object} options
   * @param {integer} options.difficulty
   * @param {integer} options.flatDiceModifier
   * @param {integer} options.flatThresholdModifier
   * @param {Array} options.poolModifiers
   * @param {integer|undefined} options.threshold
   * @param {integer|undefined} options.malfunctionThreshold
   * @returns {CoC7DicePool}
   */
  static async rollNewMultiplePools ({ difficulty = CoC7DicePool.difficultyLevel.regular, flatDiceModifier = 0, flatThresholdModifier = 0, poolModifiers = [], threshold = undefined, malfunctionThreshold = undefined } = {}) {
    const output = CoC7DicePool.newPool({ difficulty, flatDiceModifier, flatThresholdModifier, poolModifiers, threshold, malfunctionThreshold })
    await output.roll()
    return output
  }

  /**
   * Number of bonus/penalty dice
   * @returns {integer}
   */
  get bonusDice () {
    return Math.abs(this.#currentPoolModifier)
  }

  /**
   * Name of bonus/penalty type
   * @returns {string}
   */
  get bonusType () {
    return game.i18n.localize(this.#currentPoolModifier < 0 ? 'CoC7.DiceModifierPenalty' : 'CoC7.DiceModifierBonus')
  }

  /**
   * Current result decader
   * @returns {string}
   */
  get decader () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.decader ?? '00'
  }

  /**
   * Current result decaders
   * @returns {Array}
   */
  get decaders () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.decaders ?? []
  }

  /**
   * Get results from rolled dice [0] = initial roll, [1] = pushed roll
   * @returns {Array}
   */
  get diceGroups () {
    if (this.#rollResults.length === 0) {
      this.#ranges = {}
      for (const rolledDice of this.#rolledDice) {
        if (rolledDice.rolled) {
          const decaders = [
            rolledDice.baseDie
          ]
          const output = {
            decader: '00',
            decaders: [],
            isCritical: false,
            isExtremeSuccess: false,
            isFumble: false,
            isHardSuccess: false,
            isRegularFailure: false,
            isRegularSuccess: false,
            isRolledSuccess: false,
            isSuccess: false,
            luckRequiredRegular: 0,
            luckRequiredHard: 0,
            luckRequiredExtreme: 0,
            luckRequiredCritical: 0,
            resultType: '',
            rollMethod: undefined,
            successLevel: '',
            successLevelIcons: {
              hint: '',
              icons: []
            },
            successRequired: '',
            total: 0,
            unit: rolledDice.unitDie
          }
          if (this.#currentPoolModifier === 0) {
            // Just Base Die
          } else if (this.#currentPoolModifier < 0 && typeof rolledDice.penaltyDice[Math.abs(this.#currentPoolModifier) - 1] !== 'undefined') {
            for (let offset = 0, last = Math.abs(this.#currentPoolModifier); offset < last; offset++) {
              decaders.push(rolledDice.penaltyDice[offset])
            }
          } else if (this.#currentPoolModifier > 0 && typeof rolledDice.bonusDice[this.#currentPoolModifier - 1] !== 'undefined') {
            for (let offset = 0; offset < this.#currentPoolModifier; offset++) {
              decaders.push(rolledDice.bonusDice[offset])
            }
          } else {
            throw new Error('Unknown Pool Modifier')
          }
          output.rollMethod = CONFIG.Dice.fulfillment.methods[this.#rollMethod]
          if (output.rollMethod?.interactive === true) {
            output.rollMethod.icon = (output.rollMethod.icon ?? '<i class="fa-solid fa-bluetooth"></i>')
          }
          const unit = (output.unit === 10 ? 0 : output.unit)
          const values = []
          for (const result of decaders) {
            const decader = (result === 10 ? 0 : result * 10)
            values.push(decader === 0 && unit === 0 ? 100 : decader + unit)
            output.decaders.push({
              active: false,
              result: (decader === 0 ? '00' : decader)
            })
          }
          if (this.#currentPoolModifier < 0) {
            output.total = Math.max(...values)
          } else {
            output.total = Math.min(...values)
          }
          const index = values.indexOf(output.total)
          if (index > -1) {
            output.decaders[index].active = true
            output.decader = output.decaders[index].result
          }
          output.total = Math.max(1, Math.min(100, (output.total + this.#flatDiceModifier - this.#luckSpent)))
          const populateThresholdRanges = this.#populateThresholdRanges()
          if (typeof populateThresholdRanges[CoC7DicePool.difficultyLevel.regular] !== 'undefined') {
            output.luckRequiredRegular = Math.max(0, output.total - populateThresholdRanges[CoC7DicePool.difficultyLevel.regular][1])
          }
          if (typeof populateThresholdRanges[CoC7DicePool.difficultyLevel.hard] !== 'undefined') {
            output.luckRequiredHard = Math.max(0, output.total - populateThresholdRanges[CoC7DicePool.difficultyLevel.hard][1])
          }
          if (typeof populateThresholdRanges[CoC7DicePool.difficultyLevel.extreme] !== 'undefined') {
            output.luckRequiredExtreme = Math.max(0, output.total - populateThresholdRanges[CoC7DicePool.difficultyLevel.extreme][1])
          }
          if (typeof populateThresholdRanges[CoC7DicePool.difficultyLevel.critical] !== 'undefined') {
            output.luckRequiredCritical = Math.max(0, output.total - populateThresholdRanges[CoC7DicePool.difficultyLevel.critical][1])
          }

          if (this.#difficulty !== CoC7DicePool.difficultyLevel.unknown) {
            output.successRequired = game.i18n.format('CoC7.SuccessRequired', {
              successRequired: CoC7DicePool.difficultyString(this.#difficulty)
            })
            if (typeof this.#threshold !== 'undefined') {
              output.successLevel = parseInt(Object.keys(populateThresholdRanges).find(k => output.total <= populateThresholdRanges[k][1] && output.total >= populateThresholdRanges[k][0]), 10)
              switch (output.successLevel) {
                case CoC7DicePool.successLevel.fumble:
                  output.resultType = game.i18n.localize('CoC7.Fumble')
                  output.isFumble = true
                  break
                case CoC7DicePool.successLevel.failure:
                  output.resultType = game.i18n.localize('CoC7.Failure')
                  output.isRegularFailure = true
                  break
                case CoC7DicePool.successLevel.regular:
                  output.resultType = game.i18n.localize('CoC7.RegularSuccess')
                  output.isRegularSuccess = true
                  break
                case CoC7DicePool.successLevel.hard:
                  output.resultType = game.i18n.localize('CoC7.HardSuccess')
                  output.isHardSuccess = true
                  break
                case CoC7DicePool.successLevel.extreme:
                  output.resultType = game.i18n.localize('CoC7.ExtremeSuccess')
                  output.isExtremeSuccess = true
                  break
                case CoC7DicePool.successLevel.critical:
                  output.resultType = game.i18n.localize('CoC7.CriticalSuccess')
                  output.isCritical = true
                  break
              }
              output.successLevelIcons.icons = []
              if (output.successLevel >= this.#difficulty) {
                output.isSuccess = true
                for (let index = 0, im = output.successLevel - this.#difficulty + 1; index < im; index++) {
                  output.successLevelIcons.icons.push(output.isCritical ? 'medal' : 'star')
                }
                output.successLevelIcons.hint = game.i18n.format('CoC7.SuccessLevelHint', {
                  value: output.successLevel - this.#difficulty + 1
                })
              } else {
                output.isSuccess = false
                const successLevel = output.isFumble ? -1 : output.successLevel
                for (let index = 0, im = this.#difficulty - successLevel; index < im; index++) {
                  output.successLevelIcons.icons.push(output.isFumble ? 'skull' : 'spider')
                }
                output.successLevelIcons.hint = game.i18n.format('CoC7.FailureLevelHint', {
                  value: this.#difficulty - successLevel
                })
              }
              output.isRolledSuccess = (output.isSuccess && this.#luckSpent === 0 && this.#bonusCount === 0 && this.#penaltyCount === 0)
              if (this.#setSuccess === true || this.#setSuccess === false) {
                output.isSuccess = this.#setSuccess
              }
            }
          }
          this.#rollResults.push(output)
        }
      }
    }
    return this.#rollResults
  }

  /**
   * Set difficulty
   * @param {integer} value
   */
  set difficulty (value) {
    this.#rollResults = []
    const check = parseInt(value, 10)
    if (!Object.values(CoC7DicePool.difficultyLevel).filter(v => v !== CoC7DicePool.difficultyLevel.impossible).includes(check)) {
      throw new Error('Difficult level is invalid')
    }
    this.#difficulty = check
  }

  /**
   * Get luck spent
   * @returns {integer}
   */
  get difficulty () {
    return this.#difficulty
  }

  /**
   * Luck required to get critical success
   * @returns {integer}
   */
  get luckRequiredCritical () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.luckRequiredCritical ?? 0
  }

  /**
   * Luck required to get extreme success
   * @returns {integer}
   */
  get luckRequiredExtreme () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.luckRequiredExtreme ?? 0
  }

  /**
   * Luck required to get hard success
   * @returns {integer}
   */
  get luckRequiredHard () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.luckRequiredHard ?? 0
  }

  /**
   * Luck required to get extreme success
   * @returns {integer}
   */
  get luckRequiredRegular () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.luckRequiredRegular ?? 0
  }

  /**
   * Set luck spent
   * @param {integer} value
   */
  set luckSpent (value) {
    this.#rollResults = []
    const check = parseInt(value, 10)
    if (isNaN(check)) {
      throw new Error('Invalid luck spent should be a number')
    }
    this.#luckSpent = check
  }

  /**
   * Get luck spent
   * @returns {integer}
   */
  get luckSpent () {
    return this.#luckSpent
  }

  /**
   * Set flat dice modifier
   * @param {integer} value
   */
  set flatDiceModifier (value) {
    this.#rollResults = []
    const check = parseInt(value, 10)
    if (isNaN(check)) {
      throw new Error('Invalid flat dice modifier should be a number')
    }
    this.#flatDiceModifier = check
  }

  /**
   * Get flat dice modifier
   * @returns {integer}
   */
  get flatDiceModifier () {
    return this.#flatDiceModifier
  }

  /**
   * Set flat threshold modifier
   * @param {integer} value
   */
  set flatThresholdModifier (value) {
    this.#rollResults = []
    const check = parseInt(value, 10)
    if (isNaN(check)) {
      throw new Error('Invalid flat threshold modifier should be a number')
    }
    this.#flatThresholdModifier = check
  }

  /**
   * Get flat threshold modifier
   * @returns {integer}
   */
  get flatThresholdModifier () {
    return this.#flatThresholdModifier
  }

  /**
   * Is final roll critical success
   * @returns {boolean}
   */
  get isCritical () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.isCritical ?? false
  }

  /**
   * Is final roll extreme success
   * @returns {boolean}
   */
  get isExtremeSuccess () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.isExtremeSuccess ?? false
  }

  /**
   * Is final roll hard success
   * @returns {boolean}
   */
  get isHardSuccess () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.isHardSuccess ?? false
  }

  /**
   * Is final roll fumble
   * @returns {boolean}
   */
  get isFumble () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.isFumble ?? false
  }

  /**
   * Is final roll malfunction
   * @returns {boolean}
   */
  get isMalfunction () {
    if (typeof this.#malfunctionThreshold === 'undefined') {
      return false
    }
    return this.total >= this.#malfunctionThreshold
  }

  /**
   * Is pushed roll
   * @returns {boolean}
   */
  get isPushed () {
    return (this.#rolledDice.reduce((c, d) => c + (d.rolled === true ? 1 : 0), 0)) > 1
  }

  /**
   * Is final roll regular failure
   * @returns {boolean}
   */
  get isRegularFailure () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.isRegularFailure ?? false
  }

  /**
   * Is final roll regular success
   * @returns {boolean}
   */
  get isRegularSuccess () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.isRegularSuccess ?? false
  }

  /**
   * Is rolled
   * @returns {boolean}
   */
  get isRolled () {
    return (this.#rolledDice.reduce((c, d) => c + (d.rolled === true ? 1 : 0), 0)) > 0
  }

  /**
   * Can skill be ticked for development
   * @returns {boolean}
   */
  get isRolledSuccess () {
    return (this.diceGroups.length === 1 && this.diceGroups[0].isRolledSuccess)
  }

  /**
   * If this roll considered a success (roll, malfunction, automatic success)
   * @returns {boolean}
   */
  get isSuccess () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.isSuccess ?? false
  }

  /**
   * Set weapon malfunction threshold
   * @param {integer|undefined} value
   */
  set malfunctionThreshold (value) {
    this.#malfunctionThreshold = value
  }

  /**
   * Get weapon malfunction threshold
   * @returns {integer|undefined}
   */
  get malfunctionThreshold () {
    return this.#malfunctionThreshold
  }

  /**
   * Get new Rolls for message
   * @returns {Array}
   */
  get newRolls () {
    if (this.#suppressRollData) {
      return []
    }
    return this.#rollsNew
  }

  /**
   * Set flat threshold modifier
   * @param {integer} value
   */
  set poolModifier (value) {
    this.#rollResults = []
    const hasRolled = this.#rolledDice.find(d => d.rolled === true) ?? false
    const check = parseInt(value, 10)
    if (hasRolled && (check < -this.#penaltyCount || check > this.#bonusCount)) {
      throw new Error('You can not set a pool modifier after rolling, try addDiceToPool')
    }
    if (isNaN(check) || check < -CoC7DicePool.maxDicePenalty || check > CoC7DicePool.maxDiceBonus) {
      throw new Error('Invalid Pool Modifier should be a number between ' + (-CoC7DicePool.maxDicePenalty) + ' and ' + CoC7DicePool.maxDiceBonus)
    }
    if (check < 0) {
      this.#penaltyCount = Math.abs(Math.min(this.#penaltyCount, check))
    } else if (check > 0) {
      this.#bonusCount = Math.max(this.#bonusCount, check)
    }
    this.#currentPoolModifier = check
  }

  /**
   * Get flat threshold modifier
   * @returns {integer}
   */
  get poolModifier () {
    return this.#currentPoolModifier
  }

  /**
   * Get result name
   * @returns {boolean}
   */
  get resultType () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.resultType || '?'
  }

  /**
   * Ret Roll Method object
   * @returns {boolean}
   */
  get rollMethod () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.rollMethod || {}
  }

  /**
   * Get success level from most recent roll
   * @returns {integer}
   */
  get successLevel () {
    const roll = this.diceGroups.pop()
    if (roll) {
      return roll.successLevel
    }
    throw new Error('There is no active roll')
  }

  /**
   * Roll required to get each success
   * @returns {object}
   */
  get successLevels () {
    if (this.diceGroups) {
      //
    }
    return this.#ranges
  }

  /**
   * Get success required string
   * @returns {boolean}
   */
  get successRequired () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.successRequired || '?'
  }

  /**
   * Set threshold
   * @param {integer} value
   */
  set threshold (value) {
    this.#rollResults = []
    const check = parseInt(value, 10)
    if (isNaN(check)) {
      throw new Error('Invalid luck spent should be a number')
    }
    this.#threshold = check
  }

  /**
   * Get threshold
   * @returns {integer}
   */
  get threshold () {
    return this.#threshold
  }

  /**
   * Get threshold for regular success
   * @returns {integer}
   */
  get thresholdString () {
    if (typeof this.threshold === 'undefined') {
      return '?'
    }
    return this.threshold.toString() + (this.flatThresholdModifier !== 0 ? (this.flatThresholdModifier > 0 ? '+' : '') + this.flatThresholdModifier.toString() : '')
  }

  /**
   * Get result from most recent roll
   * @returns {integer}
   */
  get total () {
    const roll = this.diceGroups.pop()
    if (roll) {
      return roll.total
    }
    throw new Error('There is no active roll')
  }

  /**
   * Current result unit
   * @returns {integer}
   */
  get unit () {
    const roll = this.diceGroups[this.diceGroups.length - 1]
    return roll?.unit ?? 0
  }

  /**
   * Prevent Rolls being added to ChatData so DsN wont trigger
   * @param {boolean} value
   */
  suppressRollData (value = true) {
    this.#suppressRollData = value === true
  }

  /**
   * Add dice to existing pool
   * @param {integer} quantity
   * @returns {true}
   */
  async addDiceToPool (quantity) {
    if (!this.isPushed) {
      const check = parseInt(quantity, 10)
      if (isNaN(check) || (check < 0 && this.poolModifier > 0) || (check > 0 && this.poolModifier < 0)) {
        throw new Error(game.i18n.localize('CoC7.Errors.IncorrectPoolModifier'))
      }
      const poolModifier = this.poolModifier + check
      if (poolModifier < -CoC7DicePool.maxDicePenalty || poolModifier > CoC7DicePool.maxDiceBonus) {
        throw new Error('Invalid Pool Modifier should be a number between ' + (-CoC7DicePool.maxDicePenalty) + ' and ' + CoC7DicePool.maxDiceBonus)
      }
      let roll
      if (poolModifier < 0 && this.#penaltyCount < Math.abs(poolModifier)) {
        const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier })
        roll = await new Roll(Math.abs(check) + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt')).roll()
        this.#penaltyCount = Math.abs(poolModifier)
      } else if (poolModifier > 0 && this.#bonusCount < poolModifier) {
        const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier })
        roll = await new Roll(check + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt')).roll()
        this.#bonusCount = poolModifier
      }
      this.#currentPoolModifier = poolModifier
      if (typeof roll !== 'undefined') {
        this.#rollResults = []
        this.#groups.push(check)
        this.#processRolls(this.#rolledDice.length - 1, [roll])
      }
      return true
    }
    throw new Error(game.i18n.localize('CoC7.Errors.UnparsablePoolModifier'))
  }

  /**
   * Get buttons to modify roll
   * @param {object} options
   * @param {integer|undefined} options.luckAvailable
   * @param {string} options.key
   * @param {boolean} options.isPushable
   * @returns {object}
   */
  availableButtons ({ luckAvailable = undefined, key = '', isPushable = true } = {}) {
    const buttons = {}
    if (this.isRolled) {
      const isLuck = (key === 'lck')
      const isSanity = (key === 'san')
      if (!this.isPushed) {
        if (this.#luckSpent === 0) {
          if (this.poolModifier >= 0) {
            if (this.poolModifier < 1) {
              buttons.addBonus2 = true
            }
            if (this.poolModifier < 2) {
              buttons.addBonus1 = true
            }
          }
          if (this.poolModifier <= 0) {
            if (this.poolModifier > -1) {
              buttons.addPenalty2 = true
            }
            if (this.poolModifier > -2) {
              buttons.addPenalty1 = true
            }
          }
        }
        if (!this.isSuccess) {
          if (!isSanity && isPushable && (!this.isFumble || game.settings.get(FOLDER_ID, 'allowPushFumbles'))) {
            buttons.pushRoll = true
          }
          if (!this.isFumble && !isLuck && !isSanity && !this.isMalfunction) {
            const value = this.luckRequiredRegular
            if (value > 0 && luckAvailable > value && this.#difficulty <= CoC7DicePool.difficultyLevel.regular) {
              buttons.luckRegular = value
            }
          }
        }
        if (!this.isFumble && !isLuck && !isSanity && !this.isMalfunction) {
          let value = this.luckRequiredHard
          if (value > 0 && luckAvailable > value && this.#difficulty <= CoC7DicePool.difficultyLevel.hard) {
            buttons.luckHard = value
          }
          value = this.luckRequiredExtreme
          if (value > 0 && luckAvailable > value && this.#difficulty <= CoC7DicePool.difficultyLevel.extreme) {
            buttons.luckExtreme = value
          }
          value = this.luckRequiredCritical
          if (value > 0 && luckAvailable > value && this.#difficulty <= CoC7DicePool.difficultyLevel.critical) {
            buttons.luckCritical = value
          }
        }
      }
    }
    return buttons
  }

  /**
   * Set result
   * @param {object} options
   * @param {boolean|integer} options.direction
   * @param {boolean|integer} options.successLevel
   */
  forceResult ({ direction = false, successLevel = false }) {
    const populateThresholdRanges = this.#populateThresholdRanges()
    if (direction !== false) {
      const order = Object.keys(populateThresholdRanges).map(v => parseInt(v, 10)).sort((a, b) => a - b)
      const index = order.indexOf(this.successLevel)
      if (typeof order[index + direction] === 'undefined') {
        return
      }
      successLevel = order[index + direction]
    }
    if (successLevel === false || typeof populateThresholdRanges[successLevel] === 'undefined') {
      return
    }
    const total = Math.floor(Math.random() * (populateThresholdRanges[successLevel][1] - populateThresholdRanges[successLevel][0] + 1)) + populateThresholdRanges[successLevel][0]
    const base = Math.floor(total / 10)
    const unit = total % 10
    const bonusDice = []
    const penaltyDice = []
    for (let i = 0; i < this.#penaltyCount; i++) {
      const total = Math.floor(Math.random() * (base + (unit === 0 ? 0 : 1))) + (unit === 0 ? 1 : 0)
      penaltyDice.push(total === 0 ? 10 : total)
    }
    for (let i = 0; i < this.#bonusCount; i++) {
      const total = Math.floor(Math.random() * (9 - base + 1)) + base
      bonusDice.push(total === 0 ? 10 : total)
    }
    this.#rollResults = []
    const rolls = CoC7DicePool.#createRollsFromResults({ baseDie: (base === 0 ? 10 : base), bonusDice, groups: this.#groups, rollMethod: this.#rollMethod, penaltyDice, unitDie: (unit === 0 ? 10 : unit) })
    if (this.#rollsExisting.length) {
      this.#rollsExisting = rolls
      this.#processRolls(this.#rolledDice.length - 1, [])
    } else {
      this.#rollsNew = []
      this.#processRolls(0, rolls)
    }
  }

  /**
   * Set success/failure can not be performed on critical or fumble e.g. true = automatic melee success and false = weapon malfunction
   * @param {boolean|undefined} value
   */
  setSuccess (value) {
    if (value === true || value === false) {
      if (!this.isFumble && !this.isCritical) {
        this.#setSuccess = value
        this.#rollResults = []
        return
      }
    }
    this.#setSuccess = undefined
  }

  /**
   * Fumble value based on difficulty, threshold, and flat threshold modifier
   * @returns {integer}
   */
  #minimumFumbleFromThreshold () {
    if (typeof this.#threshold !== 'undefined') {
      switch (this.#difficulty) {
        case CoC7DicePool.difficultyLevel.regular:
          return (this.#threshold + this.#flatThresholdModifier < 50 ? 96 : 100)
        case CoC7DicePool.difficultyLevel.hard:
          return (Math.floor((this.#threshold + this.#flatThresholdModifier) / 2) < 50 ? 96 : 100)
        case CoC7DicePool.difficultyLevel.extreme:
          return (Math.floor((this.#threshold + this.#flatThresholdModifier) / 5) < 50 ? 96 : 100)
      }
    }
    return 100
  }

  /**
   * Overwrite pool modifier bounds
   * @param {integer} penaltyCount
   * @param {integer} bonusCount
   */
  poolModifierRange (penaltyCount, bonusCount) {
    this.#rollResults = []
    const hasRolled = this.#rolledDice.find(d => d.rolled === true) ?? false
    if (hasRolled) {
      throw new Error('You can not set a pool modifier after rolling, try addDiceToPool')
    }
    const checkPenalty = parseInt(penaltyCount, 10)
    const checkBonus = parseInt(bonusCount, 10)
    if (isNaN(checkPenalty) || isNaN(checkBonus) || checkPenalty > CoC7DicePool.maxDicePenalty || checkBonus > CoC7DicePool.maxDiceBonus) {
      throw new Error('Invalid Pool Modifier should be a number between ' + (-CoC7DicePool.maxDicePenalty) + ' and ' + CoC7DicePool.maxDiceBonus)
    }
    this.#penaltyCount = Math.abs(checkPenalty)
    this.#bonusCount = checkBonus
  }

  /**
   * Return threshold ranges calculate if doesn't exist
   * @returns {object}
   */
  #populateThresholdRanges () {
    if (typeof this.#ranges[CoC7DicePool.successLevel.fumble] === 'undefined') {
      const ranges = {
        fumble: this.#minimumFumbleFromThreshold()
      }
      if (typeof this.#threshold !== 'undefined' && this.#difficulty !== CoC7DicePool.difficultyLevel.impossible) {
        const regularSuccess = this.#threshold + this.#flatThresholdModifier
        ranges.critical = 1
        let minimum = ranges.critical
        let maximum = ranges.fumble - 1
        const checks = {
          extreme: Math.floor(regularSuccess / 5),
          hard: Math.floor(regularSuccess / 2),
          regular: regularSuccess
        }
        for (const key in checks) {
          if (checks[key] > minimum && maximum > 0) {
            minimum = checks[key]
            ranges[key] = Math.min(checks[key], maximum)
            if (ranges[key] === maximum) {
              maximum = 0
            }
          }
        }
      }
      let next = 1
      this.#ranges = {}
      const keys = Object.keys(CoC7DicePool.successLevel).reverse()
      for (const key of keys) {
        if (key === 'fumble') {
          if (next <= ranges[key] - 1) {
            this.#ranges[CoC7DicePool.successLevel.failure] = [next, ranges[key] - 1]
          }
          this.#ranges[CoC7DicePool.successLevel[key]] = [ranges[key], 100]
        } else if (typeof ranges[key] !== 'undefined') {
          this.#ranges[CoC7DicePool.successLevel[key]] = [next, ranges[key]]
          next = ranges[key] + 1
        }
      }
    }
    return this.#ranges
  }

  /**
   * Process existing and new rolls into base, bonus, penalty, and unit dice
   * @param {integer} which
   * @param {Array} rolls
   */
  #processRolls (which, rolls) {
    const allRolls = [].concat(this.#rollsExisting).concat(rolls)
    this.#rollsNew = this.#rollsNew.concat(rolls)
    if (typeof this.#rolledDice[which] === 'undefined') {
      throw new Error('Attempting to roll on an invalid pool')
    }
    let baseSet = false
    let unitSet = false
    let bonusDiceCount = this.#bonusCount
    let penaltyDiceCount = this.#penaltyCount
    this.#rolledDice[which].rolled = false
    this.#rolledDice[which].bonusDice = []
    this.#rolledDice[which].penaltyDice = []
    for (const roll of allRolls) {
      for (const d of roll.dice) {
        if (d instanceof CONFIG.Dice.terms.t) {
          this.#rollMethod = d.method
          for (const result of d.results) {
            if (!baseSet) {
              this.#rolledDice[which].baseDie = result.result
              baseSet = true
            } else if (penaltyDiceCount > 0) {
              this.#rolledDice[which].penaltyDice.push(result.result)
              penaltyDiceCount--
            } else {
              this.#rolledDice[which].bonusDice.push(result.result)
              bonusDiceCount--
            }
          }
        } else if (d instanceof CONFIG.Dice.terms.d) {
          this.#rolledDice[which].unitDie = d.results[0].result
          unitSet = true
        }
      }
    }
    if (!baseSet || !unitSet || bonusDiceCount !== 0 || penaltyDiceCount !== 0) {
      throw new Error('Invalid Pool Roll')
    }
    this.#rolledDice[which].rolled = true
  }

  /**
   * Roll pool (push)
   */
  async pushRoll () {
    const dicePool = [
      '1dt+1d10'
    ]
    if (this.#penaltyCount > 0) {
      const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier: -this.#penaltyCount })
      dicePool.push('+' + this.#penaltyCount + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt'))
    }
    if (this.#bonusCount > 0) {
      const alternativeDice = CoC7DicePool.#alternativeDice({ poolModifier: this.#bonusCount })
      dicePool.push('+' + this.#bonusCount + (alternativeDice !== '' ? 'do[' + alternativeDice + ']' : 'dt'))
    }
    const rolls = [await new Roll(dicePool.join('')).roll()]
    if (this.#rolledDice.length === 1) {
      this.#rolledDice.push({
        rolled: false,
        baseDie: 0,
        bonusDice: [],
        penaltyDice: [],
        unitDie: 0
      })
    }
    this.#rollResults = []
    this.#rollsExisting = []
    this.#processRolls(1, rolls)
  }

  /**
   * Export this pool
   * @returns {object}
   */
  toObject () {
    return {
      bonusCount: this.#bonusCount,
      currentPoolModifier: this.#currentPoolModifier,
      difficulty: this.#difficulty,
      flatDiceModifier: this.#flatDiceModifier,
      flatThresholdModifier: this.#flatThresholdModifier,
      luckSpent: this.#luckSpent,
      groups: this.#groups,
      malfunctionThreshold: this.#malfunctionThreshold,
      penaltyCount: this.#penaltyCount,
      rolledDice: this.#rolledDice,
      rollMethod: this.#rollMethod,
      setSuccess: this.#setSuccess,
      suppressRollData: this.#suppressRollData,
      threshold: this.#threshold
    }
  }
}
