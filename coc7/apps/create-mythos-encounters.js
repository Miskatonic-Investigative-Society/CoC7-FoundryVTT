/* global $, FormApplication, foundry, game */
export class CoC7CreateMythosEncounter extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7'],
      title: game.i18n.localize('CoC7.SanityLossTypeDialogTitle'),
      template: 'systems/CoC7/templates/apps/sanity-loss-type.hbs',
      height: 'auto'
    })
  }

  async getData () {
    const data = await super.getData()
    data.isImmunity = data.object.type === 'immunity'

    data.encounterTypes = [
      {
        key: 'encounter',
        label: 'CoC7.SanityLossEncounter'
      },
      {
        key: 'immunity',
        label: 'CoC7.SanityLossImmunity'
      }
    ]
    return data
  }

  activateListeners (html) {
    html.find('.field_type').change(this._onSelectChange.bind(this))
    html.find('.dialog-button').click(this._onButtonClick.bind(this))
    super.activateListeners(html)
  }

  _onButtonClick (event) {
    if (event.currentTarget.dataset.button === 'add') {
      const html = $(event.currentTarget).closest('.window-content')
      const type = html.find('.field_type').val()
      const name = html.find('.field_name').val()
      const value = parseInt(html.find('.field_value').val())
      const sanityLossEvents =
        this.object.actor.system.sanityLossEvents ?? []
      sanityLossEvents.push({
        type: name,
        totalLoss: value,
        immunity: type === 'immunity'
      })
      sanityLossEvents.sort(function (left, right) {
        return left.type.localeCompare(right.type)
      })
      this.object.actor.update({ 'system.sanityLossEvents': sanityLossEvents })
    }
    this.close()
  }

  _onSelectChange (event) {
    const html = $(event.currentTarget).closest('.window-content')
    this.object.name = html.find('.field_name').val()
    this.object.type = html.find('.field_type').val()
    this.render(true)
  }

  async _updateObject (event, formData) {}
}
