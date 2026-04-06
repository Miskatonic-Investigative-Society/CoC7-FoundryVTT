/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Active Effect was deleted
 * @param {Document} document
 * @param {object} options
 * @param {string} userId
 */
export default function (document, options, userId) {
  if (document.flags?.[FOLDER_ID]?.cocidFlag?.id?.length) {
    const cocid = document.flags[FOLDER_ID].cocidFlag.id
    game.CoC7.skillNames.removeItem(cocid)
    game.CoC7.skillNames.addItem(cocid)
  }
}
