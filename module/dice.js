/* global CONFIG, game, Roll */

export class CoC7Dice {
  static async roll (modif = 0, rollMode = null, hideDice = false) {
    let alternativeDice = ''
    if (game.modules.get('dice-so-nice')?.active) {
      if (modif < 0) {
        alternativeDice = game.settings.get('CoC7', 'tenDiePenalty')
      } else if (modif > 0) {
        alternativeDice = game.settings.get('CoC7', 'tenDieBonus')
      }
    }
    const roll = await new Roll(
      '1dt' +
        (
          '+1dt' + (alternativeDice !== '' ? '[' + alternativeDice + ']' : '')
        ).repeat(Math.abs(modif)) +
        '+1d10'
    ).roll({ async: true })
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
      roll: roll
    }
    if (rollMode) result.rollMode = rollMode
    if (hideDice) result.hideDice = hideDice
    roll.dice.forEach(d => {
      if (d instanceof CONFIG.Dice.terms.t) {
        result.tens.results.push(d.total)
      } else {
        result.unit.total = d.total === 10 ? 0 : d.total
        result.unit.results.push(result.unit.total)
      }
    })
    if (modif < 0) {
      result.tens.total = Math.max(...result.tens.results)
    } else {
      result.tens.total = Math.min(...result.tens.results)
    }
    result.total = result.unit.total + result.tens.total
    if (result.total === 0) {
      result.total = 100
    }
    return result
  }

  static async showRollDice3d (roll) {
    if (game.modules.get('dice-so-nice')?.active) {
      const syncDice = game.settings.get('CoC7', 'syncDice3d')

      await game.dice3d.showForRoll(roll, game.user, syncDice)
    }
  }
}
