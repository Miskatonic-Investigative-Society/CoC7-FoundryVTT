import { CoC7ActorSheet } from './base.js'
import { COC7 } from '../../config.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7CreatureSheet extends CoC7ActorSheet {
	constructor(...args) {
		super(...args);
		//Every creatures starts with a figthing skill and a corresponding natural attack

		console.log("*********************CoC7CreatureSheet constructor***************");

		//Si c'est un token = this.actor.isToken
	}

	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		const data = super.getData();
		console.log("*********************CoC7CreatureSheet getdata***************");

		//TODO : do we need that ?
		data.allowFormula = true;
		data.displayFormula = this.actor.getActorFlag( "displayFormula");
		if( data.displayFormula === undefined) data.displayFormula = false;
		// await this.actor.creatureInit();



		return data;
	}


	/* -------------------------------------------- */

  	/**
   	 * Extend and override the default options used by the Actor Sheet
   	 * @returns {Object}
	*/
	   
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["coc7", "sheet", "actor", "npc", "creature"],
			template: "systems/CoC7/templates/actors/creature-sheet.html",
			width: 600,
			height: 'auto'
		});
	}
}
