import  { COC7 } from '../../config.js';
import { CoC7Item } from '../item.js';
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

		html.find('.item .item-name h4').click(event => this._onItemSummary(event, 'skills'));
		html.find('.item-delete').click(event => this._onItemDelete(event, 'skills'));
		
		html.find('.group-item-delete').click(this._onGroupItemDelete.bind(this));
		html.find('.group-control').click(this._onGroupControl.bind(this));


		const dragDrop = new DragDrop({
			dropSelector: '.droppable',
			callbacks: { drop: this._onDrop.bind(this) }
		});
		dragDrop.bind(html[0]);
	}

	async _onDrop(event, type = 'skill', collectionName = 'skills'){
		event.preventDefault();  
		event.stopPropagation();

		const optionalSkill =  event?.currentTarget?.classList?.contains('optional-skills');
		const ol = event?.currentTarget?.closest('ol');
		const index = ol?.dataset?.group;

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
		if (!item || !(type === item.data.type)) return;

		if( optionalSkill){
			if( !CoC7Item.isAnySpec(item)){ //Generic specialization can be included many times
				if( this.item.data.data.skills.find( el => el.name === item.data.name)) return; //If skill is already in main don't add it
				if( this.item.data.data.groups[index].skills.find( el => el.name === item.name)) return; //If skill is already in group don't add it
			}

			const groups = duplicate(this.item.data.data.groups);
			groups[index].skills = groups[index].skills.concat([item.data]);
			await this.item.update({ ['data.groups']: groups});
		} else {
			if( !CoC7Item.isAnySpec(item)){ //Generic specialization can be included many times
				
				if( this.item.data.data.skills.find( el => el.name === item.data.name)) return;

				for (let i = 0; i < this.item.data.data.groups.length; i++) { //If the same skill is in one of the group remove it from the groups
					const index = this.item.data.data.groups[i].skills.findIndex( el => el.name === item.data.name);
					if( -1 !=  index){
						const groups =  duplicate(this.item.data.data.groups);
						groups[i].skills.splice( index, 1);
						await this.item.update( {'data.groups': groups});
					}
				
				}
			}

			const collection = this.item.data.data[collectionName] ? duplicate( this.item.data.data[collectionName]) : [];
			collection.push( duplicate(item.data));
			await this.item.update( { [`data.${collectionName}`] : collection});
		}
	}

	async _onGroupControl(event){
		event.preventDefault();
		const a = event.currentTarget;
	
		// Add new damage component
		if ( a.classList.contains('add-group') ) {
			await this._onSubmit(event);  // Submit any unsaved changes
			const groups =  this.item.data.data.groups;
			await this.item.update( {'data.groups': groups.concat( [ { options : 0, skills: []	}])});
		}	

		if( a.classList.contains('remove-group')){
			await this._onSubmit(event);  // Submit any unsaved changes
			const groups =  duplicate(this.item.data.data.groups);
			const ol = a.closest('.item-list.group');
			groups.splice( Number(ol.dataset.group), 1);
			await this.item.update( {'data.groups': groups});
		}
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

	async _onGroupItemDelete( event){
		const a = event.currentTarget;
		const li = a.closest('.item');
		const ol = li.closest('.item-list.group');
		const groups =  duplicate(this.item.data.data.groups);
		groups[Number(ol.dataset.group)].skills.splice( Number(li.dataset.itemIndex), 1);
		await this.item.update( {'data.groups': groups});
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
			dragDrop: [{dragSelector: '.item'}],
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

		data.isOwned = this.item.isOwned;

		const optionnal = [];
		const mandatory = [];
		for( let [key, carac] of Object.entries(data.data.occupationSkillPoints)){
			if( carac.multiplier){
				const caracName = game.i18n.localize( `CHARAC.${key.toUpperCase()}`);
				if( carac.selected && carac.optional) optionnal.push(`${caracName}x${carac.multiplier}`);
				if( carac.selected && !carac.optional) mandatory.push(`${caracName}x${carac.multiplier}`);
			}
		}

		data.skillListEmpty = (0 == data.data.skills.length);
		data.data.skills.forEach( skill => { //For each skill if it's a spec and spac name not included in the name add it
			if( skill.data.specialization && !skill.name.includes(skill.data.specialization))
				skill.displayName = `${skill.data.specialization} (${skill.name})`;
			else skill.displayName = skill.name;
		});

		data.data.skills.sort( (a,b) => {
			if( a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
			if( a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
			return 0;
		});



		for (let index = 0; index < data.data.groups.length; index++) {
			data.data.groups[index].isEmpty = (0 == data.data.groups[index].skills.length);
			data.data.groups[index].skills.forEach( skill => { //For each skill of each sub group if it's a spec and spac name not included in the name add it
				if( skill.data.specialization && !skill.name.includes(skill.data.specialization))
					skill.displayName = `${skill.data.specialization} (${skill.name})`;
				else skill.displayName = skill.name;
			});

			data.data.groups[index].skills.sort( (a,b) => {
				if( a.displayName.toLowerCase() < b.displayName.toLowerCase()) return -1;
				if( a.displayName.toLowerCase() > b.displayName.toLowerCase()) return 1;
				return 0;
			});
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

	_updateObject(event, formData) {
		// TODO: This can be removed once 0.7.x is release channel
		if ( !formData.data ) formData = expandObject(formData);

		if ( formData.data.groups ){
			formData.data.groups = Object.values( formData.data?.groups || {});
			for(let index = 0; index < this.item.data.data.groups.length; index++) {
				formData.data.groups[index].skills = duplicate(this.item.data.data.groups[index].skills);
			}
		}

		super._updateObject(event, formData);
	}


}