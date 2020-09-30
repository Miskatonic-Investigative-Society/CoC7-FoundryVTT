import { COC7 } from '../config.js';
import { CoC7Check } from '../check.js';
import { CoC7ConCheck } from '../chat/concheck.js';
import { RollDialog } from '../apps/roll-dialog.js';
import { SkillSelectDialog } from '../apps/skill-selection-dialog.js';
import { CoC7MeleeInitiator } from '../chat/combat/melee-initiator.js';
import { CoC7RangeInitiator } from '../chat/rangecombat.js';
import { chatHelper } from '../chat/helper.js';
import { CoC7Dice } from '../dice.js';

/**
 * Extend the base Actor class to implement additional logic specialized for CoC 7th.
 */
export class CoCActor extends Actor {

	async initialize() {
		super.initialize();
		await this.creatureInit(); //TODO : move this in CoCActor.create(data, options)
	}

	/**
   * Early version on templates did not include possibility of auto calc
   * Just check if auto is indefined, in which case it will be set to true
   */
	checkUndefinedAuto(){
		let returnData = {};
		if( this.data.data.attribs.hp.auto === undefined) returnData['attribs.hp.auto'] = true;
		if( this.data.data.attribs.mp.auto === undefined) returnData['attribs.mp.auto'] = true;
		if( this.data.data.attribs.san.auto === undefined) returnData['attribs.san.auto'] = true;
		if( this.data.data.attribs.mov.auto === undefined) returnData['attribs.mov.auto'] = true;
		if( this.data.data.attribs.db.auto === undefined) returnData['attribs.db.auto'] = true;
		if( this.data.data.attribs.build.auto === undefined) returnData['attribs.build.auto'] = true;
    
		return returnData;
	}

	/**
	 * Called upon token creation from preCreateActor hook
	 * @param {*} createData 
	 */
	static async initToken(createData){
		//called upon token creation.active
		if( createData) {
			return;
		}
	}

	/**
	 * Called upon new actor creation.
	 * @param {*} data 
	 * @param {*} options 
	 */
	static async create(data, options) {
		// If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
		if (data.items)
		{
			return super.create(data, options);
		}
		return super.create(data, options);
	}
	
	/** @override */
	async createSkill( skillName, value, showSheet = false){
		const data = {  
			name: skillName,
			type: 'skill',
			data: { 
				'value': value,
				properties: {
					special: false,
					rarity: false,
					push: true,
					combat: false
				}
			}
		};
		const created = await this.createEmbeddedEntity('OwnedItem', data, { renderSheet: showSheet});
		return created;
	}

	/**
   * Initialize a creature with minimums skills
   */
	async creatureInit( ){
		if( this.data.type != 'creature') return;
		if( this.getActorFlag('initialized')) return; //Change to return skill ?

		//Check if fighting skills exists, if not create it and the associated attack.
		const skills = this.getSkillsByName( game.i18n.localize(COC7.creatureFightingSkill));
		if( skills.length == 0){
			//Creating natural attack skill
			try{
				const skill = await this.createEmbeddedEntity(
					'OwnedItem',
					{
						name: game.i18n.localize(COC7.creatureFightingSkill),
						type: 'skill',
						data:{
							base: 0,
							value: null,
							specialization: game.i18n.localize( COC7.fightingSpecializationName),
							properties: {
								combat: true,
								fighting: true,
								special: true
							},
							flags: {}
						}
					}, { renderSheet: false});
          
				const attack = await this.createEmbeddedEntity(
					'OwnedItem',
					{
						name: 'Innate attack',
						type: 'weapon',
						data: {
							description: {
								value: 'Creature\'s natural attack',
								chat: 'Creature\'s natural attack',
							},
							wpnType: 'innate',
							properties: {
								'addb': true,
								'slnt': true
							}
						}
					}, { renderSheet: false});


				const createdAttack = this.getOwnedItem( attack._id);
				await createdAttack.update( 
					{ 'data.skill.main.id': skill._id,
						'data.skill.main.name': skill.name });
			}
			catch(err){
				console.error('Creature init: ' + err.message);
			}

			// console.log( 'Skill created');
			await this.setActorFlag('initialized');
			//Creating corresponding weapon.
		}
	}

	async createItem( itemName, quantity = 1, showSheet = false){
		const data = {  
			name: itemName,
			type: 'item',
			data: { 
				'quantity': quantity
			}
		};
		const created = await this.createEmbeddedEntity('OwnedItem', data, { renderSheet: showSheet});
		return created;
	}

