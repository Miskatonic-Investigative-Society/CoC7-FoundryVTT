/* global $, FontFace, foundry, game, TextEditor, ui */
import { COC7 } from '../../core/config.js'
import { CoCActor } from '../../core/documents/actor.js'
import { CoC7ActorSheet } from '../../core/sheets/actor-sheet-base.js'
import { CoC7CreateMythosEncounter } from '../sanity/apps/create-mythos-encounters.js'
import { chatHelper } from '../../shared/dice/helper.js'

export class CoC7CharacterSheet extends CoC7ActorSheet {
  _getHeaderButtons () {
    if (this.constructor.name === 'CoC7CharacterSheet') {
      if (!this.summarized) this.summarized = false
      let buttons = super._getHeaderButtons()
      buttons = [
        {
          label: this.summarized
            ? game.i18n.localize('CoC7.Maximize')
            : game.i18n.localize('CoC7.Summarize'),
          class: 'test-extra-icon',
          icon: this.summarized
            ? 'fas fa-window-maximize'
            : 'fas fa-window-minimize',
          onclick: event => this.toggleSheetMode(event)
        }/* ,
        {
          label: '',
          class: 'drag-test-thingy',
          icon: 'game-icon game-icon-d10',
          ondragstart: () => ui.notifications.info('drag started')
        } */
      ].concat(buttons)
      return buttons
    }
    return super._getHeaderButtons()
  }

  async toggleSheetMode (event) {
    this.summarized = !this.summarized
    let options = foundry.utils.duplicate(CoC7CharacterSheet.defaultOptions)
    if (this.summarized) {
      options = foundry.utils.mergeObject(options, {
        classes: ['coc7', 'actor', 'character', 'summarized'],
        height: 200,
        resizable: false,
        width: 700
      })
    }
    options.token = this.options.token
    await this.close()
    await this.render(true, options)
  }

