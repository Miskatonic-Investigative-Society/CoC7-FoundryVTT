/* global ActiveEffect CONFIG DragDrop FilePicker foundry fromUuid game Hooks SceneNavigation */
import { FOLDER_ID } from './constants.js'
import CoC7CloseDocumentSheetConfig from './hooks/close-document-sheet-config.js'
import CoC7CloseSettingsConfig from './hooks/close-settings-config.js'
import CoC7GetChatLogEntryContext from './hooks/get-chat-log-entry-context.js'
import CoC7GetJournalSheetHeaderButtons from './hooks/get-journal-sheet-header-buttons.js'
import CoC7GetMacroConfigHeaderButtons from './hooks/get-macro-config-header-buttons.js'
import CoC7GetPlaylistConfigHeaderButtons from './hooks/get-playlist-config-header-buttons.js'
import CoC7GetRollTableConfigHeaderButtons from './hooks/get-roll-table-config-header-buttons.js'
import CoC7GetSceneConfigHeaderButtons from './hooks/get-scene-config-header-buttons.js'
import CoC7RenderChatMessage from './hooks/render-chat-message.js'
import CoC7RenderCoC7DirectoryPicker from './hooks/render-coc7-directory-picker.js'
import CoC7RenderDialog from './hooks/render-dialog.js'
import CoC7RenderJournalSheet from './hooks/render-journal-sheet.js'
import CoC7RenderJournalTextPageSheet from './hooks/render-journal-text-page-sheet.js'
import CoC7RenderPause from './hooks/render-pause.js'
import CoC7RenderPlayerList from './hooks/render-player-list.js'
import CoC7RenderRegionBehaviorConfig from './hooks/render-region-behavior-config.js'

class ActorAppV2DragDrop {
  #sheet

  /**
   * @inheritdoc
   */
  constructor (sheet) {
    this.#sheet = sheet
  }

