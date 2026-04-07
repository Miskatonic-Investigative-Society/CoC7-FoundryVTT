import { FOLDER_ID } from '../constants.js'

/**
 * Close Hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {jQuery} html
 */
export default async function (application, html) {
  const cssAdventureEntry = html.find('#coc7-journal-css-adventure-entry').prop('checked')
  const fixedAdventureHeading = html.find('#coc7-journal-fixed-adventure-heading').prop('checked')
  const update = {}
  if (cssAdventureEntry) {
    update['flags.' + FOLDER_ID + '.css-adventure-entry'] = cssAdventureEntry
    application.object.sheet.element.addClass('coc7-adventure-entry')
  } else {
    /* // FoundryVTT V13 */
    update['flags.' + FOLDER_ID + '.-=css-adventure-entry'] = null
    application.object.sheet.element.removeClass('coc7-adventure-entry')
  }
  if (fixedAdventureHeading) {
    update['flags.' + FOLDER_ID + '.fixed-adventure-heading'] = fixedAdventureHeading
    application.object.sheet.element.addClass('fixed-adventure-heading')
  } else {
    /* // FoundryVTT V13 */
    update['flags.' + FOLDER_ID + '.-=fixed-adventure-heading'] = null
    application.object.sheet.element.removeClass('fixed-adventure-heading')
  }
  const fixedAdventureSubheading = html.find('#coc7-journal-fixed-adventure-subheading').val() ?? ''
  if (fixedAdventureSubheading.length) {
    if ((application.object.getFlag(FOLDER_ID, 'fixed-adventure-subheading') ?? '') !== fixedAdventureSubheading) {
      await application.object.setFlag(FOLDER_ID, 'fixed-adventure-subheading', fixedAdventureSubheading)
    }
  } else if ((application.object.getFlag(FOLDER_ID, 'fixed-adventure-subheading') ?? '') !== '') {
    await application.object.unsetFlag(FOLDER_ID, 'fixed-adventure-subheading')
  }
  await application.object.update(update)
}
