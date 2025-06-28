/* global $, ChatMessage, CONST, Dialog, FormData, foundry, game, Hooks, Roll, TextEditor, ui */
import { addCoCIDSheetHeaderButton } from '../../scripts/coc-id-button.js'
import { RollDialog } from '../../apps/roll-dialog.js'
import { CoC7ChatMessage } from '../../apps/coc7-chat-message.js'
import { CoC7Check } from '../../check.js'
import { CoC7ContentLinkDialog } from '../../apps/coc7-content-link-dialog.js'
import { COC7 } from '../../config.js'
import { CoCActor } from '../../actors/actor.js'
import { CoC7Item } from '../../items/item.js'
import { CoC7MeleeInitiator } from '../../chat/combat/melee-initiator.js'
import { CoC7RangeInitiator } from '../../chat/rangecombat.js'
import { CoC7ConCheck } from '../../chat/concheck.js'
import { chatHelper, isCtrlKey } from '../../chat/helper.js'
import { CoC7Link } from '../../apps/coc7-link.js'
import { DamageCard } from '../../chat/cards/damage.js'
import CoC7ActiveEffect from '../../active-effect.js'
import { CoC7ContextMenu } from '../../context-menu.js'
import { CoC7Utilities } from '../../utilities.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7ActorSheet extends foundry.appv1.sheets.ActorSheet {
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addCoCIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  async getData () {
    const sheetData = await super.getData()

    sheetData.showHiddenDevMenu = game.settings.get('CoC7', 'hiddendevmenu')

    sheetData.canDragToken = !!this.token && game.user.isGM
    sheetData.linkedActor = this.actor.prototypeToken?.actorLink === true
    sheetData.isToken = this.actor.isToken
    sheetData.itemsByType = {}
    sheetData.skills = {}
    sheetData.combatSkills = {}
    sheetData.weapons = {}
    sheetData.rangeWpn = []
    sheetData.meleeWpn = []
    sheetData.actorFlags = {}

    sheetData.effects =
      this.actor.type === 'character'
        ? CoC7ActiveEffect.prepareActiveEffectCategories(this.actor.effects)
        : CoC7ActiveEffect.prepareNPCActiveEffectCategories(this.actor.effects)

    sheetData.permissionLimited = !game.user.isGM && (this.actor.ownership[game.user.id] ?? this.actor.ownership.default) === CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED

    sheetData.isKeeper = game.user.isGM
    sheetData.allowUnlock =
      game.settings.get('CoC7', 'playerUnlockSheetMode') === 'always' ||
      game.user.isGM ||
      (game.settings.get('CoC7', 'playerUnlockSheetMode') === 'creation' &&
        game.settings.get('CoC7', 'charCreationEnabled'))
    if (
      game.settings.get('CoC7', 'playerUnlockSheetMode') === 'creation' &&
      game.settings.get('CoC7', 'charCreationEnabled')
    ) {
      sheetData.data.system.flags.locked = false
    }

    if (this.actor.type !== 'vehicle') {
      if (!sheetData.data.system.characteristics) {
        sheetData.data.system.characteristics = {
          str: {
            value: null,
            short: 'CHARAC.STR',
            label: 'CHARAC.Strength',
            formula: null
          },
          con: {
            value: null,
            short: 'CHARAC.CON',
            label: 'CHARAC.Constitution',
            formula: null
          },
          siz: {
            value: null,
            short: 'CHARAC.SIZ',
            label: 'CHARAC.Size',
            formula: null
          },
          dex: {
            value: null,
            short: 'CHARAC.DEX',
            label: 'CHARAC.Dexterity',
            formula: null
          },
          app: {
            value: null,
            short: 'CHARAC.APP',
            label: 'CHARAC.Appearance',
            formula: null
          },
          int: {
            value: null,
            short: 'CHARAC.INT',
            label: 'CHARAC.Intelligence',
            formula: null
          },
          pow: {
            value: null,
            short: 'CHARAC.POW',
            label: 'CHARAC.Power',
            formula: null
          },
          edu: {
            value: null,
            short: 'CHARAC.EDU',
            label: 'CHARAC.Education',
            formula: null
          }
        }
      }

      if (!sheetData.data.system.attribs) {
        sheetData.data.system.attribs = {
          hp: {
            value: null,
            max: null,
            short: 'HP',
            label: 'Hit points',
            auto: true
          },
          mp: {
            value: null,
            max: null,
            short: 'HP',
            label: 'Magic points',
            auto: true
          },
          lck: { value: null, short: 'LCK', label: 'Luck' },
          san: {
            value: null,
            max: 99,
            short: 'SAN',
            label: 'Sanity',
            auto: true
          },
          mov: {
            value: null,
            short: 'MOV',
            label: 'Movement rate',
            auto: true
          },
          db: {
            value: null,
            short: 'DB',
            label: 'Damage bonus',
            auto: true
          },
          build: {
            value: null,
            short: 'BLD',
            label: 'Build',
            auto: true
          },
          armor: { value: null, auto: false }
        }
      }

      if (!sheetData.data.system.biography) {
        sheetData.data.system.biography = {
          personalDescription: { type: 'string', value: '' }
        }
      }

      if (!sheetData.data.system.infos) {
        sheetData.data.system.infos = {
          occupation: '',
          age: '',
          sex: '',
          residence: '',
          birthplace: '',
          archetype: '',
          organization: '',
          playername: ''
        }
      }

      if (!sheetData.data.system.flags) {
        sheetData.data.system.flags = { locked: true, manualCredit: false }
      }

      if (!sheetData.data.system.credit) {
        sheetData.data.system.credit = {
          monetarySymbol: null,
          multiplier: null,
          spent: null,
          assetsDetails: null
        }
      }

      if (!sheetData.data.system.development) {
        sheetData.data.system.development = {
          personal: null,
          occupation: null,
          archetype: null,
          experiencePackage: null
        }
      }

      if (!sheetData.data.system.biography) sheetData.data.system.biography = []

      sheetData.pulpRuleArchetype = game.settings.get('CoC7', 'pulpRuleArchetype')
      sheetData.pulpRuleOrganization = game.settings.get(
        'CoC7',
        'pulpRuleOrganization'
      )
      if (!sheetData.pulpRuleArchetype) {
        if (this.actor.experiencePackage) {
          const doc = this.actor.experiencePackage
          sheetData.hasExperiencePackage = true
          sheetData.nameExperiencePackage = doc.name
        }
      }
    }

    sheetData.isDead = this.actor.dead
    sheetData.isDying = this.actor.dying

    if (sheetData.items) {
      for (const item of sheetData.items) {
        // si c'est une formule et qu'on peut l'evaluer
        // ce bloc devrait etre déplacé dans le bloc _updateFormData
        if (item.type === 'skill') {
          if (item.system.properties.special) {
            if (item.system.properties.fighting) {
              item.system.specialization = game.i18n.localize(
                'CoC7.FightingSpecializationName'
              )
            }
            if (item.system.properties.firearm) {
              item.system.specialization = game.i18n.localize(
                'CoC7.FirearmSpecializationName'
              )
            }
            if (item.system.properties.ranged) {
              item.system.specialization = game.i18n.localize(
                'CoC7.RangedSpecializationName'
              )
            }
          }

          if (this.actor.type !== 'character') {
            if (isNaN(Number(item.system.value))) {
              let value = null
              const parsed = {}
              for (const [key, value] of Object.entries(
                COC7.formula.actorsheet
              )) {
                if (key.startsWith('@') && value.startsWith('this.')) {
                  parsed[key.substring(1)] = foundry.utils.getProperty(
                    this,
                    value.substring(5)
                  )
                }
              }
              try {
                value = (
                  await new Roll(item.system.value, parsed).evaluate({
                    async: true
                  })
                ).total
              } catch (err) {
                console.warn(
                  game.i18n.format('CoC7.ErrorUnableToParseSkillFormula', {
                    value: item.system.value,
                    name: item.name
                  })
                )
                value = null
              }

              if (value) {
                item.system.value = value
                const itemToUpdate = this.actor.items.get(item._id)
                console.info(
                  `[COC7] (Actor:${this.name}) Evaluating skill ${item.name}:${item.system.value} to ${value}`
                )
                await itemToUpdate.update({
                  'system.value': value
                })
              }
            }

            const skill = this.actor.items.get(item._id)
            const { base, rawValue, value } = skill.system

            // Assume fallback values, useful for initial setup of skills
            item.system.rawValue = rawValue || value || base
            item.system.value = value || base
          } else {
            const skill = this.actor.items.get(item._id)
            item.system.base = await skill.asyncBase()

            if (item.system.value) {
              // This should be part of migration or done at init !
              // Was done when skill value was changed to base + adjustement
              const exp = item.system.adjustments?.experience
                ? parseInt(item.system.adjustments.experience)
                : 0
              let updatedExp = exp + parseInt(item.system.value) - skill.value
              if (updatedExp <= 0) updatedExp = null
              console.info(
                `[COC7] Updating skill ${skill.name} experience. Experience missing: ${updatedExp}`
              )
              await this.actor.updateEmbeddedDocuments('Item', [
                {
                  _id: item._id,
                  'system.adjustments.experience': updatedExp,
                  'system.value': null
                }
              ])
              if (!item.system.adjustments) item.system.adjustments = {}
              item.system.adjustments.experience = updatedExp
              item.system.rawValue = skill.rawValue
              item.system.value = skill.value // ACTIVE_EFFECT necessary to apply effects
            } else {
              item.system.value = skill.value // ACTIVE_EFFECT necessary to apply effects
              item.system.rawValue = skill.rawValue
            }
          }
        }

        let list = sheetData.itemsByType[item.type]
        if (!list) {
          list = []
          sheetData.itemsByType[item.type] = list
        }
        list.push(item)
      }

      for (const itemType in sheetData.itemsByType) {
        sheetData.itemsByType[itemType].sort(CoC7Utilities.sortByNameKey)
      }

      // redondant avec matrice itembytype
      sheetData.skills = sheetData.items
        .filter(item => item.type === 'skill')
        .sort(CoC7Utilities.sortByNameKey)

      sheetData.meleeSkills = sheetData.skills.filter(
        skill =>
          skill.system.properties.combat === true &&
          skill.system.properties.fighting === true
      )
      sheetData.rangeSkills = sheetData.skills.filter(
        skill =>
          skill.system.properties.combat === true &&
          (skill.system.properties.firearm === true || skill.system.properties.ranged === true)
      )

      const cbtSkills = sheetData.skills.filter(
        skill => skill.system.properties.combat === true
      )
      if (cbtSkills) {
        for (const skill of cbtSkills) {
          sheetData.combatSkills[skill._id] = skill
        }
      }

      const weapons = sheetData.itemsByType.weapon

      if (weapons) {
        for (const weapon of weapons) {
          weapon.usesAlternateSkill =
            weapon.system.properties.auto === true ||
            weapon.system.properties.brst === true
          if (!weapon.system.ammo) weapon.system.ammo = 0

          weapon.skillSet = true
          // weapon.system.skill.main.name = '';
          // weapon.system.skill.main.value = 0;
          // weapon.system.skill.alternativ.name = '';
          // weapon.system.skill.alternativ.value = 0;
          if (weapon.system.skill.main.id === '') {
            // TODO : si l'ID n'ests pas définie mais qu'un nom a été donné, utiliser ce nom et tanter de retrouver le skill
            weapon.skillSet = false
          } else {
            // TODO : avant d'assiger le skill vérifier qu'il existe toujours.
            // si il n'existe plus il faut le retrouver ou passer skillset a false.
            const skill = this.actor.items.get(weapon.system.skill.main.id)
            if (skill) {
              weapon.system.skill.main.name = skill.system.skillName
              weapon.system.skill.main.value = skill.value
            } else {
              weapon.skillSet = false
            }

            if (weapon.system.skill.alternativ.id !== '') {
              const skill = this.actor.items.get(weapon.system.skill.alternativ.id)
              if (skill) {
                weapon.system.skill.alternativ.name = skill.system.skillName
                weapon.system.skill.alternativ.value = skill.value
              }
            }
          }

          weapon.system._properties = []
          for (const [key, value] of Object.entries(COC7.weaponProperties)) {
            const property = {}
            property.id = key
            property.name = value
            property.value = weapon.system.properties[key] === true
            weapon.system._properties.push(property)
          }

          sheetData.weapons[weapon._id] = weapon
          if (weapon.system.properties.rngd) sheetData.rangeWpn.push(weapon)
          else sheetData.meleeWpn.push(weapon)
        }
      }

      const token = this.token
      sheetData.tokenId = token
        ? `${token.parent?.id ? token.parent.id : 'TOKEN'}.${token.id}`
        : null // REFACTORING (2)

      sheetData.hasEmptyValueWithFormula = false
      if (sheetData.data.system.characteristics) {
        for (const characteristic of Object.values(sheetData.data.system.characteristics)) {
          if (!characteristic.value) characteristic.editable = true
          characteristic.hard = Math.floor(characteristic.value / 2)
          characteristic.extreme = Math.floor(characteristic.value / 5)

          // If no value && no formula don't display charac.
          if (!characteristic.value && !characteristic.formula) {
            characteristic.display = false
          } else {
            characteristic.display = true
          }

          // if any characteristic has no value but has a formula.
          if (!characteristic.value && characteristic.formula) {
            characteristic.hasEmptyValueWithFormula = true
          }

          sheetData.hasEmptyValueWithFormula =
            sheetData.hasEmptyValueWithFormula ||
            characteristic.hasEmptyValueWithFormula
        }
      }
    }

    // For compat with previous characters test if auto is definied, if not we define it
    if (!['vehicle', 'container'].includes(this.actor.type)) {
      const auto = this.actor.checkUndefinedAuto()
      sheetData.data.system = foundry.utils.mergeObject(sheetData.data.system, auto)
    } else {
      sheetData.data.system.attribs.hp.auto = false
      sheetData.data.system.attribs.mp.auto = false
      sheetData.data.system.attribs.san.auto = false
      sheetData.data.system.attribs.mov.auto = false
      sheetData.data.system.attribs.db.auto = false
      sheetData.data.system.attribs.build.auto = false
    }

    if (sheetData.data.system.attribs.mp.value < 0) sheetData.data.system.attribs.mp.value = null
    if (sheetData.data.system.attribs.san.value < 0) sheetData.data.system.attribs.san.value = null

    if (!['vehicle'].includes(this.actor.type)) {
      if (sheetData.data.system.biography instanceof Array && sheetData.data.system.biography.length) {
        sheetData.data.system.biography[0].isFirst = true
        sheetData.data.system.biography[sheetData.data.system.biography.length - 1].isLast = true
      }
    }
    sheetData.showInventoryItems = false
    sheetData.showInventoryBooks = false
    sheetData.showInventorySpells = false
    sheetData.showInventoryTalents = false
    sheetData.showInventoryStatuses = false
    sheetData.showInventoryWeapons = false
    sheetData.showInventoryArmor = false

    sheetData.hasConditions =
      this.actor.effects.size > 0 ||
      (typeof this.actor.system.conditions !== 'undefined' &&
        Object.keys(this.actor.system.conditions).filter(
          condition => this.actor.system.conditions[condition].value
        ).length > 0)

    return sheetData
  }

  /* -------------------------------------------- */
  // static parseFormula (formula) {
  //   let parsedFormula = formula
  //   for (const [key, value] of Object.entries(COC7.formula.actorsheet)) {
  //     parsedFormula = parsedFormula.replace(key, value)
  //   }
  //   return parsedFormula
  // }

  get tokenKey () {
    ui.notifications.error('DEPRECATED SHOULD NOT HAPPEN!')
    throw new Error('base.js get tokenKey(): DEPRECATED SHOULD NOT HAPPEN!')
    // if( this.token) return `${this.token.scene?._id?this.token.scene._id:'TOKEN'}.${this.token.data._id}`;  //REFACTORING (2)
    // return this.actor.id;
  }

  onCloseSheet () {
    // this.actor.locked = true;
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)

    html.find('.section-header').click(this._onSectionHeader.bind(this))
    html.find('.items-header').click(this._onItemHeader.bind(this))
    html.find('.inventory-header').click(this._onInventoryHeader.bind(this))
    html.find('.read-only').dblclick(this._toggleReadOnly.bind(this))
    html.find('.add-ammo').click(this._onAddAmo.bind(this))
    html.find('.reload-weapon').click(event => this._onReloadWeapon(event))
    html.find('.reload-weapon').on('contextmenu', event => this._onReloadWeapon(event))

    // Owner Only Listeners
    if (this.actor.isOwner && !(this.actor.compendium?.locked ?? false)) {
      html.find('.lock').click(this._onLockClicked.bind(this))
      html.find('.flag').click(this._onFlagClicked.bind(this))
      html.find('.formula').click(this._onFormulaClicked.bind(this))
      html.find('.auto-toggle').click(this._onAutoToggle.bind(this))
    }

    // Owner Only, not available from compendium
    /* // FoundryVTT V13 */
    if (this.actor.isOwner && (this.actor.compendium === null || typeof this.actor.compendium === 'undefined')) {
      if (game.settings.get('CoC7', 'useContextMenus')) {
        if (!this.menus) this.menus = []

        const rollMenu = {
          id: 'skill-roll',
          classes: 'roll-menu',
          section: [
            {
              classes: 'main',
              items: [
                { action: 'roll', label: 'Roll' },
                { action: 'opposed-roll', label: 'Opposed roll' },
                { action: 'combined-roll', label: 'Combined roll' }
              ]
            },
            {
              classes: 'keeper',
              visibility: 'gm',
              items: [
                {
                  label: { icon: 'fas fa-link', text: 'Link' },
                  subMenu: {
                    items: [
                      { action: 'link-tool', label: 'Open in link tool' },
                      { action: 'send-chat', label: 'Send to chat' },
                      { action: 'copy-to-clipboard', label: 'Copy to clip-board' }
                    ]
                  }
                },
                { action: 'request-roll', label: 'Request roll' }
              ]
            }
          ]
        }

        const sanMenu = {
          id: 'san-roll',
          classes: 'roll-menu',
          section: [
            {
              classes: 'main',
              items: [
                { action: 'encounter', label: 'Encounter' },
                { action: 'roll', label: 'Roll' },
                { action: 'opposed-roll', label: 'Opposed roll' },
                { action: 'combined-roll', label: 'Combined roll' }
              ]
            },
            {
              classes: 'keeper',
              visibility: 'trusted',
              items: [
                { action: 'request-roll', label: 'Request roll' },
                {
                  label: { icon: 'fas fa-link', text: 'Link' },
                  subMenu: {
                    items: [
                      { action: 'link-tool', label: 'Open in link tool' },
                      { action: 'send-chat', label: 'Send to chat' },
                      { action: 'copy-to-clipboard', label: 'Copy to clip-board' },
                      { action: 'link-encounter', label: 'Encounter' }
                    ]
                  }
                }
              ]
            }
          ]
        }

        const rollContextMenu = new CoC7ContextMenu()
        rollContextMenu.bind(rollMenu, html, this._onContextMenuClick.bind(this))
        this.menus.push(rollContextMenu)

        const sanContextMenu = new CoC7ContextMenu()
        sanContextMenu.bind(sanMenu, html, this._onContextMenuClick.bind(this))
        this.menus.push(sanContextMenu)
      } else {
        html
          .find('.characteristic-label')
          .contextmenu(this._onOpposedRoll.bind(this))
        html
          .find('.skill-name.rollable')
          .contextmenu(this._onOpposedRoll.bind(this))
        html
          .find('.attribute-label.rollable')
          .contextmenu(this._onOpposedRoll.bind(this))
      }

      // context menu bind
      html
        .find('.characteristic-label')
        .click(this._onRollCharacteriticTest.bind(this))
      html.find('.skill-name.rollable').click(this._onRollSkillTest.bind(this))
      html.find('.skill-image').click(this._onRollSkillTest.bind(this))
      html
        .find('.attribute-label.rollable')
        .click(this._onRollAttribTest.bind(this))

      html
        .find('.token-drag-handle')
        .on('dragstart', this._onDragTokenStart.bind(this))

      html
        .find('.characteristic-label')
        .on('dragstart', event => this._onDragCharacteristic(event))
      html
        .find('.attribute-label')
        .on('dragstart', event => this._onDragAttribute(event))
      html
        .find('.san-check')
        .on('dragstart', event => this._onDragSanCheck(event))

      html
        .find('.weapon-name.rollable')
        .contextmenu(this._onOpposedRoll.bind(this))

      html
        .find('.roll-characteritics')
        .click(this._onRollCharacteriticsValue.bind(this))
      html
        .find('.average-characteritics')
        .click(this._onAverageCharacteriticsValue.bind(this))
      html.find('.toggle-switch').click(this._onToggle.bind(this))

      // Status monitor
      if (game.user.isGM || game.settings.get('CoC7', 'statusPlayerEditable')) {
        html.find('.reset-counter').click(this._onResetCounter.bind(this))
        html
          .find('.condition-monitor')
          .click(this._onConditionToggle.bind(this))
        html.find('.is-dying').click(this.heal.bind(this))
        html.find('.is-dead').click(this.revive.bind(this))
      }

      html.find('.dying-check').click(this.checkForDeath.bind(this))

      html.find('.item .item-image').click(event => this._onItemRoll(event))
      html
        .find('.weapon-name.rollable')
        .click(event => this._onWeaponRoll(event))
      html
        .find('.item-name.effect-name')
        .click(event => this._onEffect(event))
      // html
      //   .find('.item-name.effect-name')
      //   .keydown((event) => {
      //     if (isCtrlKey(event)) {
      //       event.currentTarget.classList.add('pointer')
      //     }
      //   })
      // html
      //   .find('.item-name.effect-name')
      //   .keydown((event) => {
      //     if (isCtrlKey(event)) {
      //       event.currentTarget.classList.remove('pointer')
      //     }
      //   })
      html
        .find('.weapon-skill.rollable')
        .click(async event => this._onWeaponSkillRoll(event))
      html.on('click', '.weapon-damage', this._onWeaponDamage.bind(this))

      const wheelInputs = html.find('.attribute-value')
      for (const wheelInput of wheelInputs) {
        wheelInput.addEventListener('wheel', event => this._onWheel(event), {
          passive: true
        })
      }
    }

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    html.find('.show-detail').click(event => this._onItemSummary(event))
    html.find('.item-popup').click(this._onItemPopup.bind(this))

    // Update Inventory Item
    html.find('.show-detail').dblclick(event => this._onRenderItemSheet(event))
    html.find('.item-edit').click(event => this._onRenderItemSheet(event))

    // Delete Inventory Item
    html.find('.item-delete').click(async ev => {
      const li = $(ev.currentTarget).parents('.item')
      const itemToDelete = this.actor.items.get(li.data('itemId'), {
        strict: true
      })
      await itemToDelete.delete()
      li.slideUp(200, () => this.render(false))
    })

    html.find('.add-item').click(ev => {
      ev.stopPropagation()
      switch (ev.currentTarget.dataset.type) {
        case 'armor':
          this.actor.createEmptyArmor(ev)
          break
        case 'book':
          this.actor.createEmptyBook(ev)
          break
        case 'item':
          this.actor.createEmptyItem(ev)
          break
        case 'skill':
          this.actor.createEmptySkill(ev)
          break
        case 'spell':
          this.actor.createEmptySpell(ev)
          break
        case 'weapon':
          {
            const properties = {}
            if (ev.currentTarget.dataset.melee) {
              properties.melee = true
            } else if (ev.currentTarget.dataset.rngd) {
              properties.rngd = true
            }
            this.actor.createEmptyWeapon(ev, properties)
          }
          break
      }
    })

    // html.find('.clean-skill-list').click(() => {
    //   this.actor.cleanSkills()
    // })

    html.find('.item-trade').click(this._onTradeItem.bind(this))

    html.find('.add-new-section').click(() => {
      this.actor.createBioSection()
      this.render()
    })

    html.find('.delete-section').click(ev => {
      const index = parseInt(
        ev.currentTarget.closest('.bio-section').dataset.index
      )
      this.actor.deleteBioSection(index)
    })

    html.find('.move-section-up').click(ev => {
      const index = parseInt(
        ev.currentTarget.closest('.bio-section').dataset.index
      )
      this.actor.moveBioSectionUp(index)
    })

    html.find('.move-section-down').click(ev => {
      const index = parseInt(
        ev.currentTarget.closest('.bio-section').dataset.index
      )
      this.actor.moveBioSectionDown(index)
    })

    html.find('.development-flag').dblclick(ev => {
      const item = this.actor.items.get(
        ev.currentTarget.closest('.item').dataset.itemId
      )
      item.toggleItemFlag('developement')
    })

    html.find('.occupation-skill-flag.clickable').click(ev => {
      const item = this.actor.items.get(
        ev.currentTarget.closest('.item').dataset.itemId
      )
      item.toggleItemFlag('occupation')
    })

    html.find('.archetype-skill-flag.clickable').click(ev => {
      const item = this.actor.items.get(
        ev.currentTarget.closest('.item').dataset.itemId
      )
      item.toggleItemFlag('archetype')
    })

    html.find('.skill-developement').click(event => {
      this.actor.developementPhase(event.shiftKey)
    })

    html.find('.luck-development').click(event => {
      if (!event.detail || event.detail === 1) {
        this.actor.developLuck(event.shiftKey)
      }
    })

    html.find('.clear_conditions').click(event => {
      if (typeof this.actor.system.conditions !== 'undefined') {
        const disable = {}
        for (const condition in this.actor.system.conditions) {
          if (
            typeof this.actor.system.conditions[condition].value !==
              'undefined' &&
            this.actor.system.conditions[condition].value === true
          ) {
            disable[`system.conditions.${condition}.value`] = false
          }
        }
        if (Object.keys(disable).length > 0) {
          this.actor.update(disable)
        }
      }
      const effects = this.actor.effects.map(effect => effect.id)
      if (effects.length > 0) {
        this.actor.deleteEmbeddedDocuments('ActiveEffect', effects)
      }
    })

    /**
     * This is used for dev purposes only !
     */
    html.find('.test-trigger').click(async event => {
      if (!game.settings.get('CoC7', 'hiddendevmenu')) return null
      // await Item.create({
      //   name: '__CoC7InternalItem__',
      //   type: 'item'
      // })
      // const effects = await item.createEmbeddedDocuments('ActiveEffect', [
      //   {
      //     label: game.i18n.localize('CoC7.EffectNew'),
      //     icon: 'icons/svg/aura.svg',
      //     origin: null,
      //     'duration.rounds': undefined,
      //     disabled: true
      //   }
      // ])
      // const effect = effects[0]
      // await effect.sheet.render(true)
      // ui.notifications.info( 'effect created !')
      // ui.notifications.info('effect created !')
    })

    html
      .find('.skill-name.rollable:not(.withouttooltip)')
      .mouseenter(this.toolTipSkillEnter.bind(this))
      .mouseleave(game.CoC7Tooltips.toolTipLeave.bind(this))
    html
      .find('.characteristic-label')
      .mouseenter(this.toolTipCharacteristicEnter.bind(this))
      .mouseleave(game.CoC7Tooltips.toolTipLeave.bind(this))
    html
      .find('.attribute-label.rollable')
      .mouseenter(this.toolTipAttributeEnter.bind(this))
      .mouseleave(game.CoC7Tooltips.toolTipLeave.bind(this))
    html
      .find('.auto-toggle')
      .mouseenter(this.toolTipAutoEnter.bind(this))
      .mouseleave(game.CoC7Tooltips.toolTipLeave.bind(this))
    html
      .find('.item-control.development-flag')
      .mouseenter(this.toolTipFlagForDevelopment.bind(this))
      .mouseleave(game.CoC7Tooltips.toolTipLeave.bind(this))

    // Active Effects
    html
      .find('.effect-control')
      .click(ev => CoC7ActiveEffect.onManageActiveEffect(ev, this.actor))
  }

  toolTipSkillEnter (event) {
    const delay = parseInt(game.settings.get('CoC7', 'toolTipDelay'))
    if (delay > 0) {
      game.CoC7Tooltips.ToolTipHover = event.currentTarget
      game.CoC7Tooltips.toolTipTimer = setTimeout(() => {
        const toolTip = game.actors.documentClass.toolTipSkillText()
        if (toolTip !== false) {
          game.CoC7Tooltips.displayToolTip(toolTip)
        }
      }, delay)
    }
  }

  toolTipCharacteristicEnter (event) {
    const delay = parseInt(game.settings.get('CoC7', 'toolTipDelay'))
    if (delay > 0) {
      const sheet = this
      game.CoC7Tooltips.ToolTipHover = event.currentTarget
      game.CoC7Tooltips.toolTipTimer = setTimeout(function () {
        if (
          typeof game.CoC7Tooltips.ToolTipHover !== 'undefined' &&
          game.CoC7Tooltips.ToolTipHover !== null
        ) {
          const char = game.CoC7Tooltips.ToolTipHover.closest('.char-box')
          if (typeof char !== 'undefined' && !!char) {
            const charId = char.dataset.characteristic
            const characteristic = sheet.actor.characteristics[charId]
            let toolTip = game.i18n.format('CoC7.ToolTipSkill', {
              skill: characteristic.label,
              regular: characteristic.value ?? 0,
              hard: characteristic.hard ?? 0,
              extreme: characteristic.extreme ?? 0
            })
            if (game.user.isGM) {
              toolTip =
                toolTip +
                game.i18n.format('CoC7.ToolTipKeeperSkill', {
                  other:
                    game.settings.get('CoC7', 'stanbyGMRolls') &&
                    sheet.actor.hasPlayerOwner
                      ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
                        name: sheet.actor.name
                      })
                      : ''
                })
            }
            game.CoC7Tooltips.displayToolTip(toolTip)
          }
        }
      }, delay)
    }
  }

  toolTipAttributeEnter (event) {
    const delay = parseInt(game.settings.get('CoC7', 'toolTipDelay'))
    if (delay > 0) {
      const sheet = this
      game.CoC7Tooltips.ToolTipHover = event.currentTarget
      game.CoC7Tooltips.toolTipTimer = setTimeout(function () {
        if (
          typeof game.CoC7Tooltips.ToolTipHover !== 'undefined' &&
          game.CoC7Tooltips.ToolTipHover !== null
        ) {
          const attrib = game.CoC7Tooltips.ToolTipHover.closest('.attribute')
          if (typeof attrib !== 'undefined') {
            const attributeId = attrib.dataset.attrib
            let toolTip = ''
            const attributes = sheet.actor.system.attribs[attributeId]
            switch (attributeId) {
              case 'lck':
                toolTip = game.i18n.format('CoC7.ToolTipSkill', {
                  skill: attributes.label,
                  regular: attributes.value ?? 0,
                  hard: Math.floor((attributes.value ?? 0) / 2),
                  extreme: Math.floor((attributes.value ?? 0) / 5)
                })
                if (game.user.isGM) {
                  toolTip =
                    toolTip +
                    game.i18n.format('CoC7.ToolTipKeeperSkill', {
                      other:
                        game.settings.get('CoC7', 'stanbyGMRolls') &&
                        sheet.actor.hasPlayerOwner
                          ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
                            name: sheet.actor.name
                          })
                          : ''
                    })
                }
                game.CoC7Tooltips.displayToolTip(toolTip)
                break
              case 'db':
                toolTip = game.i18n.localize('CoC7.ToolTipDB')
                game.CoC7Tooltips.displayToolTip(toolTip)
                break
              case 'san':
                toolTip = game.i18n.format('CoC7.ToolTipSanity', {
                  skill: 'Sanity',
                  regular: attributes.value ?? 0,
                  hard: Math.floor((attributes.value ?? 0) / 2),
                  extreme: Math.floor((attributes.value ?? 0) / 5)
                })
                if (game.user.isGM) {
                  toolTip =
                    toolTip +
                    game.i18n.format('CoC7.ToolTipKeeperSkill', {
                      other:
                        game.i18n.localize('CoC7.ToolTipKeeperSanity') +
                        (game.settings.get('CoC7', 'stanbyGMRolls') &&
                        sheet.actor.hasPlayerOwner
                          ? game.i18n.format('CoC7.ToolTipKeeperStandbySkill', {
                            name: sheet.actor.name
                          })
                          : '')
                    })
                }
                game.CoC7Tooltips.displayToolTip(toolTip)
                break
            }
          }
        }
      }, delay)
    }
  }

  toolTipAutoEnter (event) {
    const delay = parseInt(game.settings.get('CoC7', 'toolTipDelay'))
    if (delay > 0) {
      game.CoC7Tooltips.ToolTipHover = event.currentTarget
      game.CoC7Tooltips.toolTipTimer = setTimeout(function () {
        if (
          typeof game.CoC7Tooltips.ToolTipHover !== 'undefined' &&
          game.CoC7Tooltips.ToolTipHover !== null
        ) {
          const toolTip = game.i18n.localize('CoC7.ToolTipAutoToggle')
          game.CoC7Tooltips.displayToolTip(toolTip)
        }
      }, delay)
    }
  }

  toolTipFlagForDevelopment (event) {
    const delay = parseInt(game.settings.get('CoC7', 'toolTipDelay'))
    if (delay > 0) {
      const sheet = this
      game.CoC7Tooltips.ToolTipHover = event.currentTarget
      game.CoC7Tooltips.toolTipTimer = setTimeout(function () {
        if (
          typeof game.CoC7Tooltips.ToolTipHover !== 'undefined' &&
          game.CoC7Tooltips.ToolTipHover !== null
        ) {
          const item = game.CoC7Tooltips.ToolTipHover.closest('.item')
          if (typeof item !== 'undefined') {
            const skillId = item.dataset.skillId
            const skill = sheet.actor.items.get(skillId)
            const toolTip = game.i18n.format('CoC7.ToolTipSkillFlagToggle', {
              status: game.i18n.localize(
                skill.system.flags.developement
                  ? 'CoC7.ToolTipSkillFlagged'
                  : 'CoC7.ToolTipSkillUnflagged'
              )
            })
            game.CoC7Tooltips.displayToolTip(toolTip)
          }
        }
      }, delay)
    }
  }

  _onContextMenuClick (event, target) {
    const targetType = target.dataset?.targetType
    const rollOptions = {
      preventStandby: true,
      fastForward: false,
      actor: this.actor
    }
    switch (targetType) {
      case ('skill'):
        rollOptions.rollType = CoC7ChatMessage.ROLL_TYPE_SKILL
        rollOptions.skillId = target.closest('.item')?.dataset.skillId

        break
      case ('characteristic'):
        rollOptions.rollType = CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC
        rollOptions.characteristic = target.closest('.char-box').dataset.characteristic
        break

      case ('attribute'):
        rollOptions.rollType = CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
        rollOptions.attribute = target.closest('.attribute').dataset.attrib
        break
    }
    switch (event.currentTarget.dataset.action) {
      case ('roll'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NORMAL
        break
      case ('opposed-roll'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_OPPOSED
        break
      case ('combined-roll'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_COMBINED
        break
      case ('request-roll'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NORMAL
        rollOptions.preventStandby = false
        break
      case ('link-tool'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NONE
        rollOptions.openLinkTool = true
        break
      case ('send-chat'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NONE
        rollOptions.sendToChat = true
        break
      case ('copy-to-clipboard'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NONE
        rollOptions.sendToClipboard = true
        break
      case ('link-encounter'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_NONE
        rollOptions.createEncounter = true
        break
      case ('encounter'):
        rollOptions.cardType = CoC7ChatMessage.CARD_TYPE_SAN_CHECK
        rollOptions.rollType = CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
        rollOptions.fastForward = true
        break

      default:
        break
    }

    CoC7ChatMessage.trigger(rollOptions)
  }

  _onRenderItemSheet (event) {
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('itemId'))
    item.sheet.render(true)
  }

  async _onTradeItem (event) {
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('itemId'))
    let content = '<p>' + game.i18n.localize('CoC7.MessageSelectUserToGiveTo')
    const message = {
      actorFrom: this.actor.id,
      scene: null,
      actorTo: this.actor.id,
      item: item.id
    }
    if (this.token?.actor) {
      message.actorFrom = this.token.id
      message.scene = this.token.parent.id
    }
    const actors = game.actors.filter(e => {
      if (!['character', 'npc', 'creature', 'container'].includes(e.type)) {
        return false
      }
      if (this.actor.id === e.id) {
        return false
      }
      let visible = false
      for (const [k, v] of Object.entries(e.ownership)) {
        if (k === 'default' || k === game.user.id) {
          visible = visible || v !== CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
        }
      }
      return visible
    })
    content = content + '<form id="selectform"><select name="user">'
    for (const actor of actors) {
      content =
        content + '<option value="' + actor.id + '">' + actor.name + '</option>'
    }
    content = content + '</select></form></p>'
    message.actorTo = await new Promise(resolve => {
      const dlg = new Dialog({
        title: game.i18n.localize('CoC7.MessageTitleSelectUserToGiveTo'),
        content,
        buttons: {
          confirm: {
            label: game.i18n.localize('CoC7.Validate'),
            callback: html => {
              const formData = new FormData(
                html[0].querySelector('#selectform')
              )
              for (const [name, value] of formData) {
                if (name === 'user') {
                  return resolve(value)
                }
              }
            }
          }
        },
        default: 'confirm',
        close: () => {}
      })
      dlg.render(true)
    })
    await game.CoC7socket.executeAsGM('gmtradeitemto', message)
  }

  _onDragStart (event) {
    super._onDragStart(event)
    if (this.token) {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'))
      dragData.tokenUuid = this.token.uuid
      dragData.tokenId = this.token.id
      dragData.sceneId = this.token.parent.id
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    }
  }

  _onDragCharacteristic (event) {
    const box = event.currentTarget.parentElement
    const data = {
      CoC7Type: 'link',
      linkType: 'characteristic',
      check: 'check',
      type: 'CoC7Link',
      hasPlayerOwner: this.actor.hasPlayerOwner,
      actorKey: this.actor.actorKey,
      name: box.dataset.characteristic,
      icon: null,
      document: {
        type: this.document.type,
        uuid: this.document.uuid
      }
    }

    event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  _onDragAttribute (event) {
    const box = event.currentTarget.parentElement
    const data = {
      CoC7Type: 'link',
      linkType: 'attribute',
      check: 'check',
      type: 'CoC7Link',
      hasPlayerOwner: this.actor.hasPlayerOwner,
      actorKey: this.actor.actorKey,
      name: box.dataset.attrib,
      icon: null,
      document: {
        type: this.document.type,
        uuid: this.document.uuid
      }
    }

    event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  _onDragSanCheck (event) {
    const sanMin = event.currentTarget.querySelector('.san-value.pass')
    const sanMax = event.currentTarget.querySelector('.san-value.failed')
    const data = {
      CoC7Type: 'link',
      linkType: 'coc7-link',
      check: 'sanloss',
      hasPlayerOwner: this.actor.hasPlayerOwner,
      actorKey: this.actor.actorKey,
      sanMin: sanMin.innerText,
      sanMax: sanMax.innerText,
      icon: null,
      document: {
        type: this.document.type,
        uuid: this.document.uuid
      }
    }

    event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  async _onDrop (event) {
    const dataString = event.dataTransfer.getData('text/plain')
    if (dataString === '') {
      return false
    }
    const data = JSON.parse(dataString)
    if (data.type === 'CoC7Link') {
      if (data.check === CoC7Link.CHECK_TYPE.EFFECT) {
        CoC7Link._onLinkActorClick(this.actor, data)
      }
    } else if (['creature', 'npc'].includes(this.actor.type) && data.type === 'Macro') {
      const macros = this.actor.system.special.macros ? foundry.utils.duplicate(this.actor.system.special.macros) : []
      macros.push({
        uuid: data.uuid
      })
      this.actor.update({ 'system.special.macros': macros })
      return false
    }
    await super._onDrop(event)
  }

  async _onConditionToggle (event) {
    event.preventDefault()
    if (event.currentTarget.dataset.condition) {
      await this.actor.toggleCondition(event.currentTarget.dataset.condition)
    }
  }

  async revive () {
    if (game.user.isGM) this.actor.unsetCondition(COC7.status.dead)
  }

  async heal () {
    if (game.user.isGM) this.actor.unsetCondition(COC7.status.dying)
  }

  async checkForDeath (event) {
    const conCheck = new CoC7ConCheck(
      this.actor.isToken ? this.actor.tokenKey : this.actor.id
    )
    conCheck.stayAlive = true
    conCheck.toMessage(event.shiftKey)
  }

  async _onDragTokenStart (event) {
    const data = {
      type: 'Token',
      uuid: this.token.uuid
    }
    event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  async _onResetCounter (event) {
    event.preventDefault()
    await this.actor.resetDailySanity()
  }

  async _onAutoToggle (event) {
    if (event.currentTarget.closest('.attribute')) {
      const attrib = event.currentTarget.closest('.attribute').dataset.attrib
      this.actor.toggleAttribAuto(attrib)
    }
  }

  async _onToggle (event) {
    const weapon = this.actor.items.get(
      event.currentTarget.closest('.item').dataset.itemId
    )
    if (weapon) {
      weapon.toggleProperty(
        event.currentTarget.dataset.property,
        isCtrlKey(event)
      )
    }
  }

  // roll the actor characteristic from formula when possible.
  async _onRollCharacteriticsValue () {
    await this.actor.rollCharacteristicsValue()
  }

  async _onAverageCharacteriticsValue () {
    this.actor.averageCharacteristicsValue()
  }

  async _onLockClicked (event) {
    event.preventDefault()
    const isLocked = this.actor.locked
    this.actor.locked = !isLocked
    Hooks.call('actorLockClickedCoC7', [!isLocked])
  }

  async _onFlagClicked (event) {
    event.preventDefault()
    const flagName = event.currentTarget.dataset.flag
    this.actor.toggleActorFlag(flagName)
  }

  async _onFormulaClicked (event) {
    event.preventDefault()
    this.actor.toggleActorFlag('displayFormula')
  }

  async _onWheel (event) {
    let value = parseInt(event.currentTarget.value) || null
    if (event.deltaY > 0) {
      value = value === 0 ? 0 : value - 1
    }

    if (event.deltaY < 0) {
      value = value + 1
    }

    switch (event.currentTarget.name) {
      case 'system.attribs.hp.value':
        this.actor.setHp(value)
        break
      case 'system.attribs.mp.value':
        this.actor.setMp(value)
        break
      case 'system.attribs.san.value':
        this.actor.setSan(value)
        break
      case 'system.attribs.lck.value':
        this.actor.setLuck(value)
        break
      case 'system.attribs.build.current':
        this.actor.setHp(value)
        break
    }
  }

  _toggleReadOnly (event) {
    event.currentTarget.readOnly = !event.currentTarget.readOnly
    event.currentTarget.classList.toggle('read-only')
  }

  async _onItemSummary (event) {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('item-id'))
    const chatData = await item.getChatData({ secrets: this.actor.isOwner })

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary')
      summary.slideUp(200, () => {
        summary.remove()
        li.toggleClass('expanded')
      })
    } else {
      const div = $('<div class="item-summary"></div>')

      const labels = $('<div class="item-labels"></div>')
      for (const p of chatData.labels) {
        labels.append(
          `<div class="item-label"><span class="label-name">${p.name} :</span><span class="label-value">${p.value}</span></div>`
        )
      }
      div.append(labels)

      div.append(
        $(`<div class="item-description">${chatData.description.value}</div>`)
      )

      if (item.system.properties?.spcl) {
        const specialDiv = $(
          `<div class="item-special">${chatData.description.special}</div>`
        )
        div.append(specialDiv)
      }

      const props = $('<div class="item-properties"></div>')
      for (const p of chatData.properties) {
        props.append(
          `<div class="tag item-property">${game.i18n.localize(p)}</div>`
        )
      }
      div.append(props)

      li.append(div.hide())
      div.slideDown(200, () => li.toggleClass('expanded'))
    }
    // $(event.currentTarget).toggleClass('expanded');
  }

  async _onSectionHeader (event) {
    event.preventDefault()
    // let section = $(event.currentTarget).parents('section'),
    //  pannelClass = $(event.currentTarget).data('pannel'),
    //  pannel = section.find( `.${pannelClass}`);
    // pannel.toggle();
    const section = event.currentTarget.closest('section')
    const pannelClass = event.currentTarget.dataset.pannel
    if (typeof pannelClass === 'undefined') return
    const pannel = $(section).find(`.pannel.${pannelClass}`)

    // pannel.toggle();
    if (pannel.hasClass('expanded')) {
      // Could remove expanded class and use (pannel.is(':visible'))
      pannel.slideUp(200, () => pannel.toggleClass('expanded'))
    } else {
      pannel.slideDown(200, () => pannel.toggleClass('expanded'))
    }

    const camelFlag = chatHelper.hyphenToCamelCase(`data.pannel.${pannelClass}.expanded`)

    this.actor.update(
      { [camelFlag]: !pannel.hasClass('expanded') },
      { render: false })
  }

  _onInventoryHeader (event) {
    event.preventDefault()
    const li = $(event.currentTarget).siblings('li')
    if (li.is(':visible')) li.slideUp(200)
    else li.slideDown(200)
  }

  _onItemHeader (event) {
    event.preventDefault()
    const ol = $(event.currentTarget).next('ol')
    if (ol.is(':visible')) ol.slideUp(200)
    else ol.slideDown(200)
  }

  async _onItemPopup (event) {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('item-id'))

    CoC7ActorSheet.popupSkill(item)
  }

  static async popupSkill (skill) {
    skill.system.description.enrichedValue = await TextEditor.enrichHTML(
      skill.system.description.value,
      { async: true }
    )
    const dlg = new Dialog(
      {
        title: game.i18n.localize('CoC7.SkillDetailsWindow'),
        content: skill,
        buttons: {},
        close: () => {}
      },
      {
        classes: ['coc7', 'sheet', 'skill'],
        width: 520,
        height: 480,
        scrollY: ['.item-description'],
        template: 'systems/CoC7/templates/apps/skill-details.html'
      }
    )
    dlg.render(true)
  }

  /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
  async _onItemRoll (event) {
    event.preventDefault()
    // const itemId = event.currentTarget.closest('.item').dataset.itemId;
    // const actorId = event.currentTarget.closest('form').dataset.actorId;
    // const tokenKey = event.currentTarget.closest('form').dataset.tokenId;
    // let check = new CoC7Check();

    // check.actor = !tokenKey ? actorId : tokenKey;
    // check.item = itemId;
    // check.roll();
    // check.toMessage();
  }

  async _onEffect (event) {
    event.preventDefault()
    const effectId = event.currentTarget.closest('li').dataset.effectId
    const effect = this.actor.effects.get(effectId)
    if (isCtrlKey(event) && game.user.isGM) {
      CoC7ContentLinkDialog.create({ type: 'CoC7Link', check: CoC7Link.CHECK_TYPE.EFFECT, object: effect })
    }
  }

  async _onWeaponRoll (event) {
    event.preventDefault()
    const itemId = event.currentTarget.closest('li').dataset.itemId
    const fastForward = event.shiftKey
    const weapon = this.actor.items.get(itemId)
    // const actorKey = !this.token? this.actor.actorKey : `${this.token.scene?._id?this.token.scene._id:'TOKEN'}.${this.token.data._id}`; //REFACTORING (2)
    /** * MODIF 0.8.x ***/
    let actorKey
    if (!this.token) actorKey = this.actor.id
    // Sheet was opened from actor directory
    else {
      // Opened from token
      if (this.actor.isToken && game.actors.tokens[this.token.id]) {
        actorKey = `TOKEN.${this.token.id}`
      } else {
        actorKey = `${this.token.parent.id}.${this.token.id}`
      }
    }

    if (isCtrlKey(event) && game.user.isGM) {
      const linkData = {
        check: CoC7Link.CHECK_TYPE.ITEM,
        name: weapon.name
      }
      CoC7ContentLinkDialog.create(linkData, { actors: [this.actor] })
    } else {
      let proceedWithoutTarget = game.settings.get('CoC7', 'disregardNoTargets')
      if (!proceedWithoutTarget && game.user.targets.size <= 0) {
        proceedWithoutTarget = await new Promise(resolve => {
          const data = {
            title: ' ',
            content: game.i18n.format('CoC7.NoTargetSelected', {
              weapon: weapon.name
            }),
            buttons: {
              cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('CoC7.Cancel'),
                callback: () => {
                  return resolve(false)
                }
              },
              proceed: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('CoC7.Proceed'),
                callback: () => {
                  return resolve(true)
                }
              }
            },
            default: 'cancel',
            classes: ['coc7', 'dialog']
          }
          new Dialog(data).render(true)
        })
      }
      if (game.user.targets.size > 0 || proceedWithoutTarget) {
        if (!weapon.system.properties.rngd) {
          if (game.user.targets.size > 1) {
            ui.notifications.warn(game.i18n.localize('CoC7.WarnTooManyTarget'))
          }

          const card = new CoC7MeleeInitiator(actorKey, itemId, fastForward)
          card.createChatCard()
        }
        if (weapon.system.properties.rngd) {
          const card = new CoC7RangeInitiator(actorKey, itemId, fastForward)
          card.createChatCard()
        }
      }
    }
  }

  async _onReloadWeapon (event) {
    const itemId = event.currentTarget.closest('.item')
      ? event.currentTarget.closest('.item').dataset.itemId
      : null
    if (!itemId) return
    const weapon = this.actor.items.get(itemId)
    if (event.button === 0) {
      if (event.shiftKey) await weapon.reload()
      else await weapon.addBullet()
    } else if (event.button === 2) {
      if (event.shiftKey) await weapon.setBullets(0)
      else await weapon.shootBullets(1)
    }
  }

  async _onAddAmo (event) {
    const itemId = event.currentTarget.closest('.item')
      ? event.currentTarget.closest('.item').dataset.itemId
      : null
    if (!itemId) return
    const weapon = this.actor.items.get(itemId)
    await weapon.addBullet()
  }

  async _onWeaponSkillRoll (event) {
    event.preventDefault()
    const skillId = event.currentTarget.dataset.skillId
    const actorId = event.currentTarget.closest('form').dataset.actorId
    const tokenKey = event.currentTarget.closest('form').dataset.tokenId
    const itemId = event.currentTarget.closest('li')
      ? event.currentTarget.closest('li').dataset.itemId
      : null

    const check = new CoC7Check()

    if (!event.shiftKey) {
      const usage = await RollDialog.create()
      if (usage) {
        check.diceModifier = usage.get('bonusDice')
        check.difficulty = usage.get('difficulty')
        check.flatDiceModifier = Number(usage.get('flatDiceModifier'))
        check.flatThresholdModifier = Number(usage.get('flatThresholdModifier'))
      }
    }

    check.actor = !tokenKey ? actorId : tokenKey
    check.skill = skillId
    check.item = itemId
    await check.roll()
    check.toMessage()

    // HACK: just to pop the advanced roll window
    // check.item.roll();
  }

  async _onWeaponDamage (event) {
    event.preventDefault()
    const itemId = event.currentTarget.closest('.weapon').dataset.itemId
    const range = event.currentTarget.closest('.weapon-damage').dataset.range
    const damageChatCard = new DamageCard({
      fastForward: event.shiftKey,
      range
    })
    damageChatCard.actorKey = this.actor.tokenKey
    damageChatCard.itemId = itemId
    damageChatCard.updateChatCard()
    // console.log( 'Weapon damage Clicked');
  }

  async _onOpposedRoll (event) {
    event.preventDefault()

    if (event.currentTarget.parentElement.dataset.attrib === 'db') return

    const data = {
      rollType: CoC7ChatMessage.ROLL_TYPE_SKILL,
      cardType: CoC7ChatMessage.CARD_TYPE_OPPOSED,
      event,
      actor: this.actor
    }
    if (event.currentTarget.classList.contains('characteristic-label')) {
      data.rollType = CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC
    } else if (event.currentTarget.classList.contains('attribute-label')) {
      data.rollType = CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
    }

    if (event.altKey) {
      data.cardType = CoC7ChatMessage.CARD_TYPE_COMBINED
    }

    CoC7ChatMessage.trigger(data)
  }

  /**
   * Handle rolling a Skill check
   * @  param {Event} event   The originating click event
   * @private
   */
  async _onRollCharacteriticTest (event) {
    event.preventDefault()
    if (event.currentTarget.classList.contains('flagged4dev')) return
    if (game.settings.get('CoC7', 'useContextMenus')) {
      CoC7ChatMessage.trigger({
        rollType: CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC,
        cardType: CoC7ChatMessage.CARD_TYPE_NORMAL,
        preventStandby: true,
        fastForward: true,
        characteristic: event.currentTarget.closest('.char-box').dataset.characteristic,
        actor: this.actor
      })
    } else {
      CoC7ChatMessage.trigger({
        rollType: CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC,
        cardType: CoC7ChatMessage.CARD_TYPE_NORMAL,
        event,
        actor: this.actor
      })
    }
  }

  async _onRollAttribTest (event) {
    // FLATMODIFIER
    event.preventDefault()
    const attrib = event.currentTarget.parentElement.dataset.attrib
    if (attrib === 'db') {
      if (
        !/^-{0,1}\d+$/.test(
          event.currentTarget.parentElement.dataset.rollFormula
        )
      ) {
        const r = new Roll(
          event.currentTarget.parentElement.dataset.rollFormula
        )
        await r.roll({ async: true })
        if (!isNaN(r.total) && !(r.total === undefined)) {
          r.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: game.i18n.localize('CoC7.BonusDamageRoll')
          })
        }
      }
      return
    }

    if (game.settings.get('CoC7', 'useContextMenus')) {
      CoC7ChatMessage.trigger({
        rollType: CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC,
        cardType: CoC7ChatMessage.CARD_TYPE_NORMAL,
        preventStandby: true,
        fastForward: true,
        attribute: event.currentTarget.closest('.attribute').dataset.attrib,
        actor: this.actor
      })
    } else {
      CoC7ChatMessage.trigger({
        rollType: CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE,
        cardType:
        event.altKey && attrib === 'san'
          ? CoC7ChatMessage.CARD_TYPE_SAN_CHECK
          : CoC7ChatMessage.CARD_TYPE_NORMAL,
        event,
        actor: this.actor
      })
    }
  }

  /**
   * Handle rolling a Skill check
   * @param {Event} event   The originating click event
   * @private
   */
  _onRollSkillTest (event) {
    event.preventDefault()
    if (event.currentTarget.classList.contains('flagged4dev')) return
    if (game.settings.get('CoC7', 'useContextMenus')) {
      CoC7ChatMessage.trigger({
        rollType: CoC7ChatMessage.ROLL_TYPE_SKILL,
        cardType: CoC7ChatMessage.CARD_TYPE_NORMAL,
        preventStandby: true,
        fastForward: true,
        skillId: event?.currentTarget.closest('.item')?.dataset.skillId,
        actor: this.actor
      })
    } else {
      CoC7ChatMessage.trigger({
        rollType: CoC7ChatMessage.ROLL_TYPE_SKILL,
        cardType: CoC7ChatMessage.CARD_TYPE_NORMAL,
        event,
        actor: this.actor
      })
    }
  }

  /** @override */
  // _getSubmitData(updateData={}) {

  //  // Create the expanded update data object
  //  const fd = new FormDataExtended(this.form, {editors: this.editors});
  //  let data = fd.toObject();
  //  if ( updateData ) data = foundry.utils.mergeObject(data, updateData);
  //  else data = foundry.utils.expandObject(data);

  //  // Handle Damage array
  //  const damage = data.data?.damage;
  //  if ( damage ) damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || '', d[1] || '']);

  //  // Return the flattened submission data
  //  return foundry.utils.flattenObject(data);
  // }

  /* -------------------------------------------- */

  /**
   * Implement the _updateObject method as required by the parent class spec
   * This defines how to update the subject of the form when the form is submitted
   * @private
   */

  async _updateObject (event, formData) {
    // ui.notifications.info('_updateObject');
    // TODO: Replace with   _getSubmitData(updateData={}) Cf. sheet.js(243)
    const overrides = foundry.utils.flattenObject(this.actor.overrides)
    const name = event?.currentTarget?.name
    if (name && overrides && overrides[name]) {
      ui.notifications.warn(
        game.i18n.format('CoC7.EffectAppliedCantOverride', { name })
      )
    }

    if (this.object.img !== formData.img && (this.object.token ?? this.object.prototypeToken).texture.src === CoCActor.defaultImg(this.object.type)) {
      // Image was changed and it was the default, so also update the token image
      if (this.object.token) {
        this.object.token.update({
          'texture.src': formData.img
        })
      } else {
        this.object.prototypeToken.update({
          'texture.src': formData.img
        })
      }
    }

    const biographyKeyRegex = /^system.biography\.(\d+)\.(.+)$/
    const biographyKeys = Object.keys(formData).map(k => k.match(biographyKeyRegex)).filter(m => m)
    if (biographyKeys.length) {
      const biography = foundry.utils.duplicate(this.actor.system.biography)
      for (const biographyKey of biographyKeys) {
        biography[biographyKey[1]][biographyKey[2]] = formData['system.biography.' + biographyKey[1] + '.' + biographyKey[2]]
        delete formData[biographyKey[0]]
      }
      formData['system.biography'] = biography
    }

    if (event.currentTarget) {
      if (event.currentTarget.classList) {
        if (event.currentTarget.classList.contains('skill-adjustment')) {
          const item = this.actor.items.get(
            event.currentTarget.closest('.item').dataset.itemId
          )
          if (item) {
            const value = event.currentTarget.value
              ? parseInt(event.currentTarget.value)
              : null

            if (!event.currentTarget.value) {
              await item.update({
                [event.currentTarget.name]: null
              })
            } else {
              if (!isNaN(value)) {
                await item.update({
                  [event.currentTarget.name]: value
                })
              }
            }
            if (game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.credit-rating') === item.name && typeof this.actor.occupation?.system?.creditRating?.max !== 'undefined') {
              const creditValue =
                (item.value || 0) -
                (item.system.adjustments?.experience || 0)
              if (
                creditValue >
                  Number(this.actor.occupation.system.creditRating.max) ||
                creditValue <
                  Number(this.actor.occupation.system.creditRating.min)
              ) {
                ui.notifications.warn(
                  game.i18n.format('CoC7.CreditOutOfRange', {
                    min: Number(
                      this.actor.occupation.system.creditRating.min
                    ),
                    max: Number(
                      this.actor.occupation.system.creditRating.max
                    )
                  })
                )
              }
            }
          }
        }

        if (event.currentTarget.classList.contains('attribute-value')) {
          // TODO : check why SAN only ?
          if (event.currentTarget.name === 'system.attribs.san.value') {
            await this.actor.setSan(
              parseInt(event.currentTarget.value)
            )
            this.render(true)
            return
          }
          if (event.currentTarget.name === 'system.attribs.hp.value') {
            await this.actor.setHp(
              parseInt(event.currentTarget.value)
            )
            this.render(true)
            return
          }
        }

        if (event.currentTarget.classList.contains('text-area')) {
          this.actor.updateTextArea(event.currentTarget)
          return
        }

        if (event.currentTarget.classList.contains('bio-section-value')) {
          const index = parseInt(
            event.currentTarget.closest('.bio-section').dataset.index
          )
          await this.actor.updateBioValue(index, event.currentTarget.value)
        }

        if (event.currentTarget.classList.contains('bio-section-title')) {
          const index = parseInt(
            event.currentTarget.closest('.bio-section').dataset.index
          )
          this.actor.updateBioTitle(index, event.currentTarget.value)
        }

        if (event.currentTarget.classList.contains('npc-skill-score')) {
          const skill = this.actor.items.get(
            event.currentTarget.closest('.item').dataset.skillId
          )
          if (skill) {
            await skill.updateValue(event.currentTarget.value)
          }
        }

        if (
          event.currentTarget.classList.contains('skill-name') ||
          event.currentTarget.classList.contains('item-name')
        ) {
          const item = this.actor.items.get(
            event.currentTarget.closest('.item').dataset.skillId
          )
          if (item) {
            const data = {}
            if (item.system.properties.special) {
              const parts = CoC7Item.getNamePartsSpec(
                event.currentTarget.value,
                item.system.specialization
              )
              data.name = parts.name
              data['system.skillName'] = parts.skillName
              data['system.specialization'] = parts.specialization
            } else {
              data['system.skillName'] = event.currentTarget.value
              data.name = event.currentTarget.value
            }
            await item.update(data)
          }
        }

        if (event.currentTarget.classList.contains('characteristic-formula')) {
          // tester si c'est vide
          if (event.currentTarget.value.length !== 0) {
            // On teste si c'est une formule valide !
            const r = new Roll(event.currentTarget.value)
            await r.roll({ async: true })
            if (isNaN(r.total) || typeof r.total === 'undefined') {
              ui.notifications.error(
                game.i18n.format('CoC7.ErrorInvalidFormula', {
                  value: event.currentTarget.value
                })
              )
              formData[event.currentTarget.name] = game.i18n.format(
                'CoC7.ErrorInvalid'
              )
            }
          }
        }

        if (event.currentTarget.classList.contains('attribute-value')) {
          // tester si le db retourné est valide.
          if (
            event.currentTarget.value.length !== 0 &&
            event.currentTarget.closest('.attribute').dataset.attrib === 'db'
          ) {
            // On teste si c'est une formule valide !
            const r = new Roll(event.currentTarget.value)
            await r.roll({ async: true })
            if (isNaN(r.total) || r.total === undefined) {
              ui.notifications.error(
                game.i18n.format('CoC7.ErrorInvalidFormula', {
                  value: event.currentTarget.value
                })
              )
              formData[event.currentTarget.name] = game.i18n.format(
                'CoC7.ErrorInvalid'
              )
            }
          }
        }

        // le skill associé a l'arme a changé
        // TODO : Factorisation du switch
        // TODO : remplacer les strings par de constantes (item.skill.main ...)
        if (event.currentTarget.classList.contains('weapon-skill')) {
          const weapon = this.actor.items.get(
            event.currentTarget.closest('.item').dataset.itemId
          )
          const skill = this.actor.items.get(
            event.currentTarget.options[event.currentTarget.selectedIndex].value
          )
          if (weapon && skill) {
            switch (event.currentTarget.dataset.skill) {
              case 'main':
                await weapon.update({
                  'system.skill.main.id': skill.id,
                  'system.skill.main.name': skill.name
                })
                break
              case 'alternativ':
                await weapon.update({
                  'system.skill.alternativ.id': skill.id,
                  'system.skill.alternativ.name': skill.name
                })
                break
            }
          }
        }

        // Le nom de l'arme a changé
        if (event.currentTarget.classList.contains('weapon-name')) {
          const weapon = this.actor.items.get(
            event.currentTarget.closest('.item').dataset.itemId
          )
          if (weapon) {
            await weapon.update({ name: event.currentTarget.value })
          }
        }

        // les degats de l'arme on changés.
        // TODO : Factorisation du switch
        // TODO : remplacer les strings par de constantes (item.range.normal ...)
        if (event.currentTarget.classList.contains('damage-formula')) {
          const weapon = this.actor.items.get(
            event.currentTarget.closest('.item').dataset.itemId
          )
          if (weapon) {
            // teste la validité de la formule.
            if (event.currentTarget.value.length !== 0) {
              const r = new Roll(event.currentTarget.value)
              await r.roll({ async: true })
              if (isNaN(r.total) || typeof r.total === 'undefined') {
                ui.notifications.error(
                  game.i18n.format('CoC7.ErrorUnableToParseFormula', {
                    value: event.currentTarget.value
                  })
                )
              } else {
                switch (event.currentTarget.dataset.range) {
                  case 'normal':
                    await weapon.update({
                      'system.range.normal.damage': event.currentTarget.value
                    })
                    break
                  case 'long':
                    await weapon.update({
                      'system.range.long.damage': event.currentTarget.value
                    })
                    break
                  case 'extreme':
                    await weapon.update({
                      'system.range.extreme.damage': event.currentTarget.value
                    })
                    break
                }
              }
            } else {
              switch (event.currentTarget.dataset.range) {
                case 'normal':
                  await weapon.update({
                    'system.range.normal.damage': null
                  })
                  break
                case 'long':
                  await weapon.update({
                    'system.range.long.damage': null
                  })
                  break
                case 'extreme':
                  await weapon.update({
                    'system.range.extreme.damage': null
                  })
                  break
              }
            }
          }
        }
      }
    }
    return this.object.update(formData)
  }
}
