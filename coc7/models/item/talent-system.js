import { FOLDER_ID, DICE_POOL_REASONS, TALENT_ADJUSTMENT_TYPES } from '../../constants.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemTalentSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      source: new fields.StringField({ initial: '' }),
      description: new fields.SchemaField({
        value: new fields.HTMLField({ initial: '' }),
        /* // FoundryVTT V13 - not required
        chat: '',
        */
        notes: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' })
      }),
      usable: new fields.SchemaField({
        npc: new fields.BooleanField({ label: 'TYPES.Actor.npc', initial: false }),
        investigator: new fields.BooleanField({ label: 'TYPES.Actor.character', initial: true })
      }),
      type: new fields.SchemaField({
        physical: new fields.BooleanField({ label: 'CoC7.PhysicalTalent', initial: false }),
        mental: new fields.BooleanField({ label: 'CoC7.MentalTalent', initial: false }),
        combat: new fields.BooleanField({ label: 'CoC7.CombatTalent', initial: false }),
        miscellaneous: new fields.BooleanField({ label: 'CoC7.MiscellaneousTalent', initial: false }),
        basic: new fields.BooleanField({ label: 'CoC7.BasicTalent', initial: false }),
        insane: new fields.BooleanField({ label: 'CoC7.InsaneTalent', initial: false }),
        other: new fields.BooleanField({ label: 'CoC7.OtherTalent', initial: false })
      }),
      adjustments: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ choices: TALENT_ADJUSTMENT_TYPES, initial: 'disableCombatPool' }),
          config: new fields.JSONField({ })
        })
      )
    }
  }

  /**
   * Does this adjustments have changes for key
   * @param {string} key
   * @returns {boolean}
   */
  appliesToKey (key) {
    return !!this.adjustments.find(r => (r.type === 'showOnInvestigatorCheck' && r.config.field === key) || (r.type === 'showOnSkillCheck' && r.config.cocid === key))
  }

  /**
   * Readable bullet points
   * @returns {Array}
   */
  readableAdjustments () {
    return this.adjustments.filter(r => ['disableCombatPool', 'luckButton', 'showOnInvestigatorCheck', 'showOnSkillCheck', 'takingDamage', 'takingSanityLoss'].includes(r.type)).map(r => {
      switch (r.type) {
        case 'disableCombatPool':
          if (typeof DICE_POOL_REASONS[r.config.disable]?.label === 'string') {
            return game.i18n.localize('CoC7.Talent.Type.DisableCombatPool') + ': ' + game.i18n.localize(DICE_POOL_REASONS[r.config.disable].label)
          }
          break
        case 'luckButton':
          return r.config.prompt
        case 'showOnInvestigatorCheck':
          if (typeof CONFIG.Actor.dataModels.character.defineSchema().characteristics.getField(r.config.field) !== 'undefined') {
            return game.i18n.localize('CoC7.Talent.Type.ShowOnInvestigatorCheck') + ': ' + game.i18n.localize(CONFIG.Actor.dataModels.character.defineSchema().characteristics.getField(r.config.field).hint)
          }
          if (typeof CONFIG.Actor.dataModels.character.defineSchema().attribs.getField(r.config.field) !== 'undefined') {
            return game.i18n.localize('CoC7.Talent.Type.ShowOnInvestigatorCheck') + ': ' + game.i18n.localize(CONFIG.Actor.dataModels.character.defineSchema().attribs.getField(r.config.field).hint)
          }
          break
        case 'showOnSkillCheck':
          {
            const actor = this.parent?.actor ?? this.actor
            if (actor) {
              const index = r.config.cocid.indexOf('*')
              if (index > -1) {
                const quoted = new RegExp(r.config.cocid.split('*').map(t => CoC7Utilities.quoteRegExp(t)).join('(.+)'))
                const names = actor.items.filter(doc => quoted.test(doc.flags?.[FOLDER_ID]?.cocidFlag?.id)).map(doc => doc.name)
                if (names.length) {
                  return game.i18n.localize('CoC7.Talent.Type.ShowOnSkillCheck') + ': ' + names.join(', ')
                }
              }
              const item = actor.items.find(doc => doc.flags?.[FOLDER_ID]?.cocidFlag?.id === r.config.cocid)
              if (item) {
                return game.i18n.localize('CoC7.Talent.Type.ShowOnSkillCheck') + ': ' + item.name
              }
            }
          }
          break
        case 'takingDamage':
          return game.i18n.localize('CoC7.Talent.Type.TakingDamage') + ': ' + game.i18n.format('CoC7.LuckReduceLossRatio', { luck: r.config.luckValue, name: game.i18n.localize('CoC7.Damage'), loss: r.config.reductionValue })
        case 'takingSanityLoss':
          return game.i18n.localize('CoC7.Talent.Type.TakingSanityLoss') + ': ' + game.i18n.format('CoC7.LuckReduceLossRatio', { luck: r.config.luckValue, name: game.i18n.localize('CoC7.SANLoss'), loss: r.config.reductionValue })
      }
      return false
    }).filter(t => t)
  }

  /**
   * Default config when changing type
   * @param {string} type
   * @returns {object}
   */
  prepareAdjustmentChange (type) {
    const output = {
      type,
      config: {}
    }
    switch (type) {
      case 'addSkillChoice':
        output.config = { cocid: '' }
        break
      case 'disableCombatPool':
        {
          const disable = Object.entries(DICE_POOL_REASONS).find(e => e[1].ifAttacker || e[1].ifDefender)[0]
          output.config = { disable }
        }
        break
      case 'luckButton':
        output.config = { luckValue: '', prompt: '' }
        break
      case 'showOnCombatAttacker':
      case 'showOnCombatDefender':
      case 'showOnFailure':
        // NOP
        break
      case 'showOnInvestigatorCheck':
        output.config = { field: 'app' }
        break
      case 'showOnSkillCheck':
        output.config = { cocid: '' }
        break
      case 'takingDamage':
        output.config = { type: 'fixed', luckValue: '', reductionValue: '' }
        break
      case 'takingSanityLoss':
        output.config = { type: 'fixed', luckValue: '', reductionValue: '' }
        break
    }
    return output
  }

  /**
   * Get Luck And Reduction for Type
   * @param {string} type
   * @param {int} maxLoss
   * @param {int} luck
   * @returns {object}
   */
  getLuckAndReduction (type, maxLoss, luck) {
    const output = {
      luck: 0,
      loss: 0
    }
    for (const adjustment of this.adjustments) {
      if (adjustment.type === type) {
        switch (adjustment.config.type) {
          case 'fixed':
            output.luck += parseInt(adjustment.config.luckValue, 10)
            output.loss += parseInt(adjustment.config.reductionValue, 10)
            break
          case 'percent':
            output.luck += parseInt(adjustment.config.luckValue, 10)
            output.loss += Math.floor(adjustment.config.reductionValue * maxLoss / 100, 10)
            break
          case 'ratio':
            output.luck += luck
            output.loss += (adjustment.config.reductionValue > 0 ? Math.floor(luck / adjustment.config.reductionValue * adjustment.config.reductionValue) : 0)
            break
        }
      }
    }
    return output
  }

  /**
   * Toggle flag
   * @param {string} property
   * @param {string} key
   * @param {object} options
   * @param {boolean} options.isCtrlKey
   */
  async toggleProperty (property, key, { isCtrlKey = false } = {}) {
    if (property === 'usable') {
      const updates = await this.prepareToggleUpdate(property, key, { isCtrlKey })
      const usable = foundry.utils.flattenObject(foundry.utils.mergeObject({ 'system.usable': this.toObject().usable }, updates))
      if (Object.values(usable).reduce((c, i) => c || i, false) === false) {
        updates['system.usable.' + (key === 'investigator' ? 'npc' : 'investigator')] = true
      }
      this.parent.update(updates)
    } else {
      await super.toggleProperty(property, key, isCtrlKey)
    }
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description', { value: source.description })
    }
    return super.migrateData(source)
  }
}
