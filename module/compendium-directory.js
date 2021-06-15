export class CoC7CompendiumDirectory extends CompendiumDirectory {
	activateListeners (html) {
		super.activateListeners(html);
		let translated = false;
		if (game.i18n.lang === 'en') {
			translated = true;
		} else if (typeof game.babele !== 'undefined') {
			for (const v of Object.values(game.babele.modules)) {
				if (v.lang === game.i18n.lang) {
					translated = true;
				}
			}
		}
		if (!translated) {
			html.find('footer.directory-footer').append('<a class="compendium-translation" title="' + game.i18n.localize('CoC7.HowToTranslateTitle') + '">' + game.i18n.localize('CoC7.HowToTranslateTitle') + '</a>');
			html.find('.compendium-translation').click(() => {
				const message = '<p>' + game.i18n.localize('CoC7.HowToTranslateWarning') + '</p>' +
					'<p>' + game.i18n.localize('CoC7.HowToTranslateInstallBabele') + '</p>' +
					'<p>' + game.i18n.localize('CoC7.HowToTranslateInstallTranslation') + '</p>' +
					'<p>' + game.i18n.localize('CoC7.HowToTranslateEnableTranslation') + '</p>' +
					'<p>' + game.i18n.localize('CoC7.HowToTranslateNoTranslation') + '</p>';
				new Dialog(
					{
						title: game.i18n.localize('CoC7.HowToTranslateTitle'),
						content: message,
						buttons: {},
						default: 'close'
					},
					{}
				).render(true);
			});
		}
	}
}
