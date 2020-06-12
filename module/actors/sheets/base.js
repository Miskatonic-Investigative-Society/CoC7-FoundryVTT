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

	getData() {
		console.log("*********************CoC7ActorSheet getdata***************");
		const data = super.getData();

		data.isToken = this.actor.isToken;
		data.itemsByType = {};
		data.skills = {};
		data.combatSkills = {};
		data.weapons = {};

		if( data.items){
			for (const item of data.items) {
				//si c'est une formule et qu'on peut l'evaluer
				//ce bloc devrait etre déplacé dans le bloc _updateFormData
				if( item.type == 'skill'){
					if( isNaN(Number(item.data.value))){
						let value = CoC7ActorSheet.parseFormula( item.data.value);
						try{
							value = Math.floor(eval(value));
						}
						catch(err){
							console.log(`unable to parse formula :${item.data.value} for skill ${item.name}`);
							value = null;
						}

						if( value){
							item.data.value = value;
							let itemToUpdate = this.actor.getOwnedItem( item._id);
							let newitem = itemToUpdate.update( {'data.value' : value});
							console.log( "found skill with formula : " + item.name + " formula : " + item.data.value)
						}
					}
				}

				let list = data.itemsByType[item.type];
				if (!list) {
					list = [];
					data.itemsByType[item.type] = list;
				}
				list.push(item);
			}

			for(const itemType in data.itemsByType)
			{
				data.itemsByType[itemType].sort((a, b) =>{
					let lca;
					let lcb;
					if( a.data.properties && b.data.properties) {
						lca = a.data.properties.special ? a.data.specialization.toLowerCase() + a.name.toLowerCase() : a.name.toLowerCase();
						lcb = b.data.properties.special ? b.data.specialization.toLowerCase() + b.name.toLowerCase() : b.name.toLowerCase();
					}
					else {
						lca = a.name.toLowerCase();
						lcb = b.name.toLowerCase();
					}
					if( lca < lcb) return -1;
					if( lca > lcb) return 1;
					return 0;
				});
			}



			//redondant avec matrice itembytype
			data.skills = data.items.filter( item => item.type == "skill").sort((a, b) => {
				let lca;
				let lcb;
				if( a.data.properties && b.data.properties) {
					lca = a.data.properties.special ? a.data.specialization.toLowerCase() + a.name.toLowerCase() : a.name.toLowerCase();
					lcb = b.data.properties.special ? b.data.specialization.toLowerCase() + b.name.toLowerCase() : b.name.toLowerCase();
				}
				else {
					lca = a.name.toLowerCase();
					lcb = b.name.toLowerCase();
				}
				if( lca < lcb) return -1;
				if( lca > lcb) return 1;
				return 0;
			});

			let cbtSkills = data.skills.filter( skill => skill.data.properties.combat == true);
			if( cbtSkills)
			{
				for( const skill of cbtSkills){
					data.combatSkills[skill._id]=skill;
				}
			}

			let weapons = data.itemsByType['weapon'];

			if( weapons){
				for( const weapon of weapons)
				{
					weapon.skillSet = true;
					weapon.data.skill.main.name = "";
					weapon.data.skill.main.value = 0;
					weapon.data.skill.alternativ.name = "";
					weapon.data.skill.alternativ.value = 0;
					if( weapon.data.skill.main.id == "")
					{
						weapon.skillSet = false
					}
					else {
						weapon.data.skill.main.name = data.combatSkills[weapon.data.skill.main.id].name;
						weapon.data.skill.main.value = data.combatSkills[weapon.data.skill.main.id].data.value;

						if( weapon.data.skill.alternativ.id != ""){
							weapon.data.skill.alternativ.name = data.combatSkills[weapon.data.skill.alternativ.id].name;
							weapon.data.skill.alternativ.value = data.combatSkills[weapon.data.skill.alternativ.id].data.value;
						}
					}

					weapon.data._properties = [];
					for( let [key, value] of Object.entries(weapon.data.properties)){
						let property = {};
						property.id = key;
						property.value = value;
						property.name = COC7.weaponProperties[key]; //Localisation a faire ici
						weapon.data._properties.push( property);
					}
					data.weapons[weapon._id] = weapon;
				}
			}

			

			const token = this.actor.token;
			data.tokenId = token ? `${token.scene._id}.${token.id}` : null;

			for ( const characteristic of Object.values(data.data.characteristics)){
				if( !characteristic.value || !data.data.flags.locked) characteristic.editable = true;
				characteristic.hard = Math.floor( characteristic.value / 2);
				characteristic.extreme = Math.floor( characteristic.value / 5);
			}
		}

		//For compat with previous characters test if auto is definied, if not we define it
		let auto = this.actor.checkUndefinedAuto();
		data.data = mergeObject( data.data, auto);

		const DEX = data.data.characteristics.dex.value;
		const STR = data.data.characteristics.str.value;
		const SIZ = data.data.characteristics.siz.value;
		
		data.MOV = data.data.attribs.mov.value;
		data.db = data.data.attribs.mov.value;
		data.build = data.data.attribs.build.value

		if( data.data.attribs.mov.auto)
		{
			if( DEX < SIZ && STR < SIZ) data.MOV = 	7;
			if( DEX >= SIZ || STR >= SIZ) data.MOV = 8;
			if( DEX >= SIZ && STR >= SIZ) data.MOV = 9;
			if( !isNaN(parseInt(data.data.infos.age))) data.MOV = parseInt(data.data.infos.age) >= 40? data.MOV - Math.floor( parseInt(data.data.infos.age) / 10) + 3: data.MOV;
		}

		data.hasDBFormula = false;
		if( data.data.attribs.db.auto)
		{
			if( STR+SIZ > 164){
				let d6 = Math.floor( (STR + SIZ - 45) / 80);
				data.DB = `${d6}D6`;
				data.hasDBFormula = true;
			}
			else
			{
				switch( true){
					case( STR + SIZ  < 65):
						data.DB = -2;
						break;
					case( STR + SIZ < 85):
						data.DB = -1;
						break;
					case( STR + SIZ < 125):
						data.DB = 0;
						break;
					case( STR + SIZ < 165):
						data.DB = "1D4";
						data.hasDBFormula = true;
						break;
				}
			}
		}

		if( data.data.attribs.build.auto)
		{
			if( STR+SIZ > 164){
				data.build  = Math.floor( (STR + SIZ - 45) / 80) + 1;
			}
			else
			{
				switch( true){
					case( STR + SIZ  < 65):
						data.build = -2;
						break;
					case( STR + SIZ < 85):
						data.build = -1;
						break;
					case( STR + SIZ < 125):
						data.build = 0;
						break;
					case( STR + SIZ < 165):
						data.build = 1;
						break;
				}
			}
		}

		if( data.data.attribs.hp.auto ){
			//TODO if any is null set max back to null.
			if ( data.data.characteristics.siz.value != null && data.data.characteristics.con.value != null)
				data.data.attribs.hp.max = Math.floor( data.data.characteristics.pow.value / 5);
			if( data.data.attribs.hp.value > data.data.attribs.hp.max)
				data.data.attribs.hp.value = Math.floor( (data.data.characteristics.siz.value + data.data.characteristics.con.value)/10);
		}

		if( data.data.attribs.mp.auto ){
			//TODO if any is null set max back to null.
			if( data.data.characteristics.pow.value != null) data.data.attribs.mp.max = Math.floor( data.data.characteristics.pow.value / 5);
			if( data.data.attribs.mp.value > data.data.attribs.mp.max) data.data.attribs.mp.value = data.data.attribs.mp.max;
		}

		if( data.data.attribs.hp.value == null && data.data.attribs.hp.max != null) data.data.attribs.hp.value = data.data.attribs.hp.max;
		if( data.data.attribs.mp.value == null && data.data.attribs.mp.max != null) data.data.attribs.mp.value = data.data.attribs.mp.max;

		if( data.data.attribs.san.value == null && data.data.characteristics.pow.value != null) data.data.attribs.san.value = data.data.characteristics.pow.value;

		return data;
		
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
			html.find('.toggle-switch').click( this._onToggle.bind(this));
			
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
				case "weapon":
					this.actor.createEmptyWeapon( ev);
					break;
			}
		});

		// Add or Remove Attribute
		//html.find(".attributes").on("click", ".attribute-control", this._onClickAttributeControl.bind(this));

		// Roll item/skill check
		html.find('.item .item-image').click(event => this._onItemRoll(event));
		html.find('.weapon-name.rollable').click( event => this._onWeaponRoll(event));
		// html.find('.weapon-damage').click( event => this._onWeaponDamage(event));
		html.find('.skill-image').click(this._onRollSkillTest.bind(this));
		html.find('.read-only').dblclick(this._toggleReadOnly.bind(this));

		// Item Dragging
		// TODO : a implémenter. Fait bugger quand on glisse une arme sur un autre perso. Cause : skills associé a l'arme de sont pas rentrés.
		//  let handler = ev => this._onDragItemStart(ev);
		//  html.find('li.item').each((i, li) => {
		//  	if ( li.classList.contains("inventory-header") ) return;
		//  	li.setAttribute("draggable", true);
		//  	li.addEventListener("dragstart", handler, false);
		//  });
	}
	
	async _onToggle( event){
		let weapon = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.itemId);
		if( weapon){
			weapon.toggleProperty(event.currentTarget.dataset.property);
		}
	}
	

	// roll the actor characteristic from formula when possible.
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
     
    async _updateObject(event, formData) {
		if( event.currentTarget){
			if( event.currentTarget.classList){

				if( event.currentTarget.classList.contains('npc-skill-score')){
					let skill = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.skillId);
					if( skill){
						await skill.update( {'data.value': event.currentTarget.value});
					}
				}

				if( event.currentTarget.classList.contains('skill-name') || event.currentTarget.classList.contains('item-name')){
					let item = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.skillId);
					if( item){
						await item.update( {'name': event.currentTarget.value});
					}
				}

				if( event.currentTarget.classList.contains('characteristic-formula')){
					//tester si c'est vide
					if( event.currentTarget.value.length != 0){
						//On teste si c'est une formule valide !
						let r = new Roll( event.currentTarget.value);
						r.roll();
						if( isNaN(r.total) || (typeof(r.total) == "undefined")){
							ui.notifications.error( event.currentTarget.value + " is not a valid formula");
							formData[event.currentTarget.name] = "invalid";
						}
					}
				}

				//le skill associé a l'arme a changé
				//TODO : Factorisation du switch
				//TODO : remplacer les strings par de constantes (item.skill.main ...)
				if( event.currentTarget.classList.contains('weapon-skill')){
					let weapon = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.itemId);
					let skill = this.actor.getOwnedItem( event.currentTarget.options[event.currentTarget.selectedIndex].value);
					if( weapon && skill){
						switch( event.currentTarget.dataset.skill){
							case "main":
								await weapon.update( {'data.skill.main.id': skill.id, 'data.skill.main.name': skill.name});
								break;
							case "alternativ":
								await weapon.update( {'data.skill.alternativ.id': skill.id, 'data.skill.alternativ.name': skill.name});
								break;
						}
					}
				}
				
				//Le nom de l'arme a changé
				if( event.currentTarget.classList.contains('weapon-name')){
					let weapon = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.itemId);
					if( weapon){
						await weapon.update( {'name': event.currentTarget.value});
					}
				}
				
				//les degats de l'arme on changés.
				//TODO : Factorisation du switch
				//TODO : remplacer les strings par de constantes (item.range.normal ...)
				if( event.currentTarget.classList.contains('weapon-damage')){
					let weapon = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.itemId);
					if( weapon){
						//teste la validité de la formule.
						if( event.currentTarget.value.length != 0){
							let r = new Roll( event.currentTarget.value);
							r.roll();
							if( isNaN(r.total) || (typeof(r.total) == "undefined")){
								ui.notifications.error( event.currentTarget.value + " is not a valid formula");
							}
							else
							{
								switch( event.currentTarget.dataset.range){
									case "normal":
										await weapon.update( {'data.range.normal.damage': event.currentTarget.value});
										break;
									case "long":
										await weapon.update( {'data.range.long.damage': event.currentTarget.value});
										break;
									case "extreme":
										await weapon.update( {'data.range.extreme.damage': event.currentTarget.value});
										break;
								}
							}
						}
						else  {
							switch( event.currentTarget.dataset.range){
								case "normal":
									await weapon.update( {'data.range.normal.damage': null});
									break;
								case "long":
									await weapon.update( {'data.range.long.damage': null});
									break;
								case "extreme":
									await weapon.update( {'data.range.extreme.damage': null});
									break;
							}
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
