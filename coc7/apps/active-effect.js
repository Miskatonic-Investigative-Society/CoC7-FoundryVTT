/* global game */
import { STATUS_EFFECTS } from '../constants.js'
import deprecated from '../deprecated.js'

export default class CoC7ActiveEffect {
  /**
   * Manage Active Effect instances through the Actor Sheet via effect control buttons.
   * @param {ClickEvent} event
   * @param {Document} owner
   * @returns {Document}
   */
  static #onManageActiveEffect (event, owner) {
    event.preventDefault()
    const button = event.currentTarget
    const li = button.closest('li')
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null
    switch (button.dataset.action) {
      case 'create':
        return owner.createEmbeddedDocuments('ActiveEffect', [
          {
            name: game.i18n.localize('CoC7.EffectNew'),
            img: 'icons/svg/aura.svg',
            origin: owner.uuid,
            'duration.rounds': li.dataset.effectType === 'temporary' ? 1 : undefined,
            disabled: li.dataset.effectType === 'inactive'
          }
        ])
      case 'edit':
        return effect.sheet.render(deprecated.renderForce)
      case 'delete':
        return effect.delete()
      case 'toggle':
        return effect.update({ disabled: !effect.disabled })
    }
  }

  /**
   * Add click event listeners
   * @param {MouseEvent} element
   * @param {Actor|Item} owner
   */
  static _onRender (element, owner) {
    // Active Effects
    element.querySelectorAll('.effect-control').forEach((element) => element.addEventListener('click', (event) => {
      CoC7ActiveEffect.#onManageActiveEffect(event, owner)
    }))
  }

  /**
   * Find first status key that is for the system
   * @param {Document} effect
   * @returns {boolean}
   */
  static getStatusKey (effect) {
    const keys = Object.keys(STATUS_EFFECTS)
    return effect.statuses.find(key => keys.includes(key))
  }

  /**
   * Find status keys that is for the system
   * @param {Document} effect
   * @returns {Array}
   */
  static getStatusKeys (effect) {
    const keys = Object.keys(STATUS_EFFECTS)
    return effect.statuses.filter(key => keys.includes(key))
  }

  /**
   * Sort Actor effects into categories
   * @param {object} effects
   * @param {options} options
   * @param {boolean} options.status
   * @returns {object}
   */
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
      if (e.isSuppressed) {
        categories.suppressed.effects.push(e)
      } else if (CoC7ActiveEffect.getStatusKey(e) && status) {
        categories.status.effects.push(e)
      } else if (e.disabled) {
        categories.inactive.effects.push(e)
      } else if (e.isTemporary) {
        categories.temporary.effects.push(e)
      } else {
        categories.passive.effects.push(e)
      }
    }

    categories.suppressed.hidden = !categories.suppressed.effects.length
    return categories
  }

  /**
   * Sort Actor effects into categories
   * @param {object} effects
   * @returns {object}
   */
  static prepareNPCActiveEffectCategories (effects) {
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
      if (e.isSuppressed || e.disabled) {
        categories.inactive.effects.push(e)
      } else {
        categories.active.effects.push(e)
      }
    }
    return categories
  }
}
