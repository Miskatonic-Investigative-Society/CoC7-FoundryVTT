/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Update Item
 * @param {Document} document
 * @param {object} changed
 * @param {object} options
 * @param {userId} userId
 */
export default function (document, changed, options, userId) {
  if (typeof changed.flags?.[FOLDER_ID]?.cocidFlag?.id === 'string') {
    game.CoC7.skillNames.addItem(changed.flags[FOLDER_ID].cocidFlag.id)
  }
}
