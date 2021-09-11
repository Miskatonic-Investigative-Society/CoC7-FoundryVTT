/* global ActorDirectory, game */
import { CoC7ActorImporterDialog } from './apps/actor-importer-dialog.js'

export class CoC7ActorDirectory extends ActorDirectory {
  activateListeners (html) {
    super.activateListeners(html)
    html
      .find('footer.directory-footer')
      .append(
        '<a class="actor-import">' +
          game.i18n.localize('CoC7.ActorImporter') +
          '</a>'
      )
    html.find('.actor-import').click(() => {
      CoC7ActorImporterDialog.create({
        title: game.i18n.localize('CoC7.ActorImporter')
      })
    })
  }
}
