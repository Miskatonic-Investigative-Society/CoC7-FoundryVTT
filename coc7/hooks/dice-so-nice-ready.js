import { FOLDER_ID } from '../constants.js'
import CoC7ChatCombatMelee from '../apps/chat-combat-melee.js'

/**
 * Add decader dice to DsN
 * @param {DsN} dice3d
 */
export default function (dice3d) {
  Hooks.on('diceSoNiceRollStart', (messageId, context) => {
    if (!messageId || !context || context.blind || game.user.isGM) return

    const message = game.messages.get(messageId)
    if (message?.isContentVisible !== true) return

    const load = message.flags[FOLDER_ID]?.load
    if (load?.as !== 'CoC7ChatCombatMelee' || load.participant !== CoC7ChatCombatMelee.participant.initiator || load.checkRevealed !== false) return
    if (game.user.isTrusted && game.settings.get(FOLDER_ID, 'trustedCanSeeChatCard')) return

    // Skip only this client's animation so Dice So Nice can still complete the chat roll.
    context.blind = true
  })

  dice3d.addDicePreset({
    type: 'dt',
    labels: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '00'],
    fontScale: 0.75,
    system: 'standard'
  })
  dice3d.addDicePreset({
    type: 'do',
    labels: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '00'],
    fontScale: 0.75,
    system: 'standard'
  })
}
