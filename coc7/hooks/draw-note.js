/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Draw Note Icon
 * @param {ApplicationV2} application
 */
export default function (application) {
  if (application.document.getFlag(FOLDER_ID, 'hide-background') ?? false) {
    if (game.release.generation < 14) {
      application.controlIcon.bg.clear()
    } else {
      application.controlIcon.children.splice(0, 1)
      application.controlIcon.children.splice(1, 1)
    }
  }
}
