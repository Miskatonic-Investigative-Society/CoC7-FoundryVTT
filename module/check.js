import { CoC7Dice } from './dice.js';
import { CoC7Item } from './items/item.js';
import { chatHelper, CoC7Roll } from './chat/helper.js';

export class CoC7Check {
	constructor( actor = null, skill = null, item = null, diceMod = 0, difficulty = CoC7Check.difficultyLevel.regular) {
		this.actor = actor;
		this.skill = skill;
		this.item = item;
		this.difficulty = difficulty;
		this.diceModifier = diceMod;
		this.succesThreshold = 0; //value needed for the check to succeed after difficulty is applied
		this.rawValue = 0; //value needed before difficulty
		this.passed = false; //did the check pass
		this.successLevel = null;
		this.referenceMessageId = null;
		this.pushing = false;

	}

	static difficultyLevel = {
		regular: 1,
		hard: 2,
		extreme: 3,
		critical: 4,
		impossible: 9
	}

	static successLevel = {
		fumble: -99,
		failure: 0,
		regular: 1,
		hard: 2,
		extreme: 3,
		critical: 4
	}

	static async getFromCard( card){
		const check = new CoC7Check();
		CoC7Roll.getFromElement(card, check);
		const message = card.closest('.message');
		check.messageId = message.dataset.messageId;
		return check;
	}

	static push( card, publish = true){
		const actorId = card.dataset.tokenId ? card.dataset.tokenId : card.dataset.actorId;
		const skillId = card.dataset.skillId;
		const charac = card.dataset.characteristic;
		const itemId = card.dataset.itemId;
		const diceMod = card.dataset.diceMod;
		const difficulty = card.dataset.difficulty;

		let pushedRoll;
		if( skillId) pushedRoll = new CoC7Check( actorId, skillId, itemId, diceMod, difficulty);
		else if( charac){ 
			pushedRoll = new CoC7Check();
			pushedRoll.diceModifier = diceMod;
			pushedRoll.difficulty = difficulty;
			pushedRoll.actor = actorId;
			pushedRoll.characteristic = charac;
		} else return;
		pushedRoll.pushing = true;
		pushedRoll.roll();
		if(publish) pushedRoll.toMessage( true, card);
	}

	set actor(x)
	{
		this.actorKey = x;
		if( x == null) {
			this._actor = x;
			return;
		}

		if( x instanceof Actor) {
			this._actor = x;
			this._actor.alias = this.actor.name;
			if( x.token && x.token.scene && x.token.scene.id){
				this.actorKey=`${x.token.scene.id}.${x.token.id}`;
			} else this.actorKey = `${game.scenes.active.id}.${x.id}`;
			return;
		}

		if (x.includes('.')) {
			const [sceneId, tokenId] = x.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return;
			const token = new Token(tokenData);
			this._actor = token.actor;
			this._actor.alias = token.name;
			return;
		}
		
		this._actor = game.actors.get( x);
		this.actor.alias = this.actor.name;
	}

	get isBlind(){
		if( undefined === this._isBlind) this._isBlind = 'blindroll' === this.rollMode;
		return this._isBlind;
	}
	
	set isBlind(x){
		this._isBlind = x;
	}

	get rollMode(){
		if( !this._rollMode) this._rollMode = game.settings.get('core', 'rollMode');
		return this._rollMode;
	}

	set rollMode(x){
		this._rollMode = x;
	}

	set skill(x) { this._skill = this._getItemFromId( x); }
	set item(x) { this._item = this._getItemFromId( x); }

	_getItemFromId( x)
	{
		if( x == null) return null;
		if( x instanceof Item) return x;
		if( this._actor) return this._actor.getOwnedItem( x);
		return game.items.get( x);
	}

	get actor() { 
		if( !this._actor){
			if( this.actorKey) this._actor = chatHelper.getActorFromKey( this.actorKey);
			if( this.actorId) this._actor = chatHelper.getActorFromKey( this.actorId);
		}
		return this._actor; 
	}

