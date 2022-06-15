export class CoC7ChaseParticipantImporter extends Dialog {
  activateListeners (html) {
    super.activateListeners(html)

    const participantDragDrop = new DragDrop({
      dropSelector: '#chase-participant-importer',
      callbacks: { drop: this._onDropParticipant.bind(this) }
    })
    participantDragDrop.bind(html[0])
  }

  async _onDropParticipant (event) {
    ui.notifications.info('dropped !!!')
  }

  static async create (data) {

    const fromData = foundry.utils.duplicate( data)
    const html = await renderTemplate(
      'systems/CoC7/templates/apps/chase-participant-importer.html',
      fromData
    )

    return new Promise(resolve => {
      const dlg = new CoC7ChaseParticipantImporter(
        {
          title: data.title,
          content: html,
          data: data,
          buttons: {
            import: {
              icon: '<i class="fas fa-file-import"></i>',
              label: game.i18n.localize('CoC7.Import'),
              callback: async html =>{
                const popo = await CoC7ChaseParticipantImporter.importActor(html)
                data.pipi = "pipi"
                resolve( popo)}
            },
            no: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('CoC7.Cancel')
            }
          }
        },
        {
          classes: ['coc7', 'dialog', 'actor-importer', 'chase-participant-importer'],
          width: 300
        }
      )
      dlg.render(true)
    })
  }

  static async importActor(html){
    ui.notifications.info('imported')
    return {caca: 'popo'}
  }


}
