/* global game, Hooks */

// import { CoC7WelcomeMessage } from '../apps/welcome-message.js'

export function listen () {
  Hooks.once('ready', async () => {
    console.log('Call of Cthulhu 7th Edition | Ready')
    if (game.settings.get('CoC7', 'showWelcomeMessage') && game.user.isGM) {
      /** This will prompt the welcome message when it is  finished */
      // await CoC7WelcomeMessage.create()
    }
  })
}
