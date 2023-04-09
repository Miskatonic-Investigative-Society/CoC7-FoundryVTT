/* global foundry, game */
import { CoC7Item } from '../item.js'

export class CoC7Skill extends CoC7Item {
  constructor (data, context) {
    if (typeof data.system?.skillName === 'undefined') {
      const skill = CoC7Skill.guessNameParts(data.name)
      const { firearm, fighting, skillName, specialization, special, name } = skill
      data.name = name
      data.system ||= {}
      const combat = fighting || firearm
      const properties = { ...data.system.properties, combat, fighting, firearm, special }
      data.system = { ...data.system, skillName, specialization, properties }
    }
    super(data, context)
  }

  static guessNameParts (skillName) {
    const output = {
      name: skillName,
      skillName,
      specialization: '',
      special: false,
      fighting: false,
      firearm: false
    }

    const match = skillName.match(/^(.+)\s*\(([^)]+)\)$/)
    if (match) {
      output.skillName = match[2].trim()
      output.specialization = match[1].trim()
      output.name = output.specialization + ' (' + output.skillName + ')'
      output.fighting = output.specialization === game.i18n.localize('CoC7.FightingSpecializationName')
      output.firearm = output.specialization === game.i18n.localize('CoC7.FirearmSpecializationName')
      output.special = true
    }

    return output
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
    return this.id || this.system.skillName
  }

  /**
   * This is the value of the skill score unaffected by active effects
   */
  get rawValue () {
    let value = 0
    if (this.actor.type === 'character') {
      // For an actor with experience we need to calculate skill value
      value = this.base
      value += this.system.adjustments?.personal
        ? parseInt(this.system.adjustments?.personal)
        : 0
      value += this.system.adjustments?.occupation
        ? parseInt(this.system.adjustments?.occupation)
        : 0
      value += this.system.adjustments?.experience
        ? parseInt(this.system.adjustments?.experience)
        : 0
      if (
        game.settings.get('CoC7', 'pulpRuleArchetype') &&
        this.system.adjustments?.archetype
      ) {
        value += parseInt(this.system.adjustments?.archetype)
      }
    } else {
      // For all others actor we store the value directly
      value = parseInt(this.system.value)
    }
    return !isNaN(value) ? value : null
  }

  /**
   * This is the skill's value after active effects have been applied
   */
  get value () {
    const value = this.parent?.system.skills?.[`${this.itemIdentifier}`]?.value
    return value || this.rawValue
  }

  async updateValue (value) {
    if (this.actor.type === 'character') {
      const delta = parseInt(value) - this.rawValue
      const exp =
        (this.system.adjustments?.experience
          ? parseInt(this.system.adjustments.experience)
          : 0) + delta
      await this.update({
        'system.adjustments.experience': exp > 0 ? exp : 0
      })
    } else await this.update({ 'system.value': value })
  }

  async increaseExperience (x) {
    if (this.type !== 'skill') return null
    if (this.actor.type === 'character') {
      const exp =
        (this.system.adjustments?.experience
          ? parseInt(this.system.adjustments.experience)
          : 0) + parseInt(x)
      await this.update({
        'system.adjustments.experience': exp > 0 ? exp : 0
      })
    }
  }

  // get value () {
  //   let pValue
  //   if( this.parent){

  //   }
  //   const value = super.value
  //   let updated = value
  //   for (const change of this.activeEffects) {
  //     const modifier = Number.fromString(change.value)
  //     if (!isNaN(modifier)) {
  //       const modes = CONST.ACTIVE_EFFECT_MODES
  //       switch (change.mode) {
  //         case modes.ADD:
  //           updated += modifier
  //           break
  //         case modes.MULTIPLY:
  //           updated = Math.round(updated * modifier)
  //           break
  //         case modes.OVERRIDE:
  //           updated = modifier
  //           break
  //         case modes.UPGRADE:
  //           if (modifer > updated) updated = modifier
  //           break
  //         case modes.DOWNGRADE:
  //           if (modifer < updated) updated = modifier
  //           break
  //       }
  //     }
  //   }
  //   if (!isNaN(updated) && updated != value) {
  //     if (updated < 0) updated = 0
  //     return updated
  //   } return value
  // }
}
