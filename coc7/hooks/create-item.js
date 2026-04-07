/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Active Effect was added
 * @param {Document} document
 * @param {object} options
 * @param {string} userId
 */
export default function (document, options, userId) {
  if (document.flags?.[FOLDER_ID]?.cocidFlag?.id?.length) {
    game.CoC7.skillNames.addItem(document.flags[FOLDER_ID].cocidFlag.id)
  }
}