	get skill() { 
		if( !this._skill && this.skillId){
			this._skill = this.actor.getOwnedItem( this.skillId);
		}
		if( !this._skill && this.item )
		{
			if( this.item.data.data.skill)
			{
				if( this.item.data.data.skill.main.id)
				{
					this._skill = this._actor.getOwnedItem( this.item.data.data.skill.main.id);
				}
			}
		}
		return this._skill; 
	}

	get item() {
		if( !this._item && this.itemId && this.actor){
			this._item = this.actor.getOwnedItem( this.itemId);
		}
		return this._item; 
	}


	roll( diceMod = null, difficulty = null) {
		if( diceMod ) this.diceModifier = diceMod;
		if( difficulty ) this.difficulty = difficulty;

		this._perform();
	}


	rollCharacteristic( char, diceMod = null, difficulty = null)
	{
		if( diceMod ) this.diceModifier = diceMod;
		if( difficulty ) this.difficulty = difficulty;

		this.characteristic = char;
		this._perform();

	}

	rollAttribute( attrib, diceMod = null, difficulty = null){
		if( diceMod ) this.diceModifier = diceMod;
		if( difficulty ) this.difficulty = difficulty;

		this.attribute = attrib;
		this._perform();
	}

	rollValue( val, diceMod = null, difficulty = null){
		if( diceMod ) this.diceModifier = diceMod;
		if( difficulty ) this.difficulty = difficulty;

		this.rawValue = val;
		this._perform();
	}

	async _perform()
	{
		this.dice = CoC7Dice.roll( this.diceModifier, this.rollMode);
		AudioHelper.play({src: CONFIG.sounds.dice});

		this.dices = {
			tens : [],
			unit : {
				value: this.dice.unit.total
			},
			total: this.dice.total,
			tenResult: this.dice.total - this.dice.unit.total,
			hasBonus: this.diceModifier == 0 ? false : true,
			bonus: Math.abs(this.diceModifier),
			bonusType: this.diceModifier < 0 ? game.i18n.format('CoC7.DiceModifierPenalty') : game.i18n.format('CoC7.DiceModifierBonus'),
			difficulty: this.difficulty
		};

		let max = (this.dice.unit.total == 0)? 100 : 90;
		let min = (this.dice.unit.total == 0)? 10 : 0;
		let selected = this.dice.total - this.dice.unit.total;
	
		for( let i = 0; i < this.dice.tens.results.length; i++)
		{
			let die = {};
			die.value = this.dice.tens.results[i];
			if( die.value == selected) {
				selected = 101;
				die.selected = true;
				if( this.dices.hasBonus) { die.isMax = true; die.isMin = false;}
				else {die.isMin = true; die.isMax = false;}
			} else {
				if( die.value == max) die.isMax = true; else die.isMax = false;
				if( die.value == min) die.isMin = true; else die.isMin = false;
			}
			// if( die.value == 100) die.value = "00";
			this.dices.tens.push( die);
		}

		this.computeCheck();

	}

