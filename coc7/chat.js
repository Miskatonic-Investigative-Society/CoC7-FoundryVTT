/* global $, ChatMessage, CONST, foundry, game, Token, tokenData, ui */
import { CoC7Check } from './check.js'
import { COC7 } from './config.js'
import { CoC7MeleeInitiator } from './chat/combat/melee-initiator.js'
import { CoC7MeleeTarget } from './chat/combat/melee-target.js'
import { CoC7MeleeResoltion } from './chat/combat/melee-resolution.js'
import { CoC7RangeInitiator } from './chat/rangecombat.js'
import { CoC7Roll, chatHelper, isCtrlKey } from './chat/helper.js'
import { CoC7ConCheck } from './chat/concheck.js'
import { SanCheckCard } from './chat/cards/san-check.js'
import { OpposedCheckCard } from './chat/cards/opposed-roll.js'
import { CombinedCheckCard } from './chat/cards/combined-roll.js'
import { InteractiveChatCard } from './chat/interactive-chat-card.js'
import { DamageCard } from './chat/cards/damage.js'
import { CoC7Dice } from './dice.js'

const CHAT_COC7_MESSAGE = {
  FAKEROLL:
    '<div class="dice-roll"><div class="dice-result"><div class="dice-formula">???</div><h4 class="dice-total">?</h4></div></div>'
}

export class CoC7Chat {
  static renderChatMessageHook (chatMessage, html) {
    if (chatMessage.getFlag('CoC7', 'GMSelfRoll') && !game.user.isGM) {
      html.find('.whisper-to').remove()
      html
        .find('.flavor-text')
        .replaceWith(
          `<span class="flavor-text">${game.i18n.localize(
            'CoC7.RollSecretDice'
          )}</span>`
        )
      html
        .find('.message-content')
        .replaceWith(
          `<div class="message-content">${CHAT_COC7_MESSAGE.FAKEROLL}</div>`
        )
    }

    if (chatMessage.getFlag('CoC7', 'removeWisperTargets') && !game.user.isGM) {
      html.find('.whisper-to').remove()
    }

    if (chatMessage.getFlag('CoC7', 'fakeRoll') && game.user.isGM) {
      html
        .find('.flavor-text')
        .replaceWith(game.i18n.localize('CoC7.KeeperSentDecoy'))
      html.find('.message-content').remove()
    }
  }

  static fakeRollMessage () {
    const chatData = {
      user: game.user.id,
      flavor: game.i18n.localize('CoC7.RollSecretDice'),
      whisper: game.users.players,
      type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
      flags: {
        CoC7: {
          GMSelfRoll: false,
          removeWisperTargets: true,
          fakeRoll: true
        }
      },
      content: CHAT_COC7_MESSAGE.FAKEROLL
    }

    ChatMessage.create(chatData)
  }

  // TODO remplacer les getElementsByxxxx par querySelector

  /* -------------------------------------------- *
   *  Init sockets                                *
   *---------------------------------------------- */

  // static onMessage( data) {
  //  console.log('-->CoC7Chat.onMessage');
  //  console.log(`message received send&er :${data.user} message type : ${data.action} for message :${data.messageId}`);
  // }

  /* -------------------------------------------- *
   *  Chat Message Helpers                        *
   * -------------------------------------------- */

  static async chatListeners (app, htmlIn) {
    /* // FoundryVTT v12 */
    const html = (foundry.utils.isNewerVersion(game.version, '13') ? $(htmlIn) : htmlIn)
    html.on(
      'click',
      '.card-buttons button',
      CoC7Chat._onChatCardAction.bind(this)
    )
    html.on(
      'change',
      'input[type=range].slider',
      CoC7Chat._onChatCardRange.bind(this)
    )
    // html.on('click', '.card-buttons button', CoC7Chat._onChatCardTest.bind(this));
    html.on(
      'click',
      '.card-title',
      CoC7Chat._onChatCardToggleContent.bind(this)
    )
    html.on(
      'click',
      '.radio-switch',
      CoC7Chat._onChatCardRadioSwitch.bind(this)
    )
    html.on(
      'click',
      '.panel-switch',
      CoC7Chat._onChatCardToggleSwitch.bind(this)
    )

    html.on(
      'click',
      '.simple-flag',
      CoC7Chat._onChatCardToggleSwitch.bind(this)
    )
    html.on('click', '.volley-size', CoC7Chat._onChatCardVolleySize.bind(this))

    html.on(
      'click',
      '.dropdown-element',
      CoC7Chat._onDropDownElementSelected.bind(this)
    )
    html.on('click', '.simple-toggle', CoC7Chat._onToggleSelected.bind(this))
    // html.on('click', '.is-outnumbered', CoC7Chat._onOutnumberedSelected.bind(this));

    html.on('click', '.target-selector', CoC7Chat._onTargetSelect.bind(this))

    html.on('dblclick', '.open-actor', CoC7Chat._onOpenActor.bind(this))

    html.on('click', 'coc7-inline-result', CoC7Chat._onInline.bind(this))

    // RollCard.bindListerners( html);
    OpposedCheckCard.bindListerners(html)
    CombinedCheckCard.bindListerners(html)

    /* // FoundryVTT v12 */
    // HTML needs changed to support this correctly
    if (foundry.utils.isNewerVersion(game.version, '13')) {
      html.on('click', '.dice-roll', (event) => {
        event.preventDefault()

        // Toggle the message flag
        const roll = event.currentTarget
        const message = game.messages.get(roll.closest('.message').dataset.messageId)
        message._rollExpanded = !message._rollExpanded
        // Expand or collapse tooltips
        const tooltips = roll.querySelectorAll('.dice-tooltip')
        for (const tip of tooltips) {
          if (message._rollExpanded) {
            $(tip).slideDown(200)
          } else {
            $(tip).slideUp(200)
          }
          tip.classList.toggle('expanded', message._rollExpanded)
        }
      })
    }
  }

