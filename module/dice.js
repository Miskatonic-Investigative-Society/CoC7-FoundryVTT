/* global ChatMessage, CONFIG, foundry, game, Roll */
export class CoC7Dice {
  static async roll (modif = 0, rollMode = null, hideDice = false) {
    let alternativeDice = ''
    if (game.modules.get('dice-so-nice')?.active) {
      if (modif < 0) {
        alternativeDice = game.settings.get('CoC7', 'tenDiePenalty')
      } else if (modif > 0) {
        alternativeDice = game.settings.get('CoC7', 'tenDieBonus')
        // Temporary fix for bronze texture in DsN
        /* // FoundryVTT v12 */
        if (alternativeDice === 'bronze' && foundry.utils.isNewerVersion(game.modules.get('dice-so-nice').version, '5.0.0') && !foundry.utils.isNewerVersion(game.modules.get('dice-so-nice').version, '5.0.5')) {
          alternativeDice = 'bronze01'
        }
      }
    }
    let roll
    if (
      game.CoC7.dev.dice.alwaysCrit &&
      game.settings.get('CoC7', 'hiddendevmenu')
    ) {
      roll = Roll.fromData(CoC7Dice.crit01)
    } else if (
      game.CoC7.dev.dice.alwaysFumble &&
      game.settings.get('CoC7', 'hiddendevmenu')
    ) {
      roll = Roll.fromData(CoC7Dice.fumble99)
    } else {
      roll = await new Roll(
        '1dt' +
          (alternativeDice !== ''
            ? '+1do[' + alternativeDice + ']'
            : '+1dt'
          ).repeat(Math.abs(modif)) +
          '+1d10'
      ).roll({ async: true })
    }

    const result = {
      unit: {
        total: 0,
        results: []
      },
      tens: {
        total: 0,
        results: []
      },
      total: 0,
      roll
    }

    if (rollMode) result.rollMode = rollMode
    if (hideDice) result.hideDice = hideDice
    for (const d of roll.dice) {
      if (d instanceof CONFIG.Dice.terms.t) {
        result.tens.results.push(d.total)
      } else {
        result.unit.total = d.total === 10 ? 0 : d.total
        result.unit.results.push(result.unit.total)
      }
    }
    if (modif < 0) {
      result.tens.total =
        result.unit.total === 0 && result.tens.results.includes(0)
          ? 100
          : Math.max(...result.tens.results)
    } else if (result.unit.total === 0) {
      const dice = result.tens.results.filter(t => t > 0)
      result.tens.total = dice.length === 0 ? 100 : Math.min(...dice)
    } else {
      result.tens.total = Math.min(...result.tens.results)
    }
    result.total = result.unit.total + result.tens.total
    return result
  }

  static async showRollDice3d (roll) {
    if (game.modules.get('dice-so-nice')?.active) {
      const syncDice = game.settings.get('CoC7', 'syncDice3d')

      const chatData = {
        whisper: null,
        blind: false
      }
      ChatMessage.applyRollMode(chatData, game.settings.get('core', 'rollMode'))

      await game.dice3d.showForRoll(
        roll,
        game.user,
        syncDice,
        (chatData.whisper.length === 0 ? null : chatData.whisper),
        chatData.blind
      )
    }
  }

