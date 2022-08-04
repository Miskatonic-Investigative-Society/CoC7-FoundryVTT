/* global ActiveEffect, game */

export default class CoC7ActiveEffect extends ActiveEffect {
  /** @inheritdoc */
  apply (actor, change) {
    // this access skills only localy : items._source.0.data.adjustments.experience
    // if (change.key?.startsWith('skill')) {
    //   this.applyToSkill(actor, change)
    //   return null
    // }
    return super.apply(actor, change)
  }

  // async applyToSkill (actor, change) {
  //   const [, skillName, key] = change.key.split('.')
  //   const skill = actor.getSkillsByName(skillName)
  //   if (skill) {
  //     await skill[0].applyModifier(change)
  //   }
  // }

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
        return effect.update({ disabled: !effect.data.disabled })
    }
  }

  /**
   * @override
   */
  get duration () {
    const d = this.data.duration
    const duration = super.duration
    if (Number.isNumeric(d.seconds)) {
      let label = duration.label
      if (d.seconds > 3600) {
        label = new Date(d.seconds * 1000).toISOString().slice(11, 19)
      } else if (d.seconds > 100) {
        label = new Date(d.seconds * 1000).toISOString().slice(14, 19)
      }
      duration.label = label
    }
    return duration
  }

  get isStatus () {
    const statusId = this.getFlag('core', 'statusId')
    return [
      'tempoInsane',
      'indefInsane',
      'criticalWounds',
      'dying',
      'dead',
      'unconscious',
      'prone'
    ].includes(statusId)
  }

  static prepareActiveEffectCategories (effects) {
    // Define effect header categories
    const categories = {
      status: {
        type: 'status',
        label: game.i18n.localize('Status'),
        effects: []
      },
      temporary: {
        type: 'temporary',
        label: game.i18n.localize('Temporary'),
        effects: []
      },
      passive: {
        type: 'passive',
        label: game.i18n.localize('Passive'),
        effects: []
      },
      inactive: {
        type: 'inactive',
        label: game.i18n.localize('Innactive'),
        effects: []
      },
      suppressed: {
        type: 'suppressed',
        label: game.i18n.localize('Suppressed'),
        effects: [],
        info: [game.i18n.localize('Unavailable')]
      }
    }
    // Iterate over active effects, classifying them into categories
    for (const e of effects) {
      e._getSourceName() // Trigger a lookup for the source name
      if (e.isSuppressed) categories.suppressed.effects.push(e)
      else if (e.isStatus) categories.status.effects.push(e)
      else if (e.data.disabled) categories.inactive.effects.push(e)
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
        label: game.i18n.localize('Innactive'),
        effects: []
      }
    }
    // Iterate over active effects, classifying them into categories
    for (const e of effects) {
      count += 1
      e._getSourceName() // Trigger a lookup for the source name
      if (e.isSuppressed || e.data.disabled) categories.inactive.effects.push(e)
      else categories.active.effects.push(e)
    }

    if (count > 0) categories.expended = true
    return categories
  }
}
