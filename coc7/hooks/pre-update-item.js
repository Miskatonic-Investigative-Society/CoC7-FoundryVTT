/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Pre Update Document
 * @param {Document} document
 * @param {object} changed
 * @param {object} options
 * @param {userId} userId
 */
export default function (document, changed, options, userId) {
  if (typeof changed.flags?.[FOLDER_ID]?.cocidFlag?.id === 'string' && document.flags?.[FOLDER_ID]?.cocidFlag?.id?.length) {
    game.CoC7.skillNames.removeItem(document.flags[FOLDER_ID].cocidFlag.id)
  }
}
