/* global Actor CONFIG CONST foundry fromUuid game TextEditor */
import { STATUS_EFFECTS } from '../constants.js'
import deprecated from '../deprecated.js'

export default class CoC7ActiveEffect {
  /**
   * Manage Active Effect instances through the Actor Sheet via effect control buttons.
   * @param {ClickEvent} event
   * @param {Document} owner
   * @returns {Document}
   */
  static async #onManageActiveEffect (event, owner) {
    event.preventDefault()
    const button = event.currentTarget
    const li = button.closest('li')
    const effect = li.dataset.effectUuid ? await fromUuid(li.dataset.effectUuid) : null
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
   * @param {HTMLElement} element
   * @param {Actor|Item} owner
   */
  static _onRender (element, owner) {
    // Active Effects
    element.querySelectorAll('.effect-control').forEach((element2) => element2.addEventListener('click', (event) => {
      element.dispatchEvent(new Event('change')) // Submit any unsaved changes
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
   * Get simplified data
   * @param {Document} effect
   * @param {object} object
   * @param {boolean} object.embeddedItem
   * @returns {Promise<object>}
   */
  static async effectData (effect, { embeddedItem = false }) {
    const readable = []
    /* // FoundryVTT V13 */
    const changes = (game.release.generation < 14 ? effect.changes : effect.system.changes)
    for (const change of changes) {
      /* // FoundryVTT V13 */
      const changeType = (game.release.generation < 14 ? (change.mode === CONST.ACTIVE_EFFECT_MODES.ADD ? 'add' : (change.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE? 'override' : 'other')) : change.type)
      if (['add', 'override'].includes(changeType)) {
        let name = false
        let what = false
        let unit = ''
        const match = change.key.match(/^system\.skills\.(i(\.|>>)skill(\.|>>))?(.+)\.system\.(bonusDice|value)$/)
        if (match) {
          let key = match[4]
          if (typeof match[1] !== 'undefined') {
            key = 'i>>skill>>' + key
          }
          what = match[5]
          unit = '%'
          /* // FoundryVTT V13 */
          if (game.release.generation < 14 && effect.parent instanceof Actor) {
            name = effect.parent.system.skills[key]?.name ?? key.replace(/>>/g, '.')
          } else if (typeof effect.actor?.system.skills[key] !== 'undefined') {
            name = effect.actor.system.skills[key].name
          } else {
            name = key.replace(/>>/g, '.')
          }
        } else {
          const match = change.key.match(/^system\.(characteristics|attribs|config)\.([^.]+)\.(bonusDice|max|value)$/)
          if (match && (match[3] !== 'max' || match[1] === 'attribs')) {
            what = match[3]
            switch (match[1]) {
              case 'attribs':
                name = game.i18n.localize(CONFIG.Actor.dataModels.character.defineSchema().attribs.getField(match[2])?.hint ?? false)
                if (['lck', 'san'].includes(match[2])) {
                  unit = '%'
                }
                break
              case 'characteristics':
                name = game.i18n.localize(CONFIG.Actor.dataModels.character.defineSchema().characteristics.getField(match[2])?.hint ?? false)
                unit = '%'
                break
              case 'config':
                switch (match[2]) {
                  case 'idea':
                    name = game.i18n.localize('CoC7.IdeaCheck')
                    unit = '%'
                    break
                  case 'know':
                    name = game.i18n.localize('CoC7.KnowCheck')
                    unit = '%'
                    break
                }
                break
            }
          } else {
            const match = change.key.match(/^system.config.(luckRecovery|naturalHealing)$/)
            if (match) {
              what = 'value'
              switch (match[1]) {
                case 'luckRecovery':
                  name = game.i18n.localize('CoC7.RecoverLuckPoints')
                  break
                case 'naturalHealing':
                  name = game.i18n.localize('CoC7.ActorConfig.NaturalHealing')
                  break
              }
            }
          }
        }
        switch (what) {
          case 'value':
            what = (changeType === 'add' ? (change.value < 0 ? '' : '+') : '=') + change.value + unit
            break
          case 'max':
            what = (changeType === 'add' ? (change.value < 0 ? '' : '+') : '=') + change.value + ' ' + game.i18n.localize('CoC7.Maximum')
            break
          case 'bonusDice':
            if (change.value < 0) {
              what = (changeType === 'add' ? '+' : '=') + Math.abs(change.value) + ' ' + game.i18n.localize('CoC7.DiceModifierPenalty') + ' ' + game.i18n.localize('CoC7.Dice')
            } else if (change.value > 0) {
              what = (changeType === 'add' ? '+' : '=') + Math.abs(change.value) + ' ' + game.i18n.localize('CoC7.DiceModifierBonus') + ' ' + game.i18n.localize('CoC7.Dice')
            } else {
              what = (changeType === 'add' ? '+' : '=') + Math.abs(change.value) + ' ' + game.i18n.localize('CoC7.DiceModifierBonus') + ' ' + game.i18n.localize('CoC7.Dice')
            }
            break
        }
        if (name !== false && what !== false) {
          readable.push(name + ' ' + what)
        } else {
          readable.push(change.key + ' ' + (changeType === 'add' ? (change.value < 0 ? '' : '+') : '=') + change.value)
        }
      } else {
        readable.push(change.key + ' ' + changeType + ' ' + change.value)
      }
    }
    return {
      uuid: effect.uuid,
      img: effect.img,
      name: effect.name,
      /* // FoundryVTT V12 */
      source: effect.transfer && embeddedItem ? await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(effect.parent.link, { async: true }) : effect.sourceName,
      duration: effect.duration.label,
      isSuppressed: effect.isSuppressed,
      isTemporary: effect.isTemporary,
      disabled: effect.disabled,
      readable: (readable.length > 0 ? '<ul class="active-effect-adjustments"><li>' + readable.join('</li><li>') + '</li></ul>' : '')
    }
  }

  /**
   * Sort Actor effects into categories
   * @param {Document} document
   * @param {options} options
   * @param {boolean} options.status
   * @returns {Promise<object>}
   */
  static async prepareActiveEffectCategories (document, { status = true } = {}) {
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
    for (const e of document.effects ?? []) {
      const effect = await CoC7ActiveEffect.effectData(e, { embeddedItem: false })
      if (effect.isSuppressed) {
        categories.suppressed.effects.push(effect)
      } else if (CoC7ActiveEffect.getStatusKey(e) && status) {
        categories.status.effects.push(effect)
      } else if (effect.disabled) {
        categories.inactive.effects.push(effect)
      } else if (effect.isTemporary) {
        categories.temporary.effects.push(effect)
      } else {
        categories.passive.effects.push(effect)
      }
    }
    for (const i of document.items ?? []) {
      for (const e of i.effects) {
        const effect = await CoC7ActiveEffect.effectData(e, { embeddedItem: true })
        if (effect.isSuppressed) {
          categories.suppressed.effects.push(effect)
        } else if (CoC7ActiveEffect.getStatusKey(e) && status) {
          categories.status.effects.push(effect)
        } else if (effect.disabled) {
          categories.inactive.effects.push(effect)
        } else if (effect.isTemporary) {
          categories.temporary.effects.push(effect)
        } else {
          categories.passive.effects.push(effect)
        }
      }
    }

    categories.suppressed.hidden = !categories.suppressed.effects.length
    return categories
  }

  /**
   * Sort Actor effects into categories
   * @param {Document} document
   * @returns {Promise<object>}
   */
  static async prepareNPCActiveEffectCategories (document) {
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
    for (const e of document.effects ?? []) {
      const effect = await CoC7ActiveEffect.effectData(e, { embeddedItem: false })
      if (effect.isSuppressed || effect.disabled) {
        categories.inactive.effects.push(effect)
      } else {
        categories.active.effects.push(effect)
      }
    }
    for (const i of document.items ?? []) {
      for (const e of i.effects) {
        const effect = await CoC7ActiveEffect.effectData(e, { embeddedItem: true })
        if (effect.isSuppressed || effect.disabled) {
          categories.inactive.effects.push(effect)
        } else {
          categories.active.effects.push(effect)
        }
      }
    }
    return categories
  }
}
