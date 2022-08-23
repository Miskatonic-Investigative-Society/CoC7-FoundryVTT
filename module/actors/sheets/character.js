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
    const data = await super.getData()
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
    data.skillListModeValue =
      this.actor.getFlag('CoC7', 'skillListMode') ?? false
    data.skillShowUncommon =
      this.actor.getFlag('CoC7', 'skillShowUncommon') ?? true
    data.showIconsOnly = game.settings.get('CoC7', 'showIconsOnly')

    if (this.actor.occupation) {
      data.data.infos.occupation = this.actor.occupation.name
      data.data.infos.occupationSet = true
    } else data.data.infos.occupationSet = false

    if (this.actor.archetype) {
      data.data.infos.archetype = this.actor.archetype.name
      data.data.infos.archetypeSet = true
    } else data.data.infos.archetypeSet = false

    data.totalExperience = this.actor.experiencePoints
    data.totalOccupation = this.actor.occupationPointsSpent
    data.invalidOccupationPoints =
      Number(this.actor.occupationPointsSpent) !==
      Number(this.actor.data.data.development?.occupation)
    data.totalArchetype = this.actor.archetypePointsSpent
    data.invalidArchetypePoints =
      Number(this.actor.archetypePointsSpent) !==
      Number(this.actor.data.data.development?.archetype)
    data.totalPersonal = this.actor.personalPointsSpent
    data.invalidPersonalPoints =
      Number(this.actor.personalPointsSpent) !==
      Number(this.actor.data.data.development?.personal)
    data.creditRatingMax = Number(
      this.actor.occupation?.data.data.creditRating.max
    )
    data.creditRatingMin = Number(
      this.actor.occupation?.data.data.creditRating.min
    )
    data.invalidCreditRating =
      this.actor.creditRatingSkill?.data.data.adjustments?.occupation >
        data.creditRatingMax ||
      this.actor.creditRatingSkill?.data.data.adjustments?.occupation <
        data.creditRatingMin
    data.pulpTalentCount = data.itemsByType.talent?.length
      ? data.itemsByType.talent?.length
      : 0
    data.minPulpTalents = this.actor.archetype?.data.data.talents
      ? this.actor.archetype?.data.data.talents
      : 0
    data.invalidPulpTalents = data.pulpTalentCount < data.minPulpTalents

    data.hasDevelopmentPhase = this.actor.hasDevelopmentPhase

    data.allowDevelopment = game.settings.get('CoC7', 'developmentEnabled')
    data.allowCharCreation = game.settings.get('CoC7', 'charCreationEnabled')
    data.developmentRollForLuck = game.settings.get(
      'CoC7',
      'developmentRollForLuck'
    )
    data.showDevPannel = data.allowDevelopment || data.allowCharCreation

    data.manualCredit = this.actor.getActorFlag('manualCredit')
    if (!data.manualCredit) {
      data.credit = {}
      let factor
      let monetarySymbol
      if (!data.data.credit) {
        factor = 1
        monetarySymbol = '$'
      } else {
        factor = parseInt(data.data.credit.multiplier)
          ? parseInt(data.data.credit.multiplier)
          : 1
        monetarySymbol = data.data.credit.monetarySymbol
          ? data.data.credit.monetarySymbol
          : '$'
      }

      data.credit.spendingLevel = `${monetarySymbol}${this.actor.spendingLevel *
        factor}`
      data.credit.assets = `${monetarySymbol}${this.actor.assets * factor}`
      data.credit.cash = `${monetarySymbol}${this.actor.cash * factor}`
    }

    data.oneBlockBackStory = game.settings.get('CoC7', 'oneBlockBackstory')

    data.summarized = this.summarized && !data.permissionLimited
    data.skillList = []
    let previousSpec = ''
    for (const skill of data.skills) {
      if (data.skillShowUncommon || !skill.data.properties.rarity) {
        if (skill.data.properties.special) {
          if (previousSpec !== skill.data.specialization) {
            previousSpec = skill.data.specialization
            data.skillList.push({
              isSpecialization: true,
              name: skill.data.specialization
            })
          }
        }
        data.skillList.push(skill)
      }
    }
    data.skillsByValue = [...data.skills].sort((a, b) => {
      return b.data.value - a.data.value
    })
    data.topSkills = [...data.skillsByValue].slice(0, 14)
    data.skillsByValue = data.skillsByValue.filter(
      skill => data.skillShowUncommon || !skill.data.properties.rarity
    )
    data.topWeapons = [...data.meleeWpn, ...data.rangeWpn]
      .sort((a, b) => {
        return a.data.skill.main?.value - b.data.skill.main?.value
      })
      .reverse()
      .slice(0, 3)
    data.displayPlayerName = game.settings.get(
      'CoC7',
      'displayPlayerNameOnSheet'
    )
    if (data.displayPlayerName && !data.data.infos.playername) {
      const user = this.actor.characterUser
      if (user) {
        data.data.infos.playername = user.name
      }
    }

    data.skillListEmpty = data.skills.length === 0

    data.showInventoryItems =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'item') ||
      !data.data.flags.locked
    data.showInventoryBooks =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'book') ||
      !data.data.flags.locked
    data.showInventorySpells =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'spell') ||
      !data.data.flags.locked
    data.showInventoryTalents =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'talent') ||
      (!data.data.flags.locked && game.settings.get('CoC7', 'pulpRuleTalents'))
    data.showInventoryStatuses =
      Object.prototype.hasOwnProperty.call(data.itemsByType, 'status') ||
      !data.data.flags.locked

    data.hasInventory =
      data.showInventoryItems ||
      data.showInventoryBooks ||
      data.showInventorySpells ||
      data.showInventoryTalents ||
      data.showInventoryStatuses ||
      data.showInventoryWeapons

    return data
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
    const sanityLossEvents = this.actor.data.data.sanityLossEvents ?? []
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

    if (typeof sheet.actor?.data.data.pannel !== 'undefined') {
      for (const [key, value] of Object.entries(sheet.actor.data.data.pannel)) {
        const pannelClass = chatHelper.camelCaseToHyphen(key)
        const pannel = html.find(`.pannel.${pannelClass}`)
        if (pannel.length > 1) {
          if (value.expanded) pannel.addClass('expanded')
          else pannel.removeClass('expanded')
        }
      }
    }
  }
}
