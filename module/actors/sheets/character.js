import { CoC7CharacterSheet } from './actor-sheet.js';

export class CoC7CharacterSheetV2 extends CoC7CharacterSheet {

	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheetV2', 'actor', 'character'],
			template: 'systems/CoC7/templates/actors/character-sheet-V2.html',
			width: 687,
			height: 623,
			resizable: true,
			dragDrop: [{dragSelector: '.item', dropSelector: null}],
			tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'skills'}]
		});
	}
    
}