import  { COC7 } from '../../config.js';
// import { CoCActor } from '../../actors/actor.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7StatusSheet extends ItemSheet {
	/**
	 * 
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'status'],
			width: 520,
			height: 480,
			resizable: false,
			scrollY: ['.tab.description'],
			tabs: [{navSelector: '.sheet-navigation', contentSelector: '.sheet-body', initial: 'description'}]
		});
	}

	/**
	 * 
	 */
	get template() {
		return 'systems/CoC7/templates/items/status.html';
	}

	/* Prepare data for rendering the Item sheet
	* The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		// this.item.checkSkillProperties();
		const data = super.getData();

		data.itemProperties = [];
		
		for (let [key, value] of Object.entries(data.data.type)) {
			if( value) data.itemProperties.push( COC7.statusType[key]?COC7.statusType[key]:null);
		}
		return data;
	}
}