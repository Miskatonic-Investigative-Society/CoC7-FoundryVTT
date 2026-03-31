/* global foundry game renderTemplate */
import { FOLDER_ID } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7RollNormalize from './roll-normalize.js'

export default class CoC7RollDialog extends foundry.applications.api.DialogV2 {
  /**
   * Show User a roll dialog
   * @param {object} options
   * @returns {object}
   */
  static async create (options = {}) {
    const data = {
      allowFlatDiceModifier: game.settings.get(FOLDER_ID, 'allowFlatDiceModifier') && !options.disableFlatDiceModifier,
      allowFlatThresholdModifier: game.settings.get(FOLDER_ID, 'allowFlatThresholdModifier') && !options.disableFlatThresholdModifier,
      askValue: options.askValue ?? false,
      cardTypes: CoC7RollNormalize.cardTypes(options),
      difficulty: CoC7DicePool.difficultyLevel,
      difficultyTypes: [
        {
          key: CoC7DicePool.difficultyLevel.unknown,
          val: 'CoC7.RollDifficultyUnknownName'
        },
        {
          key: CoC7DicePool.difficultyLevel.regular,
          val: 'CoC7.RollDifficultyRegular'
        },
        {
          key: CoC7DicePool.difficultyLevel.hard,
          val: 'CoC7.RollDifficultyHard'
        },
        {
          key: CoC7DicePool.difficultyLevel.extreme,
          val: 'CoC7.RollDifficultyExtreme'
        }
      ],
      hideDifficulty: options.hideDifficulty === true,
      options: {
        cardType: options.cardType,
        difficulty: options.difficulty,
        flatDiceModifier: options.flatDiceModifier,
        flatThresholdModifier: options.flatThresholdModifier,
        poolModifier: options.poolModifier,
        threshold: options.threshold
      }
    }
    await this.prompt({
      classes: ['coc7', 'dialog', 'bonus-selection'],
      window: {
        title: options.displayName ? game.i18n.format('CoC7.BonusSelectionWindowNamed', { name: options.displayName }) : game.i18n.localize('CoC7.BonusSelectionWindow')
      },
      position: {
        width: 610
      },
      rejectClose: true,
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/apps/bonus.hbs', data),
      ok: {
        callback: (event, button, dialog) => {
          if (typeof button.form.elements.cardType !== 'undefined') {
            data.options.cardType = button.form.elements.cardType.value
          }
          if (typeof button.form.elements.difficulty !== 'undefined') {
            data.options.difficulty = button.form.elements.difficulty.value
          }
          if (typeof button.form.elements.flatDiceModifier !== 'undefined') {
            data.options.flatDiceModifier = button.form.elements.flatDiceModifier.valueAsNumber
          }
          if (typeof button.form.elements.flatThresholdModifier !== 'undefined') {
            data.options.flatThresholdModifier = button.form.elements.flatThresholdModifier.valueAsNumber
          }
          if (typeof button.form.elements.poolModifier !== 'undefined') {
            data.options.poolModifier = button.form.elements.poolModifier.valueAsNumber
          }
          if (typeof button.form.elements.threshold !== 'undefined') {
            data.options.threshold = button.form.elements.threshold.value
          }
        }
      }
    })
    return data.options
  }

  /**
   * Replace function to allow two icons
   * @returns {HTMLElement}
   */
  _renderButtons () {
    const button = document.createElement('button')
    button.setAttribute('type', 'submit')
    button.setAttribute('data-action', 'ok')
    button.toggleAttribute('autofocus', true)
    for (let dice = 2; dice > 0; dice--) {
      const i = document.createElement('i')
      i.className = 'fa-solid fa-dice-d10'
      button.appendChild(i)
    }
    const span = document.createElement('span')
    span.innerText = game.i18n.localize('CoC7.RollDice')
    button.appendChild(span)
    return button.outerHTML
  }
}
