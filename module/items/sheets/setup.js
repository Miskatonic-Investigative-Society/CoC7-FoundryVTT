import  { COC7 } from '../../config.js';
import { CoC7Item } from '../item.js';
// import { CoCItemSheet } from './item-sheet.js';
// import { CoC7Item } from '../item.js';
// import { CoCActor } from '../../actors/actor.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class CoC7SetupSheet extends ItemSheet {
	/**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
	activateListeners(html) {
		super.activateListeners(html);

		if (!this.options.editable) return;

		html.find('.item .item-name h4').click(event => this._onItemSummary(event, 'items'));
		html.find('.item-delete').click(event => this._onItemDelete(event, 'items'));
		html.find('.add-bio').click( async () => await this._onAddBio());
		html.find('.remove-section').click(this._onRemoveSection.bind(this));

		
		// html.find('.item-edit').click(async ev => {
		// 	const li = $(ev.currentTarget).parents('.item');
		// 	const itemData = this.getItem(li.data('itemId'), 'skills');
		// 	delete itemData._id;
		// 	delete itemData.folder;
		// 	const item = new CoC7Item(itemData);
		// 	await item.sheet.render(true); //marche pas !!
		// });        
	}

	async _onDrop(event, collectionName = 'items'){
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

		let item;

		if (data.pack) {
			const pack = game.packs.get(data.pack);
			if (pack.metadata.entity !== 'Item') return;
			item = await pack.getEntity(data.id);
		} else if (data.data) {
			item = data;
		} else {
			item = game.items.get(data.id);
		}
		if (!item || !item.data) return;
		if( !['item', 'weapon', 'skill', 'book', 'spell'].includes( item.data.type)) return;

		if( !CoC7Item.isAnySpec(item)){
			if( this.item.data.data.items.find( el => el.name === item.data.name)) return;
		}

		const collection = this.item.data.data[collectionName] ? duplicate( this.item.data.data[collectionName]) : [];
		collection.push( duplicate(item.data));
		await this.item.update( { [`data.${collectionName}`] : collection});
		
	}

	async _onRemoveSection(event){
		const a = event.currentTarget;
		const div = a.closest('.item');
		const bio =  duplicate(this.item.data.data.bioSections);
		bio.splice( Number(div.dataset.index), 1);
		await this.item.update( {'data.bioSections': bio});
	}

	async _onAddBio(){
		const bio = this.item.data.data.bioSections ? duplicate(this.item.data.data.bioSections): [];
		bio.push( null);
		await this.item.update( { ['data.bioSections'] : bio});
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
    
	getItem(  itemId, collectionName = 'items'){
		return  this.item.data.data[collectionName].find( s => { return s._id === itemId;});
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
			classes: ['coc7', 'sheet', 'setup'],
			width: 520,
			height: 480,
			resizable: false,
			dragDrop: [{dragSelector: '.item'}],
			scrollY: ['.tab.description'],
			tabs: [{navSelector: '.sheet-navigation', contentSelector: '.sheet-body', initial: 'description'}]
		});
	}

	get template() {
		return 'systems/CoC7/templates/items/setup.html';
	}

	_onDragStart(event) {
		let li = event.currentTarget.closest('.item'),
			skill = this.item.data.data.items.find(s => { return s._id === li.dataset.itemId;});

		const dragData = { type: 'Item', data: skill };
		event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
	}

	getData(){
		const data=super.getData();

		data.isOwned = this.item.isOwned;

		// data.data.items = duplicate( data.data.skills);
		// this.item.update( { ['data.items'] : duplicate( data.data.skills)});


		data.skills = data.data.items.filter( it => 'skill' == it.type);
		data.otherItems = data.data.items.filter( it => 'skill' != it.type);

		data.skillListEmpty = (0 == data.skills.length);
		data.skills.forEach( skill => {
			if( skill.data.specialization && !skill.name.includes(skill.data.specialization))
				skill.displayName = `${skill.data.specialization} (${skill.name})`;
			else skill.displayName = skill.name;
		});
		
		data.skills.sort( (a,b) => {
			if( a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
			if( a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
			return 0;
		});

		data.eras = {};
		data.itemProperties = [];
        
		for (let [key,value] of Object.entries(COC7.eras)){
			if( !data.data.eras[key]){
				data.data.eras[key] = {};
				data.data.eras[key].selected = false;
			}
			data.data.eras[key].name = game.i18n.localize(value);
			data.data.eras[key].internalName = value;
		}

		for (let entry of Object.entries(data.data.eras)) {
			if( entry[1].selected) data.itemProperties.push( entry[1].name);
		}
		return data;
	}

	_updateObject(event, formData) {
		// TODO: This can be removed once 0.7.x is release channel
		if ( !formData.data ) formData = expandObject(formData);

		if ( formData.data.bioSections ){
			formData.data.bioSections = Object.values( formData.data?.bioSections || []);
			// for(let index = 0; index < this.item.data.data.bioSections.length; index++) {
			// 	formData.data.bioSections[index] = duplicate(this.item.data.data.bioSections[index]);
			// }
		}

		if( event.currentTarget?.name == 'data.characteristics.points.enabled'){
			formData.data.characteristics.rolls.enabled = !event.currentTarget.checked;
		}

		if( event.currentTarget?.name == 'data.characteristics.rolls.enabled'){
			formData.data.characteristics.points.enabled = !event.currentTarget.checked;
		}

		super._updateObject(event, formData);
	}


}