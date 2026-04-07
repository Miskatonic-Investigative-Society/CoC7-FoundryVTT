import { FOLDER_ID } from '../constants.js'

/**
 * Draw Note Icon
 * @param {ApplicationV2} application
 */
export default function (application) {
  if (application.document.getFlag(FOLDER_ID, 'hide-background') ?? false) {
    application.controlIcon.bg.clear()
  }
}
