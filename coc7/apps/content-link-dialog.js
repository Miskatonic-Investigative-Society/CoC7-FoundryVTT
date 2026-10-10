import { FOLDER_ID } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7Link from './link.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ContentLinkDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  /**
   * @inheritdoc
   */
  constructor (...args) {
    const coc7Config = args.pop()
    super(...args)
    this.coc7Config = coc7Config
    this.tabGroups.primary = 'details'
  }

  static DEFAULT_OPTIONS = {
    id: 'link-creation',
    tag: 'form',
    classes: ['coc7-sheet', 'active-effect-config'],
    window: {
      contentClasses: [
        'standard-form'
      ],
      title: 'CoC7.CreateLink'
    },
    form: {
      closeOnSubmit: false,
      handler: CoC7ContentLinkDialog.#onSubmit
    },
    position: {
      width: 570
    },
    actions: {
      addChange: CoC7ContentLinkDialog.#onAddChange,
      deleteChange: CoC7ContentLinkDialog.#onDeleteChange
    }
  }

  static PARTS = {
    form: {
      template: 'systems/' + FOLDER_ID + '/templates/apps/link-creation.hbs',
      scrollable: ['']
    }
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

    switch (partId) {
      case 'form':
        context.generation = game.release.generation
        context.checkType = [
          {
            value: CoC7Link.CHECK_TYPE.CHECK,
            label: game.i18n.localize('CoC7.Check')
          },
          {
            value: CoC7Link.CHECK_TYPE.SANLOSS,
            label: game.i18n.localize('CoC7.SanityCheck')
          },
          {
            value: CoC7Link.CHECK_TYPE.ITEM,
            label: game.i18n.localize('CoC7.ItemWeapon')
          }
        ]
        context.checkTypes = CoC7Link.CHECK_TYPE
        context.linkType = [
          {
            value: CoC7Link.LINK_TYPE.CHARACTERISTIC,
            label: game.i18n.localize('CoC7.Characteristic')
          },
          {
            value: CoC7Link.LINK_TYPE.ATTRIBUTE,
            label: game.i18n.localize('CoC7.Attribute')
          },
          {
            value: CoC7Link.LINK_TYPE.SKILL,
            label: game.i18n.localize('CoC7.Skill')
          }
        ]
        context.linkTypes = CoC7Link.LINK_TYPE
        context.attributeType = []
        for (const [value, field] of CONFIG.Actor.dataModels.character.schema.getField('attribs').entries()) {
          if (['lck', 'san'].includes(value)) {
            context.attributeType.push({
              value,
              label: game.i18n.localize(field.hint)
            })
          }
        }
        context.characteristicType = []
        for (const [value, field] of CONFIG.Actor.dataModels.character.schema.getField('characteristics').entries()) {
          context.characteristicType.push({
            value,
            label: game.i18n.localize(field.hint)
          })
        }
        /* // FoundryVTT V13 */
        if (game.release.generation === 13) {
          context.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((modes, [key, value]) => {
            modes[value] = game.i18n.localize('EFFECT.MODE_' + key)
            return modes
          }, {})
        }
        /* // FoundryVTT V13 */
        if (game.release.generation === 13 || typeof this.coc7Config.linkData.object?.name !== 'undefined') {
          context.checkType.push({
            value: CoC7Link.CHECK_TYPE.EFFECT,
            label: game.i18n.localize('DOCUMENT.ActiveEffects')
          })
        }
        if (game.release.generation > 13 || typeof this.coc7Config.linkData.object?.name !== 'undefined') {
          // Migrating old Active Effect links to Compendium
          context.packs = game.packs.contents.filter(doc => doc.metadata.type === 'ActiveEffect' && doc.locked === false).map(doc => { return { value: doc.metadata.id, label: doc.metadata.label + ' (' + doc.metadata.packageType + ')' } })
        }
        context.link = this.coc7Config.linkData
        context.rollDifficulties = [
          {
            value: CoC7DicePool.difficultyLevel.unknown,
            label: 'CoC7.RollDifficultyUnknownName'
          },
          {
            value: CoC7DicePool.difficultyLevel.regular,
            label: 'CoC7.RollDifficultyRegular'
          },
          {
            value: CoC7DicePool.difficultyLevel.hard,
            label: 'CoC7.RollDifficultyHard'
          },
          {
            value: CoC7DicePool.difficultyLevel.extreme,
            label: 'CoC7.RollDifficultyExtreme'
          },
          {
            value: CoC7DicePool.difficultyLevel.critical,
            label: 'CoC7.RollDifficultyCritical'
          }
        ]
        context.other = this.coc7Config.other
        context.tabs = [
          {
            id: 'details',
            group: 'primary',
            cssClass: (this.tabGroups.primary === 'details' ? 'active' : ''),
            icon: 'fa-solid fa-book',
            label: 'EFFECT.TABS.details'
          },
          {
            id: 'duration',
            group: 'primary',
            cssClass: (this.tabGroups.primary === 'duration' ? 'active' : ''),
            icon: 'fa-solid fa-clock',
            label: 'EFFECT.TABS.duration'
          },
          {
            id: 'effects',
            group: 'primary',
            cssClass: (this.tabGroups.primary === 'effects' ? 'active' : ''),
            icon: 'fa-solid fa-cogs',
            label: 'EFFECT.TABS.changes'
          }
        ]
        context.rootId = 'new-effect'
        context.statuses = CONFIG.statusEffects.map(s => ({ value: s.id, label: game.i18n.localize(s.name) }))
        context.actorNames = this.coc7Config.actors.map(a => a.name).join(', ')
        context.priorities = foundry.applications.sheets.ActiveEffectConfig.DEFAULT_PRIORITIES
        context.fields = CONFIG.ActiveEffect.documentClass.schema.fields
        context.modifiers = [
          {
            value: 'difficulty',
            isEnabled: this.coc7Config.other.difficulty,
            label: 'CoC7.RollDifficulty'
          },
          {
            value: 'poolModifier',
            isEnabled: this.coc7Config.other.poolModifier,
            label: 'CoC7.BonusDice'
          },
          {
            value: 'blind',
            isEnabled: this.coc7Config.linkData.blind,
            label: 'CoC7.Blind'
          },
          {
            value: 'pushing',
            isEnabled: this.coc7Config.linkData.pushing,
            label: 'CoC7.Pushing'
          },
          {
            value: 'label',
            isEnabled: this.coc7Config.other.label,
            label: 'CoC7.Label'
          },
          {
            value: 'icon',
            isEnabled: this.coc7Config.other.icon,
            label: 'CoC7.Icon'
          }
        ]
        if (this.coc7Config.linkData.check !== CoC7Link.CHECK_TYPE.CHECK) {
          const index = context.modifiers.findIndex(m => m.value === 'pushing')
          if (index > -1) {
            context.modifiers.splice(index, 1)
          }
        }
        context.tabsPrimary = this.tabGroups.primary
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

    this.element.querySelectorAll('select').forEach((element) => element.addEventListener('change', async (event) => {
      event.currentTarget.closest('form').dispatchEvent(new SubmitEvent('submit'))
    }))
    this.element.querySelectorAll('input[type=radio]').forEach((element) => element.addEventListener('change', async (event) => {
      event.currentTarget.closest('form').dispatchEvent(new SubmitEvent('submit'))
    }))
    this.element.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', (event) => {
      const propertyId = event.target.dataset.property
      switch (propertyId) {
        case 'icon':
        case 'label':
        case 'difficulty':
        case 'poolModifier':
          this.coc7Config.other[propertyId] = !this.coc7Config.other[propertyId]
          break
        case 'blind':
        case 'pushing':
          this.coc7Config.linkData[propertyId] = !this.coc7Config.linkData[propertyId]
      }
      if (propertyId === 'difficulty' && this.coc7Config.other[propertyId] && typeof this.coc7Config.linkData.difficulty === 'undefined') {
        this.coc7Config.linkData.difficulty = CoC7DicePool.difficultyLevel[game.settings.get(FOLDER_ID, 'defaultCheckDifficulty')]
      }
      event.currentTarget.closest('form').dispatchEvent(new SubmitEvent('submit'))
      this.render({ force: true })
    }))

    new foundry.applications.ux.DragDrop({
      permissions: {
        drop: true
      },
      callbacks: {
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element)
  }

  /**
   * Add Active Effect Change
   */
  static async #onAddChange () {
    this.form.dispatchEvent(new SubmitEvent('submit'))
    const submitData = new foundry.applications.ux.FormDataExtended(this.form)
    const formData = foundry.utils.expandObject(submitData.object)
    const changes = Object.values(formData.changes ?? {})
    changes.push({ mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: foundry.applications.sheets.ActiveEffectConfig.DEFAULT_PRIORITIES[CONST.ACTIVE_EFFECT_MODES.ADD] })
    this.coc7Config.linkData.object.changes = changes
    this.render({ force: true })
  }

  /**
   * Add Active Effect Change
   * @param {ClickEvent} event
   */
  static async #onDeleteChange (event) {
    this.form.dispatchEvent(new SubmitEvent('submit'))
    const submitData = new foundry.applications.ux.FormDataExtended(this.form)
    const formData = foundry.utils.expandObject(submitData.object)
    const changes = Object.values(formData.changes)
    const row = event.target.closest('li')
    const index = Number(row.dataset.index) || 0
    changes.splice(index, 1)
    this.coc7Config.linkData.object.changes = changes
    this.render({ force: true })
  }

  /**
   * Submit the configuration form.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   * @returns {Promise<void>}
   */
  static async #onSubmit (event, form, formData) {
    for (const [key, value] of Object.entries(formData.object)) {
      if (['check', 'icon', 'label', 'poolModifier', 'difficulty', 'sanMax', 'sanMin', 'sanReason', 'subtype'].includes(key)) {
        this.coc7Config.linkData[key] = value
      } else if (['attributeName', 'characteristicName', 'itemName', 'skillName'].includes(key)) {
        this.coc7Config.other[key] = value
        this.coc7Config.linkData.name = value
      } else if (['compendium', 'packId', 'packName'].includes(key)) {
        this.coc7Config.other[key] = value
      } else if (['description', 'disabled', 'statuses', 'tint'].includes(key)) {
        this.coc7Config.linkData.object[key] = value
      } else if (['duration.rounds', 'duration.seconds', 'duration.startRound', 'duration.startTime', 'duration.startTurn', 'duration.turns'].includes(key)) {
        foundry.utils.setProperty(this.coc7Config.linkData.object, key, value)
      } else if (key.startsWith('object.')) {
        foundry.utils.setProperty(this.coc7Config.linkData, key, value)
      } else if (key.startsWith('changes.')) {
        foundry.utils.setProperty(this.coc7Config.linkData.object, key, value)
      }
    }
    if (event.type === 'submit' && ['chat', 'clipboard', 'whisper-owner', 'whisper-selected'].includes(event.submitter?.dataset?.action)) {
      const link = await this.createLink()
      switch (event.submitter?.dataset?.action) {
        case 'clipboard':
          await game.clipboard.copyPlainText(link._createDocumentLink(null))
          ui.notifications.info('CoC7.WhatCopiedClipboard', { format: { what: game.i18n.localize('CoC7.CreateLink') }, console: false })
          break
        case 'chat':
          link.toChatMessage()
          break
        case 'whisper-owner':
          link.toWhisperMessage(this.coc7Config.actors)
          break
        case 'whisper-selected':
          if (!canvas.ready || !canvas.tokens.controlled.length) {
            ui.notifications.warn('CoC7.ErrorNoTokensSelected', { localize: true })
            return
          }
          link.toWhisperMessage(canvas.tokens.controlled.filter(t => t.actor.owners.length).map(t => t.actor))
          break
      }
    }
    if (event.type === 'submit' && event.submitter?.dataset?.action === 'active-effect') {
      let pack
      if (this.coc7Config.other.compendium === 'create' && this.coc7Config.other.packName.length) {
        pack = await foundry.documents.collections.CompendiumCollection.createCompendium({ label: this.coc7Config.other.packName, type: 'ActiveEffect' })
        pack.render({ force: true })
      } else if (this.coc7Config.other.compendium === 'existing') {
        pack = game.packs.get(this.coc7Config.other.packId)
      }
      if (pack) {
        const activeEffect = await ActiveEffect.create(this.coc7Config.linkData.object, { pack: pack.metadata.id })
        if (activeEffect) {
          this.close()
          activeEffect.sheet.render({ force: true })
          return
        }
      }
    }
    this.render({ force: true })
  }

  /**
   * Handle Drop
   * @param {Event} event
   */
  async _onDrop (event) {
    const dataString = event.dataTransfer.getData('text/plain')
    const data = JSON.parse(dataString)
    if (data.type === 'CoC7Link') {
      const actors = this.coc7Config.actors
      this.coc7Config = CoC7ContentLinkDialog.createConfig(data)
      this.coc7Config.actors = actors
      this.render({ force: true })
    } else if (data.type === 'Folder' || ['Item', 'Actor'].includes(data.type)) {
      const documentType = (data.type === 'Folder' ? 'Actor' : data.type)
      const droppedDocuments = (await CoC7Utilities.getDataFromDropEvent(event, documentType))
      if (documentType === 'Actor') {
        this.coc7Config.actors = droppedDocuments
        this.render({ force: true })
      } else if (documentType === 'Item' && droppedDocuments.length === 1 && ['skill', 'weapon'].includes(droppedDocuments[0].type)) {
        const id = droppedDocuments[0].flags[FOLDER_ID]?.cocidFlag?.id
        const key = (droppedDocuments[0].type === 'skill' ? 'skillName' : 'itemName')
        switch (key) {
          case 'itemName':
            this.coc7Config.linkData.check = CoC7Link.CHECK_TYPE.ITEM
            break
          case 'skillName':
            this.coc7Config.linkData.check = CoC7Link.CHECK_TYPE.CHECK
            this.coc7Config.linkData.subtype = CoC7Link.LINK_TYPE.SKILL
            break
        }
        if (id) {
          this.coc7Config.other[key] = id
          this.coc7Config.linkData.name = id
          this.coc7Config.other.label = true
          this.coc7Config.linkData.label = droppedDocuments[0].name
        } else {
          this.coc7Config.other[key] = droppedDocuments[0].name
          this.coc7Config.linkData.name = droppedDocuments[0].name
        }
        this.render({ force: true })
      }
    }
  }

  /**
   * Create CoC7Link from config
   * @returns {Promise<CoC7Link>}
   */
  async createLink () {
    const data = {
      check: this.coc7Config.linkData.check
    }
    let toggles = false
    switch (data.check) {
      case CoC7Link.CHECK_TYPE.CHECK:
        data.subtype = this.coc7Config.linkData.subtype
        data.name = this.coc7Config.linkData.name
        toggles = true
        break
      case CoC7Link.CHECK_TYPE.SANLOSS:
        data.sanMin = this.coc7Config.linkData.sanMin
        data.sanMax = this.coc7Config.linkData.sanMax
        data.sanReason = this.coc7Config.linkData.sanReason
        toggles = true
        break
      case CoC7Link.CHECK_TYPE.ITEM:
        data.name = this.coc7Config.linkData.name
        toggles = true
        break
      case CoC7Link.CHECK_TYPE.EFFECT:
        data.object = this.coc7Config.linkData.object
        if (this.coc7Config.linkData.label.length) {
          data.label = this.coc7Config.linkData.label
        }
        break
    }
    if (toggles) {
      if (this.coc7Config.other.difficulty) {
        data.difficulty = this.coc7Config.linkData.difficulty
      }
      if (this.coc7Config.other.poolModifier) {
        data.poolModifier = this.coc7Config.linkData.poolModifier
      }
      if (this.coc7Config.linkData.blind) {
        data.blind = this.coc7Config.linkData.blind
      }
      if (this.coc7Config.linkData.check === CoC7Link.CHECK_TYPE.CHECK) {
        if (this.coc7Config.linkData.pushing) {
          data.pushing = this.coc7Config.linkData.pushing
        }
      }
      if (this.coc7Config.linkData.icon) {
        data.icon = this.coc7Config.linkData.icon
      }
      if (this.coc7Config.other.label) {
        data.label = this.coc7Config.linkData.label
      }
    }
    return CoC7Link.fromDropData(data)
  }

  /**
   * Data to config
   * @param {object} linkData
   * @returns {object}
   */
  static createConfig (linkData = {}) {
    const coc7Config = {
      linkData: {
        check: CoC7Link.CHECK_TYPE.CHECK,
        subtype: CoC7Link.LINK_TYPE.CHARACTERISTIC,
        name: 'str',
        sanMin: '',
        sanMax: '',
        sanReason: '',
        label: '',
        object: {
          description: ''
        }
      },
      other: {
        attributeName: 'lck',
        characteristicName: 'str',
        skillName: '',
        difficulty: false,
        poolModifier: false,
        label: false,
        icon: false,
        compendium: 'create',
        packId: '',
        packName: ''
      }
    }
    switch (linkData.check ?? '') {
      case CoC7Link.CHECK_TYPE.CHECK:
        coc7Config.linkData.check = linkData.check
        switch (linkData.subtype ?? '') {
          case CoC7Link.LINK_TYPE.ATTRIBUTE:
            coc7Config.linkData.subtype = linkData.subtype
            coc7Config.linkData.name = linkData.name
            coc7Config.other.attributeName = linkData.name
            break
          case CoC7Link.LINK_TYPE.CHARACTERISTIC:
            coc7Config.linkData.subtype = linkData.subtype
            coc7Config.linkData.name = linkData.name
            coc7Config.other.characteristicName = linkData.name
            break
          case CoC7Link.LINK_TYPE.SKILL:
            coc7Config.linkData.subtype = linkData.subtype
            coc7Config.linkData.name = linkData.name
            coc7Config.other.skillName = linkData.name
            break
        }
        break
      case CoC7Link.CHECK_TYPE.SANLOSS:
        coc7Config.linkData.check = linkData.check
        coc7Config.linkData.sanMin = linkData.sanMin
        coc7Config.linkData.sanMax = linkData.sanMax
        coc7Config.linkData.sanReason = linkData.sanReason
        break
      case CoC7Link.CHECK_TYPE.ITEM:
        coc7Config.linkData.check = linkData.check
        coc7Config.other.itemName = linkData.name
        break
      case CoC7Link.CHECK_TYPE.EFFECT:
        coc7Config.linkData.check = linkData.check
        if (typeof linkData.object === 'string') {
          coc7Config.linkData.object = JSON.parse(linkData.object)
        } else {
          coc7Config.linkData.object = foundry.utils.duplicate(linkData.object)
        }
        if (typeof linkData.label !== 'undefined') {
          coc7Config.linkData.label = linkData.label
        }
        break
    }
    switch (linkData.check ?? '') {
      case CoC7Link.CHECK_TYPE.EFFECT:
        break
      default:
        if (typeof linkData.blind !== 'undefined') {
          coc7Config.linkData.blind = linkData.blind
        }
        if (typeof linkData.pushing !== 'undefined') {
          coc7Config.linkData.pushing = linkData.pushing
        }
        if (typeof linkData.difficulty !== 'undefined') {
          coc7Config.linkData.difficulty = linkData.difficulty
          coc7Config.other.difficulty = true
        }
        if (typeof linkData.label !== 'undefined') {
          coc7Config.linkData.label = linkData.label
          coc7Config.other.label = true
        }
        if (typeof linkData.icon !== 'undefined') {
          coc7Config.linkData.icon = linkData.icon
          coc7Config.other.icon = true
        }
        if (typeof linkData.poolModifier !== 'undefined') {
          coc7Config.linkData.poolModifier = linkData.poolModifier
          coc7Config.other.poolModifier = true
        }
    }
    return coc7Config
  }

  /**
   * New link dialog
   * @param {object} linkData
   */
  static async create (linkData = {}) {
    const coc7Config = CoC7ContentLinkDialog.createConfig(linkData)
    coc7Config.actors = []
    new CoC7ContentLinkDialog({}, {}, coc7Config).render({ force: true })
  }
}
