/* global $, duplicate, game, Handlebars, mergeObject */

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

  activateListeners (html) {
    super.activateListeners(html)
    html.find("[name='data.study.necessary']").change(event => {
      const value = parseInt(event.currentTarget.value)
      this.item.changeProgress('reset', value)
    })
    html.find('#increase-progress').click(() => {
      this.item.changeProgress('increase')
    })
    html.find('#decrease-progress').click(() => {
      this.item.changeProgress('decrease')
    })
    html.find('.add-other-gains').click(event => {
      this.modifyOthersGains(event, 'add')
    })
    html.find('.change-other-gains').change(event => {
      this.modifyOthersGains(event, 'change')
    })
    html.find('.remove-other-gains').click(event => {
      this.modifyOthersGains(event, 'remove')
    })
  }

  /**
   * Modify Item data based on user interactions with the other skill
   * gains table on details tab on this sheet
   * @param {jQuery} event @see activateListeners
   * @param {string} mode 'add' || 'change' || 'remove'
   * @returns {Promise<Document>} update to Item document
   */
  async modifyOthersGains (event, mode) {
    /** No need to check if user is GM because only they can see details tab */
    event.preventDefault()
    const element = $(event.currentTarget)
    /** @see data-index property on template */
    const index = element.parents('tr').data('index')
    /** Always has to be @type {Array} */
    const skills = this.item.data.data.gains.other
      ? duplicate(this.item.data.data.gains.other)
      : []
    switch (mode) {
      /** User clicked on plus icon to add a new skill on other gains table */
      case 'add':
        skills.push({
          /** new skill */
          name: game.i18n.localize('CoC7.NewSkillName'),
          /** development by default, value can also be 1d6 or 1d10 */
          value: 'development'
        })
        break
      /** User changed name (input) or value (select) of a skill on table */
      case 'change':
        skills[index] = {
          name: element.is('input') ? element.val() : skills[index].name,
          value: element.is('select') ? element.val() : skills[index].value
        }
        break
      /** User clicked on minus icon to remove a skill on other gains table */
      case 'remove':
        if (index >= 0) skills.splice(index, 1)
    }
    return await this.item.update({ 'data.gains.other': skills })
  }
}
