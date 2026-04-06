/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @param {documents.ChatMessage} message
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 * @returns {boolean}
 */
export default function (message, data, options, userId) {
  // Prevent accidentally revealing fake rolls
  if (userId === game.user.id && message.flags?.[FOLDER_ID]?.load?.as === 'CoC7ChatMessage' && message.content === '' && data.blind === false) {
    return false
  }
  return true
}
