import { CoC7ActorSheet } from './base.js'
import { COC7 } from '../../config.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7CreatureSheet extends CoC7ActorSheet {
	constructor(...args) {
		super(...args);
		//Si c'est un token = this.actor.isToken
	}

	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		console.log("*********************CoC7CreatureSheet getdata***************");
		const data = super.getData();

		data.allowFormula = true;
		data.displayFormula = this.actor.getFlag( "displayFormula");

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
			template: "systems/CoC7/templates/actors/npc-sheet.html",
			width: 600,
			height: 'auto'
		});
	}
}
