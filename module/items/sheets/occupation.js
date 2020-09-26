import  { COC7 } from '../../config.js';
// import { CoCActor } from '../../actors/actor.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7OccupationSheet extends ItemSheet {
	/**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
	activateListeners(html) {
		super.activateListeners(html);
		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;
		// html.on('drop', (event) => this._onDrop(event, 'skill', 'skills'));
		html.find('.item .item-name h4').click(event => this._onItemSummary(event, 'skills'));
		html.find('.item-delete').click(event => this._onItemDelete(event, 'skills'));
	}

	async _onDrop(event, type = 'skill', collectionName = 'skills'){
		event.preventDefault();  
		event.stopPropagation();
		if( event.originalEvent) return;
		let data;
		try {
			data = JSON.parse(event.dataTransfer.getData('text/plain'));
			if (data.type !== 'Item') return;
		} catch (err) {
			return false;
		}

		let item = game.items.get(data.id);
		// // Case 2 - Data explicitly provided
		// else if (data.data) {
		// 	let sameItem = data._id === item._id;
		// 	if (sameItem) return null;//this._onSortItem(event, data.data); // Sort existing items
		// 	else return this.spells.push( data);  // Create a new Item
		// }

		// Case 3 - Import from World entity
		// else {
		if (data.pack) {
			const pack = game.packs.get(data.pack);
			if (pack.metadata.entity !== 'Item') return;
			item = await pack.getEntity(data.id);
		} else {
			item = game.items.get(data.id);
		}
		if (!item || !(type === item.data.type)) return;
		const collection = this.item.data.data[collectionName] ? duplicate( this.item.data.data[collectionName]) : [];
		collection.push( duplicate(item.data));
		await this.item.update( { [`data.${collectionName}`] : collection});
		// const spells = this.item.data.data.spells;
		// spells.push( duplicate(item.data));
		// const update = {};
		// update.spells = spells;
		// await this.item.update( update);
		// this.item.createEmbeddedEntity('OwnedItem', duplicate(item.data));
		// }
	}

	_onItemSummary(event, collectionName='items') {
		event.preventDefault();
		let li = $(event.currentTarget).parents('.item'),
			item = this.item.data.data[collectionName].find(s => { return s._id === li.data('item-id');}),
			chatData = item.data.description;
	
		// Toggle summary
		if ( li.hasClass('expanded') ) {
			let summary = li.children('.item-summary');
			summary.slideUp(200, () => summary.remove());
		} else {
			let div = $(`<div class="item-summary">${chatData.value}</div>`);
			let props = $('<div class="item-properties"></div>');
			// chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
			div.append(props);
			li.append(div.hide());
			div.slideDown(200);
		}
		li.toggleClass('expanded');
	}

	async _onItemDelete(event, collectionName = 'items'){
		let itemIndex = $(event.currentTarget).parents('.item').data('item-id');
		if( itemIndex) await this.removeItem(itemIndex, collectionName);
	}

	async removeItem( itemId, collectionName = 'items'){
		const itemIndex = this.item.data.data[collectionName].findIndex( s => { return s._id === itemId;});
		if( -1 < itemIndex){
			const collection = this.item.data.data[collectionName] ? duplicate( this.item.data.data[collectionName]) : [];
			collection.splice(itemIndex, 1);
			await this.item.update( { [`data.${collectionName}`] : collection});
		}
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['coc7', 'sheet', 'occupation'],
			width: 520,
			height: 480,
			resizable: false,
			dragDrop: [{dragSelector: '.item', dropSelector: null}],
			scrollY: ['.tab.description'],
			tabs: [{navSelector: '.sheet-navigation', contentSelector: '.sheet-body', initial: 'description'}]
		});
	}

	get template() {
		return 'systems/CoC7/templates/items/occupation.html';
	}

	_onDragStart(event) {
		let li = event.currentTarget.closest('.item'),
			skill = this.item.data.data.skills.find(s => { return s._id === li.dataset.itemId;});

		const dragData = { type: 'Item', data: skill };
		event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
	}

	getData(){
		const data=super.getData();
        
		const optionnal = [];
		const mandatory = [];
		for( let [key, carac] of Object.entries(data.data.occupationSkillPoints)){
			if( carac.multiplier){
				const caracName = game.i18n.localize( `CHARAC.${key.toUpperCase()}`);
				if( carac.selected && carac.optional) optionnal.push(`${caracName}x${carac.multiplier}`);
				if( carac.selected && !carac.optional) mandatory.push(`${caracName}x${carac.multiplier}`);
			}
		}
        
		data.occupationPointsString = '';
		const orString = ` ${game.i18n.localize('CoC7.Or')} `;
		if( mandatory.length) data.occupationPointsString += mandatory.join(' + ');
		if( optionnal.length && mandatory.length ) data.occupationPointsString += ` + (${optionnal.join(orString)})`;
		if( optionnal.length && !mandatory.length ) data.occupationPointsString += optionnal.join(orString);
		
        

		data.itemProperties = [];
		
		for (let [key, value] of Object.entries(data.data.type)) {
			if( value) data.itemProperties.push( COC7.occupationProperties[key]?COC7.occupationProperties[key]:null);
		}
		return data;
	}


}