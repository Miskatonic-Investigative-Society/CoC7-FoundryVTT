/* global foundry game ui */
import { FOLDER_ID } from '../constants.js'

/**
 * Create token
 * @param {Document} document
 * @param {object} options
 * @param {string} userId
 */
export default async function (document, options, userId) {
  // Only token creator can roll
  if (game.user.id !== userId) return
  // Set token icon correctly
  if (document.texture.src === 'icons/svg/mystery-man.svg' && document.texture.src !== document.actor.img) {
    document.texture.src = document.actor.img
  }

  // If there is something to roll ask if we should roll it
  if (document.actor.type !== 'character' && document.actor.hasRollableCharacteristics) {
    let tokenDropMode = game.settings.get(FOLDER_ID, 'tokenDropMode')
    if (tokenDropMode === 'ask') {
      tokenDropMode = await new Promise(resolve => {
        new foundry.applications.api.DialogV2({
          window: {
            title: 'CoC7.TokenCreationRoll.Title'
          },
          content: game.i18n.localize('CoC7.TokenCreationRoll.Prompt'),
          buttons: [{
            action: 'roll',
            label: 'CoC7.TokenCreationRoll.ButtonRoll'
          }, {
            action: 'average',
            label: 'CoC7.TokenCreationRoll.ButtonAverage'
          }, {
            action: 'ignore',
            label: 'CoC7.Migrate.ButtonSkip',
            default: true
          }],
          submit: result => {
            resolve(result)
          }
        }).render({ force: true })
      })
    }
    switch (tokenDropMode) {
      case 'roll':
        await document.actor.rollCharacteristicsValue()
        /* // FoundryVTT V12 */
        ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Rolled', { name: document.actor.name }))
        document.actor.update({ 'system.flags.locked': true })
        break

      case 'average':
        await document.actor.averageCharacteristicsValue()
        /* // FoundryVTT V12 */
        ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Averaged', { name: document.actor.name }))
        document.actor.update({ 'system.flags.locked': true })
        break

      case 'ignore':
        break
    }
  }
}