  async getData () {
    const sheetData = await super.getData()
    if (
      this.isEditable &&
      typeof this.actor.getFlag('CoC7', 'skillListMode') === 'undefined'
    ) {
      await this.actor.setFlag('CoC7', 'skillListMode', false)
    }
    if (
      this.isEditable &&
      typeof this.actor.getFlag('CoC7', 'skillShowUncommon') === 'undefined'
    ) {
      await this.actor.setFlag('CoC7', 'skillShowUncommon', true)
    }
    sheetData.skillListModeValue =
      this.actor.getFlag('CoC7', 'skillListMode') ?? false
    sheetData.skillShowUncommon =
      this.actor.getFlag('CoC7', 'skillShowUncommon') ?? true
    sheetData.showIconsOnly = game.settings.get('CoC7', 'showIconsOnly')

    if (this.actor.occupation) {
      sheetData.data.system.infos.occupation = this.actor.occupation.name
      sheetData.data.system.infos.occupationSet = true
    } else sheetData.data.system.infos.occupationSet = false

    if (this.actor.archetype) {
      sheetData.data.system.infos.archetype = this.actor.archetype.name
      sheetData.data.system.infos.archetypeSet = true
    } else sheetData.data.system.infos.archetypeSet = false

    sheetData.totalExperience = this.actor.experiencePoints
    sheetData.totalOccupation = this.actor.occupationPointsSpent
    sheetData.invalidOccupationPoints =
      Number(this.actor.occupationPointsSpent) !==
      Number(this.actor.system.development?.occupation)
    sheetData.totalArchetype = this.actor.archetypePointsSpent
    sheetData.invalidArchetypePoints =
      Number(this.actor.archetypePointsSpent) !==
      Number(this.actor.system.development?.archetype)
    sheetData.totalExperiencePackage = Number(this.actor.ExperiencePackagePointsSpent)
    sheetData.invalidExperiencePackagePoints = Number(this.actor.ExperiencePackagePointsSpent) !== Number(this.actor.ExperiencePackagePoints)
    sheetData.totalPersonal = this.actor.personalPointsSpent
    sheetData.invalidPersonalPoints =
      Number(this.actor.personalPointsSpent) !==
      Number(this.actor.system.development?.personal)
    sheetData.creditRatingMax = Number(
      this.actor.occupation?.system.creditRating.max
    )
    sheetData.creditRatingMin = Number(
      this.actor.occupation?.system.creditRating.min
    )
    sheetData.invalidCreditRating =
      this.actor.creditRatingSkill?.system.adjustments?.occupation >
      sheetData.creditRatingMax ||
      this.actor.creditRatingSkill?.system.adjustments?.occupation <
      sheetData.creditRatingMin
    sheetData.pulpTalentCount = sheetData.itemsByType.talent?.length
      ? sheetData.itemsByType.talent?.length
      : 0
    sheetData.minPulpTalents = this.actor.archetype?.system.talents
      ? this.actor.archetype?.system.talents
      : 0
    sheetData.invalidPulpTalents = sheetData.pulpTalentCount < sheetData.minPulpTalents

    sheetData.hasDevelopmentPhase = this.actor.hasDevelopmentPhase

    sheetData.allowDevelopment = game.settings.get('CoC7', 'developmentEnabled')
    sheetData.allowCharCreation = game.settings.get('CoC7', 'charCreationEnabled')
    sheetData.developmentRollForLuck = game.settings.get(
      'CoC7',
      'developmentRollForLuck'
    )
    sheetData.showDevPannel = sheetData.allowDevelopment || sheetData.allowCharCreation

    sheetData._monetaryFormats = []
    for (const key in COC7.monetaryFormats) {
      sheetData._monetaryFormats.push({ key, val: game.i18n.localize(COC7.monetaryFormats[key]) })
    }

    sheetData.showCurrencySymbol = ['decimalLeft', 'decimalRight', 'integerLeft', 'integerRight'].includes(sheetData.data.system.monetary.format)

    sheetData._monetaryTypes = []
    for (const key in COC7.monetaryTypes) {
      if (COC7.monetaryTypes[key].filter.length === 0 || COC7.monetaryTypes[key].filter.includes(sheetData.data.system.monetary.format)) {
        sheetData._monetaryTypes.push({ key, val: game.i18n.localize(COC7.monetaryTypes[key].name) })
      }
    }

    sheetData.manualCredit = this.actor.getActorFlag('manualCredit')
    if (!sheetData.manualCredit) {
      sheetData.monetary = {
        spendingLevel: CoCActor.monetaryFormat(sheetData.data.system.monetary.format, sheetData.data.system.monetary.symbol, this.actor.spendingLevel),
        assets: CoCActor.monetaryFormat(sheetData.data.system.monetary.format, sheetData.data.system.monetary.symbol, this.actor.assets),
        cash: CoCActor.monetaryFormat(sheetData.data.system.monetary.format, sheetData.data.system.monetary.symbol, this.actor.cash)
      }
    }

    sheetData.oneBlockBackStory = game.settings.get('CoC7', 'oneBlockBackstory')

    sheetData.summarized = this.summarized && !sheetData.permissionLimited
    sheetData.isSummarized = this.summarized
    sheetData.skillList = []
    let previousSpec = ''
    for (const skill of sheetData.skills) {
      if (sheetData.skillShowUncommon || !skill.system.properties.rarity) {
        if (skill.system.properties.special) {
          if (previousSpec !== skill.system.specialization) {
            previousSpec = skill.system.specialization
            sheetData.skillList.push({
              isSpecialization: true,
              name: skill.system.specialization
            })
          }
        }
        sheetData.skillList.push(skill)
      }
    }
    sheetData.skillsByValue = [...sheetData.skills].sort((a, b) => {
      return b.system.value - a.system.value
    })
    sheetData.topSkills = [...sheetData.skillsByValue].slice(0, 14)
    sheetData.skillsByValue = sheetData.skillsByValue.filter(
      skill => sheetData.skillShowUncommon || !skill.system.properties.rarity
    )
    sheetData.topWeapons = [...sheetData.meleeWpn, ...sheetData.rangeWpn]
      .sort((a, b) => {
        return a.system.skill.main?.value - b.system.skill.main?.value
      })
      .reverse()
      .slice(0, 3)
    sheetData.displayPlayerName = game.settings.get(
      'CoC7',
      'displayPlayerNameOnSheet'
    )
    if (sheetData.displayPlayerName && !sheetData.data.system.infos.playername) {
      const user = this.actor.characterUser
      if (user) {
        sheetData.data.system.infos.playername = user.name
      }
    }

    sheetData.skillListEmpty = sheetData.skills.length === 0

    sheetData.showInventoryItems =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'item') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryBooks =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'book') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventorySpells =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'spell') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryTalents =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'talent') ||
      (!sheetData.data.system.flags.locked && game.settings.get('CoC7', 'pulpRuleTalents'))
    sheetData.showInventoryStatuses =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'status') ||
      !sheetData.data.system.flags.locked
    sheetData.showInventoryArmor =
      Object.prototype.hasOwnProperty.call(sheetData.itemsByType, 'armor') ||
      !sheetData.data.system.flags.locked

    sheetData.hasInventory =
    sheetData.showInventoryItems ||
      sheetData.showInventoryBooks ||
      sheetData.showInventorySpells ||
      sheetData.showInventoryTalents ||
      sheetData.showInventoryStatuses ||
      sheetData.showInventoryWeapons ||
      sheetData.showInventoryArmor

    sheetData.enrichedBackstory = await TextEditor.enrichHTML(
      sheetData.data.system.backstory,
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

    return sheetData
  }

  _saveScrollPositions (html) {
    super._saveScrollPositions(html)
    const selectors = ['.right-panel .tab.development ol']
    this._scrollPositionsX = selectors.reduce((pos, sel) => {
      const el = html.find(sel)
      pos[sel] = Array.from(el).map(el => el.scrollLeft)
      return pos
    }, {})
  }

  _restoreScrollPositions (html) {
    super._restoreScrollPositions(html)
    const selectors = ['.right-panel .tab.development ol']
    const positions = this._scrollPositionsX || {}
    for (const sel of selectors) {
      const el = html.find(sel)
      el.each((i, el) => { el.scrollLeft = positions[sel]?.[i] || 0 })
    }
  }

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['coc7', 'sheetV2', 'actor', 'character'],
      template: 'systems/CoC7/templates/actors/character/index.html',
      width: 687,
      height: 623,
      resizable: true,
      dragDrop: [{ dragSelector: '.item', dropSelector: null }],
      scrollY: ['.right-panel .tab'],
      tabs: [
        {
          navSelector: '.sheet-nav',
          contentSelector: '.sheet-body',
          initial: 'skills'
        }
      ]
    })
  }

  activateListeners (html) {
    super.activateListeners(html)

    if (this.actor.isOwner) {
      // MODIF: 0.8.x owner deprecated  => isOwner
      html
        .find('.skill-name.rollable.flagged4dev')
        .click(async event => this._onSkillDev(event))
      html
        .find('.reset-occupation')
        .click(async () => await this.actor.resetOccupation())
      html
        .find('.reset-experience-package')
        .click(async () => await this.actor.resetExperiencePackage())
      html
        .find('.reset-archetype')
        .click(async () => await this.actor.resetArchetype())
      html.find('.open-item').click(event => this._onItemDetails(event))
      // html
      //   .find('[name="data.attribs.hp.value"]')
      //   .change(async event =>{
      //     event.preventDefault()
      //     event.stopPropagation()
      //     let value = Number( event.currentTarget?.value)
      //     if( !isNaN(value)) await this.actor.setHp(event)
      //     else ui.notifications.warn('Error parsing HP value')
      //   })
      html.find('.toggle-list-mode').click(event => {
        this.toggleSkillListMode(event)
      })
      html.find('.toggle-uncommon-mode').click(event => {
        this.toggleSkillUncommonMode(event)
      })
      if (game.user.isGM) {
        html
          .find('.sanity-loss-type-add')
          .click(this._onAddSanityLossReason.bind(this))
        html
          .find('.sanity-loss-type-delete')
          .click(this._onDeleteSanityLossReason.bind(this))
        html
          .find('.mythosEncountersTotalLoss')
          .blur(this._onEditSanityLossReason.bind(this))
        html
          .find('.toggle-keeper-flags')
          .click(this._onToggleKeeperFlags.bind(this))
        html.find('.add-monetary').click(this._onAddMonetary.bind(this))
        html.find('.remove-monetary').click(this._onRemoveMonetary.bind(this))
      }
    }
  }

  _onAddMonetary () {
    const values = this.actor.system.monetary.values ? foundry.utils.duplicate(this.actor.system.monetary.values) : []
    values.push({
      name: '',
      min: null,
      max: null,
      cashType: 0,
      cashValue: '',
      assetsType: 0,
      assetsValue: '',
      spendingType: 0,
      spendingValue: ''
    })
    this.actor.update({ 'system.monetary.values': values })
  }

  _onRemoveMonetary (event) {
    const a = event.currentTarget
    const div = a.closest('.item')
    const values = foundry.utils.duplicate(this.actor.system.monetary.values)
    values.splice(Number(div.dataset.index), 1)
    this.actor.update({ 'system.monetary.values': values })
  }

  _onToggleKeeperFlags (event) {
    event.preventDefault()
    switch (event.currentTarget.dataset.flag) {
      case 'mythosInsanityExperienced':
        this.actor.setFlag(
          'CoC7',
          'mythosInsanityExperienced',
          !this.actor.mythosInsanityExperienced
        )
        break
      case 'mythosHardened':
        this.actor.setFlag('CoC7', 'mythosHardened', !this.actor.mythosHardened)
        break
    }
  }

  async _onAddSanityLossReason (event) {
    event.preventDefault()
    new CoC7CreateMythosEncounter(
      {
        actor: this.actor,
        type: event.currentTarget.dataset.type
      },
      {}
    ).render(true)
  }

  async _onEditSanityLossReason (event) {
    const input = $(event.currentTarget)
    const offset = input.closest('.flexrow-coc7').data('offset')
    if (typeof this.actor.system.sanityLossEvents?.[offset]?.totalLoss !== 'undefined') {
      const sanityLossEvents = foundry.utils.duplicate(this.actor.system.sanityLossEvents)
      sanityLossEvents[offset].totalLoss = parseInt(input.val(), 10)
      this.actor.update({ 'system.sanityLossEvents': sanityLossEvents })
    }
  }

  _onDeleteSanityLossReason (event) {
    event.preventDefault()
    const offset = $(event.currentTarget)
      .closest('.flexrow-coc7')
      .data('offset')
    const sanityLossEvents = this.actor.system.sanityLossEvents ?? []
    sanityLossEvents.splice(offset, 1)
    sanityLossEvents.sort(function (left, right) {
      return left.type.localeCompare(right.type)
    })
    this.actor.update({ 'system.sanityLossEvents': sanityLossEvents })
  }

  async toggleSkillListMode (event) {
    await this.actor.setFlag(
      'CoC7',
      'skillListMode',
      !this.actor.getFlag('CoC7', 'skillListMode')
    )
    return await this.render(true)
  }

  async toggleSkillUncommonMode (event) {
    await this.actor.setFlag(
      'CoC7',
      'skillShowUncommon',
      !this.actor.getFlag('CoC7', 'skillShowUncommon')
    )
    return await this.render(true)
  }

  async _onSkillDev (event) {
    event.preventDefault()
    const skillId = event.currentTarget.closest('.item').dataset.itemId
    await this.actor.developSkill(skillId, event.shiftKey)
  }

  _onItemDetails (event) {
    event.preventDefault()
    const type = event.currentTarget.dataset.type
    const item = this.actor[type]
    if (item) item.sheet.render(true)
  }

  _updateObject (event, formData) {
    const system = foundry.utils.expandObject(formData)?.system
    if (system.monetary?.values) {
      formData['system.monetary.values'] = Object.values(system.monetary.values || [])
    }
    super._updateObject(event, formData)
  }

  static renderSheet (sheet, html) {
    if (game.settings.get('CoC7', 'overrideSheetArtwork')) {
      if (game.settings.get('CoC7', 'artWorkSheetBackground')) {
        if (
          game.settings.get('CoC7', 'artWorkSheetBackground').toLowerCase() ===
          'null'
        ) {
          sheet.element.css(
            '--main-sheet-bg',
            "url( './assets/images/void.webp')"
          )
        } else {
          sheet.element.css(
            '--main-sheet-bg',
            game.settings.get('CoC7', 'artWorkSheetBackground')
          )
          // const borderImage = sheet.element.find('form').css('border-image');
          // sheet.element.find('form').css('border-image', '');
          if (
            game.settings.get('CoC7', 'artWorkSheetBackgroundType') !== 'slice'
          ) {
            let styleSheet, cssRuleIndex
            for (let i = 0; i < document.styleSheets.length; i++) {
              if (document.styleSheets[i].href?.endsWith('coc7g.css')) {
                styleSheet = document.styleSheets[i]
                break
              }
            }

            if (styleSheet) {
              for (let i = 0; i < styleSheet.rules.length; i++) {
                if (
                  styleSheet.rules[i].selectorText === '.sheetV2.character form'
                ) {
                  cssRuleIndex = i
                  break
                }
              }
            }
            if (cssRuleIndex) {
              const CSSStyle = styleSheet.rules[cssRuleIndex].style
              CSSStyle.removeProperty('border-image')
              CSSStyle.setProperty(
                'background',
                game.settings.get('CoC7', 'artWorkSheetBackground')
              )
              switch (game.settings.get('CoC7', 'artWorkSheetBackgroundType')) {
                case 'auto':
                  CSSStyle.setProperty('background-size', 'auto')
                  break
                case 'contain':
                  CSSStyle.setProperty('background-size', 'contain')
                  break
                case 'cover':
                  CSSStyle.setProperty('background-size', 'cover')
                  break
                default:
                  CSSStyle.setProperty('background-size', 'auto')
                  break
              }
            }
          }
        }
      }

      if (game.settings.get('CoC7', 'artWorkOtherSheetBackground')) {
        if (
          game.settings
            .get('CoC7', 'artWorkOtherSheetBackground')
            .toLowerCase() === 'null'
        ) {
          sheet.element.css(
            '--other-sheet-bg',
            "url( './assets/images/void.webp')"
          )
        } else {
          sheet.element.css(
            '--other-sheet-bg',
            game.settings.get('CoC7', 'artWorkOtherSheetBackground')
          )
        }
      }

      if (game.settings.get('CoC7', 'artworkSheetImage')) {
        if (
          game.settings.get('CoC7', 'artworkSheetImage').toLowerCase() ===
          'null'
        ) {
          sheet.element.css(
            '--main-sheet-image',
            "url( './assets/images/void.webp')"
          )
        } else {
          sheet.element.css(
            '--main-sheet-image',
            game.settings.get('CoC7', 'artworkSheetImage')
          )
        }
      }

      if (game.settings.get('CoC7', 'artworkFrontColor')) {
        sheet.element.css(
          '--main-sheet-front-color',
          game.settings.get('CoC7', 'artworkFrontColor')
        )
      }
      if (game.settings.get('CoC7', 'artworkBackgroundColor')) {
        sheet.element.css(
          '--main-sheet-back-color',
          game.settings.get('CoC7', 'artworkBackgroundColor')
        )
      }
      if (game.settings.get('CoC7', 'artworkInteractiveColor')) {
        sheet.element.css(
          '--main-sheet-interactive-color',
          game.settings.get('CoC7', 'artworkInteractiveColor')
        )
      }
      if (!game.settings.get('CoC7', 'artworkFixedSkillLength')) {
        sheet.element.css('--skill-length', 'auto')
        sheet.element.css('--skill-specialization-length', 'auto')
      }

      if (game.settings.get('CoC7', 'artworkMainFont')) {
        const customSheetFont = new FontFace(
          'customSheetFont',
          game.settings.get('CoC7', 'artworkMainFont')
        )
        customSheetFont
          .load()
          .then(function (loadedFace) {
            document.fonts.add(loadedFace)
          })
          .catch(function (error) {
            ui.notifications.error(error)
          })
      }

      if (game.settings.get('CoC7', 'artworkMainFontBold')) {
        const customSheetCursiveFont = new FontFace(
          'customSheetFont',
          game.settings.get('CoC7', 'artworkMainFontBold'),
          { weight: 'bold' }
        )
        customSheetCursiveFont
          .load()
          .then(function (loadedFace) {
            document.fonts.add(loadedFace)
          })
          .catch(function (error) {
            ui.notifications.error(error)
          })
      }

      if (game.settings.get('CoC7', 'artworkMainFontSize')) {
        const size = `${game.settings.get('CoC7', 'artworkMainFontSize')}px`
        if (size !== $(':root').css('font-size')) {
          $(':root').css('font-size', size)
        }
      }
    }

    if (typeof sheet.actor?.system.pannel !== 'undefined') {
      for (const [key, value] of Object.entries(sheet.actor.system.pannel)) {
        const pannelClass = chatHelper.camelCaseToHyphen(key)
        const pannel = html.find(`.pannel.${pannelClass}`)
        if (value.expanded) pannel.addClass('expanded')
        else pannel.removeClass('expanded')
      }
    }
  }
}
