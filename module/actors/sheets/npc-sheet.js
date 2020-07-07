import { CoC7ActorSheet } from './base.js';


/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7NPCSheet extends CoC7ActorSheet {

	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		const data = super.getData();

		//TODO : do we need that ?
		data.allowFormula = true;
		data.displayFormula = this.actor.getActorFlag( 'displayFormula'); // Put to false for now.
		if( data.displayFormula === undefined) data.displayFormula = false;

		return data;
	}


	/* -------------------------------------------- */

	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'actor', 'npc'],
			template: 'systems/CoC7/templates/actors/npc-sheet.html',
			width: 600,
			height: 'auto'
		});
	}
}