	async createEmptySkill( event = null){
		let showSheet = event ?  !event.shiftKey: true;
		if( !this.getItemIdByName(game.i18n.localize(COC7.newSkillName))) return this.createSkill( game.i18n.localize(COC7.newSkillName), null, showSheet);
		let index=0;
		let skillName = game.i18n.localize(COC7.newSkillName) + ' ' + index;
		while( this.getItemIdByName(skillName)){
			index++;
			skillName = game.i18n.localize(COC7.newSkillName)  + ' ' + index;
		}

		return this.createSkill( skillName, null, showSheet);
	}

	async createEmptyItem( event = null){
		let showSheet = event ?  !event.shiftKey: true;
		if( !this.getItemIdByName(game.i18n.localize(COC7.newItemName))) return this.createItem( game.i18n.localize(COC7.newItemName), 1, showSheet);
		let index=0;
		let itemName = game.i18n.localize(COC7.newItemName) + ' ' + index;
		while( this.getItemIdByName(itemName)){
			index++;
			itemName = game.i18n.localize(COC7.newItemName)  + ' ' + index;
		}

		return this.createItem( itemName, 1, showSheet);
	}

	async createEmptyWeapon( event = null){
		let showSheet = event ?  !event.shiftKey: true;
		let weaponName = game.i18n.localize(COC7.newWeaponName);
		if( this.getItemIdByName(game.i18n.localize(COC7.newWeaponName))) {
			let index=0;
			weaponName = game.i18n.localize(COC7.newWeaponName) + ' ' + index;
			while( this.getItemIdByName(weaponName)){
				index++;
				weaponName = game.i18n.localize(COC7.newWeaponName)  + ' ' + index;
			}
		}

		const data = {  
			name: weaponName,
			type: 'weapon',
			data : {
				properties: {}
			}
		};

		for( let [key] of Object.entries(COC7['weaponProperties']))
		{
			data.data.properties[key] = false;
		}
		await this.createEmbeddedEntity('OwnedItem', data, { renderSheet: showSheet});
	}

	async createBioSection(){
		const bio = this.data.data.biography ? duplicate( this.data.data.biography) : [];
		bio.push( {
			title : null,
			value : null
		});
		await this.update( { 'data.biography' : bio});
	}

	async updateBioValue( index, content){
		const bio = duplicate(this.data.data.biography);
		bio[index].value = content;
		await this.update( { 'data.biography' : bio});
	}
	
	async updateBioTitle( index, title){
		const bio = duplicate(this.data.data.biography);
		bio[index].title = title;
		await this.update( { 'data.biography' : bio});
	}

	async deleteBioSection( index){
		const bio = duplicate(this.data.data.biography);
		bio.splice( index, 1);
		await this.update( { 'data.biography' : bio});
	}

	async moveBioSectionUp( index){
		if( index === 0) return;
		const bio = duplicate(this.data.data.biography);
		if( index >= bio.length) return;
		const elem = bio.splice( index, 1)[0];
		bio.splice( index - 1, 0, elem);
		await this.update( { 'data.biography' : bio});
	}

	async moveBioSectionDown( index){
		const bio = duplicate(this.data.data.biography);
		if( index >= bio.length - 1) return;
		const elem = bio.splice( index, 1)[0];
		bio.splice( index + 1, 0, elem);
		await this.update( { 'data.biography' : bio});
	}

	async updateTextArea( textArea){
		const name = 'data.' + textArea.dataset.areaName;
		await this.update( {[name]: textArea.value});		
	}
  