  static async combinedRoll (options) {
    options.pool = options.pool ?? {}
    options.pool['0'] = false
    const keys = Object.keys(options.pool).map(v => parseInt(v, 10))
    let penaltyDice = Math.abs(Math.min(0, Math.min(...keys)))
    let bonusDice = Math.max(0, Math.max(...keys))
    const hasDSN = game.modules.get('dice-so-nice')?.active

    const pool = []
    pool.push('1dt+1d10')

    if (penaltyDice > 0) {
      pool.push(
        (hasDSN
          ? '+1do[' + game.settings.get('CoC7', 'tenDiePenalty') + ']'
          : '+1dt'
        ).repeat(Math.abs(penaltyDice))
      )
    }
    if (bonusDice > 0) {
      pool.push(
        // Temporary fix for bronze texture in DsN
        /* // FoundryVTT v12 */
        (hasDSN
          ? '+1do[' + (game.settings.get('CoC7', 'tenDieBonus') === 'bronze' && foundry.utils.isNewerVersion(game.modules.get('dice-so-nice').version, '5.0.0') && !foundry.utils.isNewerVersion(game.modules.get('dice-so-nice').version, '5.0.5') ? 'bronze01' : game.settings.get('CoC7', 'tenDieBonus')) + ']'
          : '+1dt'
        ).repeat(Math.abs(bonusDice))
      )
    }
    const roll = await new Roll(pool.join('')).roll({ async: true })
    const result = {
      groups: {
        baseDie: 0,
        penaltyDice: [],
        bonusDice: []
      },
      unit: 0,
      roll
    }
    let baseSet = false
    for (const d of roll.dice) {
      if (d instanceof CONFIG.Dice.terms.t) {
        if (!baseSet) {
          result.groups.baseDie = d.total
          baseSet = true
        } else if (penaltyDice > 0) {
          result.groups.penaltyDice.push(d.total)
          penaltyDice--
        } else {
          result.groups.bonusDice.push(d.total)
          bonusDice--
        }
      } else {
        result.unit = d.total === 10 ? 0 : d.total
      }
    }

    const output = {}

    for (const key in options.pool) {
      output[key] = {
        unit: {
          total: result.unit,
          results: [result.unit]
        },
        tens: {
          total: 0,
          results: []
        },
        total: 0,
        roll
      }
      const modif = parseInt(key, 10)
      let modifier = modif
      output[key].tens.results.push(result.groups.baseDie)
      for (const offset = Math.abs(modifier); modifier < 0; modifier++) {
        output[key].tens.results.push(
          result.groups.penaltyDice[modifier + offset]
        )
      }
      for (const offset = modifier; modifier > 0; modifier--) {
        output[key].tens.results.push(
          result.groups.bonusDice[Math.abs(modifier - offset)]
        )
      }
      if (modif < 0) {
        output[key].tens.total =
          output[key].unit.total === 0 && output[key].tens.results.includes(0)
            ? 100
            : Math.max(...output[key].tens.results)
      } else if (output[key].unit.total === 0) {
        const dice = output[key].tens.results.filter(t => t > 0)
        output[key].tens.total = dice.length === 0 ? 100 : Math.min(...dice)
      } else {
        output[key].tens.total = Math.min(...output[key].tens.results)
      }
      output[key].total = output[key].unit.total + output[key].tens.total
    }
    return output
  }

  // Predetermined value of dice, used only for DEV and test purposes
  static fumble99 = {
    class: 'Roll',
    options: {},
    dice: [],
    formula: '1dt + 1d10',
    terms: [
      {
        class: 'CoC7DecaderDie',
        options: {},
        evaluated: true,
        number: 1,
        faces: 10,
        modifiers: [],
        results: [
          {
            result: 9,
            active: true
          }
        ]
      },
      {
        class: 'OperatorTerm',
        options: {},
        evaluated: true,
        operator: '+'
      },
      {
        class: 'Die',
        options: {},
        evaluated: true,
        number: 1,
        faces: 10,
        modifiers: [],
        results: [
          {
            result: 9,
            active: true
          }
        ]
      }
    ],
    total: 99,
    evaluated: true
  }

  static crit01 = {
    class: 'Roll',
    options: {},
    dice: [],
    formula: '1dt + 1d10',
    terms: [
      {
        class: 'CoC7DecaderDie',
        options: {},
        evaluated: true,
        number: 1,
        faces: 10,
        modifiers: [],
        results: [
          {
            result: 10,
            active: true
          }
        ]
      },
      {
        class: 'OperatorTerm',
        options: {},
        evaluated: true,
        operator: '+'
      },
      {
        class: 'Die',
        options: {},
        evaluated: true,
        number: 1,
        faces: 10,
        modifiers: [],
        results: [
          {
            result: 1,
            active: true
          }
        ]
      }
    ],
    total: 1,
    evaluated: true
  }
}
