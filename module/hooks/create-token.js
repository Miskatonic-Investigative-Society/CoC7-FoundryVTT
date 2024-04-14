/* global Hooks, Dialog, game, ui */
export function listen () {
  Hooks.on('createToken', async (tokenDocument, options, craetorId) => {
    // Only token creator can roll
    if (game.user.id !== craetorId) return
    // Set token icon correctly
    if (
      tokenDocument.texture.src === 'icons/svg/mystery-man.svg' &&
      tokenDocument.texture.src !== tokenDocument._object.actor.img) {
      tokenDocument.texture.src = tokenDocument._object.actor.img
    }

    // If there is something to roll ask if we should roll it
    if (tokenDocument._object.actor.type !== 'character' && (tokenDocument._object.actor.hasRollableCharacteristics || tokenDocument._object.actor.hosRollableSkills)) {
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
                    await tokenDocument._object.actor.rollCharacteristicsValue()
                    ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Rolled', { name: tokenDocument.object.actor.name }))
                    tokenDocument._object.actor.locked = true
                  }
                },
                average: {
                  label: game.i18n.localize('CoC7.TokenCreationRoll.ButtonAverage'),
                  callback: async () => {
                    await tokenDocument._object.actor.averageCharacteristicsValue()
                    ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Averaged', { name: tokenDocument.object.actor.name }))
                    tokenDocument._object.actor.locked = true
                  }
                },
                skip: {
                  label: game.i18n.localize('CoC7.Migrate.ButtonSkip')
                }
              }
            }).render(true)
          break

        case 'roll':
          tokenDocument._object.actor.rollCharacteristicsValue()
          ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Rolled', { name: tokenDocument.object.actor.name }))
          tokenDocument._object.actor.locked = true
          break

        case 'average':
          tokenDocument._object.actor.averageCharacteristicsValue()
          ui.notifications.info(game.i18n.format('CoC7.TokenCreationRoll.Averaged', { name: tokenDocument.object.actor.name }))
          tokenDocument._object.actor.locked = true
          break

        case 'ignore':
          break
      }
    }
  })
}