	/**
   * Create an item for that actor.
   * If it's a skill first check if the skill is already owned. If it is don't create a second time.
   * Fill the value of the skill with base or try to evaluate the formula.
   * @param {*} embeddedName 
   * @param {*} data 
   * @param {*} options 
   */
	async createEmbeddedEntity(embeddedName, data, options){
		switch( data.type){
		case( 'skill'):
			if( 'character' != this.data.type){ //If not a PC set skill value to base
				if( this.getItemIdByName(data.name)) return; //If skill with this name exist return

				if( data.data.base){
					if( data.data.base != data.data.value) {
						data.data.value = data.data.base;
					}
				}

				if( isNaN(Number(data.data.value)) ) {
					let value;
					try{
						value = eval(this.parseFormula( data.data.value));
					}
					catch(err){
						value = null;
					}
					if( value) data.data.value = Math.floor(value);
				}
			} else data.data.value = null;
			return await super.createEmbeddedEntity(embeddedName, data, options);
		case( 'occupation'):
			if( 'character' == this.data.type){ //Occupation only for PCs
				ui.notifications.warn('Adding an occupation is not yet implemented');

				//Add main skills
				await this.addSkills( data.data.skills, 'occupation');

				//Add optional skills
				for (let index = 0; index < data.data.groups.length; index++) {
					const dialogData = {};
					dialogData.skills = [];
					dialogData.type = 'occupation';
					dialogData.actorId = this.id;
					dialogData.options = Number(data.data.groups[index].options);
					dialogData.title = game.i18n.localize('CoC7.SkillSelectionWindow');

					//Select only skills that are not present or are not flagged as occupation.
					data.data.groups[index].skills.forEach( value => {
						const skill = this.items.find( item => { return (item.name == value.name && 'skill' == item.type);});
						if( !skill || !skill.data.data.flags?.occupation){
							dialogData.skills.push( value);
						}
					});

					//if there's none, do nothing.
					if( 0 != dialogData.skills.length){
						if( dialogData.skills.length <= dialogData.options){
							//If there's is less skill than options, add them all.
							ui.notifications.info( `There's only ${dialogData.skills.length} and ${dialogData.options} options, adding all of them`);
							await this.addSkills( dialogData.skills, 'occupation');
						} else {
							//Wait for skill selection.
							await SkillSelectDialog.create( dialogData);
						}
					} else ui.notifications.info( 'All skills are already selected.');
				}


				//Add extra skills
				if( Number(data.data.personal)){
					const dialogData = {};
					dialogData.skills = [];
					dialogData.type = 'occupation';
					dialogData.actorId = this.id;
					dialogData.options = Number(data.data.personal);
					dialogData.title = game.i18n.format('CoC7.SelectPersonalSkills', { number: Number(data.data.personal)});

					//Select only skills that are not present or are not flagged as occupation.
					this.skills.forEach( s => {
						if( !s.data.data.flags.occupation && !s.data.data.properties.noadjustments && !s.data.data.properties.noxpgain) dialogData.skills.push( s.data);
					});

					//if there's none, do nothing.
					if( 0 != dialogData.skills.length){
						if( dialogData.skills.length <= dialogData.options){
						//If there's is less skill than options, add them all.
							ui.notifications.info( `There's only ${dialogData.skills.length} and ${dialogData.options} options, adding all of them`);
							await this.addSkills( dialogData.skills, 'occupation');
						} else {
						//Wait for skill selection.
							await SkillSelectDialog.create( dialogData);
						}
					} else ui.notifications.info( 'All skills are already selected.');
				}
				ui.notifications.info( 'Job\'s done');
			}
			break;

		default:
			return await super.createEmbeddedEntity(embeddedName, data, options);
		}
	}

	// getSkillIdByName( skillName){
	//   let id = null;
	//    this.items.forEach( (value, key, map) => {
	//     if( value.name == skillName) id = value.id;
	//   });

	//   return id;
	// }

	getItemIdByName( itemName){
		let id = null;
		this.items.forEach( (value) => {
			if( value.name == itemName) id = value.id;
		});

		return id;
	}

	getItemsByName( itemName){
		let itemList = [];
		this.items.forEach( (value) => {
			if( value.name == itemName) itemList.push( value);
		});

		return itemList;
	}

	/**
   * 
   * 
   */
	getSkillsByName( skillName){
		let skillList = [];
		this.items.forEach( (value) => {
			if( value.name == skillName && value.type == 'skill') skillList.push( value);
		});
		return skillList;
	}


	parseFormula( formula){
		let parsedFormula = formula;
		for( let [key, value] of Object.entries(COC7.formula.actor)){
			parsedFormula = parsedFormula.replace( key, value);
		}
		return parsedFormula;
	}

	get luck(){
		return parseInt(this.data.data.attribs.lck.value);
	}

	async setLuck( value){
		return await this.update( { 'data.attribs.lck.value': value});
	}

	async spendLuck( amount){
		amount = parseInt( amount);
		if( !(this.luck >= amount)) return false;
		return this.setLuck( this.luck - amount);
	}

	get hp(){
		return parseInt(this.data.data.attribs.hp.value);
	}

	get hpMax(){
		if( this.data.data.attribs.hp.auto){
			if(this.data.data.characteristics.siz.value != null &&  this.data.data.characteristics.con.value !=null){
				const maxHP = Math.floor( (this.data.data.characteristics.siz.value + this.data.data.characteristics.con.value)/10);
				return game.settings.get('CoC7', 'pulpRules')? maxHP*2:maxHP;
			}
			else return null;
		} 
		return parseInt( this.data.data.attribs.hp.max);
	}

	async setHp( value){
		if( value < 0) value = 0;
		if( value > this.hpMax) value = parseInt( this.hpMax);
		return await this.update( { 'data.attribs.hp.value': value});
	}

	async addSkills( skillList, flag = null){
		for( let skill of skillList){
			const itemId = this.getItemIdByName(skill.name);
			if( !itemId){
				if( flag){
					skill.data.flags = {};
					skill.data.flags[flag] = true;
				}
				await this.createOwnedItem( skill, {renderSheet:false});
			}else if( flag){
				const item = this.getOwnedItem( itemId);
				await item.setItemFlag( flag);
			}
		}
	}