  static _onOpenActor (event) {
    event.preventDefault()
    const actorKey = event.currentTarget.dataset.actorKey
    if (actorKey) {
      const actor = chatHelper.getActorFromKey(actorKey) // REFACTORING (2)
      if (actor.isOwner) actor.sheet.render(true)
    }
  }

  static async onUpdateChatMessage (chatMessage) {
    ui.chat.scrollBottom()

    // if( chatMessage.getFlag( 'CoC7', 'reveled')){
    // }
    if (game.user.isGM && (chatMessage.type === 0 /* // FoundryVTT v11 */ || chatMessage.style === 0 /* // FoundryVTT v12 */)) {
      const card = $(chatMessage.content)[0]
      if (card.classList.contains('melee')) {
        if (card.dataset.resolved === 'true') {
          if (card.classList.contains('initiator')) {
            if (card.dataset.targetCard) {
              const initiator = CoC7MeleeInitiator.getFromMessageId(
                chatMessage.id
              )
              const target = CoC7MeleeTarget.getFromMessageId(
                initiator.targetCard
              )
              if (target.resolved) {
                const resolutionCard = new CoC7MeleeResoltion(
                  chatMessage.id,
                  target.messageId,
                  target.resolutionCard
                )
                await resolutionCard.resolve()
                if (!initiator.checkRevealed) await initiator.revealCheck()
              }
            } else {
              const initiator = CoC7MeleeInitiator.getFromMessageId(
                chatMessage.id
              )
              if (initiator.resolutionCard) {
                const resolutionCard = new CoC7MeleeResoltion(
                  chatMessage.id,
                  null,
                  initiator.resolutionCard
                )
                await resolutionCard.resolve()
                if (!initiator.checkRevealed) await initiator.revealCheck()
              }
            }
          }
          if (card.classList.contains('target')) {
            const target = CoC7MeleeTarget.getFromMessageId(chatMessage.id)
            const resolutionCard = new CoC7MeleeResoltion(
              target.parentMessageId,
              chatMessage.id,
              target.resolutionCard
            )
            await resolutionCard.resolve()
            if (!target.meleeInitiator.checkRevealed) {
              await target.meleeInitiator.revealCheck()
            }
          }
        }
      }
    }
  }

