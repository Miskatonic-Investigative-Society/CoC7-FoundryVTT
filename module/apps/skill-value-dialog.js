export class SkillValueDialog {

	static async create( name = null, baseValue = null)
	{
		const html = await renderTemplate('systems/CoC7/templates/apps/skill-value.html', {base: baseValue, name: name });
		return new Promise((resolve) => {
			let formData = null;
			const dlg = new Dialog({
				title: game.i18n.format('CoC7.SkillValue', {name: name}),
				content: html,
				buttons: {
					validate: {
						label: game.i18n.localize('CoC7.Validate'),
						callback: html => {
							formData = new FormData(html[0].querySelector('#skill-select-form'));
							return resolve(formData);
						}
					}
				},
				default: 'validate',
				close: () => {return resolve(false);}
			});
			dlg.render(true);
		});
	}
}