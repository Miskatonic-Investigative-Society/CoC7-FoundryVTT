/* global $, ActorSheet, ChatMessage, CONST, Dialog, FormData, game, getProperty, Hooks, mergeObject, Roll, TextEditor, ui */

import { RollDialog } from '../../apps/roll-dialog.js'
import { CoC7ChatMessage } from '../../apps/coc7-chat-message.js'
import { CoC7Check } from '../../check.js'
import { COC7 } from '../../config.js'
import { CoC7Item } from '../../items/item.js'
import { CoC7MeleeInitiator } from '../../chat/combat/melee-initiator.js'
import { CoC7RangeInitiator } from '../../chat/rangecombat.js'
// import { CoC7DamageRoll } from '../../chat/damagecards.js';
import { CoC7ConCheck } from '../../chat/concheck.js'
import { isCtrlKey } from '../../chat/helper.js'
import { CoC7Parser } from '../../apps/parser.js'
import { DamageCard } from '../../chat/cards/damage.js'
import { CoC7LinkCreationDialog } from '../../apps/link-creation-dialog.js'
import CoC7ActiveEffect from '../../active-effect.js'
import { CoC7Link } from '../../apps/link.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7ActorSheet extends ActorSheet {
  async getData () {
    const data = await super.getData()

    /** MODIF: 0.8.x **/
    const actorData = this.actor.data.toObject(false)
    data.data = actorData.data // Modif 0.8.x : data.data
    data.editable = this.isEditable // MODIF 0.8.x : editable removed
    /******************/

    data.showHiddenDevMenu = game.settings.get('CoC7', 'hiddendevmenu')

    data.hasToken = !!this.token
    data.canDragToken = data.hasToken && game.user.isGM
    data.linkedActor = this.actor.data?.token?.actorLink
    data.isToken = this.actor.isToken
    data.itemsByType = {}
    data.skills = {}
    data.combatSkills = {}
    data.weapons = {}
    data.rangeWpn = []
    data.meleeWpn = []
    data.actorFlags = {}

    data.effects =
      this.actor.type === 'character'
        ? CoC7ActiveEffect.prepareActiveEffectCategories(this.actor.effects)
        : CoC7ActiveEffect.prepareNPCActiveEffectCategories(this.actor.effects)

    data.permissionLimited =
      !game.user.isGM &&
      (this.actor.data.permission[game.user.id] ??
        this.actor.data.permission.default) ===
        (CONST.DOCUMENT_OWNERSHIP_LEVELS || CONST.ENTITY_PERMISSIONS).LIMITED

    data.isGM = game.user.isGM
    data.alowUnlock =
      game.settings.get('CoC7', 'playerUnlockSheetMode') === 'always' ||
      game.user.isGM ||
      (game.settings.get('CoC7', 'playerUnlockSheetMode') === 'creation' &&
        game.settings.get('CoC7', 'charCreationEnabled'))
    if (
      game.settings.get('CoC7', 'playerUnlockSheetMode') === 'creation' &&
      game.settings.get('CoC7', 'charCreationEnabled')
    ) {
      data['data.flags.locked'] = false
    }

    if (!['vehicle'].includes(this.actor.data.type)) {
      if (!data.data.characteristics) {
        data.data.characteristics = {
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

      if (!data.data.attribs) {
        data.data.attribs = {
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

      if (!data.data.biography) {
        data.data.biography = {
          personalDescription: { type: 'string', value: '' }
        }
      }

      if (!data.data.infos) {
        data.data.infos = {
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

      if (!data.data.flags) {
        data.data.flags = { locked: true, manualCredit: false }
      }

      if (!data.data.credit) {
        data.data.credit = {
          monetarySymbol: null,
          multiplier: null,
          spent: null,
          assetsDetails: null
        }
      }

      if (!data.data.development) {
        data.data.development = {
          personal: null,
          occupation: null,
          archetype: null
        }
      }

      if (!data.data.biography) data.data.biography = []

      data.pulpRuleArchetype = game.settings.get('CoC7', 'pulpRuleArchetype')
      data.pulpRuleOrganization = game.settings.get(
        'CoC7',
        'pulpRuleOrganization'
      )
    }

    data.isDead = this.actor.dead
    data.isDying = this.actor.dying

    if (data.items) {
      for (const item of data.items) {
        // si c'est une formule et qu'on peut l'evaluer
        // ce bloc devrait etre déplacé dans le bloc _updateFormData
        if (item.type === 'skill') {
          if (item.data.properties.special) {
            if (item.data.properties.fighting) {
              item.data.specialization = game.i18n.localize(
                'CoC7.FightingSpecializationName'
              )
            }
            if (item.data.properties.firearm) {
              item.data.specialization = game.i18n.localize(
                'CoC7.FirearmSpecializationName'
              )
            }
          }

          if (this.actor.data.type !== 'character') {
            if (isNaN(Number(item.data.value))) {
              let value = null
              const parsed = {}
              for (const [key, value] of Object.entries(
                COC7.formula.actorsheet
              )) {
                if (key.startsWith('@') && value.startsWith('this.')) {
                  parsed[key.substring(1)] = getProperty(
                    this,
                    value.substring(5)
                  )
                }
              }
              try {
                value = (
                  await new Roll(item.data.value, parsed).evaluate({
                    async: true
                  })
                ).total
              } catch (err) {
                console.warn(
                  game.i18n.format('CoC7.ErrorUnableToParseSkillFormula', {
                    value: item.data.value,
                    name: item.name
                  })
                )
                value = null
              }

              if (value) {
                item.data.value = value
                const itemToUpdate = this.actor.items.get(item._id)
                console.info(
                  `[COC7] (Actor:${this.name}) Evaluating skill ${item.name}:${item.data.value} to ${value}`
                )
                await itemToUpdate.update({
                  'data.value': value
                })
              }
            }
            const skill = this.actor.items.get(item._id)
            item.data.rawValue = skill.rawValue
            item.data.value = skill.value
          } else {
            const skill = this.actor.items.get(item._id)
            item.data.base = await skill.asyncBase()

            if (item.data.value) {
              // This should be part of migration or done at init !
              // Was done when skill value was changed to base + adjustement
              const value = item.data.value
              const exp = item.data.adjustments?.experience
                ? parseInt(item.data.adjustments.experience)
                : 0
              let updatedExp = exp + parseInt(item.data.value) - skill.value
              if (updatedExp <= 0) updatedExp = null
              console.info(
                `[COC7] Updating skill ${skill.name} experience. Experience missing: ${updatedExp}`
              )
              await this.actor.updateEmbeddedDocuments('Item', [
                {
                  _id: item._id,
                  'data.adjustments.experience': updatedExp,
                  'data.value': null
                }
              ])
              if (!item.data.adjustments) item.data.adjustments = {}
              item.data.adjustments.experience = updatedExp
              item.data.rawValue = skill.rawValue
              item.data.value = skill.value // ACTIVE_EFFECT necessary to apply effects
            } else {
              item.data.value = skill.value // ACTIVE_EFFECT necessary to apply effects
              item.data.rawValue = skill.rawValue
            }
          }
        }

        let list = data.itemsByType[item.type]
        if (!list) {
          list = []
          data.itemsByType[item.type] = list
        }
        list.push(item)
      }

      for (const itemType in data.itemsByType) {
        data.itemsByType[itemType].sort((a, b) => {
          return a.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .localeCompare(
              b.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLocaleLowerCase()
            )
        })
      }

      // redondant avec matrice itembytype
      data.skills = data.items
        .filter(item => item.type === 'skill')
        .sort((a, b) => {
          return a.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .localeCompare(
              b.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLocaleLowerCase()
            )
        })

      data.meleeSkills = data.skills.filter(
        skill =>
          skill.data.properties.combat === true &&
          skill.data.properties.fighting === true
      )
      data.rangeSkills = data.skills.filter(
        skill =>
          skill.data.properties.combat === true &&
          skill.data.properties.firearm === true
      )

      const cbtSkills = data.skills.filter(
        skill => skill.data.properties.combat === true
      )
      if (cbtSkills) {
        for (const skill of cbtSkills) {
          data.combatSkills[skill._id] = skill
        }
      }

      const weapons = data.itemsByType.weapon

      if (weapons) {
        for (const weapon of weapons) {
          weapon.usesAlternateSkill =
            weapon.data.properties.auto === true ||
            weapon.data.properties.brst === true
          if (!weapon.data.ammo) weapon.data.ammo = 0

          weapon.skillSet = true
          // weapon.data.skill.main.name = '';
          // weapon.data.skill.main.value = 0;
          // weapon.data.skill.alternativ.name = '';
          // weapon.data.skill.alternativ.value = 0;
          if (weapon.data.skill.main.id === '') {
            // TODO : si l'ID n'ests pas définie mais qu'un nom a été donné, utiliser ce nom et tanter de retrouver le skill
            weapon.skillSet = false
          } else {
            // TODO : avant d'assiger le skill vérifier qu'il existe toujours.
            // si il n'existe plus il faut le retrouver ou passer skillset a false.
            if (data.combatSkills[weapon.data.skill.main.id]) {
              const skill = this.actor.items.get(weapon.data.skill.main.id)
              weapon.data.skill.main.name = skill.data.data.skillName
              weapon.data.skill.main.value = skill.value
            } else {
              weapon.skillSet = false
            }

            if (weapon.data.skill.alternativ.id !== '') {
              if (data.combatSkills[weapon.data.skill.alternativ.id]) {
                const skill = this.actor.items.get(
                  weapon.data.skill.alternativ.id
                )
                weapon.data.skill.alternativ.name = skill.data.data.skillName
                weapon.data.skill.alternativ.value = skill.value
              }
            }
          }

          weapon.data._properties = []
          for (const [key, value] of Object.entries(COC7.weaponProperties)) {
            const property = {}
            property.id = key
            property.name = value
            property.value = weapon.data.properties[key] === true
            weapon.data._properties.push(property)
          }

          data.weapons[weapon._id] = weapon
          if (weapon.data.properties.rngd) data.rangeWpn.push(weapon)
          else data.meleeWpn.push(weapon)
        }
      }

      const token = this.token
      data.tokenId = token
        ? `${token.parent?.id ? token.parent.id : 'TOKEN'}.${token.id}`
        : null // REFACTORING (2)

      data.hasEmptyValueWithFormula = false
      if (data.data.characteristics) {
        for (const characteristic of Object.values(data.data.characteristics)) {
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

          data.hasEmptyValueWithFormula =
            data.hasEmptyValueWithFormula ||
            characteristic.hasEmptyValueWithFormula
        }
      }
    }

    // For compat with previous characters test if auto is definied, if not we define it
    if (!['vehicle', 'container'].includes(this.actor.data.type)) {
      const auto = this.actor.checkUndefinedAuto()
      data.data = mergeObject(data.data, auto)
    } else {
      data.data.attribs.hp.auto = false
      data.data.attribs.mp.auto = false
      data.data.attribs.san.auto = false
      data.data.attribs.mov.auto = false
      data.data.attribs.db.auto = false
      data.data.attribs.build.auto = false
    }

    // data.data.attribs.mov.value = this.actor.mov // return computed values or fixed values if not auto.
    // data.data.attribs.db.value = this.actor.db
    // data.data.attribs.build.value = this.actor.build

    // if (typeof this.actor.compendium === 'undefined' && this.actor.isOwner) {
    //   ui.notifications.info('changr spec name 4')
    //   // ACTIVE_EFFECT should be applied here
    //   // This whole part needs to be re-evaluated
    //   // Seeting this shouldn't be necessary
    //   this.actor.update(
    //     { 'data.attribs.mov.value': this.actor.mov },
    //     { render: false }
    //   )
    //   // mov.max never used
    //   // this.actor.update(
    //   //   { 'data.attribs.mov.max': this.actor.mov },
    //   //   { render: false }
    //   // )
    //   this.actor.update(
    //     { 'data.attribs.db.value': this.actor.db },
    //     { render: false }
    //   )
    //   this.actor.update(
    //     { 'data.attribs.build.current': this.actor.build },
    //     { render: false }
    //   )
    //   this.actor.update(
    //     { 'data.attribs.build.value': this.actor.build },
    //     { render: false }
    //   )
    // }

    // if( data.data.attribs.hp.value < 0) data.data.attribs.hp.value = null;
    if (data.data.attribs.mp.value < 0) data.data.attribs.mp.value = null
    if (data.data.attribs.san.value < 0) data.data.attribs.san.value = null
    // data.data.attribs.san.fiftyOfCurrent = data.data.attribs.san.value >= 0 ? ' / '+Math.floor(data.data.attribs.san.value/5):'';
    // if (data.data.attribs.hp.auto) {
    //   // TODO if any is null set max back to null.
    //   if (
    //     data.data.characteristics.siz.value != null &&
    //     data.data.characteristics.con.value != null
    //   ) {
    //     data.data.attribs.hp.max = this.actor.hpMax
    //   }
    // }

    // if (data.data.attribs.mp.auto) {
    //   // TODO if any is null set max back to null.
    //   if (data.data.characteristics.pow.value != null) {
    //     data.data.attribs.mp.max = Math.floor(
    //       data.data.characteristics.pow.value / 5
    //     )
    //   }
    // }

    // if (data.data.attribs.san.auto) {
    //   data.data.attribs.san.max = this.actor.sanMax
    // }

    // if (
    //   data.data.attribs.mp.value > data.data.attribs.mp.max ||
    //   data.data.attribs.mp.max == null
    // ) {
    //   data.data.attribs.mp.value = data.data.attribs.mp.max
    // }
    // if (
    //   data.data.attribs.hp.value > data.data.attribs.hp.max ||
    //   data.data.attribs.hp.max == null
    // ) {
    //   data.data.attribs.hp.value = data.data.attribs.hp.max
    // }

    // if (
    //   data.data.attribs.hp.value == null &&
    //   data.data.attribs.hp.max != null
    // ) {
    //   data.data.attribs.hp.value = data.data.attribs.hp.max
    // }
    // if (
    //   data.data.attribs.mp.value == null &&
    //   data.data.attribs.mp.max != null
    // ) {
    //   data.data.attribs.mp.value = data.data.attribs.mp.max
    // }

    if (!['vehicle'].includes(this.actor.data.type)) {
      if (
        data.data.attribs.san.value == null &&
        data.data.characteristics.pow.value != null
      ) {
        data.data.attribs.san.value = data.data.characteristics.pow.value
      }
      if (data.data.attribs.san.value > data.data.attribs.san.max) {
        data.data.attribs.san.value = data.data.attribs.san.max
      }

      if (data.data.biography instanceof Array && data.data.biography.length) {
        data.data.biography[0].isFirst = true
        data.data.biography[data.data.biography.length - 1].isLast = true
      }

      data.data.indefiniteInsanityLevel = {}
      data.data.indefiniteInsanityLevel.value = data.data.attribs.san.dailyLoss
        ? data.data.attribs.san.dailyLoss
        : 0
      data.data.indefiniteInsanityLevel.max = Math.floor(
        data.data.attribs.san.value / 5
      )
    }
    data.showInventoryItems = false
    data.showInventoryBooks = false
    data.showInventorySpells = false
    data.showInventoryTalents = false
    data.showInventoryStatuses = false
    data.showInventoryWeapons = false

    data.hasConditions =
      this.actor.effects.size > 0 ||
      (typeof this.actor.data.data.conditions !== 'undefined' &&
        Object.keys(this.actor.data.data.conditions).filter(
          condition => this.actor.data.data.conditions[condition].value
        ).length > 0)
    // const first = data.data.biography[0];
    // first.isFirst = true;
    // data.data.biography[0] = first;
    // const last = data.data.biography[data.data.biography.length - 1];
    // last.isLast = true;
    // data.data.biography[data.data.biography.length - 1] = last;
    return data
  }

  /* -------------------------------------------- */
  static parseFormula (formula) {
    let parsedFormula = formula
    for (const [key, value] of Object.entries(COC7.formula.actorsheet)) {
      parsedFormula = parsedFormula.replace(key, value)
    }
    return parsedFormula
  }

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

    html
      .find('.token-drag-handle')
      .on('dragstart', this._onDragTokenStart.bind(this))

    // Owner Only Listeners
    if (this.actor.isOwner && typeof this.actor.compendium === 'undefined') {
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
        .find('.characteristic-label')
        .contextmenu(this._onOpposedRoll.bind(this))
      html
        .find('.skill-name.rollable')
        .contextmenu(this._onOpposedRoll.bind(this))
      html
        .find('.attribute-label.rollable')
        .contextmenu(this._onOpposedRoll.bind(this))
      html
        .find('.weapon-name.rollable')
        .contextmenu(this._onOpposedRoll.bind(this))

      html
        .find('.characteristic-label')
        .click(this._onRollCharacteriticTest.bind(this))
      html.find('.skill-name.rollable').click(this._onRollSkillTest.bind(this))
      html.find('.skill-image').click(this._onRollSkillTest.bind(this))
      html
        .find('.attribute-label.rollable')
        .click(this._onRollAttribTest.bind(this))
      html.find('.lock').click(this._onLockClicked.bind(this))
      html.find('.flag').click(this._onFlagClicked.bind(this))
      html.find('.formula').click(this._onFormulaClicked.bind(this))
      html
        .find('.roll-characteritics')
        .click(this._onRollCharacteriticsValue.bind(this))
      html
        .find('.average-characteritics')
        .click(this._onAverageCharacteriticsValue.bind(this))
      html.find('.toggle-switch').click(this._onToggle.bind(this))
      html.find('.auto-toggle').click(this._onAutoToggle.bind(this))

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
        .find('.weapon-skill.rollable')
        .click(async event => this._onWeaponSkillRoll(event))
      html.find('.reload-weapon').click(event => this._onReloadWeapon(event))
      html
        .find('.reload-weapon')
        .on('contextmenu', event => this._onReloadWeapon(event))
      html.find('.add-ammo').click(this._onAddAmo.bind(this))
      html.find('.read-only').dblclick(this._toggleReadOnly.bind(this))
      html.on('click', '.weapon-damage', this._onWeaponDamage.bind(this))

      html.find('.inventory-header').click(this._onInventoryHeader.bind(this))
      html.find('.items-header').click(this._onItemHeader.bind(this))
      html.find('.section-header').click(this._onSectionHeader.bind(this))

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
      switch (ev.currentTarget.dataset.type) {
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
      if (typeof this.actor.data.data.conditions !== 'undefined') {
        const disable = {}
        for (const condition in this.actor.data.data.conditions) {
          if (
            typeof this.actor.data.data.conditions[condition].value !==
              'undefined' &&
            this.actor.data.data.conditions[condition].value === true
          ) {
            disable[`data.conditions.${condition}.value`] = false
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

    html.find('a.coc7-link').on('click', event => CoC7Parser._onCheck(event))
    html
      .find('a.coc7-link')
      .on('dragstart', event => CoC7Parser._onDragCoC7Link(event))

    /**
     * This is used for dev purposes only !
     */
    html.find('.test-trigger').click(async event => {
      if (!game.settings.get('CoC7', 'hiddendevmenu')) return null
      const item = await Item.create({
        name: '__CoC7InternalItem__',
        type: 'item'
      })
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
      ui.notifications.info('effect created !')
    })

    html
      .find('.skill-name.rollable')
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
      const sheet = this
      game.CoC7Tooltips.ToolTipHover = event.currentTarget
      game.CoC7Tooltips.toolTipTimer = setTimeout(function () {
        if (
          typeof game.CoC7Tooltips.ToolTipHover !== 'undefined' &&
          game.CoC7Tooltips.ToolTipHover !== null
        ) {
          const isCombat = game.CoC7Tooltips.ToolTipHover.classList?.contains(
            'combat'
          )
          const item = game.CoC7Tooltips.ToolTipHover.closest('.item')
          if (typeof item !== 'undefined') {
            const skillId = item.dataset.skillId
            const skill = sheet.actor.items.get(skillId)
            let toolTip = game.i18n.format(
              isCombat ? 'CoC7.ToolTipCombat' : 'CoC7.ToolTipSkill',
              {
                skill: skill.name,
                regular: skill.value,
                hard: Math.floor(skill.value / 2),
                extreme: Math.floor(skill.value / 5)
              }
            )
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
            const attributes = sheet.actor.data.data.attribs[attributeId]
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
                skill.data.data.flags.developement
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
      for (const [k, v] of Object.entries(e.data.permission)) {
        if (k === 'default' || k === game.user.id) {
          visible =
            visible ||
            v !==
              (CONST.DOCUMENT_OWNERSHIP_LEVELS || CONST.ENTITY_PERMISSIONS).NONE
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
        content: content,
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
      linkType: 'coc7-link',
      check: 'check',
      type: 'characteristic',
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
      linkType: 'coc7-link',
      check: 'check',
      type: 'attribute',
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
    const data = JSON.parse(dataString)
    if (data.linkType === 'coc7-link') {
      if (data.type === 'effect') {
        const link = await CoC7Link.fromData(data)
        if (link.data.effect) {
          this.actor.createEmbeddedDocuments('ActiveEffect', [link.data.effect])
        }
      }
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
    const counter = event.currentTarget.dataset.counter
    const oneFifthSanity =
      ' / ' + Math.floor(this.actor.data.data.attribs.san.value / 5)
    this.actor.setOneFifthSanity(oneFifthSanity)
    if (counter) this.actor.resetCounter(counter)
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
        event.metaKey ||
          event.ctrlKey ||
          event.keyCode === 91 ||
          event.keyCode === 224
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
      case 'data.attribs.hp.value':
        this.actor.setHp(value)
        break
      case 'data.attribs.mp.value':
        this.actor.setMp(value)
        break
      case 'data.attribs.san.value':
        this.actor.setSan(value)
        break
      case 'data.attribs.lck.value':
        this.actor.setLuck(value)
        break
      case 'data.attribs.build.current':
        this.actor.setHp(value)
        break
    }
  }

  _toggleReadOnly (event) {
    event.currentTarget.readOnly = !event.currentTarget.readOnly
    event.currentTarget.classList.toggle('read-only')
  }

  _onItemSummary (event) {
    event.preventDefault()
    const li = $(event.currentTarget).parents('.item')
    const item = this.actor.items.get(li.data('item-id'))
    const chatData = item.getChatData({ secrets: this.actor.isOwner })

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary')
      summary.slideUp(200, () => summary.remove())
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

      if (item.data.data.properties?.spcl) {
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
      CoC7Parser.bindEventsHandler(div)
      div.slideDown(200, () => li.toggleClass('expanded'))
    }
    // $(event.currentTarget).toggleClass('expanded');
  }

  _onSectionHeader (event) {
    event.preventDefault()
    // let section = $(event.currentTarget).parents('section'),
    //  pannelClass = $(event.currentTarget).data('pannel'),
    //  pannel = section.find( `.${pannelClass}`);
    // pannel.toggle();
    const section = event.currentTarget.closest('section')
    const pannelClass = event.currentTarget.dataset.pannel
    const pannel = $(section).find(`.pannel.${pannelClass}`)
    // pannel.toggle();
    if (pannel.hasClass('expanded')) {
      // Could remove expanded class and use (pannel.is(':visible'))
      pannel.slideUp(200, () => pannel.toggleClass('expanded'))
    } else {
      pannel.slideDown(200, () => pannel.toggleClass('expanded'))
    }
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
    skill.data.data.description.enrichedValue = TextEditor.enrichHTML(
      skill.data.data.description.value
    )
    // game.CoC7.enricher( skill.data.data.description.enrichedValue);
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
        check: 'item',
        type: 'weapon',
        name: weapon.name,
        hasPlayerOwner: this.actor.hasPlayerOwner,
        actorKey: this.actor.actorKey
      }

      CoC7LinkCreationDialog.fromLinkData(linkData).then(dlg =>
        dlg.render(true)
      )
    } else {
      let proceedWithoutTarget
      if (game.user.targets.size <= 0) {
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
        if (!weapon.data.data.properties.rngd) {
          if (game.user.targets.size > 1) {
            ui.notifications.warn(game.i18n.localize('CoC7.WarnTooManyTarget'))
          }

          const card = new CoC7MeleeInitiator(actorKey, itemId, fastForward)
          card.createChatCard()
        }
        if (weapon.data.data.properties.rngd) {
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
      range: range
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
      event: event,
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
    CoC7ChatMessage.trigger({
      rollType: CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC,
      cardType: CoC7ChatMessage.CARD_TYPE_NORMAL,
      event: event,
      actor: this.actor
    })
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

    CoC7ChatMessage.trigger({
      rollType: CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE,
      cardType:
        event.altKey && attrib === 'san'
          ? CoC7ChatMessage.CARD_TYPE_SAN_CHECK
          : CoC7ChatMessage.CARD_TYPE_NORMAL,
      event: event,
      actor: this.actor
    })
  }

  /**
   * Handle rolling a Skill check
   * @param {Event} event   The originating click event
   * @private
   */
  _onRollSkillTest (event) {
    event.preventDefault()
    if (event.currentTarget.classList.contains('flagged4dev')) return
    CoC7ChatMessage.trigger({
      rollType: CoC7ChatMessage.ROLL_TYPE_SKILL,
      cardType: CoC7ChatMessage.CARD_TYPE_NORMAL,
      event: event,
      actor: this.actor
    })
  }

  /** @override */
  // _getSubmitData(updateData={}) {

  //  // Create the expanded update data object
  //  const fd = new FormDataExtended(this.form, {editors: this.editors});
  //  let data = fd.toObject();
  //  if ( updateData ) data = mergeObject(data, updateData);
  //  else data = expandObject(data);

  //  // Handle Damage array
  //  const damage = data.data?.damage;
  //  if ( damage ) damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || '', d[1] || '']);

  //  // Return the flattened submission data
  //  return flattenObject(data);
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
        game.i18n.format('CoC7.EffectAppliedCantOverride', { name: name })
      )
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
            if (game.i18n.localize(COC7.creditRatingSkillName) === item.name) {
              const creditValue =
                (item.value || 0) -
                (item.data.data.adjustments?.experience || 0)
              if (
                creditValue >
                  Number(this.actor.occupation.data.data.creditRating.max) ||
                creditValue <
                  Number(this.actor.occupation.data.data.creditRating.min)
              ) {
                ui.notifications.warn(
                  game.i18n.format('CoC7.CreditOutOfRange', {
                    min: Number(
                      this.actor.occupation.data.data.creditRating.min
                    ),
                    max: Number(
                      this.actor.occupation.data.data.creditRating.max
                    )
                  })
                )
              }
            }
          }
        }

        if (event.currentTarget.classList.contains('attribute-value')) {
          // TODO : check why SAN only ?
          if (event.currentTarget.name === 'data.attribs.san.value') {
            this.actor.setSan(parseInt(event.currentTarget.value))
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
            if (item.data.data.properties.special) {
              const parts = CoC7Item.getNamePartsSpec(
                event.currentTarget.value,
                item.data.data.specialization
              )
              data.name = parts.name
              data['data.skillName'] = parts.skillName
              data['data.specialization'] = parts.specialization
            } else {
              data['data.skillName'] = event.currentTarget.value
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
                  'data.skill.main.id': skill.id,
                  'data.skill.main.name': skill.name
                })
                break
              case 'alternativ':
                await weapon.update({
                  'data.skill.alternativ.id': skill.id,
                  'data.skill.alternativ.name': skill.name
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
                      'data.range.normal.damage': event.currentTarget.value
                    })
                    break
                  case 'long':
                    await weapon.update({
                      'data.range.long.damage': event.currentTarget.value
                    })
                    break
                  case 'extreme':
                    await weapon.update({
                      'data.range.extreme.damage': event.currentTarget.value
                    })
                    break
                }
              }
            } else {
              switch (event.currentTarget.dataset.range) {
                case 'normal':
                  await weapon.update({
                    'data.range.normal.damage': null
                  })
                  break
                case 'long':
                  await weapon.update({
                    'data.range.long.damage': null
                  })
                  break
                case 'extreme':
                  await weapon.update({
                    'data.range.extreme.damage': null
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
