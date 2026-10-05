import { FOLDER_ID } from '../constants.js'

/**
 * Create header element
 * @param {string} text
 * @returns {HTMLElement}
 */
function createTitleNode (text) {
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
  const systemTab = element.querySelector('.tab[data-tab=system]')
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
