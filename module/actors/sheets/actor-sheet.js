import { CoC7ActorSheet } from './base.js';


/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7CharacterSheet extends CoC7ActorSheet {
	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		const data = super.getData();
		data.manualCredit = this.actor.getActorFlag('manualCredit');
		if( !data.manualCredit){
			data.credit = {};
			let factor;
			let moneySymbol;
			if( !data.data.credit){ 
				factor = 1;
				moneySymbol = '$';
			}
			else {
				factor = parseInt(data.data.credit.multiplier)? parseInt(data.data.credit.multiplier): 1;
				moneySymbol = data.data.credit.monetarySymbol? data.data.credit.monetarySymbol: '$';
			}

			data.credit.spendingLevel = `${this.actor.spendingLevel*factor}${moneySymbol}`;
			data.credit.assets = `${this.actor.assets*factor}${moneySymbol}`;
			data.credit.cash = `${this.actor.cash*factor}${moneySymbol}`;
		}

		return data;
	}

	/* -------------------------------------------- */

	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'actor', 'character'],
			template: 'systems/CoC7/templates/actors/character-sheet.html',
			width: 600,
			height: 650,
			tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'skills'}]
		});
	}
}
