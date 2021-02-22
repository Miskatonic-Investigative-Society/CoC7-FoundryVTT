import { CoC7Parser } from '../apps/parser.js';
import { COC7 } from '../config.js';

/**
 * Override and extend the basic :class:`Item` implementation
 */
export class CoC7Item extends Item {
	// /** @override */
	// prepareEmbeddedEntities() {
	// }
	

	/**
   * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @return {Promise}
   */
	// DEPRECATED
	// async roll() {
	// 	const token = this.actor.token;
	// 	const templateData = {
	// 		actor: this.actor,
	// 		tokenId: token ? `${token.scene._id}.${token.id}` : null,
	// 		item: this.data
	// 	};

	// 	const template = 'systems/CoC7/templates/chat/skill-card.html';
	// 	const html = await renderTemplate(template, templateData);
				
	// 	// TODO change the speaker for the token name not actor name
	// 	const speaker = ChatMessage.getSpeaker({actor: this.actor});
	// 	if( token) speaker.alias = token.name;

	// 	await ChatMessage.create({
	// 		user: game.user._id,
	// 		speaker,
	// 		content: html
	// 	});
	// }

	static flags = {
		malfunction: 'malfc'
	}

	/**
	 * Toggle on of the item property in data.data.properties
	 * @param {String} propertyId : name for the property to toggle
	 */	
	async toggleProperty( propertyId, override = false){
		let checkedProps = {};
		let fighting;
		let firearms;
		if( 'weapon' === this.type && !override ){

			if( 'ahdb' === propertyId){
				if( !this.data.data.properties.ahdb){
					checkedProps = {
						'data.properties.ahdb': true,
						'data.properties.addb': false
					};
				} else {
					checkedProps = {
						'data.properties.ahdb': false
					};
				}
			}

			if( 'addb' === propertyId){
				if( !this.data.data.properties.addb){
					checkedProps = {
						'data.properties.addb': true,
						'data.properties.ahdb': false
					};
				} else {
					checkedProps = {
						'data.properties.addb': false
					};
				}
			}

			if( 'shotgun' === propertyId){
				if( !this.data.data.properties.shotgun){
					checkedProps = {
						'data.properties.rngd': true,
						'data.properties.melee': false,
						'data.properties.shotgun': true
					};
				} else {
					checkedProps = {
						'data.properties.shotgun': false,
						'data.range.extreme.value': null,
						'data.range.extreme.damage': null,
						'data.range.long.value': null,
						'data.range.long.damage': null
					};
				}
			}

			if( 'melee' === propertyId || 'rngd' === propertyId){
				let meleeWeapon;
				if( 'melee' === propertyId && !this.data.data.properties.melee) meleeWeapon = true;
				if( 'melee' === propertyId && this.data.data.properties.melee) meleeWeapon = false;
				if( 'rngd' ===  propertyId && !this.data.data.properties.rngd) meleeWeapon = false;
				if( 'rngd' ===  propertyId && this.data.data.properties.rngd) meleeWeapon = true;
				if( meleeWeapon) {
					checkedProps = {
						'data.properties.melee': true,
						'data.properties.rngd': false,
						'data.properties.shotgun': false,
						'data.properties.brst': false,
						'data.properties.auto':false,
						'data.properties.dbrl':false
					};
				} else {
					checkedProps = {
						'data.properties.melee': false,
						'data.properties.rngd': true
					};				
				}
			}
		}

		if( 'skill' == this.type && !override){
			let modif = false;
			if( 'combat' ==  propertyId) {
				if( !this.data.data.properties.combat){
					//Close combat by default
					if( !this.data.data.properties.firearm){
						fighting = true;
					} else firearms = true;

				}else{
					checkedProps = {
						'data.properties.combat': false,
						'data.properties.special': false,
						'data.properties.fighting': false,
						'data.properties.firearm': false,
						'data.specialization': null
					};
				}
				modif = true;
			}

			if( 'fighting' == propertyId){
				if( !this.data.data.properties.fighting){
					firearms = false;
					fighting = true;
				}else{
					firearms = true;
					fighting = false;
				}
				modif = true;
			}

			if( 'firearm' == propertyId){
				if( !this.data.data.properties.firearm){
					firearms = true;
					fighting = false;
				}else{
					firearms = false;
					fighting = true;
				}
				modif = true;
			}

			if( modif){
				//set specialisation if fighting or firearm
				if(fighting){
					checkedProps = {
						'data.properties.fighting': true,
						'data.properties.firearm': false,
						'data.properties.combat': true,
						'data.properties.special': true,
						'data.specialization': game.i18n.localize(COC7.fightingSpecializationName)
					};
				}
				
				if(firearms){
					checkedProps = {
						'data.properties.fighting': false,
						'data.properties.firearm': true,
						'data.properties.combat': true,
						'data.properties.special': true,
						'data.specialization': game.i18n.localize(COC7.firearmSpecializationName)
					};
				}
			}
		}

		if(Object.keys(checkedProps).length > 0){
			const item = await this.update( checkedProps);
			return item;
		} 
		else {
			const propName = `data.properties.${propertyId}`;
			const propValue = !this.data.data.properties[propertyId];
			this.update( {[propName]: propValue}).then( item => { return item;});
		}
	}

