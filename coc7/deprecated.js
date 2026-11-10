import { FOLDER_ID } from './constants.js'

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
    return game[FOLDER_ID].cocid.fromCoCIDRegexAllMixed({ cocidRegExp, type, lang, era, scope: 'world', langFallback })
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
    return game[FOLDER_ID].cocid.fromCoCIDRegexAllMixed({ cocidRegExp, type, lang, era, scope: 'compendiums', langFallback })
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
    return game[FOLDER_ID].cocid.eraToggle(document, era)
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
    return game[FOLDER_ID].cocid.expandItemArray({ itemList, lang, era, langFallback, showLoading })
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
    return game[FOLDER_ID].cocid.fromCoCID(cocid, lang, era, langFallback)
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
    return game[FOLDER_ID].cocid.fromCoCIDAll({ cocid, lang, era, scope, langFallback, showLoading })
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
    return game[FOLDER_ID].cocid.fromCoCIDBest({ cocid, lang, era, langFallback, showLoading })
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
    return game[FOLDER_ID].cocid.findCocIdInList(cocid, list)
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
    return game[FOLDER_ID].cocid.fromCoCIDRegexBest({ cocidRegExp, type, lang, era, langFallback, showLoading })
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
    return game[FOLDER_ID].cocid.getPrefix(document)
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
    return game[FOLDER_ID].cocid.guessGroupFromDocument(document)
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
    return game[FOLDER_ID].cocid.guessGroupFromKey(document)
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
    return game[FOLDER_ID].cocid.guessId(document)
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
    return game[FOLDER_ID].cocid.makeGroupRegEx(document)
  }
}

class DeprecatedWarningCoC7DamageCard {
  /**
   * @inheritdoc
   * @deprecated No replacement
   */
  static get defaultOptions () { // eslint-disable-line getter-return
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

export default class deprecated {
  static warningsDisplayed = []

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
      element.querySelector('section.documentation').append(button)
    }
  }
}
