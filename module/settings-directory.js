/* global CONFIG, Dialog, game, Settings */
export class CoC7SettingsDirectory extends Settings {
  activateListeners (html) {
    super.activateListeners(html)
    if (game.user.isGM) {
      html
        .find('#settings-game')
        .append(
          '<button class="trigger-data-migration"><i class="fas fa-wrench"></i> ' +
            game.i18n.localize('CoC7.Migrate.TriggerButton') +
            '</button>'
        )
      html.find('#settings-documentation')
        .append('<button class="trigger-system-manual"><i class="fas fa-books"></i> ' +
        game.i18n.localize('CoC7.System.Documentation') +
        '</button>')
      html.find('.trigger-data-migration').click(() => {
        new Dialog(
          {
            title: game.i18n.localize('CoC7.Migrate.TriggerTitle'),
            content: game.i18n.localize('CoC7.Migrate.TriggerContents'),
            buttons: {
              migrate: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('CoC7.Migrate.TriggerRestart'),
                callback: async () => {
                  await game.settings.set('CoC7', 'systemUpdateVersion', 0)
                  window.location.reload()
                }
              },
              close: {
                icon: '<i class="fas fa-ban"></i>',
                label: game.i18n.localize('Cancel'),
                callback: () => {}
              }
            },
            default: 'close'
          },
          {}
        ).render(true)
      })
      html.find('.trigger-system-manual').click(async () => {
        (await game.packs.get('CoC7.system-doc').getDocument(CONFIG.CoC7.Manual))?.sheet.render(true)
      })
    }
  }
}
