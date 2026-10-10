import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemBookSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 525,
      height: 450
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/book-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-description.hbs',
      scrollable: ['.editor-content']
    },
    content: {
      template: 'systems/' + FOLDER_ID + '/templates/items/book-tab-content.hbs',
      scrollable: ['']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/book-tab-details.hbs',
      scrollable: ['']
    },
    spells: {
      template: 'systems/' + FOLDER_ID + '/templates/items/book-tab-spells.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-keeper.hbs',
      scrollable: ['.editor-content']
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    const knownBook = context.document.actor?.system?.getBook(context.document)

    const tabs = {
      description: {
        icon: '',
        label: 'CoC7.Description'
      }
    }
    if (game.user.isGM || (knownBook?.initialReading ?? false)) {
      tabs.content = {
        icon: '',
        label: 'CoC7.Content'
      }
    }
    if (game.user.isGM) {
      tabs.details = {
        icon: '',
        label: 'CoC7.Details'
      }
    }
    if ((context.document.system.type.mythos || context.document.system.type.occult) && (game.user.isGM || (knownBook?.initialReading ?? false))) {
      tabs.spells = {
        icon: '',
        label: 'CoC7.Spells'
      }
    }
    if (game.user.isGM) {
      tabs.keeper = {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-tentacles-skull',
        tooltip: 'CoC7.GmNotes'
      }
    }

    context.tabs = this.getTabs('primary', 'description', tabs)

    return context
  }

  /**
   * @inheritdoc
   * @param {string} partId
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _preparePartContext (partId, context, options) {
    context = await super._preparePartContext(partId, context, options)
    const knownBook = context.document.actor?.system?.getBook(context.document)

    switch (partId) {
      case 'header':
        context.isKeeper = game.user.isGM
        context.isEmbedded = context.document.isEmbedded
        context.isOwner = context.document.actor?.isOwner
        context.initialReading = knownBook?.initialReading ?? false
        if (context.initialReading) {
          context.fullStudies = knownBook.fullStudies
          context.progress = knownBook.progress
          context.necessary = knownBook.necessary
          context.units = knownBook.units
          context.studyCompleted = knownBook.progress === knownBook.necessary
          context.mythos = context.document.system.type.mythos
        }
        break
      case 'description':
        context.enrichedDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'content':
        context.enrichedContent = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.content,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'details':
        context.difficultyLevels = [
          {
            value: 'regular',
            label: 'CoC7.RollDifficultyRegular'
          },
          {
            value: 'hard',
            label: 'CoC7.RollDifficultyHard'
          },
          {
            value: 'extreme',
            label: 'CoC7.RollDifficultyExtreme'
          },
          {
            value: 'critical',
            label: 'CoC7.RollDifficultyCritical'
          },
          {
            value: 'unreadable',
            label: 'CoC7.Unreadable'
          }
        ]
        context.studyUnits = [
          {
            value: 'CoC7.months',
            label: 'CoC7.months'
          },
          {
            value: 'CoC7.weeks',
            label: 'CoC7.weeks'
          },
          {
            value: 'CoC7.days',
            label: 'CoC7.days'
          },
          {
            value: 'CoC7.hours',
            label: 'CoC7.hours'
          }
        ]
        context.otherGains = [
          {
            value: 'development',
            label: 'CoC7.Development'
          },
          {
            value: '1d6',
            label: '+1D6'
          },
          {
            value: '1d10',
            label: '+1D10'
          }
        ]
        context._types = []
        for (const [value, field] of context.document.system.schema.getField('type').entries()) {
          context._types.push({
            value,
            label: field.label,
            tooltip: field.hint,
            isEnabled: context.document.system.type[value] === true
          })
        }
        if (knownBook) {
          context.knownNecessary = knownBook.necessary
          context.knownUnits = knownBook.units
        }
        break
      case 'spells':
        context.spells = await context.document.system.items()
        context.spellsLearned = knownBook?.spellsLearned ?? []
        context.spellListEmpty = context.spells.length === 0
        break
      case 'keeper':
        context.enrichedDescriptionKeeper = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.description.keeper,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
    }
    return context
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    this.element.querySelectorAll('.item div.summary').forEach((element) => element.addEventListener('click', this._onItemSummary.bind(this)))

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', async (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'attemptInitialReading':
          this.document.system.attemptInitialReading()
          break
        case 'attemptReference':
          this.document.system.attemptReference()
          break
        case 'item-edit':
          this._onItemEdit(event)
          break
        case 'item-delete':
          this._onItemDelete(event)
          break
        case 'add-other-gains':
          this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
          await this.document.update({
            'system.gains.others': this.document.system.gains.others.concat([{}])
          })
          break
        case 'remove-other-gains':
          this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
          this.otherGainsRemove(event)
          break
        case 'teach-spell':
          {
            event.preventDefault()
            this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
            const li = event.currentTarget.closest('.item')
            if (li.dataset.uuid) {
              const item = await fromUuid(li.dataset.uuid)
              if (item) {
                await this.document.system.attemptSpellItemLearning(li.dataset.uuid, item.name)
              }
            } else if (li.dataset.id) {
              const itemData = this.document.system.itemDocuments.find(doc => doc._id === li.dataset.id)
              const Cls = CONFIG.Item.documentClass
              const item = new Cls(itemData, { parent: this.document })
              if (item) {
                await this.document.system.attemptSpellItemLearning(li.dataset.id, item.name)
              }
            }
          }
          break
        case 'increase-progress':
          {
            const alter = await this.alterProgressBy(event, true)
            await this.document.system.alterProgress(alter)
            this.render()
          }
          break
        case 'decrease-progress':
          {
            const alter = await this.alterProgressBy(event, false)
            await this.document.system.alterProgress(alter)
            this.render()
          }
          break
        case 'redo-full-study':
          await this.document.system.redoFullStudy()
          this.render()
          break
      }
    }))
    this.element.querySelectorAll('.known-value-change').forEach((element) => element.addEventListener('change', async (event) => {
      const key = event.currentTarget.dataset.known
      const value = event.currentTarget.value
      if (key) {
        await this.actor.system.updateBook(this.document, { [key]: value })
        this.render()
      }
    }))
    new foundry.applications.ux.DragDrop({
      dropSelector: '.drop-item',
      permissions: {
        drop: true
      },
      callbacks: {
        drop: this._onItemDrop.bind(this)
      }
    }).bind(this.element)

    new foundry.applications.ux.DragDrop({
      dropSelector: '.drop-skill-item',
      permissions: {
        drop: true
      },
      callbacks: {
        drop: this._onSkillItemDrop.bind(this)
      }
    }).bind(this.element)
  }

  /**
   * Drop
   * @param {ClickEvent} event
   */
  async _onItemDrop (event) {
    this._onItemDropEvent(event, 'system', ['spell'])
  }

  /**
   * Drop
   * @param {ClickEvent} event
   */
  async _onSkillItemDrop (event) {
    const droppedItems = (await CoC7Utilities.getDataFromDropEvent(event, 'Item')).filter(doc => doc.type === 'skill')
    if (droppedItems.length) {
      const newGains = []
      for (const item of droppedItems) {
        newGains.push({
          name: item.name
        })
      }
      await this.document.update({
        'system.gains.others': this.document.system.gains.others.concat(newGains)
      })
    }
  }

  /**
   * Toggle embedded item description
   * @param {ClickEvent} event
   */
  async _onItemSummary (event) {
    this._onItemSummaryEvent(event, 'system')
  }

  /**
   * Edit embedded item
   * @param {ClickEvent} event
   */
  async _onItemEdit (event) {
    this._onItemEditEvent(event, 'system')
  }

  /**
   * Delete embedded item
   * @param {ClickEvent} event
   */
  async _onItemDelete (event) {
    this._onItemDeleteEvent(event, 'system')
  }

  /**
   * Remove other gain
   * @param {ClickEvent} event
   */
  async otherGainsRemove (event) {
    const index = event.currentTarget.dataset.index
    if (typeof index !== 'undefined') {
      const others = foundry.utils.duplicate(this.document.system.gains.others)
      others.splice(parseInt(index, 10), 1)
      await this.document.update({ 'system.gains.others': others })
    }
  }

  /**
   * Get value to alter progress by
   * @param {ClickEvent} event
   * @param {boolean} increase
   * @returns {integer}
   */
  async alterProgressBy (event, increase) {
    let alter = 1
    const knownBook = this.document.actor?.system.getBook(this.document)
    if (knownBook && event.shiftKey) {
      const max = Number(increase ? knownBook.necessary - knownBook.progress : knownBook.progress)
      if (max > 1) {
        alter = await new Promise((resolve, reject) => {
          foundry.applications.api.DialogV2.prompt({
            window: { title: 'CoC7.BookAlterProgress' },
            form: { closeOnSubmit: false },
            content: '<div class="flexrow"><label>' + game.i18n.format('CoC7.BookProgressValue', { max }) + ':</label><input type="number" value="" style="flex: 0 0 3rem" min="1" max="' + max + '" step="1" autofocus required name="alter">',
            ok: {
              label: 'CoC7.Validate',
              icon: 'fa-solid fa-check',
              callback: (event, button, dialog) => {
                if (!button.form.elements.alter.validity.valid) {
                  button.form.reportValidity()
                  return
                }
                return button.form.elements.alter.valueAsNumber
              }
            },
            submit: (result, dialog) => {
              if (!isNaN(result)) {
                dialog.close()
                resolve(result)
              }
            }
          })
        })
      }
    }
    return (increase ? alter : -alter)
  }
}
