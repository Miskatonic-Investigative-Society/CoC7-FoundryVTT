import { CoC7Check } from '../check.js';

export class RollDialog {

	static async create()
	{
		const unknownDifficultyDefault = 'unknown' === game.settings.get('CoC7', 'defaultCheckDifficulty');
		const html = await renderTemplate('systems/CoC7/templates/apps/bonus.html', {difficulty: CoC7Check.difficultyLevel, unknownDifficultyDefault: unknownDifficultyDefault});
		return new Promise((resolve) => {
			let formData = null;
			const dlg = new Dialog({
				title: game.i18n.localize('CoC7.BonusSelectionWindow'),
				content: html,
				buttons: {
					roll: {
						label: game.i18n.localize('CoC7.RollDice'),
						callback: html => {
							formData = new FormData(html[0].querySelector('#bonus-roll-form'));
							return resolve(formData);
						}
					}
				},
				default: 'roll',
				close: () => {return;}
			});
			dlg.render(true);
		});
	}
}
