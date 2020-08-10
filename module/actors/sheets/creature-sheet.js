import { CoC7ActorSheet } from './base.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7CreatureSheet extends CoC7ActorSheet {

	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		const data = super.getData();
		// console.log('*********************CoC7CreatureSheet getdata***************');

		//TODO : do we need that ?
		data.allowFormula = true;
		data.displayFormula = this.actor.getActorFlag( 'displayFormula');
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
			classes: ['coc7', 'sheet', 'actor', 'npc', 'creature'],
			template: 'systems/CoC7/templates/actors/creature-sheet.html',
			width: 600,
			height: 'auto'
		});
	}


	
	/**
	 * Implement the _updateObject method as required by the parent class spec
	 * This defines how to update the subject of the form when the form is submitted
	 * @private
	*/

	async _updateObject(event, formData) {
		if( event.currentTarget){
			if( event.currentTarget.classList){
				if( event.currentTarget.classList.contains('characteristic-score'))
				{
					this.actor.setCharacteristic( event.currentTarget.name, event.currentTarget.value);
					return;
				}
			}
		}
		return super._updateObject(event, formData);
	}
}