	async addSkill( skill, flag = null){
		const itemId = this.getItemIdByName(skill.name);
		if( !itemId){
			if( flag){
				skill.data.flags = {};
				skill.data.flags[flag] = true;
			}
			await this.createOwnedItem( skill, {renderSheet:false});
		}else if( flag){
			const item = this.getOwnedItem( itemId);
			await item.setItemFlag( flag);
		}
	}


	get mpMax(){
		if( this.data.data.attribs.mp.auto){
			if(this.data.data.characteristics.pow.value != null)
				return Math.floor( this.data.data.characteristics.pow.value / 5);
			else return null;
		} 
		return parseInt( this.data.data.attribs.mp.max);
	}

	get mp(){
		return parseInt(this.data.data.attribs.mp.value);
	}

	async setMp( value){
		if( value < 0) value = 0;
		if( value > parseInt( this.mpMax)) value = parseInt( this.mpMax);
		return await this.update( { 'data.attribs.mp.value': value});
	}

	get san(){
		return parseInt(this.data.data.attribs.san.value);
	}

	get occupationPoints(){
		let occupationPoints = 0;
		for( let skill of this.skills){
			if( skill.data.data.adjustments?.occupation){
				occupationPoints += skill.data.data.adjustments.occupation;
			}
		}
		return occupationPoints;
	}

	get archetypePoints(){
		let archetypePoints = 0;
		for( let skill of this.skills){
			if( skill.data.data.adjustments?.archetype){
				archetypePoints += skill.data.data.adjustments.archetype;
			}
		}
		return archetypePoints;
	}

	get experiencePoints(){
		let experiencePoints = 0;
		for( let skill of this.skills){
			if( skill.data.data.adjustments?.experience){
				experiencePoints += skill.data.data.adjustments.experience;
			}
		}
		return experiencePoints;
	}

	get personalPoints(){
		let personalPoints = 0;
		for( let skill of this.skills){
			if( skill.data.data.adjustments?.personal){
				personalPoints += skill.data.data.adjustments.personal;
			}
		}
		return personalPoints;
	}

	get hasSkillFlaggedForExp(){
		for( let skill of this.skills){
			if( skill.data.data.flags?.developement) return true;
		}
		return false;
	}

	async setSan( value){
		if( value < 0) value = 0;
		if( value > parseInt( this.data.data.attribs.san.max)) value = parseInt( this.data.data.attribs.san.value);
		const loss = parseInt( this.data.data.attribs.san.value) - value;
		if( loss > 0){
			let totalLoss = parseInt( this.data.data.attribs.san.dailyLoss) ? parseInt( this.data.data.attribs.san.dailyLoss) : 0;
			totalLoss = totalLoss + loss;
			if( loss >= 5) this.setStatus( COC7.status.tempoInsane);
			if( totalLoss >= Math.floor( this.san/5) ) this.setStatus( COC7.status.indefInsane);
			return await this.update( { 
				'data.attribs.san.value': value,
				'data.attribs.san.dailyLoss': totalLoss});
		}
		else return await this.update( { 'data.attribs.san.value': value});
	}


	async setAttribAuto( value, attrib){
		const updatedKey = `data.attribs.${attrib}.auto`;
		return await this.update( {[updatedKey]: value});
	}

	async toggleAttribAuto( attrib){
		this.setAttribAuto( !this.data.data.attribs[attrib].auto, attrib);
	}

	get build() {
		if( this.data.data.attribs.build.value == 'auto') this.data.data.attribs.build.auto = true;
		if( this.data.data.attribs.build.auto)
		{
			const sum = this.data.data.characteristics.str.value + this.data.data.characteristics.siz.value;
			if( sum > 164) return Math.floor( (sum - 45) / 80) + 1;
			if( sum < 65) return -2;
			if( sum < 85) return -1;
			if( sum < 125) return 0;
			if( sum < 165) return 1;
		}

		return this.data.data.attribs.build.value;
	}

	get db() {
		if( this.data.data.attribs.db.value == 'auto') this.data.data.attribs.db.auto = true;
		if( this.data.data.attribs.db.auto)
		{
			const sum = this.data.data.characteristics.str.value + this.data.data.characteristics.siz.value;
			if( sum > 164) return `${Math.floor( (sum - 45) / 80)}D6`;
			if( sum  < 65) return -2;
			if( sum < 85) return -1;
			if( sum < 125) return 0;
			if( sum < 165) return '1D4';
		}
		return this.data.data.attribs.db.value;
	}

