import { CoC7ActorSheet } from './base.js';

export class CoC7VehicleSheet extends CoC7ActorSheet {

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheetV2', 'actor', 'item', 'vehicle'],
			width: 520,
			height: 420,
			resizable: true,
			template: 'systems/CoC7/templates/actors/vehicle.html',
			dragDrop: [{dragSelector: '.actor', dropSelector: '.dropZone'}],
			tabs: [{navSelector: '.sheet-nav', contentSelector: '.sheet-body', initial: 'description'}]
		});
	}

	async getData(){
		const data = await super.getData();

		data.properties = [];
		if( this.actor.data.data.properties.armed) data.properties.push( game.i18n.localize( 'CoC7.ArmedVehicle'));
		data.actor = this.actor;

		const expanded = this.actor.getFlag( 'CoC7', 'expanded');
		if( undefined === expanded) data.expanded = true;
		else data.expanded = expanded;
		if( data.expanded){
			data.options.height = 420;
		} else data.options.height = 'auto';
		
		// for (let [key, value] of Object.entries(data.data.type)) {
		// 	if( value) data.itemProperties.push( COC7.bookType[key]?COC7.bookType[key]:null);
		// }
		return data;
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find( '.add-armor').click( async () => await this._onAddArmor());
		html.find( '.remove-armor').click( async (event) => await this._onRemoveArmor(event));
		html.find( '.expand-button').click( this._onToggleExpand.bind(this));
		// Everything below here is only needed if the sheet is editable
		// if (!this.options.editable) return;
		// html.on('drop', (event) => this._onDrop(event));
		// html.find('.spell .spell-name h4').click(event => this._onSpellSummary(event));
		// html.find('.item-delete').click(this._onSpellDelete.bind(this));
	}

	async _onToggleExpand(){
		const expanded = this.actor.getFlag( 'CoC7', 'expanded');
		if( expanded){
			this.oldSize = this.position.height;
			this.position.height = 'auto'; //Reset the stored position to force to recalculate window size TODO: Store previous position to restore it instead of auto
		} else {
			this.position.height =  this.oldSize || 420; //Reset the stored position to force to recalculate window size TODO: Store previous position to restore it instead of auto
		}
		await this.actor.setFlag( 'CoC7', 'expanded', !expanded);
	}

	async _onAddArmor(){
		const locations = duplicate( this.actor.data.data.attribs.armor.locations || []);
		locations.push( {name: null, value: null});
		await this.actor.update( {'data.attribs.armor.locations': locations});
	}

	async _onRemoveArmor( event){
		const button = event.currentTarget;
		const location = button.closest( '.armor');
		const index = location.dataset.index;
		const locations = duplicate( this.actor.data.data.attribs.armor.locations || null);
		if( !locations) return;
		locations.splice(index, 1);
		await this.actor.update( {'data.attribs.armor.locations': locations});
	}

	onCloseSheet(){
		super.onCloseSheet();
		//this.actor.locked = true;
	}

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	/** @override */
	_getSubmitData(updateData={}) {

		// Create the expanded update data object
		const fd = new FormDataExtended(this.form, {editors: this.editors});
		let data = fd.toObject();
		if ( updateData ) data = mergeObject(data, updateData);
		else data = expandObject(data);

		// Handle Armor array
		if( data.data.attribs.armor?.localized){
			const armor = data.data?.attribs.armor;
			if ( armor ) armor.locations = Object.values(armor?.locations || this.actor.data.data.attribs.armor.locations || {});
		}

		// Return the flattened submission data
		return flattenObject(data);
	}
}