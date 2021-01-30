import { COC7 } from '../config.js';
import { CoC7Check } from '../check.js';
import { CoC7ConCheck } from '../chat/concheck.js';
import { RollDialog } from '../apps/roll-dialog.js';
import { SkillSelectDialog } from '../apps/skill-selection-dialog.js';
import { PointSelectDialog } from '../apps/point-selection-dialog.js';
import { CharacSelectDialog } from '../apps/char-selection-dialog.js';
import { CharacRollDialog } from '../apps/char-roll-dialog.js';
import { SkillSpecSelectDialog } from '../apps/skill-spec-select-dialog.js';
import { SkillValueDialog } from '../apps/skill-value-dialog.js';
import { CoC7MeleeInitiator } from '../chat/combat/melee-initiator.js';
import { CoC7RangeInitiator } from '../chat/rangecombat.js';
import { chatHelper } from '../chat/helper.js';
import { CoC7Dice } from '../dice.js';
import { CoC7Item } from '../items/item.js';
import { CoC7Utilities } from '../utilities.js';

/**
 * Extend the base Actor class to implement additional logic specialized for CoC 7th.
 */
export class CoCActor extends Actor {

	async initialize() {
		super.initialize();
		await this.creatureInit(); //TODO : move this in CoCActor.create(data, options)
	}

	// ********************** Testing
	// async update(data, options={}) {
	// 	ui.notifications.info('return super.update(data, options);');
	// 	ui.notifications.info(`int : ${this.characteristics.int}`);
	// 	this.characteristics.int = 15;
	// 	ui.notifications.info(`modified int : ${this.characteristics.int}`);
	// 	return super.update(data, options);
	// }


	// get characteristics(){
	// 	const actor = this;
	// 	return {
	// 		get int(){
	// 			return actor.getProp('_int');
	// 		},

	// 		set int(x){
	// 			actor.setProp('_int', x);
	// 		}
	// 	};
	// }

	// setProp(key, x){
	// 	this[key] = x;
	// }

	// getProp(key){
	// 	return this[key]||0;
	// }
	// gnitseT **********************