	async computeCheck(){

		// this.isUnknown = this.isBlind;

		this.tenOnlyOneDie = this.dices.tens.length == 1;

		//
		this.isValue = false;
		this.isCharactiristic = false;
		this.isSkill = false;
		this.isItem = false;
		this.isAttribute = false;
		if( this.actor == null){
			this.isValue = true;
		}
		else
		{
			if( this.characteristic){
				this.isCharactiristic = true;
				this.rawValue = this.actor.data.data.characteristics[this.characteristic].value;
			}

			if( this.skill){
				this.isSkill = true;
				this.rawValue = this.skill.data.data.value;
			}

			if( this.attribute){
				this.isAttribute = true;
				this.rawValue = this.actor.data.data.attribs[this.attribute].value; //bug correction : row->raw
			}

		}

		this.criticalThreshold = 1;
		this.extremeThreshold = Math.floor( this.rawValue / 5);
		this.hardThreshold = Math.floor( this.rawValue / 2);
		this.regularThreshold = this.rawValue;
		this.fumbleThreshold = this.rawValue < 50 ? 96 : 100;

		if( ! this.luckSpent){
			if( this.dices.total <= this.rawValue) this.successLevel = CoC7Check.successLevel.regular;
			if( this.dices.total <= this.hardThreshold) this.successLevel = CoC7Check.successLevel.hard;
			if( this.dices.total <= this.extremeThreshold) this.successLevel = CoC7Check.successLevel.extreme;
			if( this.dices.total > this.rawValue) this.successLevel = CoC7Check.successLevel.failure;
			if( 1 == this.dices.total) this.successLevel = CoC7Check.successLevel.critical;
			if( this.fumbleThreshold <= this.dices.total) this.successLevel = CoC7Check.successLevel.fumble;
		}

		switch (this.successLevel) {
		case CoC7Check.successLevel.regular:
			this.resultType = game.i18n.format('CoC7.RegularSuccess');
			break;
		case CoC7Check.successLevel.hard:
			this.resultType = game.i18n.format('CoC7.HardSuccess');
			break;
		case CoC7Check.successLevel.extreme:
			this.resultType = game.i18n.format('CoC7.ExtremeSuccess');
			break;
		case CoC7Check.successLevel.critical:
			this.resultType = game.i18n.format('CoC7.CriticalSuccess');
			break;
		case CoC7Check.successLevel.fumble:
			this.resultType = game.i18n.format('CoC7.Fumble');
			break;
		case CoC7Check.successLevel.failure:
			this.resultType = game.i18n.format('CoC7.Failure');
			break;
		
		default:
			break;
		}

		switch( this.difficulty) {
		case CoC7Check.difficultyLevel.extreme:
			this.difficultyString = game.i18n.format('CoC7.ExtremeDifficulty');
			this.succesThreshold = this.extremeThreshold;
			break;
		case CoC7Check.difficultyLevel.hard:
			this.difficultyString = game.i18n.format('CoC7.HardDifficulty');
			this.succesThreshold = this.hardThreshold;
			break;
		case CoC7Check.difficultyLevel.regular:
			this.difficultyString = game.i18n.format('CoC7.RegularDifficulty');
			this.succesThreshold = this.regularThreshold;
			break;
		case CoC7Check.difficultyLevel.critical:
			this.difficultyString = game.i18n.format('CoC7.CriticalDifficulty');
			this.succesThreshold = this.criticalThreshold;
			break;
		default:
			this.succesThreshold = this.rawValue;
			break;
		}
		this.successRequired = game.i18n.format('CoC7.SuccessRequired', {successRequired : this.difficultyString});


		this.passed = this.succesThreshold >= this.dices.total ? true : false;
		if (this.dices.total == 1){
			this.passed = true; // 1 is always a success
			this.successLevel = CoC7Check.successLevel.critical;
		}
		if( !this.luckSpent) this.isSuccess = this.passed;

		this.isFumble = this.dices.total >= this.fumbleThreshold;
		this.isCritical = this.dices.total == 1;
		this.hasMalfunction = false;
		if( this.isFumble) this.successLevel = CoC7Check.successLevel.fumble;

		if( this.item)
		{
			this.isItem = true;
			if( this.item.data.data.malfunction) {
				if( this.dices.total >= this.item.data.data.malfunction){
					this.hasMalfunction = true;
					this.malfunctionTxt = game.i18n.format('CoC7.Malfunction', {itemName : this.item.name});
					await this.item.toggleItemFlag(CoC7Item.flags.malfunction);
				}
			}
		}
		this.canBePushed = this.skill ? this.skill.canBePushed() : false;
		if( this.characteristic != null) this.canBePushed = true;
		if( this.isFumble) this.canBePushed = false;
		
		if( !this.luckSpent && !this.passed && !this.isFumble && this.difficulty!=CoC7Check.difficultyLevel.critical) {
			if( this.skill || this.characteristic){
				let luckNeeded = this.dices.total - this.succesThreshold;
				if( this.actor.luck > luckNeeded){
					this.hasEnoughLuck = true;
					this.luckNeeded = luckNeeded;
					this.luckNeededTxt = game.i18n.format('CoC7.SpendLuck', {luckNeededValue : luckNeeded});
				}
			}
		}

		if( !this.luckSpent){
			this.increaseSuccess = [];

			// Can't spend luck on pushed rolls.
			if( !this.pushing && 'lck' != this.attribute && 'san' != this.attribute){

				if(this.difficulty <= CoC7Check.difficultyLevel.regular  && this.dices.total > this.hardThreshold){
					let nextLevel = {};
					nextLevel.difficultyName = game.i18n.localize('CoC7.HardDifficulty');
					nextLevel.difficulty = CoC7Check.difficultyLevel.hard;
					nextLevel.luckToSpend = this.dices.total - this.hardThreshold;
					nextLevel.hasEnoughLuck = (nextLevel.luckToSpend <= this.actor.luck);
					if (nextLevel.luckToSpend <= this.actor.luck) this.increaseSuccess.push(nextLevel);
				}

				if(this.difficulty <= CoC7Check.difficultyLevel.hard  && this.dices.total > this.extremeThreshold){
					let nextLevel = {};
					nextLevel.difficultyName = game.i18n.localize('CoC7.ExtremeDifficulty');
					nextLevel.difficulty = CoC7Check.difficultyLevel.extreme;
					nextLevel.luckToSpend = this.dices.total - this.extremeThreshold;
					nextLevel.hasEnoughLuck = (nextLevel.luckToSpend <= this.actor.luck);
					if (nextLevel.luckToSpend <= this.actor.luck) this.increaseSuccess.push(nextLevel);
				}
			}
		}

		this.canIncreaseSuccess = this.increaseSuccess.length > 0 ? true : false;
		if( this.isFumble) this.canIncreaseSuccess = false;
		this.difficultyLevel = this.difficulty;

		if( this.passed && this.diceModifier <= 0 && this.skill && !this.skill.data.data.properties.noxpgain &&!this.luckSpent &&!this.forced &&!this.isBlind){
			this.flagForDevelopement();
		}
	}