	get mov() {
		if( this.data.data.attribs.mov.value == 'auto') this.data.data.attribs.mov.auto = true;
		if( this.data.data.attribs.mov.auto)
		{
			let MOV;
			if( this.data.data.characteristics.dex.value < this.data.data.characteristics.siz.value && this.data.data.characteristics.str.value < this.data.data.characteristics.siz.value) MOV = 7;
			if( this.data.data.characteristics.dex.value >= this.data.data.characteristics.siz.value || this.data.data.characteristics.str.value >= this.data.data.characteristics.siz.value) MOV = 8;
			if( this.data.data.characteristics.dex.value > this.data.data.characteristics.siz.value && this.data.data.characteristics.str.value > this.data.data.characteristics.siz.value) MOV = 9; // Bug correction by AdmiralNyar.
			if( this.data.data.type != 'creature'){
				if( !isNaN(parseInt(this.data.data.infos.age))) MOV = parseInt(this.data.data.infos.age) >= 40? MOV - Math.floor( parseInt(this.data.data.infos.age) / 10) + 3: MOV;
			}
			return MOV;
		}
		return this.data.data.attribs.mov.value;
	}


	get tokenId() //TODO clarifier ca et tokenkey
	{
		return this.token ? `${this.token.scene._id}.${this.token.id}` : null;
	}

	get locked(){
		if( !this.data.data.flags){
			this.data.data.flags = {};
			this.data.data.flags.locked = true; //Locked by default
			this.update( { 'data.flags': {}});
			this.update( { 'data.flags.locked': false});
		}

		return this.data.data.flags.locked;
	}

	set locked( value){
		this.update( { 'data.flags.locked': value});
	}

	async toggleActorFlag( flagName){
		const flagValue =  this.data.data.flags[flagName] ? false: true;
		const name = `data.flags.${flagName}`;
		await this.update( { [name]: flagValue});
	}

	async skillCheck( skillName, fastForward){
		const skill = this.getSkillsByName(skillName);
		if( !skill.length ) {
			ui.notifications.warn(`No skill ${skillName} found for actor ${this.name}`);
			return;
		}

		let check = new CoC7Check();

		if( !fastForward) {
			const usage = await RollDialog.create();
			if( usage) {
				check.diceModifier = usage.get('bonusDice');
				check.difficulty = usage.get('difficulty');
			}
		}

		check.actor = this.id;
		check.skill = skill[0].id;
		check.roll();
		check.toMessage();
	}

	async weaponCheck( weaponData, event){
		event.preventDefault();
		const itemId = weaponData.id;
		const fastForward = event.shiftKey;
		let weapon;
		weapon = this.getOwnedItem(itemId);
		if( !weapon){
			const weapons = this.items.filter(i => i.name === weaponData.name);
			if( 0 == weapons.length){
				ui.notifications.warn(`Actor ${this.name} has no weapon named ${weaponData.name}`);
				return;
			} else if( 1 < weapons.length) {
				ui.notifications.warn(`Actor ${this.name} has more than one weapon named ${weaponData.name}. The first found will be used`);
			}
			weapon = weapons[0];
		}

		const actorKey = !this.isToken? this.actorKey : `${this.token.scene._id}.${this.token.data._id}`;
		if( !weapon.data.data.properties.rngd){
			if( game.user.targets.size > 1){
				ui.notifications.warn('Too many target selected. The last selected target will be attacked');
			}

			const card = new CoC7MeleeInitiator( actorKey, itemId, fastForward);
			card.createChatCard();
		}
		if( weapon.data.data.properties.rngd){
			const card = new CoC7RangeInitiator( actorKey, itemId, fastForward);
			card.createChatCard();
		}
	}

	rollInitiative( hasGun = false){
		switch (game.settings.get('CoC7', 'initiativeRule')) {
		case 'optional':{
			const roll = new CoC7Check( this.actorKey);
			roll.denyPush = true;
			roll.denyLuck = true;
			roll.denyBlindTampering = true;
			roll.hideDice = game.settings.get('CoC7', 'displayInitDices') === false;
			roll.flavor = 'Initiative roll';
			roll.rollCharacteristic('dex', hasGun?1:0);
			roll.toMessage();
			return roll.successLevel + this.data.data.characteristics.dex.value / 100;
		}
			
		default: return hasGun? this.data.data.characteristics.dex.value + 50: this.data.data.characteristics.dex.value;
		}
	}



	getActorFlag( flagName){
		if( !this.data.data.flags){
			this.data.data.flags = {};
			this.data.data.flags.locked = true;
			this.update( { 'data.flags': {}});
			return false;
		}

		if( !this.data.data.flags[flagName]) return false;
		return this.data.data.flags[flagName];
	}

	async setActorFlag( flagName){
		await this.update( {[`data.flags.${flagName}`]: true});
	}

