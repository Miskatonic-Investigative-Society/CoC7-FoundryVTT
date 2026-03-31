/* global ChatMessage CONST foundry game renderTemplate ui */
import { FOLDER_ID } from '../constants.js'
import CoC7ActorPickerDialog from './actor-picker-dialog.js'
import CoC7RollAsModifierDialog from './roll-as-modifier-dialog.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChatMessage {
  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget.dataset.action) {
      case 'applyValue':
        {
          const actorUuid = await CoC7ActorPickerDialog.create()
          const actor = await CoC7Utilities.getActorFromUuid(actorUuid)
          if (actor) {
            const modifier = message.flags[FOLDER_ID]?.load?.modifier
            const activeEffect = message.flags[FOLDER_ID]?.load?.activeEffect
            const type = message.flags[FOLDER_ID]?.load?.type
            const key = message.flags[FOLDER_ID]?.load?.value
            const total = message.rolls.reduce((c, r) => c + r.total, 0) * (modifier === CoC7RollAsModifierDialog.MODIFIERS.HEAL_MODIFY ? 1 : -1)
            if (activeEffect === CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHODS.NONE) {
              switch (type) {
                case CoC7RollAsModifierDialog.TYPES.ATTRIBUTE:
                  if (actor.system.schema.getField('attribs')?.getField(key)) {
                    switch (key) {
                      case 'db':
                      case 'armor':
                        await actor.update({
                          ['system.attribs.' + key + '.value']: actor.system.attribs[key].value + (total < 0 ? total : '+' + total).toString()
                        })
                        break
                      case 'hp':
                        await actor.setHp(Math.max(0, parseInt(actor.system.attribs[key].value, 10) + total))
                        break
                      case 'san':
                        await actor.setSan(Math.max(0, parseInt(actor.system.attribs[key].value, 10) + total))
                        break
                      default:
                        await actor.update({
                          ['system.attribs.' + key + '.value']: Math.max(0, parseInt(actor.system.attribs[key].value, 10) + total)
                        })
                        break
                    }
                  } else {
                    ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                  }
                  break
                case CoC7RollAsModifierDialog.TYPES.CHARACTERISTIC:
                  if (actor.system.schema.getField('characteristics')?.getField(key)) {
                    await actor.update({
                      ['system.characteristics.' + key + '.value']: Math.max(0, parseInt(actor.system.characteristics[key].value, 10) + total)
                    })
                  } else {
                    ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                  }
                  break
                case CoC7RollAsModifierDialog.TYPES.SKILL:
                  {
                    const skill = actor.getFirstItemByCoCID(key)
                    if (skill) {
                      const value = skill.system.value
                      const adjustment = (value + total < 0 ? -value : total)
                      await skill.update({
                        'system.adjustments.personal': adjustment + parseInt(skill.system.adjustments.personal, 10)
                      })
                    } else {
                      ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                    }
                  }
                  break
              }
              ChatMessage.create({
                speaker: { alias: actor.name },
                content: game.i18n.format(total <= 0 ? 'CoC7.RollAsModifier.Modifier.DamagedName' : 'CoC7.RollAsModifier.Modifier.HealedName', { name: game.i18n.localize(message.flags[FOLDER_ID].load.name), value: Math.abs(total) })
              })
              return
            }
            let changeKey = ''
            switch (type) {
              case CoC7RollAsModifierDialog.TYPES.ATTRIBUTE:
                if (actor.system.schema.getField('attribs')?.getField(key)) {
                  changeKey = 'system.attribs.' + key + '.value'
                }
                break
              case CoC7RollAsModifierDialog.TYPES.CHARACTERISTIC:
                if (actor.system.schema.getField('characteristics')?.getField(key)) {
                  changeKey = 'system.characteristics.' + key + '.value'
                }
                break
              case CoC7RollAsModifierDialog.TYPES.SKILL:
                changeKey = 'system.skills.' + key + '.system.value'
                break
            }
            if (changeKey !== '') {
              let effect
              if (activeEffect === CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHODS.GROUPED) {
                effect = actor.effects.find(d => d.flags[FOLDER_ID]?.load?.as === 'CoC7ChatMessage')
              }
              if (typeof effect !== 'undefined') {
                const changes = foundry.utils.duplicate(effect.changes)
                const index = changes.findIndex(c => c.key === changeKey)
                const change = {
                  key: changeKey,
                  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                  value: total
                }
                if (index > -1) {
                  changes[index] = change
                } else {
                  changes.push(change)
                }
                await actor.updateEmbeddedDocuments('ActiveEffect', [{
                  _id: effect.id,
                  changes
                }])
              } else {
                const effect = {
                  name: game.i18n.localize(activeEffect === CoC7RollAsModifierDialog.ACTIVE_EFFECT_METHODS.GROUPED ? 'CoC7.RollAsModifier.ActiveEffect.GroupedName' : 'CoC7.RollAsModifier.ActiveEffect.IndividualName'),
                  img: 'icons/svg/d20.svg',
                  changes: [
                    {
                      key: changeKey,
                      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                      value: total
                    }
                  ],
                  flags: {
                    [FOLDER_ID]: {
                      load: {
                        as: 'CoC7ChatMessage'
                      }
                    }
                  }
                }
                await actor.createEmbeddedDocuments('ActiveEffect', [effect])
              }
              ChatMessage.create({
                speaker: { alias: actor.name },
                content: game.i18n.format(total <= 0 ? 'CoC7.RollAsModifier.Modifier.DamagedName' : 'CoC7.RollAsModifier.Modifier.HealedName', { name: game.i18n.localize(message.flags[FOLDER_ID].load.name), value: Math.abs(total) })
              })
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          }
        }
        break
      case 'setRollAsModifier':
        {
          const options = await CoC7RollAsModifierDialog.create({ message })
          message.update({
            flags: {
              [FOLDER_ID]: {
                load: {
                  activeEffect: options.activeEffect,
                  modifier: options.modifier,
                  name: options.name,
                  type: options.type,
                  value: options.value
                }
              }
            }
          })
        }
        break
    }
  }

  /**
   * Render Chat Message
   * @param {documents.ChatMessage} message
   * @param {HTMLElement} html
   * @param {ApplicationRenderContext} context
   * @param {false|Array} allowed
   */
  static async _onRenderMessage (message, html, context, allowed) {
    if (game.user.isGM) {
      if (message.content === '') {
        html.querySelector('.message-content .dice-roll').remove()
        return
      }
      const el = document.createElement('div')
      el.innerHTML = message.content
      if (!el.childElementCount && message.rolls.length) {
        // This is a basic roll message so add damage/heal buttons
        const buttons = document.createElement('div')
        const data = {
          isDamage: message.flags[FOLDER_ID]?.load?.modifier === CoC7RollAsModifierDialog.MODIFIERS.DAMAGE_MODIFY,
          isHeal: message.flags[FOLDER_ID]?.load?.modifier === CoC7RollAsModifierDialog.MODIFIERS.HEAL_MODIFY,
          name: message.flags[FOLDER_ID]?.load?.name ?? ''
        }
        /* // FoundryVTT V12 */
        buttons.innerHTML = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/parts/damage-buttons.hbs', data)
        html.querySelector('.message-content').append(buttons)
      }
      html.querySelectorAll('button[data-action]').forEach((element) => element.addEventListener('click', event => CoC7ChatMessage._onClickEvent(event, message)))
    }
  }
}
