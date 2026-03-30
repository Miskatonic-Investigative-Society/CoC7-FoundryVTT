/* global CONFIG Dialog foundry game */
function showDialog () {
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
}

export default function (application, html, data) {
  if (game.user.isGM) {
    /* // FoundryVTT V12 */
    if (foundry.utils.isNewerVersion(game.version, '13')) {
      {
        const menuButton = document.createElement('button')
        menuButton.classList.add('trigger-data-migration', 'fas', 'fa-wrench')
        menuButton.textContent = game.i18n.localize('CoC7.Migrate.TriggerButton')
        html.querySelector('section.settings').append(menuButton)
        html.querySelector('.trigger-data-migration').addEventListener('click', () => showDialog())
      }
      {
        const menuButton = document.createElement('button')
        menuButton.classList.add('trigger-system-manual', 'fas', 'fa-books')
        menuButton.textContent = game.i18n.localize('CoC7.System.Documentation')
        html.querySelector('section.documentation').append(menuButton)
        html.querySelector('.trigger-system-manual').addEventListener('click', async () => {
          (await game.packs.get('CoC7.system-doc').getDocument(CONFIG.CoC7.Manual))?.sheet.render(true)
        })
      }
    } else {
      html
        .find('#settings-game')
        .append('<button class="trigger-data-migration"><i class="fas fa-wrench"></i> ' + game.i18n.localize('CoC7.Migrate.TriggerButton') + '</button>')
      html.find('#settings-documentation')
        .append('<button class="trigger-system-manual"><i class="fas fa-books"></i> ' + game.i18n.localize('CoC7.System.Documentation') + '</button>')
      html.find('.trigger-data-migration').click(() => showDialog())
      html.find('.trigger-system-manual').click(async () => {
        (await game.packs.get('CoC7.system-doc').getDocument(CONFIG.CoC7.Manual))?.sheet.render(true)
      })
    }
  }
}