	async unsetActorFlag( flagName){
		await this.update( {[`data.flags.${flagName}`]: false});
	}

	getWeaponSkills( itemId){
		const weapon = this.getOwnedItem( itemId);
		if( 'weapon' != weapon.data.type) return null;
		const skills = [];
		if( weapon.data.data.skill.main.id){
			skills.push( this.getOwnedItem( weapon.data.data.skill.main.id));
		}

		if( weapon.data.data.skill.alternativ.id){
			skills.push( this.getOwnedItem( weapon.data.data.skill.alternativ.id));
		}

		return skills;
	}

	get tokenKey() //Clarifier ca et tokenid
	{
		//Case 1: the actor is a synthetic actor and has a token, return token key.
		if( this.isToken) return `${this.token.scene.id}.${this.token.id}`;

		//Case 2: the actor is not a token (linked actor). If the sheet have an associated token return the token key.
		if( this.sheet.token) return `${this.sheet.token.scene.id}.${this.sheet.token.id}`;

		//Case 3: Actor has no token return his ID;
		return this.id;
	}
  
	get actorKey(){
		return this.tokenKey;
	}

	static getActorFromKey(key) {

		// Case 1 - a synthetic actor from a Token
		if (key.includes('.')) {
			const [sceneId, tokenId] = key.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			return token.actor;
		}

		// Case 2 - use Actor ID directory
		return game.actors.get(key) || null;
	}

	/**
   * Use the formula if available to roll some characteritics.
   */
	async rollCharacteristicsValue(){
		let characteristics={};
		for (let [key, value] of Object.entries(this.data.data.characteristics)) {
			if( value.formula && !value.formula.startsWith('@')){
				let r = new Roll( value.formula);
				r.roll();
				if( r.total){
					characteristics[`data.characteristics.${key}.value`] = r.total;
				}
			}
		}

		await this.update( characteristics);
		await this.reportCharactedriticsValue();
	}

	/**
	 * If there is a formula, will set the characteristic to the average value ,if divisible by 5, or the closest 10.
	 */
	async averageCharacteristicsValue(){
		let characteristics={};
		for (let [key, value] of Object.entries(this.data.data.characteristics)) {
			if( value.formula && !value.formula.startsWith('@')){
				const max = Roll.maximize( value.formula).total;
				const min = Roll.minimize( value.formula).total;
				const average = Math.floor((max + min) / 2);
				const charValue = average % 5 === 0 ? average : Math.round(average / 10) * 10;
				if( charValue){
					characteristics[`data.characteristics.${key}.value`] = charValue;
				}
			}
		}

		await this.update( characteristics);
		await this.reportCharactedriticsValue();
	}

	/**
	 * Test if a characterisitc formula is a reference to an other characteristic and set it accordingly.
	 */
	async reportCharactedriticsValue(){
		let characteristics={};
		for (let [key, value] of Object.entries(this.data.data.characteristics)) {
			if( value.formula && value.formula.startsWith('@')){
				let charValue;
				try{
					charValue = eval(this.parseFormula( value.formula));
				}
				catch(err){
					charValue = null;
				}
				if( charValue){
					characteristics[`data.characteristics.${key}.value`] = charValue;
				}
			}
		}

		await this.update( characteristics);
	}

	async setCharacteristic( name, value){
		let characteristic={};
		let charValue = isNaN(parseInt(value)) ? null : parseInt(value);
		characteristic[name] = charValue;
		if( !charValue){
			if( value.startsWith('@')){
				const formula = name.replace( '.value', '.formula');
				characteristic[formula] = value;
			}
		}

		await this.update( characteristic);
		await this.reportCharactedriticsValue();
	}

	async developementPhase( fastForward = false){
		const failure = [];
		const success = [];
		const title = 'Rolling all skills for development';
		let message = '<p class="chat-card">';
		for (let item of this.items){
			if( 'skill' === item.type){
				if( item.developementFlag){
					const die = new Die(100);
					die.roll(1);
					let skillValue = item.value;
					let augment = null;
					if( die.total > skillValue || die.total >= 95)
					{
						success.push(item._id);
						const augmentDie = new Die(10);
						augmentDie.roll();
						augment += augmentDie.total;
						message += `<span class="upgrade-success">${item.name} upgraded  (${die.total}/${item.value}%) by ${augmentDie.total}%</span><br>`;
						await item.increaseExperience( augment);
					}else{
						message += `<span class="upgrade-failed">${item.name} NOT upgraded (${die.total}/${item.value}%)</span><br>`;
						failure.push(item._id);
					}
					await item.unflagForDevelopement();
				}
			}
		}
		if( !fastForward){
			message += '</p>';
			const speaker = { actor: this.actor};
			await chatHelper.createMessage( title, message, speaker);
		}
		return( {failure : failure, success: success});
	}

