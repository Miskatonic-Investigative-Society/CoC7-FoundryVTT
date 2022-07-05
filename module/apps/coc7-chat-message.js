/* global game, ui */
import { CoC7Check } from '../check.js'
import { CoC7LinkCreationDialog } from './link-creation-dialog.js'
import { isCtrlKey } from '../chat/helper.js'
import { RollDialog } from './roll-dialog.js'
import { CombinedCheckCard } from '../chat/cards/combined-roll.js'
import { OpposedCheckCard } from '../chat/cards/opposed-roll.js'
import { SanCheckCard } from '../chat/cards/san-check.js'
import { SanDataDialog } from './sandata-dialog.js'

export class CoC7ChatMessage {
  static get ROLL_TYPE_ATTRIBUTE () {
    return 'R/AT'
  }

  static get ROLL_TYPE_CHARACTERISTIC () {
    return 'R/CH'
  }

  static get ROLL_TYPE_COMBAT () {
    return 'R/CO'
  }

  static get ROLL_TYPE_SKILL () {
    return 'R/SK'
  }

  static get CARD_TYPE_COMBINED () {
    return 'C/CO'
  }

  static get CARD_TYPE_GROUP () {
    return 'C/GR'
  }

  static get CARD_TYPE_NORMAL () {
    return 'C/NO'
  }

  static get CARD_TYPE_OPPOSED () {
    return 'C/OP'
  }

  static get CARD_TYPE_SAN_CHECK () {
    return 'C/SC'
  }

  static cardTypes (config) {
    if (config.rollType === CoC7ChatMessage.ROLL_TYPE_COMBAT) {
      return null
    }
    const select = {
      [CoC7ChatMessage.CARD_TYPE_NORMAL]: 'CoC7.RegularRollCard',
      [CoC7ChatMessage.CARD_TYPE_COMBINED]: 'CoC7.CombinedRollCard',
      [CoC7ChatMessage.CARD_TYPE_OPPOSED]: 'CoC7.OpposedRollCard'
      // [CoC7ChatMessage.CARD_TYPE_GROUP]: 'CoC7.GroupRollCard' - NYI
    }
    if (
      config.rollType === CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE &&
      config.attribute === 'san'
    ) {
      select[CoC7ChatMessage.CARD_TYPE_SAN_CHECK] = 'CoC7.SanityLossEncounter'
    }
    return select
  }

