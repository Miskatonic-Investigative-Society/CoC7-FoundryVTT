export class CoC7BookSheet extends ItemSheet {
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
    Handlebars.registerHelper('or', function (v1, v2, options) {
      return v1 || v2 ? options.fn(this) : options.inverse(this)
    })
    Handlebars.registerHelper('and', function (v1, v2, options) {
      return v1 && v2 ? options.fn(this) : options.inverse(this)
    })
    Handlebars.registerHelper('ifOrUnless', function (v1, v2, options) {
      return v1 || !v2 ? options.fn(this) : options.inverse(this)
    })
    Handlebars.registerHelper('doubleUnless', function (v1, v2, options) {
      return !v1 && !v2 ? options.fn(this) : options.inverse(this)
    })
    return data
  }
  activateListeners (html) {
    super.activateListeners(html)
    html.find('.spell-delete').click(event => this.item._deleteSpell(event))
    html.find('.spell-edit').click(event => this.item._editSpell(event))
    html.find('.spell-name').click(event => this._showSpellSummary(event))

    html.find("[name='data.study.necessary']").change(event => {
      const value = parseInt(event.currentTarget.value)
      this.item._changeProgress('reset', value)
    })
    html.find('#increase-progress').click(() => {
      this.item._changeProgress('increase')
    })
    html.find('#decrease-progress').click(() => {
      this.item._changeProgress('decrease')
    })

    html.find('#attempt-initial-reading').click(event => {
      event.preventDefault()
      this.item._attemptInitialReading()
    })

    html
      .find('.try-to-learn-spell')
      .click(event => this.item._teachNewSpell(event))
    html
      .find('#redo-full-study')
      .click(event => this.item._redoFullStudy(event))
    html.on('drop', event => this._onDrop(event))
    html.find('.option').click(event => this._setType(event))
  }

  /**
   * Toggle the checkboxes for type when user clicks on the corresponding label
   * Not sure if this works on engines other than V8
   * @param {jQuery} event
   * @returns {jQuery.Event}
   */
  _setType (event) {
    event.preventDefault()
    event.stopPropagation()
    const toggleSwitch = $(event.currentTarget)
    return toggleSwitch.prev().trigger('click')
  }

  _showSpellSummary (event) {
    event.preventDefault()
    let li = $(event.currentTarget).parents('.spell'),
      spell = this.item.data.data.spells.find(spell => {
        return spell._id === li.data('spell-id')
      }),
      chatData = spell.data.description
    if (li.hasClass('expanded')) {
      let summary = li.children('.item-summary')
      summary.slideUp(200, () => summary.remove())
    } else {
      let div = $(`<div class="item-summary">${chatData.value}</div>`)
      let props = $('<div class="item-properties"></div>')
      div.append(props)
      li.append(div.hide())
      div.slideDown(200)
    }
    li.toggleClass('expanded')
  }

  /**
   * It is called every time the user drags an item to the sheet
   * Filters only "spell" items and inserts them in a @type {Array}
   * Push it updating `item.data.data.spells`
   * @param {jQuery} event
   * @returns {Promise.<Document>}
   */
  async _onDrop (event) {
    event.preventDefault()
    /** Prevents propagation of the same event from being called */
    event.stopPropagation()
    if (event.originalEvent) return
    let data
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (data.type !== 'Item') return
    } catch (error) {
      return false
    }
    let item
    if (data.pack) {
      const pack = game.packs.get(data.pack)
      if (pack.metadata.entity !== 'Item') return
      item = await pack.getEntity(data.id)
    } else if (data.data) item = data
    else item = game.items.get(data.id)
    if (!item || !('spell' === item.data.type)) return
    const spells = this.item.data.data.spells
      ? duplicate(this.item.data.data.spells)
      : []
    spells.push(duplicate(item.data))
    return await this.item.update({ 'data.spells': spells })
  }

  // getData () {
  //   const data = super.getData()

  //   data.isGM = game.user.isGM
  //   data.isOwned = this.item.isOwned

  //   this.item.data.data.difficultyLevel == 'Unreadable'
  //     ? (data.unreadable = true)
  //     : false
  //   this.item.data.data.initialReading == undefined
  //     ? (data.unidentified = true)
  //     : false

  //   data.initialReading = this.item.data.data.initialReading
  //   data.fullStudy = this.item.data.data.fullStudy
  //   data.redoingFullStudy = this.item.data.data.redoingFullStudy

  //   data.mythosBook = this.item.data.data.type.mythos
  //   data.occultTome = this.item.data.data.type.occult
  //   data.other = this.item.data.data.type.other
  //   data.otherSkill = this.item.data.data.otherSkillGain.name

  //   data.otherSkillSpecific = this.item.data.data.otherSkillGain.specific
  //   data.otherSkillDevelopment = this.item.data.data.otherSkillGain.development

  //   data.gains = data.mythosBook || data.occultTome || data.other

  //   data.itemProperties = []

  //   for (let [key, value] of Object.entries(data.data.type)) {
  //     if (value)
  //       data.itemProperties.push(COC7.bookType[key] ? COC7.bookType[key] : null)
  //   }
  //   return data
  // }
}