	async developSkill( skillId, fastForward = false){
		const skill = this.getOwnedItem( skillId);
		if( !skill) return;
		let title = '';
		let message = '';
		const upgradeRoll = new Roll('1D100');
		upgradeRoll.roll();
		if( !fastForward) await CoC7Dice.showRollDice3d(upgradeRoll);
		if( upgradeRoll.total > skill.value || upgradeRoll.total >= 95)
		{
			const augmentRoll = new Roll('1D10');
			augmentRoll.roll();
			if( !fastForward) await CoC7Dice.showRollDice3d(augmentRoll);
			await skill.increaseExperience( augmentRoll.total);
			title = `${skill.name} upgraded`;
			message = `Roll : ${upgradeRoll.total} VS ${skill.value}%.<br>Skill ${skill.name} gained ${augmentRoll.total}%.`;
		} else {
			title = `${skill.name} NOT upgraded`;
			message = `Roll : ${upgradeRoll.total} VS ${skill.value}%.<br>Skill ${skill.name} didn't gain any XP.`;
		}
		const speaker = { actor: this._id};
		await chatHelper.createMessage( title, message, speaker);
		await skill.unflagForDevelopement();
	}

	async toggleStatus(statusName){
		let statusValue = this.data.data.status[statusName]?.value;
		if(!(typeof statusValue === 'boolean')) statusValue = statusValue === 'false' ? true : false; //Necessary, incorrect template initialization

		if( COC7.status.criticalWounds == statusName){
			if( statusValue) this.cureMajorWound(); else this.inflictMajorWound();
			return;
		}

		await this.update( {[`data.status.${statusName}.value`]: !statusValue});
		// if( !statusValue) await this.setFlag('CoC7', statusName, true);
		// else await this.unsetFlag('CoC7', statusName);

	}

	getStatus(statusName){
		let statusValue = this.data.data.status[statusName]?.value;
		if( undefined === statusValue) return false;
		if(!(typeof statusValue === 'boolean')) statusValue = statusValue === 'false' ? true : false; //Necessary, incorrect template initialization
		return statusValue;
	}

	async setStatus(statusName){
		await this.update( {[`data.status.${statusName}.value`]: true});
	}

	async unsetStatus( statusName){
		await this.update( {[`data.status.${statusName}.value`]: false});
	}

	async resetCounter( counter){
		await this.update( {[counter]: 0});
	}

	get fightingSkills(){
		let skillList = [];
		this.items.forEach( (value) => {
			if( value.type == 'skill' && value.data.data.properties.fighting ) skillList.push( value);
		});

		skillList.sort( (a, b) => {
			if ( a.name.toLowerCase() < b.name.toLowerCase() ){
				return -1;
			}
			if ( a.name.toLowerCase() > b.name.toLowerCase() ){
				return 1;
			}
			return 0;
		});

		return skillList;
	}

	get closeCombatWeapons(){
		let weaponList = [];
		this.items.forEach( (value) => {
			if( value.type == 'weapon' && !value.data.data.properties.rngd ){
				const skill = this.getOwnedItem( value.data.data.skill.main.id);
				value.data.data.skill.main.value = skill? skill.value : 0;
				weaponList.push( value);
			}
		});

		weaponList.sort( (a, b) => {
			if ( a.name.toLowerCase() < b.name.toLowerCase() ){
				return -1;
			}
			if ( a.name.toLowerCase() > b.name.toLowerCase() ){
				return 1;
			}
			return 0;
		});

		return weaponList;
	}

	get firearmSkills(){
		let skillList = [];
		this.items.forEach( (value) => {
			if( value.type == 'skill' && value.data.data.properties.firearms ) skillList.push( value);
		});

		skillList.sort( (a, b) => {
			if ( a.name.toLowerCase() < b.name.toLowerCase() ){
				return -1;
			}
			if ( a.name.toLowerCase() > b.name.toLowerCase() ){
				return 1;
			}
			return 0;
		});

		return skillList;
	}

	get user(){
		//is that actor impersonanted by a user ?
		return game.users.find( user  => {
			if( user.character ){
				if( user.character.id == this.id) return true;
			}
			return false;
		});
	}

	get dodgeSkill(){
		let skillList = this.getSkillsByName( game.i18n.localize(COC7.dodgeSkillName));
		if( skillList.length != 0) return skillList[0];
		return null;
	}

	get creditRatingSkill(){
		let skillList = this.getSkillsByName( game.i18n.localize(COC7.creditRatingSkillName));
		if( skillList.length != 0) return skillList[0];
		return null;
	}

	get creditRating(){
		const CR = this.creditRatingSkill;
		if( CR) return parseInt(CR.data.data.value);
		return 0;
	}

