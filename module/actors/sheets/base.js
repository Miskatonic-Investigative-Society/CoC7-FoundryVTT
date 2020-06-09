import { RollDialog } from '../../apps/roll-dialog.js'
// import { CoC7Dice } from '../../dice.js'
import { CoC7Check } from '../../check.js'
import { COC7 } from '../../config.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7ActorSheet extends ActorSheet {
	constructor(...args) {
		super(...args);
	}

	/* -------------------------------------------- */
	static parseFormula( formula){
		let parsedFormula = formula;
		for( let [key, value] of Object.entries(COC7.formula.actorsheet)){
		  parsedFormula = parsedFormula.replace( key, value)
		}
		return parsedFormula;
	}


	/* -------------------------------------------- */

	/**
	 * Activate event listeners using the prepared sheet HTML
	 * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
	*/
	activateListeners(html) {
		super.activateListeners(html);

		// Owner Only Listeners
		if ( this.actor.owner ) {
			html.find('.characteristics-label').click(this._onRollCharacteriticTest.bind(this));
            html.find('.skill-name.rollable').click(this._onRollSkillTest.bind(this));
			html.find('.attribute-label.rollable').click(this._onRollAttribTest.bind(this));
			html.find('.lock').click(this._onLockClicked.bind(this));
			html.find('.formula').click(this._onFormulaClicked.bind(this));
			html.find('.roll-characteritics').click(this._onRollCharacteriticsValue.bind(this));
            const wheelInputs = html.find('.attribute-value');
            
            for( let wheelInput of wheelInputs){
                wheelInput.addEventListener('wheel', event => this._onWheel(event));
            }
		}

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		html.find('.item-detail').click(event => this._onItemSummary(event));

		// Update Inventory Item
		html.find('.item-edit').click(ev => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.getOwnedItem(li.data("itemId"));
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find('.item-delete').click(ev => {
			const li = $(ev.currentTarget).parents(".item");
			this.actor.deleteOwnedItem(li.data("itemId"));
			li.slideUp(200, () => this.render(false));
		});

		html.find('.add-item').click( ev => {
			switch( event.currentTarget.dataset.type){
				case "skill":
					this.actor.createEmptySkill( ev);
					break;
				case "item":
					this.actor.createEmptyItem( ev);
					break;
			}
		});

		// Add or Remove Attribute
		//html.find(".attributes").on("click", ".attribute-control", this._onClickAttributeControl.bind(this));

		// Roll item/skill check
		html.find('.item .item-image').click(event => this._onItemRoll(event));
		html.find('.weapon-image').click( event => this._onWeaponRoll(event));
		html.find('.weapon-damage').click( event => this._onWeaponDamage(event));
		html.find('.skill-image').click(this._onRollSkillTest.bind(this));
		html.find('.read-only').dblclick(this._toggleReadOnly.bind(this));

		// Item Dragging
		// let handler = ev => this._onDragItemStart(ev);
		// html.find('li.item').each((i, li) => {
		// 	if ( li.classList.contains("inventory-header") ) return;
		// 	li.setAttribute("draggable", true);
		// 	li.addEventListener("dragstart", handler, false);
		// });
    }
	
	async _onRollCharacteriticsValue( event){
		this.actor.rollCharacteristicsValue();
	}

	async _onLockClicked( event){
		event.preventDefault();
		const isLocked = this.actor.locked
		this.actor.locked = isLocked ? false : true;
	}

	async _onFormulaClicked( event){
		event.preventDefault();
		this.actor.toggleFlag( 'displayFormula');
	}

	async _onRollAttribTest( event){
		event.preventDefault();

		const actorId = event.currentTarget.closest('form').dataset.actorId;
		let tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		const attrib = event.currentTarget.parentElement.dataset.attrib;

		let check = new CoC7Check();	

		if( ! event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				check.diceModifier = usage.get("bonusDice");
				check.difficulty = usage.get("difficulty");
			}
		}

		check.actor = !tokenKey ? actorId : tokenKey;
		check.rollAttribute(attrib );
		check.toMessage();
	}

    async _onWheel( event) {
		let value = parseInt(event.currentTarget.value);
		if( event.deltaY > 0){
			value = value == 0 ? 0 : value - 1;
        }
        
        if( event.deltaY < 0){
            value = value + 1;
		}
		
		switch( event.currentTarget.name){
			case "data.attribs.hp.value":
				this.actor.setHp( value);
				break;
			case "data.attribs.mp.value":
				this.actor.setMp( value);
				break;
			case "data.attribs.san.value":
				this.actor.setSan( value);
				break;
			case "data.attribs.lck.value":
				this.actor.setLuck( value);
				break;
		}
    }

	_toggleReadOnly( event) {
		event.currentTarget.readOnly = event.currentTarget.readOnly ? false : true;
		event.currentTarget.classList.toggle( "read-only");
	}

	// _onDragItemStart( event) {
	// 	const id = event.currentTarget.closest(".item").dataset.itemId;

	// 	const dragIcon = event.currentTarget.getElementsByClassName('skill-image')[0];
	// 	event.dataTransfer.setDragImage( dragIcon, -10, -10);
	// 	var transferedData = {
	// 		'itemId': id,
	// 		'actorId': this.actor.id,
	// 		'token': this.token ? `${this.token.scene._id}.${this.token.id}` : null,
	// 		'scene': this.token ? this.token.scene.id : null,
	// 		'origin': 'CoC7ActorSheet'
	// 	}
	// 	event.dataTransfer.setData("text", JSON.stringify( transferedData));
	// }

	_onItemSummary(event) {
		event.preventDefault();
		let li = $(event.currentTarget).parents(".item"),
		item = this.actor.getOwnedItem(li.data("item-id")),
		chatData = item.getChatData({secrets: this.actor.owner});

		// Toggle summary
		if ( li.hasClass("expanded") ) {
			let summary = li.children(".item-summary");
			summary.slideUp(200, () => summary.remove());
		} else {
			let div = $(`<div class="item-summary">${chatData.description.value}</div>`);
			if( item.data.data.properties.spcl) {
				let specialDiv = $(`<div class="item-summary">${chatData.description.special}</div>`);
				div.append(specialDiv);
			}
			let props = $(`<div class="item-properties"></div>`);
			chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
			div.append(props);
			li.append(div.hide());
			div.slideDown(200);
		}
		li.toggleClass("expanded");
	}


	/**
	 * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
	 * @private
	*/
	async _onItemRoll(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest(".item").dataset.itemId;
		const actorId = event.currentTarget.closest('form').dataset.actorId;
		const tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		let check = new CoC7Check();

		check.actor = !tokenKey ? actorId : tokenKey;
		check.item = itemId;
		check.roll();
		check.toMessage();
	}

	async _onWeaponRoll(event) {
		event.preventDefault();
		const skillId = event.currentTarget.dataset.skillId;
		const actorId = event.currentTarget.closest('form').dataset.actorId;
		let tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		const itemId = event.currentTarget.closest('li').dataset.itemId;

		let check = new CoC7Check();		
		
		if( ! event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				check.diceModifier = usage.get("bonusDice");
				check.difficulty = usage.get("difficulty");
			}
		}


		check.actor = !tokenKey ? actorId : tokenKey;
		check.skill = skillId;
		check.item = itemId;
		check.roll();
		check.toMessage();

		// HACK: just to pop the advanced roll window 
		// check.item.roll();
	}

	_onWeaponDamage( event) {
		event.preventDefault();
		alert("Damage clicked");
	}

	/**
	 * Handle rolling a Skill check
	 * @	param {Event} event   The originating click event
	 * @private
	*/
	async _onRollCharacteriticTest(event) {
		event.preventDefault();

		const actorId = event.currentTarget.closest('form').dataset.actorId;
		let tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		const characteristic = event.currentTarget.parentElement.dataset.characteristic;

		let check = new CoC7Check();	

		if( ! event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				check.diceModifier = usage.get("bonusDice");
				check.difficulty = usage.get("difficulty");
			}
		}

		check.actor = !tokenKey ? actorId : tokenKey;
		check.rollCharacteristic(characteristic );
		check.toMessage();

		// this.actor.rollCharacteristic(characteristic, {event: event});
	}


	/**
	 * Handle rolling a Skill check
	 * @param {Event} event   The originating click event
	 * @private
	*/
	async _onRollSkillTest(event) {
		event.preventDefault();
		const skillId = event.currentTarget.closest(".item").dataset.skillId;
		const actorId = event.currentTarget.closest('form').dataset.actorId;
		const tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		
		let check = new CoC7Check();		
		
		if( ! event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				check.diceModifier = usage.get("bonusDice");
				check.difficulty = usage.get("difficulty");
			}
		}


		check.actor = !tokenKey ? actorId : tokenKey;
		check.skill = skillId;
		check.roll();
		check.toMessage();
	}
	


	/* -------------------------------------------- */

	/**
	 * Implement the _updateObject method as required by the parent class spec
	 * This defines how to update the subject of the form when the form is submitted
	 * @private
	*/
     
    _updateObject(event, formData) { // A deplacer dans la bonne classe !!
		if( event.currentTarget){
			if( event.currentTarget.classList){

				if( event.currentTarget.classList.contains('npc-skill-score')){
					let skill = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.skillId);
					if( skill){
						skill.update( {'data.value': event.currentTarget.value});
					}
				}

				if( event.currentTarget.classList.contains('skill-name') || event.currentTarget.classList.contains('item-name')){
					let item = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.skillId);
					if( item){
						item.update( {'name': event.currentTarget.value});
					}
				}

				if( event.currentTarget.classList.contains('characteristic-formula')){
					//tester si c'est vide
					if( event.currentTarget.value.length != 0){
						//On teste si c'est une formule valide !
						let r = new Roll( event.currentTarget.value);
						r.roll();
						if( typeof(r.total) == "undefined"){
							ui.notifications.error( event.currentTarget.value + " is not a valid formula");
							formData[event.currentTarget.name] = "invalid";
						}
					}
				}
				
			}
		}

        return this.object.update(formData);

	// 	// Handle the free-form attributes list
	// 	const data = expandObject(formData).data;
	// 	if (!data) return null;
	// 	const formAttrs = expandObject(formData).data.attributes || {};
	// 	const attributes = Object.values(formAttrs).reduce((obj, v) => {
	// 	let k = v["key"].trim();
	// 	if ( /[\s\.]/.test(k) )  return ui.notifications.error("Attribute keys may not contain spaces or periods");
	// 	delete v["key"];
	// 	obj[k] = v;
	// 	return obj;
	// 	}, {});
	
	// 	// Remove attributes which are no longer used
	// 	for ( let k of Object.keys(this.object.data.data.attributes) ) {
	// 		if ( !attributes.hasOwnProperty(k) ) attributes[`-=${k}`] = null;
	// 	}

	// 	// Re-combine formData
	// 	formData = Object.entries(formData).filter(e => !e[0].startsWith("data.attributes")).reduce((obj, e) => {
	// 		obj[e[0]] = e[1];
	// 		return obj;
	// 	}, {_id: this.object._id, "data.attributes": attributes});
	
	// 	// Update the Actor
	// 	return this.object.update(formData);
  	}
}
