export class CoC7VehicleSheet extends ActorSheet {

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheetV2', 'actor', 'vehicle'],
			width: 520,
			height: 400,
			resizable: true,
			template: 'systems/CoC7/templates/actors/vehicle.html',
			dragDrop: [{dragSelector: '.actor', dropSelector: '.dropZone'}],
			tabs: [{navSelector: '.sheet-navigation', contentSelector: '.sheet-body', initial: 'description'}]
		});
	}

	getData(){
		const data=super.getData();

		data.itemProperties = [];
		
		// for (let [key, value] of Object.entries(data.data.type)) {
		// 	if( value) data.itemProperties.push( COC7.bookType[key]?COC7.bookType[key]:null);
		// }
		return data;
	}
    
	activateListeners(html) {
		super.activateListeners(html);
		// Everything below here is only needed if the sheet is editable
		// if (!this.options.editable) return;
		// html.on('drop', (event) => this._onDrop(event));
		// html.find('.spell .spell-name h4').click(event => this._onSpellSummary(event));
		// html.find('.item-delete').click(this._onSpellDelete.bind(this));
	}
}