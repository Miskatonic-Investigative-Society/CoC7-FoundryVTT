/* global CONFIG */
import { FOLDER_ID } from '../constants.js'
import CoC7ModelsActorCharacterSheetSummarizedV2 from '../models/actor/character-sheet-summarized-v2.js'
import CoC7ModelsActorCharacterSheetSummarizedV3 from '../models/actor/character-sheet-summarized-v3.js'
import CoC7ModelsActorCharacterSheetV3 from '../models/actor/character-sheet-v3.js'

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  /* // FoundryV12 polyfill */
  if (!context) {
    context = {}
    if (!context.document) {
      context.document = application.document
    }
  }

  if (!context.document.isLimitedView) {
    if (!(application instanceof CoC7ModelsActorCharacterSheetSummarizedV2) && !element.querySelector('button.header-control.fa-solid.fa-window-minimize')) {
      application.options.actions.minimizeSheet = {
        handler: async (event, element) => {
          event.preventDefault()
          event.stopPropagation()
          if (event.detail > 1) return // Ignore repeated clicks
          const defaultSheet = Object.values(CONFIG.Actor.sheetClasses.character).find(o => o.default).id
          let sheetClass = ''
          const otherSheetClass = (application instanceof CoC7ModelsActorCharacterSheetV3 ? 'CoC7ModelsActorCharacterSheetSummarizedV3' : 'CoC7ModelsActorCharacterSheetSummarizedV2')
          if (defaultSheet !== FOLDER_ID + '.' + otherSheetClass) {
            sheetClass = FOLDER_ID + '.' + otherSheetClass
          }
          application.document.setFlag('core', 'sheetClass', sheetClass)
        },
        buttons: [0]
      }
      const toggleControlsButton = element.querySelector('button.header-control.fa-solid.fa-ellipsis-vertical')
      if (toggleControlsButton) {
        const button = document.createElement('button')
        button.type = 'button'
        button.classList = 'header-control fa-solid fa-window-minimize icon'
        button.dataset.action = 'minimizeSheet'
        button.dataset.tooltip = 'CoC7.Summarize'
        toggleControlsButton.after(button)
      }
    }
    if (application instanceof CoC7ModelsActorCharacterSheetSummarizedV2 && !element.querySelector('button.header-control.fa-solid.fa-window-maximize')) {
      application.options.actions.maximizeSheet = {
        handler: async (event, element) => {
          event.preventDefault()
          event.stopPropagation()
          if (event.detail > 1) return // Ignore repeated clicks
          const defaultSheet = Object.values(CONFIG.Actor.sheetClasses.character).find(o => o.default).id
          let sheetClass = ''
          const otherSheetClass = (application instanceof CoC7ModelsActorCharacterSheetSummarizedV3 ? 'CoC7ModelsActorCharacterSheetV3' : 'CoC7ModelsActorCharacterSheetV2')
          if (defaultSheet !== FOLDER_ID + '.' + otherSheetClass) {
            sheetClass = FOLDER_ID + '.' + otherSheetClass
          }
          application.document.setFlag('core', 'sheetClass', sheetClass)
        },
        buttons: [0]
      }
      const toggleControlsButton = element.querySelector('button.header-control.fa-solid.fa-ellipsis-vertical')
      if (toggleControlsButton) {
        const button = document.createElement('button')
        button.type = 'button'
        button.classList = 'header-control fa-solid fa-window-maximize icon'
        button.dataset.action = 'maximizeSheet'
        button.dataset.tooltip = 'CoC7.Maximize'
        toggleControlsButton.after(button)
      }
    }
  }
}
