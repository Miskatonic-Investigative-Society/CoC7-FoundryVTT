/* global game, Settings */
import { CoC7Tutorial } from '../apps/tutorials.js'

export class CoC7SettingsDirectory extends Settings {
  activateListeners (html) {
    super.activateListeners(html)
    if (game.user.isGM) {
      html
        .find('#settings-documentation')
        .append('<button data-action="tutorial" class="trigger-tutorial"><i class="fas fa-chalkboard-teacher"></i> ' + game.i18n.localize('CoC7.Tutorial.Button') + '</button>')
      html.find('.trigger-tutorial').click(() => {
        game.CoC7Tutorial = new CoC7Tutorial()
        game.CoC7Tutorial.choose()
      })
    }
  }
}