	hasProperty( propertyId){
		return this.isIncludedInSet( 'properties', propertyId);
	}

	get name() {
		if( 'skill' != this.type || !this.data.data?.properties?.special) return super.name;
		if( this.data.name.toLowerCase().includes( this.data.data.specialization?.toLowerCase())) return super.name;
		return `${this.data.data.specialization} (${this.data.name})`;
	}

	static getNameWithoutSpec( item){
		if( item instanceof CoC7Item){
			if( item.data.data?.properties?.special){
				const specNameRegex = new RegExp(item.data.data.specialization, 'ig');
				const filteredName = item.name.replace( specNameRegex, '').trim().replace(/^\(+|\)+$/gm,'');
				return filteredName.length?filteredName:item.name;
			}
		} else {
			if( item.data.properties?.special){
				const specNameRegex = new RegExp(item.data.specialization, 'ig');
				const filteredName =  item.name.replace( specNameRegex, '').trim().replace(/^\(+|\)+$/gm,'');
				return filteredName.length?filteredName:item.name;
			}
		}
		return item.name;
	}

	static isAnySpec( item){
		if( item instanceof CoC7Item){
			if( 'skill' != item.type || !item.data.data.properties?.special) return false;
			return( CoC7Item.getNameWithoutSpec(item).toLowerCase() == game.i18n.localize('CoC7.AnySpecName').toLowerCase());
		} else { //Assume it's data only
			if( 'skill' != item.type || !item.data.properties?.special) return false;
			return( CoC7Item.getNameWithoutSpec(item).toLowerCase() == game.i18n.localize('CoC7.AnySpecName').toLowerCase());
		}
	}

	async checkSkillProperties(){
		if( this.type != 'skill') return;
		const checkedProps = {};
		if( this.data.data.properties.combat) {

			//if skill is not a specialisation make it a specialisation
			if(!this.data.data.properties.special){
				this.data.data.properties.special = true;
				checkedProps['data.properties.special'] = true;
			}

			//If skill is combat skill and no specialisation set then make it a fighting( closecombat) skill
			if( !this.data.data.properties.fighting && !this.data.data.properties.firearm){
				this.data.data.properties.fighting = true;
				checkedProps['data.properties.fighting'] = true;
			}


			//if skill is close combat without specialisation name make set it according to the fightingSpecializationName
			if(this.data.data.properties.fighting && (!this.data.data.specialization || this.data.data.specialization == '')){
				this.data.data.specialization = game.i18n.localize(COC7.fightingSpecializationName);
				checkedProps['data.specialization'] = game.i18n.localize(COC7.fightingSpecializationName);
			}

			//if skill is range combat without a specialisation name make set it according to the firearmSpecializationName
			if(this.data.data.properties.firearm && (!this.data.data.specialization || this.data.data.specialization == '')){
				this.data.data.specialization = game.i18n.localize(COC7.firearmSpecializationName);
				checkedProps['data.specialization'] = game.i18n.localize(COC7.firearmSpecializationName);
			}
		}else{
			if( this.data.data.properties.fighting){
				this.data.data.properties.fighting = false;
				checkedProps['data.properties.fighting'] = false;
			}
			if( this.data.data.properties.firearm){
				this.data.data.properties.firearm = false;
				checkedProps['data.properties.firearm'] = false;
			}
		}

		if(Object.keys(checkedProps).length > 0){
			await this.update( checkedProps);
		}

		return checkedProps;

			
		// for (const property in this.data.data.properties) {
		// 	checkedProps[`data.data.properties${property}`] = true;
		// }
	}

