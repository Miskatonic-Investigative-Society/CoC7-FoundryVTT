/* global Dialog game */
export default function (application, html, data) {
  let translated = false
  if (game.i18n.lang === 'en') {
    translated = true
  } else if (typeof game.babele !== 'undefined') {
    for (const v of Object.values(game.babele.modules)) {
      if (v.lang === game.i18n.lang) {
        translated = true
      }
    }
  }
  if (!translated) {
    let footer = false

    const button = document.createElement('a')
    button.classList.add('compendium-translation')
    button.innerText = game.i18n.localize(game.i18n.localize('CoC7.HowToTranslateTitle'))
    button.onclick = () => {
      const message =
        '<p>' +
        game.i18n.localize('CoC7.HowToTranslateWarning') +
        '</p>' +
        '<p>' +
        game.i18n.localize('CoC7.HowToTranslateInstallBabele') +
        '</p>' +
        '<p>' +
        game.i18n.localize('CoC7.HowToTranslateInstallTranslation') +
        '</p>' +
        '<p>' +
        game.i18n.localize('CoC7.HowToTranslateEnableTranslation') +
        '</p>' +
        '<p>' +
        game.i18n.localize('CoC7.HowToTranslateNoTranslation') +
        '</p>'
      new Dialog(
        {
          title: game.i18n.localize('CoC7.HowToTranslateTitle'),
          content: message,
          buttons: {},
          default: 'close'
        },
        {}
      ).render(true)
    }
    try {
      footer = html.querySelector('footer.directory-footer')
    } catch (e) {
      /* // FoundryVTT v12 */
      footer = html[0].querySelector('footer.directory-footer')
    }
    if (footer) {
      footer.append(button)
    }
  }
}
