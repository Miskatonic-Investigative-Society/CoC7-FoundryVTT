import { CoC7Check } from "../check.js";

export class RollDialog {

	// constructor( dialogData={}, options={}) {
	// 	super(dialogData, options);

	// }


	static async createSkill( tokenKey, actorId, skillId)
	{
		let actor;
		let item;
		let name;

		if( tokenKey != null){
			const [sceneId, tokenId] = tokenKey.split(".");
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity("Token", tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			actor = token.actor;
		}
		else
		{
			actor = game.actors.get( actorId);
		}

		item = actor.getOwnedItem( skillId);

		name = actor.name;

		if( actor.token != null) if( actor.token.name != null) name = actor.token.name;
		

		
	}

	static async create()
	{
		let diff = CoC7Check.difficultyLevel;
		const html = await renderTemplate("systems/CoC7/templates/apps/bonus.html", {difficulty: CoC7Check.difficultyLevel});
		return new Promise((resolve) => {
			let formData = null;
			const dlg = new Dialog({
				title: 'Bonus selection window',
				content: html,
				buttons: {
					roll: {
						label: 'Roll !',
						callback: html => {
							formData = new FormData(html[0].querySelector("#bonus-roll-form"));
							return resolve(formData);
						}
					}
				},
				default: "roll",
				close: () => {}
			});
			dlg.render(true);
		});
	}
}