	// async toggleInSet( set, propertyId){
	// 	if( this.data.data[set][propertyId] == "false") this.data.data[set][propertyId] = "true"; else this.data.data[set][propertyId] = "false";
	// }

	isIncludedInSet( set, propertyId){
		if(!this.data.data[set]) this.data.data[set] = [];
		const propertyIndex = this.data.data[set].indexOf( propertyId);
		if( propertyIndex > -1) return true;
		return false;
	}

	async flagForDevelopement(){
		if( !this.data.data.flags){
			await this.update( { 'data.flags': {}});
		}
		await this.update( {'data.flags.developement' : true});
	}

	async unflagForDevelopement(){
		if( !this.data.data.flags){
			await this.update( { 'data.flags': {}});
		}
		await this.update( {'data.flags.developement' : false});
	}


	get developementFlag(){
		return this.getItemFlag('developement');
	}

	async toggleItemFlag( flagName, eraseAdjustment = true){
		const flagValue =  !this.getItemFlag(flagName);
		const name = `data.flags.${flagName}`;
		if( ('occupation' == flagName || 'archetype' == flagName) && !flagValue && eraseAdjustment){
			await this.update( { 
				[`data.adjustments.${flagName}`] : null,
				[name]: flagValue});
		} else await this.update( { [name]: flagValue});
	}

	async setItemFlag( flagName){
		await this.update( { [`data.flags.${flagName}`]: true});
	}

	async unsetItemFlag( flagName, eraseAdjustment = true){
		const name = `data.flags.${flagName}`;
		if( ('occupation' == flagName || 'archetype' == flagName) && eraseAdjustment){
			await this.update( { 
				[`data.adjustments.${flagName}`] : null,
				[name]: false});
		} else await this.update( { [name]: false});
	}

	getItemFlag( flagName){
		if( !this.data.data.flags){
			this.data.data.flags = {};
			this.data.data.flags.locked = true;
			this.update( { 'data.flags': {}});
			return false;
		}

		if( !this.data.data.flags[flagName]) return false;
		return this.data.data.flags[flagName];
	}

	get usesAlternativeSkill(){
		return 'weapon' == this.type && ( this.data.data.properties?.auto == true || this.data.data.properties?.brst == true || this.data.data.properties?.thrown == true);
	}

	get maxUsesPerRound(){
		if( 'weapon' != this.type ) return null;
		const multiShot = parseInt(this.data.data.usesPerRound.max);
		if( isNaN(multiShot)) return 0;
		return multiShot;
	}

	get usesPerRound(){
		if( 'weapon' != this.type ) return null;
		const singleShot = parseInt(this.data.data.usesPerRound.normal);
		if( isNaN(singleShot)) return 0;
		return singleShot;
	}

	get usesPerRoundString(){
		let usesPerRound;
		if( this.data.data.usesPerRound.normal) usesPerRound = this.data.data.usesPerRound.normal;
		else usesPerRound = '1';
		if( this.data.data.usesPerRound.max) usesPerRound += `(${this.data.data.usesPerRound.max})`;
		if( this.data.data.properties.auto) usesPerRound += ` ${game.i18n.localize('CoC7.WeaponAuto')}`;
		if( this.data.data.properties.brst) {
			usesPerRound += ` ${game.i18n.localize('CoC7.WeaponBrst')}`;
			if( this.data.data.usesPerRound.burst) usesPerRound += `(${this.data.data.usesPerRound.burst})`;
		}

		return usesPerRound;
	}

	get multipleShots(){
		if( 'weapon' != this.type ) return null;
		if( this.maxUsesPerRound <= 1){ return false;}
		return true;
	}

	get singleShot(){
		if( 'weapon' != this.type ) return null;
		if( !this.usesPerRound){ return false;}
		return true;
	}

