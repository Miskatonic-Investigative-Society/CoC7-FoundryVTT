/* global $, game, ItemSheet, mergeObject */

export class CoC7SpellSheet extends ItemSheet {
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/items/spell/main.html',
      classes: ['coc7', 'item', 'spell'],
      width: 500,
      height: 'auto',
      resizable: false,
      scrollY: ['.body'],
      tabs: [
        {
          navSelector: '.navigation',
          contentSelector: '.body',
          initial: 'description'
        }
      ]
    })
  }

  async getData () {
    const data = super.getData()
    const itemData = data.data
    data.data = itemData.data
    data.isKeeper = game.user.isGM
    data.isOwner = this.item.isOwner
    return data
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.find('.option').click(event => this.modifyType(event))
    html.find('#cast-spell').click(event => {
      event.preventDefault()
      this.item.cast()
    })
  }

  /**
   * Toggle the checkboxes for type when user clicks on the corresponding
   * label, not sure if this works on engines other than V8
   * @param {jQuery} event @see activateListeners
   * @returns {jQuery.Event} click
   */
  modifyType (event) {
    event.preventDefault()
    /** Prevents propagation of the same event from being called */
    event.stopPropagation()
    const toggleSwitch = $(event.currentTarget)
    return toggleSwitch.prev().trigger('click')
  }
}