  static async renderMessageHook (message, html) {
    ui.chat.scrollBottom()

    InteractiveChatCard.bindListeners(html)

    if (message.getFlag('CoC7', 'checkRevealed')) {
      html.find('.dice-roll').removeClass('gm-visible-only')
      html[0].dataset.checkRevealed = true
    }

    // Handle showing dropdown selection
    html
      .find('.dropbtn')
      .click(event =>
        event.currentTarget
          .closest('.dropdown')
          .querySelector('.dropdown-content')
          .classList.toggle('show')
      )
    html
      .find('.dropdown')
      .mouseleave(event =>
        event.currentTarget
          .querySelector('.dropdown-content')
          .classList.remove('show')
      )

    // console.log('************************************************************-->CoC7Chat.messageListeners message :' + message.id);
    // message.data.content = "";
    // data.message.content = "";

    // When a new card is published, check wether it's a roll that modifies an other card.
    if (game.user.isGM) {
      const card = html[0].querySelector('.coc7.chat-card')
      if (card) {
        if (
          card.classList.contains('roll-card') &&
          !(card.dataset.processed === 'true') &&
          card.dataset.refMessageId
        ) {
          const roll = CoC7Roll.getFromElement(card)

          if (card.dataset.side === 'target') {
            roll.defendantId = card.dataset.tokenId
              ? card.dataset.tokenId
              : card.dataset.actorId
          }
          if (card.dataset.side === 'initiator') {
            roll.initiatorId = card.dataset.tokenId
              ? card.dataset.tokenId
              : card.dataset.actorId
          }
          card.dataset.processed = 'true'

          CoC7Chat.updateCombatCardTarget(roll)
        }
      }
    }

    const userOnly = html.find('.target-only')
    for (const element of userOnly) {
      if (!game.user.isGM) {
        element.style.display = 'none'
        const actorId = element.getAttribute('data-actor-id')
        if (actorId) {
          if (game.actors.get(actorId).isOwner) {
            element.style.display = 'block'
          }
        }
      }
    }

    const gmOnly = html.find('.gm-only')
    for (const zone of gmOnly) {
      if (!game.user.isGM) {
        zone.style.display = 'none'
      }
    }

    const userVisibleOnly = html.find('.user-visible-only')
    for (const elem of userVisibleOnly) {
      if (game.user.isGM) elem.style.display = 'none'
    }

    const gmVisibleOnly = html.find('.gm-visible-only')
    for (const elem of gmVisibleOnly) {
      if (!(game.user.isGM || (game.user.isTrusted && game.settings.get('CoC7', 'trustedCanSeeChatCard')))) elem.style.display = 'none'
    }

    const ownerVisibleOnly = html.find('.owner-visible-only')
    for (const zone of ownerVisibleOnly) {
      // Try retrieving actor
      let actor = CoC7Chat._getActorFromKey(zone.dataset?.actorKey) // Try with self.
      if (!actor) actor = CoC7Chat._getChatCardActor(zone.closest('.chat-card')) // Try with closest chat card.
      if (!actor) {
        actor = CoC7Chat._getActorFromKey(zone.parentElement.dataset.actorKey) // Try with parent element.
      }
      if (!actor) {
        actor = CoC7Chat._getActorFromKey(
          zone.closest('[data-actor-key]')?.dataset.actorKey
        ) // Try with closest data-actor-key
      }
      if (!actor) {
        actor = CoC7Chat._getActorFromKey(
          zone.closest('[data-token-key]')?.dataset.actorKey
        ) // Try with closest data-token-key
      }

      // const actor = game.actors.get( actorId);
      if ((actor && !actor.isOwner) || game.user.isGM) {
        zone.style.display = 'none'
      } // if current user doesn't own this he can't interract
      // if( !CoC7Chat.isCardOwner( zone.closest('.chat-card'))) {zone.style.display = 'none';}
    }

    if (!game.user.isGM) {
      // GM can see everything
      const ownerOnly = html.find('.owner-only')
      for (const zone of ownerOnly) {
        // Try retrieving actor
        let actor = CoC7Chat._getActorFromKey(
          zone.dataset?.actorKey || zone.dataset?.actorId
        ) // Try with self.
        if (!actor) {
          actor = CoC7Chat._getChatCardActor(zone.closest('.chat-card')) // Try with closest chat card.
        }
        if (!actor) {
          actor = CoC7Chat._getActorFromKey(zone.parentElement.dataset.actorKey) // Try with parent element.
        }
        if (!actor) {
          actor = CoC7Chat._getActorFromKey(
            zone.closest('[data-actor-key]')?.dataset.actorKey
          ) // Try with closest data-actor-key
        }
        if (!actor) {
          actor = CoC7Chat._getActorFromKey(
            zone.closest('[data-token-key]')?.dataset.actorKey
          ) // Try with closest data-token-key
        }

        // const actor = game.actors.get( actorId);
        if ((actor && !actor.isOwner) || (!actor && !game.user.isGM)) {
          zone.style.display = 'none'
        } // if current user doesn't own this he can't interract
        // if( !CoC7Chat.isCardOwner( zone.closest('.chat-card'))) {zone.style.display = 'none';}
      }

      const gmSelectOnly = html.find('.gm-select-only')
      if (!(game.user.isTrusted && game.settings.get('CoC7', 'trustedCanModfyChatCard'))) {
        for (const select of gmSelectOnly) {
          select.classList.add('inactive')
          select.classList.remove('simple-flag')
        }
      }

      const gmRangeOnly = html.find('.gm-range-only')
      if (!(game.user.isTrusted && game.settings.get('CoC7', 'trustedCanModfyChatCard'))) {
        for (const range of gmRangeOnly) {
          range.disabled = true
        }
      }
    }
  }

  static get actionTypeString () {
    return {
      fightBack: 'CoC7.fightBack',
      maneuver: 'CoC7.maneuver',
      dodging: 'CoC7.dodge'
    }
  }

  static _onTargetSelect (event) {
    const index = parseInt(event.currentTarget.dataset.key)
    const targetsSelector = event.currentTarget.closest('.targets-selector')
    for (const i of targetsSelector.querySelectorAll('img')) {
      i.style.border = 'none'
    }
    targetsSelector
      .querySelector(`[data-key="${index}"]`)
      .querySelector('img').style.border = '1px solid #000'
    const targets = event.currentTarget.closest('.targets')
    for (const t of targets.querySelectorAll('.target')) {
      t.style.display = 'none'
      t.dataset.active = 'false'
    }
    const targetToDisplay = targets.querySelector(
      `[data-target-key="${index}"]`
    )
    targetToDisplay.style.display = 'block'
    targetToDisplay.dataset.active = 'true'
    // const chatCard = event.currentTarget.closest('.chat-card.range');
    // const rangeInitiator = CoC7RangeInitiator.getFromCard( chatCard);
  }

