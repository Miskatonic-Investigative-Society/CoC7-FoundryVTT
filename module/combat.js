import { CoC7Check} from './check.js';
export class CoC7Combat {
	static renderCombatTracker(app, html, data){
		const currentCombat = data.combats[data.currentIndex - 1];
		if( !currentCombat) return;

		// TODO : Si le combat est deja debuté avant chargement la fonction d'initiative pointe vers l'ancienne.
		// la fonction attribuée est data.combat.rollInitiative
		html.find('.combatant').each( (i, el) => {
			// if( game.combat.started){

			const combId = el.getAttribute('data-combatant-id');
			const combatantControlsDiv = el.querySelector('.combatant-controls');
			// const combatant = game.combat.getCombatant(combId);
			const combatant = currentCombat.data.combatants.get(combId);

			if(!!combatant.getFlag('CoC7', 'hasGun')) {
				$(combatantControlsDiv).prepend(`<a class="combatant-control active add-init" title="${game.i18n.localize('CoC7.PutGunAway')}" data-control="drawGun"><i class="fas fa-bullseye"></i></a>`);
			}
			else {
				$(combatantControlsDiv).prepend(`<a class="combatant-control add-init" title="${game.i18n.localize('CoC7.DrawGun')}" data-control="drawGun"><i class="fas fa-bullseye"></i></a>`);
			}
			if( 'optional' == game.settings.get('CoC7', 'initiativeRule') && game.settings.get('CoC7', 'displayInitAsText')){
				if( combatant.initiative){
					const tokenInitiative = el.querySelector('.token-initiative');
					const initiativeTest = tokenInitiative.querySelector('.initiative');
					const roll = 100*combatant.initiative - 100*Math.floor(combatant.initiative);
					switch( Math.floor(combatant.initiative)){
					case CoC7Check.successLevel.fumble:
						tokenInitiative.classList.add( 'fumble');
						initiativeTest.innerText = game.i18n.localize('CoC7.Fumble');
						initiativeTest.title = roll;
						break;
					case CoC7Check.successLevel.failure :
						tokenInitiative.classList.add( 'failure');
						initiativeTest.innerText = game.i18n.localize('CoC7.Failure');
						initiativeTest.title = roll;
						break;
					case CoC7Check.successLevel.regular :
						tokenInitiative.classList.add( 'regular-success');
						initiativeTest.innerText = game.i18n.localize('CoC7.RollDifficultyRegular');
						initiativeTest.title = roll;
						break;
					case CoC7Check.successLevel.hard :
						tokenInitiative.classList.add( 'hard-success');
						initiativeTest.innerText = game.i18n.localize('CoC7.RollDifficultyHard');
						initiativeTest.title = roll;
						break;
					case CoC7Check.successLevel.extreme :
						tokenInitiative.classList.add( 'extreme-success');
						initiativeTest.innerText = game.i18n.localize('CoC7.RollDifficultyExtreme');
						initiativeTest.title = roll;
						break;
					case CoC7Check.successLevel.critical :
						tokenInitiative.classList.add( 'critical');
						initiativeTest.innerText = game.i18n.localize('CoC7.RollDifficultyCritical');
						initiativeTest.title = roll;
						break;
					}
				}
			} else if (combatant.initiative < 0) {
				const h4 = el.querySelector('.token-name').querySelector('h4');
				const span = el.querySelector('span.initiative');
				h4.style.fontWeight = '900';
				h4.style.textShadow = '1px 1px 4px darkred';
				span.style.fontWeight = '900';
				span.style.textShadow = '1px 1px 4px darkred';
				
				el.style.color = 'darkred';
				el.style.background = 'black';
				el.style.fontWeight = '900';
			}
		});
		html.find('.add-init').click(event => CoC7Combat._onToggleGun(event));
	}
	
	static async _onToggleGun( event){
		event.preventDefault();
		event.stopPropagation();
		const btn = event.currentTarget;
		const li = btn.closest('.combatant');
		const c = await game.combat.combatants.get(li.dataset.combatantId);
		if( c.actor.isOwner){
			if(!!c.getFlag('CoC7', 'hasGun')){
				await c.setFlag('CoC7', 'hasGun', false);
			}
			else{
				await c.setFlag('CoC7', 'hasGun', true);
			}
		}
		
		const newInit = await c.actor.rollInitiative(!!c.getFlag('CoC7', 'hasGun'));
		if(!!c.getFlag('CoC7', 'hasGun')){
			if( c.initiative < newInit) game.combat.setInitiative( c.id, newInit);		
		} else game.combat.setInitiative( c.id, newInit);
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
export async function rollInitiative(ids/*, formula=null, messageOptions={}*/) {

	// Structure input data
	ids = typeof ids === 'string' ? [ids] : ids;
	const currentId = this.combatant.id;

	// Iterate over Combatants, performing an initiative roll for each
	const [updates] = ids.reduce((results, id) => {
		let [updates] = results;

		// Get Combatant data
		const c = this.combatants.get(id);
		if ( !c ) return results;

		// Roll initiative
		const initiative = c.actor.rollInitiative(!!c.getFlag('CoC7', 'hasGun'));
		updates.push({_id: id, initiative: initiative});

		// Return the Roll and the chat data
		return results;
	}, [[], []]);
	if ( !updates.length ) return this;

	// Update multiple combatants
	await this.updateEmbeddedDocuments('Combatant', updates);

	// Ensure the turn order remains with the same combatant
	await this.update({turn: this.turns.findIndex(t => t.id === currentId)});

	// Create multiple chat messages
	// await CONFIG.ChatMessage.entityClass.create(messages);

	// Return the updated Combat
	return this;
}