  /**
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   */
  async _onDrop (event) {
    let data = {}
    if (('dataTransfer' in event)) {
      try {
        data = JSON.parse(event.dataTransfer.getData('text/plain'))
      } catch (err) {
      }
    }
    const actor = this.#sheet.document
    const allowed = Hooks.call('dropActorSheetData', actor, this.#sheet, data)
    if (allowed === false) return
    // Dropped Documents
    const documentClass = CONFIG[data.type]?.documentClass
    if (documentClass) {
      const document = await documentClass.fromDropData(data)
      await this._onDropDocument(event, document)
    }
  }

  /**
   * Handle a dropped Active Effect on the Actor Sheet.
   * The default implementation creates an Active Effect embedded document on the Actor.
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   * @returns {Promise<ActiveEffect|null|undefined>} A Promise resolving to a newly created ActiveEffect, if one was created, or otherwise a nullish value
   */
  async _onDropActiveEffect (event, effect) {
    if (!this.#sheet.document.isOwner) return null
    if (!effect || (effect.target === this.#sheet.document)) return null
    const keepId = !this.#sheet.document.effects.has(effect.id)
    const result = await ActiveEffect.implementation.create(effect.toObject(), { parent: this.#sheet.document, keepId })
    return result ?? null
  }

  /**
   * Handle a dropped document on the ActorSheet
   * @param {DragEvent} event
   * @param {Document} document
   * @returns {Promise<Document|null>}
   */
  async _onDropDocument (event, document) {
    if (typeof this.#sheet._onDropDocument === 'function') {
      try {
        return await this.#sheet._onDropDocument(event, document)
      } catch (e) {
        // Catch No _onDropDocument on FoundryVTT v12
      }
    }
    switch (document.documentName) {
      case 'ActiveEffect':
        return (await this._onDropActiveEffect(event, document)) ?? null
      case 'Actor':
        return null
      case 'Item':
        return (await this.#sheet._onDropItem(event, document)) ?? null
      case 'Folder':
        return null
      default:
        return null
    }
  }

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   */
  async _onDragStart (event) {
    const target = event.currentTarget
    if ('link' in event.target.dataset) return
    let dragData
    // Owned Items
    if (target.dataset.itemId) {
      const item = this.#sheet.document.items.get(target.dataset.itemId)
      dragData = item.toDragData()
    }
    if (target.dataset.itemUuid) {
      const item = await fromUuid(target.dataset.itemUuid)
      dragData = item.toDragData()
    }
    // Active Effect
    if (target.dataset.effectId) {
      const effect = this.#sheet.document.effects.get(target.dataset.effectId)
      dragData = effect.toDragData()
    }
    // Set data transfer
    if (!dragData) return
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
  }

  /**
   * An event that occurs when a drag workflow moves over a drop target.
   * @param {DragEvent} event
   */
  _onDragOver (event) {
  }
}

class DeprecatedWarningCoCID {
  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static async documentsFromWorld ({ cocidRegExp, type, lang = game.i18n.lang, era = false, langFallback = true, progressBar = 0 } = {}) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.documentsFromWorld',
      now: 'game.CoC7.cocid.fromCoCIDRegexAllMixed',
      until: 15
    })
    return game.CoC7.cocid.fromCoCIDRegexAllMixed({ cocidRegExp, type, lang, era, scope: 'world', langFallback })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static async documentsFromCompendia ({ cocidRegExp, type, lang = game.i18n.lang, era = false, langFallback = true, progressBar = 0 } = {}) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.documentsFromCompendia',
      now: 'game.CoC7.cocid.fromCoCIDRegexAllMixed',
      until: 15
    })
    return game.CoC7.cocid.fromCoCIDRegexAllMixed({ cocidRegExp, type, lang, era, scope: 'compendiums', langFallback })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static async eraToggle (document, era) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.eraToggle',
      now: 'game.CoC7.cocid.eraToggle',
      until: 15
    })
    return game.CoC7.cocid.eraToggle(document, era)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static async expandItemArray ({ itemList, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.expandItemArray',
      now: 'game.CoC7.cocid.expandItemArray',
      until: 15
    })
    return game.CoC7.cocid.expandItemArray({ itemList, lang, era, langFallback, showLoading })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static fromCoCID (cocid, lang = game.i18n.lang, era = true, langFallback = true) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.fromCoCID',
      now: 'game.CoC7.cocid.fromCoCID',
      until: 15
    })
    return game.CoC7.cocid.fromCoCID(cocid, lang, era, langFallback)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static async fromCoCIDAll ({ cocid, lang = game.i18n.lang, era = false, scope = 'all', langFallback = true, showLoading = false } = {}) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.fromCoCIDAll',
      now: 'game.CoC7.cocid.fromCoCIDAll',
      until: 15
    })
    return game.CoC7.cocid.fromCoCIDAll({ cocid, lang, era, scope, langFallback, showLoading })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static fromCoCIDBest ({ cocid, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.fromCoCIDBest',
      now: 'game.CoC7.cocid.fromCoCIDBest',
      until: 15
    })
    return game.CoC7.cocid.fromCoCIDBest({ cocid, lang, era, langFallback, showLoading })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static findCocIdInList (cocid, list) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.findCocIdInList',
      now: 'game.CoC7.cocid.findCocIdInList',
      until: 15
    })
    return game.CoC7.cocid.findCocIdInList(cocid, list)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static async fromCoCIDRegexBest ({ cocidRegExp, type, lang = game.i18n.lang, era = true, langFallback = true, showLoading = false } = {}) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.fromCoCIDRegexBest',
      now: 'game.CoC7.cocid.fromCoCIDRegexBest',
      until: 15
    })
    return game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp, type, lang, era, langFallback, showLoading })
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static getPrefix (document) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.getPrefix',
      now: 'game.CoC7.cocid.getPrefix',
      until: 15
    })
    return game.CoC7.cocid.getPrefix(document)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static guessGroupFromDocument (document) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.guessGroupFromDocument',
      now: 'game.CoC7.cocid.guessGroupFromDocument',
      until: 15
    })
    return game.CoC7.cocid.guessGroupFromDocument(document)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static guessGroupFromKey (document) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.guessGroupFromKey',
      now: 'game.CoC7.cocid.guessGroupFromKey',
      until: 15
    })
    return game.CoC7.cocid.guessGroupFromKey(document)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static guessId (document) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.guessId',
      now: 'game.CoC7.cocid.guessId',
      until: 15
    })
    return game.CoC7.cocid.guessId(document)
  }

  /**
   * @inheritdoc
   * @deprecated Temporary forward
   */
  static makeGroupRegEx (document) {
    deprecated.warningLogger({
      was: 'game.system.api.cocid.makeGroupRegEx',
      now: 'game.CoC7.cocid.makeGroupRegEx',
      until: 15
    })
    return game.CoC7.cocid.makeGroupRegEx(document)
  }
}

class DeprecatedWarningCoC7DamageCard {
  /**
   * @inheritdoc
   * @deprecated No replacement
   */
  static get defaultOptions () {
    deprecated.noLongerAvailable({ was: 'game.CoC7.cards.CoC7DamageCard.defaultOptions()' })
  }

