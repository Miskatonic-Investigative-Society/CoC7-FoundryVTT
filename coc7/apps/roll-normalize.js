/* global CONFIG CONST fromUuid game TokenDocument ui */
import { FOLDER_ID } from '../constants.js'
import CoC7ChatCombinedMessage from './chat-combined-message.js'
import CoC7ChatOpposedMessage from './chat-opposed-message.js'
import CoC7Check from './check.js'
import CoC7ContentLinkDialog from './content-link-dialog.js'
import CoC7DicePool from './dice-pool.js'
import CoC7Link from './link.js'
import CoC7RollDialog from './roll-dialog.js'
import CoC7SanCheckCard from './san-check-card.js'
import CoC7SanDataDialog from './san-data-dialog.js'
import CoC7Utilities from './utilities.js'
import deprecated from '../deprecated.js'

export default class CoC7RollNormalize {
  /**
   * Roll types
   * @returns {object}
   */
  static get ROLL_TYPE () {
    return {
      ATTRIBUTE: 'R/AT',
      CHARACTERISTIC: 'R/CH',
      COMBAT: 'R/CO',
      MANUAL: 'R/MA',
      SKILL: 'R/SK',
      ENCOUNTER: 'R/EC',
      WEAPON: 'R/WP'
    }
  }

  /**
   * Chat card types
   * @returns {object}
   */
  static get CARD_TYPE () {
    return {
      COMBINED: 'C/CO',
      NORMAL: 'C/NO',
      OPPOSED: 'C/OP',
      SAN_CHECK: 'C/SC'
    }
  }

  /**
   * Get valid card types for roll type
   * @param {object} config
   * @param {string|undefined} config.attribute
   * @param {string} config.rollType
   * @returns {object}
   */
  static cardTypes (config) {
    if (config.cardTypeFixed) {
      return null
    }
    if (config.rollType === CoC7RollNormalize.ROLL_TYPE.COMBAT) {
      return null
    }
    const select = {
      [CoC7RollNormalize.CARD_TYPE.NORMAL]: 'CoC7.RegularRollCard',
      [CoC7RollNormalize.CARD_TYPE.COMBINED]: 'CoC7.CombinedRollCard',
      [CoC7RollNormalize.CARD_TYPE.OPPOSED]: 'CoC7.OpposedRollCard'
    }
    if (config.rollType === CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE && config.key === 'san') {
      select[CoC7RollNormalize.CARD_TYPE.SAN_CHECK] = 'CoC7.SanityLossEncounter'
    }
    return select
  }

