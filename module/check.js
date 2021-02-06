import { CoC7Dice } from './dice.js';
import { CoC7Item } from './items/item.js';
import { chatHelper, CoC7Roll } from './chat/helper.js';
import { CoCActor } from './actors/actor.js';

export class CoC7Check {
	constructor( actor = null, skill = null, item = null, diceMod = 0, difficulty = null) {
		this.actor = actor;
		this.skill = skill;
		this.item = item;
		this.difficulty = difficulty;
		this.diceModifier = diceMod;
		this.rawValue = 0; //value needed before difficulty
		this.successLevel = null;
		this.referenceMessageId = null;
		this.pushing = false;

		if( null === difficulty){
			const isUnknown = 'unknown' === game.settings.get('CoC7', 'defaultCheckDifficulty');
			this.difficulty = isUnknown? CoC7Check.difficultyLevel.unknown: CoC7Check.difficultyLevel.regular; 
		}
	}

	static difficultyLevel = {
		unknown: -1,
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

	static difficultyString(difficultyLevel) {
		switch (!isNaN(Number(difficultyLevel))?Number(difficultyLevel):difficultyLevel) {
		case '?':
			return game.i18n.localize('CoC7.UnknownDifficulty');
		case '+':
			return game.i18n.localize('CoC7.HardDifficulty');
		case '++':
			return game.i18n.localize('CoC7.ExtremeDifficulty');
		case '+++':
			return game.i18n.localize('CoC7.CriticalDifficulty');
		case 0:
			return game.i18n.localize('CoC7.RegularDifficulty');
		case CoC7Check.difficultyLevel.unknown:
			return game.i18n.localize('CoC7.UnknownDifficulty');
		case CoC7Check.difficultyLevel.regular:
			return game.i18n.localize('CoC7.RegularDifficulty');
		case CoC7Check.difficultyLevel.hard:
			return game.i18n.localize('CoC7.HardDifficulty');
		case CoC7Check.difficultyLevel.extreme:
			return game.i18n.localize('CoC7.ExtremeDifficulty');
		case CoC7Check.difficultyLevel.critical:
			return game.i18n.localize('CoC7.CriticalDifficulty');
		default:
			return null;
		}
	
	}

	get criticalThreshold(){
		return 1;
	}

	get regularThreshold(){
		if( this.rawValue)
		{
			if( this.rawValue >= 100) return 99;
			return parseInt( this.rawValue);
		}
		return null;
	}

	get hardThreshold(){
		if(this.rawValue) return Math.floor( this.rawValue / 2);
		return null;
	}

	get extremeThreshold(){
		if(this.rawValue) return Math.floor( this.rawValue / 5);
		return null;
	}

	get fumbleThreshold(){
		if(this.rawValue) return this.rawValue < 50 ? 96 : 100;
		return null;
	}

	get succesThreshold(){
		if( undefined !=  this.difficulty){
			switch( this.difficulty) {
			case CoC7Check.difficultyLevel.extreme: return this.extremeThreshold;
			case CoC7Check.difficultyLevel.hard: return this.hardThreshold;
			case CoC7Check.difficultyLevel.regular: return this.regularThreshold;
			case CoC7Check.difficultyLevel.critical: return this.criticalThreshold;
			case CoC7Check.difficultyLevel.unknown: return -1;
			default : return this.rawValue;
			}
		}
		return null;
	}

	get difficultyString(){
		if( undefined != this.difficulty){
			switch( this.difficulty) {
			case CoC7Check.difficultyLevel.extreme: return game.i18n.format('CoC7.ExtremeDifficulty');
			case CoC7Check.difficultyLevel.hard: return game.i18n.format('CoC7.HardDifficulty');
			case CoC7Check.difficultyLevel.regular: return game.i18n.format('CoC7.RegularDifficulty');
			case CoC7Check.difficultyLevel.critical: return game.i18n.format('CoC7.CriticalDifficulty');
			case CoC7Check.difficultyLevel.unknown: return game.i18n.format('CoC7.UnknownDifficulty');
			default: return '';
			}
		}
		return '';
	}

	get isFumble(){
		return this.dices.total >= this.fumbleThreshold;
	}

	get isCritical(){
		return this.dices.total == 1;
	}

	get passed(){
		return this.succesThreshold >= this.dices.total || this.isCritical;
	}

	get failed(){
		return !this.passed;
	}

	get hasBonus(){
		if( this.diceModifier && this.diceModifier > 0) return true;
		return false;
	}

	get hasPenalty(){
		if( this.diceModifier && this.diceModifier < 0) return true;
		return false;
	}

	get hasModifier(){
		if( this.diceModifier && this.diceModifier != 0) return true;
		return false;
	}

	get diceModifier(){
		if( this._diceModifier) return this._diceModifier;
		return null;
	}

	set diceModifier(x){
		this._diceModifier = parseInt( x);
	}

	/**
	 * Get a check from an HTMLElement or a chat card.
	 * @param {HTMLElement} card	The HTMLElement that is a roll-result or a chat card containing a single roll-result.
	 * @return {CoC7Check}			A CoC7Check.
	 */
	static async getFromCard( card){
		const rollResult = card.classList.contains('roll-result')? card : card.querySelector('.roll-result');
		const check = new CoC7Check();
		CoC7Roll.getFromElement(rollResult, check);
		const message = card.closest('.message');
		check.messageId = message?message.dataset.messageId:null;
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

	get token(){
		if( !this.actor) return null;
		return chatHelper.getTokenFromKey(this.actorKey);
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

	get successLevelIcons(){
		if( this.unknownDifficulty) return null;
		if( this.successLevel >= this.difficulty){
			let icons = [];
			for (let index = 0; index < (this.successLevel - this.difficulty + 1); index++) {
				icons.push( this.isCritical ? 'medal' : 'star');
				
			}
			const successHint = game.i18n.format('CoC7.SuccesLevelHint', {value : this.successLevel - this.difficulty + 1});
			return {
				success: true,
				cssClass: this.isCritical ? 'critical' : 'success',
				hint: successHint,
				icons: icons};
		} else {
			let icons = [];
			const successLevel = this.isFumble ? -1 : this.successLevel;
			for (let index = 0; index < (this.difficulty - successLevel); index++) {
				icons.push(this.isFumble? 'skull' : 'spider');
			}
			const failureHint = game.i18n.format('CoC7.FailureLevelHint', {value : this.difficulty - successLevel});
			return {
				success: false,
				cssClass: this.isFumble? 'fumble' : 'failure',
				hint: failureHint,
				icons: icons};
		}
		
	}

	get isBlind(){
		if( undefined === this._isBlind) this._isBlind = 'blindroll' === this.rollMode;
		return this._isBlind;
	}
	
	set isBlind(x){
		this._isBlind = x;
	}

	get unknownDifficulty(){
		if( this.gmDifficultyCritical || this.gmDifficultyExtreme || this.gmDifficultyHard || this.gmDifficultyRegular) return false;
		return CoC7Check.difficultyLevel.unknown === this.difficulty;
	}

	get rollMode(){
		if( !this._rollMode) this._rollMode = game.settings.get('core', 'rollMode');
		return this._rollMode;
	}

	set rollMode(x){
		if( false === x) this._rollMode = game.settings.get('core', 'rollMode');
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
		} else if( this._actor.constructor.name == 'Object'){
			const actor = new CoCActor(this._actor);
			this._actor = actor;
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


	get displayResultType(){
		return game.settings.get('CoC7', 'displayResultType');
	}

	get displayCheckSuccessLevel(){
		return game.settings.get('CoC7', 'displayCheckSuccessLevel');
	}

	get displayBothSuccessLevel(){
		return this.displayResultType && this.displayCheckSuccessLevel;
	}

	get displayNoSuccessLevel(){
		return !this.displayResultType && !this.displayCheckSuccessLevel;
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
		this.dice = CoC7Dice.roll( this.diceModifier, this.rollMode, this.isBlind);
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

		this.isUnknown = this.unknownDifficulty;

		if( this.gmDifficultyRegular) this.difficulty = CoC7Check.difficultyLevel.regular;
		if( this.gmDifficultyHard) this.difficulty = CoC7Check.difficultyLevel.hard;
		if( this.gmDifficultyExtreme) this.difficulty = CoC7Check.difficultyLevel.extreme;
		if( this.gmDifficultyCritical) this.difficulty = CoC7Check.difficultyLevel.critical;

		this.tenOnlyOneDie = this.dices.tens.length == 1;

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
				this.rawValue = this.skill.value;
			}

			if( this.attribute){
				this.isAttribute = true;
				this.rawValue = this.actor.data.data.attribs[this.attribute].value;
			}

		}

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


		if( this.unknownDifficulty ) this.successRequired = '';
		else this.successRequired = game.i18n.format('CoC7.SuccessRequired', {successRequired : this.difficultyString});


		if (this.dices.total == 1){
			this.successLevel = CoC7Check.successLevel.critical;
		}
		if( !this.luckSpent && !this.isUnknown){
			this.isFailure = this.failed;
			this.isSuccess = this.passed;
		}

		this.hasMalfunction = false;
		if( this.isFumble) this.successLevel = CoC7Check.successLevel.fumble;

		if( this.item)
		{
			this.isItem = true;
			if( this.item.data.data.malfunction) {
				if( Number(this.dices.total) >= Number(this.item.data.data.malfunction)){
					this.hasMalfunction = true;
					this.malfunctionTxt = game.i18n.format('CoC7.Malfunction', {itemName : this.item.name});
					await this.item.toggleItemFlag(CoC7Item.flags.malfunction);
				}
			}
		}

		this.canBePushed = this.skill ? this.skill.canBePushed() : false;
		if( this.characteristic != null) this.canBePushed = true;
		if( this.isFumble) this.canBePushed = false;
		if( this.denyPush) this.canBePushed = false;
		
		if( !this.denyLuck){
			if( !this.luckSpent && !this.passed && !this.isFumble && this.difficulty!=CoC7Check.difficultyLevel.critical && !this.unknownDifficulty) {
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

					if( this.unknownDifficulty && this.dices.total > this.regularThreshold){
						let nextLevel = {};
						nextLevel.difficultyName = game.i18n.localize('CoC7.RegularDifficulty');
						nextLevel.difficulty = CoC7Check.difficultyLevel.regular;
						nextLevel.luckToSpend = this.dices.total - this.regularThreshold;
						nextLevel.hasEnoughLuck = (nextLevel.luckToSpend <= this.actor.luck);
						if (nextLevel.luckToSpend <= this.actor.luck) this.increaseSuccess.push(nextLevel);
					}

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
		}

		this.canAwardExperience = this.skill && !this.skill.data.data.properties.noxpgain;

		if( this.passed && this.diceModifier <= 0 && this.skill && !this.skill.data.data.properties.noxpgain &&!this.luckSpent &&!this.forced &&!this.isBlind &&!this.isUnknown){
			this.flagForDevelopement();
		}
	}

	showDiceRoll(){
		if( game.modules.get('dice-so-nice')?.active){
			const diceResults = [];
			this.dices.tens.forEach(dieResult => { 
				diceResults.push( 100 == dieResult.value ?0:dieResult.value/10);
			});
			diceResults.push( this.dices.unit.value);

			const diceData = {
				formula: `${this.dices.tens.length}d100+1d10`,
				results: diceResults,
				whisper: null,
				blind: false
			};
			game.dice3d.show(diceData);
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

	get cssClassList(){
		let cssClass = [];
		if( this.isSuccess) cssClass.push('success');
		if( this.isFailure) cssClass.push('failure');
		if( this.isCritical && !this.isFailure) cssClass.push('success', 'critical');
		if( this.isFumble && !this.isSuccess) cssClass.push('failure', 'fumble');
		if( CoC7Check.successLevel.regular == this.successLevel) cssClass.push('regular-success');
		if( CoC7Check.successLevel.hard == this.successLevel) cssClass.push('hard-success');
		if( CoC7Check.successLevel.extreme == this.successLevel) cssClass.push('extreme-success');

		return cssClass;
	}

	get playerCssClass(){
		if( this.isSuccess || this.forcedSuccess) return 'success';
		if( this.isFailure || this.forcedFailure) return 'failure';
		return null;
	}

	async upgradeCheck( upgradeindex){
		const increasedSuccess = this.increaseSuccess[upgradeindex];
		const luckAmount = parseInt(increasedSuccess.luckAmount);
		if( !this.actor.spendLuck( luckAmount)){ ui.notifications.error(game.i18n.format('CoC7.ErrorNotEnoughLuck', {actor: actor.name})); return;}
		this.totalLuckSpent = !parseInt(this.totalLuckSpent)?0:parseInt(this.totalLuckSpent);
		this.totalLuckSpent += parseInt(luckAmount);
		const newSuccessLevel = parseInt( increasedSuccess.newSuccessLevel);
		this.successLevel = newSuccessLevel;
		if( this.difficulty <= newSuccessLevel) this.isSuccess = true;
		for (let index = 0; index < upgradeindex + 1; index++) {
			this.increaseSuccess.shift();
		}
		this.increaseSuccess.forEach( s => {s.luckToSpend = s.luckToSpend- luckAmount;});
		this.luckSpent = true;
		this.computeCheck();
		return await this.updateChatCard();
	}

	removeUpgrades(){
		this.canIncreaseSuccess = false;
		this.increaseSuccess = [];
		this.luckNeeded = 0;
		this.luckNeededTxt = null;
		this.canBePushed = false;
	}

	forcePass(luckAmount = null){
		if( luckAmount){
			this.actor.spendLuck( luckAmount);
			this.successLevel = this.difficulty;
			this.increaseSuccess.forEach( s => {s.luckToSpend = s.luckToSpend- luckAmount;});
			this.luckSpent = true;
			this.isSuccess = true;
			this.totalLuckSpent = !parseInt(this.totalLuckSpent)?0:parseInt(this.totalLuckSpent);
			this.totalLuckSpent += parseInt(luckAmount);
			this.computeCheck();
			this.updateChatCard();
		} else {
			this.forced = true;
			this.forcedSuccess = true;
			if( this.isUnknown) this.forceSuccessLevel( CoC7Check.successLevel.regular);
			else{
				this.forceSuccessLevel( this.difficulty); 
			}
		}
	}

	forceFail(){
		this.forced = true;
		this.forcedFailure = true;
		if( this.isUnknown) this.forceSuccessLevel( CoC7Check.successLevel.failure);
		else {
			this.forceSuccessLevel( this.difficulty - 1); 
		}
	}

	_forceCheck( high, low){
		let total = Math.floor(Math.random() * (high-low)) + low + 1;
		const unitTotal = total % 10;
		let tenTotal = Math.floor( total/10);
		const tens = [];

		let hasEnough = Math.abs(this.diceModifier) == tens.length;
		while (!hasEnough) {
			let ten = Math.floor(Math.random() * 10);
			let roll = (ten * 10 + unitTotal);
			if( 0 == roll){ roll = 100; ten = 100;}
			if( this.hasPenalty && roll <= high){
				tens.push(ten);
				if( roll > total) total = roll;
			}
			if( this.hasBonus && roll > low){
				tens.push(ten);
				if( roll < total) total = roll;
			}
			hasEnough = ( tens.length == Math.abs(this.diceModifier));
		}

		// Insert result at random position.
		if( 10 == tenTotal && 0 == unitTotal) { tenTotal = 100;}
		tens.splice( Math.floor(Math.random() * tens.length + 1), 0, 10 == tenTotal? 0 : tenTotal);

		this.dices.tens =[];
		this.dices.unit.value = unitTotal;
		this.dices.total = total;
		this.dices.tenResult = total - unitTotal;

		let max = (unitTotal == 0)? 100 : 90;
		let min = (unitTotal == 0)? 10 : 0;
		let selected = total - unitTotal;
	
		for( let i = 0; i < tens.length; i++)
		{
			let die = {};
			die.value = tens[i];
			if( die.value == selected) {
				selected = 101;
				die.selected = true;
				if( this.hasBonus) { die.isMax = true; die.isMin = false;}
				else {die.isMin = true; die.isMax = false;}
			} else {
				if( die.value == max) die.isMax = true; else die.isMax = false;
				if( die.value == min) die.isMin = true; else die.isMin = false;
			}
			// if( die.value == 100) die.value = "00";
			this.dices.tens.push( die);
		}

		this.computeCheck();
		this.updateChatCard();
	}

	
	forceSuccessLevel( successLevel){
		let high, low;
		if( CoC7Check.successLevel.fumble == successLevel)	{ high = 100; low = this.fumbleThreshold - 1;}
		if( CoC7Check.successLevel.failure == successLevel) {
			if( this.regularThreshold == (this.fumbleThreshold - 1)){ high = 100;}
			else high = this.fumbleThreshold - 1;
			low= this.regularThreshold;}
		if( CoC7Check.successLevel.regular == successLevel) { high = this.regularThreshold; low= this.hardThreshold;}
		if( CoC7Check.successLevel.hard == successLevel) { high = this.hardThreshold; low=this.extremeThreshold;}
		if( CoC7Check.successLevel.extreme == successLevel) { high =this.extremeThreshold; low=1;}
		if( CoC7Check.successLevel.critical == successLevel) { high =1; low=0;}
		if( high == low) low--; 
		if( 0 == high) high = this.fumbleThreshold - 1;
		this._forceCheck( high, low);
	}


	increaseSuccessLevel(){
		let high, low;
		if( CoC7Check.successLevel.fumble == this.successLevel) { 
			high = this.fumbleThreshold - 1;
			if( this.regularThreshold == this.fumbleThreshold - 1) low = this.hardThreshold;
			else low = this.regularThreshold; }
		if( CoC7Check.successLevel.failure == this.successLevel) { high = this.regularThreshold; low = this.hardThreshold;}
		if( CoC7Check.successLevel.regular == this.successLevel) { high = this.hardThreshold; low = this.extremeThreshold;}
		if( CoC7Check.successLevel.hard == this.successLevel) { high = this.extremeThreshold; low = this.criticalThreshold;}
		if( CoC7Check.successLevel.extreme == this.successLevel) { high = this.criticalThreshold; low = 0;}
		if( high == low) low--; 
		this._forceCheck( high, low);
	}

	decreaseSuccessLevel(){
		let high, low;
		if( CoC7Check.successLevel.failure == this.successLevel) { high = 100; low = this.fumbleThreshold - 1;}
		if( CoC7Check.successLevel.regular == this.successLevel) { high = this.fumbleThreshold - 1; low = this.regularThreshold;}
		if( CoC7Check.successLevel.hard == this.successLevel) { high = this.regularThreshold; low = this.hardThreshold;}
		if( CoC7Check.successLevel.extreme == this.successLevel) { high = this.hardThreshold; low = this.extremeThreshold;}
		if( CoC7Check.successLevel.critical == this.successLevel) { high = this.extremeThreshold; low = 1;}
		if( 0 == high) high = this.fumbleThreshold - 1;
		this._forceCheck( high, low);
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

	set flavor(x){
		this._flavor = x;
	}

	get flavor(){
		if( this._flavor) return this._flavor;
		let flavor = '';
		if( this.actor){
			if (this.skill) flavor = game.i18n.format('CoC7.CheckResult', {name : this.skill.name, value : this.skill.value, difficulty : this.difficultyString});
			if (this.item) flavor = game.i18n.format('CoC7.ItemCheckResult', {item : this.item.name, skill : this.skill.name, value : this.skill.value, difficulty : this.difficultyString});
			if (this.characteristic) flavor = game.i18n.format('CoC7.CheckResult', {name : game.i18n.format(this.actor.data.data.characteristics[this.characteristic].label), value : this.actor.data.data.characteristics[this.characteristic].value, difficulty : this.difficultyString});
			if (this.attribute) flavor = game.i18n.format('CoC7.CheckResult', {name : game.i18n.format(`CoC7.${this.actor.data.data.attribs[this.attribute].label}`), value : this.actor.data.data.attribs[this.attribute].value, difficulty : this.difficultyString});
		}
		else {
			if( this.rawValue) flavor = game.i18n.format('CoC7.CheckRawValue', {rawvalue : this.rawValue, difficulty : this.difficultyString});
		}

		if( this.pushing) {
			flavor = game.i18n.format('CoC7.Pushing') + flavor;
		}

		return flavor;

	}

	get tooltipHeader(){
		if (this.attribute) return game.i18n.format(`CoC7.LinkCheck${this.difficulty==CoC7Check.difficultyLevel.regular?'':'Diff'}${!this.diceModifier?'':'Modif'}`, { difficulty: this.difficultyString, modifier: this.diceModifier, name: game.i18n.format(`CoC7.${this.actor.data.data.attribs[this.attribute].label}`)}) + ` (${this.actor.data.data.attribs[this.attribute].value}%)`;
		if (this.characteristic) return game.i18n.format(`CoC7.LinkCheck${this.difficulty==CoC7Check.difficultyLevel.regular?'':'Diff'}${!this.diceModifier?'':'Modif'}`, {difficulty: this.difficultyString, modifier: this.diceModifier, name: game.i18n.localize(this.actor.data.data.characteristics[this.characteristic].label)}) + ` (${this.actor.data.data.characteristics[this.characteristic].value}%)`;
		if (this.skill) return game.i18n.format(`CoC7.LinkCheck${this.difficulty==CoC7Check.difficultyLevel.regular?'':'Diff'}${!this.diceModifier?'':'Modif'}`, {difficulty: this.difficultyString, modifier: this.diceModifier, name: this.skill.name}) + ` (${this.skill.value}%)`;
		return null;
	}

	async getHtmlRollElement( ){
		const template = 'systems/CoC7/templates/chat/rolls/in-card-roll.html';
		const html = await renderTemplate(template, this);
		if( html) return $.parseHTML( html)[0];
		return null;
	}

	async toMessage( pushing = false)//If card is provided atttached the roll to the card. If URID provided attach at this position.?
	{
		this.pushing = pushing;
		const template = 'systems/CoC7/templates/chat/roll-result.html';

		const html = await renderTemplate(template, this);

		let speakerData = {};
		let speaker;
		if( this.actor){
			if( this.token) speakerData.token = this.token;
			else speakerData.actor = this.actor;
			speaker = ChatMessage.getSpeaker(speakerData);
		} else {
			speaker = ChatMessage.getSpeaker();
		}

		const user = this.actor.user ? this.actor.user : game.user;

		const chatData = {
			user: user._id,
			speaker: speaker,
			flavor: this.flavor,
			content: html
		};

		if ( ['gmroll', 'blindroll'].includes(this.rollMode) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
		if ( this.rollMode === 'blindroll' ) chatData['blind'] = true;

		ChatMessage.create(chatData).then( msg => {return msg;});

	}

	/**
	 * 
	 * @param {*} makePublic 	Will change the roll mode to public
	 */
	async updateChatCard( makePublic = false){
		if( makePublic) this.rollMode = false; //reset roll mode
		const template = 'systems/CoC7/templates/chat/roll-result.html';
		const html = await renderTemplate(template, this);
		let newContent = html;

		if( !this.messageId) return $.parseHTML( html)[0]; //If no messageId return the HTMLElement containing the roll.
		//If no messageId

		const message = game.messages.get( this.messageId);
		const htmlMessage = $.parseHTML( message.data.content)[0];
		if( !(htmlMessage.classList.contains('roll-result'))){
			const htmlCheck = $.parseHTML( html)[0];
			const rollResultElement = htmlMessage.querySelector('.roll-result');
			rollResultElement?.replaceWith( htmlCheck);
			newContent = htmlMessage.outerHTML;
		}
		
		const chatData = { flavor: this.flavor, content: newContent };
		if( makePublic){
			chatData.whisper = [];
			chatData.blind = false;
		}
		const msg = await message.update(chatData);
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	static async updateCardSwitch(event){
		const card = event.currentTarget.closest('.chat-card');
		const check = await CoC7Check.getFromCard(card);
		check.gmDifficultyRegular = false;
		check.gmDifficultyHard = false;
		check.gmDifficultyExtreme = false;
		check.gmDifficultyCritical = false;
		if( 'gmDifficultyRegular' === event.currentTarget.dataset.flag){ check.gmDifficultyRegular = true;}
		if( 'gmDifficultyHard' === event.currentTarget.dataset.flag){ check.gmDifficultyHard = true;}
		if( 'gmDifficultyExtreme' === event.currentTarget.dataset.flag){ check.gmDifficultyExtreme = true;}
		if( 'gmDifficultyCritical' === event.currentTarget.dataset.flag){ check.gmDifficultyCritical = true;}
		check.computeCheck();
		check.updateChatCard();
	}

	async shortResult( details = false){
		const template = 'systems/CoC7/templates/chat/roll.html';
		this.details = details? details : false;
		const html = await renderTemplate(template, this);
		return html;
	}

	get tooltip(){
		return renderTemplate( 'systems/CoC7/templates/chat/rolls/roll-tooltip.html', this);
	}

	get inlineCheck(){
		const a = document.createElement('a');
		a.classList.add( 'coc7-inline-check');
		a.classList.add( 'coc7-check-result');
		a.classList.add( 'coc7-inline');
		a.classList.add( ...this.cssClassList);
		a.title = this.tooltipHeader;
		a.dataset.roll=escape(this.JSONRollString);//TODO!IMPORTANT!!!
		a.innerHTML= `<i class="game-icon game-icon-d10"></i> ${this.dices.total}`;
		return a;
		// return renderTemplate( 'systems/CoC7/templates/chat/rolls/inline-roll.html', this);
	}

	get rollToolTip(){
		const parts = [];
		const tens = this.dices.tens.map( r => {
			return{
				result: r.value,
				selected: r.selected,
				classes: [
					'die',
					'd10',
					!r.selected?'discarded':null,
					r.isMin?'min':null,
					r.isMax?'max':null
				].filter(c => c).join(' ')
			};
		});
		const unit = [
			{
				result: this.dices.unit.value,
				selected: true,
				classes: 'die d10'
			}
		];
		
		parts.push( {
			formula: this.tooltipHeader,
			total: this.dices.total,
			icons: this.successLevelIcons,
			class: this.cssClass,
			successRequired: this.successRequired,
			resultType: this.resultType,
			face: 10,
			rolls: [ ...tens, ...unit]
		});
		return renderTemplate( 'systems/CoC7/templates/chat/rolls/roll-tooltip.html', {parts});
	}

	get JSONRollData(){
		return JSON.parse(this.JSONRollString);
	}

	get JSONRollString(){
		return JSON.stringify(this, (key,value)=>{
			if( null === value) return undefined;
			const exclude = ['_actor', '_skill', '_item'];
			if( exclude.includes(key)) return undefined;
			return value;
		});
	}

	static async _onClickInlineRoll( event){
		event.preventDefault();
		const a = event.currentTarget;

		if ( a.classList.contains('coc7-check-result') ) {
			if ( a.classList.contains('expanded') ) {
				return CoC7Check._collapseInlineResult(a);
			} else {
				return CoC7Check._expandInlineResult(a);
			}
		}
	}

	static _collapseInlineResult(a) {
		if ( !a.classList.contains('coc7-inline-check') ) return;
		if ( !a.classList.contains('expanded') ) return;
		const tooltip = a.querySelector('.coc7-check-tooltip');
		if ( tooltip ) tooltip.remove();
		return a.classList.remove('expanded');
	}

	static async _expandInlineResult(a) {
		if ( !a.classList.contains('coc7-inline-check') ) return;
		if ( a.classList.contains('expanded') ) return;
	
		// Create a new tooltip
		const check = Object.assign( new CoC7Check(), JSON.parse(unescape(a.dataset.roll)));// TODO : find stringify unescape !! 20210205
		const tip = document.createElement('div');
		tip.innerHTML = await check.rollToolTip;
	
		// Add the tooltip
		const tooltip = tip.children[0];
		a.appendChild(tooltip);
		a.classList.add('expanded');
	
		// Set the position
		const pa = a.getBoundingClientRect();
		const pt = tooltip.getBoundingClientRect();
		tooltip.style.left = `${Math.min(pa.x, window.innerWidth - (pt.width + 3))}px`;
		tooltip.style.top = `${Math.min(pa.y + pa.height + 3, window.innerHeight - (pt.height + 3))}px`;
		const zi = getComputedStyle(a).zIndex;
		tooltip.style.zIndex = Number.isNumeric(zi) ? zi + 1 : 100;
	}

}