  /**
   * @inheritdoc
   * @deprecated No replacement
   * @param {jQuery} html
   */
  static async bindListeners (html) {
    deprecated.noLongerAvailable({ was: 'game.CoC7.cards.CoC7DamageCard.bindListeners(?)' })
  }

  /**
   * @inheritdoc
   * @deprecated No replacement
   * @param {string} messageId
   */
  static async fromMessageId (messageId) {
    deprecated.noLongerAvailable({ was: 'game.CoC7.cards.CoC7DamageCard.fromMessageId(?)' })
  }

  /**
   * @inheritdoc
   * @deprecated No replacement
   * @param {object} message
   */
  static async fromMessage (message) {
    deprecated.noLongerAvailable({ was: 'game.CoC7.cards.CoC7DamageCard.fromMessage(?)' })
  }

  /**
   * @inheritdoc
   * @deprecated No replacement
   * @param {HtmlElement} card
   */
  static async fromHTMLCardElement (card) {
    deprecated.noLongerAvailable({ was: 'game.CoC7.cards.CoC7DamageCard.fromHTMLCardElement(?)' })
  }

  /**
   * @inheritdoc
   * @deprecated No replacement
   * @param {object} data
   */
  static async fromData (data) {
    deprecated.noLongerAvailable({ was: 'game.CoC7.cards.CoC7DamageCard.fromData(?)' })
  }
}

class DeprecatedWarningDisplayProgressBar {
  #label

