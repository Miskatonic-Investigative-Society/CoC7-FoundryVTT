/* global CONST foundry game */
import { FOLDER_ID } from '../constants.js'
import CoC7ActorImporterDialog from '../apps/actor-importer-dialog.js'
import CoC7InvestigatorWizard from '../apps/investigator-wizard.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  // Allow Investigator Wizard
  //  * If the user role is allowed to create actors
  //  * If the user has less owned actors than allowed in settings
  let allowWizard = game.user.hasPermission('ACTOR_CREATE')
  if (!allowWizard) {
    const allowed = game.settings.get(FOLDER_ID, 'InvestigatorWizardQuantity')
    if (allowed > 0) {
      const existing = game.actors.filter(d => d.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).length
      allowWizard = existing < allowed
    }
  }

  if (allowWizard) {
    const link = document.createElement('button')
    link.type = 'button'
    link.dataset.action = 'investigatorWizard'
    const span = document.createElement('span')
    span.textContent = game.i18n.localize('CoC7.InvestigatorWizard.Title')
    link.append(span)
    /* // FoundryVTT v12 */
    if (foundry.utils.isNewerVersion(game.version, '13')) {
      application.options.actions.investigatorWizard = () => { CoC7InvestigatorWizard.create() }
      element.querySelector('footer.directory-footer').append(link)
    } else {
      element.find('footer.directory-footer').append(link)
      element.find('button[data-action=investigatorWizard').click(() => { CoC7InvestigatorWizard.create() })
    }
  }

  if (game.user.hasPermission('ACTOR_CREATE')) {
    const link = document.createElement('button')
    link.type = 'button'
    link.dataset.action = 'actorImporter'
    const span = document.createElement('span')
    span.textContent = game.i18n.localize('CoC7.ActorImporter')
    link.append(span)
    /* // FoundryVTT v12 */
    if (foundry.utils.isNewerVersion(game.version, '13')) {
      application.options.actions.actorImporter = () => { CoC7ActorImporterDialog.create() }
      element.querySelector('footer.directory-footer').append(link)
    } else {
      element.find('footer.directory-footer').append(link)
      element.find('button[data-action=actorImporter').click(() => { CoC7ActorImporterDialog.create() })
    }
  }
}
