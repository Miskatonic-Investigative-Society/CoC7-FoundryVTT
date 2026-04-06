/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @param {documents.ChatMessage} message
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
export default async function (message, data, options, userId) {
  if (userId === game.user.id && message.rolls.length && typeof message.flags[FOLDER_ID]?.load?.as === 'undefined' && message.content !== '') {
    const el = document.createElement('div')
    el.innerHTML = message.content
    if (!el.childElementCount) {
      message.updateSource({
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatMessage'
      })
    }
  }
}