  /**
   * Fake a v13 progress bar for v12
   * @param {string} label
   */
  constructor (label) {
    this.#label = label
    SceneNavigation.displayProgressBar({ label: this.#label, pct: 0 })
  }

  /**
   * Remove progress bar
   */
  remove () {
    SceneNavigation.displayProgressBar({ label: this.#label, pct: 100 })
  }

  /**
   * Update progress bar position
   * @param {object} options
   * @param {int} options.pct Value from 0 to 1
   */
  update ({ pct = 1 } = {}) {
    SceneNavigation.displayProgressBar({ label: this.#label, pct: Math.ceil(pct * 100) })
  }
}

export default class deprecated {
  static warningsDisplayed = []

  /**
   * Force render option for v12 compatibility
   * @returns {object|true}
   */
  static get renderForce () {
    if (foundry.utils.isNewerVersion(game.version, 13)) {
      return { force: true }
    }
    return true
  }

  /**
   * Drop on Actor Sheet
   * @param {DocumentSheet} sheet
   */
  static ActorAppV2DragDrop (sheet) {
    const actorAppV2DragDrop = new ActorAppV2DragDrop(sheet)
    new (foundry.applications.ux?.DragDrop ?? DragDrop)({
      dragSelector: '.draggable',
      permissions: {
        dragstart: true,
        drop: true
      },
      callbacks: {
        dragstart: (event) => { actorAppV2DragDrop._onDragStart(event) },
        dragover: (event) => { actorAppV2DragDrop._onDragOver(event) },
        drop: (event) => { actorAppV2DragDrop._onDrop(event) }
      }
    }).bind(sheet.element)
  }

  /**
   * Add Edit Image function to AppV2 sheets
   * @param {Event} event
   * @param {document} document
   * @param {HTMLElement} element
   * @param {object} options
   * @param {boolean} options.submitOnChange
   * @param {object} options.position
   */
  static async AppV2EditImage (event, document, element, { submitOnChange = false, position = { top: 0, left: 0 } } = {}) {
    const attr = event.target.dataset.edit
    const current = foundry.utils.getProperty(document._source, attr)
    const defaultArtwork = document.constructor.getDefaultArtwork?.(document._source) ?? {}
    const defaultImage = foundry.utils.getProperty(defaultArtwork, attr)
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: defaultImage ? [defaultImage] : [],
      callback: path => {
        event.target.src = path
        if (submitOnChange) {
          const submit = new Event('submit', { cancelable: true })
          element.dispatchEvent(submit)
        }
      },
      position: {
        top: position.top + 40,
        left: position.left + 10
      }
    })
    await fp.browse()
  }

  /**
   * Create a map to new global name
   */
  static CoCID () {
    if (typeof game.system.api === 'undefined') {
      game.system.api = {}
    }
    game.system.api.cocid = DeprecatedWarningCoCID
  }

  /**
   * Disable form elements
   * @param {boolean} framed
   * @param {HTMLFormElement} form
   */
  static disableForm (framed, form) {
    for (const element of form.elements) {
      if (!framed || element.closest('.window-content')) {
        element.disabled = true
      }
    }
    const contentEl = framed ? form.querySelector('.window-content') : form
    for (const input of contentEl.querySelectorAll('input[type=image]')) {
      input.disabled = true
    }
    for (const img of contentEl.querySelectorAll('img[data-edit]')) {
      img.classList.toggle('disabled', true)
    }
  }

  /**
   * Fake a v13 progress bar for v12
   * @param {string} message
   * @returns {object}
   */
  static displayProgressBar (message) {
    return new DeprecatedWarningDisplayProgressBar(message)
  }

  /**
   * Trigger v12 init
   */
  static init () {
    if (game.release.generation === 12) {
      Hooks.on('closeDocumentSheetConfig', CoC7CloseDocumentSheetConfig)
      Hooks.on('closeSettingsConfig', CoC7CloseSettingsConfig)
      Hooks.on('getChatLogEntryContext', CoC7GetChatLogEntryContext)
      Hooks.on('getJournalSheetHeaderButtons', CoC7GetJournalSheetHeaderButtons)
      Hooks.on('getMacroConfigHeaderButtons', CoC7GetMacroConfigHeaderButtons)
      Hooks.on('getPlaylistConfigHeaderButtons', CoC7GetPlaylistConfigHeaderButtons)
      Hooks.on('getRollTableConfigHeaderButtons', CoC7GetRollTableConfigHeaderButtons)
      Hooks.on('getSceneConfigHeaderButtons', CoC7GetSceneConfigHeaderButtons)
      Hooks.on('renderChatMessage', CoC7RenderChatMessage)
      Hooks.on('renderCoC7DirectoryPicker', CoC7RenderCoC7DirectoryPicker)
      Hooks.on('renderDialog', CoC7RenderDialog)
      Hooks.on('renderJournalSheet', CoC7RenderJournalSheet)
      Hooks.on('renderJournalTextPageSheet', CoC7RenderJournalTextPageSheet)
      Hooks.on('renderPause', CoC7RenderPause)
      Hooks.on('renderPlayerList', CoC7RenderPlayerList)
      Hooks.on('renderRegionBehaviorConfig', CoC7RenderRegionBehaviorConfig)
    }
  }

  /**
   * Show removed error
   * @param {object} options
   * @param {string} options.was Old name
   */
  static noLongerAvailable ({ was } = {}) {
    if (this.warningsDisplayed.includes(was)) {
      return
    }
    this.warningsDisplayed.push(was)
    throw new Error(was + ' has been removed. If you require this please raise a ticket on GitHub with the use case.')
  }

  /**
   * Show deprecated error
   * @param {object} options
   * @param {string} options.was Old name
   * @param {string} options.until When will forward be removed
   */
  static noReplacement ({ was, until } = {}) {
    if (this.warningsDisplayed.includes(was)) {
      return
    }
    this.warningsDisplayed.push(was)
    const errors = (new Error(was + ' has been deprecated, support will be dropped with the FoundryVTT v' + until + ' release. If you require this please raise a ticket on GitHub with the use case.')).stack.split(/\n/).filter(t => t.indexOf('at deprecated.warningLogger') === -1 && t.indexOf('at deprecatedWarning') === -1)
    console.error(errors.join('\n'))
  }

  /**
   * Trigger v12 ready
   */
  static ready () {
    if (game.release.generation === 12) {
      foundry.utils.setProperty(game.i18n.translations, 'TABLE.ACTIONS.DrawResult', game.i18n.localize('TABLE.Roll'))
      foundry.utils.setProperty(game.i18n.translations, 'TABLE.ACTIONS.ResetResults', game.i18n.localize('TABLE.Reset'))
    }
    foundry.utils.setProperty(game.CoC7, 'cards.CoC7DamageCard', DeprecatedWarningCoC7DamageCard)
  }

  /**
   * Show deprecated warning
   * @param {object} options
   * @param {string} options.was Old name
   * @param {string} options.now New name
   * @param {string} options.until When will forward be removed
   */
  static warningLogger ({ was, now, until } = {}) {
    if (this.warningsDisplayed.includes(was)) {
      return
    }
    this.warningsDisplayed.push(was)
    const errors = (new Error(was + ' has been deprecated in favor of ' + now + ', support will be dropped with the FoundryVTT v' + until + ' release')).stack.split(/\n/).filter(t => t.indexOf('at deprecated.warningLogger') === -1 && t.indexOf('at deprecatedWarning') === -1)
    console.warn(errors.join('\n'))
  }

  /**
   * Show old CSS override
   * @param {HTMLElement} element
   */
  static customCss (element) {
    if (game.user.isGM) {
      const buttonIcon = document.createElement('i')
      buttonIcon.classList.add('fa-solid', 'fa-palette')
      const buttonText = document.createTextNode(game.i18n.localize('SETTINGS.OverrideSheetArtwork'))
      const button = document.createElement('button')
      button.append(buttonIcon)
      button.append(buttonText)
      button.addEventListener('click', async () => {
        const css = []
        if (game.settings.get(FOLDER_ID, 'overrideSheetArtwork')) {
          if (game.settings.get(FOLDER_ID, 'artWorkSheetBackground')) {
            if (game.settings.get(FOLDER_ID, 'artWorkSheetBackground').toLowerCase() === 'null') {
              css.push('--main-sheet-bg: url(\'./assets/images/void.webp\');')
            } else {
              css.push('--main-sheet-bg: ' + game.settings.get(FOLDER_ID, 'artWorkSheetBackground') + ';')
              if (game.settings.get(FOLDER_ID, 'artWorkSheetBackgroundType') !== 'slice') {
                css.push('.sheetV2.character form {')
                css.push('  border-image: none;')
                css.push('  background: ' + game.settings.get(FOLDER_ID, 'artWorkSheetBackground') + ';')
                css.push('  background-size: ' + game.settings.get(FOLDER_ID, 'artWorkSheetBackgroundType') + ';')
                css.push('}')
              }
            }
          }
          if (game.settings.get(FOLDER_ID, 'artWorkOtherSheetBackground')) {
            if (game.settings.get(FOLDER_ID, 'artWorkOtherSheetBackground').toLowerCase() === 'null') {
              css.push('--other-sheet-bg: url(\'./assets/images/void.webp\');)')
            } else {
              css.push('--other-sheet-bg: ' + game.settings.get(FOLDER_ID, 'artWorkOtherSheetBackground') + ';')
            }
          }
          if (game.settings.get(FOLDER_ID, 'artworkSheetImage')) {
            if (game.settings.get(FOLDER_ID, 'artworkSheetImage').toLowerCase() === 'null') {
              css.push('--main-sheet-image: url(\'./assets/images/void.webp\');)')
            } else {
              css.push('--main-sheet-image: ' + game.settings.get(FOLDER_ID, 'artworkSheetImage') + ';')
            }
          }
          if (game.settings.get(FOLDER_ID, 'artworkFrontColor')) {
            css.push('--main-sheet-front-color: ' + game.settings.get(FOLDER_ID, 'artworkFrontColor') + ';')
          }
          if (game.settings.get(FOLDER_ID, 'artworkBackgroundColor')) {
            css.push('--main-sheet-back-color: ' + game.settings.get(FOLDER_ID, 'artworkBackgroundColor') + ';')
          }
          if (game.settings.get(FOLDER_ID, 'artworkInteractiveColor')) {
            css.push('--main-sheet-interactive-color: ' + game.settings.get(FOLDER_ID, 'artworkInteractiveColor') + ';')
          }
          if (!game.settings.get(FOLDER_ID, 'artworkFixedSkillLength')) {
            css.push('--skill-length: auto;')
            css.push('--skill-specialization-length: auto;')
          }
          if (game.settings.get(FOLDER_ID, 'artworkMainFont')) {
            css.push('@font-face {')
            css.push('  font-family: customSheetFont;')
            css.push('  src: ' + game.settings.get(FOLDER_ID, 'artworkMainFont') + ';')
            css.push('}')
          }
          if (game.settings.get(FOLDER_ID, 'artworkMainFontBold')) {
            css.push('@font-face {')
            css.push('  font-family: customSheetFont;')
            css.push('  font-weight: bold;')
            css.push('  src: ' + game.settings.get(FOLDER_ID, 'artworkMainFontBold') + ';')
            css.push('}')
          }
        }
        const messages = [
          '<div>',
          'It is recommended you use the module <a href="https://foundryvtt.com/packages/custom-css">Custom CSS</a> to override CSS.'
        ]
        if (css.length) {
          messages.push('Your existing modifications are shown below')
          messages.push('</div>')
          messages.push('<pre style="margin: 0; border: 1px solid rgb(0, 0, 0); padding: 0.5rem;">' + css.join('\n') + '</pre>')
        } else {
          messages.push('</div>')
        }
        foundry.applications.api.DialogV2.prompt({
          window: { title: 'SETTINGS.OverrideSheetArtwork' },
          position: {
            width: 1000
          },
          content: messages.join('\n'),
          rejectClose: false,
          modal: true
        })
      })
      /* // FoundryVTT V12 */
      if (game.release.generation === 12) {
        element.find('#settings-documentation').append(button)
      } else {
        element.querySelector('section.documentation').append(button)
      }
    }
  }
}