  static _onDropDownElementSelected (event) {
    event.preventDefault()

    const card = event.currentTarget.closest('.chat-card')
    if (card.classList.contains('target')) {
      CoC7MeleeTarget.updateSelected(card, event)
      return
    }

    // clear all drop down and highlight this particular one
    const dropDownBoxes = event.currentTarget
      .closest('.response-selection')
      .querySelectorAll('.toggle-switch')
    for (const dpdnBox of dropDownBoxes) {
      dpdnBox.classList.remove('switched-on')
    }
    event.currentTarget.closest('.toggle-switch').classList.add('switched-on')

    // close dropdown
    event.currentTarget.closest('.dropdown-content').classList.toggle('show')

    // Display the roll button
    const selectedBox = event.currentTarget
      .closest('.defender-action-select')
      .querySelector('.selected-action')
    selectedBox.style.display = 'block'
    const button = selectedBox.querySelector('button')

    // Pass the initiator Id - Build can be retrieved from that

    // Pass the initiator item

    // Pass the defendant Id

    // Pass the defendant action
    button.dataset.action = 'defending'
    button.dataset.actionType = event.currentTarget.dataset.action
    button.dataset.defenderChoice = event.currentTarget.dataset.action
    button.dataset.skillId = event.currentTarget.dataset.skillId
    button.dataset.skillValue = event.currentTarget.dataset.skillValue
    button.dataset.skillName = event.currentTarget.dataset.skillName
    button.dataset.itemId = event.currentTarget.dataset.weaponId
    button.dataset.itemName = event.currentTarget.dataset.weaponName

    // Put some text in the button
    switch (event.currentTarget.dataset.action) {
      case 'maneuver':
        button.innerText = `${game.i18n.localize(
          COC7.combatCards[event.currentTarget.dataset.action]
        )} : ${event.currentTarget.dataset.skillName} (${
          event.currentTarget.dataset.skillValue
        }%)`
        break
      case 'fightBack':
        button.innerText = `${game.i18n.localize(
          COC7.combatCards[event.currentTarget.dataset.action]
        )} : ${event.currentTarget.dataset.weaponName} (${
          event.currentTarget.dataset.skillValue
        }%)`
        break

      default:
        break
    }
    // Save action for the roll
  }

  static async _onInline (event) {
    event.preventDefault()
    const a = event.currentTarget

    if (a.classList.contains('inline-result')) {
      if (a.classList.contains('expanded')) {
        return CoC7Check._collapseInlineResult(a)
      } else {
        return CoC7Check._expandInlineResult(a)
      }
    }
  }

  static _onToggleSelected (event) {
    const card = event.currentTarget.closest('.chat-card')
    if (card.classList.contains('target')) {
      CoC7MeleeTarget.updateSelected(card, event)
      return
    }

    if (event.currentTarget.dataset.skillId === '') {
      ui.notifications.error(game.i18n.localize('CoC7.ErrorNoDodgeSkill'))
      return
    }

    // clear all drop down and highlight this particular one
    const dropDownBoxes = event.currentTarget
      .closest('.response-selection')
      .querySelectorAll('.toggle-switch')
    for (const dpdnBox of dropDownBoxes) {
      dpdnBox.classList.remove('switched-on')
    }
    event.currentTarget.classList.add('switched-on') // Need to test if it's really a dodge !!!

    // Save action for the roll
    const selectedBox = event.currentTarget
      .closest('.defender-action-select')
      .querySelector('.selected-action')
    selectedBox.style.display = 'block'
    const button = selectedBox.querySelector('button')

    button.dataset.action = 'defending'
    button.dataset.actionType = 'dodging'
    button.dataset.defenderChoice = event.currentTarget.dataset.action
    button.dataset.skillId = event.currentTarget.dataset.skillId
    button.dataset.skillValue = event.currentTarget.dataset.skillValue
    button.dataset.skillName = event.currentTarget.dataset.skillName

    button.innerText = `${game.i18n.localize(
      COC7.combatCards[event.currentTarget.dataset.action]
    )} : ${event.currentTarget.dataset.skillName} (${
      event.currentTarget.dataset.skillValue
    }%)`
  }

