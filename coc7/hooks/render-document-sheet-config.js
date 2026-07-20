import { FOLDER_ID, JOURNAL_STYLES } from '../constants.js'

/**
 * Create HTML element
 * @param {string} rootId
 * @param {string} type
 * @param {string} key
 * @param {string} title
 * @param {string|boolean} value
 * @param {object} options
 * @returns {HTMLElement}
 */
function createFormGroup (rootId, type, key, title, value, options) {
  const formGroup = document.createElement('div')
  formGroup.classList.add('form-group')
  const label = document.createElement('label')
  label.setAttribute('for', rootId + key)
  label.innerText = game.i18n.localize(title)
  const formFields = document.createElement('div')
  formFields.classList.add('form-fields')
  switch (type) {
    case 'checkbox':
      formFields.style.flex = '0 0 5rem'
      break
  }
  switch (type) {
    case 'checkbox':
    case 'text':
      {
        const input = document.createElement('input')
        input.type = type
        input.id = rootId + key
        input.name = 'flags.' + FOLDER_ID + '.' + key
        switch (type) {
          case 'checkbox':
            input.checked = value
            break
          case 'text':
            input.value = value
            break
        }
        formFields.append(input)
      }
      break
    case 'select':
      {
        const select = document.createElement('select')
        select.id = rootId + key
        select.name = 'flags.' + FOLDER_ID + '.' + key
        {
          const option = document.createElement('option')
          option.value = ''
          option.text = ''
          select.append(option)
        }
        for (const key in options) {
          const option = document.createElement('option')
          option.value = key
          option.text = options[key]
          if (key === value) {
            option.selected = true
          }
          select.append(option)
        }
        formFields.append(select)
      }
      break
  }
  const p = document.createElement('p')
  p.classList.add('hint')
  p.innerText = game.i18n.localize('CoC7.Config.AdventureChangeHint')
  formGroup.append(label)
  formGroup.append(formFields)
  formGroup.append(p)
  return formGroup
}

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  /* // FoundryVTT V12 */
  if (game.release.generation === 12) {
    if (application.object instanceof CONFIG.JournalEntry.documentClass) {
      const cssAdventureEntry = (application.object.getFlag(FOLDER_ID, 'css-adventure-entry') ?? false)
      const fixedAdventureHeading = (application.object.getFlag(FOLDER_ID, 'fixed-adventure-heading') ?? false)
      const lastGroup = element.find('button')
      lastGroup.before(
        '<div class="form-group"><label for="coc7-journal-css-adventure-entry">' + game.i18n.localize('CoC7.Config.AdventureCSS') + '</label><input type="checkbox" id="coc7-journal-css-adventure-entry" ' + (cssAdventureEntry ? ' checked="checked"' : '') + '><p class="notes">' + game.i18n.localize('CoC7.Config.AdventureChangeHint') + '</p></div>' +
        '<div class="form-group"><label for="coc7-journal-fixed-adventure-heading">' + game.i18n.localize('CoC7.Config.FixedHeadingCSS') + '</label><input type="checkbox" id="coc7-journal-fixed-adventure-heading" ' + (fixedAdventureHeading ? ' checked="checked"' : '') + '><p class="notes">' + game.i18n.localize('CoC7.Config.AdventureChangeHint') + '</p></div>'
      )
      application.setPosition({ height: 'auto' })
    } else if (application.object instanceof CONFIG.JournalEntryPage.documentClass && application.object.type === 'text') {
      const fixedAdventureSubheading = (application.object.getFlag(FOLDER_ID, 'fixed-adventure-subheading') ?? '').toString()
      const lastGroup = element.find('button')
      lastGroup.before('<div class="form-group"><label for="coc7-journal-fixed-adventure-subheading">' + game.i18n.localize('CoC7.Config.AdventureSubheading') + '</label><input type="text" id="coc7-journal-fixed-adventure-subheading" value="' + fixedAdventureSubheading.replace(/"/g, '&quot;') + '"><p class="notes">' + game.i18n.localize('CoC7.Config.AdventureChangeHint') + '</p></div>')
      application.setPosition({ height: 'auto' })
    }
  } else {
    if (application.document instanceof CONFIG.JournalEntry.documentClass) {
      const cssAdventureEntry = (application.document.getFlag(FOLDER_ID, 'css-adventure-entry') ?? false)
      const fixedAdventureHeading = (application.document.getFlag(FOLDER_ID, 'fixed-adventure-heading') ?? false)
      const journalCss = (application.document.getFlag(FOLDER_ID, 'journal-css') ?? '')
      const destination = element.querySelector('section[data-application-part="form"].standard-form')
      if (destination) {
        const fieldset = document.createElement('fieldset')
        const legend = document.createElement('legend')
        legend.innerText = game.i18n.localize('CoC7.title')
        fieldset.append(legend)
        {
          const formGroup = createFormGroup(application.id, 'checkbox', 'css-adventure-entry', 'CoC7.Config.AdventureCSS', cssAdventureEntry)
          fieldset.append(formGroup)
        }
        {
          const formGroup = createFormGroup(application.id, 'checkbox', 'fixed-adventure-heading', 'CoC7.Config.FixedHeadingCSS', fixedAdventureHeading)
          fieldset.append(formGroup)
        }
        {
          const formGroup = createFormGroup(application.id, 'select', 'journal-css', 'CoC7.Config.JournalCSS', journalCss, JOURNAL_STYLES)
          fieldset.append(formGroup)
        }
        destination.append(fieldset)
        const oldHandler = application.options.form.handler
        application.options.form.handler = async (event, form, formData) => {
          await oldHandler.call(application, event, form, formData)
          const update = {}
          if (formData.object['flags.' + FOLDER_ID + '.css-adventure-entry']) {
            update['flags.' + FOLDER_ID + '.css-adventure-entry'] = formData.object['flags.' + FOLDER_ID + '.css-adventure-entry']
          } else {
            /* // FoundryVTT V13 */
            update['flags.' + FOLDER_ID + '.-=css-adventure-entry'] = null
          }
          if (formData.object['flags.' + FOLDER_ID + '.fixed-adventure-heading']) {
            update['flags.' + FOLDER_ID + '.fixed-adventure-heading'] = formData.object['flags.' + FOLDER_ID + '.fixed-adventure-heading']
          } else {
            /* // FoundryVTT V13 */
            update['flags.' + FOLDER_ID + '.-=fixed-adventure-heading'] = null
          }
          if (formData.object['flags.' + FOLDER_ID + '.journal-css']) {
            update['flags.' + FOLDER_ID + '.journal-css'] = formData.object['flags.' + FOLDER_ID + '.journal-css']
          } else {
            /* // FoundryVTT V13 */
            update['flags.' + FOLDER_ID + '.-=journal-css'] = null
          }
          await application.document.update(update)
        }
      }
    } else if (application.document instanceof CONFIG.JournalEntryPage.documentClass && application.document.type === 'text') {
      const fixedAdventureSubheading = (application.document.getFlag(FOLDER_ID, 'fixed-adventure-subheading') ?? '').toString()
      const destination = element.querySelector('section[data-application-part="form"].standard-form')
      if (destination) {
        const fieldset = document.createElement('fieldset')
        const legend = document.createElement('legend')
        legend.innerText = game.i18n.localize('CoC7.title')
        fieldset.append(legend)
        {
          const formGroup = createFormGroup(application.id, 'text', 'fixed-adventure-subheading', 'CoC7.Config.AdventureSubheading', fixedAdventureSubheading)
          fieldset.append(formGroup)
        }
        destination.append(fieldset)
        const oldHandler = application.options.form.handler
        application.options.form.handler = async (event, form, formData) => {
          await oldHandler.call(application, event, form, formData)
          const update = {}
          if (formData.object['flags.' + FOLDER_ID + '.fixed-adventure-subheading'].length) {
            update['flags.' + FOLDER_ID + '.fixed-adventure-subheading'] = formData.object['flags.' + FOLDER_ID + '.fixed-adventure-subheading']
          } else {
            /* // FoundryVTT V13 */
            update['flags.' + FOLDER_ID + '.-=fixed-adventure-subheading'] = null
          }
          await application.document.update(update)
        }
      }
    }
  }
}
