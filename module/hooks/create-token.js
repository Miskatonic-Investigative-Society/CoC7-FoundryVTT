/* global Hooks, Dialog, game */
export function listen () {
  Hooks.on('createToken', async (tokenDocument, options, actorId) => {
    // Set token icon correctly
    if (
      tokenDocument.texture.src === 'icons/svg/mystery-man.svg' &&
      tokenDocument.texture.src !== tokenDocument._object.actor.img) {
      tokenDocument.texture.src = tokenDocument._object.actor.img
    }

    // If there is something to roll ask if we should roll it
    if (tokenDocument._object.actor.hasRollableCharacteristics || tokenDocument._object.actor.hosRollableSkills) {
      new Dialog(
        {
          title: game.i18n.localize('CoC7.TokenCreationRoll.Title'),
          content: game.i18n.localize('CoC7.TokenCreationRoll.Prompt'),
          buttons: {
            roll: {
              label: game.i18n.localize('CoC7.TokenCreationRoll.ButtonRoll'),
              callback: async () => await tokenDocument._object.actor.rollCharacteristicsValue()
            },
            average: {
              label: game.i18n.localize('CoC7.TokenCreationRoll.ButtonAverage'),
              callback: async () => await tokenDocument._object.actor.averageCharacteristicsValue()
            },
            skip: {
              label: game.i18n.localize('CoC7.Migrate.ButtonSkip')
            }
          }
        }).render(true)
    }
  })
}
