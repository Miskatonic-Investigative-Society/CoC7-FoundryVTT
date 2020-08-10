export class CoC7Combat extends Combat {
	static renderCombatTracker(combatTracker, html/*, data*/){
		// TODO : Si le combat est deja debuté avant chargement la fonction d'initiative pointe vers l'ancienne.
		// la fonction attribuée est data.combat.rollInitiative
		html.find('.combatant-controls').each( function(){
			// if( game.combat.started){
			const li = this.closest('.combatant');
			const c = game.combat.getCombatant(li.dataset.combatantId);
			if( c.initiative){
				if( c.hasGun) $(this).prepend('<a class="combatant-control active add-init" title="Has a gun ready" data-control="drawGun"><i class="fas fa-bullseye"></i></a>');
				else $(this).prepend('<a class="combatant-control add-init" title="Has a gun ready" data-control="drawGun"><i class="fas fa-bullseye"></i></a>');
				//'<img class="token-effect" src="systems/CoC7/pictures/icons/svg/noun_Gun_3441983.svg"></img>'
			}
			// }
		});
		html.find('.add-init').click(event => this._onAddInit(event));
	}
	
	static async _onAddInit(){
		event.preventDefault();
		event.stopPropagation();
		const btn = event.currentTarget;
		const li = btn.closest('.combatant');
		const c = game.combat.getCombatant(li.dataset.combatantId);
		await game.combat.rollInitiative([c._id], null, { rollMode: CONFIG.Dice.rollModes.gmroll});
		// game.combat.render(); // TODO : holding gun flag to be transfered to the actor.
		if( c.actor.owner){
			if( c.hasGun){
				await game.combat.updateCombatant({_id: c._id, hasGun: false}, {});
			}
			else{
				await game.combat.updateCombatant({_id: c._id, hasGun: true}, {});
				game.combat.setInitiative( c._id, parseInt(c.initiative) + 50);
			}
		}
	}
	
	/**
	 * Overide of rollInititative to prevent messages in chat windows
	 * Roll initiative for one or multiple Combatants within the Combat entity
	 * @param {Array|string} ids        A Combatant id or Array of ids for which to roll
	 * @param {string|null} formula     A non-default initiative formula to roll. Otherwise the system default is used.
	 * @param {Object} messageOptions   Additional options with which to customize created Chat Messages
	 * @return {Promise.<Combat>}       A promise which resolves to the updated Combat entity once updates are complete.
	 */

	async rollInitiative(ids, formula=null, messageOptions={}) {

		// Structure input data
		ids = typeof ids === 'string' ? [ids] : ids;
		const currentId = this.combatant._id;

		// Iterate over Combatants, performing an initiative roll for each
		const [updates] = ids.reduce((results, id) => {
			let [updates] = results;

			// Get Combatant data
			const c = this.getCombatant(id);
			if ( !c ) return results;

			// Roll initiative
			const cf = formula || this._getInitiativeFormula(c);
			const roll = this._getInitiativeRoll(c, cf);
			updates.push({_id: id, initiative: roll.total});

			// Determine the roll mode
			let rollMode = messageOptions.rollMode || game.settings.get('core', 'rollMode');
			if (( c.token.hidden || c.hidden ) && (rollMode === 'roll') ) rollMode = 'gmroll';

			// Construct chat message data
			// let messageData = mergeObject({
			// 	speaker: {
			// 		scene: canvas.scene._id,
			// 		actor: c.actor ? c.actor._id : null,
			// 		token: c.token._id,
			// 		alias: c.token.name
			// 	},
			// 	flavor: `${c.token.name} rolls for Initiative!`
			// }, messageOptions);
			// const chatData = roll.toMessage(messageData, {rollMode, create:false});
			// if ( i > 0 ) chatData.sound = null;   // Only play 1 sound for the whole set
			// messages.push(chatData);

			// Return the Roll and the chat data
			return results;
		}, [[], []]);
		if ( !updates.length ) return this;

		// Update multiple combatants
		await this.updateEmbeddedEntity('Combatant', updates);

		// Ensure the turn order remains with the same combatant
		await this.update({turn: this.turns.findIndex(t => t._id === currentId)});

		// Create multiple chat messages
		// await CONFIG.ChatMessage.entityClass.create(messages);

		// Return the updated Combat
		return this;
	}
}