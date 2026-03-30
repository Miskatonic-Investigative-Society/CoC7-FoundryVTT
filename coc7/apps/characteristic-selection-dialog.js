/* global Dialog, renderTemplate */
export default class CoC7CharacteristicSelectionDialog extends Dialog {
  activateListeners (html) {
    super.activateListeners(html)

    html
      .find('.item-name')
      .click(async event => this._onSelectCharacteristic(event))
  }

  async _onSelectCharacteristic (event) {
    const li = event.currentTarget.closest('.item')
    this.data.data.selected = li.dataset.key
    this.close()
  }

  static async create (data) {
    const html = await renderTemplate(
      'systems/CoC7/templates/apps/char-select.hbs',
      data
    )
    return new Promise(resolve => {
      const dlg = new CoC7CharacteristicSelectionDialog(
        {
          title: data.title,
          content: html,
          data,
          buttons: {},
          close: () => {
            if (data.selected) return resolve(data.selected)
            else return resolve(false)
          }
        },
        { classes: ['coc7', 'dialog', 'char-select'] }
      )
      dlg.render(true)
    })
  }
}
