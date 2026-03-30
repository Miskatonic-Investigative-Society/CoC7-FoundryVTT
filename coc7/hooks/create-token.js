/* global Dialog, game, ui */
export default function (document, options, userId) {
  // Only token creator can roll
  if (game.user.id !== userId) return
  // Set token icon correctly
  if (
    document.texture.src === 'icons/svg/mystery-man.svg' &&
    document.texture.src !== document._object.actor.img) {
    document.texture.src = document._object.actor.img
  }

  // If there is something to roll ask if we should roll it
  if (document._object.actor.type !== 'character' && (document._object.actor.hasRollableCharacteristics || document._object.actor.hosRollableSkills)) {
    switch (game.settings.get('CoC7', 'tokenDropMode')) {
      case 'ask':
        new Dialog(
          {
            title: game.i18n.localize('CoC7.TokenCreationRoll.Title'),
            content: game.i18n.localize('CoC7.TokenCreationRoll.Prompt'),
            buttons: {
              roll: {
                label: game.i18n.localize('CoC7.TokenCreationRoll.ButtonRoll'),
                callback: async () => {
                  await document._object.actor.rollCharacteristicsValue()
                  ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Rolled', { name: document.object.actor.name }))
                  document._object.actor.locked = true
                }
              },
              average: {
                label: game.i18n.localize('CoC7.TokenCreationRoll.ButtonAverage'),
                callback: async () => {
                  await document._object.actor.averageCharacteristicsValue()
                  ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Averaged', { name: document.object.actor.name }))
                  document._object.actor.locked = true
                }
              },
              skip: {
                label: game.i18n.localize('CoC7.Migrate.ButtonSkip')
              }
            }
          }).render(true)
        break

      case 'roll':
        document._object.actor.rollCharacteristicsValue()
        ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Rolled', { name: document.object.actor.name }))
        document._object.actor.locked = true
        break

      case 'average':
        document._object.actor.averageCharacteristicsValue()
        ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Averaged', { name: document.object.actor.name }))
        document._object.actor.locked = true
        break

      case 'ignore':
        break
    }
  }
}
