/* global ActiveEffect, foundry, game, Roll */

export default class CoC7ActiveEffect extends ActiveEffect {
  constructor (...args) {
    super(...args)
    // Used for V9 compat only.
    if (game.version && !game.version.startsWith('10')) {
      // delete this.duration
      Object.defineProperty(this, 'duration', {
        get () {
          const d = this.data.duration

          // Time-based duration
          if (Number.isNumeric(d.seconds)) {
            const start = (d.startTime || game.time.worldTime)
            const elapsed = game.time.worldTime - start
            const remaining = d.seconds - elapsed
            let label = `${remaining} Seconds`
            if (d.seconds > 3600) {
              label = new Date(d.seconds * 1000).toISOString().slice(11, 19)
            } else if (d.seconds > 100) {
              label = new Date(d.seconds * 1000).toISOString().slice(14, 19)
            }
            return {
              type: 'seconds',
              duration: d.seconds,
              remaining,
              label
            }
          } else if (d.rounds || d.turns) {
            // Determine the current combat duration
            const cbt = game.combat
            const c = { round: cbt?.round ?? 0, turn: cbt?.turn ?? 0, nTurns: cbt?.turns.length ?? 1 }
            const current = this._getCombatTime(c.round, c.turn)
            const duration = this._getCombatTime(d.rounds, d.turns)
            const start = this._getCombatTime(d.startRound, d.startTurn, c.nTurns)

            // If the effect has not started yet display the full duration
            if (current <= start) {
              return {
                type: 'turns',
                duration,
                remaining: duration,
                label: this._getDurationLabel(d.rounds, d.turns)
              }
            }

            // Some number of remaining rounds and turns (possibly zero)
            const remaining = Math.max(((start + duration) - current).toNearest(0.01), 0)
            const remainingRounds = Math.floor(remaining)
            const remainingTurns = Math.min(((remaining - remainingRounds) * 100).toNearest(0.01), c.nTurns - 1)
            return {
              type: 'turns',
              duration,
              remaining,
              label: this._getDurationLabel(remainingRounds, remainingTurns)
            }
          } else {
            return {
              type: 'none',
              duration: null,
              remaining: null,
              label: game.i18n.localize('None')
            }
          }
        }
      })
    }
  }

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
    const current = foundry.utils.getProperty(actor.data, key)
    const n = Number.fromString(value)

    let update

    const strUpdate = `${current}*${String(value)}`
    if (!isNaN(parse(strUpdate))) update = String(parse(strUpdate))
    else if (Roll.validate(strUpdate)) update = strUpdate
    else if (typeof current !== 'number' || isNaN(n)) return null
    else update = current * n
    foundry.utils.setProperty(actor.data, key, update)
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
    const current = foundry.utils.getProperty(actor.data, key) ?? null
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
    if (update !== null) foundry.utils.setProperty(actor.data, key, update)
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
        return effect.update({ disabled: !effect.data.disabled })
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
        label: game.i18n.localize('Inactive'),
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

function parse (str) {
  const regEx = /^[+\-*/)(\d]+$/
  if (!regEx.exec(str)) return NaN
  try {
    return new Roll(str).evaluate({ async: false }).total
  } catch (e) {
    return NaN
  }
}