	get cssClass(){
		let cssClass = '';
		if( this.isSuccess) cssClass = 'success';
		if( this.isFailure) cssClass = 'failure';
		if( this.isCritical && !this.isFailure) cssClass = 'success critical';
		if( this.isFumble && !this.isSuccess) cssClass = 'failure fumble';
		if( CoC7Check.successLevel.regular == this.successLevel) cssClass += ' regular-success';
		if( CoC7Check.successLevel.hard == this.successLevel) cssClass += ' hard-success';
		if( CoC7Check.successLevel.extreme == this.successLevel) cssClass += ' extreme-success';
		return cssClass;
	}

	upgradeCheck( upgradeindex){
		const increasedSuccess = this.increaseSuccess[upgradeindex];
		const luckAmount = parseInt(increasedSuccess.luckAmount);
		if( !this.actor.spendLuck( luckAmount)){ ui.notifications.error(`${actor.name} does not have enough luck to pass the check`); return;}
		const newSuccessLevel = parseInt( increasedSuccess.newSuccessLevel);
		this.successLevel = newSuccessLevel;
		if( this.difficulty <= newSuccessLevel) this.isSuccess = true;
		for (let index = 0; index < upgradeindex + 1; index++) {
			this.increaseSuccess.shift();
		}
		this.increaseSuccess.forEach( s => {s.luckToSpend = s.luckToSpend- luckAmount;});
		this.luckSpent = true;
		this.computeCheck();
		this.updateChatCard();
	}

	removeUpgrades(){
		this.ccanIncreaseSuccess = false;
		this.increaseSuccess = [];
		this.luckNeeded = 0;
		this.luckNeededTxt = null;
		this.canBePushed = false;
	}

