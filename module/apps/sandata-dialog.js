export class SanDataDialog {
	static async create(options = {})
	{
		const html = await renderTemplate('systems/CoC7/templates/apps/sandata.html', options);
        
		return new Promise((resolve) => {
			let formData = null;
			const dlg = new Dialog({
				title: options.displayName? game.i18n.format( 'CoC7.SanDataSelectionWindowNamed', {name: options.displayName}):game.i18n.localize('CoC7.SanDataSelectionWindow'),
				content: html,
				buttons: {
					Validate: {
						label: game.i18n.localize('CoC7.Validate'),
						callback: html => {
							formData = new FormData(html[0].querySelector('#san-data-form'));
							return resolve(formData);
						}
					}
				},
				default: 'Validate',
				close: () => {return;}
			});
			dlg.render(true);
		});
	}
}
