/* global ChatMessage CONFIG foundry fromUuid game Roll TokenDocument ui */
import { FOLDER_ID } from '../../constants.js'
import CoC7ActiveEffect from '../../apps/active-effect.js'
import CoC7ChatDamage from '../../apps/chat-damage.js'
import CoC7ConCheck from '../../apps/con-check.js'
import CoC7ContentLinkDialog from '../../apps/content-link-dialog.js'
import CoC7DelayedTooltip from '../../apps/delayed-tooltip.js'
import CoC7Link from '../../apps/link.js'
import CoC7ModelsItemWeaponSystem from '../item/weapon-system.js'
import CoC7RollNormalize from '../../apps/roll-normalize.js'
import CoC7SkillPopup from '../../apps/skill-popup.js'
import CoC7Utilities from '../../apps/utilities.js'
import deprecated from '../../deprecated.js'

export default class CoC7ModelsActorGlobalSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['coc7', 'sheet'],
    form: {
      handler: CoC7ModelsActorGlobalSheet.#onSubmit,
      submitOnChange: true
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    /* // FoundryV12 polyfill */
    if (!context.document) {
      context.document = this.document
    }

    context.canDragToken = (context.document.token instanceof TokenDocument) && game.user.isGM
    context.linkedActor = (context.document.token ?? context.document.prototypeToken)?.actorLink === true
    context.isToken = context.document.isToken
    context.tokenUuid = context.document.token?.uuid
    context.itemsByType = {}
    for (const document of context.document.items) {
      if (typeof context.itemsByType[document.type] === 'undefined') {
        context.itemsByType[document.type] = []
      }
      context.itemsByType[document.type].push(document)
    }
    for (const itemType in context.itemsByType) {
      if (itemType === 'skill') {
        context.itemsByType[itemType].sort(CoC7Utilities.sortSkillByNameWithOwn)
      } else {
        context.itemsByType[itemType].sort(CoC7Utilities.sortByNameKey)
      }
    }
    context.meleeSkills = (context.itemsByType.skill ?? []).filter(doc => doc.system.properties.fighting === true)
    context.rangeSkills = (context.itemsByType.skill ?? []).filter(doc => doc.system.properties.firearm === true || doc.system.properties.ranged === true)

    if (context.document.system.schema.getField('flags')?.getField('locked')) {
      context.showInventoryItems = !context.document.system.flags.locked || typeof context.itemsByType.item !== 'undefined'
      context.showInventoryBooks = !context.document.system.flags.locked || typeof context.itemsByType.book !== 'undefined'
      context.showInventorySpells = !context.document.system.flags.locked || typeof context.itemsByType.spell !== 'undefined'
      context.showInventoryTalents = (!context.document.system.flags.locked && game.settings.get(FOLDER_ID, 'pulpRuleTalents')) || typeof context.itemsByType.talent !== 'undefined'
      context.showInventoryStatuses = !context.document.system.flags.locked || typeof context.itemsByType.status !== 'undefined'
      context.showInventoryWeapons = !context.document.system.flags.locked || typeof context.itemsByType.weapon !== 'undefined'
      context.showInventoryArmor = !context.document.system.flags.locked || typeof context.itemsByType.armor !== 'undefined'

      context.hasInventory = this.hasInventory(context)
    }

    context.effects = context.document.type === 'character' ? CoC7ActiveEffect.prepareActiveEffectCategories(context.document.effects) : CoC7ActiveEffect.prepareNPCActiveEffectCategories(context.document.effects)

    context.allowUnlock = this.allowUnlock

    const overrides = foundry.utils.flattenObject(context.document.overrides)

    if (context.document.system.schema.getField('characteristics')) {
      context.characteristics = {}
      const characteristicsOrder = game.settings.get(FOLDER_ID, 'characteristicsOrder')
      for (const key of characteristicsOrder) {
        const value = context.document.system.schema.getField('characteristics').getField(key)
        context.characteristics[key] = {
          key,
          short: value.label,
          label: value.hint,
          value: context.document.system.characteristics[key].value,
          formula: context.document.system.characteristics[key].formula,
          activeEffectValue: typeof overrides['system.characteristics.' + key + '.value'] !== 'undefined',
          sourceValue: context.document._source.system.characteristics[key].value
        }
      }
    }
    if (context.document.system.schema.getField('attribs')) {
      context.attribs = {}
      for (const key of context.document.system.schema.getField('attribs').keys()) {
        context.attribs[key] = context.document.system.attribs[key]
        if (typeof context.attribs[key].value !== 'undefined') {
          context.attribs[key].activeEffectValue = typeof overrides['system.attribs.' + key + '.value'] !== 'undefined'
          context.attribs[key].sourceValue = context.document._source.system.attribs[key].value
        }
        if (typeof context.attribs[key].max !== 'undefined') {
          context.attribs[key].activeEffectMax = typeof overrides['system.attribs.' + key + '.max'] !== 'undefined'
          context.attribs[key].sourceMax = context.document._source.system.attribs[key].max
        }
        if (typeof context.attribs[key].dailyLoss !== 'undefined') {
          context.attribs[key].activeEffectDailyLoss = typeof overrides['system.attribs.' + key + '.dailyLoss'] !== 'undefined'
          context.attribs[key].sourceDailyLoss = context.document._source.system.attribs[key].dailyLoss
        }
        if (typeof context.attribs[key].dailyLimit !== 'undefined') {
          context.attribs[key].activeEffectDailyLimit = typeof overrides['system.attribs.' + key + '.dailyLimit'] !== 'undefined'
          context.attribs[key].sourceDailyLimit = context.document._source.system.attribs[key].dailyLimit
        }
      }
    }

    if (context.document.system.schema.getField('special')) {
      context.special = {}
      for (const key of context.document.system.schema.getField('special').keys()) {
        context.special[key] = context.document.system.special[key]
        switch (key) {
          case 'attacksPerRound':
            context.special[key] = {
              activeEffectValue: typeof overrides['system.special.' + key] !== 'undefined',
              value: context.special[key],
              sourceValue: context.document._source.system.special[key]
            }
            break
          case 'movement':
            for (const offset in context.special[key]) {
              context.special[key][offset].activeEffectValue = typeof overrides['system.special.' + key + '.' + offset + '.value'] !== 'undefined'
              context.special[key][offset].sourceValue = context.document._source.system.special[key][offset].value
            }
            break
          case 'sanLoss':
            context.special[key].activeEffectCheckFailled = typeof overrides['system.special.' + key + '.checkFailled'] !== 'undefined'
            context.special[key].sourceCheckFailled = context.document._source.system.special[key].checkFailled
            context.special[key].activeEffectCheckPassed = typeof overrides['system.special.' + key + '.checkPassed'] !== 'undefined'
            context.special[key].sourceCheckPassed = context.document._source.system.special[key].checkPassed
            break
        }
      }
    }

    context.pulpRuleArchetype = game.settings.get(FOLDER_ID, 'pulpRuleArchetype') || context.document.archetype
    context.pulpRuleOrganization = game.settings.get(FOLDER_ID, 'pulpRuleOrganization')
    if (!context.pulpRuleArchetype) {
      if (context.document.experiencePackage) {
        const doc = context.document.experiencePackage
        context.hasExperiencePackage = true
        context.nameExperiencePackage = doc.name
      }
    }

    context.rangeWpn = context.itemsByType.weapon?.filter(d => d.system.properties.rngd) ?? []
    context.meleeWpn = context.itemsByType.weapon?.filter(d => !d.system.properties.rngd) ?? []

    context.isKeeper = game.user.isGM

    context._properties = [{
      id: 'melee',
      name: 'CoC7.Weapon.Property.Melee',
      tooltip: ''
    }]
    for (const [key, value] of CoC7ModelsItemWeaponSystem.schema.getField('properties').entries()) {
      context._properties.push({
        id: key,
        name: value.label,
        tooltip: value.hint
      })
    }

    if (context.document.system.schema.getField('conditions')) {
      context.hasConditions = context.document.effects.size > 0 || Object.keys(context.document.system.conditions).filter(condition => context.document.system.conditions[condition].value).length > 0
    }

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

    if (typeof context.tabs?.[partId] !== 'undefined') {
      context.tab = context.tabs[partId]
    } else {
      context.tab = undefined
    }

    /* // FoundryV12 polyfill */
    if (game.release.generation === 12) {
      context.editable = this.isEditable
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

    this.element.querySelectorAll('.tab-group-header').forEach((element) => element.addEventListener('click', (event) => {
      const outer = element.closest('.tab-group')
      const key = 'panel' + outer.dataset.panel
      const saveable = this.isEditable && typeof this.document.system.flags[key] !== 'undefined'
      if (outer.dataset.slideUnder === 'on') {
        const button = outer.closest('section.window-content').querySelector('.slide-out-notes.clickable')
        const fn = () => {
          if (button.classList.contains('slid-out-notes')) {
            outer.classList.remove('sliding-out-notes')
          }
          element.removeEventListener('transitionend', fn)
        }
        outer.addEventListener('transitionend', fn)
        outer.classList.add('sliding-out-notes')
        if (button.classList.contains('slid-out-notes')) {
          button.classList.remove('slid-out-notes')
          outer.classList.add('slide-out-notes')
          if (saveable) {
            this.document.update({ ['system.flags.' + key]: false }, { render: false })
          }
        } else {
          button.classList.add('slid-out-notes')
          outer.classList.remove('slide-out-notes')
          if (saveable) {
            this.document.update({ ['system.flags.' + key]: true }, { render: false })
          }
        }
        return
      }
      if (CoC7Utilities.htmlElementToggled(outer)) {
        CoC7Utilities.htmlElementToggleHide(outer)
        if (saveable) {
          this.document.update({ ['system.flags.' + key]: false }, { render: false })
        }
      } else {
        const div = outer.querySelector('.tab-group-tab')
        div.classList.remove('html-element-hidden')
        CoC7Utilities.htmlElementToggleShow(outer, div)
        if (saveable) {
          this.document.update({ ['system.flags.' + key]: true }, { render: false })
        }
      }
    }))
    this.element.querySelector('.token-drag-handle')?.addEventListener('dragstart', this._onDragTokenStart.bind(this))
    this.element.querySelector('.san-check')?.addEventListener('dragstart', this._onDragSanCheck.bind(this))

    this.element.querySelectorAll('.item-name.effect-name').forEach((element) => element.addEventListener('click', this._onEffect.bind(this)))

    this.element.querySelectorAll('.attribute-value').forEach((element) => element.addEventListener('wheel', this._onWheel.bind(this), {
      passive: true
    }))

    this.element.querySelectorAll('.item-popup').forEach((element) => element.addEventListener('click', this._onItemPopup.bind(this)))

    this.element.querySelector('.slide-out-notes.clickable')?.addEventListener('click', (event) => {
      const tab = event.currentTarget.closest('section.window-content').querySelector('.tab-group-notes .tab-group-header')
      tab.dispatchEvent(new Event('click'))
    })

    this.element.querySelectorAll('.weapon-row').forEach((element) => {
      element.querySelector('.expand-arrow')?.addEventListener('click', async (event) => {
        event.preventDefault()
        const li = event.currentTarget.closest('.item')
        if (!li.dataset.itemUuid) {
          return
        }
        const item = await fromUuid(li.dataset.itemUuid)
        if (item) {
          if (CoC7Utilities.htmlElementToggled(li)) {
            CoC7Utilities.htmlElementToggleHide(li, { remove: true })
            element.classList.remove('expanded')
          } else {
            let div = li.querySelector('.html-element-toggled')
            if (!div) {
              div = document.createElement('div')
              div.style.gridArea = 'details'
              div.style.display = 'grid'
              await CoC7Utilities.setItemSummaryHtml(div, item, this.document)
              li.append(div)
            }
            CoC7Utilities.htmlElementToggleShow(li, div)
            element.classList.add('expanded')
          }
        }
      })
    })

    this.element.querySelectorAll('.item div.show-detail').forEach((element) => element.addEventListener('click', this._onItemSummary.bind(this)))

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return

    /* // FoundryVTT V12 */
    if (game.release.generation === 12) {
      deprecated.ActorAppV2DragDrop(this)
      this.element.querySelectorAll('img[data-action="editImage"]').forEach((element) => element.addEventListener('click', async (event) => {
        deprecated.AppV2EditImage(event, this.document, this.element, { submitOnChange: this.options.form.submitOnChange, position: this.position })
      }))
    }

    this.element.querySelectorAll('.toggle-switch').forEach((element) => element.addEventListener('click', (event) => { this._onClickToggle(event) }))

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
      event.preventDefault()
      switch (event.currentTarget.dataset.action) {
        case 'auto-toggle':
          this._onAttributeAutoToggleClicked(event)
          break
        case 'biography-add':
          this.document.createBioSection().then(() => {
            this.render({ force: true })
          })
          break
        case 'biography-move-down':
          {
            const index = parseInt(event.target.closest('.bio-section').dataset.index, 10)
            this.document.moveBioSectionDown(index)
          }
          break
        case 'biography-move-up':
          {
            const index = parseInt(event.target.closest('.bio-section').dataset.index, 10)
            this.document.moveBioSectionUp(index)
          }
          break
        case 'biography-remove':
          {
            const index = parseInt(event.target.closest('.bio-section').dataset.index, 10)
            this.document.deleteBioSection(index)
          }
          break
        case 'characteristics-average':
          this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
          this.document.averageCharacteristicsValue()
          break
        case 'characteristics-roll':
          this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
          this.document.rollCharacteristicsValue()
          break
        case 'condition':
          this._onConditionToggle(event)
          break
        case 'dying-check':
          this.checkForDeath(event)
          break
        case 'item-add':
          this._onItemAdd(event)
          break
        case 'item-delete':
          this._onItemDelete(event)
          break
        case 'item-edit':
          this._onItemEdit(event)
          break
        case 'item-trade':
          CoC7Utilities.tradeItem(event.currentTarget.closest('.item')?.dataset.itemUuid)
          break
        case 'reset-counter':
          this.document.resetDailySanity()
          break
        case 'toggle-flag':
          this._onFlagClicked(event)
          break
        case 'toggleSkillFlag':
          this._onFlagSkillClicked(event)
          break
        case 'weapon-damage':
          this._onWeaponDamage(event)
          break
        case 'notes-toggle':
          this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
          this.document.update({ 'system.attribs.armor.notes': !this.document.system.attribs.armor.notes })
          break
      }
    }))
    this.element.querySelectorAll('.reload-weapon').forEach((element) => {
      element.addEventListener('click', this._onReloadWeapon.bind(this))
      element.addEventListener('contextmenu', this._onReloadWeapon.bind(this))
    })
    this.element.querySelectorAll('.item div.show-detail').forEach((element) => element.addEventListener('dblclick', this._onItemEdit.bind(this)))
    this.element.querySelectorAll('.item-edit').forEach((element) => element.addEventListener('click', this._onItemEdit.bind(this)))
    this.element.querySelectorAll('.development-flag').forEach((element) => element.addEventListener('dblclick', async (event) => {
      event.preventDefault()
      const itemUuid = event.target.closest('.item').dataset.itemUuid
      const document = await fromUuid(itemUuid)
      if (document) {
        document.update({
          'system.flags.developement': !document.system.flags.developement
        })
      }
    }))
    this.element.querySelectorAll('.skill-name').forEach((element) => element.addEventListener('change', this._onSkillSetName.bind(this)))
    this.element.querySelectorAll('.npc-skill-score').forEach((element) => element.addEventListener('change', this._onSkillSetValue.bind(this)))
    this.element.querySelectorAll('.skill-adjustment').forEach((element) => element.addEventListener('change', this._onSkillSetAdjustment.bind(this)))

    CoC7ActiveEffect._onRender(this.element, context.document)

    this.element.querySelector('.luck-development')?.addEventListener('click', (event) => {
      if (!event.detail || event.detail === 1) {
        this.document.developLuck(event.shiftKey)
      }
    })

    this.element.querySelector('.skill-development')?.addEventListener('click', (event) => {
      if (!event.detail || event.detail === 1) {
        this.document.developmentPhase(event.shiftKey)
      }
    })

    this.element.querySelector('.clear_conditions')?.addEventListener('click', (event) => {
      const disable = {}
      for (const condition in this.document.system.conditions) {
        if (this.document.system.conditions[condition].value === true) {
          disable[`system.conditions.${condition}.value`] = false
        }
      }
      if (Object.keys(disable).length > 0) {
        this.actor.update(disable)
      }
      const effects = this.document.effects.map(effect => effect.id)
      if (effects.length > 0) {
        this.document.deleteEmbeddedDocuments('ActiveEffect', effects)
      }
    })

    this.element.querySelectorAll('.read-only').forEach((element) => element.addEventListener('dblclick', this._toggleReadOnly.bind(this)))

    // Everything below here is not available if in compendium
    /* // FoundryVTT V12 */
    if (context.document.inCompendium ?? !!context.document.pack) return

    this.element.querySelectorAll('.attribute-name.rollable').forEach((element) => {
      element.addEventListener('click', this._onRollAttribTest.bind(this))
      element.addEventListener('contextmenu', this._onOpposedRoll.bind(this))
      element.addEventListener('dragstart', this._onDragAttribute.bind(this))
      if (typeof element.dataset.tooltip === 'undefined') {
        CoC7DelayedTooltip.init(element, this.toolTipAttributeEnter.bind(this))
      }
    })
    this.element.querySelectorAll('.characteristic-name.rollable').forEach((element) => {
      element.addEventListener('click', this._onRollCharacteristicTest.bind(this))
      element.addEventListener('contextmenu', this._onOpposedRoll.bind(this))
      element.addEventListener('dragstart', this._onDragCharacteristic.bind(this))
      if (typeof element.dataset.tooltip === 'undefined') {
        CoC7DelayedTooltip.init(element, this.toolTipCharacteristicEnter.bind(this))
      }
    })
    this.element.querySelectorAll('.skill-name.rollable').forEach((element) => {
      element.addEventListener('click', this._onRollSkillTest.bind(this))
      element.addEventListener('contextmenu', this._onOpposedRoll.bind(this))
      if (typeof element.dataset.tooltip === 'undefined') {
        CoC7DelayedTooltip.init(element, this.toolTipSkillEnter.bind(this))
      }
    })
    this.element.querySelectorAll('.weapon-name.rollable').forEach((element) => {
      element.addEventListener('click', this._onWeaponRoll.bind(this))
      element.addEventListener('contextmenu', this._onOpposedRoll.bind(this))
    })
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<HTMLElement>}
   */
  async _renderFrame (options) {
    const frame = await super._renderFrame(options)

    /* // FoundryV12 polyfill */
    if (!foundry.utils.isNewerVersion(game.version, 13)) {
      frame.setAttribute('open', true)
    }

    return frame
  }

  /**
   * Add tooltip and basic tooltip to skill element
   * @param {HtmlElement} element
   */
  toolTipSkillEnter (element) {
    const isCombat = element.classList?.contains('combat')
    const data = {
      skill: element.dataset.nameTooltip,
      regular: element.dataset.valueTooltip,
      hard: Math.floor(element.dataset.valueTooltip / 2),
      extreme: Math.floor(element.dataset.valueTooltip / 5)
    }
    const basicToolTip = game.i18n.format('CoC7.ToolTipShort', data)
    let toolTip = game.i18n.format(isCombat ? 'CoC7.ToolTipCombat' : 'CoC7.ToolTipSkill', data)
    if (game.user.isGM) {
      toolTip = toolTip + game.i18n.format('CoC7.ToolTipKeeperSkill', {
        other: game.settings.get(FOLDER_ID, 'stanbyGMRolls') && this.document.hasPlayerOwner
          ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
            name: this.document.name
          })
          : ''
      })
    }
    element.dataset.generatedBasicTooltip = basicToolTip
    element.dataset.generatedTooltip = toolTip
  }

  /**
   * Add tooltip and basic tooltip to characteristic element
   * @param {HtmlElement} element
   */
  toolTipCharacteristicEnter (element) {
    let toolTip = ''
    let basicToolTip = ''
    if (typeof this.document.system.characteristics[element.dataset.tooltipKey] !== 'undefined') {
      const data = {
        skill: game.i18n.localize(CONFIG.Actor.dataModels.character.schema.getField('characteristics').getField(element.dataset.tooltipKey).hint),
        regular: this.document.system.characteristics[element.dataset.tooltipKey].value,
        hard: Math.floor(this.document.system.characteristics[element.dataset.tooltipKey].value / 2),
        extreme: Math.floor(this.document.system.characteristics[element.dataset.tooltipKey].value / 5)
      }
      toolTip = toolTip + game.i18n.format('CoC7.ToolTipSkill', data)
      basicToolTip = game.i18n.format('CoC7.ToolTipShort', data)
      if (game.user.isGM) {
        toolTip = toolTip + game.i18n.format('CoC7.ToolTipKeeperSkill', {
          other: game.settings.get(FOLDER_ID, 'stanbyGMRolls') && this.document.hasPlayerOwner
            ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
              name: this.document.name
            })
            : ''
        })
      }
    }
    element.dataset.generatedBasicTooltip = basicToolTip
    element.dataset.generatedTooltip = toolTip
  }

  /**
   * Add tooltip and basic tooltip to attribute element
   * @param {HtmlElement} element
   */
  toolTipAttributeEnter (element) {
    let toolTip = ''
    let basicToolTip = ''
    switch (element.dataset.tooltipKey) {
      case 'lck':
        {
          const data = {
            skill: game.i18n.localize(CONFIG.Actor.dataModels.character.schema.getField('attribs').getField(element.dataset.tooltipKey).hint),
            regular: (this.document.system.attribs[element.dataset.tooltipKey]?.value ?? 0),
            hard: Math.floor((this.document.system.attribs[element.dataset.tooltipKey]?.value ?? 0) / 2),
            extreme: Math.floor((this.document.system.attribs[element.dataset.tooltipKey]?.value ?? 0) / 5)
          }
          toolTip = toolTip + game.i18n.format('CoC7.ToolTipSkill', data)
          basicToolTip = game.i18n.format('CoC7.ToolTipShort', data)
          if (game.user.isGM) {
            toolTip = toolTip + game.i18n.format('CoC7.ToolTipKeeperSkill', {
              other: game.settings.get(FOLDER_ID, 'stanbyGMRolls') && this.document.hasPlayerOwner
                ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
                  name: this.document.name
                })
                : ''
            })
          }
        }
        break
      case 'san':
        {
          const data = {
            skill: game.i18n.localize(CONFIG.Actor.dataModels.character.schema.getField('attribs').getField(element.dataset.tooltipKey).hint),
            regular: (this.document.system.attribs[element.dataset.tooltipKey]?.value ?? 0),
            hard: Math.floor((this.document.system.attribs[element.dataset.tooltipKey]?.value ?? 0) / 2),
            extreme: Math.floor((this.document.system.attribs[element.dataset.tooltipKey]?.value ?? 0) / 5)
          }
          toolTip = toolTip + game.i18n.format('CoC7.ToolTipSanity', data)
          basicToolTip = game.i18n.format('CoC7.ToolTipShort', data)
          if (game.user.isGM) {
            toolTip = toolTip + game.i18n.format('CoC7.ToolTipKeeperSkill', {
              other: game.i18n.localize('CoC7.ToolTipKeeperSanity') + (game.settings.get(FOLDER_ID, 'stanbyGMRolls') && this.document.hasPlayerOwner
                ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
                  name: this.document.name
                })
                : '')
            })
          }
        }
        break
    }
    element.dataset.generatedBasicTooltip = basicToolTip
    element.dataset.generatedTooltip = toolTip
  }

  /**
   * Item sheet render
   * @param {SubmitEvent|null} event
   */
  async _onItemEdit (event) {
    const itemUuid = event.target.closest('.item').dataset.itemUuid
    ;(await fromUuid(itemUuid))?.sheet.render({ force: true })
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onDragCharacteristic (event) {
    const data = {
      check: CoC7Link.CHECK_TYPE.CHECK,
      type: 'CoC7Link',
      subtype: 'characteristic',
      name: event.currentTarget.closest('.attribute').dataset.characteristic
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onDragAttribute (event) {
    const data = {
      check: CoC7Link.CHECK_TYPE.CHECK,
      type: 'CoC7Link',
      subtype: 'attribute',
      name: event.currentTarget.closest('.attribute').dataset.attrib
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  _onDragSanCheck (event) {
    const data = {
      check: CoC7Link.CHECK_TYPE.SANLOSS,
      type: 'CoC7Link',
      sanMin: this.actor.system.special.sanLoss.checkPassed,
      sanMax: this.actor.system.special.sanLoss.checkFailled,
      sanReason: this.actor.system.infos.type
    }
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  /**
   * Handle a dropped document on the ActorSheet
   * @param {DragEvent} event
   * @param {Document} document
   * @returns {Promise<Document|null>}
   */
  async _onDropDocument (event, document) {
    if (document.documentName === 'Macro' && ['creature', 'npc'].includes(this.actor.type)) {
      const macros = foundry.utils.duplicate(this.actor.system.special.macros)
      macros.push({
        uuid: document.uuid
      })
      return this.actor.update({ 'system.special.macros': macros })
    }
    return super._onDropDocument(event, document)
  }

  /**
   * Handle a dropped Item on the Actor Sheet.
   * @param {DragEvent} event
   * @param {Item} item
   * @returns {Promise<Item|null|undefined>}
   */
  async _onDropItem (event, item) {
    if (!this.actor.isOwner) {
      return null
    }
    if (this.actor.uuid === item.parent?.uuid) {
      const result = await this._onSortItem(event, item)
      return result?.length ? item : null
    }

    if (!this._onDropItemAllowed(item)) {
      return null
    }
    const keepId = !this.actor.items.has(item.id)
    return this.actor.createEmbeddedDocuments('Item', [item.toObject()], { parent: this.actor, keepId })
  }

  /**
   * Is this type of item allowed to be dropped on the actor?
   * @param {object} item
   * @returns {boolean}
   */
  _onDropItemAllowed (item) {
    return true
  }

  /**
   * Toggle condition if allowed
   * @param {ClickEvent} event
   */
  _onConditionToggle (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    if (game.user.isGM || game.settings.get(FOLDER_ID, 'statusPlayerEditable')) {
      if (event.currentTarget.dataset.condition) {
        this.document.toggleCondition(event.currentTarget.dataset.condition)
      }
    }
  }

  /**
   * Roll CON check for death condition
   * @param {ClickEvent} event
   */
  async checkForDeath (event) {
    await CoC7ConCheck.create(this.document, { stayAlive: true })
  }

  /**
   * Set drag data
   * @param {DragEvent} event
   */
  async _onDragTokenStart (event) {
    if (event.currentTarget.dataset.tokenUuid) {
      const data = {
        type: 'Token',
        uuid: event.currentTarget.dataset.tokenUuid
      }
      event.dataTransfer.setData('text/plain', JSON.stringify(data))
    }
  }

  /**
   * Toggle Automatic Calculation flag
   * @param {SubmitEvent|null} event
   */
  async _onAttributeAutoToggleClicked (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const flagName = event.currentTarget.closest('[data-attrib]').dataset.attrib
    this.document.update({ ['system.attribs.' + flagName + '.auto']: !this.document.system.attribs[flagName].auto })
  }

  /**
   * Toggle item property
   * @param {ClickEvent} event
   */
  async _onClickToggle (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const property = event.currentTarget.closest('.toggle-attributes').dataset.set
    const key = event.currentTarget.dataset.property
    const itemUuid = event.currentTarget.closest('.item').dataset.itemUuid
    if (itemUuid) {
      const document = await fromUuid(itemUuid)
      if (document) {
        document.system.toggleProperty(property, key, { isCtrlKey: CoC7Utilities.isCtrlKey(event) })
      }
    }
  }

  /**
   * Toggle flag
   * @param {SubmitEvent|null} event
   */
  async _onFlagClicked (event) {
    event.preventDefault()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const flagName = event.currentTarget.dataset.toggleFlag
    this.document.update({ ['system.flags.' + flagName]: !this.document.system.flags[flagName] })
  }

  /**
   * Scroll wheel change values
   * @param {WheelEvent} event
   */
  async _onWheel (event) {
    let value = parseInt(event.currentTarget.value, 10) || 0
    if (event.deltaY > 0) {
      value = value === 0 ? 0 : value - 1
    } else if (event.deltaY < 0) {
      value++
    }

    switch (event.currentTarget.name) {
      case 'system.attribs.hp.value':
        this.document.setHp(value)
        break
      case 'system.attribs.mp.value':
        this.document.update({ 'system.attribs.mp.value': value })
        break
      case 'system.attribs.san.value':
        this.document.setSan(value)
        break
      case 'system.attribs.lck.value':
        this.document.update({ 'system.attribs.lck.value': value })
        break
    }
  }

  /**
   * Toggle description
   * @param {ClickEvent} event
   */
  _toggleReadOnly (event) {
    event.currentTarget.readOnly = !event.currentTarget.readOnly
    event.currentTarget.classList.toggle('read-only')
  }

  /**
   * Toggle description
   * @param {ClickEvent} event
   */
  async _onItemSummary (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    if (li.dataset.itemUuid) {
      const item = await fromUuid(li.dataset.itemUuid)
      if (item) {
        if (CoC7Utilities.htmlElementToggled(li)) {
          CoC7Utilities.htmlElementToggleHide(li, { remove: true })
        } else {
          let div = li.querySelector('.html-element-toggled')
          if (!div) {
            div = document.createElement('div')
            div.style.flexBasis = '100%'
            await CoC7Utilities.setItemSummaryHtml(div, item)
            li.append(div)
          }
          CoC7Utilities.htmlElementToggleShow(li, div)
        }
      }
    }
  }

  /**
   * Show uneditable skill sheet
   * @param {SubmitEvent|null} event
   */
  async _onItemPopup (event) {
    event.preventDefault()
    const itemUuid = event.target.closest('.item').dataset.itemUuid
    const document = await fromUuid(itemUuid)
    if (document) {
      new CoC7SkillPopup({ document }, {}).render({ force: true, focus: true })
    }
  }

  /**
   * Ctrl click effect to make a link
   * @param {SubmitEvent|null} event
   */
  async _onEffect (event) {
    event.preventDefault()
    const effectId = event.currentTarget.closest('li').dataset.effectId
    const effect = this.document.effects.get(effectId)
    if (CoC7Utilities.isCtrlKey(event) && game.user.isGM) {
      CoC7ContentLinkDialog.create({ type: 'CoC7Link', check: CoC7Link.CHECK_TYPE.EFFECT, object: effect })
    }
  }

  /**
   * Trigger a Weapon Roll
   * @param {event} event
   */
  async _onWeaponRoll (event) {
    event.preventDefault()
    const itemUuid = event.currentTarget.closest('.item').dataset.itemUuid
    const weapon = await fromUuid(itemUuid)
    if (CoC7Utilities.isCtrlKey(event) && game.user.isGM) {
      const cocid = weapon.flags[FOLDER_ID]?.cocidFlag?.id
      CoC7ContentLinkDialog.create({
        check: CoC7Link.CHECK_TYPE.ITEM,
        name: cocid ?? weapon.name,
        label: (cocid ? weapon.name : undefined)
      })
    } else {
      this.document.weaponRoll(weapon, CoC7Utilities.getActorUuid(this.document))
    }
  }

  /**
   * Add / Remove ammunition
   * @param {ClickEvent} event
   */
  async _onReloadWeapon (event) {
    const itemUuid = event.currentTarget.closest('.item').dataset.itemUuid
    if (itemUuid) {
      const document = await fromUuid(itemUuid)
      if (document) {
        switch (event.button) {
          case 0:
            if (event.shiftKey) {
              await document.system.reload()
            } else {
              document.system.addAmmunition()
            }
            break
          case 2:
            if (event.shiftKey) {
              await document.system.setBullets(0)
            } else {
              await document.system.shootAmmunition(1)
            }
            break
        }
      }
    }
  }

  /**
   * Perform weapon damage
   * @param {ClickEvent} event
   */
  async _onWeaponDamage (event) {
    event.preventDefault()
    const itemElement = event.currentTarget.closest('.item')
    const itemUuid = itemElement.dataset.itemUuid
    const damageRange = event.currentTarget.dataset.range
    CoC7ChatDamage.createFromWeapon({ attackerUuid: this.document.uuid, weaponUuid: itemUuid, damageRange })
  }

  /**
   * Item Add
   * @param {SubmitEvent|null} event
   */
  async _onItemAdd (event) {
    event.stopPropagation()
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    let document
    switch (event.currentTarget.dataset.type) {
      case 'armor':
        document = await this.document.createEmptyArmor(event)
        break
      case 'book':
        document = await this.document.createEmptyBook(event)
        break
      case 'item':
        document = await this.document.createEmptyItem(event)
        break
      case 'skill':
        document = await this.document.createEmptySkill(event)
        break
      case 'spell':
        document = await this.document.createEmptySpell(event)
        break
      case 'weapon':
        document = await this.document.createEmptyWeapon(event)
        break
    }
    if (typeof document?.[0] !== 'undefined') {
      document[0].sheet.render({ force: true })
    }
  }

  /**
   * Item Delete
   * @param {SubmitEvent|null} event
   */
  async _onItemDelete (event) {
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const itemUuid = event.target.closest('.item').dataset.itemUuid
    fromUuid(itemUuid).then(item => {
      item.delete()
    })
  }

  /**
   * Trigger Opposed Check
   * @param {SubmitEvent|null} event
   */
  async _onOpposedRoll (event) {
    event.preventDefault()
    if (event.currentTarget.closest('.attribute')?.dataset.attrib === 'db') {
      return
    }
    const data = {
      rollType: CoC7RollNormalize.ROLL_TYPE.SKILL,
      cardType: CoC7RollNormalize.CARD_TYPE.OPPOSED,
      event,
      actor: this.document
    }
    if (event.currentTarget.classList.contains('characteristic-name')) {
      data.rollType = CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC
    } else if (event.currentTarget.classList.contains('attribute-name')) {
      data.rollType = CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE
    }
    if (event.altKey) {
      data.cardType = CoC7RollNormalize.CARD_TYPE.COMBINED
    }
    CoC7RollNormalize.trigger(data)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  async _onRollCharacteriticTest (event) {
    deprecated.warningLogger({
      was: 'Actor._onRollCharacteriticTest',
      now: 'Actor.system._onRollCharacteristicTest',
      until: 15
    })
    return this._onRollCharacteristicTest(event)
  }

  /**
   * Trigger Characteristic Check
   * @param {SubmitEvent|null} event
   */
  async _onRollCharacteristicTest (event) {
    event.preventDefault()
    CoC7RollNormalize.trigger({
      rollType: CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC,
      cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
      event,
      actor: this.document
    })
  }

  /**
   * Trigger Attribute Check
   * @param {SubmitEvent|null} event
   */
  async _onRollAttribTest (event) {
    event.preventDefault()
    const attrib = event.currentTarget.closest('.attribute').dataset.attrib
    if (attrib === 'db') {
      const roll = new Roll(this.document.system.attribs.db.value.toString(), this.document.parsedValues())
      if (!roll.isDeterministic) {
        roll.toMessage({
          flavor: game.i18n.localize('CoC7.BonusDamageRoll'),
          speaker: ChatMessage.getSpeaker()
        })
      }
      return
    }
    const cardType = (attrib === 'san' && event.altKey ? CoC7RollNormalize.CARD_TYPE.SAN_CHECK : CoC7RollNormalize.CARD_TYPE.NORMAL)
    CoC7RollNormalize.trigger({
      rollType: CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE,
      cardType,
      event,
      actor: this.document
    })
  }

  /**
   * Trigger Skill Check
   * @param {SubmitEvent|null} event
   */
  async _onRollSkillTest (event) {
    event.preventDefault()
    if (event.currentTarget.classList.contains('flagged4dev')) {
      const skillId = event.currentTarget.closest('.item').dataset.itemUuid
      this.document.developSkill(skillId, event.shiftKey)
    } else {
      CoC7RollNormalize.trigger({
        rollType: CoC7RollNormalize.ROLL_TYPE.SKILL,
        cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
        event,
        actor: this.document
      })
    }
  }

  /**
   * Handle form submission
   * @param {SubmitEvent|null} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static async #onSubmit (event, form, formData) {
    if (!this.isEditable) return
    const submitData = this._prepareSubmitData(event, form, formData)
    const overrides = foundry.utils.flattenObject(this.document.overrides)
    const name = event.target?.name
    const value = event.target?.value
    if (name && typeof overrides[name] !== 'undefined') {
      /* // FoundryVTT V12 */
      ui.notifications.warn(game.i18n.format('CoC7.EffectAppliedCantOverride', { name }))
      return
    }

    if (this.document.img !== submitData.img) {
      if ((this.document.token ?? this.document.prototypeToken).texture.src === (this.document.token?.actor ?? this.document).system.constructor.defaultImg) {
        // Image was changed and it was the default, so also update the token image
        if (this.document.token) {
          await this.document.token.update({
            'texture.src': submitData.img
          })
        } else {
          foundry.utils.setProperty(submitData, 'prototypeToken.texture.src', submitData.img)
        }
      }
    }

    switch (name) {
      case 'system.attribs.san.value':
        await this.document.setSan(parseInt(value, 10))
        return
      case 'system.attribs.hp.value':
        await this.document.setHp(parseInt(value, 10))
        return
      case 'system.characteristics.str.formula':
      case 'system.characteristics.con.formula':
      case 'system.characteristics.siz.formula':
      case 'system.characteristics.dex.formula':
      case 'system.characteristics.app.formula':
      case 'system.characteristics.int.formula':
      case 'system.characteristics.pow.formula':
      case 'system.characteristics.edu.formula':
      case 'system.attribs.db.value':
        try {
          new Roll(value).evaluateSync({ maximize: true })
        } catch (e) {
          /* // FoundryVTT V12 */
          ui.notifications.error(game.i18n.format('CoC7.ErrorInvalidFormula', { value }))
        }
        break
    }

    await this._processSubmitData(event, form, submitData)
  }

  /**
   * Can sheet be unlocked?
   * @returns {boolean}
   */
  get allowUnlock () {
    return game.user.isGM || game.settings.get(FOLDER_ID, 'playerUnlockSheetMode') === 'always' || (game.settings.get(FOLDER_ID, 'playerUnlockSheetMode') === 'creation' && game.settings.get(FOLDER_ID, 'charCreationEnabled'))
  }

  /**
   * Prepare tabs object
   * @param {string} group
   * @param {string} active
   * @param {object} tabs
   * @returns {object}
   */
  getTabs (group, active, tabs) {
    if (typeof this.tabGroups[group] === 'undefined' || typeof tabs[this.tabGroups[group]] === 'undefined') {
      this.tabGroups[group] = active
    }
    for (const tab in tabs) {
      tabs[tab].id = tab
      tabs[tab].group = group
      tabs[tab].cssClass = (tabs[tab].cssClass ?? '') + (this.tabGroups[group] === tabs[tab].id ? ' active' : '')
    }
    return tabs
  }

  /**
   * Check context to see if any inventory groups are true
   * @param {object} context
   * @returns {boolean}
   */
  hasInventory (context) {
    return context.showInventoryItems || context.showInventoryBooks || context.showInventorySpells || context.showInventoryTalents || context.showInventoryStatuses || context.showInventoryWeapons || context.showInventoryArmor
  }

  /**
   * Toggle skill adjustment flag
   * @param {SubmitEvent} event
   */
  async _onFlagSkillClicked (event) {
    event.preventDefault()
    const itemUuid = event.currentTarget.closest('.item').dataset.itemUuid
    const flag = event.currentTarget.dataset.flag
    if (itemUuid && flag) {
      const skill = await fromUuid(itemUuid)
      if (skill) {
        skill.update({
          ['system.flags.' + flag]: !skill.system.flags[flag],
          ['system.adjustments.' + flag]: 0
        })
      }
    }
  }

  /**
   * Set skill item name
   * @param {SubmitEvent|null} event
   */
  async _onSkillSetName (event) {
    event.preventDefault()
    const itemUuid = event.target.closest('.item').dataset.itemUuid
    const value = event.target.value
    const document = await fromUuid(itemUuid)
    if (value && document) {
      const parts = document.system.constructor.guessNameParts(value)
      if (!parts.system.properties.special && document.system.properties.special) {
        const parts = document.system.constructor.getNamePartsSpec(value, document.system.specialization)
        await document.update({
          name: parts.name,
          system: {
            skillName: parts.skillName,
            specialization: parts.specialization
          }
        })
      } else {
        await document.update({
          name: parts.name,
          system: {
            properties: {
              special: parts.system.properties.special
            },
            skillName: parts.system.skillName,
            specialization: parts.system.specialization
          }
        })
      }
    }
  }

  /**
   * Set skill item value
   * @param {SubmitEvent|null} event
   */
  async _onSkillSetValue (event) {
    event.preventDefault()
    const itemUuid = event.target.closest('.item').dataset.itemUuid
    const value = event.target.value
    if (isNaN(value)) {
      return
    }
    const document = await fromUuid(itemUuid)
    if (document) {
      const difference = parseInt(value, 10) - document.system.value
      if (difference !== 0) {
        document.update({ 'system.adjustments.experience': document.system.adjustments.experience + difference })
      }
    }
  }

  /**
   * Set skill adjustments value
   * @param {SubmitEvent|null} event
   */
  async _onSkillSetAdjustment (event) {
    event.preventDefault()
    const itemUuid = event.target.closest('.item').dataset.itemUuid
    const flag = event.target.dataset.flag
    const value = event.target.value
    if (!flag || isNaN(value)) {
      return
    }
    const document = await fromUuid(itemUuid)
    if (document) {
      if (document.system.isCreditRating) {
        const occupation = this.document.occupation
        if (flag === 'occupation' && occupation) {
          const newValue = parseInt(value, 10)
          if (newValue > occupation.system.creditRating.max || newValue < occupation.system.creditRating.min) {
            /* // FoundryVTT V12 */
            ui.notifications.warn(game.i18n.format('CoC7.CreditOutOfRange', { min: occupation.system.creditRating.min, max: occupation.system.creditRating.max }))
          }
        }
      }
      await document.update({
        ['system.adjustments.' + flag]: value
      })
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
    if (typeof object.system.biography !== 'undefined') {
      const biography = foundry.utils.duplicate(this.document.system.biography)
      for (const key in object.system.biography) {
        biography[key] = { ...biography[key], ...object.system.biography[key] }
      }
      object.system.biography = biography
    }
    if (typeof object.system.sanityLossEvents !== 'undefined') {
      const sanityLossEvents = foundry.utils.duplicate(this.document.system.sanityLossEvents)
      for (const key in object.system.sanityLossEvents) {
        sanityLossEvents[key] = { ...sanityLossEvents[key], ...object.system.sanityLossEvents[key] }
      }
      object.system.sanityLossEvents = sanityLossEvents
    }
    return object
  }

  /**
   * Add empty element the same height as the last and move scroll to it
   * @param {string} selector
   */
  scrollToNewLast (selector) {
    const existing = this.element.querySelectorAll(selector)
    if (existing.length) {
      const empty = document.createElement('div')
      empty.style.height = existing[existing.length - 1].getBoundingClientRect().height + 'px'
      existing[existing.length - 1].after(empty)
      empty.scrollIntoView({ block: 'end' })
    }
  }

  /**
   * Change the active tab within a tab group in this Application instance.
   * @param {string} tab
   * @param {string} group
   * @param {object} options
   */
  changeTab (tab, group, options) {
    if (tab === 'locked' && group === 'primary') {
      if (this.allowUnlock) {
        this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
        this.document.update({ 'system.flags.locked': !this.document.system.flags.locked })
      }
      return
    }
    super.changeTab(tab, group, options)
  }
}
