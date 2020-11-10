import { CoC7ActorSheet } from './base.js';
import { CoC7SanCheck } from '../../chat/sancheck.js';

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
		data.hasSan = (null !== data.data.attribs.san.value);
		data.hasMp = (null !== data.data.attribs.mp.value);
		data.hasLuck = (null !== data.data.attribs.lck.value);

		return data;
	}

	activateListeners(html){
		super.activateListeners( html);

		html.find('.roll-san').click(this._onSanCheck.bind(this));

	}

	async _onSanCheck(){
		event.preventDefault();
		if( !this.actor.data.data.special.sanLoss.checkPassed && !this.actor.data.data.special.sanLoss.checkFailled) {
			ui.notifications.info('No sanity loss value');
			return;
		}
		CoC7SanCheck.checkTargets( this.actor.data.data.special.sanLoss.checkPassed, this.actor.data.data.special.sanLoss.checkFailled, event.shiftKey);
	}


	onCloseSheet(){
		this.actor.unsetActorFlag( 'displayFormula');
		super.onCloseSheet();
	}


	/* -------------------------------------------- */

	/**
   	 * Extend and override the default options used by the Actor Sheet
   	 * @returns {Object}
	*/

	static get defaultOptions() {
		const options=mergeObject(super.defaultOptions, {
			template: 'systems/CoC7/templates/actors/creature-sheet.html',
			width: 580,
			height: 'auto',
			classes: ['coc7', 'sheet', 'actor', 'npc', 'creature'],
			dragDrop: [{dragSelector: '.item', dropSelector: null}],
			resizable: true
		});
		return options;
	}


	setPosition(position={}) {
		const test = super.setPosition(position);
		test.height = 'auto';
		return test; 
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

	static forceAuto( app, html){
		html[0].style.height = 'auto';
	}
}
