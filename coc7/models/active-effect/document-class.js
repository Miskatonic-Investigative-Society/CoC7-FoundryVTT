import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsActiveEffectDocumentClass extends ActiveEffect {
  /**
   * Does this Active Effect have changes for key
   * @param {string} key
   * @returns {boolean}
   */
  appliesToKey (key) {
    const checks = []
    switch (key) {
      case 'str':
      case 'con':
      case 'siz':
      case 'dex':
      case 'app':
      case 'int':
      case 'pow':
      case 'edu':
        checks.push('system.characteristics.' + key + '.bonusDice')
        break
      case 'know':
      case 'idea':
        checks.push('system.config.' + key + '.bonusDice')
        break
      case 'lck':
      case 'san':
        checks.push('system.attribs.' + key + '.bonusDice')
        break
      default:
        {
          const match = key.match(/^(i)(\.|>>)(skill)(\.|>>)(.+)$/)
          if (match) {
            checks.push('system.skills.' + match[1] + '>>' + match[3] + '>>' + match[5] + '.system.bonusDice')
            checks.push('system.skills.' + match[1] + '.' + match[3] + '.' + match[5] + '.system.bonusDice')
          } else {
            checks.push('system.skills.' + key + '.system.bonusDice')
          }
        }
        break
    }
    if (this.system.changes.find(r => checks.includes(r.key))) {
      return true
    }
    // Support for *
    for (const r of this.system.changes) {
      const index = r.key.indexOf('*')
      if (index > -1) {
        const quoted = new RegExp(r.key.split('*').map(t => CoC7Utilities.quoteRegExp(t)).join('(.+)'))
        return checks.find(t => quoted.test(t))
      }
    }
    return false
  }

  /**
   * Apply ActiveEffect change to Actor
   * @deprecated FoundryVTT v13
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
