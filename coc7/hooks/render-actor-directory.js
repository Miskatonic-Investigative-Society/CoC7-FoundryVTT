/* global CONST, foundry, game */
import { CoC7ActorImporterDialog } from '../apps/actor-importer-dialog.js'
import { CoC7InvestigatorWizard } from '../apps/investigator-wizard.js'

export default function (application, html, data) {
  // Allow Investigator Wizard
  //  * If the user role is allowed to create actors
  //  * If the user has less owned actors than allowed in settings
  let allowWizard = game.user.hasPermission('ACTOR_CREATE')
  if (!allowWizard) {
    const allowed = game.settings.get('CoC7', 'InvestigatorWizardQuantity')
    if (allowed > 0) {
      const existing = game.actors.filter(a => [a.ownership.default, (a.ownership[game.user.id] ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE)].includes(CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).length
      allowWizard = existing < allowed
    }
  }

  if (allowWizard) {
    /* // FoundryVTT v12 */
    if (foundry.utils.isNewerVersion(game.version, '13')) {
      const menu = html.querySelector('footer.directory-footer')
      const link = document.createElement('a')
      link.classList.add('investigator-wizard')
      link.textContent = game.i18n.localize('CoC7.InvestigatorWizard.Title')
      menu.append(link)
      html.querySelector('.investigator-wizard').addEventListener('click', () => CoC7InvestigatorWizard.create())
    } else {
      html
        .find('footer.directory-footer')
        .append('<a class="investigator-wizard">' + game.i18n.localize('CoC7.InvestigatorWizard.Title') + '</a>')
      html.find('.investigator-wizard').click(() => {
        CoC7InvestigatorWizard.create()
      })
    }
  }

  if (game.user.hasPermission('ACTOR_CREATE')) {
    /* // FoundryVTT v12 */
    if (foundry.utils.isNewerVersion(game.version, '13')) {
      const menu = html.querySelector('footer.directory-footer')
      const link = document.createElement('a')
      link.classList.add('actor-import')
      link.textContent = game.i18n.localize('CoC7.ActorImporter')
      menu.append(link)
      html.querySelector('.actor-import').addEventListener('click', () => CoC7ActorImporterDialog.create())
    } else {
      html
        .find('footer.directory-footer')
        .append(
          '<a class="actor-import">' +
            game.i18n.localize('CoC7.ActorImporter') +
            '</a>'
        )
      html.find('.actor-import').click(() => {
        CoC7ActorImporterDialog.create()
      })
    }
  }
}
