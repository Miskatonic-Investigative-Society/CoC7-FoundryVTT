/* global game, Hooks */
import { CoC7DecaderDie } from '../apps/decader-die.js'

export function listen () {
  Hooks.on('renderRealRoll', (app, html, options) => {
    for (const term in options.dieTerms) {
      for (const input in options.dieTerms[term].inputs) {
        if (options.dieTerms[term] instanceof CoC7DecaderDie) {
          const tag = html.find('[name="' + term + '.' + input + '"]')
          if (tag.length === 1) {
            tag[0].placeholder = game.i18n.localize('CoC7.RealRollDecaderPlaceholderName')
          }
        }
      }
    }
  })
}
