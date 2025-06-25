/* global game */
import { CoC7DirectoryPicker } from '../system/coc7-directory-picker.js'

function createTitleNode (text) {
  const title = document.createElement('h2')
  title.classList.add('setting-header')
  title.innerText = game.i18n.localize(text)
  return title
}

export default function (app, html, user) {
  CoC7DirectoryPicker.processHtml(html)
  const systemTab = app.form.querySelector('.tab[data-tab=system]')
  systemTab.querySelector('input[name=CoC7\\.displayInitDices]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleInitiative'))
  systemTab.querySelector('input[name=CoC7\\.stanbyGMRolls]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleRoll'))
  systemTab.querySelector('input[name=CoC7\\.trustedCanModfyChatCard]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleChatCards'))
  systemTab.querySelector('input[name=CoC7\\.enableStatusIcons]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleScene'))
  systemTab.querySelector('input[name=CoC7\\.overrideGameArtwork]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleGameArtwork'))
  systemTab.querySelector('input[name=CoC7\\.displayPlayerNameOnSheet]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleSheet'))
  systemTab.querySelector('input[name=CoC7\\.disregardUsePerRound]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleWeapon'))
  systemTab.querySelector('input[name=CoC7\\.syncDice3d]')?.closest('div.form-group').before(createTitleNode('SETTINGS.TitleDiceSoNice'))
  systemTab.querySelector('input[name=CoC7\\.debugmode]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleDeveloperDebug'))
  systemTab.querySelector('select[name=CoC7\\.boutOfMadnessSummaryTable]').closest('div.form-group').before(createTitleNode('SETTINGS.TitleRollTable'))
}
