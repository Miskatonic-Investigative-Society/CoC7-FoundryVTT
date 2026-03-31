/* global game */
import { FOLDER_ID } from '../constants.js'
import CoC7DicePool from './dice-pool.js'

export default class CoC7Combat {
  /**
   * Render Hook
   * @param {ApplicationV2} application
   * @param {HTMLElement} element
   * @param {ApplicationRenderContext} context
   * @param {ApplicationRenderOptions} options
   */
  static renderCombatTracker (application, element, context, options) {
    /* // FoundryVTT V12 */
    const combatants = (element[0] ?? element).querySelectorAll('.combatant')
    /* // FoundryVTT V12 */
    let newButton
    if (game.release.generation === 12) {
      newButton = document.createElement('a')
      newButton.classList.add('combatant-control')
      newButton.dataset.control = 'drawGun'
      newButton.innerHTML = '<i class="game-icon game-icon-revolver"></i>'
    } else {
      newButton = document.createElement('button')
      newButton.setAttribute('type', 'button')
      newButton.classList.add('inline-control', 'combatant-control', 'icon', 'game-icon', 'game-icon-revolver')
      newButton.dataset.control = 'drawGun'
    }
    if (combatants) {
      for (const element of combatants) {
        const combatantId = element.dataset.combatantId
        const combatantControls = element.querySelector('.combatant-controls')
        const combatant = context.combat.combatants.get(combatantId)
        const theButton = newButton.cloneNode(true)
        if (combatant.getFlag('CoC7', 'hasGun')) {
          theButton.setAttribute('title', game.i18n.localize('CoC7.PutGunAway'))
          theButton.classList.add('active')
        } else {
          theButton.setAttribute('title', game.i18n.localize('CoC7.DrawGun'))
        }
        combatantControls.prepend(theButton)
        theButton.onclick = CoC7Combat._onToggleGun
        if (combatant.initiative !== null) {
          if (game.settings.get(FOLDER_ID, 'initiativeRule') === 'optional' && game.settings.get(FOLDER_ID, 'displayInitAsText')) {
            const tokenInitiative = element.querySelector('.token-initiative')
            /* // FoundryVTT V12 */
            const initiativeText = tokenInitiative.querySelector('.initiative') ?? tokenInitiative.querySelector('span')
            const parts = combatant.initiative.toString().match(/^(-?\d+)(?:\.(\d+))?$/)
            initiativeText.title = parts[2] ?? 0
            switch (parseInt(parts[1], 10)) {
              case CoC7DicePool.successLevel.fumble:
                tokenInitiative.classList.add('fumble')
                initiativeText.innerText = game.i18n.localize('CoC7.Fumble')
                break
              case CoC7DicePool.successLevel.failure:
                tokenInitiative.classList.add('failure')
                initiativeText.innerText = game.i18n.localize('CoC7.Failure')
                break
              case CoC7DicePool.successLevel.regular:
                tokenInitiative.classList.add('regular-success')
                initiativeText.innerText = game.i18n.localize('CoC7.RollDifficultyRegular')
                break
              case CoC7DicePool.successLevel.hard:
                tokenInitiative.classList.add('hard-success')
                initiativeText.innerText = game.i18n.localize('CoC7.RollDifficultyHard')
                break
              case CoC7DicePool.successLevel.extreme:
                tokenInitiative.classList.add('extreme-success')
                initiativeText.innerText = game.i18n.localize('CoC7.RollDifficultyExtreme')
                break
              case CoC7DicePool.successLevel.critical:
                tokenInitiative.classList.add('critical')
                initiativeText.innerText = game.i18n.localize('CoC7.RollDifficultyCritical')
                break
            }
          } else if (combatant.initiative < 0) {
            element.classList.add('negative-initiative')
          }
        }
      }
    }
  }

  /**
   * Toggle combatant gun
   * @param {ClickEvent} event
   */
  static async _onToggleGun (event) {
    event.preventDefault()
    event.stopPropagation()
    const btn = event.currentTarget
    const li = btn.closest('.combatant')
    const combatant = await game.combat.combatants.get(li.dataset.combatantId)
    if (combatant.actor.isOwner) {
      if (combatant.getFlag('CoC7', 'hasGun')) {
        await combatant.setFlag('CoC7', 'hasGun', false)
      } else {
        await combatant.setFlag('CoC7', 'hasGun', true)
      }
    }

    const newInit = await combatant.actor.rollInitiative(!!combatant.getFlag('CoC7', 'hasGun'))
    if (combatant.getFlag('CoC7', 'hasGun')) {
      if (combatant.initiative < newInit) {
        game.combat.setInitiative(combatant.id, newInit)
      }
    } else {
      game.combat.setInitiative(combatant.id, newInit)
    }
  }

  /**
   * Roll initiative for one or multiple Combatants within the Combat entity
   * @param {string|string[]} ids           A Combatant id or Array of ids for which to roll
   * @param {object} options                Additional options which modify how initiative rolls are created or presented.
   * @param {string|null} options.formula   A non-default initiative formula to roll. Otherwise the system default is used.
   * @param {boolean} options.updateTurn    Update the Combat turn after adding new initiative scores to keep the turn on the same Combatant.
   * @param {object} options.messageOptions Additional options with which to customize created Chat Messages
   * @returns {Promise<Combat>}             A promise which resolves to the updated Combat entity once updates are complete.
   */
  static async rollInitiative (ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
    // Iterate over Combatants, performing an initiative roll for each
    if (typeof ids === 'string') {
      ids = [ids]
    }
    const updates = []
    for (const id of ids) {
      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id)
      if (!combatant?.isOwner) {
        continue
      }

      // Produce an initiative roll for the Combatant
      const roll = await combatant.actor.rollInitiative(!!combatant.getFlag('CoC7', 'hasGun'))
      updates.push({ _id: id, initiative: roll })
    }
    if (!updates.length) return this

    // Update multiple combatants
    await this.updateEmbeddedDocuments('Combatant', updates)

    return this
  }
}
