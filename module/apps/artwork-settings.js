import { CoC7Utilities } from '../utilities.js'

/* global Dialog, game, FormApplication */
export class CoC7ArtworkSettings extends FormApplication {
  render () {
    new Dialog(
      {
        title: game.i18n.localize('SETTINGS.ArtworkConfigurationLabel'),
        content: 'Resets fonts to default',
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Reset',
            callback: CoC7Utilities.resetFonts
          },
          no: {
            icon: '<i class="fas fa-ban"></i>',
            label: game.i18n.localize('Cancel'),
            callback: () => {}
          }
        },
        default: 'close'
      },
      {}
    ).render(true)
  }
}
