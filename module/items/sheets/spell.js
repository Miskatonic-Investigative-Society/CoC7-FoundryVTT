import  { COC7 } from '../../config.js';
// import { CoCActor } from '../../actors/actor.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7SpellSheet extends ItemSheet {
	/**
	 * 
	 */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'spell'],
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
		return 'systems/CoC7/templates/items/spell.html';
	}

	/* Prepare data for rendering the Item sheet
	* The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		// this.item.checkSkillProperties();
		const data = super.getData();
		data.castingCost = '';

		if( data.data.cost.mp) data.castingCost += `${data.data.cost.mp} ${game.i18n.localize('CoC7.MP')};`;
		if( data.data.cost.san) data.castingCost += `${data.data.cost.san} ${game.i18n.localize('CoC7.SAN')};`;
		if( data.data.cost.pow) data.castingCost += `${data.data.cost.pow} ${game.i18n.localize('CHARAC.POW')};`;
		if( data.data.cost.hp) data.castingCost += `${data.data.cost.hp} ${game.i18n.localize('CoC7.HP')};`;
		if( data.data.cost.other) data.castingCost += `${data.data.cost.other};`;
		if( data.castingCost.length) data.castingCost = data.castingCost.slice(0, -1);
		else data.castingCost = game.i18n.localize('CoC7.SpellCastingCost');

		data.itemProperties = [];
		
		for (let [key, value] of Object.entries(data.data.type)) {
			if( value) data.itemProperties.push( COC7.spellProperties[key]?COC7.spellProperties[key]:null);
		}
		return data;
	}
}