  static normalizeRequest (options) {
    if (
      typeof options.event === 'undefined' ||
      typeof options.cardType === 'undefined' ||
      typeof options.rollType === 'undefined'
    ) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorNotFound', {
          value: game.i18n.localize('CoC7.Roll')
        })
      )
      return false
    }
    if (
      ![
        CoC7ChatMessage.CARD_TYPE_COMBINED,
        CoC7ChatMessage.CARD_TYPE_GROUP,
        CoC7ChatMessage.CARD_TYPE_NORMAL,
        CoC7ChatMessage.CARD_TYPE_OPPOSED,
        CoC7ChatMessage.CARD_TYPE_SAN_CHECK
      ].includes(options.cardType)
    ) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorInvalidFormula', {
          value: game.i18n.localize('CoC7.ErrorInvalidCardType')
        })
      )
      return false
    }
    if (
      ![
        CoC7ChatMessage.ROLL_TYPE_SKILL,
        CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC,
        CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
      ].includes(options.rollType)
    ) {
      ui.notifications.error(
        game.i18n.format('CoC7.ErrorInvalidFormula', {
          value: game.i18n.localize('CoC7.ErrorInvalidRollType')
        })
      )
      return false
    }
    const config = {
      options: {
        cardType: options.cardType,
        shiftKey: options.event.shiftKey,
        altKey: options.event.altKey,
        isCtrlKey: isCtrlKey(options.event),
        isCombat: options.event.currentTarget.classList?.contains('combat')
      },
      dialogOptions: {
        rollType: options.rollType,
        cardType: options.cardType,
        attribute: '',
        toMessage: (options.toMessage ?? true)
      }
    }
    switch (config.dialogOptions.rollType) {
      case CoC7ChatMessage.ROLL_TYPE_SKILL:
      case CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC:
      case CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE:
        config.options.skillId =
          options.event.currentTarget.closest('.item')?.dataset.skillId
        config.options.itemId =
          options.event.currentTarget.closest('.item')?.dataset.itemId
        config.options.characteristic =
          options.event.currentTarget.parentElement.dataset.characteristic
        config.options.attribute =
          options.event.currentTarget.parentElement.dataset.attrib
        config.dialogOptions.attribute = config.options.attribute
        config.options.actorId =
          options.event.currentTarget.closest('form').dataset.actorId
        config.options.tokenKey =
          options.event.currentTarget.closest('form').dataset.tokenId
        config.options.weaponAltSkill =
          options.event.currentTarget.classList.contains('alternativ-skill')
        config.options.actor = options.actor
        if (
          config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_SKILL &&
          config.options.isCombat
        ) {
          const item = config.options.actor.items.get(config.options.itemId)
          if (!item) {
            return false
          }
          if (item.type === 'weapon') {
            config.options.weaponName = item.name
            config.dialogOptions.rollType = CoC7ChatMessage.ROLL_TYPE_COMBAT
          }
        }
        if (
          typeof config.options.actorId === 'undefined' ||
          (typeof config.options.tokenKey === 'undefined' &&
            typeof config.options.actor === 'undefined')
        ) {
          ui.notifications.error(
            game.i18n.format('CoC7.ErrorInvalidFormula', {
              value: game.i18n.localize('CoC7.ErrorActor')
            })
          )
          return false
        }
        if (
          config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_SKILL &&
          typeof config.options.skillId === 'undefined'
        ) {
          ui.notifications.error(
            game.i18n.format('CoC7.ErrorInvalidFormula', {
              value: game.i18n.localize('CoC7.Entities.Skill')
            })
          )
          return false
        } else if (
          config.dialogOptions.rollType ===
          CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC
        ) {
          if (typeof config.options.characteristic === 'undefined') {
            ui.notifications.error(
              game.i18n.format('CoC7.ErrorInvalidFormula', {
                value: game.i18n.localize('CoC7.Characteristic')
              })
            )
            return false
          } else if (
            !game.user.isGM &&
            !config.options.actor.data.data.characteristics[
              config.options.characteristic
            ]?.value
          ) {
            return false
          }
        } else if (
          config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
        ) {
          if (typeof config.options.attribute === 'undefined') {
            ui.notifications.error(
              game.i18n.format('CoC7.ErrorInvalidFormula', {
                value: game.i18n.localize('CoC7.Attribute')
              })
            )
            return false
          } else if (
            !game.user.isGM &&
            !config.options.actor.data.data.attribs[config.options.attribute]
              ?.value
          ) {
            return false
          }
        } else if (
          config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_COMBAT
        ) {
          if (typeof config.options.itemId === 'undefined') {
            ui.notifications.error(
              game.i18n.format('CoC7.ErrorInvalidFormula', {
                value: game.i18n.localize('CoC7.Entities.Weapon')
              })
            )
            return false
          } else if (config.options.altKey) {
            return false
          }
        }
        config.options.hasPlayerOwner =
          config.options.actor.hasPlayerOwner ?? false
        if (
          config.dialogOptions.rollType ===
          CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC
        ) {
          config.dialogOptions.disableFlatThresholdModifier =
            config.options.isCtrlKey
          config.dialogOptions.disableFlatDiceModifier =
            config.options.isCtrlKey
        } else {
          config.dialogOptions.disableFlatThresholdModifier = false
          config.dialogOptions.disableFlatDiceModifier = false
        }
        config.dialogOptions.modifier = 0
        config.dialogOptions.difficulty =
          CoC7Check.difficultyLevel[
            game.settings.get('CoC7', 'defaultCheckDifficulty')
          ]
        config.dialogOptions.flatDiceModifier = 0
        config.dialogOptions.flatThresholdModifier = 0
        break
    }
    return config
  }

  static async trigger (options = {}) {
    const config = CoC7ChatMessage.normalizeRequest(options)
    if (config === false) {
      return
    }
    if (
      config.options.isCtrlKey &&
      game.user.isGM &&
      [
        CoC7ChatMessage.CARD_TYPE_NORMAL,
        CoC7ChatMessage.CARD_TYPE_SAN_CHECK
      ].includes(config.dialogOptions.cardType)
    ) {
      CoC7ChatMessage.createLink(config)
    } else {
      if (!config.options.shiftKey) {
        await CoC7ChatMessage.createRoll(config)
      }
      CoC7ChatMessage.runRoll(config)
    }
  }

  static createLink (config) {
    switch (config.dialogOptions.rollType) {
      case CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE:
      case CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC:
      case CoC7ChatMessage.ROLL_TYPE_COMBAT:
      case CoC7ChatMessage.ROLL_TYPE_SKILL:
        {
          const linkData = {
            check: 'check',
            type: '',
            name: '',
            hasPlayerOwner: config.options.hasPlayerOwner,
            actorKey: config.options.actor.actorKey,
            forceModifiers: config.options.shiftKey
          }
          if (
            config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_SKILL
          ) {
            linkData.type = 'skill'
            linkData.name = config.options.actor.items.get(
              config.options.skillId
            )?.shortName
            if (!linkData.name) return
          } else if (
            config.dialogOptions.rollType ===
            CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC
          ) {
            linkData.type = 'characteristic'
            linkData.name = config.options.characteristic
          } else if (
            config.dialogOptions.rollType ===
            CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
          ) {
            if (config.options.altKey && config.options.attribute === 'san') {
              linkData.check = 'sanloss'
            } else {
              linkData.type = 'attribute'
              linkData.name = config.options.attribute
            }
          } else if (
            config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_COMBAT
          ) {
            linkData.check = 'item'
            linkData.type = 'weapon'
            linkData.name = config.options.weaponName
          } else {
            return
          }
          if (game.settings.get('core', 'rollMode') === 'blindroll') {
            linkData.blind = true
          }
          CoC7LinkCreationDialog.fromLinkData(linkData).then(dlg =>
            dlg.render(true)
          )
        }
        break
    }
  }

  static async createRoll (config) {
    const usage = await RollDialog.create(config.dialogOptions)
    if (usage) {
      const cardType = usage.get('cardType')
      if (cardType) {
        config.dialogOptions.cardType = cardType
      }
      config.dialogOptions.modifier = Number(usage.get('bonusDice'))
      config.dialogOptions.difficulty = Number(usage.get('difficulty'))
      config.dialogOptions.flatDiceModifier = Number(
        usage.get('flatDiceModifier')
      )
      config.dialogOptions.flatThresholdModifier = Number(
        usage.get('flatThresholdModifier')
      )
    }
  }

  static async runRoll (config) {
    switch (config.dialogOptions.cardType) {
      case CoC7ChatMessage.CARD_TYPE_SAN_CHECK:
        {
          const sanData = await SanDataDialog.create({
            promptLabel: true
          })
          if (sanData) {
            let sanMin = sanData.get('sanMin') || 0
            let sanMax = sanData.get('sanMax') || 0
            const sanReason = sanData.get('sanReason')

            if (!isNaN(Number(sanMin))) sanMin = Number(sanMin)
            if (!isNaN(Number(sanMax))) sanMax = Number(sanMax)

            SanCheckCard.create(
              config.options.actor.actorKey,
              { sanMin: sanMin, sanMax: sanMax, sanReason: sanReason },
              {
                sanModifier: config.dialogOptions.modifier,
                sanDifficulty: config.dialogOptions.difficulty,
                fastForward: config.options.shiftKey
              }
            )
          }
        }
        break
      case CoC7ChatMessage.CARD_TYPE_NORMAL: {
        const check = new CoC7Check()
        check.diceModifier = config.dialogOptions.modifier
        check.difficulty = config.dialogOptions.difficulty
        check.actor = !config.options.tokenKey
          ? config.options.actorId
          : config.options.tokenKey
        check.flatDiceModifier = config.dialogOptions.flatDiceModifier
        check.flatThresholdModifier = config.dialogOptions.flatThresholdModifier
        check.standby =
          game.settings.get('CoC7', 'stanbyGMRolls') &&
          game.user.isGM &&
          config.options.hasPlayerOwner
        if (config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_SKILL) {
          check.skill = config.options.skillId
          await check.roll()
        } else if (
          config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
        ) {
          await check.rollAttribute(config.options.attribute)
        } else {
          await check.rollCharacteristic(config.options.characteristic)
        }
        if (config.dialogOptions.toMessage) {
          check.toMessage()
        }
        return {
          result: check.modifiedResult,
          successLevel: check.rolledSuccessLevel,
          success: check.passed
        }
      }
      case CoC7ChatMessage.CARD_TYPE_OPPOSED:
      case CoC7ChatMessage.CARD_TYPE_COMBINED:
        {
          const check = new CoC7Check()
          check.actor = !config.options.tokenKey
            ? config.options.actorId
            : config.options.tokenKey
          check.characteristic = config.options.characteristic
          check.attribute = config.options.attribute
          check.skillId = config.options.skillId
          check.rollMode = game.settings.get('core', 'rollMode')
          check.initiator = game.user.id
          let data = {}
          if (
            config.dialogOptions.cardType === CoC7ChatMessage.CARD_TYPE_OPPOSED
          ) {
            data = {
              type: OpposedCheckCard.defaultConfig.type,
              combat: config.options.isCombat,
              action: 'new'
            }
            check.item = config.options.itemId
            check.weaponAltSkill = config.options.weaponAltSkill
            check.denyPush = true // Opposed rolled can't be pushed.
            await check._perform()
          } else {
            data = {
              type: CombinedCheckCard.defaultConfig.type,
              action: 'new'
            }
            check.difficulty = config.dialogOptions.difficulty
          }
          data.roll = check.JSONRollData
          data._rollMode = game.settings.get('core', 'rollMode')
          if (
            config.dialogOptions.cardType === CoC7ChatMessage.CARD_TYPE_OPPOSED
          ) {
            OpposedCheckCard.dispatch(data)
          } else {
            CombinedCheckCard.dispatch(data)
          }
        }
        break
    }
  }
}
