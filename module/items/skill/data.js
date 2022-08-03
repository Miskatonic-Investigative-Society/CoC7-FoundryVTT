import { CoC7Item } from '../item.js'

export class CoC7Skill extends CoC7Item {
  async applyModifier (change) {
    return

    const changes = this.data.data.changes
      ? foundry.utils.duplicate(this.data.data.changes)
      : []

    const index = changes.findIndex(c => c.effect._id == change.effect.id)

    if (-1 === index) {
      changes.push(change)
      await this.update({ 'data.changes': changes })
    } else {
      //Compare if there's a change in the efect data
      if (!JSON.stringify(change) === JSON.stringify(changes[index])) {
        changes[index] = change
        await this.update({ 'data.changes': changes })
      }
    }
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
          e.key.toLowerCase() == effectKeyShort ||
          e.key.toLowerCase() == effectKeyFull
      )
      return changes
    }
    return []
  }

  get value () {
    const value = super.value
    let updated = value
    for (const change of this.activeEffects) {
      const modifier = Number.fromString(change.value)
      if (!isNaN(modifier)) {
        const modes = CONST.ACTIVE_EFFECT_MODES
        switch (change.mode) {
          case modes.ADD:
            updated += modifier
            break
          case modes.MULTIPLY:
            updated = Math.round(updated * modifier)
            break
          case modes.OVERRIDE:
            updated = modifier
            break
          case modes.UPGRADE:
            if (modifer > updated) updated = modifier
            break
          case modes.DOWNGRADE:
            if (modifer < updated) updated = modifier
            break
        }
      }
    }
    if (!isNaN(updated) && updated != value) {
      if (updated < 0) updated = 0
      return updated
    } return value
  }
}
