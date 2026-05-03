/* global ChatMessage CONFIG foundry game Item renderTemplate Roll ui */
import { FOLDER_ID, CHAT_MESSAGE_MODE, SPELL_COST_TYPE_KEYS } from '../../constants.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'
import CoC7SpellVariablesDialog from '../../apps/spell-variables-dialog.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemSpellSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/pentagram-rose.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    const spellCostListTypes = Object.keys(SPELL_COST_TYPE_KEYS)
    return {
      /* // FoundryVTT V13 - not required
      alternativeNames: [],
      effects: [],
      learned: false,
      */
      castingTime: new fields.StringField({ initial: '' }),
      costs: new fields.SchemaField({
        hitPoints: new fields.StringField({ initial: '0' }),
        magicPoints: new fields.StringField({ initial: '0' }),
        others: new fields.StringField({ initial: '' }),
        sanity: new fields.StringField({ initial: '0' }),
        power: new fields.StringField({ initial: '0' })
      }),
      costList: new fields.ArrayField(
        new fields.SchemaField({
          type: new fields.StringField({ choices: spellCostListTypes, initial: 'casterCost' }),
          if: new fields.StringField({ nullable: false, initial: '' }),
          config: new fields.JSONField({ })
        })
      ),
      description: new fields.SchemaField({
        /* // FoundryVTT V13 - not required
        chat: '',
        */
        value: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' }),
        alternativeNames: new fields.HTMLField({ initial: '' })
      }),
      source: new fields.StringField({ initial: '' }),
      type: new fields.SchemaField({
        bind: new fields.BooleanField({ label: 'CoC7.BindSpell', initial: false }),
        call: new fields.BooleanField({ label: 'CoC7.CallSpell', initial: false }),
        combat: new fields.BooleanField({ label: 'CoC7.CombatSpell', initial: false }),
        contact: new fields.BooleanField({ label: 'CoC7.ContactSpell', initial: false }),
        dismiss: new fields.BooleanField({ label: 'CoC7.DismissSpell', initial: false }),
        enchantment: new fields.BooleanField({ label: 'CoC7.EnchantmentSpell', initial: false }),
        gate: new fields.BooleanField({ label: 'CoC7.GateSpell', initial: false }),
        summon: new fields.BooleanField({ label: 'CoC7.SummonSpell', initial: false })
      })
    }
  }

  /**
   * Create empty object for this item type
   * @param {object} options
   * @returns {object}
   */
  static emptyObject (options) {
    const object = foundry.utils.mergeObject({
      name: game.i18n.localize('CoC7.NewSpellName'),
      type: 'spell',
      system: new CoC7ModelsItemSpellSystem().toObject()
    }, options)
    return object
  }

  /**
   * Get key name without marker
   * @param {string} text
   * @returns {string}
   */
  static keyName (text) {
    return text.toString().replace(/^@/, '')
  }

  /**
   * Replace variables in string
   * @param {string} text
   * @param {object} variables
   * @returns {string}
   */
  static keyReplacement (text, variables) {
    return text.toString().replace(/({)?@([a-z.0-9_-]+)(})?/gi, (...match) => {
      if ((typeof match[1] === 'undefined' && typeof match[3] === 'undefined') || (match[1] === '{' && match[3] === '}')) {
        return variables[match[2]] ?? 0
      }
      return match[0]
    })
  }

  /**
   * Cast a spell
   * @param {boolean} privateRoll
   */
  async cast (privateRoll) {
    let actor
    if (this.parent.parent instanceof Item) {
      actor = this.parent.parent.actor
    } else if (this.parent.actor?.isOwner) {
      actor = this.parent.actor
    } else if (!game.user.isGM || !privateRoll) {
      /** This is not owned by any Actor */
      ui.notifications.error('CoC7.NotOwned', { localize: true })
      return
    }
    const costList = foundry.utils.duplicate(this.costList)
    const availableCosts = CoC7ModelsItemSpellSystem.availableCosts().reduce((c, e) => { c[e.key] = e; return c }, {})
    const additionalInformation = []
    const automatedCosts = costList.length > 0
    const automatedLosses = []
    const casterCosts = {}
    const casterGroups = []
    let castingTime = ''
    const manualLosses = []
    const promptRows = []
    const rolls = []
    const variables = []
    if (!automatedCosts) {
      const text = game.i18n.localize('CoC7.Points')
      for (const [key, loss] of Object.entries(this.costs)) {
        if (!loss || Number(loss) === 0) {
          continue
        }
        let k
        switch (key) {
          case 'hitPoints':
            k = 'hp'
            break
          case 'sanity':
            k = 'san'
            break
          case 'magicPoints':
            k = 'mp'
            break
          case 'power':
            k = 'pow'
            break
          case 'others':
            additionalInformation.push(game.i18n.localize('CoC7.OtherCosts') + ': ' + loss)
            break
        }
        if (k) {
          manualLosses.push({
            name: availableCosts[k]?.name ?? k,
            value: '-' + loss + ' ' + text
          })
        }
      }
    } else {
      castingTime = this.castingTime
      for (const cost of costList) {
        const ifParts = cost.if.match(/^(!)?@?(.+)$/)
        if (!ifParts || (variables[ifParts[2]] ?? false) === !ifParts[1]) {
          // SPELL_COST_TYPE_KEYS
          switch (cost.type) {
            case 'additionalCasterPromptAdd':
              promptRows.push({
                type: 'additionalCasterPromptAdd',
                key: CoC7ModelsItemSpellSystem.keyName(cost.config.variable),
                label: cost.config.prompt,
                min: cost.config.min,
                step: cost.config.step,
                costs: {},
                numbers: [],
                contents: new Array(Number(cost.config.min)).fill({ name: '', numbers: {} })
              })
              break
            case 'additionalCasterCost':
              {
                const index = promptRows.findLastIndex(v => v.type === 'additionalCasterPromptAdd')
                if (index === -1) {
                  ui.notifications.warn('CoC7.Spell.ErrorUnableToFindAdditionalCasters', { localize: true })
                  console.warn('Unable to assign cost to variables', cost, promptRows)
                  return
                }
                const newRoll = await new Roll(cost.config.value.toString(), variables, { reason: availableCosts[cost.config.modify]?.name }).roll()
                if (!newRoll.isDeterministic) {
                  rolls.push(newRoll)
                }
                promptRows[index].costs[cost.config.modify] = Math.floor(newRoll.total)
              }
              break
            case 'additionalCasterPromptRequireNumber':
              {
                const index = promptRows.findLastIndex(v => v.type === 'additionalCasterPromptAdd')
                if (index === -1) {
                  ui.notifications.warn('CoC7.Spell.ErrorUnableToFindAdditionalCasters', { localize: true })
                  console.warn('Unable to assign cost to variables', cost, promptRows)
                  return
                }
                promptRows[index].numbers.push({
                  type: 'number',
                  key: CoC7ModelsItemSpellSystem.keyName(cost.config.variable),
                  label: cost.config.prompt,
                  value: ''
                })
              }
              break
            case 'castingTime':
              castingTime = CoC7ModelsItemSpellSystem.keyReplacement(cost.config.value, variables)
              break
            case 'casterCost':
              {
                const newRoll = await new Roll(cost.config.value.toString(), variables, { reason: availableCosts[cost.config.modify]?.name }).roll()
                if (!newRoll.isDeterministic) {
                  rolls.push(newRoll)
                }
                casterCosts[cost.config.modify] = Math.floor(newRoll.total)
                variables[cost.config.modify] = casterCosts[cost.config.modify]
              }
              break
            case 'additionalInformation':
              additionalInformation.push(CoC7ModelsItemSpellSystem.keyReplacement(cost.config.prompt, variables))
              break
            case 'promptToggleButton':
              promptRows.push({
                type: 'toggle',
                key: CoC7ModelsItemSpellSystem.keyName(cost.config.variable),
                label: cost.config.prompt,
                value: false
              })
              break
            case 'triggerPrompt':
              if (promptRows.length) {
                const variableValues = await CoC7SpellVariablesDialog.create({ variables: promptRows })
                for (const variableValue of variableValues) {
                  switch (variableValue.type) {
                    case 'additionalCasterPromptAdd':
                      {
                        const contents = []
                        variables[variableValue.key + '.length'] = variableValue.contents.length
                        for (const additionalCaster of variableValue.contents) {
                          const costs = {}
                          for (const key in variableValue.costs) {
                            costs[key] = { name: availableCosts[key]?.name ?? key, value: variableValue.costs[key] }
                            variables[variableValue.key + '.' + key] = (variables[variableValue.key + '.' + key] ?? 0) + Number(costs[key].value)
                          }
                          for (const key in additionalCaster.numbers) {
                            costs[key] = { name: variableValue.numbers.find(n => n.key === key).label ?? key, value: additionalCaster.numbers[key] }
                            variables[variableValue.key + '.' + key] = (variables[variableValue.key + '.' + key] ?? 0) + Number(costs[key].value)
                          }
                          contents.push({
                            name: additionalCaster.name,
                            costs
                          })
                        }
                        casterGroups.push({
                          label: variableValue.label,
                          contents
                        })
                      }
                      break
                    case 'number':
                      {
                        const newRoll = await new Roll(variableValue.value.toString(), variables, { reason: variableValue.label }).roll()
                        if (!newRoll.isDeterministic) {
                          rolls.push(newRoll)
                        }
                        variables[variableValue.key] = Math.floor(newRoll.total)
                      }
                      break
                    case 'show':
                      // NOP
                      break
                    case 'toggle':
                      variables[variableValue.key] = variableValue.value
                      break
                  }
                }
                promptRows.splice(0, promptRows.length)
              }
              break
            case 'promptShowText':
              promptRows.push({
                type: 'information',
                label: cost.config.prompt
              })
              break
            case 'showVariable':
              promptRows.push({
                type: 'show',
                value: variables[CoC7ModelsItemSpellSystem.keyName(cost.config.variable)],
                label: cost.config.prompt
              })
              break
            case 'promptRequireNumber':
              promptRows.push({
                type: 'number',
                key: CoC7ModelsItemSpellSystem.keyName(cost.config.variable),
                label: cost.config.prompt,
                value: ''
              })
              break
            case 'setVariable':
              {
                const key = CoC7ModelsItemSpellSystem.keyName(cost.config.variable)
                const newRoll = await new Roll(cost.config.value.toString(), variables, { reason: key }).roll()
                if (!newRoll.isDeterministic) {
                  rolls.push(newRoll)
                }
                variables[key] = Math.floor(newRoll.total)
              }
              break
          }
        }
      }
      if (promptRows.length) {
        ui.notifications.warn('CoC7.Spell.ErrorPromptNotShown', { localize: true })
        return
      }
      if (actor) {
        if (typeof casterCosts.mp !== 'undefined' && typeof actor?.system.attribs.mp.value !== 'undefined') {
          if (casterCosts.mp > actor.system.attribs.mp.value) {
            const convertedHitPoints = Number(casterCosts.mp) - Number(actor.system.attribs.mp.value)
            const convertToHp = await new Promise(resolve => {
              new foundry.applications.api.DialogV2({
                window: { title: 'CoC7.HitPointsCost' },
                content: game.i18n.format('CoC7.NotEnoughMagicPoints', {
                  actorMagicPoints: actor.system.attribs.mp.value,
                  convertedHitPoints,
                  originalMagicPoints: casterCosts.mp,
                  spell: this.parent.name
                }),
                buttons: [{
                  action: 'cancel',
                  icon: 'fa-solid fa-times',
                  label: 'CoC7.Cancel',
                  callback: (event, button, dialog) => resolve(false)
                }, {
                  action: 'proceed',
                  icon: 'fa-sold fa-check',
                  label: 'CoC7.Proceed',
                  default: true,
                  callback: (event, button, dialog) => resolve(true)
                }]
              }).render({ force: true })
            })
            if (!convertToHp) {
              return
            }
            casterCosts.mp -= convertedHitPoints
            if (typeof casterCosts.hp === 'undefined') {
              casterCosts.hp = 0
            }
            casterCosts.hp += convertedHitPoints
          }
        }
        const adjustments = {}
        for (const k in casterCosts) {
          if (['san', 'hp'].includes(k)) {
            continue
          }
          if (typeof availableCosts[k]?.name === 'string') {
            adjustments['system.' + availableCosts[k].section + '.' + k + '.value'] = Number(actor.system[availableCosts[k].section][k].value) - casterCosts[k]
          }
        }
        if (Object.keys(adjustments).length > 0) {
          await actor.update(adjustments)
        }
        if (typeof casterCosts.san !== 'undefined') {
          await actor.setSan(Number(actor.system.attribs.san.value) - casterCosts.san)
        }
        if (typeof casterCosts.hp !== 'undefined') {
          await actor.dealDamage(casterCosts.hp, { ignoreArmor: true })
        }
      }
      const text = game.i18n.localize('CoC7.Points')
      for (const k in casterCosts) {
        automatedLosses.push({
          name: availableCosts[k]?.name ?? k,
          value: -casterCosts[k] + ' ' + text
        })
      }
    }
    const dice = []
    for (const roll of rolls) {
      const chatData = await roll._prepareChatRenderContext()
      chatData.formula = roll.options.reason + ': ' + chatData.formula
      dice.push(chatData)
    }
    const template = 'systems/' + FOLDER_ID + '/templates/chat/spell.hbs'
    const description = this.description.value
    /* // FoundryVTT V12 */
    const html = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)(template, { additionalInformation, automatedCosts, automatedLosses, casterGroups, castingTime, description, dice, diceTemplate: Roll.CHAT_TEMPLATE, manualLosses })
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: this.parent.name,
      content: html,
      rolls
    }
    if (privateRoll) {
      /* // FoundryVTT V13 */
      if (game.release.generation < 14) {
        chatData = ChatMessage.applyRollMode(chatData, CHAT_MESSAGE_MODE.GM)
      } else {
        chatData = ChatMessage.applyMode(chatData, CHAT_MESSAGE_MODE.GM)
      }
    }
    await ChatMessage.create(chatData)
  }

  /**
   * Array of attributes and characteristics that can be used as spell costs
   * @returns {Array}
   */
  static availableCosts () {
    const output = []
    for (const field of CONFIG.Actor.dataModels.character.schema.getField('characteristics').values()) {
      output.push({
        group: 'Characteristics',
        section: 'characteristics',
        key: field.name,
        name: game.i18n.localize(field.hint)
      })
    }
    for (const field of CONFIG.Actor.dataModels.character.schema.getField('attribs').values()) {
      if (['armor', 'db', 'build', 'mov'].includes(field.name)) {
        continue
      }
      output.push({
        group: 'Attributes',
        section: 'attribs',
        key: field.name,
        name: game.i18n.localize((field.name === 'san' ? 'CoC7.SanityPoints' : field.hint))
      })
    }
    output.sort(CoC7Utilities.sortByNameKey)
    return output
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Moved cost.hp to costs.hitPoints
    if (typeof source.cost?.hp !== 'undefined' && typeof source.costs?.hitPoints === 'undefined') {
      foundry.utils.setProperty(source, 'costs.hitPoints', source.cost.hp)
    }
    // Moved cost.mp to costs.magicPoints
    if (typeof source.cost?.mp !== 'undefined' && typeof source.costs?.magicPoints === 'undefined') {
      foundry.utils.setProperty(source, 'costs.magicPoints', source.cost.mp)
    }
    // Moved cost.san to costs.sanity
    if (typeof source.cost?.san !== 'undefined' && typeof source.costs?.sanity === 'undefined') {
      foundry.utils.setProperty(source, 'costs.sanity', source.cost.san)
    }
    // Moved cost.pow to costs.power
    if (typeof source.cost?.pow !== 'undefined' && typeof source.costs?.power === 'undefined') {
      foundry.utils.setProperty(source, 'costs.power', source.cost.pow)
    }
    // Migrate description to object
    if (typeof source.description === 'string') {
      foundry.utils.setProperty(source, 'description.value', source.description)
    }
    return super.migrateData(source)
  }
}
