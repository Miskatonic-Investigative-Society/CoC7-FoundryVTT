/* global game */
import { CoC7Check } from '../../core/check.js'

export class CoC7Combat {
  static renderCombatTracker (app, html, data) {
    let combatants
    let aButton
    try {
      combatants = html.querySelectorAll('.combatant')
      aButton = document.createElement('button')
      aButton.setAttribute('type', 'button')
      aButton.classList.add('inline-control', 'combatant-control', 'icon', 'game-icon', 'game-icon-revolver')
      aButton.dataset.control = 'drawGun'
    } catch (e) {
      /* // FoundryVTT v12 */
      combatants = html[0].querySelectorAll('.combatant')
      aButton = document.createElement('a')
      aButton.classList.add('combatant-control')
      aButton.dataset.control = 'drawGun'
      aButton.innerHTML = '<i class="game-icon game-icon-revolver"></i>'
    }
    if (combatants) {
      for (const el of combatants) {
        const combId = el.getAttribute('data-combatant-id')
        const combatantControlsDiv = el.querySelector('.combatant-controls')
        const combatant = data.combat.combatants.get(combId)
        const theButton = aButton.cloneNode(true)
        if (combatant.getFlag('CoC7', 'hasGun')) {
          theButton.setAttribute('title', game.i18n.localize('CoC7.PutGunAway'))
          theButton.classList.add('active')
        } else {
          theButton.setAttribute('title', game.i18n.localize('CoC7.DrawGun'))
        }
        combatantControlsDiv.prepend(theButton)
        theButton.onclick = CoC7Combat._onToggleGun
        if (
          game.settings.get('CoC7', 'initiativeRule') === 'optional' &&
          game.settings.get('CoC7', 'displayInitAsText')
        ) {
          if (combatant.initiative) {
            const tokenInitiative = el.querySelector('.token-initiative')
            /* // FoundryVTT V12 */
            let initiativeTest = tokenInitiative.querySelector('.initiative')
            if (!initiativeTest) {
              initiativeTest = tokenInitiative.querySelector('span')
            }
            const roll =
              100 * combatant.initiative - 100 * Math.floor(combatant.initiative)
            switch (Math.floor(combatant.initiative)) {
              case CoC7Check.successLevel.fumble:
                tokenInitiative.classList.add('fumble')
                initiativeTest.innerText = game.i18n.localize('CoC7.Fumble')
                initiativeTest.title = roll
                break
              case CoC7Check.successLevel.failure:
                tokenInitiative.classList.add('failure')
                initiativeTest.innerText = game.i18n.localize('CoC7.Failure')
                initiativeTest.title = roll
                break
              case CoC7Check.successLevel.regular:
                tokenInitiative.classList.add('regular-success')
                initiativeTest.innerText = game.i18n.localize(
                  'CoC7.RollDifficultyRegular'
                )
                initiativeTest.title = roll
                break
              case CoC7Check.successLevel.hard:
                tokenInitiative.classList.add('hard-success')
                initiativeTest.innerText = game.i18n.localize(
                  'CoC7.RollDifficultyHard'
                )
                initiativeTest.title = roll
                break
              case CoC7Check.successLevel.extreme:
                tokenInitiative.classList.add('extreme-success')
                initiativeTest.innerText = game.i18n.localize(
                  'CoC7.RollDifficultyExtreme'
                )
                initiativeTest.title = roll
                break
              case CoC7Check.successLevel.critical:
                tokenInitiative.classList.add('critical')
                initiativeTest.innerText = game.i18n.localize(
                  'CoC7.RollDifficultyCritical'
                )
                initiativeTest.title = roll
                break
            }
          }
        } else if (combatant.initiative < 0) {
          /* // FoundryVTT V10 */
          // What causes this?
          let h4 = el.querySelector('.token-name').querySelector('h4')
          let span
          if (h4) {
            span = el.querySelector('span.initiative')
          } else {
            h4 = el.querySelector('.token-name').querySelector('.name')
            span = el.querySelector('div.token-initiative span')
          }
          h4.style.fontWeight = '900'
          h4.style.textShadow = '1px 1px 4px darkred'
          if (span) {
            span.style.fontWeight = '900'
            span.style.textShadow = '1px 1px 4px darkred'
          }
          el.style.color = 'darkred'
          el.style.background = 'black'
          el.style.fontWeight = '900'
        }
      }
    }
  }

  static async _onToggleGun (event) {
    event.preventDefault()
    event.stopPropagation()
    const btn = event.currentTarget
    const li = btn.closest('.combatant')
    const c = await game.combat.combatants.get(li.dataset.combatantId)
    if (c.actor.isOwner) {
      if (c.getFlag('CoC7', 'hasGun')) {
        await c.setFlag('CoC7', 'hasGun', false)
      } else {
        await c.setFlag('CoC7', 'hasGun', true)
      }
    }

    const newInit = await c.actor.rollInitiative(!!c.getFlag('CoC7', 'hasGun'))
    if (c.getFlag('CoC7', 'hasGun')) {
      if (c.initiative < newInit) game.combat.setInitiative(c.id, newInit)
    } else game.combat.setInitiative(c.id, newInit)
  }
}

/**
 * Roll initiative for one or multiple Combatants within the Combat entity
 * @param {string|string[]} ids     A Combatant id or Array of ids for which to roll
 * @param {object} [options={}]     Additional options which modify how initiative rolls are created or presented.
 * @param {string|null} [options.formula]         A non-default initiative formula to roll. Otherwise the system default is used.
 * @param {boolean} [options.updateTurn=true]     Update the Combat turn after adding new initiative scores to keep the turn on the same Combatant.
 * @param {object} [options.messageOptions={}]    Additional options with which to customize created Chat Messages
 * @return {Promise<Combat>}        A promise which resolves to the updated Combat entity once updates are complete.
 */
export async function rollInitiative (
  ids,
  { formula = null, updateTurn = true, messageOptions = {} } = {}
) {
  // Iterate over Combatants, performing an initiative roll for each
  const updates = []
  for (const [, id] of ids.entries()) {
    // Get Combatant data (non-strictly)
    const combatant = this.combatants.get(id)

    // Produce an initiative roll for the Combatant
    const roll = await combatant.actor.rollInitiative(
      !!combatant.getFlag('CoC7', 'hasGun')
    )
    updates.push({ _id: id, initiative: roll })
  }
  if (!updates.length) return this

  // Update multiple combatants
  await this.updateEmbeddedDocuments('Combatant', updates)

  return this
}
