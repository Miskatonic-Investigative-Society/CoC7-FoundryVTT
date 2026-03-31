/* global $ fromUuid game TokenDocument */
import { FOLDER_ID } from '../constants.js'
import CoC7ChatChaseObstacle from '../apps/chat-chase-obstacle.js'
import CoC7ChatCombatMelee from '../apps/chat-combat-melee.js'
import CoC7ChatCombatRanged from '../apps/chat-combat-ranged.js'
import CoC7ChatDamage from '../apps/chat-damage.js'
import CoC7ChatMessage from '../apps/chat-message.js'
import CoC7ChatCombinedMessage from '../apps/chat-combined-message.js'
import CoC7ChatOpposedMessage from '../apps/chat-opposed-message.js'
import CoC7Check from '../apps/check.js'
import CoC7ConCheck from '../apps/con-check.js'
import CoC7SanCheckCard from '../apps/san-check-card.js'
import CoC7Utilities from '../apps/utilities.js'

/**
 * Render Hook
 * @param {documents.ChatMessage} message
 * @param {HTMLElement} html
 * @param {ApplicationRenderContext} context
 */
export default async function (message, html, context) {
  const trustedViewer = (game.user.isTrusted && game.settings.get('CoC7', 'trustedCanSeeChatCard'))
  if (game.user.isGM || trustedViewer) {
    if (!game.user.isGM) {
      html.querySelectorAll('.keeper-only-block button').forEach((element) => { element.disabled = true })
      html.querySelectorAll('.keeper-only-block a').forEach((element) => { element.classList.add('not-allowed') })
    }
    html.querySelectorAll('.not-keeper-block').forEach((element) => element.remove())
  } else {
    html.querySelectorAll('.keeper-only-block').forEach((element) => element.remove())
  }
  const trustedModifier = (game.user.isTrusted && game.settings.get('CoC7', 'trustedCanModfyChatCard'))
  if (!game.user.isGM && !trustedModifier) {
    html.querySelectorAll('.keeper-only-control').forEach((element) => { element.disabled = true })
  }
  /* // FoundryV13 workaround new rolls being automatically expanded */
  if (game.release.generation === 13) {
    setTimeout(() => {
      html.querySelectorAll('.never-expand.expanded[data-action=expandRoll]').forEach((element) => { element.classList.remove('expanded') })
    }, 500)
  }
  if (typeof message.flags[FOLDER_ID]?.load?.as !== 'undefined') {
    const allowed = await CoC7Utilities.canModifyActor({ message })
    html.querySelectorAll('.owner-and-keeper-block').forEach((element) => {
      if (!game.user.isGM && !trustedViewer && !allowed.includes(element.dataset.actorUuid)) {
        element.remove()
      }
    })
    html.querySelectorAll('.other-players-only-block').forEach((element) => {
      if (game.user.isGM || trustedViewer || allowed.includes(element.dataset.actorUuid)) {
        element.remove()
      }
    })
    html.querySelectorAll('.owner-only-block').forEach((element) => {
      if (game.user.isGM || !allowed.includes(element.dataset.actorUuid)) {
        element.remove()
      }
    })
    html.querySelectorAll('.open-actor').forEach((element) => {
      if (game.user.isGM || allowed.includes(element.dataset.actorUuid)) {
        element.addEventListener('dblclick', async event => {
          const actor = await fromUuid(element.dataset.actorUuid)
          if (actor) {
            if (actor instanceof TokenDocument) {
              actor.actor.sheet.render({ force: true })
            } else {
              actor.sheet.render({ force: true })
            }
          }
        })
        element.classList.add('clickable')
      }
    })
    switch (message.flags[FOLDER_ID].load.as) {
      case 'CoC7ChatCombatMelee':
        CoC7ChatCombatMelee._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7ChatCombatRanged':
        CoC7ChatCombatRanged._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7ChatChaseObstacle':
        CoC7ChatChaseObstacle._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7ChatDamage':
        CoC7ChatDamage._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7Check':
        CoC7Check._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7ChatCombinedMessage':
        CoC7ChatCombinedMessage._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7ChatMessage':
        CoC7ChatMessage._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7ChatOpposedMessage':
        CoC7ChatOpposedMessage._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7ConCheck':
        CoC7ConCheck._onRenderMessage(message, html, context, allowed)
        break
      case 'CoC7SanCheckCard':
        CoC7SanCheckCard._onRenderMessage(message, html, context, allowed)
        break
    }
  }
  html.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', async event => {
      switch (event.currentTarget.dataset.action) {
        case 'toggleBlock':
          {
            const blocks = html.querySelectorAll('.coc7-chat-toggled')
            console.log(blocks)
            if (typeof blocks[event.currentTarget.dataset.offset] !== 'undefined') {
              /* // jQuery */
              $(blocks[event.currentTarget.dataset.offset]).slideToggle(200)
            }
          }
          break
      }
    })
  })
}
