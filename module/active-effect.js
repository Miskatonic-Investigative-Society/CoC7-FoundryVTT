/* global ActiveEffect, game */
import { COC7 } from './config.js'

export default class CoC7ActiveEffect extends ActiveEffect {
  apply (actor, change) {
    if (change.key === 'system.attribs.armor.value') {
      // Armor can be free text if both are numbers allow calculation
      if (!isNaN(change.value) && !isNaN(actor.system.attribs.armor.value)) {
        actor.system.attribs.armor.value = Number(actor.system.attribs.armor.value)
      }
    } else if (change.key === 'system.attribs.db.value') {
      // If db is currently a number allow strings to be applied
      if (isNaN(change.value) && !isNaN(actor.system.attribs.db.value)) {
        actor.system.attribs.db.value = String(actor.system.attribs.db.value)
      }
    }
    const changes = super.apply(actor, change)
    return changes
  }

  /**
   * Manage Active Effect instances through the Actor Sheet via effect control buttons.
   * @param {MouseEvent} event      The left-click event on the effect control
   * @param {Actor|Item} owner      The owning document which manages this effect
   * @returns {Promise|null}        Promise that resolves when the changes are complete.
   */
  static onManageActiveEffect (event, owner) {
    event.preventDefault()
    const a = event.currentTarget
    const li = a.closest('li')
    const effect = li.dataset.effectId
      ? owner.effects.get(li.dataset.effectId)
      : null
    switch (a.dataset.action) {
      case 'create':
        return owner.createEmbeddedDocuments('ActiveEffect', [
          {
            label: game.i18n.localize('CoC7.EffectNew'),
            icon: 'icons/svg/aura.svg',
            origin: owner.uuid,
            'duration.rounds':
              li.dataset.effectType === 'temporary' ? 1 : undefined,
            disabled: li.dataset.effectType === 'inactive'
          }
        ])
      case 'edit':
        return effect.sheet.render(true)
      case 'delete':
        return effect.delete()
      case 'toggle':
        return effect.update({ disabled: !effect.disabled })
    }
  }

  _prepareDuration () {
    const duration = super._prepareDuration()
    if (duration.type === 'seconds') {
      if (duration.seconds > 3600) {
        duration.label = new Date(duration.seconds * 1000).toISOString().slice(11, 19)
      } else if (duration.seconds > 100) {
        duration.label = new Date(duration.seconds * 1000).toISOString().slice(14, 19)
      }
    }
    return duration
  }

  static filterActiveEffects (effect, conditionName) {
    return effect.statuses.has(conditionName)
  }

  static getStatusKey (effect) {
    let options = []
    if (effect.statuses.size > 0) {
      options = [...effect.statuses.values()]
    }
    return options.find(v => Object.prototype.hasOwnProperty.call(COC7.status, v))
  }

  get isStatus () {
    return typeof CoC7ActiveEffect.getStatusKey(this) === 'string'
  }

  static prepareActiveEffectCategories (effects, { status = true } = {}) {
    // Define effect header categories
    const categories = {
      temporary: {
        type: 'temporary',
        label: game.i18n.localize('CoC7.Temporary'),
        effects: []
      },
      passive: {
        type: 'passive',
        label: game.i18n.localize('CoC7.Passive'),
        effects: []
      },
      inactive: {
        type: 'inactive',
        label: game.i18n.localize('CoC7.Inactive'),
        effects: []
      },
      suppressed: {
        type: 'suppressed',
        label: game.i18n.localize('CoC7.Suppressed'),
        effects: [],
        info: [game.i18n.localize('CoC7.Unavailable')]
      }
    }

    if (status) {
      categories.status = {
        type: 'status',
        label: game.i18n.localize('Status'),
        effects: []
      }
    }
    // Iterate over active effects, classifying them into categories
    for (const e of effects) {
      if (e.isSuppressed) categories.suppressed.effects.push(e)
      else if (e.isStatus) categories.status.effects.push(e)
      else if (e.disabled) categories.inactive.effects.push(e)
      else if (e.isTemporary) categories.temporary.effects.push(e)
      else categories.passive.effects.push(e)
    }

    categories.suppressed.hidden = !categories.suppressed.effects.length
    return categories
  }

  static prepareNPCActiveEffectCategories (effects) {
    let count = 0
    // Define effect header categories
    const categories = {
      active: {
        type: 'active',
        label: game.i18n.localize('Active'),
        effects: []
      },
      inactive: {
        type: 'inactive',
        label: game.i18n.localize('Inactive'),
        effects: []
      }
    }
    // Iterate over active effects, classifying them into categories
    for (const e of effects) {
      count += 1
      // e._getSourceName() // Trigger a lookup for the source name
      if (e.isSuppressed || e.disabled) categories.inactive.effects.push(e)
      else categories.active.effects.push(e)
    }

    if (count > 0) categories.expended = true
    return categories
  }
}
