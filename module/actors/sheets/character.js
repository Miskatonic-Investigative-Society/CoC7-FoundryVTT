/* global $, FontFace, game, mergeObject, ui */
import { CoC7ActorSheet } from './base.js'
import { CoC7CreateMythosEncounter } from '../../apps/create-mythos-encounters.js'
import { chatHelper } from '../../chat/helper.js'

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
        }
      ].concat(buttons)
      return buttons
    }
    return super._getHeaderButtons()
  }

  async toggleSheetMode (event) {
    this.summarized = !this.summarized
    await this.close()
    const options = this.summarized
      ? {
          classes: ['coc7', 'actor', 'character', 'summarized'],
          height: 200,
          resizable: false,
          width: 700
        }
      : CoC7CharacterSheet.defaultOptions
    await this.render(true, options)
  }

  async getData () {
    const actor = await super.getData()
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
    actor.skillListModeValue =
      this.actor.getFlag('CoC7', 'skillListMode') ?? false
    actor.skillShowUncommon =
      this.actor.getFlag('CoC7', 'skillShowUncommon') ?? true
    actor.showIconsOnly = game.settings.get('CoC7', 'showIconsOnly')

    if (this.actor.occupation) {
      actor.data.system.infos.occupation = this.actor.occupation.name
      actor.data.system.infos.occupationSet = true
    } else actor.data.system.infos.occupationSet = false

    if (this.actor.archetype) {
      actor.data.system.infos.archetype = this.actor.archetype.name
      actor.data.system.infos.archetypeSet = true
    } else actor.data.system.infos.archetypeSet = false

    actor.totalExperience = this.actor.experiencePoints
    actor.totalOccupation = this.actor.occupationPointsSpent
    actor.invalidOccupationPoints =
      Number(this.actor.occupationPointsSpent) !==
      Number(this.actor.system.development?.occupation)
    actor.totalArchetype = this.actor.archetypePointsSpent
    actor.invalidArchetypePoints =
      Number(this.actor.archetypePointsSpent) !==
      Number(this.actor.system.development?.archetype)
    actor.totalPersonal = this.actor.personalPointsSpent
    actor.invalidPersonalPoints =
      Number(this.actor.personalPointsSpent) !==
      Number(this.actor.system.development?.personal)
    actor.creditRatingMax = Number(
      this.actor.occupation?.system.creditRating.max
    )
    actor.creditRatingMin = Number(
      this.actor.occupation?.system.creditRating.min
    )
    actor.invalidCreditRating =
      this.actor.creditRatingSkill?.system.adjustments?.occupation >
      actor.creditRatingMax ||
      this.actor.creditRatingSkill?.system.adjustments?.occupation <
      actor.creditRatingMin
    actor.pulpTalentCount = actor.itemsByType.talent?.length
      ? actor.itemsByType.talent?.length
      : 0
    actor.minPulpTalents = this.actor.archetype?.system.talents
      ? this.actor.archetype?.system.talents
      : 0
    actor.invalidPulpTalents = actor.pulpTalentCount < actor.minPulpTalents

    actor.hasDevelopmentPhase = this.actor.hasDevelopmentPhase

    actor.allowDevelopment = game.settings.get('CoC7', 'developmentEnabled')
    actor.allowCharCreation = game.settings.get('CoC7', 'charCreationEnabled')
    actor.developmentRollForLuck = game.settings.get(
      'CoC7',
      'developmentRollForLuck'
    )
    actor.showDevPannel = actor.allowDevelopment || actor.allowCharCreation

    actor.manualCredit = this.actor.getActorFlag('manualCredit')
    if (!actor.manualCredit) {
      actor.credit = {}
      let factor
      let monetarySymbol
      if (!actor.data.credit) {
        factor = 1
        monetarySymbol = '$'
      } else {
        factor = parseInt(actor.data.credit.multiplier)
          ? parseInt(actor.data.credit.multiplier)
          : 1
        monetarySymbol = actor.data.credit.monetarySymbol
          ? actor.data.credit.monetarySymbol
          : '$'
      }

      actor.credit.spendingLevel = `${monetarySymbol}${this.actor.spendingLevel * factor}`
      actor.credit.assets = `${monetarySymbol}${this.actor.assets * factor}`
      actor.credit.cash = `${monetarySymbol}${this.actor.cash * factor}`
    }

    actor.oneBlockBackStory = game.settings.get('CoC7', 'oneBlockBackstory')

    actor.summarized = this.summarized && !actor.permissionLimited
    actor.skillList = []
    let previousSpec = ''
    for (const skill of actor.skills) {
      if (actor.skillShowUncommon || !skill.data.properties.rarity) {
        if (skill.system.properties.special) {
          if (previousSpec !== skill.system.specialization) {
            previousSpec = skill.system.specialization
            actor.skillList.push({
              isSpecialization: true,
              name: skill.system.specialization
            })
          }
        }
        actor.skillList.push(skill)
      }
    }
    actor.skillsByValue = [...actor.skills].sort((a, b) => {
      return b.system.value - a.system.value
    })
    actor.topSkills = [...actor.skillsByValue].slice(0, 14)
    actor.skillsByValue = actor.skillsByValue.filter(
      skill => actor.skillShowUncommon || !skill.system.properties.rarity
    )
    actor.topWeapons = [...actor.meleeWpn, ...actor.rangeWpn]
      .sort((a, b) => {
        return a.system.skill.main?.value - b.system.skill.main?.value
      })
      .reverse()
      .slice(0, 3)
    actor.displayPlayerName = game.settings.get(
      'CoC7',
      'displayPlayerNameOnSheet'
    )
    if (actor.displayPlayerName && !actor.data.infos.playername) {
      const user = this.actor.characterUser
      if (user) {
        actor.data.infos.playername = user.name
      }
    }

    actor.skillListEmpty = actor.skills.length === 0

    actor.showInventoryItems =
      Object.prototype.hasOwnProperty.call(actor.itemsByType, 'item') ||
      !actor.data.flags.locked
    actor.showInventoryBooks =
      Object.prototype.hasOwnProperty.call(actor.itemsByType, 'book') ||
      !actor.data.flags.locked
    actor.showInventorySpells =
      Object.prototype.hasOwnProperty.call(actor.itemsByType, 'spell') ||
      !actor.data.flags.locked
    actor.showInventoryTalents =
      Object.prototype.hasOwnProperty.call(actor.itemsByType, 'talent') ||
      (!actor.data.flags.locked && game.settings.get('CoC7', 'pulpRuleTalents'))
    actor.showInventoryStatuses =
      Object.prototype.hasOwnProperty.call(actor.itemsByType, 'status') ||
      !actor.data.flags.locked

    actor.hasInventory =
      actor.showInventoryItems ||
      actor.showInventoryBooks ||
      actor.showInventorySpells ||
      actor.showInventoryTalents ||
      actor.showInventoryStatuses ||
      actor.showInventoryWeapons

    return actor
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
    return mergeObject(super.defaultOptions, {
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
          .find('.toggle-keeper-flags')
          .click(this._onToggleKeeperFlags.bind(this))
      }
    }
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

  _onDeleteSanityLossReason (event) {
    event.preventDefault()
    const offset = $(event.currentTarget)
      .closest('.flexrow')
      .data('offset')
    const sanityLossEvents = this.actor.system.sanityLossEvents ?? []
    sanityLossEvents.splice(offset, 1)
    sanityLossEvents.sort(function (left, right) {
      return left.type.localeCompare(right.type)
    })
    this.actor.update({ 'data.sanityLossEvents': sanityLossEvents })
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
