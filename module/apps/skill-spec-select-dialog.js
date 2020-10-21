export class SkillSpecSelectDialog {

	static async create( skills, specializationName, baseValue = null, name = null)
	{
		const html = await renderTemplate('systems/CoC7/templates/apps/skill-spec-select.html', {hasSkills: 0 < skills.length, skills: skills, base: baseValue, name: name });
		return new Promise((resolve) => {
			let formData = null;
			const dlg = new Dialog({
				title: name? game.i18n.format('CoC7.SkillSelectBase', {name: name}) :game.i18n.format('CoC7.SkillSpecSelectTitle', {specialization: specializationName}),
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