	get spendingLevel(){
		const CR = this.creditRating;
		if( CR >= 99 ) return 5000;
		if( CR >= 90 ) return 250;
		if( CR >= 50 ) return 50;
		if( CR >= 10 ) return 10;
		if( CR >= 1  ) return 2;
		return 0.5;
	}

	get cash(){
		const CR = this.creditRating;
		if( CR >= 99 ) return 50000;
		if( CR >= 90 ) return CR * 20;
		if( CR >= 50 ) return CR * 5;
		if( CR >= 10 ) return CR * 2;
		if( CR >= 1  ) return CR;
		return 0.5;
	}

	get assets(){
		const CR = this.creditRating;
		if( CR >= 99 ) return 5000000;
		if( CR >= 90 ) return CR * 2000;
		if( CR >= 50 ) return CR * 500;
		if( CR >= 10 ) return CR * 50;
		if( CR >= 1  ) return CR * 10;
		return 0;
	}

	get skills(){
		let skillList = [];
		this.items.forEach( (value) => {
			if( value.type == 'skill' ) skillList.push( value);
		});

		skillList.sort( (a, b) => {
			if ( a.name.toLowerCase() < b.name.toLowerCase() ){
				return -1;
			}
			if ( a.name.toLowerCase() > b.name.toLowerCase() ){
				return 1;
			}
			return 0;
		});

		return skillList;
	}

	async dealDamage(amount, ignoreArmor = false){
		let total = parseInt(amount);
		if( this.data.data.attribs.armor.value && !ignoreArmor ) total = total - this.data.data.attribs.armor.value;
		if( total <= 0) return;
		await this.setHp( this.hp - total);
		if( total >= this.hpMax) this.fallDead();
		else{
			if( total >= Math.floor(this.hpMax/2)) this.inflictMajorWound();
			if( this.hp == 0){
				if( !this.getStatus(COC7.status.unconscious)) await this.fallUnconscious();
				if( this.majorWound) this.fallDying();
			}
		}
	}

	async inflictMajorWound(){
		if( !this.majorWound) await this.setStatus(COC7.status.criticalWounds);
		await this.fallProne();
		if( !this.getStatus(COC7.status.unconscious)){
			const conCheck = new CoC7ConCheck( this.isToken? this.tokenKey : this._id);
			conCheck.toMessage();
		}
		// await this.setFlag('CoC7', COC7.status.criticalWounds, true);
	}

	async cureMajorWound(){
		await this.unsetStatus(COC7.status.criticalWounds);
		// await this.unsetFlag('CoC7', COC7.status.criticalWounds);
	}

	async fallProne(){
		await this.setStatus(COC7.status.prone);
		
		// await this.setFlag('CoC7', COC7.status.prone, true);
	}

	async fallUnconscious(){
		await this.setStatus( COC7.status.unconscious);
		// await this.setFlag('CoC7', COC7.status.unconscious, true);
	}

	async fallDying(){
		await this.setStatus( COC7.status.dying);
	}

	async fallDead(){
		await this.setStatus(COC7.status.criticalWounds);
		await this.unsetStatus( COC7.status.dying);
		await this.fallProne();
		await this.fallUnconscious();
		await this.setStatus( COC7.status.dead);
		// await this.setFlag( 'CoC7', 'dead', true);
	}

	get majorWound(){
		return this.getStatus(COC7.status.criticalWounds);
	}

	get dying(){
		return this.getStatus(COC7.status.dying);
	}

	get unconscious(){
		return this.getStatus(COC7.status.unconscious);
	}

	get dead(){
		return this.getStatus(COC7.status.dead);
	}

	static updateActor( actor, dataUpdate){
		if( game.user.isGM){
			// ui.notifications.info( `updating actor ${actor.name}`);
			const prone = dataUpdate?.flags?.CoC7[COC7.status.prone];
			const unconscious = dataUpdate?.flags?.CoC7[COC7.status.unconscious];
			const criticalWounds = dataUpdate?.flags?.CoC7[COC7.status.criticalWounds];
			const dying = dataUpdate?.flags?.CoC7[COC7.status.dying];
			if( prone) ui.notifications.info( `${actor.name} fall prone`);
			if( unconscious) ui.notifications.info( `${actor.name} fall unconscious`);
			if( criticalWounds) ui.notifications.info( `${actor.name} get a major wound`);
			if( dying) ui.notifications.info( `${actor.name} is dying`);
		}
		return;
	}

	static updateToken( scene, token, dataUpdate){
		const injuried = dataUpdate?.actorData?.flags?.CoC7?.injuried;
		if( injuried) ui.notifications.info( `actor ${token.name} is injuried !!`);
		return;
	}
}