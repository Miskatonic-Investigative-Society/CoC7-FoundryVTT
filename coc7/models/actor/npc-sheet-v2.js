/* global ChatMessage CONFIG CONST foundry fromUuid game renderTemplate Roll TextEditor ui */
import { FOLDER_ID } from '../../constants.js'
import CoC7DicePool from '../../apps/dice-pool.js'
import CoC7Link from '../../apps/link.js'
import CoC7ModelsActorGlobalSheet from './global-sheet.js'
import CoC7RollNormalize from '../../apps/roll-normalize.js'
import CoC7SanCheckCard from '../../apps/san-check-card.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsActorNPCSheetV2 extends CoC7ModelsActorGlobalSheet {
  static DEFAULT_OPTIONS = {
    classes: ['npc'],
    position: {
      width: 650
    }
  }

  static PARTS = {
    body: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/npc-v2/body.hbs',
      scrollable: ['section.tab-group-tab']
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    context.isKeeper = game.user.isGM

    context.showInventoryWeapons = false
    context.hasInventory = this.hasInventory(context)

    /* // FoundryVTT V12 */
    context.enrichedBiographyPersonalDescription = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
      context.document.system.biography.personalDescription.value,
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

    context.weaponSkillGroups = context.document.weaponSkillGroups()

    context.movementTypes = Object.keys(CONFIG.Token.movement.actions).reduce((c, i) => {
      c.push({
        id: i,
        name: CONFIG.Token.movement.actions[i].label,
        order: CONFIG.Token.movement.actions[i].order
      })
      return c
    }, []).sort((a, b) => {
      return a.order - b.order
    })

    context.macros = await context.document.system.special.macros.reduce(async (c, i) => {
      const carry = await c
      const macro = await fromUuid(i.uuid)
      if (macro) {
        carry.push({
          uuid: macro.uuid,
          img: macro.img,
          name: macro.name
        })
      }
      return carry
    }, [])

    context.attacksRollable = !!(context.document.system.special?.attacksPerRound?.toString().match(/[d@]/i))

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

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
      event.preventDefault()
      switch (event.currentTarget.dataset.action) {
        case 'movement-add':
          this._onMovementAdd(event)
          break
        case 'movement-remove':
          this._onMovementRemove(event)
          break
        case 'remove-macro':
          this._onMacroRemove(event)
          break
        case 'execute-macro':
          this._onMacroExecute(event)
          break
      }
    }))
    this.element.querySelector('.attacks-per-round.rollable')?.addEventListener('click', async (event) => {
      const roll = await new Roll(this.actor.system.special.attacksPerRound, this.actor.parsedValues()).roll()
      const tooltip = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(Roll.TOOLTIP_TEMPLATE, { parts: roll.dice.map(d => d.getTooltipData()) })
      const content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(Roll.CHAT_TEMPLATE, {
        formula: roll.formula,
        tooltip,
        total: roll.total
      })
      ChatMessage.create({
        speaker: {
          alias: this.actor.name
        },
        content,
        flavor: game.i18n.localize('CoC7.AttacksPerRound'),
        whisper: [game.user.id]
      })
    })
    this.element.querySelectorAll('.weapon-edit').forEach((element) => element.addEventListener('change', async (event) => {
      const itemUuid = event.currentTarget.closest('.item').dataset.itemUuid
      if (itemUuid) {
        const weapon = await fromUuid(itemUuid)
        if (weapon) {
          switch (event.currentTarget?.dataset.field) {
            case 'name':
              await weapon.update({ name: event.currentTarget.value })
              break
            case 'normal':
            case 'long':
            case 'extreme':
              {
                const value = event.currentTarget.value
                if (Roll.validate(value)) {
                  await weapon.update({
                    ['system.range.' + event.currentTarget.dataset.field + '.damage']: value
                  })
                } else {
                  /* // FoundryVTT V12 */
                  ui.notifications.error(game.i18n.format('CoC7.ErrorUnableToParseFormula', {
                    value
                  }))
                  event.currentTarget.focus()
                }
              }
              break
            case 'main':
            case 'alternativ':
              {
                const skill = this.document.items.get(event.currentTarget.value)
                if (skill) {
                  const updates = {
                    ['system.skill.' + event.currentTarget.dataset.field + '.id']: skill.id,
                    ['system.skill.' + event.currentTarget.dataset.field + '.name']: skill.name
                  }
                  await weapon.update(updates)
                }
              }
              break
          }
        }
      }
    }))

    // Everything below here is not available if in compendium
    /* // FoundryVTT V12 */
    if (context.document.inCompendium ?? !!context.document.pack) return

    this.element.querySelector('.roll-san')?.addEventListener('click', this._onSanCheck.bind(this))
  }

  /**
   * Add new movement type
   */
  _onMovementAdd () {
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const movement = this.actor.system.special.movement ? foundry.utils.duplicate(this.actor.system.special.movement) : []
    movement.push({
      value: '',
      type: 'walk'
    })
    this.actor.update({ 'system.special.movement': movement })
  }

  /**
   * Remove clicked movement type
   * @param {ClickEvent} event
   */
  _onMovementRemove (event) {
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const a = event.currentTarget
    if (typeof a.dataset.index !== 'undefined') {
      const movement = foundry.utils.duplicate(this.actor.system.special.movement)
      movement.splice(Number(a.dataset.index), 1)
      this.actor.update({ 'system.special.movement': movement })
    }
  }

  /**
   * Remove clicked macro
   * @param {ClickEvent} event
   */
  _onMacroRemove (event) {
    this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
    const a = event.currentTarget
    if (typeof a.dataset.index !== 'undefined') {
      const macros = foundry.utils.duplicate(this.actor.system.special.macros)
      macros.splice(Number(a.dataset.index), 1)
      this.actor.update({ 'system.special.macros': macros })
    }
  }

  /**
   * Run clicked macro
   * @param {ClickEvent} event
   */
  async _onMacroExecute (event) {
    const a = event.currentTarget
    if (typeof a.dataset.uuid !== 'undefined') {
      const macro = await fromUuid(a.dataset.uuid)
      if (macro) {
        macro.execute({
          speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.token }),
          actor: this.actor,
          token: this.token,
          event
        })
      }
    }
  }

  /**
   * Run clicked macro
   * @param {ClickEvent} event
   */
  async _onSanCheck (event) {
    event.preventDefault()
    if (!this.document.system.special.sanLoss.checkPassed && !this.document.system.special.sanLoss.checkFailled) {
      return
    }
    if (CoC7Utilities.isCtrlKey(event) && game.user.isGM) {
      let difficulty, poolModifier
      if (!event.shiftKey) {
        const options = {
          cardTypeFixed: true,
          difficulty: CoC7DicePool.difficultyLevel[game.settings.get(FOLDER_ID, 'defaultCheckDifficulty')],
          disableFlatDiceModifier: true
        }
        await CoC7RollNormalize.createRoll(options)
        difficulty = options.difficulty
        poolModifier = options.poolModifier
      }
      const link = await CoC7Link.fromDropData({
        check: CoC7Link.CHECK_TYPE.SANLOSS,
        sanMax: this.document.system.special.sanLoss.checkFailled,
        sanMin: this.document.system.special.sanLoss.checkPassed,
        sanReason: this.document.system.infos.type?.length ? this.document.system.infos.type : this.document.name,
        difficulty,
        poolModifier,
        blind: game.settings.get('core', 'rollMode') === CONST.DICE_ROLL_MODES.BLIND
      })
      link.toChatMessage()
    } else {
      const sanData = {
        sanMax: this.document.system.special.sanLoss.checkFailled,
        sanMin: this.document.system.special.sanLoss.checkPassed,
        sanReason: this.document.system.infos.type?.length ? this.document.system.infos.type : this.document.name,
        sourceUuid: CoC7Utilities.getActorUuid(this.document)
      }
      CoC7SanCheckCard.checkTargets(sanData)
    }
  }

  /**
   * Closing NPC Sheet
   * @param {object} options
   */
  _onClose (options) {
    super._onClose(options)
    if (this.isEditable) {
      this.document.update({ 'system.flags.displayFormula': false })
    }
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
}
