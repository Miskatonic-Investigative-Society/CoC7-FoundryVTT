/* global foundry, game */
import { CoC7Item } from '../item.js'

export class CoC7Skill extends CoC7Item {
  constructor (data, context) {
    if (typeof data.data?.skillName === 'undefined') {
      if (typeof data.data === 'undefined') {
        data.data = {}
      }
      const construct = CoC7Skill.guessNameParts(data.name)
      if (!construct.isSpecialization) {
        data.data.skillName = data.name
      } else {
        data.data.skillName = construct.skillName
        data.data.specialization = construct.specialization
        if (typeof data.data.properties === 'undefined') {
          data.data.properties = {}
        }
        data.data.properties.special = true
        if (construct.isFighting || construct.isFirearms) {
          data.data.properties.combat = true
          if (construct.isFighting) {
            data.data.properties.fighting = true
          } else {
            data.data.properties.firearm = true
          }
        }
      }
    }
    super(data, context)
  }
  // async applyModifier (change) {
  //   return

  //   const changes = this.data.data.changes
  //     ? foundry.utils.duplicate(this.data.data.changes)
  //     : []

  //   const index = changes.findIndex(c => c.effect._id == change.effect.id)

  //   if (-1 === index) {
  //     changes.push(change)
  //     await this.update({ 'data.changes': changes })
  //   } else {
  //     //Compare if there's a change in the efect data
  //     if (!JSON.stringify(change) === JSON.stringify(changes[index])) {
  //       changes[index] = change
  //       await this.update({ 'data.changes': changes })
  //     }
  //   }
  // }

  static guessNameParts (skillName) {
    const output = {
      skillName,
      specialization: '',
      isSpecialization: false,
      isFighting: false,
      isFirearms: false
    }
    const match = skillName.match(/^(.+)\s*\(([^)]+)\)$/)
    if (match) {
      output.skillName = match[2].trim()
      output.specialization = match[1].trim()
      output.isSpecialization = true
      if (output.specialization === game.i18n.localize('CoC7.FightingSpecializationName')) {
        output.isFighting = true
      } else if (output.specialization === game.i18n.localize('CoC7.FirearmSpecializationName')) {
        output.isFirearms = true
      }
    }
    return output
  }

  get hasActiveEffects () {
    return this.activeEffects.length > 0
  }

  get activeEffects () {
    if (this.parent && this.parent.effects) {
      const effectKeyFull = `skill.${this.name}`.toLowerCase()
      const effectKeyShort = `skill.${this.data.data.skillName}`.toLowerCase()
      let changes = this.parent.effects.reduce((changes, e) => {
        if (e.data.disabled || e.isSuppressed) return changes
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
   * This is the value of the skill score unaffected by active effects
   */
  get rawValue () {
    let value = 0
    if (this.actor.data.type === 'character') {
      // For an actor with experience we need to calculate skill value
      value = this.base
      value += this.data.data.adjustments?.personal
        ? parseInt(this.data.data.adjustments?.personal)
        : 0
      value += this.data.data.adjustments?.occupation
        ? parseInt(this.data.data.adjustments?.occupation)
        : 0
      value += this.data.data.adjustments?.experience
        ? parseInt(this.data.data.adjustments?.experience)
        : 0
      if (
        game.settings.get('CoC7', 'pulpRuleArchetype') &&
        this.data.data.adjustments?.archetype
      ) {
        value += parseInt(this.data.data.adjustments?.archetype)
      }
    } else {
      // For all others actor we store the value directly
      value = parseInt(this.data.data.value)
    }
    return !isNaN(value) ? value : null
  }

  /**
   * This is the skill's value after active effects have been applied
   */
  get value () {
    const value = this.parent?.data.data.skills?.[`${this.data.data.skillName}`]
      ?.value
    return value || this.rawValue
  }

  async updateValue (value) {
    if (this.actor.data.type === 'character') {
      const delta = parseInt(value) - this.rawValue
      const exp =
        (this.data.data.adjustments?.experience
          ? parseInt(this.data.data.adjustments.experience)
          : 0) + delta
      await this.update({
        'data.adjustments.experience': exp > 0 ? exp : 0
      })
    } else await this.update({ 'data.value': value })
  }

  async increaseExperience (x) {
    if (this.type !== 'skill') return null
    if (this.actor.data.type === 'character') {
      const exp =
        (this.data.data.adjustments?.experience
          ? parseInt(this.data.data.adjustments.experience)
          : 0) + parseInt(x)
      await this.update({
        'data.adjustments.experience': exp > 0 ? exp : 0
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
