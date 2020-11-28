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
		data.displayFormula = this.actor.getActorFlag( 'displayFormula');
		if( data.displayFormula === undefined) data.displayFormula = false;
		// await this.actor.creatureInit();
		data.hasSan = (null !== data.data.attribs.san.value);
		data.hasMp = (null !== data.data.attribs.mp.value);
		data.hasLuck = (null !== data.data.attribs.lck.value);

		return data;
	}

	onCloseSheet(){
		this.actor.unsetActorFlag( 'displayFormula');
		super.onCloseSheet();
	}

	/* -------------------------------------------- */

	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'actor', 'npc'],
			dragDrop: [{dragSelector: '.item', dropSelector: null}],
			template: 'systems/CoC7/templates/actors/npc-sheet.html',
			width: 580,
			height: 'auto',
			resizable: true
		});
	}

	
	static forceAuto( app, html){
		html[0].style.height = 'auto';
	}

	setPosition(position={}) {
		const test = super.setPosition(position);
		test.height = 'auto';
		return test; 
	}
}