  static _onChatCardRadioSwitch (event) {
    // console.log('-->CoC7Chat._onChatCardRadioSwitch');
    event.preventDefault()
    const optionList =
      event.currentTarget.parentElement.getElementsByClassName('radio-switch')
    let index
    for (index = 0; index < optionList.length; index++) {
      const element = optionList[index]
      if (element.dataset.property === event.currentTarget.dataset.property) {
        element.classList.add('switched-on')
      } else {
        element.classList.remove('switched-on')
      }
    }
    event.currentTarget.parentElement.dataset.selected =
      event.currentTarget.dataset.property
  }

  static async _onChatCardVolleySize (event) {
    const card = event.currentTarget.closest('.chat-card')

    if (card.classList.contains('range')) {
      if (card.classList.contains('initiator')) {
        const rangeCard = CoC7RangeInitiator.getFromCard(card)
        if (event.currentTarget.classList.contains('increase')) {
          rangeCard.changeVolleySize(1)
        } else if (event.currentTarget.classList.contains('decrease')) {
          rangeCard.changeVolleySize(-1)
        }
      }
    }
  }

  static async _onChatCardToggleSwitch (event) {
    event.preventDefault()

    const card = event.currentTarget.closest('.chat-card')
    if (card.classList.contains('melee')) {
      if (card.classList.contains('initiator')) {
        CoC7MeleeInitiator.updateCardSwitch(event)
      }

      if (card.classList.contains('target')) {
        CoC7MeleeTarget.updateCardSwitch(event)
      }
    }

    if (card.classList.contains('range')) {
      if (card.classList.contains('initiator')) {
        CoC7RangeInitiator.updateCardSwitch(event)
      }
    }

    if (card.classList.contains('damage')) {
      // CoC7Item.updateCardSwitch( event);
    }

    if (card.classList.contains('roll-card')) {
      CoC7Check.updateCardSwitch(event)
    }
  }

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static _getChatCardActor (card) {
    // if dataset.object is there => need to unescape things !!
    // if not use the dataset directly.
    const cardData = card.dataset.object
      ? JSON.parse(unescape(card.dataset.object))
      : card.dataset

    if (cardData.actorKey) return CoC7Chat._getActorFromKey(cardData.actorKey)

    // Case 1 - a synthetic actor from a Token
    const tokenKey = cardData.tokenId
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split('.')
      if (sceneId === 'TOKEN') {
        return game.actors.tokens[tokenId] // REFACTORING (2)
      } else {
        const scene = game.scenes.get(sceneId)
        if (!scene) return null
        const token = scene.getEmbeddedDocument('Token', tokenId)
        if (!token) return null
        return token.actor || new Token(tokenData).actor
      }
    }

    // Case 2 - use Actor ID directory
    const actorId = cardData.actorId
    if (actorId) return game.actors.get(actorId)

    const message = card.closest('.message')
    const messageId = message ? message.dataset.messageId : null
    if (messageId) {
      const chatMessage = game.messages.get(messageId)
      if (chatMessage.user) return chatMessage.user.character
    }

