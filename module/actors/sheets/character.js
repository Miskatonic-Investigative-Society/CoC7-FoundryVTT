import { CoC7CharacterSheet } from './actor-sheet.js';

export class CoC7CharacterSheetV2 extends CoC7CharacterSheet {

	getData() {
		const data = super.getData();

		data.skillList=[];

		let previousSpec = '';
		for (const skill of data.skills) {
			if( skill.data.properties.special){
				if( previousSpec != skill.data.specialization){
					previousSpec = skill.data.specialization;
					data.skillList.push({
						isSpecialization: true,
						name: skill.data.specialization
					});
				}
			}
			data.skillList.push(skill);
		}

		return data;
	}

	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheetV2', 'actor', 'character'],
			template: 'systems/CoC7/templates/actors/character-sheet-v2.html',
			width: 687,
			height: 623,
			resizable: true,
			dragDrop: [{dragSelector: '.item', dropSelector: null}],
			tabs: [{navSelector: '.sheet-nav', contentSelector: '.sheet-body', initial: 'skills'}]
		});
	}
    
}