	/**
   * Early version on templates did not include possibility of auto calc
   * Just check if auto is indefined, in which case it will be set to true
   */
	checkUndefinedAuto(){
		let returnData = {
			attribs:{
				hp:{},
				mp:{},
				san:{},
				mov:{},
				db:{},
				build:{}
			}
		};
		if( this.data.data.attribs?.hp?.auto === undefined) returnData.attribs.hp.auto = true;
		if( this.data.data.attribs?.mp?.auto === undefined) returnData.attribs.mp.auto = true;
		if( this.data.data.attribs?.san?.auto === undefined) returnData.attribs.san.auto = true;
		if( this.data.data.attribs?.mov?.auto === undefined) returnData.attribs.mov.auto = true;
		if( this.data.data.attribs?.db?.auto === undefined) returnData.attribs.db.auto = true;
		if( this.data.data.attribs?.build?.auto === undefined) returnData.attribs.build.auto = true;
    
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

	get boutOfMadness(){
		return this.effects.find( e => e.data.label == game.i18n.localize( 'CoC7.BoutOfMadnessName'));
	}
	
	get insanity(){
		return this.effects.find( e => e.data.label == game.i18n.localize( 'CoC7.InsanityName'));
	}

	get isInABoutOfMadness(){
		if( !this.boutOfMadness) return false;
		return !this.boutOfMadness.data.disabled;
	}
	
	get isInsane(){
		if( !this.insanity) return false;
		return !this.insanity.data.disabled;
	}

	get sanity(){
		let boutRealTime = this.boutOfMadness?.data.flags?.CoC7?.realTime? true: false;
		let duration = boutRealTime? this.boutOfMadness?.data?.duration?.rounds: this.boutOfMadness?.data?.duration.seconds;
		if( !boutRealTime && duration) duration = Math.round( duration/3600);
		let indefiniteInstanity = this.insanity?.data.flags?.CoC7.indefinite? true: false;
		let insaneDuration = indefiniteInstanity? null: this.insanity?.data?.duration.seconds;
		if( !indefiniteInstanity && insaneDuration) insaneDuration = insaneDuration/3600;
		let boutDurationText = this.isInABoutOfMadness?boutRealTime?`${duration} ${game.i18n.localize('CoC7.rounds')}`:`${duration} ${game.i18n.localize('CoC7.hours')}`:null;
		const insanityDurationText = insaneDuration?this.isInsane?indefiniteInstanity?null:`${insaneDuration} ${game.i18n.localize('CoC7.hours')}`:null:null;
		if( this.isInsane && !insanityDurationText && !indefiniteInstanity) indefiniteInstanity = true;
		if( !duration) boutDurationText = '';


		return {
			boutOfMadness: {
				active : this.isInABoutOfMadness,
				realTime: this.isInABoutOfMadness?boutRealTime:undefined,
				summary: this.isInABoutOfMadness?!boutRealTime:undefined,
				duration: this.isInABoutOfMadness?duration:undefined,
				durationText: boutDurationText?boutDurationText:'',
				hint: 
					this.isInABoutOfMadness?
						`${game.i18n.localize('CoC7.BoutOfMadness')}${boutDurationText?': ' +boutDurationText:''}`:
						game.i18n.localize('CoC7.BoutOfMadness')
			},
			underlying:{
				active: this.isInsane,
				indefintie: this.isInsane?indefiniteInstanity:undefined,
				duration: insaneDuration,
				durationText: insanityDurationText?insanityDurationText:'',
				hint: 
					this.isInsane?
						indefiniteInstanity?
							game.i18n.localize('CoC7.IndefiniteInsanity'):
							`${game.i18n.localize('CoC7.TemporaryInsanity')} ${insanityDurationText?insanityDurationText:''}`
						:''
			}
		};
	}

	async enterBoutOfMadness( realTime = true, duration = 1){
		// const duration = {rounds: 1,
		// 	seconds: 17,
		// 	startRound: 3,
		// 	startTime: 58,
		// 	startTurn: 4,
		// 	turns: 2};
		// await this.boutOfMadness?.setFlag( 'CoC7', 'madness', true);

		let result = null;
		const boutOfMadnessTableId = realTime? game.settings.get( 'CoC7', 'boutOfMadnessRealTimeTable') :game.settings.get( 'CoC7', 'boutOfMadnessSummaryTable');
		if( boutOfMadnessTableId != 'none'){
			result = { 
				phobia: false,
				mania: false,
				description: null
			};
			const boutOfMadnessTable = game.tables.get( boutOfMadnessTableId);
			result.tableRoll = boutOfMadnessTable.roll();
			if( TABLE_RESULT_TYPES.ENTITY == result.tableRoll.results[0].type){
				const item = game.items.get(result.tableRoll.results[0].resultId);
				if( item.data?.data?.type?.phobia) result.phobia = true;
				if( item.data?.data?.type?.mania) result.mania = true;
				result.description = `${item.name}:${TextEditor.enrichHTML( item.data.data.description.value)}`;
				result.name = item.name;
				delete item.data._id;
				await this.createOwnedItem( item.data);
			}
			if( TABLE_RESULT_TYPES.TEXT == result.tableRoll.results[0].type){
				result.description = TextEditor.enrichHTML(result.tableRoll.results[0].text);
			}
		}

		//If it's not a real time no need to activate the bout
		if( !realTime) return result;
		

		if( this.boutOfMadness){
			await this.boutOfMadness.update( 
				{
					disabled: false,
					duration: {
						rounds: realTime&&duration?duration:undefined,
						seconds:realTime?undefined:duration*3600, turns: 1
					},
					flags:{
						CoC7:{
							realTime: realTime
						}
					}
				});
		} else {
			// const effectData = 
			await ActiveEffect.create({
				label: game.i18n.localize( 'CoC7.BoutOfMadnessName'),
				icon: 'systems/CoC7/artwork/icons/hanging-spider.svg',
				origin: this.uuid,
				duration: {rounds: realTime&&duration?duration:undefined,seconds:realTime?undefined:duration*3600, turns: 1},
				flags:{
					CoC7: {
						madness: true,
						realTime: realTime
					}
				},
				// tint: '#ff0000',
				disabled: false
			}, this).create();
			// const effect = this.effects.get( effectData._id);
			// effect.sheet.render(true);
		}
		// const effect = this.effects.get( effectData._id);
		// effect.sheet.render(true);

		return result;
	}
	
	async enterInsanity( indefinite = true, duration = undefined){
		if( this.insanity){
			await this.insanity.update( {
				disabled: false,
				duration: {
					seconds: !indefinite&&duration?duration*3600:undefined,
					turns: 1
				},
				flags:{
					CoC7:{
						indefinite: indefinite
					}
				}
			});
		} else {
			// const effectData = 
			await ActiveEffect.create({
				label: game.i18n.localize( 'CoC7.InsanityName'),
				icon: 'systems/CoC7/artwork/icons/tentacles-skull.svg',
				origin: this.uuid,
				duration: {seconds: !indefinite&&duration?duration*3600:undefined, turns: 1},
				flags:{
					CoC7: {
						madness: true,
						indefinite: indefinite
					}
				},
				disabled: false
			}, this).create();
		}

	}

	async exitBoutOfMadness(){
		return await this.boutOfMadness?.update( { disabled: true});
	}

	
	async exitInsanity(){
		return await this.insanity?.update( { disabled: true});
	}


	/**
	 * Called upon new actor creation.
	 * @param {*} data 
	 * @param {*} options 
	 */
	// static async create(data, options) {
	// 	// If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
	// 	if (data.items)
	// 	{
	// 		return super.create(data, options);
	// 	}
	// 	return super.create(data, options);
	// }
	
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

	async createWeaponSkill( name, firearms = false, base = null){
		//TODO : Ask for base value if null

		const skillData = await SkillSpecSelectDialog.create( [], game.i18n.localize( firearms? 'CoC7.FirearmSpecializationName': 'CoC7.FightingSpecializationName'), 0, name);
		const value = Number( skillData.get('base-value'));
		const data = {
			name: name,
			type: 'skill',
			data: {
				specialization: game.i18n.localize( firearms? 'CoC7.FirearmSpecializationName': 'CoC7.FightingSpecializationName'),
				base: isNaN(value)? 0: value,
				adjustments: {
					personal: null,
					occupation: null,
					archetype: null,
					experience: null
				},
				properties: {
					special: true,
					fighting: !firearms,
					firearm: firearms,
					combat: true
				}
			}
		};
		await this.createEmbeddedEntity('OwnedItem', data, { renderSheet: !base});
		//		const created = await this.createEmbeddedEntity('OwnedItem', data, { renderSheet: !base});
		const skill = this.getSkillsByName( name);
		return skill[0];
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

	async createBioSection( title = null){
		const bio = this.data.data.biography ? duplicate( this.data.data.biography) : [];
		bio.push( {
			title : title,
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
		case 'skill':
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

			if( CoC7Item.isAnySpec( data)){
				const specialization = data.data.specialization?.toLowerCase();
				if( specialization){
					let skillList = [];
					if( data.data?.flags?.occupation || data.data?.flags?.archetype)
						skillList = this.skills.filter( el => {
							if( !el.data.data.specialization) return false;
							if( data.data?.flags?.occupation && el.data.data.flags?.occupation) return false;
							if( data.data?.flags?.archetype && el.data.data.flags?.archetype) return false;
							return specialization.toLowerCase() == el.data.data.specialization?.toLowerCase();
						});
					// if( 1 <= skillList.length) {
					const skillData = await SkillSpecSelectDialog.create(skillList, data.data.specialization, data.data.base);
					if( skillData){
						if( skillData.get('existing-skill')){
							const existingItem = this.getOwnedItem( skillData.get('existing-skill'));
							for( let [key, value] of Object.entries( data.data.flags)){
								if( value) await existingItem.setItemFlag( key);
							}
							data.name = CoC7Item.getNameWithoutSpec( existingItem);
							return;
						} else {
							if( skillData.get('new-skill-name')){
								data.name = skillData.get('new-skill-name');
							} else data.name = CoC7Item.getNameWithoutSpec(data);

							if( skillData.get('base-value')){
								const value = Number( skillData.get('base-value'));
								if( !isNaN(value)) data.data.base = value;
							}
						}

					}
				}
				// }
			}

			return await super.createEmbeddedEntity(embeddedName, data, options);
		case 'weapon':{
			const mainSkill = data.data?.skill?.main?.name;
			if( mainSkill){
				let skill = this.getSkillsByName( mainSkill)[0];
				if( !skill){
					const name = mainSkill.match(/\(([^)]+)\)/)? mainSkill.match(/\(([^)]+)\)/)[1]: mainSkill;
					skill = await this.createWeaponSkill( name, data.data.properties?.rngd ? true: false);
				}
				if( skill) data.data.skill.main.id = skill._id;
			} //TODO : Else : selectionner le skill dans la liste ou en créer un nouveau.

			const secondSkill = data.data?.skill?.alternativ?.name;
			if( secondSkill){
				let skill = this.getSkillsByName( secondSkill)[0];
				if( !skill){
					const name = mainSkill.match(/\(([^)]+)\)/)? mainSkill.match(/\(([^)]+)\)/)[1]: mainSkill;
					skill = await this.createWeaponSkill( name, data.data.properties?.rngd ? true: false);
				}
				if( skill) data.data.skill.alternativ.id = skill._id;
			} //TODO : Else : selectionner le skill dans la liste ou en créer un nouveau.
			
			return await super.createEmbeddedEntity(embeddedName, duplicate(data), options);
		}
		case 'setup':{
			if( data.data.enableCharacterisitics){
				data.data.characteristics.list = {};
				data.data.characteristics.list.str = this.getCharacteristic('str');
				data.data.characteristics.list.con = this.getCharacteristic('con');
				data.data.characteristics.list.siz = this.getCharacteristic('siz');
				data.data.characteristics.list.dex = this.getCharacteristic('dex');
				data.data.characteristics.list.app = this.getCharacteristic('app');
				data.data.characteristics.list.int = this.getCharacteristic('int');
				data.data.characteristics.list.pow = this.getCharacteristic('pow');
				data.data.characteristics.list.edu = this.getCharacteristic('edu');

				data.data.characteristics.list.luck = {};
				data.data.characteristics.list.luck.value = isNaN(this.luck)? null: this.luck;
				data.data.characteristics.list.luck.label = game.i18n.localize( 'CoC7.Luck');
				data.data.characteristics.list.luck.shortName = game.i18n.localize( 'CoC7.Luck');
				

				if( !data.data.characteristics.values) data.data.characteristics.values = {};
				data.data.characteristics.values.str = data.data.characteristics.list.str.value;
				data.data.characteristics.values.con = data.data.characteristics.list.con.value;
				data.data.characteristics.values.siz = data.data.characteristics.list.siz.value;
				data.data.characteristics.values.dex = data.data.characteristics.list.dex.value;
				data.data.characteristics.values.app = data.data.characteristics.list.app.value;
				data.data.characteristics.values.int = data.data.characteristics.list.int.value;
				data.data.characteristics.values.pow = data.data.characteristics.list.pow.value;
				data.data.characteristics.values.edu = data.data.characteristics.list.edu.value;
				data.data.characteristics.values.luck = data.data.characteristics.list.luck.value;
				if( data.data.characteristics.points.enabled) data.data.title = game.i18n.localize('CoC7.SpendPoints');
				else data.data.title = game.i18n.localize('CoC7.RollCharac');
				const rolled = await CharacRollDialog.create( data.data);
				if( rolled){
					const updateData = {};
					['str', 'con', 'siz' ,'dex' ,'app' ,'int' ,'pow', 'edu'].forEach( key => {
						if( data.data.characteristics.values[key]){
							updateData[`data.characteristics.${key}.value`] = data.data.characteristics.values[key];
							updateData[`data.characteristics.${key}.formula`] = data.data.characteristics.rolls[key];
						}
					});
					if( data.data.characteristics.values.luck) updateData['data.attribs.lck.value'] = data.data.characteristics.values.luck;
					await this.update( updateData);
				} else return;
			}
			const skills = data.data.items.filter( it => 'skill' == it.type);
			const othersItems = data.data.items.filter( it => 'skill' != it.type);
			await this.addUniqueItems( skills);
			await this.addItems( othersItems);
			for( const sectionName of data.data.bioSections){
				if( !this.data.data.biography.find( el => sectionName == el.title) && sectionName) await this.createBioSection( sectionName);
			}
			break;
		}
		case 'archetype':
			if( 'character' == this.data.type){ //Archetypre only for PCs
				if( this.archetype) {
					let resetArchetype = false;
					await Dialog.confirm({
						title: game.i18n.localize( 'CoC7.ResetArchetype'),
						content: `<p>${game.i18n.format('CoC7.ResetArchetypeHint', { name: this.name})}</p>`,
						yes: () => { resetArchetype = true;},
						defaultYes: false
					});
					if( resetArchetype) await this.resetArchetype();
					else return;
				}


				const coreCharac = [];
				Object.entries(data.data.coreCharacteristics).forEach(entry => {
					const[ key, value] = entry;
					data.data.coreCharacteristics[key] = false;
					if( value){
						const char = this.getCharacteristic( key);
						char.key = key;
						coreCharac.push( char);
					}
				});
				if( coreCharac.length > 1){
					const charDialogData = {};
					charDialogData.characteristics = coreCharac;
					charDialogData.title = game.i18n.localize( 'CoC7.SelectCoreCharac');
					const charac = await CharacSelectDialog.create( charDialogData);
					if( !charac) return;
					data.data.coreCharacteristics[charac]=true;
					if( data.data.coreCharacteristicsFormula.enabled){
						let value = Number(data.data.coreCharacteristicsFormula.value);
						if( isNaN(value)){
							const char = this.getCharacteristic( charac);
							const roll = new Roll( data.data.coreCharacteristicsFormula.value);
							roll.roll();
							roll.toMessage({flavor: `Rolling characterisitic ${char.label}: ${data.data.coreCharacteristicsFormula.value}`});
							value = (char.value < roll.total)? roll.total: char.value;
						}
						await this.update({ [`data.characteristics.${charac}.value`]: value});
					}
				}
				//Add all skills
				await this.addUniqueItems( data.data.skills, 'archetype');

				const newArchetype = await super.createEmbeddedEntity(embeddedName, data, options);
				//setting points
				await this.update( {
					'data.development.archetype': this.archetypePoints,
				});

				return newArchetype;
			}

			break;
		case 'occupation':
			if( 'character' == this.data.type){ //Occupation only for PCs
				if( this.occupation) {
					let resetOccupation = false;
					await Dialog.confirm({
						title: game.i18n.localize( 'CoC7.ResetOccupation'),
						content: `<p>${game.i18n.format('CoC7.ResetOccupationHint', { name: this.name})}</p>`,
						yes: () => { resetOccupation = true;},
						defaultYes: false
					});
					if( resetOccupation) await this.resetOccupation();
					else return;
				}

				// Select characteristic
				const pointsDialogData = {};
				pointsDialogData.characteristics = data.data.occupationSkillPoints;
				let total = 0;
				let optionalChar = false;
				Object.entries(data.data.occupationSkillPoints).forEach(entry => {
					const [key, value] = entry;
					const char = this.getCharacteristic( key);
					pointsDialogData.characteristics[key].name = char.label;
					pointsDialogData.characteristics[key].value = char.value;
					if( value.selected){
						pointsDialogData.characteristics[key].total = char.value*Number(pointsDialogData.characteristics[key].multiplier);
						if( !value.optional) total += pointsDialogData.characteristics[key].total;
						else optionalChar = true;
					}
				});
				pointsDialogData.total = total;
				if( optionalChar){ //Is there any optional char to choose for points calc ?
					const result = await PointSelectDialog.create( pointsDialogData);
					if( !result) return; // Point not selected => exit.
				}
				
				//Add optional skills
				for (let index = 0; index < data.data.groups.length; index++) {
					const dialogData = {};
					dialogData.skills = [];
					dialogData.type = 'occupation';
					dialogData.actorId = this.id;
					dialogData.optionsCount = Number(data.data.groups[index].options);
					dialogData.title = game.i18n.localize('CoC7.SkillSelectionWindow');

					//Select only skills that are not present or are not flagged as occupation.
					data.data.groups[index].skills.forEach( value => {
						if( CoC7Item.isAnySpec( value)) dialogData.skills.push( value); //If it's a generic spec we always add it
						else{
							const skill = this.items.find( item => { return (item.name == value.name && 'skill' == item.type);});
							if( !skill || !skill.data.data.flags?.occupation){
							//if skill was added to skill list previously, remove it
								const alreadySelectedSkill = data.data.skills.find( item => { return (item.name == value.name);});
								if( !alreadySelectedSkill) dialogData.skills.push( value);
							}
						}
					});

					//if there's none, do nothing.
					if( 0 != dialogData.skills.length){
						dialogData.skills.forEach( skill =>{
							if( skill.data.specialization && !skill.name.includes(skill.data.specialization))
								skill.displayName = `${skill.data.specialization} (${skill.name})`;
							else skill.displayName = skill.name;
						});

						if( dialogData.skills.length <= dialogData.optionsCount){
							//If there's is less skill than options, add them all.
							ui.notifications.info( game.i18n.format('CoC7.InfoLessSkillThanOptions',{skillCount: dialogData.skills.length, optionsCount: dialogData.optionsCount}));
							// await this.addUniqueItems( dialogData.skills, 'occupation');
							const merged = CoC7Item.mergeOptionalSkills( data.data.skills, dialogData.skills);
							data.data.skills = merged;
						} else {
							//Wait for skill selection.
							const selected = await SkillSelectDialog.create( dialogData);
							if( !selected) return;
							const merged = CoC7Item.mergeOptionalSkills( data.data.skills, selected);
							data.data.skills = merged;
						}
					} else ui.notifications.info( game.i18n.localize('CoC7.InfoAllSkillsAlreadySelected'));
				}


				//Add extra skills
				if( Number(data.data.personal)){
					const dialogData = {};
					dialogData.skills = [];
					dialogData.type = 'occupation';
					dialogData.actorId = this.id;
					dialogData.optionsCount = Number(data.data.personal);
					dialogData.title = game.i18n.format('CoC7.SelectPersonalSkills', { number: Number(data.data.personal)});

					//Select only skills that are not present or are not flagged as occupation.
					this.skills.forEach( s => {
						//Select all skills that are not already flagged as occupation, can have adjustments and XP.
						if( !s.data.data.flags.occupation && !s.data.data.properties.noadjustments && !s.data.data.properties.noxpgain){
							// if skill already selected don't add it
							const alreadySelectedSkill = data.data.skills.find( item => { return (item.name == s.name);});
							if( !alreadySelectedSkill) dialogData.skills.push( s.data);
						}
					});

					//if there's none, do nothing.
					if( 0 != dialogData.skills.length){
						dialogData.skills.forEach( skill =>{
							if( skill.data.specialization && !skill.name.includes(skill.data.specialization))
								skill.displayName = `${skill.data.specialization} (${skill.name})`;
							else skill.displayName = skill.name;
						});
						if( dialogData.skills.length <= dialogData.optionsCount){
						//If there's is less skill than options, add them all.
							ui.notifications.info( game.i18n.format('CoC7.InfoLessSkillThanOptions',{skillCount: dialogData.skills.length, optionsCount: dialogData.optionsCount}));
							// await this.addUniqueItems( dialogData.skills, 'occupation');
							const merged = CoC7Item.mergeOptionalSkills( data.data.skills, dialogData.skills);
							data.data.skills = merged;
						} else {
						//Wait for skill selection.
							const selected = await SkillSelectDialog.create( dialogData);//Dialog data bug ???
							if( !selected) return;
							const merged = CoC7Item.mergeOptionalSkills( data.data.skills, selected);
							data.data.skills = merged;						}
					} else ui.notifications.info( game.i18n.localize('CoC7.InfoAllSkillsAlreadySelected'));
				}

				//Add all skills
				await this.addUniqueItems( data.data.skills, 'occupation');
				//Credit rating is always part of occupation
				await this.creditRatingSkill?.setItemFlag( 'occupation');
				//setting it to min credit rating
				await this.creditRatingSkill?.update( {'data.adjustments.occupation': Number(data.data.creditRating.min)});

				const newOccupation = await super.createEmbeddedEntity(embeddedName, data, options);
				//setting points
				await this.update( {
					'data.development.occupation': this.occupationPoints,
					'data.development.personal': this.personalPoints
				});

				return newOccupation;
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
		const name = itemName.match(/\(([^)]+)\)/)? itemName.match(/\(([^)]+)\)/)[1]: itemName;
		this.items.forEach( (value) => {
			if( CoC7Item.getNameWithoutSpec(value).toLowerCase() == name.toLowerCase()) id = value.id;
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
	getSkillsByName( skillName){ // TODO : more aggressive finding including specs
		let skillList = [];
		const name = skillName.match(/\(([^)]+)\)/)? skillName.match(/\(([^)]+)\)/)[1]: skillName;

		this.items.forEach( (value) => {
			if( CoC7Item.getNameWithoutSpec(value).toLowerCase() == name.toLowerCase() && value.type == 'skill') skillList.push( value);
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

	getCharacteristic( charName){
		for( let [key, value] of Object.entries(this.data.data.characteristics)){
			if( 
				game.i18n.localize(value.short).toLowerCase() == charName.toLowerCase() || 
					game.i18n.localize(value.label).toLowerCase() == charName.toLowerCase() ||
					key == charName.toLowerCase())
			{
				return {
					key: key,
					shortName: game.i18n.localize(value.short),
					label: game.i18n.localize( value.label),
					value: value.value
				};
			}
		}
		return null;
	}

	getAttribute( attribName){
		if( ['lck', 'luck', game.i18n.localize('CoC7.Luck').toLowerCase()].includes(attribName.toLowerCase()))
		{
			return {
				key: 'lck',
				shortName: 'luck',
				label: game.i18n.localize('CoC7.Luck'),
				value: this.data.data.attribs.lck.value
			};
		}
		if( ['san', game.i18n.localize('CoC7.SAN').toLowerCase(), game.i18n.localize('CoC7.Sanity').toLowerCase()].includes(attribName.toLowerCase()))
		{
			return {
				key: 'san',
				shortName: game.i18n.localize('CoC7.SAN'),
				label: game.i18n.localize('CoC7.Sanity'),
				value: this.data.data.attribs.san.value
			};
		}
		return null;
	}

	get occupation(){
		const occupation = this.items.filter( item => item.type == 'occupation');
		return occupation[0];
	}

	get archetype(){
		const archetype = this.items.filter( item => item.type == 'archetype');
		return archetype[0];
	}

	async resetOccupation( eraseOld = true){
		if( eraseOld){
			const occupationSkill = this.items.filter( item => item.getItemFlag('occupation'));
			for (let index = 0; index < occupationSkill.length; index++) {
				await occupationSkill[index].unsetItemFlag('occupation');
			}
		}
		if( this.occupation) await this.deleteOwnedItem(this.occupation.id);
		await this.update({ 'data.development.occupation': null});
	}

	async resetArchetype( eraseOld = true){
		if( eraseOld){
			const archetypeSkill = this.items.filter( item => item.getItemFlag('archetype'));
			for (let index = 0; index < archetypeSkill.length; index++) {
				await archetypeSkill[index].unsetItemFlag('archetype');
			}
		}
		if( this.archetype) await this.deleteOwnedItem(this.archetype.id);
		await this.update({ 'data.development.archetype': null});
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
				return game.settings.get('CoC7', 'pulpRules') && 'character' == this.data.type? maxHP*2:maxHP;
			}
			if( this.data.data.attribs.hp.max) return parseInt(this.data.data.attribs.hp.max);
			return null;
		} 
		return parseInt( this.data.data.attribs.hp.max);
	}

	async setHp( value){
		if( value < 0) value = 0;
		if( value > this.hpMax) value = parseInt( this.hpMax);
		return await this.update( { 'data.attribs.hp.value': value});
	}

	async addUniqueItems( skillList, flag = null){
		for( let skill of skillList){
			if( CoC7Item.isAnySpec(skill)){
				if( ! skill.data.flags) skill.data.flags = {};
				if( flag) skill.data.flags[flag] = true;
				await this.createOwnedItem( skill, {renderSheet:false});
			}
			else {
				const itemId = this.getItemIdByName(skill.name);
				if( !itemId){
					if( flag){
						if( ! skill.data.flags) skill.data.flags = {};
						skill.data.flags[flag] = true;
					}
					await this.createOwnedItem( skill, {renderSheet:false});
				}else if( flag){
					const item = this.getOwnedItem( itemId);
					await item.setItemFlag( flag);
				}
			}
		}
	}

	async addItems( itemList, flag = null){
		for( let item of itemList){
			if( flag){
				if( ! item.data.flags) item.data.flags = {};
				item.data.flags[flag] = true;
			}
			await this.createOwnedItem( item, {renderSheet:false});
		}	
	}

	async addUniqueItem( skill, flag = null){
		const itemId = this.getItemIdByName(skill.name);
		if( !itemId){
			if( flag){
				if( ! skill.data.flags) skill.data.flags = {};
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

	encounteredCreaturesSanData(creature){
		const i = this.encounteredCreaturesSanDataIndex(creature);
		if( i != -1) return this.data.data.encounteredCreatures[i];
		return null;
	}

	encounteredCreaturesSanDataIndex(creature){
		const sanData = CoC7Utilities.getCreatureSanData( creature);
		return this.data.data.encounteredCreatures.findIndex( cd =>{
			return( cd.id == sanData?.id || cd.name.toLowerCase() == sanData.name?.toLocaleLowerCase());
		});
	}

	sanLostToCreature( creature){
		const sanData = this.encounteredCreaturesSanData(creature);
		if( sanData){
			// check for if specie already encountered return max of both;
			if( sanData.specie)
				return Math.max(sanData.specie.totalLoss || 0, sanData.totalLoss);

			return sanData.totalLoss || 0;
		}
		else { //That creature was never encountered. What about his specie.
			const creatureSanData = CoC7Utilities.getCreatureSanData( creature);
			if( creatureSanData.specie){
				let specieEncountered = this.encounteredCreaturesSanData(creatureSanData.specie);
				if( specieEncountered) return specieEncountered.totalLoss;
			}
			return 0;//Never encountered that specie or this creature.

		} 
	}

	maxPossibleSanLossToCreature( creature){
		// Do we know you ?
		const sanData = this.encounteredCreaturesSanData(creature);
		const creatureSanData = CoC7Utilities.getCreatureSanData( creature);

		if( sanData){
			//Was there any update to that creature ?
			let changes = false;
			if( creatureSanData.sanLossMax != sanData.sanLossMax) { sanData.sanLossMax = creatureSanData.sanLossMax; changes=true;}
			if( creatureSanData.specie && !sanData.specie ) { sanData.specie = creatureSanData.specie; changes=true;}
			if( creatureSanData.specie && creatureSanData.specie.sanLossMax != sanData.specie.sanLossMax) { sanData.specie.sanLossMax = creatureSanData.specie.sanLossMax; changes=true;}
			if( sanData.totalLoss > sanData.sanLossMax) { sanData.totalLoss = sanData.sanLossMax; changes=true;}
			if( sanData.specie && sanData.specie.totalLoss > sanData.specie.sanLossMax) { sanData.specie.totalLoss = sanData.specie.sanLossMax; changes=true;}

			if( changes){
				const encounteredCreaturesList = this.data.data.encounteredCreatures ? duplicate( this.data.data.encounteredCreatures) : [];
				const sanDataIndex = this.encounteredCreaturesSanDataIndex( creature);
				encounteredCreaturesList[sanDataIndex] = sanData;
				if( sanData.specie)
					this._updateAllOfSameSpecie( encounteredCreaturesList, sanData.specie);

				this.update( { ['data.encounteredCreatures'] : encounteredCreaturesList});

			}


			return sanData.sanLossMax - sanData.totalLoss;
		}
		// We don't know you.
		if( creatureSanData){
			const sanLostToCreature = this.sanLostToCreature(creature);
			return Math.max( 0, creatureSanData.sanLossMax - sanLostToCreature);
		}
		return 99;
	}

	creatureEncountered( creature){
		return( !!~this.encounteredCreaturesSanDataIndex(creature));
	}

	creatureSpecieEncountered( creature){
		const creatureSanData = CoC7Utilities.getCreatureSanData( creature);
		if( creatureSanData.specie){
			return( !!~this.encounteredCreaturesSanDataIndex(creatureSanData.specie));
		}
		return this.creatureEncountered( creature);
	}

	_updateAllOfSameSpecie( encounteredCreaturesList, specieSanData){
		for (let index = 0; index < encounteredCreaturesList.length; index++) {
			if( encounteredCreaturesList[index].specie?.id == specieSanData.id || encounteredCreaturesList[index].specie?.name.toLowerCase() == specieSanData.name?.toLowerCase()){
				//New encounter with that specie.
				if( encounteredCreaturesList[index].specie.totalLoss != specieSanData.totalLoss){
					const delta = specieSanData.totalLoss - encounteredCreaturesList[index].specie.totalLoss;
					if( delta > 0) {
						encounteredCreaturesList[index].specie = specieSanData;
						encounteredCreaturesList[index].totalLoss += delta;
						encounteredCreaturesList[index].totalLoss = Math.min( encounteredCreaturesList[index].totalLoss, encounteredCreaturesList[index].sanLossMax);
					}
				}
			}
		}
	}

	
	_removeSpecie( encounteredCreaturesList, specieSanData){
		for (let index = 0; index < encounteredCreaturesList.length; index++) {
			if( encounteredCreaturesList[index].specie?.id == specieSanData.id || encounteredCreaturesList[index].specie?.name.toLowerCase() == specieSanData.name?.toLowerCase()){
				const previousSpecieLost =  encounteredCreaturesList[index].specie.totalLoss;
				delete encounteredCreaturesList[index].specie;

				encounteredCreaturesList[index].totalLoss = encounteredCreaturesList[index].totalLoss - previousSpecieLost;
				if( encounteredCreaturesList[index].totalLoss < 0) {
					encounteredCreaturesList[index].totalLoss = 0;
				}
			}
		}
	}

	async resetCreature( creature){
		const i_sanData = this.encounteredCreaturesSanDataIndex( creature);
		if( ~i_sanData){
			const creatureSanData = CoC7Utilities.getCreatureSanData( creature);
			const encounteredCreaturesList = this.data.data.encounteredCreatures ? duplicate( this.data.data.encounteredCreatures) : [];
			encounteredCreaturesList.splice( i_sanData, 1);
			creatureSanData.totalLoss = 0;
			if( creatureSanData.specie) delete creatureSanData.specie;
			this._updateAllOfSameSpecie( encounteredCreaturesList, creatureSanData);
			await this.update( { ['data.encounteredCreatures'] : encounteredCreaturesList});
		}
	}

	async resetSpecie( creature){
		const encounteredCreaturesList = this.data.data.encounteredCreatures ? duplicate( this.data.data.encounteredCreatures) : [];
		const creatureSanData = CoC7Utilities.getCreatureSanData( creature);
		if( !creatureSanData.specie) return;
		const i_sanData = this.encounteredCreaturesSanDataIndex( creatureSanData.specie);
		if( ~i_sanData){
			encounteredCreaturesList.splice( i_sanData, 1);
		}
		this._removeSpecie( encounteredCreaturesList, creatureSanData.specie);
		await this.update( { ['data.encounteredCreatures'] : encounteredCreaturesList});

		return false;
	}

	async looseSanToCreature( sanLoss, creature){

		let exactSanLoss = sanLoss;
		// Get that creature SAN data.
		const creatureSanData = CoC7Utilities.getCreatureSanData( creature);

		// Get actor SAN data for that creature.
		const i_sanData = this.encounteredCreaturesSanDataIndex( creature);

		// Check if that creature belongs to a specie and have we already encoutered it.
		let i_specieSanData = -1;
		if( creatureSanData.specie?.id) i_specieSanData = this.encounteredCreaturesSanDataIndex( creatureSanData.specie.id);
		if( -1 == i_specieSanData && creatureSanData.specie?.name) i_specieSanData = this.encounteredCreaturesSanDataIndex( creatureSanData.specie.name);

		//Copy the array for updating.
		const encounteredCreaturesList = this.data.data.encounteredCreatures ? duplicate( this.data.data.encounteredCreatures) : [];

		//Creature already encountered.
		if( ~i_sanData){
			const oldSanData = encounteredCreaturesList[i_sanData];
			let newSanData;
			//Update sanData with new SAN data (might have been updated ?)
			if( creatureSanData){
				newSanData = creatureSanData;
				newSanData.totalLoss = oldSanData.totalLoss || 0;
				if( newSanData.specie){
					newSanData.specie.totalLoss = oldSanData.specie?.totalLoss?oldSanData.specie.totalLoss:0;
				} else {
					if( oldSanData.specie) newSanData.specie = oldSanData.specie;//Should never happen
				}
			}

			newSanData.totalLoss = newSanData.totalLoss?newSanData.totalLoss+sanLoss:sanLoss;
			if( newSanData.totalLoss > newSanData.sanLossMax){
				exactSanLoss = exactSanLoss - ( newSanData.totalLoss-newSanData.sanLossMax);
				newSanData.totalLoss = newSanData.sanLossMax;
			}

			//Credit the loss to that creature specie as well if it exists.
			if( newSanData.specie){
				newSanData.specie.totalLoss = newSanData.specie.totalLoss?newSanData.specie.totalLoss+exactSanLoss:exactSanLoss;
				if( newSanData.specie.totalLoss > newSanData.specie.sanLossMax) newSanData.specie.totalLoss = newSanData.specie.sanLossMax;

				//Update all creture from the same specie.
				this._updateAllOfSameSpecie( encounteredCreaturesList, newSanData.specie);
			}

			encounteredCreaturesList[i_sanData] = newSanData;
			//Update the specie also :
			if( ~i_specieSanData && newSanData.specie) encounteredCreaturesList[i_specieSanData] = newSanData.specie; //We already encoutered that specie
			else{
				//Should never happen (encountered that creature but never his specie).
				if( newSanData.specie) encounteredCreaturesList.push( newSanData.specie); 
			}
		} else {
			//Creature never encountered.
			const newSanData = creatureSanData;
			newSanData.totalLoss = 0;

			
			if( newSanData.specie){
				//Specie already encountered.
				if( ~i_specieSanData){
					newSanData.specie.totalLoss = encounteredCreaturesList[i_specieSanData].totalLoss;

					// We already loss SAN to this specie of creature. The base los for this creature is the specie base loss.
					newSanData.totalLoss = newSanData.specie.totalLoss;
					if( newSanData.totalLoss > newSanData.sanLossMax)  newSanData.totalLoss = newSanData.sanLossMax;
				}
				else{
					//We never encountered specie or creature.
					newSanData.specie.totalLoss = 0;
					newSanData.totalLoss = 0;
				}
			}

			//Apply the san loss to that creature.
			newSanData.totalLoss = newSanData.totalLoss + sanLoss;

			//If loss is more thant creature Max.
			if( newSanData.totalLoss > newSanData.sanLossMax){
				//Get the exact san loss = loss - (overflow - max)
				exactSanLoss = exactSanLoss - ( newSanData.totalLoss-newSanData.sanLossMax);
				newSanData.totalLoss = newSanData.sanLossMax;
			}

			// Deduct the exact loss to that specie.
			if( newSanData.specie){ //Wait for exact san LOSS before deduciting it from specie.
				newSanData.specie.totalLoss = newSanData.specie.totalLoss + exactSanLoss;
				if( newSanData.specie.totalLoss > newSanData.specie.sanLossMax) newSanData.specie.totalLoss = newSanData.specie.sanLossMax;
				
				//If we now that specie update it. If we don't add it.
				if( ~i_specieSanData) encounteredCreaturesList[i_specieSanData] = newSanData.specie;
				else encounteredCreaturesList.push( newSanData.specie);
				
				//Update all creature from the same specie.
				this._updateAllOfSameSpecie( encounteredCreaturesList, newSanData.specie);

			}

			encounteredCreaturesList.push( newSanData);
		}

		await this.setSan( this.san - exactSanLoss);
		await this.update( { ['data.encounteredCreatures'] : encounteredCreaturesList});
		return exactSanLoss;
	}

	async looseSan( sanLoss, creature = null){
		if( creature) await this.looseSanToCreature( sanLoss, creature);
		else await this.setSan( this.san - sanLoss);
	}


	get sanData(){
		return CoC7Utilities.getCreatureSanData( this);
	}

	sanLoss( checkPassed){
		if( checkPassed) return this.sanLossCheckPassed;
		return this.sanLossCheckFailled;
	}

	get sanLossCheckPassed(){
		return this.data.data.special?.sanLoss?.checkPassed;
	}

	get sanLossCheckFailled(){
		return this.data.data.special?.sanLoss?.checkFailled;
	}

	get sanLossMax(){
		if( this.sanLossCheckFailled){
			if( !isNaN( Number(this.sanLossCheckFailled)) ) return Number(this.sanLossCheckFailled);
			return new Roll(this.sanLossCheckFailled).evaluate({maximize: true}).total;
		}
		return 0;
	}

	get sanLossMin(){
		if( this.sanLossCheckPassed){
			if( !isNaN( Number(this.sanLossCheckPassed)) ) return Number(this.sanLossCheckPassed);
			return new Roll(this.sanLossCheckPassed).evaluate({maximize: true}).total;
		}
		return 0;
	}

	get dailySanLoss()
	{
		return this.data.data.attribs.san?.dailyLoss || 0;
	}

	get sanMax(){
		if( this.data.data.attribs.san.auto){
			if( this.cthulhuMythos) return 99 - this.cthulhuMythos;
			return 99;
		} 
		return parseInt( this.data.data.attribs.san.max);
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

	
	get int(){
		return this.getCharacteristic( 'int');
	}


	get occupationPointsSpent(){
		let occupationPoints = 0;
		for( let skill of this.skills){
			if( skill.data.data.adjustments?.occupation){
				occupationPoints += skill.data.data.adjustments.occupation;
			}
		}
		return occupationPoints;
	}

	get occupationPoints(){
		if( !this.occupation) return 0;
		let points = 0;
		Object.entries(this.occupation.data.data.occupationSkillPoints).forEach(entry => {
			const [key, value] = entry;
			const char = this.getCharacteristic( key);
			if( value.selected){
				points += char.value*Number(value.multiplier);
			}
		});
		return points;
	}

	async resetOccupationPoints(){
		await this.update( {
			'data.development.occupation': this.occupationPoints
		});
	}

	async resetArchetypePoints(){
		await this.update( {
			'data.development.archetype': this.occupationPoints
		});
	}

	async resetPersonalPoints(){
		await this.update( {
			'data.development.personal': this.personalPoints
		});		
	}

	get archetypePointsSpent(){
		let archetypePoints = 0;
		for( let skill of this.skills){
			if( skill.data.data.adjustments?.archetype){
				archetypePoints += skill.data.data.adjustments.archetype;
			}
		}
		return archetypePoints;
	}

	get archetypePoints(){
		if( !this.archetype) return 0;
		return this.archetype.data.data.bonusPoints;
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

	get personalPointsSpent(){
		let personalPoints = 0;
		for( let skill of this.skills){
			if( skill.data.data.adjustments?.personal){
				personalPoints += skill.data.data.adjustments.personal;
			}
		}
		return personalPoints;
	}

	get personalPoints(){
		return 2*Number(this.data.data.characteristics.int.value);
	}

	get hasSkillFlaggedForExp(){
		for( let skill of this.skills){
			if( skill.data.data.flags?.developement) return true;
		}
		return false;
	}

	async setSan( value){
		if( value < 0) value = 0;
		if( value > this.sanMax) value = this.sanMax;
		let loss = parseInt( this.data.data.attribs.san.value) - value;
		// if( creatureData){
		// 	const creatureIndex = this.data.data.encounteredCreatures.findIndex( c => {
		// 		if( c.id && c.id == creatureData.id) return true;
		// 		if( c.name && c.name.toLowerCase() == creatureData.name?.toLowerCase()) return true;
		// 		return false;});
		// 	let encounteredCreaturesList;
		// 	if( -1 < creatureIndex){
		// 		encounteredCreaturesList = this.data.data.encounteredCreatures ? duplicate( this.data.data.encounteredCreatures) : [];
		// 		const maxLossRemaining = encounteredCreaturesList[creatureIndex].maxLoss - encounteredCreaturesList[creatureIndex].totalLoss;
		// 		if( loss > maxLossRemaining) loss = maxLossRemaining;
		// 		encounteredCreaturesList[creatureIndex].totalLoss += loss;
		// 	} else {
		// 		if( loss > createData.maxLoss) loss = createData.maxLoss;
		// 		encounteredCreaturesList = [
		// 			{
		// 				id: creatureData.id,
		// 				name: creatureData.name,
		// 				maxLoss: createData.maxLoss,
		// 				totalLoss: loss
		// 			}];
		// 	}

		// 	await this.item.update( { ['data.encounteredCreatures'] : encounteredCreaturesList});
		// }

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
		if( !this.data.data.attribs) return null;
		if( !this.data.data.attribs.build) return null;
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
		if( !this.data.data.attribs) return null;
		if( !this.data.data.attribs.db) return null;
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
		if( !this.data.data.attribs) return null;
		if( !this.data.data.attribs.mov) return null;
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

	getItemsFromName( name){
		return this.items.filter(i => i.name === name);
	}


	set locked( value){
		this.update( { 'data.flags.locked': value});
	}

	async toggleActorFlag( flagName){
		const flagValue =  this.data.data.flags[flagName] ? false: true;
		const name = `data.flags.${flagName}`;
		await this.update( { [name]: flagValue});
	}

	/**
	 * 
	 * @param {*} attributeName key of attribute to check in ['lck']
	 * @param {*} fastForward 
	 * @param {*} options difficulty in CoC7Check.difficultyLevel, modifier (-2 +2), name
	 */
	async attributeCheck( attributeName, fastForward = false, options = {}){
		let attrib = this.getAttribute(attributeName.toLowerCase());
		if(!attrib) {
			ui.notifications.error(game.i18n.format('CoC7.ErrorNotFound', {missing: attributeName}));
			return null;
		}

		const check = new CoC7Check();

		if( options.modifier) check.diceModifier = Number(options.modifier);
		if( options.difficulty) check.difficulty = CoC7Utilities.convertDifficulty(options.difficulty);

		if( !fastForward){
			if( undefined === options.difficulty || undefined === options.modifier){
				const usage = await RollDialog.create(options);
				if( usage) {
					check.diceModifier = Number(usage.get('bonusDice'));
					check.difficulty = Number(usage.get('difficulty'));
				}
			}
		}

		check.actor = this.tokenKey;
		if( 'false' == options.blind) check.isBlind = false;
		else check.isBlind = !!options.blind;
		check.rollAttribute(attrib.key);
		check.toMessage();
	}

	/**
	 * 
	 * @param {*} characteristicName key of characteristic to check in ['str','con','siz','dex','app','int','pow','edu']
	 * @param {*} fastForward 
	 * @param {*} options difficulty in CoC7Check.difficultyLevel, modifier (-2 +2), name
	 */
	async characteristicCheck( characteristicName, fastForward = false, options = {}){
		const char = this.getCharacteristic(characteristicName);

		if(!char) {
			ui.notifications.error(game.i18n.format('CoC7.ErrorNotFoundForActor', {missing: characteristicName, actor: this.name}));
			return;
		}

		const check = new CoC7Check();

		if( options.modifier) check.diceModifier = Number(options.modifier);
		if( options.difficulty) check.difficulty = CoC7Utilities.convertDifficulty(options.difficulty);

		if( !fastForward){
			if( undefined === options.difficulty || undefined === options.modifier){
				options.displayName = char.label;
				const usage = await RollDialog.create(options);
				if( usage) {
					check.diceModifier = Number(usage.get('bonusDice'));
					check.difficulty = Number(usage.get('difficulty'));
				}
			}
		}

		check.actor = this.tokenKey;
		if( 'false' == options.blind) check.isBlind = false;
		else check.isBlind = !!options.blind;
		check.rollCharacteristic(char.key);
		check.toMessage();
	}

	async skillCheck( skillData, fastForward, options = {}){
		let skill = this.getSkillsByName(skillData.name? skillData.name : skillData);
		if( !skill.length ) {
			let item = null;
			if( skillData.pack){
				const pack = game.packs.get(skillData.pack);
				if (pack.metadata.entity !== 'Item') return;
				item = await pack.getEntity(skillData.id);
			} else if( skillData.id){
				item = game.items.get(skillData.id);
			}

			//No skill found, try to get get it from compendium !
			if( !item){
				//TODO: Implement retrieval of skill from compendium !!
				// game.settings.get( 'CoC7', 'DefaultCompendium');
			}

			if( !item) return ui.notifications.warn(`No skill ${skillData.name? skillData.name : skillData} found for actor ${this.name}`);

			let create = false;
			await Dialog.confirm({
				title: `${game.i18n.localize('CoC7.AddWeapon')}`,
				content: `<p>${game.i18n.format('CoC7.AddWeapontHint', {weapon: skillData.name, actor: this.name})}</p>`,
				yes: () => create = true
			});

			if(true ==  create){ await this.createOwnedItem( duplicate(item.data));}
			else return;

			skill = this.getSkillsByName(item.name);

			if( !skill.length) return;

			if( game.user.isGM){
				const skillValue = await SkillValueDialog.create( skill[0].name, skill[0].base);
				const value = Number( skillValue.get('base-value'));
				await skill[0].updateValue( value);
			}
		}

		let check = new CoC7Check();

		if( undefined !== options.modifier) check.diceModifier = Number(options.modifier);
		if( undefined !== options.difficulty) check.difficulty = CoC7Utilities.convertDifficulty(options.difficulty);

		if( !fastForward){
			if( undefined === options.difficulty || undefined === options.modifier){
				const usage = await RollDialog.create(options);
				if( usage) {
					check.diceModifier = Number(usage.get('bonusDice'));
					check.difficulty = Number(usage.get('difficulty'));
				}
			}
		}

		check.actor = this.tokenKey;
		check.skill = skill[0].id;
		if( 'false' == options.blind) check.isBlind = false;
		else check.isBlind = !!options.blind;
		check.roll();
		check.toMessage();
	}

	async weaponCheck( weaponData, fastForward = false){
		const itemId = weaponData.id;
		let weapon;
		weapon = this.getOwnedItem(itemId);
		if( !weapon){
			let weapons = this.getItemsFromName( weaponData.name);
			if( 0 == weapons.length){
				if( game.user.isGM){
					let item = null;
					if( weaponData.pack){
						const pack = game.packs.get(weaponData.pack);
						if (pack.metadata.entity !== 'Item') return;
						item = await pack.getEntity(weaponData.id);
					} else if( weaponData.id){
						item = game.items.get(weaponData.id);
					}

					if( !item) return ui.notifications.warn( game.i18n.localize( 'CoC7.WarnMacroNoItemFound'));

					let create = false;
					await Dialog.confirm({
						title: `${game.i18n.localize('CoC7.AddWeapon')}`,
						content: `<p>${game.i18n.format('CoC7.AddWeapontHint', {weapon: weaponData.name, actor: this.name})}</p>`,
						yes: () => create = true
					});

					if(true ==  create){ 

						const mainSkill = item.data?.data?.skill?.main?.name;
						if( mainSkill){
							let skill = this.getSkillsByName( mainSkill)[0];
							if( !skill){
								const name = mainSkill.match(/\(([^)]+)\)/)? mainSkill.match(/\(([^)]+)\)/)[1]: mainSkill;
								skill = await this.createWeaponSkill( name, item.data.data.properties?.rngd ? true: false);
							}
							if( skill) item.data.data.skill.main.id = skill._id;
						} //TODO : Else : selectionner le skill dans la liste ou en créer un nouveau.

						const secondSkill = item.data?.data?.skill?.alternativ?.name;
						if( secondSkill){
							let skill = this.getSkillsByName( secondSkill)[0];
							if( !skill){
								const name = mainSkill.match(/\(([^)]+)\)/)? mainSkill.match(/\(([^)]+)\)/)[1]: mainSkill;
								skill = await this.createWeaponSkill( name, item.data.data.properties?.rngd ? true: false);
							}
							if( skill) item.data.data.skill.alternativ.id = skill._id;
						} //TODO : Else : selectionner le skill dans la liste ou en créer un nouveau.
						
						await this.createEmbeddedEntity('OwnedItem', duplicate(item.data));
					}
					else return;
					weapons = this.getItemsFromName( item.name);
					if( !weapons) return;
					await weapons[0].reload();
				} else {
					ui.notifications.warn(`Actor ${this.name} has no weapon named ${weaponData.name}`);
					return;
				}
			} else if( 1 < weapons.length) {
				ui.notifications.warn(`Actor ${this.name} has more than one weapon named ${weaponData.name}. The first found will be used`);
			}
			weapon = weapons[0];
		}

		// const actorKey = !this.isToken? this.actorKey : `${this.token.scene._id}.${this.token.data._id}`;
		if( !weapon.data.data.properties.rngd){
			if( game.user.targets.size > 1){
				ui.notifications.warn(game.i18n.localize('CoC7.WarnTooManyTarget'));
			}

			const card = new CoC7MeleeInitiator( this.tokenKey, weapon.id, fastForward);
			card.createChatCard();
		}
		if( weapon.data.data.properties.rngd){
			const card = new CoC7RangeInitiator( this.tokenKey, weapon.id, fastForward);
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

		if( weapon.usesAlternativeSkill && weapon.data.data.skill.alternativ.id){
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
					characteristics[`data.characteristics.${key}.value`] = Math.floor(r.total);
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
		const is07x = isNewerVersion(game.data.version, '0.6.9');

		const title = game.i18n.localize('CoC7.RollAll4Dev');
		let message = '<p class="chat-card">';
		for (let item of this.items){
			if( 'skill' === item.type){
				if( item.developementFlag){
					let die;
					if( is07x){
						die = new Die({faces: 100}).evaluate();
					} else {
						die = new Die(100);
						die.roll(1);
					}
					let skillValue = item.value;
					let augment = null;
					if( die.total > skillValue || die.total >= 95)
					{
						let augmentDie;
						if( is07x){
							augmentDie = new Die({faces: 10}).evaluate();
						}
						else{
							augmentDie = new Die(10);
							augmentDie.roll(1);
						}	
						success.push(item._id);

						augment += augmentDie.total;
						message += `<span class="upgrade-success">${game.i18n.format( 'CoC7.DevSuccess', {item : item.data.name, die: die.total, score: item.value, augment: augmentDie.total})}</span><br>`;
						await item.increaseExperience( augment);
					}else{
						message += `<span class="upgrade-failed">${game.i18n.format( 'CoC7.DevFailure', {item : item.data.name, die: die.total, score: item.value})}</span><br>`;
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
			message = game.i18n.format( 'CoC7.DevSuccessDetails', {item : skill.name, augment: augmentRoll.total});
			title = game.i18n.format( 'CoC7.DevRollTitle', {item : skill.name, die: upgradeRoll.total, score: skill.value});
			await skill.increaseExperience( augmentRoll.total);
		} else {
			title = game.i18n.format( 'CoC7.DevRollTitle', {item : skill.name, die: upgradeRoll.total, score: skill.value});
			message = game.i18n.format( 'CoC7.DevFailureDetails', {item : skill.name});
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

	async toggleEffect( effectName){
		switch (effectName) {
		case 'boutOfMadness':
			if( this.boutOfMadness){
				const boutOfMadness = this.boutOfMadness;
				if( boutOfMadness){
					await boutOfMadness.update({ disabled: !boutOfMadness.data.disabled, duration: {seconds: undefined, rounds: undefined, turns: 1}});
				}
			} else {
				// const effectData = 
				await ActiveEffect.create({
					label: game.i18n.localize( 'CoC7.BoutOfMadnessName'),
					icon: 'systems/CoC7/artwork/icons/hanging-spider.svg',
					origin: this.uuid,
					duration: {seconds: undefined, rounds: undefined, turns: 1},
					flags:{
						CoC7: {
							madness: true,
							realTime: true
						}
					},
					// tint: '#ff0000',
					disabled: false
				}, this).create();
			}
				
			break;
		case 'insanity':
			if( this.insanity){
				const insanity = this.insanity;
				if( insanity){
					await insanity.update({ disabled: !insanity.data.disabled, duration: {seconds: undefined, rounds: undefined, turns: 1}});
				}
			} else {
				// const effectData = 
				await ActiveEffect.create({
					label: game.i18n.localize( 'CoC7.InsanityName'),
					icon: 'systems/CoC7/artwork/icons/tentacles-skull.svg',
					origin: this.uuid,
					duration: {seconds: undefined, rounds: undefined, turns: 1},
					flags:{
						CoC7: {
							madness: true,
							indefinite: true
						}
					},
					// tint: '#ff0000',
					disabled: false
				}, this).create();
			}
			break;
		
		default:
			break;
		}
	}

	getStatus(statusName){
		if( !this.data.data.status ) return false;
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
			if( value.type == 'skill' && value.data.data.properties.firearm ) skillList.push( value);
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

	get cthulhuMythosSkill(){
		let skillList = this.getSkillsByName( game.i18n.localize(COC7.CthulhuMythosName));
		if( skillList.length != 0) return skillList[0];
		return null;
	}

	get cthulhuMythos(){
		const CM = this.cthulhuMythosSkill;
		if( CM){
			const value = CM.value;
			if( value) return value;
			return parseInt(CM.data.data.value);
		}
		return 0;
	}

	get mythosInsanityExperienced(){
		return this.getFlag( 'CoC7', 'mythosInsanityExperienced') || false;
	}

	async experienceFirstMythosInsanity(){
		await this.setFlag( 'CoC7', 'mythosInsanityExperienced', true);
	}

	get creditRating(){
		const CR = this.creditRatingSkill;
		if( CR){
			const value = CR.value;
			if( value) return value;
			return parseInt(CR.data.data.value);
		}
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
	}

	async cureMajorWound(){
		await this.unsetStatus(COC7.status.criticalWounds);
	}

	async fallProne(){
		await this.setStatus(COC7.status.prone);
	}

	async fallUnconscious(){
		await this.setStatus( COC7.status.unconscious);
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

	// static updateActor( actor, dataUpdate){
	// 	if( game.user.isGM){
	// 		// ui.notifications.info( `updating actor ${actor.name}`);
	// 		const prone = dataUpdate?.flags?.CoC7[COC7.status.prone];
	// 		const unconscious = dataUpdate?.flags?.CoC7[COC7.status.unconscious];
	// 		const criticalWounds = dataUpdate?.flags?.CoC7[COC7.status.criticalWounds];
	// 		const dying = dataUpdate?.flags?.CoC7[COC7.status.dying];
	// 		if( prone) ui.notifications.info( game.i18n.format('CoC7.InfoActorProne', {actor: actor.name}));
	// 		if( unconscious) ui.notifications.info( game.i18n.format('CoC7.InfoActorUnconscious', {actor: actor.name}));
	// 		if( criticalWounds) ui.notifications.info( game.i18n.format('CoC7.InfoActorMajorWound', {actor: actor.name}));
	// 		if( dying) ui.notifications.info( game.i18n.format('CoC7.InfoActorDying', {actor: actor.name}));
	// 	}
	// 	return;
	// }

	// "CoC7.InfoActorProne": "{actor} fall prone",
	// "CoC7.InfoActorUnconscious": "{actor} fall unconscious",
	// "CoC7.InfoActorMajorWound": "{actor} get a major wound",
	// "CoC7.InfoActorDying": "{acor} is dying",
	// "CoC7.InfoActorInjuried": "{actor} is injuried",

	// static updateToken( scene, token, dataUpdate){
	// 	const injuried = dataUpdate?.actorData?.flags?.CoC7?.injuried;
	// 	if( injuried) ui.notifications.info( game.i18n.format('CoC7.InfoActorInjuried', {actor: token.name}));
	// 	return;
	// }
}