/* global foundry, game */
import { CoC7Item } from '../../core/documents/item.js'

export class CoC7Skill extends CoC7Item {
  /** @override */
  prepareBaseData() {
    super.prepareBaseData()
    // Este cálculo se ejecuta antes de que se apliquen los ActiveEffects.
    this.system.baseValue = this._calculateBaseValue()
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData()
    const system = this.system

    // The final skill value is the sum of its base and all adjustments.
    let total = system.baseValue || 0
    
    if (this.actor?.type === 'character') {
      total += system.adjustments?.personal ?? 0
      total += system.adjustments?.occupation ?? 0
      total += system.adjustments?.experience ?? 0
      
      if (game.settings.get('CoC7', 'pulpRuleArchetype')) {
        total += system.adjustments?.archetype ?? 0
      } else {
        total += system.adjustments?.experiencePackage ?? 0
      }
    } else {
      // For NPCs/Creatures, use the base value directly
      total = this._calculateBaseValue()
    }
    
    // This value will be shown on the sheet and used for rolls.
    // We save it at the document level for easy access, but it's not persisted in the DB.
    this.calculatedValue = Math.max(total, 0)
  }

  /**
   * Helper to calculate the base value, handling numbers and formulas.
   * @returns {number}
   * @private
   */
  _calculateBaseValue() {
    const base = this.system.base
    if (String(base).includes('@')) {
      if (!this.actor) return 0
      try {
        const roll = new Roll(base, this.actor.getRollData())
        return Math.floor(roll.evaluateSync({ strict: false }).total)
      } catch (e) {
        console.warn(`CoC7 | Could not parse skill base formula "${base}" for skill "${this.name}" on actor "${this.actor?.name}"`)
        return 0
      }
    }
    return parseInt(base, 10) || 0
  }

  get hasActiveEffects () {
    return this.activeEffects.length > 0
  }

  get activeEffects () {
    if (this.parent && this.parent.effects) {
      const effectKeyFull = `skill.${this.name}`.toLowerCase()
      const effectKeyShort = `skill.${this.system.skillName}`.toLowerCase()
      let changes = this.parent.effects.reduce((changes, e) => {
        if (e.disabled || e.isSuppressed) return changes
        return changes.concat(
          e.data.changes.map(c => {
            c = foundry.utils.duplicate(c)
            c.effect = e
            c.priority = c.priority ?? c.mode * 10
            return c
          })
        )
      }, [])
      changes.sort((a, b) => a.priority - b.priority)
      changes = changes.filter(
        e =>
          e.key.toLowerCase() === effectKeyShort ||
          e.key.toLowerCase() === effectKeyFull
      )
      return changes
    }
    return []
  }

  /**
  * Unique identifier should be used to store and obtain item to assess item uniqueness.
  * For old items without id, fallback of skillName may still be used
  * but if skill name is not unique it will cause problems.
  */
  get itemIdentifier () {
    return this.name
  }

  /**
   * Base value getter that resolves formulas if necessary.
   */
  get base() {
    return this.system.baseValue ?? this._calculateBaseValue()
  }

  /**
   * This is the value of the skill score unaffected by active effects
   */
  get rawValue () {
    return this.calculatedValue ?? 0
  }

  /**
   * This is the skill's value after active effects have been applied
   */
  get value () {
    const effectValue = this.parent?.system.skills?.[`${this.itemIdentifier}`]?.value
    return effectValue ?? this.rawValue
  }

  get canBePushed() {
    return this.system.properties.push
  }

  async updateValue (value) {
    if (this.actor.type === 'character') {
      const delta = parseInt(value) - this.rawValue
      const exp = (this.system.adjustments?.experience ?? 0) + delta
      await this.update({
        'system.adjustments.experience': Math.max(exp, 0)
      })
    } else {
      await this.update({ 'system.base': value.toString() })
    }
  }

  async increaseExperience (x) {
    if (this.type !== 'skill') return null
    if (this.actor.type === 'character') {
      const exp = (this.system.adjustments?.experience ?? 0) + parseInt(x)
      await this.update({
        'system.adjustments.experience': Math.max(exp, 0)
      })
    }
  }
}