  /**
   * Normalize a roll request
   * @param {object} options
   * @returns {Promise<object>}
   */
  static async normalizeRequest (options) {
    let okay = false
    if (typeof options.modifier !== 'undefined') {
      deprecated.warningLogger({
        was: 'roll.modifier',
        now: 'roll.poolModifier',
        until: 15
      })
      options.poolModifier = options.modifier
      delete options.modifier
    }
    if (options.actor && options.actor instanceof TokenDocument) {
      options.actor = options.actor.object
    }
    const config = {
      actorUuid: options.actor?.uuid,
      askValue: options.askValue ?? false,
      callbackUuid: options.callbackUuid ?? false,
      callbackContext: options.callbackContext ?? false,
      cardType: options.cardType ?? '',
      cardTypeFixed: options.cardTypeFixed ?? false,
      chatMessage: options.chatMessage ?? true,
      difficulty: options.difficulty ?? CoC7DicePool.difficultyLevel[game.settings.get(FOLDER_ID, 'defaultCheckDifficulty')],
      disableFlatDiceModifier: options.disableFlatDiceModifier ?? false,
      disableFlatThresholdModifier: options.disableFlatThresholdModifier ?? false,
      displayName: options.displayName ?? false,
      flatDiceModifier: options.flatDiceModifier ?? 0,
      flatThresholdModifier: options.flatThresholdModifier ?? 0,
      hasPlayerOwner: options.actor?.hasPlayerOwner ?? false,
      isAltKey: options.event?.altKey === true,
      isBlind: options.isBlind ?? (game.settings.get('core', 'rollMode') === CONST.DICE_ROLL_MODES.BLIND),
      isCombat: options.event?.currentTarget?.classList?.contains('combat') ?? false,
      isCtrlKey: options.isCtrlKey ?? CoC7Utilities.isCtrlKey(options.event ?? false),
      isShiftKey: options.isShiftKey === true || options.fastForward === true || options.event?.shiftKey === true,
      key: options.key ?? '',
      poolModifier: options.poolModifier ?? 0,
      preventStandby: options.preventStandby ?? false,
      rollType: options.rollType ?? CoC7RollNormalize.ROLL_TYPE.MANUAL,
      runRoll: options.runRoll ?? true,
      standbyRightIcon: options.standbyRightIcon ?? '',
      threshold: options.threshold,
      hideDifficulty: options.hideDifficulty ?? false
    }
    if (typeof config.actorUuid !== 'undefined') {
      if (typeof options.attribute === 'undefined' && options.event?.currentTarget?.closest('.attribute')?.dataset.attrib) {
        options.attribute = options.event?.currentTarget.closest('.attribute').dataset.attrib
      } else if (typeof options.characteristic === 'undefined' && options.event?.currentTarget?.closest('.attribute')?.dataset.characteristic) {
        options.characteristic = options.event?.currentTarget.closest('.attribute').dataset.characteristic
      } else if (typeof options.itemUuid === 'undefined' && options.event?.currentTarget?.closest('.skill')?.dataset.itemUuid) {
        options.itemUuid = options.event?.currentTarget.closest('.skill').dataset.itemUuid
      } else if (typeof options.itemUuid === 'undefined' && options.event?.currentTarget?.closest('.item')?.dataset.itemUuid) {
        options.itemUuid = options.event?.currentTarget.closest('.item').dataset.itemUuid
      }
      let item = false
      if (typeof options.itemUuid !== 'undefined') {
        item = await fromUuid(options.itemUuid)
      } else if (typeof options.skillId !== 'undefined') {
        item = options.actor.items.get(options.skillId)
      } else if (typeof options.skillName !== 'undefined') {
        item = options.actor.getSkillByName(options.skillName)
      }
      options.sanMin = options.actor?.system?.special?.sanLoss?.checkPassed ?? ''
      options.sanMax = options.actor?.system?.special?.sanLoss?.checkFailled ?? ''
      options.sanReason = options.actor?.system.infos.type?.length ? options.actor.system.infos.type : options.actor.name
      if (item !== false) {
        if (item.type === 'skill') {
          config.rollType = CoC7RollNormalize.ROLL_TYPE.SKILL
          config.key = item.uuid
          if (config.displayName === false) {
            config.displayName = item.name
          }
          if (config.poolModifier === 0) {
            config.poolModifier = item.system.bonusDice
          }
          okay = true
        } else if (item.type === 'weapon') {
          config.rollType = CoC7RollNormalize.ROLL_TYPE.WEAPON
          config.key = item.uuid
          if (config.displayName === false) {
            config.displayName = item.name
          }
          if (config.poolModifier === 0) {
            config.poolModifier = item.system.bonusDice
          }
          okay = true
        } else {
          ui.notifications.warn('CoC7.Errors.UnknownItem', { localize: true })
          return false
        }
        if (typeof item.flags[FOLDER_ID]?.cocidFlag?.id === 'string' && item.flags[FOLDER_ID].cocidFlag.id !== '') {
          config.cocid = item.flags[FOLDER_ID].cocidFlag.id
        }
      } else if (typeof options.attribute !== 'undefined' && ['lck', 'san'].includes(options.attribute)) {
        config.rollType = CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE
        config.key = options.attribute
        if (config.displayName === false) {
          config.displayName = CONFIG.Actor.dataModels.character.defineSchema().attribs.getField(config.key).hint ?? false
          if (config.displayName !== false) {
            config.displayName = game.i18n.localize(config.displayName)
          }
        }
        if (config.poolModifier === 0) {
          config.poolModifier = options.actor.system.attribs[config.key].bonusDice
        }
        okay = true
      } else if (typeof options.characteristic !== 'undefined' && typeof options.actor.system.characteristics[options.characteristic] !== 'undefined') {
        config.rollType = CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC
        config.key = options.characteristic
        if (config.displayName === false) {
          config.displayName = CONFIG.Actor.dataModels.character.defineSchema().characteristics.getField(config.key)?.hint ?? false
          if (config.displayName !== false) {
            config.displayName = game.i18n.localize(config.displayName)
          }
        }
        if (config.poolModifier === 0) {
          config.poolModifier = options.actor.system.characteristics[config.key].bonusDice
        }
        okay = true
      }
    }
    if (!okay && typeof options.event === 'undefined' && ![CoC7RollNormalize.ROLL_TYPE.MANUAL, CoC7RollNormalize.ROLL_TYPE.ENCOUNTER].includes(config.rollType)) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ErrorNotFound', { missing: game.i18n.localize('CoC7.Roll') }))
      return false
    }
    if (![CoC7RollNormalize.CARD_TYPE.COMBINED, CoC7RollNormalize.CARD_TYPE.NORMAL, CoC7RollNormalize.CARD_TYPE.OPPOSED, CoC7RollNormalize.CARD_TYPE.SAN_CHECK].includes(config.cardType)) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ErrorInvalidFormula', { value: game.i18n.localize('CoC7.ErrorInvalidCardType') }))
      return false
    }
    if (!config.askValue && typeof config.threshold === 'undefined' && ![CoC7RollNormalize.ROLL_TYPE.SKILL, CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC, CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE, CoC7RollNormalize.ROLL_TYPE.ENCOUNTER].includes(config.rollType)) {
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.ErrorInvalidFormula', { value: game.i18n.localize('CoC7.ErrorInvalidRollType') }))
      return false
    }
    config.poolModifier = Math.max(-CoC7DicePool.maxDicePenalty, Math.min(CoC7DicePool.maxDiceBonus, config.poolModifier))
    return config
  }

  /**
   * Normalize and process a roll request
   * @param {option} options
   * @returns {void|object}
   */
  static async trigger (options = {}) {
    const config = await CoC7RollNormalize.normalizeRequest(options)
    if (config === false) {
      return
    }
    if (config.isCtrlKey && game.user.isGM && [CoC7RollNormalize.CARD_TYPE.NORMAL, CoC7RollNormalize.CARD_TYPE.SAN_CHECK].includes(config.cardType)) {
      CoC7RollNormalize.createLink(config)
    } else {
      if (!config.isShiftKey) {
        try {
          await CoC7RollNormalize.createRoll(config)
        } catch (e) {
          console.error(e)
          return
        }
      }
      if (config.runRoll) {
        return CoC7RollNormalize.runRoll(config)
      } else {
        return config
      }
    }
  }

  /**
   * Create Link
   * @param {object} config
   */
  static createLink (config) {
    switch (config.rollType) {
      case CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE:
      case CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC:
      case CoC7RollNormalize.ROLL_TYPE.COMBAT:
      case CoC7RollNormalize.ROLL_TYPE.SKILL:
      case CoC7RollNormalize.ROLL_TYPE.ENCOUNTER:
        {
          const linkData = {}
          if (config.rollType === CoC7RollNormalize.ROLL_TYPE.SKILL) {
            linkData.check = CoC7Link.CHECK_TYPE.CHECK
            linkData.subtype = CoC7Link.LINK_TYPE.SKILL
            linkData.name = config.cocid
            linkData.label = config.displayName
            if (!linkData.name) return
          } else if (config.rollType === CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC) {
            linkData.check = CoC7Link.CHECK_TYPE.CHECK
            linkData.subtype = CoC7Link.LINK_TYPE.CHARACTERISTIC
            linkData.name = config.key
          } else if (config.rollType === CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE) {
            if (config.isAltKey && config.key === 'san') {
              linkData.check = CoC7Link.CHECK_TYPE.SANLOSS
            } else {
              linkData.check = CoC7Link.CHECK_TYPE.CHECK
              linkData.subtype = CoC7Link.LINK_TYPE.ATTRIBUTE
              linkData.name = config.key
            }
          } else if (config.rollType === CoC7RollNormalize.ROLL_TYPE.COMBAT) {
            linkData.check = CoC7Link.CHECK_TYPE.ITEM
            linkData.name = config.cocid
            linkData.label = config.displayName
          } else if (config.rollType === CoC7RollNormalize.ROLL_TYPE.ENCOUNTER) {
            linkData.check = CoC7Link.CHECK_TYPE.SANLOSS
            linkData.sanMin = config.sanMin
            linkData.sanMax = config.sanMax
            linkData.sanReason = config.sanReason
          } else {
            return
          }
          CoC7ContentLinkDialog.create(linkData)
        }
        break
    }
  }

  /**
   * Prompt for changes to normalized roll request
   * @param {object} config
   */
  static async createRoll (config) {
    const usage = await CoC7RollDialog.create(config)
    config.cardType = usage.cardType
    config.poolModifier = usage.poolModifier
    config.difficulty = usage.difficulty
    config.flatDiceModifier = usage.flatDiceModifier
    config.flatThresholdModifier = usage.flatThresholdModifier
    config.threshold = usage.threshold
  }

  /**
   * Perform a normalized roll request
   * @param {object} config
   * @returns {void|CoC7Check}
   */
  static async runRoll (config) {
    switch (config.cardType) {
      case CoC7RollNormalize.CARD_TYPE.SAN_CHECK:
        {
          const usage = await CoC7SanDataDialog.create()
          CoC7SanCheckCard.create(config.actorUuid, {
            sanMin: usage.sanMin || 0,
            sanMax: usage.sanMax || 0,
            sanReason: usage.sanReason,
            poolModifier: config.poolModifier,
            difficulty: config.difficulty
          })
        }
        break
      case CoC7RollNormalize.CARD_TYPE.NORMAL:
        {
          const check = new CoC7Check()
          check.poolModifier = config.poolModifier
          check.difficulty = config.difficulty
          check.actor = config.actorUuid
          check.flatDiceModifier = config.flatDiceModifier
          check.flatThresholdModifier = config.flatThresholdModifier
          check.standby = !config.preventStandby && game.settings.get(FOLDER_ID, 'stanbyGMRolls') && game.user.isGM && config.hasPlayerOwner
          if (check.standby && config.standbyRightIcon !== '') {
            check.standbyRightIcon = config.standbyRightIcon
          }
          if (config.callbackUuid && config.callbackContext) {
            check.setCallback(config.callbackUuid, config.callbackContext)
          }
          check.isCombat = config.isCombat
          check.blind = config.isBlind
          if (config.flavor) {
            check.flavor = config.flavor
          }
          switch (config.rollType) {
            case CoC7RollNormalize.ROLL_TYPE.SKILL:
              await check.rollSkill(config.key)
              break
            case CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE:
              await check.rollAttribute(config.key)
              break
            case CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC:
              await check.rollCharacteristic(config.key)
              break
            case CoC7RollNormalize.ROLL_TYPE.MANUAL:
              await check.rollManual(config.threshold)
              break
          }
          if (config.chatMessage) {
            check.toMessage()
          }
          return check
        }
        break // eslint-disable-line no-unreachable
      case CoC7RollNormalize.CARD_TYPE.COMBINED:
      case CoC7RollNormalize.CARD_TYPE.OPPOSED:
        {
          const parts = [
            config.actorUuid
          ]
          if (config.rollType === CoC7RollNormalize.ROLL_TYPE.ATTRIBUTE) {
            parts.push('attribute')
          } else if (config.rollType === CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC) {
            parts.push('characteristic')
          } else if (config.rollType === CoC7RollNormalize.ROLL_TYPE.SKILL) {
            parts.push('skill')
          } else if (config.rollType === CoC7RollNormalize.ROLL_TYPE.WEAPON) {
            parts.push('item')
          }
          parts.push(config.key)
          if (config.poolModifier < 0) {
            parts.push(config.poolModifier)
          } else if (config.poolModifier > 0) {
            parts.push('+' + config.poolModifier)
          }
          parts.push(config.difficulty)
          if (config.cardType === CoC7RollNormalize.CARD_TYPE.COMBINED) {
            CoC7ChatCombinedMessage.joinGroupMessage({
              type: 'combined',
              isCombat: config.isCombat,
              rollRequisites: [parts.join('#')]
            })
          } else if (config.cardType === CoC7RollNormalize.CARD_TYPE.OPPOSED) {
            CoC7ChatOpposedMessage.joinGroupMessage({
              isCombat: config.isCombat,
              rollRequisites: [parts.join('#')]
            })
          }
        }
        break
    }
  }
}
