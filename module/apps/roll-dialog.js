import { CoC7Check } from '../check.js';

export class RollDialog {

	static async create(options = {})
	{
		if( options.difficulty){
			options.difficultyLevel = {};
			if( CoC7Check.difficultyLevel.unknown == options.difficulty) options.difficultyLevel.unknown = true;
			if( CoC7Check.difficultyLevel.regular == options.difficulty) options.difficultyLevel.regular = true;
			if( CoC7Check.difficultyLevel.hard == options.difficulty) options.difficultyLevel.hard = true;
			if( CoC7Check.difficultyLevel.extreme == options.difficulty) options.difficultyLevel.extreme = true;
		}

		if( options.name && !options.displayName) options.displayName = options.name;
		const unknownDifficultyDefault = 'unknown' === game.settings.get('CoC7', 'defaultCheckDifficulty');
		const html = await renderTemplate('systems/CoC7/templates/apps/bonus.html', {difficulty: CoC7Check.difficultyLevel, unknownDifficultyDefault: unknownDifficultyDefault, options});
		return new Promise((resolve) => {
			let formData = null;
			const dlg = new Dialog({
				title: options.displayName? game.i18n.format( 'CoC7.BonusSelectionWindowNamed', {name: options.displayName}):game.i18n.localize('CoC7.BonusSelectionWindow'),
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
