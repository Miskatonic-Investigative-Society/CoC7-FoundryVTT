/* global game, Handlebars, mergeObject */

import { CoC7ItemSheet } from '../sheets/item-sheet.js'

export class CoC7BookSheet extends CoC7ItemSheet {
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/items/book/main.hbs',
      classes: ['coc7', 'item', 'book'],
      width: 500,
      height: 'auto',
      resizable: false,
      dragDrop: [{ dragSelector: '.spells', dropSelector: null }],
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

  getData () {
    const data = super.getData()
    const itemData = data.data
    data.data = itemData.data
    data.isKeeper = game.user.isGM
    data.isOwned = this.item.isOwned
    /** Allows using conditional OR under Handlebars templates */
    Handlebars.registerHelper('or', function (v1, v2, options) {
      return v1 || v2 ? options.fn(this) : options.inverse(this)
    })
    return data
  }

  activateListeners () {}
}
