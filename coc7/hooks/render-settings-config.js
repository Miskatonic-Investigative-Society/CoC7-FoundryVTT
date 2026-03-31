/* global game */
import { FOLDER_ID } from '../constants.js'
import CoC7DirectoryPicker from '../apps/directory-picker.js'

/**
 * Create header element
 * @param {string} text
 * @returns {HTMLElement}
 */
function createTitleNode (text) {
  /* // FoundryVTT V12 */
  if (game.release.generation === 12) {
    const title = document.createElement('h2')
    title.classList.add('setting-header')
    title.innerText = game.i18n.localize(text)
    return title
  }
  const title = document.createElement('h4')
  title.classList.add('border')
  title.innerText = game.i18n.localize(text)
  return title
}

/**
 * Render Hook
 * @param {ApplicationV2} application
 * @param {HTMLElement} element
 * @param {ApplicationRenderContext} context
 * @param {ApplicationRenderOptions} options
 */
export default function (application, element, context, options) {
  CoC7DirectoryPicker.processHtml(element)
  let systemTab
  /* // FoundryVTT V12 */
  if (typeof element.querySelector !== 'undefined') {
    systemTab = element.querySelector('.tab[data-tab=system]')
  } else {
    systemTab = element.find('.tab[data-tab=system]')[0]
  }
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.displayInitDices]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleInitiative'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.stanbyGMRolls]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleRoll'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.trustedCanModfyChatCard]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleChatCards'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.enableStatusIcons]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleScene'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.overrideGameArtwork]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleGameArtwork'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.displayPlayerNameOnSheet]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleSheet'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.disregardUsePerRound]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleWeapon'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.tenDieBonus]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleDiceSoNice'))
  systemTab.querySelector('input[name=' + FOLDER_ID + '\\.debugmode]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleDeveloperDebug'))
  systemTab.querySelector('select[name=' + FOLDER_ID + '\\.boutOfMadnessSummaryTable]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleRollTable'))
}
