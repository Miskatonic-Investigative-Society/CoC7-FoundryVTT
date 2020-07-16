import { CoC7Dice } from './dice.js';

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
		if( x == null) {
			this._actor = x;
			return;
		}

		if( x instanceof Actor) {
			this._actor = x;
			this._actor.alias = this.actor.name;
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

	set skill(x) { this._skill = this._getItemFromId( x); }
	set item(x) { this._item = this._getItemFromId( x); }

	_getItemFromId( x)
	{
		if( x == null) return null;
		if( x instanceof Item) return x;
		if( this._actor) return this._actor.getOwnedItem( x);
		return game.items.get( x);
	}

	get actor() { return this._actor; }
	get skill() { 
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

	get item() { return this._item; }


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

	_perform()
	{
		this.dice = CoC7Dice.roll( this.diceModifier);
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
		let highest = this.dice.total - this.dice.unit.total;
	
		for( let i = 0; i < this.dice.tens.results.length; i++)
		{
			let die = {};
			die.value = this.dice.tens.results[i];
			if( die.value == max) die.isMax = true; else die.isMax = false;
			if( die.value == min) die.isMin = true; else die.isMin = false;
			if( die.value == highest){ highest = 101; die.selected = true;}
			// if( die.value == 100) die.value = "00";
			this.dices.tens.push( die);
		}

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

		if( this.dice.total <= this.rawValue){
			this.resultType = game.i18n.format('CoC7.RegularSuccess');
			this.successLevel = CoC7Check.successLevel.regular;
		}

		if( this.dice.total <= this.hardThreshold){
			this.resultType = game.i18n.format('CoC7.HardSuccess');
			this.successLevel = CoC7Check.successLevel.hard;
		}

		if( this.dice.total <= this.extremeThreshold){
			this.resultType = game.i18n.format('CoC7.ExtremeSuccess');
			this.successLevel = CoC7Check.successLevel.extreme;
		}

		if( this.dice.total > this.rawValue){
			this.resultType = game.i18n.format('CoC7.Failure');
			this.successLevel = CoC7Check.successLevel.failure;
		}

		if( 1 == this.dice.total){
			this.resultType = game.i18n.format('CoC7.CriticalSuccess');
			this.successLevel = CoC7Check.successLevel.critical;
		}

		if( this.fumbleThreshold <= this.dice.total){
			this.resultType = game.i18n.format('CoC7.Fumble');
			this.successLevel = CoC7Check.successLevel.fumble;
		}

		switch( this.difficulty)
		{
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
		default:
			this.succesThreshold = this.rawValue;
			break;
		}
		this.successRequired = game.i18n.format('CoC7.SuccessRequired', {successRequired : this.difficultyString});


		this.passed = this.succesThreshold >= this.dice.total ? true : false;
		if (this.dice.total == 1){
			this.passed = true; // 1 is always a success
			this.successLevel = CoC7Check.successLevel.critical;
		}
		this.isSuccess = this.passed;

		


		this.isFumble = this.dice.total >= this.fumbleThreshold;
		this.isCritical = this.dice.total == 1;
		this.hasMalfunction = false;
		if( this.isFumble) this.successLevel = CoC7Check.successLevel.fumble;

		if( this.item)
		{
			this.isItem = true;
			if( this.item.data.data.malfunction) {
				if( this.dice.total >= this.item.data.data.malfunction) this.hasMalfunction = true;
				this.malfunctionTxt = game.i18n.format('CoC7.Malfunction', {itemName : this.item.name});
			}
		}
		this.canBePushed = this.skill ? this.skill.canBePushed() : false;
		if( this.characteristic != null) this.canBePushed = true;
		if( this.isFumble) this.canBePushed = false;
		
		if( !this.passed && !this.isFumble) {
			if( this.skill || this.characteristic){
				let luckNeeded = this.dice.total - this.succesThreshold;
				if( this.actor.luck > luckNeeded){
					this.hasEnoughLuck = true;
					this.luckNeeded = luckNeeded;
					this.luckNeededTxt = game.i18n.format('CoC7.SpendLuck', {luckNeededValue : luckNeeded});
				}
			}
		}

		this.increaseSuccess = [];

		// Can't spend luck on pushed rolls.
		if( !this.pushing){

			if(this.difficulty <= CoC7Check.difficultyLevel.regular  && this.dice.total > this.hardThreshold){
				let nextLevel = {};
				nextLevel.difficultyName = game.i18n.localize('CoC7.HardDifficulty');
				nextLevel.difficulty = CoC7Check.difficultyLevel.hard;
				nextLevel.LuckToSpend = this.dice.total - this.hardThreshold;
				nextLevel.hasEnoughLuck = (nextLevel.LuckToSpend <= this.actor.luck);
				if (nextLevel.LuckToSpend <= this.actor.luck) this.increaseSuccess.push(nextLevel);
			}

			if(this.difficulty <= CoC7Check.difficultyLevel.hard  && this.dice.total > this.extremeThreshold){
				let nextLevel = {};
				nextLevel.difficultyName = game.i18n.localize('CoC7.ExtremeDifficulty');
				nextLevel.difficulty = CoC7Check.difficultyLevel.extreme;
				nextLevel.LuckToSpend = this.dice.total - this.extremeThreshold;
				nextLevel.hasEnoughLuck = (nextLevel.LuckToSpend <= this.actor.luck);
				if (nextLevel.LuckToSpend <= this.actor.luck) this.increaseSuccess.push(nextLevel);
			}
		}

		this.canIncreaseSuccess = this.increaseSuccess.length > 0 ? true : false;
		if( this.isFumble) this.canIncreaseSuccess = false;
		this.difficultyLevel = this.difficulty;

		if( this.passed && this.diceModifier <= 0 && this.skill && !this.skill.data.data.properties.noxpgain){
			this.skill.flagForDevelopement();
		}
	}

	set difficulty(x){
		this._difficulty = parseInt(x);
	}

	get difficulty(){
		return this._difficulty;
	}

	async toMessage( pushing = false)
	{
		const template = 'systems/CoC7/templates/chat/roll-result.html';
		const html = await renderTemplate(template, this);
		let flavor;
		if( this.actor){
			if (this.skill) flavor = game.i18n.format('CoC7.CheckResult', {name : this.skill.name, value : this.skill.data.data.value, difficulty : this.difficultyString});
			if (this.item) flavor = game.i18n.format('CoC7.ItemCheckResult', {item : this.item.name, skill : this.skill.name, value : this.skill.data.data.value, difficulty : this.difficultyString});
			if (this.characteristic) flavor = game.i18n.format('CoC7.CheckResult', {name : game.i18n.format(this.actor.data.data.characteristics[this.characteristic].label), value : this.actor.data.data.characteristics[this.characteristic].value, difficulty : this.difficultyString});
			if (this.attribute) flavor = game.i18n.format('CoC7.CheckResult', {name : game.i18n.format(this.actor.data.data.attribs[this.attribute].label), value : this.actor.data.data.attribs[this.attribute].value, difficulty : this.difficultyString});
		}
		else {
			if( this.rawValue) flavor = game.i18n.format('CoC7.CheckRawValue', {rawvalue : this.rawValue, difficulty : this.difficultyString});
		}

		if( pushing) {
			flavor = game.i18n.format('CoC7.Pushing') + flavor;
		}

		let speaker;
		if( this.actor){
			speaker = ChatMessage.getSpeaker({actor: this.actor});
			speaker.alias = this.actor.alias;
		}
		else speaker = ChatMessage.getSpeaker();

		ChatMessage.create({
			user: game.user._id,
			speaker: speaker,
			flavor: flavor,
			content: html
		}).then( msg => {return msg;});

	}

}