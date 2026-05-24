/* global ActiveEffect */
export default class CoC7ModelsActiveEffectDocumentClass extends ActiveEffect {
  /**
   * Apply ActiveEffect change to Actor
   * @param {Document} actor
   * @param {object} change
   * @returns {object}
   */
  apply (actor, change) {
    if (change.key.startsWith('system.skills.i.skill.')) {
      const match = change.key.match(/^(system.skills.i)\.(skill)\.(.+)$/)
      change.key = match[1] + '>>' + match[2] + '>>' + match[3]
    }
    // Multiple skills e.g. i.skills.language-*
    const match = change.key.match(/^(system\.skills\.)(i>>skill>>[^.]+)\*(\..+)$/)
    if (match) {
      const keys = Object.keys(actor.system.skills).filter(k => k.startsWith(match[2]))
      let changes = {}
      for (const key of keys) {
        change.key = match[1] + key + match [3]
        changes = Object.assign(changes, super.apply(actor, change))
      }
      return changes
    }
    const changes = super.apply(actor, change)
    return changes
  }

  /**
   * Apply ActiveEffect change to Actor
   * @param {Document} targetDoc
   * @param {ActiveEffectChangeData} change
   * @param {object} options
   * @returns {object}
   */
  static applyChange (targetDoc, change, options) {
    if (change.key.startsWith('system.skills.i.skill.')) {
      const match = change.key.match(/^(system.skills.i)\.(skill)\.(.+)$/)
      change.key = match[1] + '>>' + match[2] + '>>' + match[3]
    }
    // Multiple skills e.g. i.skills.language-*
    const match = change.key.match(/^(system\.skills\.)(i>>skill>>[^.]+)\*(\..+)$/)
    if (match) {
      const keys = Object.keys(targetDoc.system.skills).filter(k => k.startsWith(match[2]))
      let changes = {}
      for (const key of keys) {
        change.key = match[1] + key + match [3]
        changes = Object.assign(changes, super.applyChange(targetDoc, change, options))
      }
      return changes
    }
    const changes = super.applyChange(targetDoc, change, options)
    return changes
  }

  /**
   * Convert seconds duration to hh:mm:ss / mm:ss format
   * @returns {object}
   */
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

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    if (typeof source.changes !== 'undefined' && source.changes.length) {
      for (const offset in source.changes) {
        source.changes[offset].key = source.changes[offset].key.replace(/^(system\.skills)\.(((?!\.system\.).)+)\.(bonusDice|value)$/, '$1.$2.system.$4')
      }
    }
    return super.migrateData(source)
  }
}
