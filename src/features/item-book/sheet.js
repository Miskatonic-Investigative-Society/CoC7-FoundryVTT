/* global $, foundry, game, TextEditor */
import { addCoCIDSheetHeaderButton } from '../coc-id-system/coc-id-button.js'
import { CoC7Utilities } from '../../shared/utilities.js'

export class CoC7BookSheet extends foundry.appv1.sheets.ItemSheet {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  async getData () {
    const sheetData = super.getData()
    sheetData.initialReading = this.item.system.initialReading
    sheetData.isKeeper = game.user.isGM
    sheetData.isOwner = this.item.isOwner
    sheetData.spellsLearned = this.spellsLearned
    sheetData.exhausted = (await this.item.checkExhaustion()) !== false
    sheetData.studyCompleted = this.item.system.study.progress === this.item.system.study.necessary
    sheetData.hasOwner = this.item.isEmbedded === true
    sheetData.spellListEmpty = this.item.system.spells.length === 0

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description.value,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedDescriptionKeeper = await TextEditor.enrichHTML(
      sheetData.data.system.description.keeper,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedContent = await TextEditor.enrichHTML(
      sheetData.data.system.content,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.difficultyLevels = [
      {
        key: 'regular',
        label: 'CoC7.RollDifficultyRegular'
      },
      {
        key: 'hard',
        label: 'CoC7.RollDifficultyHard'
      },
      {
        key: 'extreme',
        label: 'CoC7.RollDifficultyExtreme'
      },
      {
        key: 'critical',
        label: 'CoC7.RollDifficultyCritical'
      },
      {
        key: 'unreadable',
        label: 'CoC7.Unreadable'
      }
    ]

    sheetData.studyUnits = [
      {
        key: 'CoC7.months',
        label: 'CoC7.months'
      },
      {
        key: 'CoC7.weeks',
        label: 'CoC7.weeks'
      },
      {
        key: 'CoC7.days',
        label: 'CoC7.days'
      },
      {
        key: 'CoC7.hours',
        label: 'CoC7.hours'
      }
    ]

    sheetData.otherGains = [
      {
        key: 'development',
        label: 'CoC7.Development'
      },
      {
        key: '1d6',
        label: '+1D6'
      },
      {
        key: '1d10',
        label: '+1D10'
      }
    ]

    return sheetData
  }

  get spellsLearned () {
    let amount = 0
    const spells = this.item.system.spells
    for (const spell of spells) {
      if (spell.system.learned) amount++
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
    html.find('.edit-spell').click(event => this._onSpellDetail(event))
    html.find('.spell-name').click(event => this._onSpellDetail(event))
    html.find('.teach-spell').click(event => {
      const id = $(event.currentTarget).parents('li').data('id')
      this.item.attemptSpellLearning(id)
    })
    html.find('[name="system.study.necessary"]').change(event => {
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

  async _onSpellDetail (event) {
    event.preventDefault()
    const element = $(event.currentTarget)
    /** @see data-index property on template */
    const index = element.parents('li').data('index')
    return await this.item.spellDetail(index)
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
    const spells = this.item.system.spells
      ? foundry.utils.duplicate(this.item.system.spells)
      : []
    if (index >= 0) spells.splice(index, 1)
    return await this.item.update({ 'system.spells': spells })
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
      if (!item || !['skill', 'spell'].includes(item.type)) continue
      if (item.type === 'spell') {
        spells.push(item)
      } else if (item.type === 'skill' && this.item.system.type.other) {
        this.modifyOthersGains(null, 'add', { name: item.name })
      }
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
  async modifyOthersGains (event, mode, options = {}) {
    /** No need to check if user is GM because only they can see details tab */
    let index = null
    let element = null
    if (event) {
      event.preventDefault()
      element = $(event.currentTarget)
      /** @see data-index property on template */
      index = element.parents('tr').data('index')
      /** Always has to be @type {Array} */
    }
    const skills = this.item.system.gains.others
      ? foundry.utils.duplicate(this.item.system.gains.others)
      : []
    switch (mode) {
      case 'add':
        /** User clicked on plus icon to add a new skill on other gains table */
        skills.push({
          /** new skill */
          name: options.name || game.i18n.localize('CoC7.NewSkillName'),
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
    return await this.item.update({ 'system.gains.others': skills })
  }
}
