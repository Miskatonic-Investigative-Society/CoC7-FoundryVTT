import { CoC7ActorSheet } from './base.js'


/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7CharacterSheet extends CoC7ActorSheet {
	constructor(...args) {
		super(...args);
	}

	/**
	 * Prepare data for rendering the Actor sheet
	 * The prepared data object contains both the actor data as well as additional sheet options
	*/
	getData() {
		const data = super.getData();

		data.itemsByType = {};
		data.skills = {};
		data.combatSkills = {};
		data.weapons = {};

		if( data.items){
			for (const item of data.items) {
				//si c'est une formule et qu'on peut l'evaluer
				//ce bloc devrait etre déplacé dans l'acteur
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
					data.weapons[weapon._id] = weapon;
				}
			}

			

			const token = this.actor.token;
			data.tokenId = token ? `${token.scene._id}.${token.id}` : null;

			for ( const characteristic of Object.values(data.data.characteristics)){
				if( !characteristic.value) characteristic.editable = true;
				characteristic.hard = Math.floor( characteristic.value / 2);
				characteristic.extreme = Math.floor( characteristic.value / 5);
			}
		}

		//data.actor.data.characteristics.app.value = data.actor.data.characteristics.app.value - 1;
		if( !data.data.attribs.mov.value) data.data.attribs.mov.value = "auto";

		const DEX = data.data.characteristics.dex.value;
		const STR = data.data.characteristics.str.value;
		const SIZ = data.data.characteristics.siz.value;

		if( data.data.attribs.mov.value == "auto")
		{
			if( DEX < SIZ && STR < SIZ) data.MOV = 	7;
			if( DEX >= SIZ || STR >= SIZ) data.MOV = 8;
			if( DEX >= SIZ && STR >= SIZ) data.MOV = 9;
			if( !isNaN(parseInt(data.data.infos.age))) data.MOV = parseInt(data.data.infos.age) >= 40? data.MOV - Math.floor( parseInt(data.data.infos.age) / 10) + 3: data.MOV;
		}
		else data.MOV = data.data.attribs.mov.value

		if( !data.data.attribs.db.value) data.data.attribs.mov.value = "auto";

		data.hasDBFormula = false;

		if( data.data.attribs.db.value == "auto")
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

		if( !data.data.attribs.build.value) data.data.attribs.mov.value = "auto";
		if( data.data.attribs.build.value == "auto")
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

		if( data.data.attribs.mp.max == -1 && data.data.characteristics.pow.value > 0) data.data.attribs.mp.max = Math.floor( data.data.characteristics.pow.value / 5);
		if( data.data.attribs.mp.value == -1) data.data.attribs.mp.value = data.data.attribs.mp.max;
		if( data.data.attribs.san.value == -1 && data.data.characteristics.pow.value > 0) data.data.attribs.san.value = data.data.characteristics.pow.value;
		if( data.data.attribs.hp.max == -1 && data.data.characteristics.siz.value > 0 && data.data.characteristics.con.value > 0) data.data.attribs.hp.max = Math.floor( (data.data.characteristics.siz.value + data.data.characteristics.con.value)/10);
		if( data.data.attribs.hp.value == -1) data.data.attribs.hp.value = data.data.attribs.hp.max;


		return data;
	}

	/* -------------------------------------------- */

  	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/
	   
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["coc7", "sheet", "actor", "character"],
			template: "systems/CoC7/templates/actors/character-sheet.html",
			width: 600,
			height: 600,
			tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills"}]
		});
	}
}