	get baseRange(){
		return parseInt( this.data.data.range.normal.value);
	}

	get longRange(){
		return parseInt( this.data.data.range.long.value);
	}

	get extremeRange(){
		return parseInt( this.data.data.range.extreme.value);
	}

	get skillProperties(){
		if(  'skill' != this.type )	return [];

		const skillProperties = [];
		for (let [key, value] of Object.entries(COC7['skillProperties'])) {
			if(this.data.data.properties[key] == true)  skillProperties.push(game.i18n.localize(value));
		}
		return skillProperties;
	}

	get base(){
		if(  'skill' != this.type )	return null;
		if( 'string' != (typeof this.data.data.base)) return this.data.data.base;
		if( this.data.data.base.includes('@')){
			let parsedFormula = this.data.data.base;
			for( let [key, value] of Object.entries(COC7.formula.actorsheet)){
				parsedFormula = parsedFormula.replace( key, value);
			}
			let value;
			try{
				value = Math.floor(eval(parsedFormula));
			}
			catch(err){
				value = 0;
			}

			if( value){
				this.update( {'data.base': value});
			}
			return  value;
		}
		return ( !isNaN(parseInt(this.data.data.base))? parseInt(this.data.data.base): null);
	}

	get value(){
		if(  'skill' != this.type )	return null;
		let value = 0;
		if( 'character' === this.actor.data.type) {	
			value = this.base;
			value += (this.data.data.adjustments?.personal)?parseInt( this.data.data.adjustments?.personal):0;
			value += (this.data.data.adjustments?.occupation)?parseInt( this.data.data.adjustments?.occupation):0;
			value += (this.data.data.adjustments?.experience)?parseInt( this.data.data.adjustments?.experience):0;
			if( game.settings.get('CoC7', 'pulpRules')){
				if( this.data.data.adjustments?.archetype) value += parseInt( this.data.data.adjustments?.archetype);
			}
		}else {
			value = parseInt( this.data.data.value);
		}
		return !isNaN(value)? value: null;
	}

	async updateValue( value){
		if(  'skill' != this.type )	return null;
		if( 'character' === this.actor.data.type) {
			const delta = parseInt(value) - this.value;
			const exp = (this.data.data.adjustments?.experience? parseInt( this.data.data.adjustments.experience) : 0) + delta;
			await this.update( { 'data.adjustments.experience' : exp > 0 ? exp : 0});
		} else await this.update({'data.value': value});
	}

	async increaseExperience(x){
		if(  'skill' != this.type )	return null;
		if( 'character' === this.actor.data.type) {
			const exp = (this.data.data.adjustments?.experience? parseInt( this.data.data.adjustments.experience) : 0) + parseInt(x);
			await this.update( { 'data.adjustments.experience' : exp > 0 ? exp : 0});
		}
	}

	getBulletLeft(){
		if( 'weapon' != this.type) return null;
		if( !this.data.data.ammo){ 
			this.setBullets(0);
			return 0;
		}
		return this.data.data.ammo;
	}

	async reload(){
		if( 'weapon' != this.type) return null;
		const maxBullet = this.data.data.bullets? parseInt(this.data.data.bullets):1;
		await this.setBullets(maxBullet);
	}

	async setBullets( bullets){
		if( 'weapon' != this.type) return null;
		await this.update( { 'data.ammo': bullets?bullets:0});
	}

	async addBullet(){
		if( 'weapon' != this.type) return null;
		const bullets = await this.getBulletLeft();
		const maxBullets = this.data.data.bullets? parseInt(this.data.data.bullets):1;
		if( bullets + 1 >= maxBullets) await this.setBullets( maxBullets);
		else await this.setBullets( bullets + 1);
	}

	async shootBullets(x){
		if( 'weapon' != this.type) return null;
		let bullets = await this.getBulletLeft();
		if( x > bullets) await this.setBullets(0);
		else await this.setBullets( bullets - x);
	}

