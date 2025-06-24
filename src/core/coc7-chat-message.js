/* global game, ui */
import { CoC7Check } from './check.js'
import { CoC7ContentLinkDialog } from '../features/link-creation/coc7-content-link-dialog.js'
import { isCtrlKey } from '../shared/dice/helper.js'
import { RollDialog } from '../shared/ui-dialogs/roll-dialog.js'
import { CombinedCheckCard } from '../features/check-resolution/combined-roll.js'
import { OpposedCheckCard } from '../features/check-resolution/opposed-roll.js'
import { SanCheckCard } from '../features/sanity/chat/san-check.js'
import { SanDataDialog } from '../features/sanity/apps/sandata-dialog.js'
import { CoC7Link } from '../features/link-creation/coc7-link.js'
import { CoC7Utilities } from '../shared/utilities.js'

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

  static get ROLL_TYPE_ENCOUNTER () {
    return 'R/EC'
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

  static get CARD_TYPE_NONE () {
    return 'C/NO'
  }

  // static get ROLL_TO_CHAT () {
  //   return 'R/CH'
  // }

  // static get ROLL_TO_CLIPBOARD () {
  //   return 'R/CL'
  // }

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
      typeof options.event === 'undefined' &&
      typeof options.cardType !== 'undefined' &&
      typeof options.actor !== 'undefined' &&
      (typeof options.skillId !== 'undefined' ||
        typeof options.skillName !== 'undefined' ||
        typeof options.attribute !== 'undefined' ||
        typeof options.characteristic !== 'undefined' ||
        options.rollType === CoC7ChatMessage.ROLL_TYPE_ENCOUNTER)
    ) {
      if (typeof options.skillId !== 'undefined') {
        if (options.actor.items.get(options.skillId)) {
          options.rollType = CoC7ChatMessage.ROLL_TYPE_SKILL
        }
      } else if (typeof options.skillName !== 'undefined') {
        const skillIds = options.actor.getSkillsByName(options.skillName)
        if (skillIds.length > 0) {
          options.skillId = skillIds[0].id
          options.rollType = CoC7ChatMessage.ROLL_TYPE_SKILL
        }
      } else if (
        typeof options.attribute !== 'undefined' &&
        ['lck', 'san'].includes(options.attribute)
      ) {
        options.rollType = CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
      } else if (
        typeof options.characteristic !== 'undefined' &&
        typeof options.actor.system.characteristics[
          options.characteristic
        ] !== 'undefined'
      ) {
        options.rollType = CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC
      }
    } else if (
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
        CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE,
        CoC7ChatMessage.ROLL_TYPE_ENCOUNTER
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
        shiftKey: options.fastForward ?? options.event?.shiftKey ?? options.fastForward ?? false,
        altKey: options.event?.altKey ?? false,
        isCtrlKey: isCtrlKey(options.event ?? false),
        createEncounter: options.createEncounter ?? false,
        openLinkTool: options.openLinkTool ?? false,
        sendToChat: options.sendToChat ?? false,
        sendToClipboard: options.sendToClipboard ?? false,
        isCombat:
          options.event?.currentTarget.classList?.contains('combat') ?? false,
        preventStandby: options.preventStandby ?? false,
        bonusDice: 0
      },
      dialogOptions: {
        rollType: options.rollType,
        cardType: options.cardType,
        attribute: '',
        chatMessage: options.chatMessage ?? true,
        forcedCardType: options.forcedCardType ?? false,
        hideDifficulty: options.hideDifficulty ?? false
      }
    }
    switch (config.dialogOptions.rollType) {
      case CoC7ChatMessage.ROLL_TYPE_SKILL:
      case CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC:
      case CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE:
      case CoC7ChatMessage.ROLL_TYPE_ENCOUNTER:
        config.options.skillId =
          options.skillId ??
          options.event?.currentTarget.closest('.item')?.dataset.skillId
        config.options.itemId =
          options.event?.currentTarget.closest('.item')?.dataset.itemId
        config.options.characteristic =
          options.characteristic ??
          options.event?.currentTarget.parentElement.dataset.characteristic
        config.options.attribute =
          options.attribute ??
          options.event?.currentTarget.parentElement.dataset.attrib
        config.dialogOptions.attribute = config.options.attribute
        config.options.actorId =
          options.event?.currentTarget.closest('form').dataset.actorId ??
          options.actor.id
        config.options.tokenKey =
          options.event?.currentTarget.closest('form').dataset.tokenId ??
          options.actor.tokenKey
        config.options.weaponAltSkill =
          options.event?.currentTarget.classList.contains('alternativ-skill')
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
            !config.options.actor.system.characteristics[
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
            !config.options.actor.system.attribs[config.options.attribute]
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
          options.difficulty ??
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
      (config.options.isCtrlKey) &&
      game.user.isGM &&
      [
        CoC7ChatMessage.CARD_TYPE_NORMAL,
        CoC7ChatMessage.CARD_TYPE_SAN_CHECK
      ].includes(config.dialogOptions.cardType)
    ) {
      CoC7ChatMessage.createLink(config)
    } else if (
      (config.options.sendToChat || config.options.sendToClipboard || config.options.openLinkTool || config.options.createEncounter) &&
      game.user.isGM &&
      CoC7ChatMessage.CARD_TYPE_NONE === config.dialogOptions.cardType
    ) {
      CoC7ChatMessage.createLink(config)
    } else {
      if (typeof config.options.actor !== 'undefined') {
        if (typeof config.options.attribute !== 'undefined') {
          const bonusDice = config.options.actor.system?.attribs?.[config.options.attribute]?.bonusDice
          if (bonusDice) {
            config.dialogOptions.modifier = bonusDice
          }
        } else if (typeof config.options.characteristic !== 'undefined') {
          const bonusDice = config.options.actor.system?.characteristics?.[config.options.characteristic]?.bonusDice
          if (bonusDice) {
            config.dialogOptions.modifier = bonusDice
          }
        } else if (typeof config.options.itemId !== 'undefined') {
          const itemModifiers = Object.values(config.options.actor.system.skills).find(k => k.foundryID === config.options.itemId)
          if (typeof itemModifiers?.bonusDice !== 'undefined') {
            config.dialogOptions.modifier = itemModifiers.bonusDice
          }
        }
        config.dialogOptions.modifier = Math.min(Math.max(config.dialogOptions.modifier, -2), 2)
      }
      if (!config.options.shiftKey) {
        await CoC7ChatMessage.createRoll(config)
      }
      return CoC7ChatMessage.runRoll(config)
    }
  }

  static createLink (config) {
    switch (config.dialogOptions.rollType) {
      case CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE:
      case CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC:
      case CoC7ChatMessage.ROLL_TYPE_COMBAT:
      case CoC7ChatMessage.ROLL_TYPE_SKILL:
      case CoC7ChatMessage.ROLL_TYPE_ENCOUNTER:
        {
          const linkData = {
            type: 'CoC7Link'
          }
          if (config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_SKILL) {
            linkData.check = CoC7Link.CHECK_TYPE.CHECK
            linkData.linkType = CoC7Link.LINK_TYPE.SKILL
            linkData.name = config.options.actor.items.get(config.options.skillId)?.shortName
            if (!linkData.name) return
          } else if (config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_CHARACTERISTIC) {
            linkData.check = CoC7Link.CHECK_TYPE.CHECK
            linkData.linkType = CoC7Link.LINK_TYPE.CHARACTERISTIC
            linkData.name = config.options.characteristic
          } else if (config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE) {
            if ((config.options.altKey || config.options.createEncounter) && config.options.attribute === 'san') {
              linkData.check = CoC7Link.CHECK_TYPE.SANLOSS
            } else {
              linkData.check = CoC7Link.CHECK_TYPE.CHECK
              linkData.linkType = CoC7Link.LINK_TYPE.ATTRIBUTE
              linkData.name = config.options.attribute
            }
          } else if (config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_COMBAT) {
            linkData.check = CoC7Link.CHECK_TYPE.ITEM
            linkData.name = config.options.weaponName
          } else if (config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_ENCOUNTER) {
            linkData.check = CoC7Link.CHECK_TYPE.SANLOSS
            linkData.sanMin = config.options.actor?.system?.special?.sanLoss?.checkPassed
            linkData.sanMax = config.options.actor?.system?.special?.sanLoss?.checkFailled
            linkData.sanReason = config.options.actor.system.infos.type?.length
              ? config.options.actor.system.infos.type
              : config.options.actor.name
          } else {
            return
          }
          if (game.settings.get('core', 'rollMode') === 'blindroll') {
            linkData.blind = true
          }
          if (config.options.sendToChat) {
            CoC7Link.toChatMessage(linkData)
          } else if (config.options.sendToClipboard) {
            CoC7Link.fromDropData(linkData).then(link => {
              CoC7Utilities.copyToClipboard(link.link)
            })
          } else {
            CoC7ContentLinkDialog.create(linkData, { actors: [config.options.actor].filter(a => a.owners.length), hasModifiers: config.options.shiftKey })
          }
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
              { sanMin, sanMax, sanReason },
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
          !config.options.preventStandby &&
          game.settings.get('CoC7', 'stanbyGMRolls') &&
          game.user.isGM &&
          config.options.hasPlayerOwner
        if (config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_SKILL) {
          check.skill = config.options.skillId
          check.canBePushed = (check._getItemFromId(check.skill)?.system?.properties?.push ?? false)
          await check.roll()
        } else if (
          config.dialogOptions.rollType === CoC7ChatMessage.ROLL_TYPE_ATTRIBUTE
        ) {
          await check.rollAttribute(config.options.attribute)
        } else {
          await check.rollCharacteristic(config.options.characteristic)
        }
        if (config.dialogOptions.chatMessage) {
          check.toMessage()
        }
        return {
          result: check.modifiedResult,
          successLevel: check.rolledSuccessLevel,
          isFumble: check.isFumble,
          isCritical: check.isCritical,
          successLevels: {
            1: check.regularThreshold,
            2: check.hardThreshold,
            3: check.extremeThreshold
          },
          passed: check.passed
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
