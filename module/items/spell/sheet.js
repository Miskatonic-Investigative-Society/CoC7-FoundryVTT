/* global game, ItemSheet, mergeObject */

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
    data.isKeeper = game.user.isGM
    data.learned = true
    return data
  }
}
