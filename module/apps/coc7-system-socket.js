/* global fromUuid, game, ui */
import { CoC7GroupMessage } from './coc7-group-message.js'
import { CoC7InvestigatorWizard } from './investigator-wizard.js'
import { CoC7Utilities } from '../utilities.js'
import { CombinedCheckCard } from '../chat/cards/combined-roll.js'
import { OpposedCheckCard } from '../chat/cards/opposed-roll.js'

export class CoC7SystemSocket {
  /**
   * @param {object} data                       Data to send to socket.
   * @param {string} [data.type]                Action to run
   * @param {string|undefined} [data.listener]  only this specfic user should run the action
   * @return {void}
   */
  static async callSocket (data) {
    if (typeof data.listener !== 'undefined') {
      if (game.user.id === data.listener) {
        switch (data.type) {
          case 'character-wizard':
            CoC7InvestigatorWizard.createCharacterFromData(data.payload)
            break
          case 'open-character':
            game.actors.get(data.payload).sheet.render(true)
            break
          case 'group-message-new':
            CoC7GroupMessage.newGroupMessage(data)
            break
          case 'group-message-roll':
            CoC7GroupMessage.performMyRolls(data)
            break
          case 'group-message-update':
            CoC7GroupMessage.updateTheMessage(data)
            break
        }
      }
    } else {
      if (game.user.isGM) {
        switch (data.type) {
          case OpposedCheckCard.defaultConfig.type:
            OpposedCheckCard.dispatch(data)
            break
          case CombinedCheckCard.defaultConfig.type:
            CombinedCheckCard.dispatch(data)
            break
          case 'invoke':
            {
              const item = await fromUuid(data.item)
              item[data.method](data.data)
            }
            break
        }
      }
      switch (data.type) {
        case 'updateChar':
          CoC7Utilities.updateCharSheets()
          break
      }
    }
  }

  /**
   * Request Keeper action, if you are a keeper run yourself, if there is no active GM show error
   * @param {object} data             Data to send to socket.
   */
  static requestKeeperAction (data) {
    if (game.user.isGM) {
      data.listener = game.user.id
      CoC7SystemSocket.callSocket(data)
    } else {
      const keepers = game.users.filter(u => u.active && u.isGM)
      if (keepers.length) {
        data.listener = keepers[0].id
        game.socket.emit('system.CoC7', data)
      } else {
        ui.notifications.error(
          game.i18n.localize('CoC7.ErrorMissingKeeperUser')
        )
      }
    }
  }

  /**
   * Request user action
   * @param {object} data             Data to send to socket.
   * @param {string|null} userId      Only this user id should run the action.
   * @param {boolean} errorIfMissing  If requesting a specific user should run the action error if user not found / logged in.
   * @param {boolean} includeSelf     If running as all users should the current user also run the action.
   * @return {void}
   */
  static requestUserAction (
    data,
    { userId = null, errorIfMissing = true, includeSelf = true } = {}
  ) {
    if (userId && typeof userId !== 'undefined') {
      if (userId === game.user.id) {
        data.listener = game.user.id
        CoC7SystemSocket.callSocket(data)
      } else {
        const user = game.users.get(userId)
        if (typeof user.id !== 'undefined' && user.active) {
          data.listener = user.id
          game.socket.emit('system.CoC7', data)
        } else if (errorIfMissing) {
          ui.notifications.error(game.i18n.localize('CoC7.ErrorMissingUser'))
        }
      }
    } else {
      if (includeSelf) {
        CoC7SystemSocket.callSocket(data)
      }
      game.socket.emit('system.CoC7', data)
    }
  }
}
