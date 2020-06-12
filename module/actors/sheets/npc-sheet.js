import { CoC7ActorSheet } from './base.js'


/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7NPCSheet extends CoC7ActorSheet {
	constructor(...args) {
		super(...args);
	}

	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		const data = super.getData();

		data.allowFormula = false;
		data.displayFormula = false; // Put to false for now.

		return data;
	}


	/* -------------------------------------------- */

  	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/
	   
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["coc7", "sheet", "actor", "npc"],
			template: "systems/CoC7/templates/actors/npc-sheet.html",
			width: 600,
			height: 'auto'
		});
	}
}