	forcePass(luckAmount = null){
		this.forced = true;
		if( !this.isSuccess){
			if( luckAmount){
				this.actor.spendLuck( luckAmount);
				this.increaseSuccess.forEach( s => {s.luckToSpend = s.luckToSpend- luckAmount;});
				this.luckSpent = true;
				this.computeCheck();
			} else this.removeUpgrades();
			this.isFailure = false;
			this.isUnknown = false;
			this.isSuccess = true;
			this.passed = true;
			this.luckNeeded = 0;
			this.luckNeededTxt = null;
			this.resultType = game.i18n.localize( 'CoC7.check.AutoSuccess');
			delete this.hasEnoughLuck;
			// this.computeCheck();
			this.updateChatCard();
		}
	}

	forceFail(){
		this.forced = true;
		this.removeUpgrades();
		if( this.isSuccess){
			this.isFailure = true;
			this.isUnknown = false;
			this.isSuccess = false;
			this.passed = false;
			this.luckNeeded = 0;
			this.luckNeededTxt = null;
			this.resultType = game.i18n.localize( 'CoC7.check.AutoFailure');
			delete this.hasEnoughLuck;
			this.isUnknown = false;
			// this.computeCheck();
			this.updateChatCard();
		}
	}

	async flagForDevelopement(){
		this.flaggedForDevelopment=true;
		if( this.skill) await this.skill.flagForDevelopement();
	}

	set difficulty(x){
		this._difficulty = parseInt(x);
	}

	get difficulty(){
		return this._difficulty;
	}

	get flavor(){
		let flavor = '';
		if( this.actor){
			if (this.skill) flavor = game.i18n.format('CoC7.CheckResult', {name : this.skill.name, value : this.skill.data.data.value, difficulty : this.difficultyString});
			if (this.item) flavor = game.i18n.format('CoC7.ItemCheckResult', {item : this.item.name, skill : this.skill.name, value : this.skill.data.data.value, difficulty : this.difficultyString});
			if (this.characteristic) flavor = game.i18n.format('CoC7.CheckResult', {name : game.i18n.format(this.actor.data.data.characteristics[this.characteristic].label), value : this.actor.data.data.characteristics[this.characteristic].value, difficulty : this.difficultyString});
			if (this.attribute) flavor = game.i18n.format('CoC7.CheckResult', {name : game.i18n.format(this.actor.data.data.attribs[this.attribute].label), value : this.actor.data.data.attribs[this.attribute].value, difficulty : this.difficultyString});
		}
		else {
			if( this.rawValue) flavor = game.i18n.format('CoC7.CheckRawValue', {rawvalue : this.rawValue, difficulty : this.difficultyString});
		}

		if( this.pushing) {
			flavor = game.i18n.format('CoC7.Pushing') + flavor;
		}

		return flavor;

	}

	async toMessage( pushing = false)
	{
		this.pushing = pushing;
		const template = 'systems/CoC7/templates/chat/roll-result.html';

		const html = await renderTemplate(template, this);

		//TODO: change for token !!
		let speaker;
		if( this.actor){
			speaker = ChatMessage.getSpeaker({actor: this.actor});
			speaker.alias = this.actor.alias;
		}
		else speaker = ChatMessage.getSpeaker();

		const chatData = {
			user: game.user._id,
			speaker: speaker,
			flavor: this.flavor,
			content: html
		};

		if ( ['gmroll', 'blindroll'].includes(this.rollMode) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
		if ( this.rollMode === 'blindroll' ) chatData['blind'] = true;

		ChatMessage.create(chatData).then( msg => {return msg;});

	}

	async updateChatCard(){
		const template = 'systems/CoC7/templates/chat/roll-result.html';
		let html = await renderTemplate(template, this);

		const message = game.messages.get( this.messageId);
		const msg = await message.update({ content: html });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	async shortResult( details = false){
		const template = 'systems/CoC7/templates/chat/roll.html';
		this.details = details? details : false;
		const html = await renderTemplate(template, this);
		return html;
	}

}