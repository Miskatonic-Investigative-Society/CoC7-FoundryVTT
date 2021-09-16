/* global $, duplicate, game, ItemSheet, mergeObject */
import { CoC7Utilities } from '../../utilities.js'

export class CoC7BookSheet extends ItemSheet {
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      template: 'systems/CoC7/templates/items/book/main.html',
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

  async getData () {
    const data = super.getData()
    const itemData = data.data
    data.data = itemData.data
    data.initialReading = this.item.data.data.initialReading
    data.isKeeper = game.user.isGM
    data.isOwned = this.item.isOwned
    data.spellsLearned = this.spellsLearned
    data.exhausted = (await this.item.checkExhaustion()) !== false
    data.studyCompleted =
      this.item.data.data.study.progress === this.item.data.data.study.necessary
    return data
  }

  get spellsLearned () {
    let amount = 0
    const spells = this.item.data.data.spells
    for (const spell of spells) {
      if (spell.data.learned) amount++
    }
    return `${amount} / ${spells.length}`
  }

  activateListeners (html) {
    super.activateListeners(html)
    html.find('#attempt-initial-reading').click(event => {
      event.preventDefault()
      this.item.attemptInitialReading()
    })
    html.find('.delete-spell').click(event => this._onDelete(event))
    html.find('.teach-spell').click(event => {
      const id = $(event.currentTarget)
        .parents('li')
        .data('id')
      this.item.attemptSpellLearning(id)
    })
    html.find('[name="data.study.necessary"]').change(event => {
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
    html.find('#redo-full-study').click(() => {
      this.item.redoFullStudy()
    })
    html.find('.remove-other-gains').click(event => {
      this.modifyOthersGains(event, 'remove')
    })
    html.find('.option').click(event => this.modifyType(event))
  }

  /**
   * It is called every time the user delete a spell on the sheet
   * @param {jQuery} event @see activateListeners
   * @returns {Promise.<Document>} update to Item document
   */
  async _onDelete (event) {
    if (!game.user.isGM) return
    event.preventDefault()
    const element = $(event.currentTarget)
    /** @see data-index property on template */
    const index = element.parents('li').data('index')
    /** Always has to be @type {Array} */
    const spells = this.item.data.data.spells
      ? duplicate(this.item.data.data.spells)
      : []
    if (index >= 0) spells.splice(index, 1)
    return await this.item.update({ 'data.spells': spells })
  }

  /**
   * It is called every time the user drags an item to the sheet
   * Filters only 'spell' items and inserts them in a @type {Array}
   * @param {jQuery} event @see activateListeners
   * @returns {Promise.<Document>} update to Item document
   */
  async _onDrop (event, type = 'spell') {
    event.preventDefault()
    /** Prevents propagation of the same event from being called */
    event.stopPropagation()

    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')

    const spells = []
    for (const item of dataList) {
      if (!item || !(item.data.type === 'spell')) continue
      spells.push(item.data)
    }
    await this.item.addSpells(spells)
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
    const skills = this.item.data.data.gains.others
      ? duplicate(this.item.data.data.gains.others)
      : []
    switch (mode) {
      case 'add':
        /** User clicked on plus icon to add a new skill on other gains table */
        skills.push({
          /** new skill */
          name: game.i18n.localize('CoC7.NewSkillName'),
          /** development by default, value can also be 1d6 or 1d10 */
          value: 'development'
        })
        break
      case 'change':
        /** User changed name (input) or value (select) of a skill on table */
        skills[index] = {
          name: element.is('input') ? element.val() : skills[index].name,
          value: element.is('select') ? element.val() : skills[index].value
        }
        break
      case 'remove':
        /** User clicked on minus icon to remove a skill on other gains table */
        if (index >= 0) skills.splice(index, 1)
    }
    return await this.item.update({ 'data.gains.others': skills })
  }
}