	static mergeOptionalSkills( skillList, options){
		const jointArray = skillList.concat( options);
		return jointArray.reduce( (newArray, item) => {
			//If skill is not a generic spec and is already included we don't add item
			if( !CoC7Item.isAnySpec(item) && newArray.find( skill => skill.name == item.name)) return newArray;
			//Else item is added
			return [...newArray, item];
		}, []).sort( (a, b) => {
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



	/** TODO : rien a faire ici !!
	 * Get the Actor which is the author of a chat card
	 * @param {HTMLElement} card    The chat card being used
	 * @return {Actor|null}         The Actor entity or null
	 * @private
	 */
	static _getChatCardActor(card) {

		// Case 1 - a synthetic actor from a Token
		const tokenKey = card.dataset.tokenId;
		if (tokenKey) {
			const [sceneId, tokenId] = tokenKey.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			return token.actor;
		}

		// Case 2 - use Actor ID directory
		const actorId = card.dataset.actorId;
		return game.actors.get(actorId) || null;
	}
	

	/* -------------------------------------------- */
	/*  Chat Message Helpers                        */
	/* -------------------------------------------- */

	/**
	 * Prepare an object of chat data used to display a card for the Item in the chat log
	 * @param {Object} htmlOptions    Options used by the TextEditor.enrichHTML function
	 * @return {Object}               An object of chat data to render
	 */
	getChatData(htmlOptions) {
		const data = duplicate(this.data.data);
		//Fix : data can have description directly in field, not under value.
		if( data.description && !data.description.value){
			const value = data.description;
			data.description = {
				value: value
			};
		}
		const labels = [];

		// Rich text description
		data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);
		data.description.value = CoC7Parser.enrichHTML( data.description.value);
		data.description.special = TextEditor.enrichHTML(data.description.special, htmlOptions);
		data.description.special = CoC7Parser.enrichHTML(data.description.special);


		// Item type specific properties
		const props = [];
		const fn = this[`_${this.data.type}ChatData`];
		if ( fn ) fn.bind(this)(data, labels, props, htmlOptions);

		if( this.type == 'skill') {
			for( let [key, value] of Object.entries(COC7['skillProperties']))
			{
				if(this.data.data.properties[key] == true) props.push(value);
			}
		}

		// Filter properties and return
		data.properties = props.filter(p => !!p);
		data.labels = labels;
		return data;
	}

	_weaponChatData(data, labels, props, htmlOptions){
		for( let [key, value] of Object.entries(COC7['weaponProperties']))
		{
			if(this.data.data.properties[key] == true) props.push(value);
		}

		let skillLabel = game.i18n.localize('CoC7.Skill');
		let skillName = '';
		let found = false;
		if( this.data.data.skill.main.id) {
			const skill = htmlOptions?.owner.getOwnedItem( this.data.data.skill.main.id);
			if( skill){
				skillName += CoC7Item.getNameWithoutSpec( skill);
				found = true;
			}
		}

		if( this.usesAlternativeSkill && this.data.data.skill.alternativ.id) {
			skillLabel = game.i18n.localize('CoC7.Skills');
			const skill = htmlOptions?.owner.getOwnedItem( this.data.data.skill.alternativ.id);
			if( skill){
				skillName += `/${CoC7Item.getNameWithoutSpec( skill)}`;
				found = true;
			}
		}

		if( !found){
			skillName = this.data.data.skill.main.name;
			if( this.usesAlternativeSkill && this.data.data.skill.alternativ.name) skillName += `/${this.data.data.skill.alternativ.name}`;
		}

		if( skillName){
			labels.push(
				{
					name: skillLabel,
					value: skillName
				}
			);
		}

		labels.push(
			{
				name: game.i18n.localize('CoC7.WeaponUsesPerRound'),
				value: this.usesPerRoundString
			}
		);

		labels.push(
			{
				name: game.i18n.localize('CoC7.WeaponMalfunction'),
				value: this.data.data.malfunction?this.data.data.malfunction:'-'
			}
		);

		if( this.data.data.bullets){
			labels.push(
				{
					name: game.i18n.localize('CoC7.WeaponBulletsInMag'),
					value: this.data.data.bullets
				}
			);
		}
	}

	canBePushed(){
		if( this.type == 'skill' && this.data.data.properties.push ) return true;
		return false;
	}

	get impale(){
		return this.data.data.properties.impl;
	}
}