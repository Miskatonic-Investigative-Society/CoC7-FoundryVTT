/* global ActiveEffect, foundry, game, Roll */
export default class CoC7ActiveEffect extends ActiveEffect {
  /** @inheritdoc */
  apply (actor, change) {
    if (!isNaN(Number(change.value))) change.value = Number(change.value)
    const result = super.apply(actor, change)
    const evaluated = isNaN(result) ? parse(result) : result
    if (isNaN(evaluated)) return result
    return evaluated
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Apply an ActiveEffect that uses a MULTIPLY application mode.
   * Changes which MULTIPLY must be numeric to allow for multiplication.
   * @param {Actor} actor                   The Actor to whom this effect should be applied
   * @param {data.EffectChangeData} change  The change data being applied
   * @return {*}                            The resulting applied value
   * @private
   */
  _applyMultiply (actor, change) {
    const { key, value } = change
    const current = foundry.utils.getProperty(actor, key)
    const n = Number.fromString(value)

    let update

    const strUpdate = `${current}*${String(value)}`
    if (!isNaN(parse(strUpdate))) update = String(parse(strUpdate))
    else if (Roll.validate(strUpdate)) update = strUpdate
    else if (typeof current !== 'number' || isNaN(n)) return null
    else update = current * n
    foundry.utils.setProperty(actor, key, update)
    return update
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Apply an ActiveEffect that uses an ADD application mode.
   * The way that effects are added depends on the data type of the current value.
   *
   * If the current value is null, the change value is assigned directly.
   * If the current type is a string, the change value is concatenated.
   * If the current type is a number, the change value is cast to numeric and added.
   * If the current type is an array, the change value is appended to the existing array if it matches in type.
   *
   * @param {Actor} actor                   The Actor to whom this effect should be applied
   * @param {data.EffectChangeData} change  The change data being applied
   * @return {*}                            The resulting applied value
   * @private
   */
  _applyAdd (actor, change) {
    const { key, value } = change
    const current = foundry.utils.getProperty(actor, key) ?? null
    const ct = foundry.utils.getType(current)
    let update = null

    // Handle different types of the current data
    switch (ct) {
      case 'null':
        update = value
        break
      case 'string':
        {
          const strUpdate = `${current}+${String(value)}`
            .replace('++', '+')
            .replace('+-', '-')
          if (!isNaN(parse(strUpdate))) update = String(parse(strUpdate))
          else if (Roll.validate(strUpdate)) update = strUpdate
          else update = current + String(value)
        }
        break
      case 'number':{
        const n = Number.fromString(value)
        if (!isNaN(n)) update = current + n
      }
        break
      case 'Array':{
        const at = foundry.utils.getType(current[0])
        if (!current.length || foundry.utils.getType(value) === at) { update = current.concat([value]) }
      }
    }
    if (update !== null) foundry.utils.setProperty(actor, key, update)
    return update
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

  // prepareData () {
  //   super.prepareData()
  // }

  prepareEmbeddedDocuments () {
    super.prepareEmbeddedDocuments()
  }

  // Used in V10 only !!
  _prepareDuration () {
    super._prepareDuration()

    const duration = this.duration
    if (Number.isNumeric(duration.seconds)) {
      let label = duration.label
      if (duration.seconds > 3600) {
        label = new Date(duration.seconds * 1000).toISOString().slice(11, 19)
      } else if (duration.seconds > 100) {
        label = new Date(duration.seconds * 1000).toISOString().slice(14, 19)
      }
      duration.label = label
    }
  }

  /**
   * @override
   */
  // get duration () {
  //   const d = this.data.duration
  //   const duration = super.duration
  //   if (Number.isNumeric(d.seconds)) {
  //     let label = duration.label
  //     if (d.seconds > 3600) {
  //       label = new Date(d.seconds * 1000).toISOString().slice(11, 19)
  //     } else if (d.seconds > 100) {
  //       label = new Date(d.seconds * 1000).toISOString().slice(14, 19)
  //     }
  //     duration.label = label
  //   }
  //   return duration
  // }

  // set duration (x) {
  //   super.duration = x
  // }

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

  static prepareActiveEffectCategories (effects, { status = true } = {}) {
    // Define effect header categories
    const categories = {
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
        label: game.i18n.localize('Inactive'),
        effects: []
      },
      suppressed: {
        type: 'suppressed',
        label: game.i18n.localize('Suppressed'),
        effects: [],
        info: [game.i18n.localize('Unavailable')]
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
      e._getSourceName() // Trigger a lookup for the source name
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
      e._getSourceName() // Trigger a lookup for the source name
      if (e.isSuppressed || e.disabled) categories.inactive.effects.push(e)
      else categories.active.effects.push(e)
    }

    if (count > 0) categories.expended = true
    return categories
  }
}

function parse (str) {
  const regEx = /^[+\-*/)(\d.]+$/
  if (!regEx.exec(str)) return NaN
  try {
    return new Roll(str).evaluate({ async: false }).total
  } catch (e) {
    return NaN
  }
}
