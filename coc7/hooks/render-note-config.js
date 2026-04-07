/* global game */
import { FOLDER_ID } from '../constants.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  const hideBackground = application.document.getFlag(FOLDER_ID, 'hide-background') ?? false
  /* // FoundryVTT V12 */
  if (game.release.generation === 12) {
    const lastGroup = element.find('[name=texture\\.tint]').closest('div.form-group')
    lastGroup.after('<div class="form-group"><label for="' + application.id + '-hide-background">' + game.i18n.localize('CoC7.MapNoteNoBackground') + '</label><input type="checkbox" name="flags.' + FOLDER_ID + '.hide-background" id="' + application.id + '-hide-background"' + (hideBackground ? ' checked="checked"' : '') + '></div>')
    application.setPosition({ height: 'auto' })
  } else {
    const formGroup = element.querySelector('[name=texture\\.tint]').closest('div.form-group')
    const newGroup = document.createElement('div')
    newGroup.classList.add('form-group')
    formGroup.after(newGroup)
    const label = document.createElement('label')
    label.setAttribute('for', application.id + '-hide-background')
    label.innerText = game.i18n.localize('CoC7.MapNoteNoBackground')
    const div = document.createElement('div')
    div.classList.add('form-fields')
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.name = 'flags.' + FOLDER_ID + '.hide-background'
    input.checked = hideBackground
    input.id = application.id + '-hide-background'
    div.append(input)
    newGroup.append(label)
    newGroup.append(div)
    formGroup.after(newGroup)
    application.document?.object?.draw()
  }
}
