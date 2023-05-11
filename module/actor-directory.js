/* global ActorDirectory, CONST, game */
import { CoC7ActorImporterDialog } from './apps/actor-importer-dialog.js'
import { CoC7InvestigatorWizard } from './apps/investigator-wizard.js'

export class CoC7ActorDirectory extends ActorDirectory {
  activateListeners (html) {
    super.activateListeners(html)

    // Allow Investigator Wizard
    //  * If the user role is allowed to create actors
    //  * If the user has less owned actors than allowed in settings
    let allowWizard = game.user.role >= CONST.USER_PERMISSIONS.ACTOR_CREATE.defaultRole
    if (!allowWizard) {
      const allowed = game.settings.get('CoC7', 'InvestigatorWizardQuantity')
      if (allowed > 0) {
        const existing = game.actors.filter(a => [a.ownership.default, (a.ownership[game.user.id] ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE)].includes(CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).length
        allowWizard = existing < allowed
      }
    }

    if (allowWizard) {
      html
        .find('footer.directory-footer')
        .append('<a class="investigator-wizard">' + game.i18n.localize('CoC7.InvestigatorWizard.Title') + '</a>')
      html.find('.investigator-wizard').click(() => {
        CoC7InvestigatorWizard.create()
      })
    }

    if (game.user.role >= CONST.USER_PERMISSIONS.ACTOR_CREATE.defaultRole) {
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
