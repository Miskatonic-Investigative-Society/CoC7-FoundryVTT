import { FOLDER_ID, DICE_POOL_REASONS, TALENT_ADJUSTMENT_TYPES } from '../../constants.js'
import CoC7ActiveEffect from '../../apps/active-effect.js'
import CoC7ModelsItemGlobalSheet from './global-sheet.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemTalentSheet extends CoC7ModelsItemGlobalSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 525,
      height: 480
    }
  }

  static PARTS = {
    header: {
      template: 'systems/' + FOLDER_ID + '/templates/items/talent-header.hbs'
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    description: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-properties-description.hbs',
      scrollable: ['']
    },
    details: {
      template: 'systems/' + FOLDER_ID + '/templates/items/talent-tab-details.hbs',
      scrollable: ['']
    },
    adjustments: {
      template: 'systems/' + FOLDER_ID + '/templates/items/talent-tab-adjustments.hbs',
      scrollable: ['']
    },
    activeEffects: {
      template: 'systems/' + FOLDER_ID + '/templates/items/common-tab-active-effects.hbs',
      scrollable: ['']
    },
    keeper: {
      template: 'systems/' + FOLDER_ID + '/templates/items/talent-tab-keeper.hbs',
      scrollable: ['']
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    const tabs = {
      description: {
        icon: '',
        label: 'CoC7.Description'
      },
      details: {
        icon: '',
        label: 'CoC7.Details'
      },
      adjustments: {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-knot',
        tooltip: 'CoC7.TalentAdjustments'
      },
      activeEffects: {
        cssClass: 'icon-only-tab',
        icon: 'game-icon game-icon-aura',
        tooltip: 'CoC7.Effects'
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

    context.effects = await CoC7ActiveEffect.prepareActiveEffectCategories(context.document, { status: false })

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

    switch (partId) {
      case 'description':
        context._properties = []
        for (const [value, field] of context.document.system.schema.getField('type').entries()) {
          if (context.document.system.type[value] === true) {
            context._properties.push(field.label)
          }
        }
        context.enrichedDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.description.value,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'details':
        context._types = []
        for (const [value, field] of context.document.system.schema.getField('type').entries()) {
          context._types.push({
            value,
            label: field.label,
            tooltip: field.hint,
            isEnabled: context.document.system.type[value] === true
          })
        }
        context._usable = []
        for (const [value, field] of context.document.system.schema.getField('usable').entries()) {
          context._usable.push({
            value,
            label: field.label,
            tooltip: field.hint,
            isEnabled: context.document.system.usable[value] === true
          })
        }
        context.enrichedDescriptionNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.document.system.description.notes,
          {
            async: true,
            secrets: context.editable
          }
        )
        break
      case 'adjustments':
        context.activeEffectsAdjustments = ''
        for (const key of Object.keys(context.effects)) {
          for (const effect of context.effects[key].effects) {
            context.activeEffectsAdjustments += effect.readable
          }
        }
        context._types = [{
          value: 'fixed',
          label: game.i18n.localize('CoC7.TalentReductionFixed')
        }, {
          value: 'percent',
          label: game.i18n.localize('CoC7.TalentReductionPercent')
        }, {
          value: 'ratio',
          label: game.i18n.localize('CoC7.TalentReductionRatio')
        }]
        context._adjustmentTypes = Object.entries(TALENT_ADJUSTMENT_TYPES).reduce((c, e) => { c.push({ value: e[0], label: game.i18n.localize(e[1].label) }); return c }, []).sort(CoC7Utilities.sortByLabelKey)
        context._combatPoolKeys = Object.entries(DICE_POOL_REASONS).reduce((c, e) => { if (e[1].ifAttacker || e[1].ifDefender) { c.push({ value: e[0], label: game.i18n.localize(e[1].label) + ' (' + [(e[1].forMelee ? game.i18n.localize('CoC7.Weapon.Property.Melee') : false), (e[1].forRanged ? game.i18n.localize('CoC7.WeaponRanged') : false)].filter(t => t).join(' / ') + ')' }) } return c }, []).sort(CoC7Utilities.sortByLabelKey)
        context._investigatorKeys = []
        for (const [value, field] of CONFIG.Actor.dataModels.character.schema.getField('attribs').entries()) {
          if (['lck', 'san'].includes(value)) {
            context._investigatorKeys.push({
              value,
              label: game.i18n.localize(field.hint)
            })
          }
        }
        for (const [value, field] of CONFIG.Actor.dataModels.character.schema.getField('characteristics').entries()) {
          context._investigatorKeys.push({
            value,
            label: game.i18n.localize(field.hint)
          })
        }
        context._investigatorKeys.sort(CoC7Utilities.sortByLabelKey)
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

    this.element.querySelectorAll('.change-type').forEach((element) => element.addEventListener('change', (event) => {
      event.stopPropagation()
      const type = event.currentTarget.value
      const index = event.currentTarget.closest('.adjustable-list-item').dataset.index
      if (type && index) {
        const adjustments = foundry.utils.duplicate(this.document.system.adjustments)
        adjustments[index] = this.document.system.prepareAdjustmentChange(type)
        this.document.update({
          'system.adjustments': adjustments
        })
      }
    }))

    this.element.querySelectorAll('.item-control').forEach((element) => element.addEventListener('click', (event) => {
      switch (event.currentTarget.dataset.action) {
        case 'adjustments-add':
          {
            event.preventDefault()
            this.scrollToNewLast('div.cost-list-section')
            this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
            this.document.update({
              'system.adjustments': this.document.system.adjustments.concat([this.document.system.prepareAdjustmentChange('disableCombatPool')])
            })
          }
          break
        case 'adjustments-remove':
          {
            event.preventDefault()
            this.element.dispatchEvent(new Event('change')) // Submit any unsaved changes
            const item = event.currentTarget.closest('.adjustable-list-item')
            if (item && typeof item.dataset.index !== 'undefined') {
              const index = Number(item.dataset.index)
              const adjustments = foundry.utils.duplicate(this.document.system.adjustments)
              adjustments.splice(index, 1)
              this.document.update({ 'system.adjustments': adjustments })
            }
          }
          break
      }
    }))

    new foundry.applications.ux.DragDrop({
      dropSelector: '.adjustable-item-row',
      permissions: {
        drop: game.user.isGM
      },
      callbacks: {
        drop: this._onDropItem.bind(this)
      }
    }).bind(this.element)
  }

  /**
   * Handle a dropped Item on the Actor Sheet.
   * @param {DragEvent} event
   */
  async _onDropItem (event) {
    const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
    const index = event.currentTarget.closest('.adjustable-list-item')?.dataset?.index ?? ''
    if (typeof this.document.system.adjustments[index] !== 'undefined' && dataList.type === 'Item' && typeof dataList.uuid === 'string' && this.isEditable) {
      const item = await fromUuid(dataList.uuid)
      if (item.type === 'skill' && ['addSkillChoice', 'showOnSkillCheck'].includes(this.document.system.adjustments[index].type) && (item.flags?.[FOLDER_ID]?.cocidFlag?.id ?? '').length) {
        const adjustments = foundry.utils.duplicate(this.document.system.adjustments)
        adjustments[index].config.cocid = item.flags[FOLDER_ID].cocidFlag.id
        await this.document.update({
          'system.adjustments': adjustments
        })
      }
    }
  }
}
