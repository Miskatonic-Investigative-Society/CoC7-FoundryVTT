/* global game, Hooks, isNewerVersion */
import { CoC7Tooltips } from '../apps/tooltips.js'

// import { CoC7WelcomeMessage } from '../apps/welcome-message.js'

export function listen () {
  Hooks.once('ready', async () => {
    console.log('Call of Cthulhu 7th Edition | Ready')
    if (game.settings.get('CoC7', 'showWelcomeMessage') && game.user.isGM) {
      /** This will prompt the welcome message when it is  finished */
      // await CoC7WelcomeMessage.create()
    }
    game.CoC7Tooltips = new CoC7Tooltips()

    const instructionsVersion = game.settings.get('CoC7', 'showInstructions')
    if (isNewerVersion(game.system.data.version, instructionsVersion ?? '0')) {
      ;(
        await game.packs.get('CoC7.system-doc').getDocument('wZtTHpGV3atKV2oD')
      ).sheet.render(true)
      // game.settings.set('CoC7', 'showInstructions', game.system.data.version) // Don't turn off while testing
    }
  })
}