    return null
  }

  static isCardOwner (card) {
    const message = card.closest('.message')
    const messageId = message ? message.dataset.messageId : null
    if (messageId) {
      const chatMessage = game.messages.get(messageId)
      return chatMessage.ownner || false
    }

    return false
  }

  static _getActorFromKey (key) {
    if (!key) return undefined
    // Case 1 - a synthetic actor from a Token
    if (key.includes('.')) {
      // REFACTORING (2)
      const [sceneId, tokenId] = key.split('.')
      if (sceneId === 'TOKEN') {
        return game.actors.tokens[tokenId] // REFACTORING (2)
      } else {
        const scene = game.scenes.get(sceneId)
        if (!scene) return null
        const token = scene.getEmbeddedDocument('Token', tokenId)
        if (!token) return null
        return token.actor || new Token(tokenData).actor
      }
    }

    // Case 2 - use Actor ID directory
    return game.actors.get(key) || null
  }

  static getActorFromToken (tokenKey) {
    const token = CoC7Chat.getToken(tokenKey)
    return token ? token.actor : null
  }

  static getToken (tokenKey) {
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split('.')
      if (sceneId === 'TOKEN') {
        const tokenDoc = game.actors.tokens[tokenId]?.token
        return tokenDoc.object // REFACTORING (2)
      } else {
        const scene = game.scenes.get(sceneId)
        if (!scene) return null
        const token = scene.getEmbeddedDocument('Token', tokenId)
        if (!token) return null
        return token || new Token(tokenData)
      }
    }
    return null
  }

  /**
   * update a chat message with a new HTML content and populate it.
   * @param {HTMLElement} card
   */
  static async updateChatCard (card, messId = null) {
    const messageId =
      messId == null ? card.closest('.message').dataset.messageId : messId
    const message = game.messages.get(messageId)

    const msg = await message.update({ content: card.outerHTML })
    await ui.chat.updateMessage(msg, false)
    return msg
  }

  static async _onChatCardRange (event) {
    event.preventDefault()

    const button = event.currentTarget
    const card = button.closest('.chat-card')
    if (!card) return

    if (!CoC7Chat._getChatCardActor(card)) return

    const messageId = card.closest('.message').dataset.messageId

    let messageCard
    if (card.classList.contains('range')) {
      messageCard = CoC7RangeInitiator.getFromCard(card)
    } else if (card.classList.contains('target')) {
      messageCard = CoC7MeleeTarget.getFromCard(card)
    } else if (card.classList.contains('initiator')) {
      messageCard = CoC7MeleeInitiator.getFromCard(card)
    }
    messageCard.diceModifier = event.currentTarget.value
    await messageCard.updateChatCard()
    document.querySelector('[data-message-id="' + messageId + '"]').querySelector('input[type=range][name="' + button.name + '"]').focus()
  }

  static async _onChatCardAction (event) {
    // console.log('-->CoC7Chat._onChatCardAction');
    event.preventDefault()

    const button = event.currentTarget
    const card = button.closest('.chat-card')
    if (!card) return
    const originMessage = button.closest('.message')
    // const messageId = originMessage.dataset.messageId;
    const action = button.dataset.action

    if (!CoC7Chat._getChatCardActor(card)) return

    switch (action) {
      case 'useLuck': {
        const luckAmount = parseInt(button.dataset.luckAmount)
        const newSuccessLevel = parseInt(
          event.currentTarget.dataset.newSuccessLevel
        )

        if (card.classList.contains('melee')) {
          let meleeCard
          if (card.classList.contains('target')) {
            meleeCard = CoC7MeleeTarget.getFromCard(card)
          }
          if (card.classList.contains('initiator')) {
            meleeCard = CoC7MeleeInitiator.getFromCard(card)
          }
          meleeCard.upgradeRoll(luckAmount, newSuccessLevel, card) // TODO : Check if this needs to be async
        } else if (card.classList.contains('range')) {
          const rangeCard = CoC7RangeInitiator.getFromCard(card)
          const rollResult = button.closest('.roll-result')
          const rollIndex = rollResult
            ? parseInt(rollResult.dataset.index)
            : null
          if (button.classList.contains('pass-check')) {
            rangeCard.passRoll(rollIndex)
          } else {
            const upgradeIndex = parseInt(button.dataset.index)
            rangeCard.upgradeRoll(rollIndex, upgradeIndex) // TODO : Check if this needs to be async
          }
        } else if (
          card.classList.contains('roll-card') ||
          card.querySelector('.roll-result') != null
        ) {
          const check = await CoC7Check.getFromCard(card)
          if (button.classList.contains('pass-check')) {
            const luckAmount = parseInt(button.dataset.luckAmount)
            check.forcePass(luckAmount)
          } else {
            const upgradeIndex = parseInt(button.dataset.index)
            await check.upgradeCheck(upgradeIndex)
          }
        } else {
          const actor = CoC7Chat._getChatCardActor(card)
          const detailedResultPlaceHolder =
            card.querySelector('.result-details')

          if (actor.spendLuck(luckAmount)) {
            const result = card.querySelector('.dice-total')
            card.dataset.successLevel = newSuccessLevel
            card.dataset.processed = 'false' // trigger 3 updates de card
            switch (newSuccessLevel) {
              case CoC7Check.successLevel.regular:
                result.innerText = game.i18n.localize('CoC7.RegularSuccess')
                detailedResultPlaceHolder.innerText = game.i18n.format(
                  'CoC7.RollResult.LuckSpendText',
                  {
                    luckAmount,
                    successLevel: game.i18n.localize('CoC7.RegularDifficulty')
                  }
                )
                break

              case CoC7Check.successLevel.hard:
                result.innerText = game.i18n.localize('CoC7.HardSuccess')
                detailedResultPlaceHolder.innerText = game.i18n.format(
                  'CoC7.RollResult.LuckSpendText',
                  {
                    luckAmount,
                    successLevel: game.i18n.localize('CoC7.HardDifficulty')
                  }
                )
                break

              case CoC7Check.successLevel.extreme:
                result.innerText = game.i18n.localize('CoC7.ExtremeSuccess')
                detailedResultPlaceHolder.innerText = game.i18n.format(
                  'CoC7.RollResult.LuckSpendText',
                  {
                    luckAmount,
                    successLevel: game.i18n.localize('CoC7.ExtremeDifficulty')
                  }
                )
                break

              case CoC7Check.successLevel.critical:
                result.innerText = game.i18n.localize('CoC7.CriticalSuccess')
                detailedResultPlaceHolder.innerText = game.i18n.format(
                  'CoC7.RollResult.LuckSpendText',
                  {
                    luckAmount,
                    successLevel: game.i18n.localize('CoC7.CriticalDifficulty')
                  }
                )
                break

              default:
                break
            }
            result.classList.replace('failure', 'success')
            result.classList.remove('fumble')
            card.querySelector('.card-buttons').remove()
            card.querySelector('.dice-tooltip').style.display = 'none'
            await CoC7Chat.updateChatCard(card)
          } else {
            ui.notifications.error(
              game.i18n.format('CoC7.ErrorNotEnoughLuck', {
                actor: actor.name
              })
            )
          }
        }
        break
      }
      case 'push': {
        const newCard = card.cloneNode(true) // TODO not necessary
        const result = newCard.querySelector('.dice-total')
        result.innerText =
          result.innerText + game.i18n.localize('CoC7.PushingSkill')
        result.classList.remove('failure')
        newCard.querySelector('.card-buttons').remove()
        newCard.dataset.pushedRoll = true
        await CoC7Chat.updateChatCard(newCard, originMessage.dataset.messageId)
        await CoC7Check.push(card)
        break
      }
      case 'defending': {
        let defenderKey = event.currentTarget.closest('.defender-action-select')
          .dataset.tokenId
        let defender
        if (!defenderKey) {
          defenderKey = event.currentTarget.closest('.defender-action-select')
            .dataset.actorId
          defender = game.actors.get(defenderKey)
        } else {
          defender = this.getActorFromToken(defenderKey)
        }

        const responseType = event.currentTarget.dataset.actionType
        const outnumbered = event.currentTarget.dataset.outnumbered === 'true'
        const check = new CoC7Check()
        check.referenceMessageId = originMessage.dataset.messageId
        check.rollType = 'opposed'
        check.side = 'target'
        check.action = responseType
        switch (responseType) {
          case 'dodging':
            check.actor = defender
            check.skill = event.currentTarget.dataset.skillId
            check.difficulty = CoC7Check.difficultyLevel.regular
            if (outnumbered) check.diceModifier = -1

            await check.roll()
            check.toMessage()
            break
          case 'fightBack':
            check.actor = defender
            check.skill = event.currentTarget.dataset.skillId
            check.difficulty = CoC7Check.difficultyLevel.regular
            check.item = event.currentTarget.dataset.itemId
            if (outnumbered) check.diceModifier = -1

            await check.roll()
            check.toMessage()
            break
          case 'maneuver': {
            const actor = CoC7Chat._getChatCardActor(card)
            if (defender.build <= actor.build - 3) {
              ui.notifications.error(
                game.i18n.localize('CoC7.ErrorManeuverNotPossible')
              )
              return
            }
            check.actor = defender
            check.skill = event.currentTarget.dataset.skillId
            check.difficulty = CoC7Check.difficultyLevel.regular
            if (outnumbered) check.diceModifier = -1
            if (defender.build < actor.build) {
              check.diceModifier =
                check.diceModifier - (actor.build - defender.build)
            }

            if (check.diceModifier < -2) {
              check.difficulty =
                check.difficulty + Math.abs(check.diceModifier) - 2
              check.diceModifier = -2
            }

            await check.roll()
            check.toMessage()
            break
          }
          default:
            break
        }
        break
      }

      case 'melee-initiator-roll': {
        const initiator = CoC7MeleeInitiator.getFromCard(card)
        const check = await initiator.performSkillCheck(
          event.currentTarget.dataset.skill
        )
        $(button).prop('disabled', true)
        await CoC7Dice.showRollDice3d(check.dice.roll)
        await initiator.publishCheckResult()
        break
      }

      case 'melee-target-no-response': {
        const target = CoC7MeleeTarget.getFromCard(card)
        await target.publishNoReponseResult()
        break
      }

      case 'melee-target-roll': {
        const target = CoC7MeleeTarget.getFromCard(card)
        const check = await target.performSkillCheck(
          event.currentTarget.dataset.skill
        )
        $(button).prop('disabled', true)
        await CoC7Dice.showRollDice3d(check.dice.roll)
        await target.publishCheckResult()
        break
      }
      case 'roll-melee-damage': {
        const damageChatCard = new DamageCard({
          critical: button.dataset.critical === 'true',
          fastForward: event.shiftKey
        })
        damageChatCard.actorKey = button.dataset.dealer
        damageChatCard.targetKey = button.dataset.target
        damageChatCard.itemId = button.dataset.weapon
        if (originMessage.dataset.messageId) {
          damageChatCard.messageId = originMessage.dataset.messageId
        }
        damageChatCard.updateChatCard()

        // const damageCard = new CoC7DamageRoll(
        //  button.dataset.weapon,
        //  button.dataset.dealer,
        //  {
        //    targetKey: button.dataset.target,
        //    critical: 'true' == button.dataset.critical,
        //    fastForward: event.shiftKey
        //  });
        // if( originMessage.dataset.messageId) damageCard.messageId = originMessage.dataset.messageId;
        // damageCard.rollDamage();
        // if( originMessage.dataset.messageId) {
        //  for (const b of card.querySelectorAll('.card-buttons')) { b.remove() }
        //  await CoC7Chat.updateChatCard( card);
        // }
        break
      }
      case 'range-initiator-shoot': {
        const rangeInitiator = CoC7RangeInitiator.getFromCard(card)
        rangeInitiator.addShotAtCurrentTarget()
        await rangeInitiator.updateChatCard()
        break
      }
      case 'range-initiator-roll': {
        const rangeInitiator = CoC7RangeInitiator.getFromCard(card)
        await rangeInitiator.resolveCard()
        break
      }
      case 'roll-range-damage': {
        const rangeInitiator = CoC7RangeInitiator.getFromCard(card)
        await rangeInitiator.rollDamage()
        break
      }
      case 'deal-melee-damage': {
        const targetKey = card.dataset.targetKey
        const amount = card.dataset.result
        const targetActor = chatHelper.getActorFromKey(targetKey) // REFACTORING (2)
        await targetActor.dealDamage(amount)
        const buttons = card.querySelector('.card-buttons')
        const diceTotal = card.querySelector('.dice-total')
        $(diceTotal).append('<i class="fas fa-check"></i>')
        if (buttons) buttons.remove()
        await CoC7Chat.updateChatCard(card)

        break
      }

      case 'deal-range-damage': {
        const rangeInitiator = CoC7RangeInitiator.getFromCard(card)
        await rangeInitiator.dealDamage()
        break
      }

      case 'testcheck': {
        const check = await CoC7Check.getFromCard(card)
        check.forcePass()
        break
      }

      case 'force-pass': {
        const check = await CoC7Check.getFromCard(card)
        check.forcePass()
        break
      }

      case 'force-fail': {
        const check = await CoC7Check.getFromCard(card)
        check.forceFail()
        break
      }

      case 'increase-success-level': {
        const check = await CoC7Check.getFromCard(card)
        check.increaseSuccessLevel()
        break
      }

      case 'decrease-success-level': {
        const check = await CoC7Check.getFromCard(card)
        check.decreaseSuccessLevel()
        break
      }

      case 'reveal-check': {
        const check = await CoC7Check.getFromCard(card)
        check.isBlind = false
        check.computeCheck()
        if (
          isCtrlKey(event)
        ) {
          check.updateChatCard({ makePublic: true })
        } else {
          check.updateChatCard({ makePublic: true })
        }
        break
      }

      case 'roll-check-card': {
        const check = await CoC7Check.getFromCard(card)
        check.standby = false
        await check._perform()
        check.updateChatCard({ forceRoll: true })
        break
      }

      case 'flag-for-development': {
        const check = await CoC7Check.getFromCard(card)
        await check.flagForDevelopement()
        check.computeCheck()
        check.updateChatCard()
        break
      }

      case 'reset-creature-san-data': {
        const sanCheck = SanCheckCard.getFromCard(card)
        await sanCheck.clearSanLossReason()
        await sanCheck.updateChatCard()
        break
      }

      case 'roll-san-check': {
        const sanCheck = SanCheckCard.getFromCard(card)
        await sanCheck.rollSan()
        await sanCheck.updateChatCard()
        break
      }

      case 'advance-state': {
        const sanCheck = SanCheckCard.getFromCard(card)
        await sanCheck.advanceState(
          button.dataset.state /*, button.dataset.param */
        )
        await sanCheck.updateChatCard()
        break
      }

      case 'roll-san-loss': {
        const sanCheck = SanCheckCard.getFromCard(card)
        await sanCheck.rollSanLoss()
        sanCheck.updateChatCard()
        break
      }

      case 'roll-int-check': {
        const sanCheck = SanCheckCard.getFromCard(card)
        await sanCheck.rollInt()
        sanCheck.updateChatCard()
        break
      }

      // case 'apply-san-loss':{
      //  const sanCheck = CoC7SanCheck.getFromCard( card);
      //  await sanCheck.applySanLoss();
      //  sanCheck.updateChatCard();
      //  break;
      // }

      // case 'reveal-san-check':{
      //  const sanCheck = CoC7SanCheck.getFromCard( card);
      //  sanCheck.isBlind = false;
      //  sanCheck.updateChatCard();
      //  break;
      // }

      case 'roll-con-check': {
        const conCheck = CoC7ConCheck.getFromCard(card)
        await conCheck.rollCon()
        conCheck.updateChatCard()
        break
      }

      case 'reveal-con-check': {
        const conCheck = CoC7ConCheck.getFromCard(card)
        conCheck.isBlind = false
        conCheck.updateChatCard()
        break
      }

      default:
        break
    }
  }

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent (event) {
    event.preventDefault()
    const header = event.currentTarget
    const card = header.closest('.chat-card')
    const content = card.querySelector('.card-content')
    if (content) {
      if (!content.style.display) {
        content.style.display = 'block'
      } else {
        content.style.display =
          content.style.display === 'none' ? 'block' : 'none'
      }
    }
  }
}
