/* global foundry fromUuid game renderTemplate TextEditor */
import { FOLDER_ID, MONETARY_FORMATS, MONETARY_TYPES } from '../../constants.js'
import CoC7CreateMythosEncounter from '../../apps/create-mythos-encounter.js'
import CoC7ModelsActorGlobalSheet from './global-sheet.js'
import CoC7SystemSocket from '../../apps/system-socket.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsActorCharacterSheetV2 extends CoC7ModelsActorGlobalSheet {
  static DEFAULT_OPTIONS = {
    classes: ['coc7', 'sheetV2', 'actor', 'character'],
    position: {
      width: 687,
      height: 623
    },
    window: {
      resizable: true
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    body: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/investigator-v2/body.hbs',
      scrollable: [
        'section.tab.development',
        'section.tab.skills',
        'section.tab.combat',
        'section.tab.possession',
        'section.tab.background',
        'section.tab.activeEffects',
        'section.tab.keeper'
      ]
    }
  }

  /**
   * Initialize configuration options for the Application instance.
   * @param {Partial<ApplicationConfiguration>} options
   * @returns {ApplicationConfiguration}
   */
  _initializeApplicationOptions (options) {
    options = super._initializeApplicationOptions(options)
    if (options.document.isLimitedView) {
      options.position.width = 500
      options.position.height = 200
    }
    return options
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    context.skillListMode = context.document.system.flags.skillListMode
    context.skillShowUncommon = context.document.system.flags.skillShowUncommon

    const occupation = context.document.occupation
    if (occupation) {
      context.document.system.infos.occupation = occupation.name
      context.occupationSet = true
    } else {
      context.occupationSet = false
    }

    const archetype = context.document.archetype
    if (archetype) {
      context.document.system.infos.archetype = archetype.name
      context.archetypeSet = true
    } else {
      context.archetypeSet = false
    }

    context.totalExperience = context.document.experiencePoints
    context.totalOccupation = context.document.occupationPointsSpent
    context.invalidOccupationPoints = context.totalOccupation !== context.document.system.development.occupation
    context.totalArchetype = context.document.archetypePointsSpent
    context.invalidArchetypePoints = context.totalArchetype !== context.document.system.development.archetype
    context.totalExperiencePackage = context.document.experiencePackagePointsSpent
    context.invalidExperiencePackagePoints = context.totalExperiencePackage !== context.document.system.development.experiencePackage
    context.totalPersonal = context.document.personalPointsSpent
    context.invalidPersonalPoints = context.totalPersonal !== context.document.system.development.personal
    context.creditRatingMax = occupation?.system.creditRating.max
    context.creditRatingMin = occupation?.system.creditRating.min
    const creditRatingSkill = context.document.creditRatingSkill
    context.invalidCreditRating = creditRatingSkill?.system.adjustments?.occupation > context.creditRatingMax || creditRatingSkill?.system.adjustments?.occupation < context.creditRatingMin
    context.pulpTalentCount = context.itemsByType.talent?.length ?? 0
    context.minPulpTalents = archetype?.system.talents ?? 0
    context.invalidPulpTalents = context.pulpTalentCount < context.minPulpTalents

    context.hasDevelopmentPhase = context.document.hasDevelopmentPhase

    context.allowDevelopment = game.settings.get(FOLDER_ID, 'developmentEnabled')
    context.allowCharCreation = game.settings.get(FOLDER_ID, 'charCreationEnabled')
    context.developmentRollForLuck = game.settings.get(FOLDER_ID, 'developmentRollForLuck')
    context.showDevPanel = context.allowDevelopment || context.allowCharCreation

    context._monetaryFormats = []
    for (const key in MONETARY_FORMATS) {
      context._monetaryFormats.push({ key, val: game.i18n.localize(MONETARY_FORMATS[key]) })
    }

    context.showCurrencySymbol = ['decimalLeft', 'decimalRight', 'integerLeft', 'integerRight'].includes(context.document.system.monetary.format)

    context._monetaryTypes = []
    for (const key in MONETARY_TYPES) {
      if (MONETARY_TYPES[key].filter.length === 0 || MONETARY_TYPES[key].filter.includes(context.document.system.monetary.format)) {
        context._monetaryTypes.push({ key, val: game.i18n.localize(MONETARY_TYPES[key].name) })
      }
    }

    context.manualCredit = context.document.system.flags.manualCredit
    if (!context.manualCredit) {
      context.monetary = {
        spendingLevel: context.document.system.formattedMonetaryValue('spending'),
        assets: context.document.system.formattedMonetaryValue('assets'),
        cash: context.document.system.formattedMonetaryValue('cash')
      }
    }

    context.oneBlockBackStory = game.settings.get(FOLDER_ID, 'oneBlockBackstory')

    const skills = (context.itemsByType.skill ?? []).filter(document => (context.skillShowUncommon || !document.system.properties.rarity))
    context.skillList = []
    let previousSpec = ''
    for (const skill of skills) {
      if (skill.system.properties.special) {
        const check = skill.system.specialization + (skill.system.properties.own ? 'Y' : 'N')
        if (previousSpec !== check) {
          previousSpec = check
          context.skillList.push({
            isSpecialization: true,
            name: skill.system.specialization + (skill.system.properties.own ? ' - ' + game.i18n.localize('CoC7.SkillOwn') : '')
          })
        }
      }
      context.skillList.push(skill)
    }
    context.skillsByValue = [...skills].sort(CoC7Utilities.sortByValueThenNameKey)
    context.displayPlayerName = game.settings.get(FOLDER_ID, 'displayPlayerNameOnSheet')
    if (context.displayPlayerName && context.document.system.infos.playername.length === 0) {
      const user = context.document.userOwner
      if (user) {
        context.document.system.infos.playername = user.name
      }
    }

    context.skillListEmpty = skills.length === 0

    context.hasInventory = this.hasInventory(context)

    /* // FoundryVTT V12 */
    context.enrichedBackstory = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
      context.document.system.backstory,
      {
        async: true,
        secrets: context.editable
      }
    )

    /* // FoundryVTT V12 */
    context.enrichedDescriptionKeeper = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
      context.document.system.description.keeper,
      {
        async: true,
        secrets: context.editable
      }
    )

    context.showPartValues = !game.settings.get(FOLDER_ID, 'hidePartValues')

    if (this.constructor.name === 'CoC7ModelsActorCharacterSheetV2') {
      let tabs = {}
      if (context.showDevPanel) {
        tabs = {
          ...tabs,
          ...{
            development: {
              icon: '',
              label: 'CoC7.CharacterDevelopment'
            }
          }
        }
      }
      tabs = {
        ...tabs,
        ...{
          skills: {
            icon: '',
            label: 'CoC7.Skills'
          },
          combat: {
            icon: '',
            label: 'CoC7.Combat'
          },
          possession: {
            icon: '',
            label: 'CoC7.Possessions'
          },
          background: {
            icon: '',
            label: 'CoC7.Background'
          }
        }
      }
      if (game.user.isGM) {
        tabs.activeEffects = {
          cssClass: 'icon-only-tab',
          icon: 'game-icon game-icon-aura',
          label: '',
          tooltip: 'CoC7.Effects'
        }
        tabs.keeper = {
          cssClass: 'icon-only-tab',
          icon: 'game-icon game-icon-tentacles-skull',
          tooltip: 'CoC7.GmNotes'
        }
      }
      tabs.locked = {
        cssClass: 'icon-only-tab ' + (this.allowUnlock ? 'unlock-control' : 'unlock-control-disabled'),
        icon: (context.document.system.flags.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'),
        tooltip: (context.document.system.flags.locked ? 'CoC7.UnlockActor' : 'CoC7.LockActor')
      }

      context.tabs = this.getTabs('primary', (context.showDevPanel ? 'development' : 'skills'), tabs)
    }

    context.biographySections = []
    if (context.document.system.biography instanceof Array && context.document.system.biography.length) {
      for (const biography of context.document.system.biography) {
        context.biographySections.push({
          title: biography.title,
          value: biography.value,
          /* // FoundryVTT V12 */
          enriched: await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
            biography.value,
            {
              async: true,
              secrets: context.editable
            }
          )
        })
      }
      if (context.biographySections.length) {
        context.biographySections[0].isFirst = true
        context.biographySections[context.biographySections.length - 1].isLast = true
      }
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

    this.element.querySelectorAll('.open-item').forEach((element) => element.addEventListener('click', this._onItemDetails.bind(this)))

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return
    this.element.querySelector('.reset-occupation')?.addEventListener('click', this.document.resetOccupation.bind(this.document))
    this.element.querySelector('.reset-experience-package')?.addEventListener('click', this.document.resetExperiencePackage.bind(this.document))
    this.element.querySelector('.reset-archetype')?.addEventListener('click', this.document.resetArchetype.bind(this.document))
    if (game.user.isGM) {
      this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
        switch (event.currentTarget.dataset.action) {
          case 'sanity-loss-type-add':
            this._onSanityLossReasonAdd(event)
            break
          case 'sanity-loss-type-delete':
            this._onSanityLossReasonDelete(event)
            break
          case 'monetary-add':
            this._onMonetaryAdd(event)
            break
          case 'monetary-remove':
            this._onMonetaryRemove(event)
            break
          case 'bookClear':
            this._onBookRemove(event)
        }
      }))
    }
  }

  /**
   * Add Monetary Row
   * @param {ClickEvent} event
   */
  async _onMonetaryAdd (event) {
    event.preventDefault()
    this.scrollToNewLast('div.tiny-monetary')
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    await this.document.update({
      'system.monetary.values': this.document.system.monetary.values.concat([{}])
    })
  }

  /**
   * Remove Monetary Row
   * @param {ClickEvent} event
   */
  async _onMonetaryRemove (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const item = event.currentTarget.closest('.form-group')
    if (item && typeof item.dataset.index !== 'undefined') {
      const index = Number(item.dataset.index)
      const values = foundry.utils.duplicate(this.document.system.monetary.values)
      values.splice(index, 1)
      this._onMonetaryReorder(values)
      await this.document.update({ 'system.monetary.values': values })
    }
  }

  /**
   * Reorder Monetary values by Min and Max
   * @param {Array} values
   */
  _onMonetaryReorder (values) {
    const maxOffset = values.length - 1
    if (maxOffset > 0) {
      values.sort((l, r) => {
        const lMinimum = parseInt(l.min ?? 0, 10)
        const rMinimum = parseInt(r.min ?? 0, 10)
        return lMinimum - rMinimum
      })
      for (let offset = 1; offset <= maxOffset; offset++) {
        values[offset - 1].max = values[offset].min - 1
      }
      values[0].min = null
      values[maxOffset].max = null
    }
  }

  /**
   * Add Sanity Loss Reason Row
   * @param {ClickEvent} event
   */
  async _onSanityLossReasonAdd (event) {
    event.preventDefault()
    CoC7CreateMythosEncounter.create({
      actor: this.actor,
      type: event.currentTarget.dataset.type
    })
  }

  /**
   * Remove Sanity Loss Reason Row
   * @param {ClickEvent} event
   */
  async _onSanityLossReasonDelete (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const group = event.currentTarget.closest('.event[data-index]')
    if (group && typeof group.dataset.index !== 'undefined') {
      const sanityLossEvents = foundry.utils.duplicate(this.document.system.sanityLossEvents)
      sanityLossEvents.splice(Number(group.dataset.index), 1)
      await this.document.update({ 'system.sanityLossEvents': sanityLossEvents })
    }
  }

  /**
   * Show embedded item sheet
   * @param {ClickEvent|null} event
   */
  _onItemDetails (event) {
    event.preventDefault()
    const type = event.currentTarget.dataset.type
    if (['archetype', 'experiencePackage', 'occupation'].includes(type)) {
      const item = this.document[type]
      if (item) {
        item.sheet.render({ force: true })
      }
    }
  }

  /**
   * @inheritdoc
   * @param {SubmitEvent|null} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {object}
   */
  _processFormData (event, form, formData) {
    const object = super._processFormData(event, form, formData)
    if (typeof object.system?.monetary?.values !== 'undefined') {
      object.system.monetary.values = Object.values(object.system.monetary.values)
      if (event.target.classList.contains('cash-assets-range')) {
        this._onMonetaryReorder(object.system.monetary.values)
      }
    }

    return object
  }

  /**
   * Render HTMLElements for the Application.
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<any>}
   */
  async _renderHTML (context, options) {
    // Limited character sheets view
    let parts = {}
    if (context.document.isLimitedView) {
      for (const part of options.parts) {
        switch (part) {
          case 'body':
            {
              // body = character-sheet-v3
              const tempHTML = document.createElement('div')
              tempHTML.classList.add(part, 'flexcol', 'limited-view')
              tempHTML.dataset.applicationPart = part
              /* // FoundryVTT V12 */
              tempHTML.innerHTML = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/actors/limited.hbs', context)
              parts[part] = tempHTML
            }
            break
          default:
            parts[part] = document.createElement('div')
        }
      }
    } else {
      parts = await super._renderHTML(context, options)
    }

    return parts
  }

  /**
   * Remove Book Row
   * @param {ClickEvent} event
   */
  async _onBookRemove (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const item = event.currentTarget.closest('.event')
    if (item && typeof item.dataset.index !== 'undefined') {
      const index = Number(item.dataset.index)
      const books = foundry.utils.duplicate(this.document.system.books)
      if (books[index]?.id) {
        const uuid = this.document.items.get(books[index]?.id)?.uuid
        books.splice(index, 1)
        await this.document.update({ 'system.books': books })
        if (uuid) {
          CoC7SystemSocket.triggerSocket({
            type: 'refreshOpenDocumentSheet',
            uuid
          })
        }
      }
    }
  }

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   */
  async _onDragStart (event) {
    const target = event.currentTarget
    if (target.dataset.itemUuid) {
      const item = await fromUuid(target.dataset.itemUuid)
      event.dataTransfer.setData('text/plain', JSON.stringify(item.toDragData()))
      return
    }
    super._onDragStart(event)
  }
}
