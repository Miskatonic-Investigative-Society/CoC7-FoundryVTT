/* global Dialog, foundry, game */
export class DropCoCID extends Dialog {
  static processForm (response, element, resolve) {
    if (element.find('input').is(':checked')) {
      game.settings.set('CoC7', 'dropCoCID', (response ? 'Y' : 'N'))
    }
    resolve(response)
  }

  static processItem (response, item) {
    if (response && item.flags?.CoC7?.cocidFlag?.id) {
      return item.flags.CoC7.cocidFlag.id
    }
    return foundry.utils.duplicate(item)
  }

  static async create () {
    const dropCoCID = game.settings.get('CoC7', 'dropCoCID')
    switch (dropCoCID) {
      case '':
        return new Promise(resolve => {
          const dlg = new DropCoCID({
            title: game.i18n.format('CoC7.Settings.DropCoCID.Name'),
            content: '<p>' + game.i18n.format('CoC7.Settings.DropCoCID.Dialog') + '</p><p><input type="checkbox" id="rememberthis" style="vertical-align: sub;"><label for="rememberthis">' + game.i18n.format('CoC7.Settings.DropCoCID.Remember') + '</label></p>',
            classes: ['coc7', 'app', 'dialog'],
            buttons: {
              yes: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('Yes'),
                callback: (element) => { DropCoCID.processForm(true, element, resolve) }
              },
              no: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('No'),
                callback: (element) => { DropCoCID.processForm(false, element, resolve) }
              }
            }
          })
          dlg.render(true)
        })
      case 'Y':
        return true
      case 'N':
        return false
    }
  }
}
