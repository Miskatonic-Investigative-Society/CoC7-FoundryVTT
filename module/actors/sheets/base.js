import { RollDialog } from '../../apps/roll-dialog.js';
import { CoC7Check } from '../../check.js';
import { COC7 } from '../../config.js';
import { CoC7MeleeInitiator } from '../../chat/combat/melee-initiator.js';
import { CoC7RangeInitiator } from '../../chat/rangecombat.js';
import { CoC7DamageRoll } from '../../chat/damagecards.js';
import { CoC7ConCheck } from '../../chat/concheck.js';
import { chatHelper } from '../../chat/helper.js';
import { CoC7Parser } from '../../apps/parser.js';
import { SanDataDialog } from '../../apps/sandata-dialog.js';
import { SanCheckCard } from '../../chat/cards/san-check.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class CoC7ActorSheet extends ActorSheet {

	getData() {
		const data = super.getData();
		// console.log('*********************CoC7ActorSheet getdata***************');

		// game.user.targets.forEach(t => t.setTarget(false, {user: game.user, releaseOthers: false, groupSelection: true}));
		data.isToken = this.actor.isToken;
		data.itemsByType = {};
		data.skills = {};
		data.combatSkills = {};
		data.weapons = {};
		data.rangeWpn = [];
		data.meleeWpn = [];
		data.actorFlags = {};

		data.isGM = game.user.isGM;
		data.alowUnlock =
			game.settings.get( 'CoC7', 'playerUnlockSheetMode') == 'always' ||
			game.user.isGM ||
			(game.settings.get( 'CoC7', 'playerUnlockSheetMode') == 'creation' && game.settings.get( 'CoC7', 'charCreationEnabled'));
		if( game.settings.get( 'CoC7', 'playerUnlockSheetMode') == 'creation' && game.settings.get( 'CoC7', 'charCreationEnabled')) data['data.flags.locked'] = false;


		if( !data.data.characteristics) {
			data.data.characteristics =  {
				str: { value: null, short: 'CHARAC.STR', label: 'CHARAC.Strength', formula: null},
				con: { value: null,	short: 'CHARAC.CON', label: 'CHARAC.Constitution', formula: null },
				siz: { value: null, short: 'CHARAC.SIZ', label: 'CHARAC.Size', formula: null },
				dex: { value: null, short: 'CHARAC.DEX', label: 'CHARAC.Dexterity', formula: null },
				app: { value: null, short: 'CHARAC.APP', label: 'CHARAC.Appearance', formula: null },
				int: { value: null, short: 'CHARAC.INT', label: 'CHARAC.Intelligence', formula: null },
				pow: { value: null, short: 'CHARAC.POW', label: 'CHARAC.Power', formula: null },
				edu: { value: null, short: 'CHARAC.EDU', label: 'CHARAC.Education', formula: null }
			};
		}

		if( !data.data.attribs) {
			data.data.attribs = {
				hp: {value: null,max: null,short: 'HP',label: 'Hit points',auto: true},
				mp: {value: null,max: null,short: 'HP',label: 'Magic points',auto: true},
				lck: {value: null,short: 'LCK',label: 'Luck'},
				san: {value: null,max: 99,short: 'SAN',label: 'Sanity',auto: true},
				mov: {value: null,short: 'MOV',label: 'Movement rate',auto: true},
				db: {value: null,short: 'DB',label: 'Damage bonus',auto: true},
				build: {value: null,short: 'BLD',label: 'Build',auto: true},
				armor: {value: null,auto: false}
			};
		}

		if( !data.data.status){
			data.data.status = {
				criticalWounds: {type: 'Boolean',value: false},
				unconscious: {type: 'Boolean',value: false},
				dying: {type: 'Boolean',value: false},
				dead: {type: 'Boolean',value: false},
				prone: {type: 'Boolean',value: false},
				tempoInsane: {type: 'boolean',value: false},
				indefInsane: {type: 'boolean',value: false}
			};
		}

		if( !data.data.biography){
			data.data.biography = { personalDescription: { type: 'string', value: '' }};
		}

		if( !data.data.infos){
			data.data.infos = { occupation: '', age: '', sex: '', residence: '', birthplace: '', archetype: '', organization: '' };
		}

		if( !data.data.flags){
			data.data.flags = { locked: true, manualCredit: false };
		}

		if( !data.data.credit){
			data.data.credit = { monetarySymbol: null, multiplier: null, spent: null, assetsDetails: null};
		}

		if( !data.data.development){
			data.data.development = { personal: null, occupation: null, archetype: null};
		}

		if( !data.data.biography) data.data.biography = [];
		if( !data.data.encounteredCreatures) data.data.encounteredCreatures = [];


		data.isDead = this.actor.dead;
		data.isDying = this.actor.dying;
		data.isInABoutOfMadness = this.actor.isInABoutOfMadness;
		data.isInsane = this.actor.isInsane;
		data.boutOfMadness = this.actor.boutOfMadness;
		data.sanity = this.actor.sanity;


		data.pulpCharacter = game.settings.get('CoC7', 'pulpRules');

		if( data.items){
			for (const item of data.items) {
				//si c'est une formule et qu'on peut l'evaluer
				//ce bloc devrait etre déplacé dans le bloc _updateFormData
				if( item.type == 'skill'){
					if( item.data.properties.special){
						if( item.data.properties.fighting){
							if( item.data.specialization != game.i18n.localize('CoC7.FightingSpecializationName')){
								let itemToUpdate = this.actor.getOwnedItem( item._id);
								itemToUpdate.update( {'data.specialization' : game.i18n.localize('CoC7.FightingSpecializationName')});
								item.data.specialization =  game.i18n.localize('CoC7.FightingSpecializationName'); // TODO : Client with different language = recursive call when opening the same sheet.
							}
						}
						if( item.data.properties.firearm)
						{
							if( item.data.specialization != game.i18n.localize('CoC7.FirearmSpecializationName')){
								let itemToUpdate = this.actor.getOwnedItem( item._id);
								itemToUpdate.update( {'data.specialization' : game.i18n.localize('CoC7.FirearmSpecializationName')});
								item.data.specialization =  game.i18n.localize('CoC7.FirearmSpecializationName');
							}
						}
					}

					if( 'character' != this.actor.data.type){
						if( isNaN(Number(item.data.value))){
							let value = CoC7ActorSheet.parseFormula( item.data.value);
							try{
								value = Math.floor(eval(value));
							}
							catch(err){
								console.warn(`unable to parse formula :${item.data.value} for skill ${item.name}`);
								value = null;
							}

							if( value){
								item.data.value = value;
								let itemToUpdate = this.actor.getOwnedItem( item._id);
								itemToUpdate.update( {'data.value' : value});
							}
						}
					}
					else {
						let skill = this.actor.getOwnedItem( item._id);
						item.data.base = skill.base;
						// if( isNaN(Number(item.data.base))){
						// 	let value = CoC7ActorSheet.parseFormula( item.data.base);
						// 	try{
						// 		value = Math.floor(eval(value));
						// 	}
						// 	catch(err){
						// 		console.warn(`unable to parse formula :${item.data.base} for skill ${item.name}`);
						// 		value = null;
						// 	}

						// 	if( value){
						// 		item.data.base = value;
						// 	}
						// }

						if( item.data.value){
							const value = item.data.value;
							const exp = item.data.adjustments?.experience ? parseInt(item.data.adjustments.experience) : 0;
							let updatedExp = exp + parseInt( item.data.value) - skill.value;
							if( updatedExp <= 0) updatedExp = null;
							this.actor.updateEmbeddedEntity('OwnedItem', {
								_id: item._id,
								'data.adjustments.experience': updatedExp,
								'data.value': null
							});
							if( !item.data.adjustments) item.data.adjustments = {};
							item.data.adjustments.experience =  updatedExp;
							item.data.value = value;
						} else item.data.value = skill.value;
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
						lca = a.data.properties.special ? a.data.specialization.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() + a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
						lcb = b.data.properties.special ? b.data.specialization.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() + b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
					}
					else {
						lca = a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
						lcb = b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
					}
					if( lca < lcb) return -1;
					if( lca > lcb) return 1;
					return 0;
				});
			}



			//redondant avec matrice itembytype
			data.skills = data.items.filter( item => item.type == 'skill').sort((a, b) => {
				let lca;
				let lcb;
				if( a.data.properties && b.data.properties) {
					lca = a.data.properties.special ? a.data.specialization.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() + a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
					lcb = b.data.properties.special ? b.data.specialization.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() + b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
				}
				else {
					lca = a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
					lcb = b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
				}
				if( lca < lcb) return -1;
				if( lca > lcb) return 1;
				return 0;
			});

			data.meleeSkills = data.skills.filter( skill => skill.data.properties.combat == true && skill.data.properties.fighting == true);
			data.rangeSkills = data.skills.filter( skill => skill.data.properties.combat == true && skill.data.properties.firearm == true);

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
					weapon.usesAlternateSkill = weapon.data.properties.auto == true || weapon.data.properties.brst == true;
					if( !weapon.data.ammo) weapon.data.ammo = 0;

					weapon.skillSet = true;
					// weapon.data.skill.main.name = '';
					// weapon.data.skill.main.value = 0;
					// weapon.data.skill.alternativ.name = '';
					// weapon.data.skill.alternativ.value = 0;
					if( weapon.data.skill.main.id == '')
					{
						//TODO : si l'ID n'ests pas définie mais qu'un nom a été donné, utiliser ce nom et tanter de retrouver le skill
						weapon.skillSet = false;
					}
					else {
						//TODO : avant d'assiger le skill vérifier qu'il existe toujours.
						//si il n'existe plus il faut le retrouver ou passer skillset a false.
						if( data.combatSkills[weapon.data.skill.main.id]){
							const skill = this.actor.getOwnedItem( weapon.data.skill.main.id);
							weapon.data.skill.main.name = data.combatSkills[weapon.data.skill.main.id].name;
							weapon.data.skill.main.value = skill.value;
						} else {
							weapon.skillSet = false;
						}


						if( weapon.data.skill.alternativ.id != ''){
							if( data.combatSkills[weapon.data.skill.alternativ.id]){
								const skill = this.actor.getOwnedItem( weapon.data.skill.alternativ.id);
								weapon.data.skill.alternativ.name = data.combatSkills[weapon.data.skill.alternativ.id].name;
								weapon.data.skill.alternativ.value = skill.value;
							}
						}
					}

					weapon.data._properties = [];
					for( let [key, value] of Object.entries(COC7['weaponProperties']))
					{
						let property = {};
						property.id = key;
						property.name = value;
						property.value = true == weapon.data.properties[key];
						weapon.data._properties.push(property);
					}

					data.weapons[weapon._id] = weapon;
					if( weapon.data.properties.rngd) data.rangeWpn.push( weapon);
					else data.meleeWpn.push(weapon);

				}
			}

			const token = this.actor.token;
			data.tokenId = token ? `${token.scene._id}.${token.id}` : null;

			data.hasEmptyValueWithFormula = false;
			if( data.data.characteristics){
				for ( const characteristic of Object.values(data.data.characteristics)){
					if( !characteristic.value) characteristic.editable = true;
					characteristic.hard = Math.floor( characteristic.value / 2);
					characteristic.extreme = Math.floor( characteristic.value / 5);

					//If no value && no formula don't display charac.
					if( !characteristic.value && !characteristic.formula) characteristic.display = false;
					else characteristic.display = true;

					//if any characteristic has no value but has a formula.
					if( !characteristic.value && characteristic.formula) characteristic.hasEmptyValueWithFormula = true;

					data.hasEmptyValueWithFormula = data.hasEmptyValueWithFormula || characteristic.hasEmptyValueWithFormula;
				}
			}
		}

		//For compat with previous characters test if auto is definied, if not we define it
		let auto = this.actor.checkUndefinedAuto();
		data.data = mergeObject( data.data, auto);

		
		data.data.attribs.mov.value = this.actor.mov; //return computed values or fixed values if not auto.
		data.data.attribs.db.value = this.actor.db;
		data.data.attribs.build.value = this.actor.build; 
		

		if( data.data.attribs.hp.value < 0) data.data.attribs.hp.value = null;
		if( data.data.attribs.mp.value < 0) data.data.attribs.mp.value = null;
		if( data.data.attribs.san.value < 0) data.data.attribs.san.value = null;

		if( data.data.attribs.hp.auto ){
			//TODO if any is null set max back to null.
			if ( data.data.characteristics.siz.value != null && data.data.characteristics.con.value != null)
				data.data.attribs.hp.max = this.actor.hpMax;
		}

		if( data.data.attribs.mp.auto ){
			//TODO if any is null set max back to null.
			if( data.data.characteristics.pow.value != null) data.data.attribs.mp.max = Math.floor( data.data.characteristics.pow.value / 5);
		}

		if( data.data.attribs.san.auto){
			data.data.attribs.san.max = this.actor.sanMax;
		}

		if( data.data.attribs.mp.value > data.data.attribs.mp.max || data.data.attribs.mp.max == null) data.data.attribs.mp.value = data.data.attribs.mp.max;
		if( data.data.attribs.hp.value > data.data.attribs.hp.max || data.data.attribs.hp.max == null) data.data.attribs.hp.value = data.data.attribs.hp.max;

		if( data.data.attribs.hp.value == null && data.data.attribs.hp.max != null) data.data.attribs.hp.value = data.data.attribs.hp.max;
		if( data.data.attribs.mp.value == null && data.data.attribs.mp.max != null) data.data.attribs.mp.value = data.data.attribs.mp.max;

		if( data.data.attribs.san.value == null && data.data.characteristics.pow.value != null) data.data.attribs.san.value = data.data.characteristics.pow.value;
		if( data.data.attribs.san.value > data.data.attribs.san.max) data.data.attribs.san.value = data.data.attribs.san.max;

		if( data.data.biography instanceof Array && data.data.biography.length){
			data.data.biography[0].isFirst = true;
			data.data.biography[data.data.biography.length - 1].isLast = true;
		}

		data.data.indefiniteInsanityLevel = {};
		data.data.indefiniteInsanityLevel.value = data.data.attribs.san.dailyLoss ? data.data.attribs.san.dailyLoss:0;
		data.data.indefiniteInsanityLevel.max = Math.floor( data.data.attribs.san.value/5);

		data.hasInventory = Object.prototype.hasOwnProperty.call( data.itemsByType, 'item') || Object.prototype.hasOwnProperty.call( data.itemsByType, 'book') || Object.prototype.hasOwnProperty.call( data.itemsByType, 'spell');

		// const first = data.data.biography[0];
		// first.isFirst = true;
		// data.data.biography[0] = first;
		// const last = data.data.biography[data.data.biography.length - 1];
		// last.isLast = true;
		// data.data.biography[data.data.biography.length - 1] = last;
		return data;
		
	}


	/* -------------------------------------------- */
	static parseFormula( formula){
		let parsedFormula = formula;
		for( let [key, value] of Object.entries(COC7.formula.actorsheet)){
			parsedFormula = parsedFormula.replace( key, value);
		}
		return parsedFormula;
	}

	get tokenKey(){
		if( this.token) return `${this.token.scene._id}.${this.token.data._id}`;
		return this.actor.id;
	}

	onCloseSheet(){
		//this.actor.locked = true;
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

			html.find('.characteristic-label').on( 'dragstart', (event)=> this._onDragCharacteristic(event));
			html.find('.attribute-label').on( 'dragstart', (event)=> this._onDragAttribute(event));
			html.find('.san-check').on( 'dragstart', (event)=> this._onDragSanCheck(event));


			html.find('.characteristic-label').click(this._onRollCharacteriticTest.bind(this));
			html.find('.skill-name.rollable').click(this._onRollSkillTest.bind(this));
			html.find('.skill-image').click(this._onRollSkillTest.bind(this));
			html.find('.attribute-label.rollable').click(this._onRollAttribTest.bind(this));
			html.find('.lock').click(this._onLockClicked.bind(this));
			html.find('.flag').click(this._onFlagClicked.bind(this));
			html.find('.formula').click(this._onFormulaClicked.bind(this));
			html.find('.roll-characteritics').click(this._onRollCharacteriticsValue.bind(this));
			html.find('.average-characteritics').click(this._onAverageCharacteriticsValue.bind(this));
			html.find('.toggle-switch').click( this._onToggle.bind(this));
			html.find('.auto-toggle').click( this._onAutoToggle.bind(this));

			// Status monitor
			if( game.user.isGM || game.settings.get('CoC7', 'statusPlayerEditable')) {
				html.find('.reset-counter').click( this._onResetCounter.bind(this));
				html.find('.status-monitor').click( this._onStatusToggle.bind(this));
				html.find('.is-dying').click( this.heal.bind(this));
				html.find('.is-dead').click( this.revive.bind(this));
			}

			html.find('.dying-check').click( this.checkForDeath.bind(this));


			html.find('.item .item-image').click(event => this._onItemRoll(event));
			html.find('.weapon-name.rollable').click( event => this._onWeaponRoll(event));
			html.find('.weapon-skill.rollable').click( event => this._onWeaponSkillRoll(event));
			html.find('.reload-weapon').click( event => this._onReloadWeapon(event));
			html.find('.reload-weapon').on( 'contextmenu', event => this._onReloadWeapon(event));
			html.find('.add-ammo').click( this._onAddAmo.bind(this));
			html.find('.read-only').dblclick(this._toggleReadOnly.bind(this));
			html.on('click', '.weapon-damage', this._onWeaponDamage.bind(this));

			html.find( '.inventory-header').click( this._onInventoryHeader.bind(this));
			html.find( '.section-header').click( this._onSectionHeader.bind(this));


			const wheelInputs = html.find('.attribute-value');
			for( let wheelInput of wheelInputs){
				wheelInput.addEventListener('wheel', event => this._onWheel(event));
			}
		}

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		html.find('.show-detail').click(event => this._onItemSummary(event));
		html.find('.item-popup').click( this._onItemPopup.bind(this));

		// Update Inventory Item
		html.find('.item-edit').click(ev => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.getOwnedItem(li.data('itemId'));
			item.sheet.render(true);
		});

		// Delete Inventory Item
		html.find('.item-delete').click(ev => {
			const li = $(ev.currentTarget).parents('.item');
			this.actor.deleteOwnedItem(li.data('itemId'));
			li.slideUp(200, () => this.render(false));
		});

		html.find('.add-item').click( ev => {
			switch( ev.currentTarget.dataset.type){
			case 'skill':
				this.actor.createEmptySkill( ev);
				break;
			case 'item':
				this.actor.createEmptyItem( ev);
				break;
			case 'weapon':
				this.actor.createEmptyWeapon( ev);
				break;
			}
		});

		html.find('.add-new-section').click( () => {this.actor.createBioSection();});

		html.find('.delete-section').click( ev => {
			const index = parseInt(ev.currentTarget.closest('.bio-section').dataset.index);
			this.actor.deleteBioSection( index);
		});

		html.find('.move-section-up').click( ev => {
			const index = parseInt(ev.currentTarget.closest('.bio-section').dataset.index);
			this.actor.moveBioSectionUp( index);
		});

		html.find('.move-section-down').click( ev => {
			const index = parseInt(ev.currentTarget.closest('.bio-section').dataset.index);
			this.actor.moveBioSectionDown( index);
		});

		html.find('.development-flag').dblclick( ev=> {
			const item = this.actor.getOwnedItem( ev.currentTarget.closest('.item').dataset.itemId);
			item.toggleItemFlag( 'developement');
		});

		html.find('.occupation-skill-flag.clickable').click( ev=> {
			const item = this.actor.getOwnedItem( ev.currentTarget.closest('.item').dataset.itemId);
			item.toggleItemFlag( 'occupation');
		});

		html.find('.archetype-skill-flag.clickable').click( ev=> {
			const item = this.actor.getOwnedItem( ev.currentTarget.closest('.item').dataset.itemId);
			item.toggleItemFlag( 'archetype');
		});

		html.find('.skill-developement').click( event =>{
			this.actor.developementPhase( event.shiftKey);
		});

		html.find('a.coc7-link').on( 'click', (event)=> CoC7Parser._onCheck(event));
		html.find('a.coc7-link').on( 'dragstart', (event)=> CoC7Parser._onDragCoC7Link(event));

		html.find('.test-trigger').click( async event =>{
			// const val = getProperty( this.actor, 'data.data.attribs.san.value');

			// this.actor.enterBoutOfMadness( true, 10);

			const roll = new CoC7Check();
			roll.actor = this.actorKey;
			roll.attribute = 'san';
			roll.difficulty = this.options.sanDifficulty || CoC7Check.difficultyLevel.regular;
			roll.diceModifier = this.options.sanModifier || 0;
			await roll._perform();



			for (const effect of this.actor.effects) {
				await effect.sheet.render(true);				
				// effect.delete();				
			}
			// this.actor.effects.forEach( e => e.delete());
			// await setProperty( this.actor, 'data.data.encounteredCreatures', []);

			// await this.actor.update( {['data.encounteredCreatures'] : []});
			if( event.shiftKey) ui.notifications.info( 'Shift cliecked');
			// SanCheckCard.create( this.actor.actorKey, {min:'1D10',max:'1D12'}, {fastForward:event.shiftKey});
		});
	}

	_onDragCharacteristic(event){
		const box = event.currentTarget.parentElement;
		const data = {
			linkType: 'coc7-link',
			check: 'check',
			type: 'characteristic',
			name: box.dataset.characteristic,
			icon: null
		};

		event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data));
	}

	_onDragAttribute(event){
		const box = event.currentTarget.parentElement;
		const data = {
			linkType: 'coc7-link',
			check: 'check',
			type: 'attribute',
			name: box.dataset.attrib,
			icon: null
		};
		
		event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data));
	}

	_onDragSanCheck(event){
		const sanMin = event.currentTarget.querySelector('.san-value.pass');
		const sanMax = event.currentTarget.querySelector('.san-value.failed');
		const data = {
			linkType: 'coc7-link',
			check: 'sanloss',
			sanMin: sanMin.innerText,
			sanMax: sanMax.innerText,
			icon: null
		};

		event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(data));
	}

	async _onDrop(event){
		super._onDrop(event);
	}

	async _onStatusToggle(event){
		event.preventDefault();
		if( event.currentTarget.dataset.status){
			await this.actor.toggleStatus( event.currentTarget.dataset.status);
		} else if( event.currentTarget.dataset.effect){
			await this.actor.toggleEffect( event.currentTarget.dataset.effect);
		}

	}

	async revive(){
		if( game.user.isGM) this.actor.unsetStatus(COC7.status.dead);
	}

	async heal(){
		if( game.user.isGM) this.actor.unsetStatus(COC7.status.dying);
	}

	async checkForDeath(event){
		const conCheck = new CoC7ConCheck( this.actor.isToken? this.actor.tokenKey : this.actor._id);
		conCheck.stayAlive = true;
		conCheck.toMessage(event.shiftKey);
	}

	async _onResetCounter( event){
		event.preventDefault();
		const counter = event.currentTarget.dataset.counter;
		if( counter) this.actor.resetCounter( counter);
	}

	async _onAutoToggle( event){
		if( event.currentTarget.closest('.attribute')){
			const attrib = event.currentTarget.closest('.attribute').dataset.attrib;
			this.actor.toggleAttribAuto( attrib);
		}
	}

	async _onToggle( event){
		let weapon = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.itemId);
		if( weapon){
			weapon.toggleProperty(event.currentTarget.dataset.property, (event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224));
		}
	}
	

	// roll the actor characteristic from formula when possible.
	async _onRollCharacteriticsValue(){
		this.actor.rollCharacteristicsValue();
	}

	async _onAverageCharacteriticsValue(){
		this.actor.averageCharacteristicsValue();
	}

	async _onLockClicked( event){
		event.preventDefault();
		const isLocked = this.actor.locked;
		this.actor.locked = isLocked ? false : true;
	}

	async _onFlagClicked( event){
		event.preventDefault();
		const flagName = event.currentTarget.dataset.flag;
		this.actor.toggleActorFlag( flagName);
	}

	async _onFormulaClicked( event){
		event.preventDefault();
		this.actor.toggleActorFlag( 'displayFormula');
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
		case 'data.attribs.hp.value':
			this.actor.setHp( value);
			break;
		case 'data.attribs.mp.value':
			this.actor.setMp( value);
			break;
		case 'data.attribs.san.value':
			this.actor.setSan( value);
			break;
		case 'data.attribs.lck.value':
			this.actor.setLuck( value);
			break;
		}
	}

	_toggleReadOnly( event) {
		event.currentTarget.readOnly = event.currentTarget.readOnly ? false : true;
		event.currentTarget.classList.toggle( 'read-only');
	}

	_onItemSummary(event) {
		event.preventDefault();
		let li = $(event.currentTarget).parents('.item'),
			item = this.actor.getOwnedItem(li.data('item-id')),
			chatData = item.getChatData({secrets: this.actor.owner, owner: this.actor});


		// Toggle summary
		if ( li.hasClass('expanded') ) {
			let summary = li.children('.item-summary');
			summary.slideUp(200, () => summary.remove());
		} else {
			let div = $('<div class="item-summary"></div>');

			let labels = $('<div class="item-labels"></div>');
			chatData.labels.forEach(p => labels.append(`<div class="item-label"><span class="label-name">${p.name} :</span><span class="label-value">${p.value}</span></div>`));
			div.append(labels);

			div.append($(`<div class="item-description">${chatData.description.value}</div>`));

			if( item.data.data.properties?.spcl){
				let specialDiv = $(`<div class="item-special">${chatData.description.special}</div>`);
				div.append(specialDiv);
			}

			let props = $('<div class="item-properties"></div>');
			chatData.properties.forEach(p => props.append(`<div class="tag item-property">${game.i18n.localize(p)}</div>`));
			div.append(props);

			li.append(div.hide());
			CoC7Parser.bindEventsHandler(div);
			div.slideDown(200);
		}
		li.toggleClass('expanded');
		// $(event.currentTarget).toggleClass('expanded');
	}

	_onSectionHeader(event){
		event.preventDefault();
		let section = $(event.currentTarget).parents('section'),
			pannelClass = $(event.currentTarget).data('pannel'),
			pannel = section.find( `.${pannelClass}`);
		pannel.toggle();
		// if( pannel.hasClass('expanded'))
		// 	pannel.slideUp(200);
		// else
		// 	pannel.slideDown(200);
		// pannel.toggleClass('expanded');		
	}

	_onInventoryHeader(event){
		event.preventDefault();
		let li = $(event.currentTarget).parents('.inventory-section'),
			details = li.find('ol');
		details.toggle();
	}

	async _onItemPopup(event) {
		event.preventDefault();
		let li = $(event.currentTarget).parents('.item'),
			item = this.actor.getOwnedItem(li.data('item-id'));
		
		CoC7ActorSheet.popupSkill( item);
	}

	static async popupSkill(skill){
		skill.data.data.description.enrichedValue = TextEditor.enrichHTML( skill.data.data.description.value);
		// game.CoC7.enricher( skill.data.data.description.enrichedValue);
		const dlg = new Dialog({
			title: game.i18n.localize('CoC7.SkillDetailsWindow'),
			content: skill,
			buttons:{},
			close: () => {return;}
		},{
			classes: ['coc7', 'sheet', 'skill'],
			width: 520,
			height: 480,
			scrollY: ['.item-description'],
			template: 'systems/CoC7/templates/apps/skill-details.html'
		});
		dlg.render(true);
	}


	/**
	 * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
	 * @private
	*/
	async _onItemRoll(event) {
		event.preventDefault();
		// const itemId = event.currentTarget.closest('.item').dataset.itemId;
		// const actorId = event.currentTarget.closest('form').dataset.actorId;
		// const tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		// let check = new CoC7Check();

		// check.actor = !tokenKey ? actorId : tokenKey;
		// check.item = itemId;
		// check.roll();
		// check.toMessage();
	}

	async _onWeaponRoll(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest('li').dataset.itemId;
		const fastForward = event.shiftKey;
		const weapon = this.actor.getOwnedItem(itemId);
		const actorKey = !this.token? this.actor.actorKey : `${this.token.scene._id}.${this.token.data._id}`;

		if((event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224) && game.user.isGM){
			const linkData = {
				check: 'item',
				type: 'weapon',
				name: weapon.name
			};
			const link = CoC7Parser.createCoC7Link(linkData);
			if( link) chatHelper.createMessage(game.i18n.localize('CoC7.MessageWaitForKeeperToClick'), link);
		} else{
			if( !weapon.data.data.properties.rngd){
				if( game.user.targets.size > 1){
					ui.notifications.warn(game.i18n.localize('CoC7.WarnTooManyTarget'));
				}

				const card = new CoC7MeleeInitiator( actorKey, itemId, fastForward);
				card.createChatCard();
			}
			if( weapon.data.data.properties.rngd){
				const card = new CoC7RangeInitiator( actorKey, itemId, fastForward);
				card.createChatCard();
			}
		}
	}

	async _onReloadWeapon(event){
		const itemId = event.currentTarget.closest('.item') ? event.currentTarget.closest('.item').dataset.itemId : null;
		if( !itemId) return;
		const weapon = this.actor.getOwnedItem( itemId);
		if( 0 == event.button){
			if( event.shiftKey) await weapon.reload();
			else await weapon.addBullet();
		} else if( 2 == event.button)
		{
			if( event.shiftKey) await weapon.setBullets(0);
			else await weapon.shootBullets(1);
		}
	}

	async _onAddAmo(event){
		const itemId = event.currentTarget.closest('.item') ? event.currentTarget.closest('.item').dataset.itemId : null;
		if( !itemId) return;
		const weapon = this.actor.getOwnedItem( itemId);
		await weapon.addBullet();
	}

	async _onWeaponSkillRoll(event) {
		event.preventDefault();
		const skillId = event.currentTarget.dataset.skillId;
		const actorId = event.currentTarget.closest('form').dataset.actorId;
		let tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		const itemId = event.currentTarget.closest('li') ? event.currentTarget.closest('li').dataset.itemId : null;

		let check = new CoC7Check();		
		
		if( ! event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				check.diceModifier = usage.get('bonusDice');
				check.difficulty = usage.get('difficulty');
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

	async _onWeaponDamage( event){
		event.preventDefault();
		const itemId = event.currentTarget.closest('.weapon').dataset.itemId;
		const range = event.currentTarget.closest('.weapon-damage').dataset.range;
		const rollCard = new CoC7DamageRoll( itemId, this.actor.tokenKey, null, event.shiftKey);
		rollCard.rollDamage( range);
		// console.log( 'Weapon damage Clicked');
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

		let difficulty, modifier;
		if( !event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				modifier = Number(usage.get('bonusDice'));
				difficulty = Number(usage.get('difficulty'));
			}
		}

		if((event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224) && game.user.isGM){
			const linkData = {
				check: 'check',
				type: 'characteristic',
				name: characteristic
			};
			if( 'blindroll' === game.settings.get('core', 'rollMode')) linkData.blind = true;
			if( undefined != modifier) linkData.modifier = modifier;
			if( undefined != difficulty) linkData.difficulty = difficulty;
			const link = CoC7Parser.createCoC7Link(linkData);
			if( link) chatHelper.createMessage(game.i18n.localize('CoC7.MessageWaitForKeeperToClick'), link);
		} else {
			let check = new CoC7Check();	
			if( undefined != modifier ) check.diceModifier = modifier;
			if( undefined != difficulty ) check.difficulty = difficulty;
			check.actor = !tokenKey ? actorId : tokenKey;
			check.rollCharacteristic(characteristic );
			check.toMessage();
		}
	}

	async _onRollAttribTest( event){
		event.preventDefault();

		const attrib = event.currentTarget.parentElement.dataset.attrib;
		if( attrib === 'db'){
			if( !/^-{0,1}\d+$/.test(event.currentTarget.parentElement.dataset.rollFormula)){
				const r=new Roll(event.currentTarget.parentElement.dataset.rollFormula);
				r.roll();
				if( !isNaN(r.total) && !(r.total === undefined)){
					r.toMessage({
						speaker: ChatMessage.getSpeaker(),
						flavor: game.i18n.localize('CoC7.BonusDamageRoll')
					});
				}
			}
			return;
		}

		if( attrib === 'lck'){
			if( !this.actor.data.data.attribs.lck.value) return; //If luck is null, 0 or non defined stop there.
		}

		const actorId = event.currentTarget.closest('form').dataset.actorId;
		let tokenKey = event.currentTarget.closest('form').dataset.tokenId;

		let difficulty, modifier;
		if( !event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				modifier = Number(usage.get('bonusDice'));
				difficulty = Number(usage.get('difficulty'));
			}
		}

		let sanMin, sanMax;
		if( event.altKey && attrib == 'san'){
			const sanData = await SanDataDialog.create();
			if( sanData){
				sanMin = sanData.get( 'sanMin')||0;
				sanMax = sanData.get( 'sanMax')||0;
				if( !isNaN(Number(sanMin))) sanMin=Number(sanMin);
				if( !isNaN(Number(sanMax))) sanMax=Number(sanMax);
			}
		}

		const isSanCheck = undefined != sanMin && undefined != sanMax;

		if((event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224) && game.user.isGM && ['lck', 'san'].includes(attrib)){
			const linkData = isSanCheck?
				{
					check: 'sanloss',
					sanMax: sanMax,
					sanMin: sanMin
				}:{
					check: 'check',
					type: 'attribute',
					name: attrib
				};
			if( 'blindroll' === game.settings.get('core', 'rollMode')) linkData.blind = true;
			if( undefined != modifier) linkData.modifier = modifier;
			if( undefined != difficulty) linkData.difficulty = difficulty;
			const link = CoC7Parser.createCoC7Link(linkData);
			if( link) {
				chatHelper.createMessage(game.i18n.localize('CoC7.MessageWaitForKeeperToClick'), link);
				return;
			}
		}

		if( isSanCheck){
			SanCheckCard.create( this.actor.actorKey, {sanMin: sanMin, sanMax: sanMax}, { sanModifier: modifier,sanDifficulty: difficulty,fastForward:event.shiftKey});
		} else {
			let check = new CoC7Check();
			if( undefined != modifier ) check.diceModifier = modifier;
			if( undefined != difficulty ) check.difficulty = difficulty;
			check.actor = !tokenKey ? actorId : tokenKey;
			check.rollAttribute(attrib );
			check.toMessage();
		}
	}


	/**
	 * Handle rolling a Skill check
	 * @param {Event} event   The originating click event
	 * @private
	*/
	async _onRollSkillTest(event) {
		if( event.currentTarget.classList.contains('flagged4dev')) return;
		event.preventDefault();
		const skillId = event.currentTarget.closest('.item').dataset.skillId;
		const actorId = event.currentTarget.closest('form').dataset.actorId;
		const tokenKey = event.currentTarget.closest('form').dataset.tokenId;
		
		let difficulty, modifier;
		if( !event.shiftKey) {
			const usage = await RollDialog.create();
			if( usage) {
				modifier = Number(usage.get('bonusDice'));
				difficulty = Number(usage.get('difficulty'));
			}
		}

		if((event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224) && game.user.isGM){
			const name = this.actor.items.get(skillId)?.name;
			if( !name) return;
			const linkData = {
				check: 'check',
				type: 'skill',
				name: name
			};
			if( 'blindroll' === game.settings.get('core', 'rollMode')) linkData.blind = true;
			if( undefined != modifier) linkData.modifier = modifier;
			if( undefined != difficulty) linkData.difficulty = difficulty;
			const link = CoC7Parser.createCoC7Link(linkData);
			if( link) chatHelper.createMessage(game.i18n.localize('CoC7.MessageWaitForKeeperToClick'), link);
		} else {
			let check = new CoC7Check();		
			if( undefined != modifier ) check.diceModifier = modifier;
			if( undefined != difficulty ) check.difficulty = difficulty;
			check.actor = !tokenKey ? actorId : tokenKey;
			check.skill = skillId;
			check.roll();
			check.toMessage();
		}
	}
	


	/* -------------------------------------------- */

	/**
	 * Implement the _updateObject method as required by the parent class spec
	 * This defines how to update the subject of the form when the form is submitted
	 * @private
	*/

	async _updateObject(event, formData) {
		// ui.notifications.info('_updateObject');
		if( event.currentTarget){
			if( event.currentTarget.classList){

				if( event.currentTarget.classList.contains('skill-adjustment')){
					let item = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.itemId);
					if( item){
						const value = event.currentTarget.value? parseInt(event.currentTarget.value) : null;

						if( !event.currentTarget.value) await item.update( {[event.currentTarget.name]: null});
						else{
							if( !isNaN(value)) await item.update( {[event.currentTarget.name]: value});
						}
						if( game.i18n.localize(COC7.creditRatingSkillName) == item.name){
							const creditValue = value ? value : 0;
							if( creditValue > Number(this.actor.occupation.data.data.creditRating.max) || creditValue <  Number(this.actor.occupation.data.data.creditRating.min))
								ui.notifications.warn( game.i18n.format( 'CoC7.CreditOutOfRange', { min :Number(this.actor.occupation.data.data.creditRating.min), max:Number(this.actor.occupation.data.data.creditRating.max)}));
						}
					}
				}

				if( event.currentTarget.classList.contains('attribute-value'))
				{
					//TODO : check why SAN only ?
					if( 'data.attribs.san.value' === event.currentTarget.name)
					{
						this.actor.setSan(parseInt( event.currentTarget.value));
						return;
					}
				}

				if( event.currentTarget.classList.contains('text-area')){
					this.actor.updateTextArea( event.currentTarget);
					return;
				}

				if( event.currentTarget.classList.contains('bio-section-value')){
					const index = parseInt(event.currentTarget.closest('.bio-section').dataset.index);
					this.actor.updateBioValue( index, event.currentTarget.value);
				}

				if( event.currentTarget.classList.contains('bio-section-title')){
					const index = parseInt(event.currentTarget.closest('.bio-section').dataset.index);
					this.actor.updateBioTitle( index, event.currentTarget.value);
				}

				if( event.currentTarget.classList.contains('npc-skill-score')){
					let skill = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.skillId);
					if( skill){
						await skill.updateValue( event.currentTarget.value);
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
						if( isNaN(r.total) || (typeof(r.total) == 'undefined')){
							ui.notifications.error(game.i18n.format('CoC7.ErrorInvalidFormula', {value : event.currentTarget.value}));
							formData[event.currentTarget.name] = game.i18n.format('CoC7.ErrorInvalid');
						}
					}
				}

				if( event.currentTarget.classList.contains('attribute-value')){
					//tester si le db retourné est valide.
					if( event.currentTarget.value.length != 0 && event.currentTarget.closest('.attribute').dataset.attrib == 'db'){
						//On teste si c'est une formule valide !
						let r = new Roll( event.currentTarget.value);
						r.roll();
						if( isNaN(r.total) || (r.total === undefined)){
							ui.notifications.error(game.i18n.format('CoC7.ErrorInvalidFormula', {value : event.currentTarget.value}));
							formData[event.currentTarget.name] = game.i18n.format('CoC7.ErrorInvalid');
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
						case 'main':
							await weapon.update( {'data.skill.main.id': skill.id, 'data.skill.main.name': skill.name});
							break;
						case 'alternativ':
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
				if( event.currentTarget.classList.contains('damage-formula')){
					let weapon = this.actor.getOwnedItem( event.currentTarget.closest('.item').dataset.itemId);
					if( weapon){
						//teste la validité de la formule.
						if( event.currentTarget.value.length != 0){
							let r = new Roll( event.currentTarget.value);
							r.roll();
							if( isNaN(r.total) || (typeof(r.total) == 'undefined')){
								ui.notifications.error( event.currentTarget.value + ' is not a valid formula');
							}
							else
							{
								switch( event.currentTarget.dataset.range){
								case 'normal':
									await weapon.update( {'data.range.normal.damage': event.currentTarget.value});
									break;
								case 'long':
									await weapon.update( {'data.range.long.damage': event.currentTarget.value});
									break;
								case 'extreme':
									await weapon.update( {'data.range.extreme.damage': event.currentTarget.value});
									break;
								}
							}
						}
						else  {
							switch( event.currentTarget.dataset.range){
							case 'normal':
								await weapon.update( {'data.range.normal.damage': null});
								break;
							case 'long':
								await weapon.update( {'data.range.long.damage': null});
								break;
							case 'extreme':
								await weapon.update( {'data.range.extreme.damage': null});
								break;
							}
						}
					}
				}
				
			}
		}
		return this.object.update(formData);
	}
}
