import { CoC7Check } from '../check.js';
import { chatHelper } from './helper.js';
import { CoC7Chat } from '../chat.js';

export class CoC7MeleeInitiator{
	constructor(actorKey = null, itemId = null, fastForward = false) {
		this.actorKey = actorKey;
		this.itemId = itemId;
		this.fastForward = fastForward;
		this.resolved = false;
		this.outnumbered = false;
		this.surprised = false;
		this.autoSuccess = false;
		this.advantage = false;
		this.disadvantage = false;
		this.messageId = null;
		this.targetCard = null;
		this.rolled = false;
	}

	get actor(){
		return chatHelper.getActorFromKey( this.actorKey);
	}

	get item(){
		return this.actor.getOwnedItem( this.itemId);
	}

	get weapon(){
		return this.item;
	}

	get targets(){
		return [...game.user.targets];
	}

	get target(){
		return this.targets.pop();
	}

	get skills(){
		return this.actor.getWeaponSkills( this.itemId);
	}

	template = 'systems/CoC7/templates/chat/combat/melee-initiator.html';

	async createChatCard(){
		const html = await renderTemplate(this.template, this);
		
		const speaker = ChatMessage.getSpeaker({actor: this.actor});
		if( this.actor.isToken) speaker.alias = this.actor.token.name;
		
		const user = this.actor.user ? this.actor.user : game.user;

		const chatMessage = await ChatMessage.create({
			user: user._id,
			speaker,
			content: html
		});
		
		return chatMessage;
	}

	async updateChatCard(){
		let html = await renderTemplate(this.template, this);

		const message = game.messages.get( this.messageId);

		const msg = await message.update({ content: html });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	toggleFlag( flagName){
		const flag = flagName.includes('-') ? chatHelper.hyphenToCamelCase( flagName) : flagName;
		this[flag] = !this[flag];
	}


	async performSkillCheck( skillId = null, publish = false){
		const check = new CoC7Check();
		check.referenceMessageId = this.messageId;
		check.rollType= 'opposed';
		check.side = 'initiator';
		check.action = 'attack';
		check.actor = this.actorKey;
		check.item = this.itemId;
		check.skill = skillId;
		check.difficulty = CoC7Check.difficultyLevel.regular;
		check.diceModifier = 0;

		if( this.outnumbered) check.diceModifier += 1;
		if( this.surprised) check.diceModifier += 1;
		if( this.disadvantage) check.diceModifier -= 1;
		if( this.advantage) check.diceModifier += 1;

		check.roll();
		this.check = check;
		this.rolled = true;
		this.resolved = true;
		if( publish) check.toMessage();

		if( this.target){
			const target = new CoC7MeleeTarget( this.target.actor.tokenKey, this.messageId, this.fastForward);
			const message = await target.createChatCard();
			this.targetCard = message.id;
		}
		return check;
	}

	async publishCheckResult( check = null){
		if( !check && !this.check) return null;

		if( check) this.check = check;
		this.roll = CoC7Roll.getFromCheck( this.check);
		this.rolled = true;

		this.roll.rollIcons = [];
		if( this.roll.critical){
			this.roll.rollColor = 'goldenrod';
			this.roll.rollTitle = game.i18n.localize('CoC7.CriticalSuccess');
			for( let index = 0; index < 4; index++){
				this.roll.rollIcons.push( 'medal');
			}
		} else if(  this.roll.fumble) {
			this.roll.rollColor = 'darkred';
			this.roll.rollTitle = game.i18n.localize('CoC7.Fumble');
			for( let index = 0; index < 4; index++){
				this.roll.rollIcons.push( 'spider');
			}
		}else if(  this.roll.success){
			this.roll.rollColor = 'goldenrod';
			if( CoC7Check.successLevel.regular ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.RegularSuccess');
			if( CoC7Check.successLevel.hard ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.HardSuccess');
			if( CoC7Check.successLevel.extreme ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.ExtremeSuccess');
			for (let index = 0; index <  this.roll.successLevel; index++) {
				this.roll.rollIcons.push( 'star');
			} 
		} else {
			this.roll.rollColor = 'black';
			this.roll.rollTitle = game.i18n.localize('CoC7.Failure');
			this.roll.rollIcons.push( 'skull');
		}

		if( !this.targetCard){
			const resolutionCard = new CoC7MeleeResoltion( this.parentMessageId, this.messageId);
			const resolutionMessage = await resolutionCard.preCreateMessage();
	
			this.resolutionCard = resolutionMessage.id;
		}
		await this.updateChatCard();
	}

	static getFromCard( card, messageId = null){
		const initiator = new CoC7MeleeInitiator();
		chatHelper.getObjectFromElement( initiator, card);
		initiator.roll = CoC7Roll.getFromCard( card);
		
		if( card.closest('.message'))
			initiator.messageId = card.closest('.message').dataset.messageId;
		else initiator.messageId = messageId;
		return initiator;
	}

	static getFromMessageId( messageId){
		const message = game.messages.get( messageId);
		if( ! message) return null;
		const card = $(message.data.content)[0];

		const initiator = CoC7MeleeInitiator.getFromCard( card, messageId);
		initiator.messageId = messageId;

		return initiator;
	}
	
	static updateCardSwitch( event, publishUpdate = true){
		const card = event.currentTarget.closest('.melee.initiator');
		const flag = event.currentTarget.dataset.flag;
		const camelFlag = chatHelper.hyphenToCamelCase(flag);

		//update only for local player
		if( !publishUpdate){
			card.dataset[camelFlag] = 'true' == card.dataset[camelFlag] ? false : true;
			event.currentTarget.classList.toggle('switched-on');
			event.currentTarget.dataset.selected = card.dataset[camelFlag];
		} else { //update card for all player
			const initiator = CoC7MeleeInitiator.getFromCard( card);
			initiator.toggleFlag(flag);
			initiator.updateChatCard();
		}
	}

	upgradeRoll( luckAmount, newSuccessLevel, oldCard){
		if( !this.actor.spendLuck( luckAmount)) ui.notifications.error(`${actor.name} didn't have enough luck to pass the check`);
		this.roll.value = null;
		this.roll.successLevel = newSuccessLevel;
		this.roll.luckSpent = true;
		oldCard.dataset.processed = false;
		
		const diceRolls = oldCard.querySelector('.dice-roll');
		diceRolls.dataset.value = null;
		diceRolls.dataset.successLevel = newSuccessLevel;
		diceRolls.dataset.luckSpent = true;

		const resulDetails = oldCard.querySelector('.result-details');
		const diceTotal = oldCard.querySelector('.dice-total');
		switch (newSuccessLevel) {
		case CoC7Check.successLevel.regular:
			diceTotal.innerText = game.i18n.localize('CoC7.RegularSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.RegularDifficulty')});
			break;
		
		case CoC7Check.successLevel.hard:
			diceTotal.innerText = game.i18n.localize('CoC7.HardSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.HardDifficulty')});
			break;
		
		case CoC7Check.successLevel.extreme:
			diceTotal.innerText = game.i18n.localize('CoC7.ExtremeSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.ExtremeDifficulty')});
			break;
		
		case CoC7Check.successLevel.critical:
			diceTotal.innerText = game.i18n.localize('CoC7.CriticalSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.CriticalDifficulty')});
			break;
		
		default:
			break;
		}

		diceTotal.classList.replace( 'failure', 'success');
		oldCard.querySelector('.card-buttons').remove();
		oldCard.querySelector('.dice-tooltip').style.display = 'none';
		CoC7Chat.updateChatCard( oldCard);
	}
}

export class CoC7MeleeTarget{
	constructor(actorKey, parentMessageId = null, fastForward = false) {
		this.actorKey = actorKey;
		this.parentMessageId = parentMessageId;
		this.fastForward = fastForward;
		this.resolved = false;

		this.outnumbered = false;
		this.surprised = false;
		this.autoSuccess = false;
		this.advantage = false;
		this.disadvantage = false;

		this.messageId = null;
		this.skillId = null;
		this.itemId = null;
		this.dodging = false;
		this.fightingBack = false;
		this.maneuvering = false;
	}

	get actor(){
		return chatHelper.getActorFromKey( this.actorKey);
	}

	get weapon(){
		return this.actor.getOwnedItem( this.itemId);
	}

	get skill(){
		return this.actor.getOwnedItem( this.skillId);
	}

	get actionSelected(){
		return this.dodging || this.fightingBack || this.maneuvering;
	}

	get action(){
		if( this.dodging) return 'dodge';
		if( this.fightingBack) return 'fightBack';
		if( this.maneuvering) return 'maneuver';
		return null;
	}

	template = 'systems/CoC7/templates/chat/combat/melee-target.html';

	static getFromMessageId( messageId){
		const message = game.messages.get( messageId);
		if( ! message) return null;
		const card = $(message.data.content)[0];

		const target = CoC7MeleeTarget.getFromCard( card, messageId);
		target.messageId = messageId;

		return target;
	}

	static updateCardSwitch( event, publishUpdate = true){
		const card = event.currentTarget.closest('.melee.target');
		const flag = event.currentTarget.dataset.flag;
		const camelFlag = chatHelper.hyphenToCamelCase(flag);

		//update only for local player
		if( !publishUpdate){
			card.dataset[camelFlag] = 'true' == card.dataset[camelFlag] ? false : true;
			event.currentTarget.classList.toggle('switched-on');
			event.currentTarget.dataset.selected = card.dataset[camelFlag];
		} else { //update card for all player
			const target = CoC7MeleeTarget.getFromCard( card);
			target.toggleFlag(flag);
			target.updateChatCard();
		}
	}

	toggleFlag( flagName){
		const flag = flagName.includes('-') ? chatHelper.hyphenToCamelCase( flagName) : flagName;
		this[flag] = !this[flag];
	}

	async createChatCard(){
		const html = await renderTemplate(this.template, this);
		
		const speaker = ChatMessage.getSpeaker({actor: this.actor});
		if( this.actor.isToken) speaker.alias = this.actor.token.name;
		
		const user = this.actor.user ? this.actor.user : game.user;

		const message = await ChatMessage.create({
			user: user._id,
			speaker,
			content: html
		});
		
		this.messageId = message.id;
		return message;
	}

	async updateChatCard(){
		let html = await renderTemplate(this.template, this);
		const message = game.messages.get( this.messageId);

		const msg = await message.update({ content: html });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	async getUpdatedChatCard(){
		renderTemplate(this.template, this).then( html => {return html;});
	}

	static async updateSelected( card, event){
		const target = CoC7MeleeTarget.getFromCard( card);

		switch (event.currentTarget.dataset.action) {
		case 'dodge':
			target.dodging = true;
			target.fightingBack = false;
			target.maneuvering = false;
			target.skillId = event.currentTarget.dataset.skillId;
			target.itemId = null;
			break;
		
		case 'fightBack':
			target.dodging = false;
			target.fightingBack = true;
			target.maneuvering = false;
			target.skillId = event.currentTarget.dataset.skillId;
			target.itemId = event.currentTarget.dataset.weaponId;
			break;

		case 'maneuver':
			target.dodging = false;
			target.fightingBack = false;
			target.maneuvering = true;
			target.skillId = event.currentTarget.dataset.skillId;
			target.itemId = null;
			break;

		default:
			break;
		}

		target.updateChatCard();

		return target;
	}

	async performSkillCheck( skillId = null, publish = false){
		const check = new CoC7Check();
		check.referenceMessageId = this.messageId;
		check.rollType= 'opposed';
		check.side = 'target';
		check.action = this.action;
		check.actor = this.actor;
		check.item = this.itemId;
		check.skill = skillId;
		check.difficulty = CoC7Check.difficultyLevel.regular;
		check.diceModifier = 0;

		if( this.disadvantage) check.diceModifier -= 1;
		if( this.advantage) check.diceModifier += 1;

		check.roll();
		this.check = check;
		this.rolled = true;
		this.resolved = true;
		if( publish) check.toMessage();


		// const initiator = CoC7MeleeInitiator.getFromMessageId( this.parentMessageId);

		return check;
	}

	async publishCheckResult( check = null){
		if( !check && !this.check) return null;

		if( check) this.check = check;
		this.roll = CoC7Roll.getFromCheck( this.check);
		this.rolled = true;

		this.roll.rollIcons = [];
		if( this.roll.critical){
			this.roll.rollColor = 'goldenrod';
			this.roll.rollTitle = game.i18n.localize('CoC7.CriticalSuccess');
			for( let index = 0; index < 4; index++){
				this.roll.rollIcons.push( 'medal');
			}
		} else if(  this.roll.fumble) {
			this.roll.rollColor = 'darkred';
			this.roll.rollTitle = game.i18n.localize('CoC7.Fumble');
			for( let index = 0; index < 4; index++){
				this.roll.rollIcons.push( 'spider');
			}
		}else if(  this.roll.success){
			this.roll.rollColor = 'goldenrod';
			if( CoC7Check.successLevel.regular ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.RegularSuccess');
			if( CoC7Check.successLevel.hard ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.HardSuccess');
			if( CoC7Check.successLevel.extreme ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.ExtremeSuccess');
			for (let index = 0; index <  this.roll.successLevel; index++) {
				this.roll.rollIcons.push( 'star');
			} 
		} else {
			this.roll.rollColor = 'black';
			this.roll.rollTitle = game.i18n.localize('CoC7.Failure');
			this.roll.rollIcons.push( 'skull');
		}

		const resolutionCard = new CoC7MeleeResoltion( this.parentMessageId, this.messageId);
		const resolutionMessage = await resolutionCard.preCreateMessage();

		this.resolutionCard = resolutionMessage.id;
		await this.updateChatCard();
	}

	static getFromCard( card, messageId = null){
		const actorKey = card.dataset.actorKey;
		const parentMessageId = card.dataset.parentMessageId;
		const fastForward = 'true' == card.dataset.fastForward;
		const target = new CoC7MeleeTarget( actorKey, parentMessageId, fastForward);
		
		target.roll = CoC7Roll.getFromCard( card);
		chatHelper.getObjectFromElement( target, card);

		if( card.closest('.message'))
			target.messageId = card.closest('.message').dataset.messageId;
		else target.messageId = messageId;
		return target;

	}

	upgradeRoll( luckAmount, newSuccessLevel, oldCard){
		if( !this.actor.spendLuck( luckAmount)) ui.notifications.error(`${actor.name} didn't have enough luck to pass the check`);
		this.roll.value = null;
		this.roll.successLevel = newSuccessLevel;
		this.roll.luckSpent = true;
		oldCard.dataset.processed = false;
		
		const diceRolls = oldCard.querySelector('.dice-roll');
		diceRolls.dataset.value = null;
		diceRolls.dataset.successLevel = newSuccessLevel;
		diceRolls.dataset.luckSpent = true;

		const resulDetails = oldCard.querySelector('.result-details');
		const diceTotal = oldCard.querySelector('.dice-total');
		switch (newSuccessLevel) {
		case CoC7Check.successLevel.regular:
			diceTotal.innerText = game.i18n.localize('CoC7.RegularSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.RegularDifficulty')});
			break;
		
		case CoC7Check.successLevel.hard:
			diceTotal.innerText = game.i18n.localize('CoC7.HardSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.HardDifficulty')});
			break;
		
		case CoC7Check.successLevel.extreme:
			diceTotal.innerText = game.i18n.localize('CoC7.ExtremeSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.ExtremeDifficulty')});
			break;
		
		case CoC7Check.successLevel.critical:
			diceTotal.innerText = game.i18n.localize('CoC7.CriticalSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.CriticalDifficulty')});
			break;
		
		default:
			break;
		}

		diceTotal.classList.replace( 'failure', 'success');
		oldCard.querySelector('.card-buttons').remove();
		oldCard.querySelector('.dice-tooltip').style.display = 'none';
		CoC7Chat.updateChatCard( oldCard);
	}
}

export class CoC7MeleeResoltion{
	constructor(initiatorMessage = null, targetMessage = null, messageId = null) {
		this.initiatorMessage = initiatorMessage;
		this.targetMessage = targetMessage;
		this.messageId = messageId;
	}

	async preCreateMessage(){
		const html = await renderTemplate(this.template, this);
		
		// const speaker = ChatMessage.getSpeaker({actor: this.actor});
		// if( this.actor.isToken) speaker.alias = this.actor.token.name;
		
		// const user = this.actor.user ? this.actor.user : game.user;

		const chatMessage = await ChatMessage.create({
			user: game.user._id,
			// speaker,
			content: html
		});
		
		this.messageId = chatMessage.id;
		return chatMessage;
	}

	get target(){
		if(this.targetMessage) return CoC7MeleeTarget.getFromMessageId(this.targetMessage);
		return null;
	}

	get initiator(){
		if(this.initiatorMessage) return CoC7MeleeInitiator.getFromMessageId(this.initiatorMessage);
		return null;
	}


	async resolve(){
		if( this.target){
			switch (this.target.action) {
			case 'dodge':
				if( this.initiator.roll.successLevel <= 0 && this.target.roll.successLevel <= 0){
					this.resultString = 'Both side failed.';
					this.winner = null;
					this.rollDamage = false;
				}
				else if( this.initiator.roll.successLevel > this.target.roll.successLevel){
					this.resultString = `${this.initiator.actor.name} won. Roll damage`;
					this.winner = this.initiator;
					this.action = 'roll-damage';
					this.rollDamage = true;
				}
				else if( this.initiator.roll.successLevel <= this.target.roll.successLevel){
					this.resultString = `${this.target.actor.name} dodged.`;
					this.winner = this.target;
					this.action = 'dodge';
					this.rollDamage = false;
				}
					
				break;
			
			case 'fightBack':
				if( this.initiator.roll.successLevel <= 0 && this.target.roll.successLevel <= 0){
					this.resultString = 'Both side failed.';
					this.winner = null;
					this.rollDamage = false;
				}
				else if( this.initiator.roll.successLevel >= this.target.roll.successLevel){
					this.resultString = `${this.initiator.actor.name} won. Roll damage`;
					this.winner = this.initiator;
					this.looser = this.target;
					this.rollDamage = true;
				}
				else if( this.initiator.roll.successLevel <= this.target.roll.successLevel){
					this.resultString = `${this.target.actor.name} won. Roll damage`;
					this.winner = this.target;
					this.looser = this.initiator;
					this.rollDamage = true;
				}
					
				break;
			
			case 'maneuver':
				if( this.initiator.roll.successLevel <= 0 && this.target.roll.successLevel <= 0){
					this.resultString = 'Both side failed.';
					this.winner = null;
					this.rollDamage = false;
				}
				else if( this.initiator.roll.successLevel >= this.target.roll.successLevel){
					this.resultString = `${this.initiator.actor.name} won. Roll damage`;
					this.winner = this.initiator;
					this.looser = this.target;
					this.rollDamage = true;
				}
				else if( this.initiator.roll.successLevel <= this.target.roll.successLevel){
					this.resultString = `${this.target.actor.name} maneuver was successful.`;
					this.winner = this.target;
					this.looser = this.initiator;
					this.rollDamage = false;
				}
					
				break;
			
			default:
				break;
			}
		} else {
			if( this.initiator.roll.successLevel > 0){
				this.resultString = `${this.initiator.actor.name} won. Roll damage`;
				this.winner = this.initiator;
				this.rollDamage = true;
			} else {
				this.resultString = `${this.initiator.actor.name} missed.`;
				this.winner = this.initiator;
				this.rollDamage = false;

			}
		}

		if( this.winner){
			if( this.winner.roll.successLevel >= CoC7Check.successLevel.extreme) this.winner.roll.criticalDamage = true;
			else this.winner.roll.criticalDamage = false;
		}


		this.resolved = true;
		const html = await renderTemplate(this.template, this);
		if( this.messageId){
			const message = game.messages.get( this.messageId);
			const speaker = this.winner ? ChatMessage.getSpeaker({actor: this.winner.actor}) : null;
			const user = this.winner ? this.winner.actor.user ? this.winner.actor.user : game.user : game.user;

			let msg;
			if( speaker) msg = await message.update({ 
				user: user._id,
				speaker,
				content: html });
			else  msg = await message.update({ 
				user: user._id,
				content: html });
			await ui.chat.updateMessage( msg, false);
			return msg;
		}
	}

	get template(){
		return 'systems/CoC7/templates/chat/combat/melee-resolution.html';
	}
}
export class CoC7Roll{
	static getFromCard( card){

		const rollDiv = card.querySelector( 'div.dice-roll');
		if( !rollDiv) return null;

		const roll = new CoC7Roll();
		chatHelper.getObjectFromElement( roll, rollDiv);

		return roll;
	}

	static getFromCheck( check){
		const roll = new CoC7Roll();

		roll.rollType = check.rollType;
		roll.side = check.side;
		roll.action = check.action;
		roll.refMessageId = check.refMessageId;
		roll.referenceMessageId = check.referenceMessageId;

		roll.successLevel = check.successLevel;
		roll.difficulty = check.difficulty;
		roll.skillId = check.skill ? check.skill.id : null;
		roll.itemId = check.item ? check.item.id: null;
		roll.diceMod = check.diceModifier;
		roll.value = parseInt( check.rawValue);
		roll.fumble = check.isFumble;
		roll.critical = check.isCritical;
		roll.characteristic = check.characteristic ? check.characteristic: null;
		roll.result = check.dice.total;


		roll.actorKey = check.actor.tokenKey;

		if( check.actor.isToken){
			roll.tokenId = check.actor.tokenKey;
			roll.actorId = null;
		} else {
			roll.tokenKey = null;
			roll.actorId = check.actor.tokenKey;
		}

		return roll;
	}

	static attachCheckToElement( card, check){
		roll = CoC7Roll.getFromCheck( check);
		roll.attachToElement( card);

		return roll;
	}

	attachToElement( card){
		chatHelper.attachObjectToElement(this, card);
	}
}

export class CoC7RangeInitiator{
	constructor(actorKey = null, itemId = null, fastForward = false) {
		this.actorKey = actorKey;
		this.itemId = itemId;
		this.fastForward = fastForward;
		this.resolved = false;
		this.cover = false;
		this.surprised = false;
		this.autoSuccess = false;
		this.advantage = false;
		this.disadvantage = false;
		this.messageId = null;
		this.targetCard = null;
		this.rolled = false;
		this.baseRange = true;
		this.longRange = false;
		this.extremeRange = false;
	}

	get actor(){
		return chatHelper.getActorFromKey( this.actorKey);
	}

	get item(){
		return this.actor.getOwnedItem( this.itemId);
	}

	get weapon(){
		return this.item;
	}

	get targets(){
		return [...game.user.targets];
	}

	get target(){
		return this.targets.pop();
	}

	get skills(){
		return this.actor.getWeaponSkills( this.itemId);
	}

	template = 'systems/CoC7/templates/chat/combat/range-initiator.html';

	async createChatCard(){
		const html = await renderTemplate(this.template, this);
		
		const speaker = ChatMessage.getSpeaker({actor: this.actor});
		if( this.actor.isToken) speaker.alias = this.actor.token.name;
		
		const user = this.actor.user ? this.actor.user : game.user;

		const chatMessage = await ChatMessage.create({
			user: user._id,
			speaker,
			content: html
		});
		
		return chatMessage;
	}

	async updateChatCard(){
		let html = await renderTemplate(this.template, this);

		const message = game.messages.get( this.messageId);

		const msg = await message.update({ content: html });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	toggleFlag( flagName){
		const flag = flagName.includes('-') ? chatHelper.hyphenToCamelCase( flagName) : flagName;
		if( 'baseRange' === flag || 'longRange' === flag || 'extremeRange' === flag	){	
			this.baseRange = false;
			this.longRange = false;
			this.extremeRange = false;
			this[flag] = true;
		} else {
			this[flag] = !this[flag];
		}
	}


	async performSkillCheck( skillId = null, publish = false){
		const check = new CoC7Check();
		check.referenceMessageId = this.messageId;
		check.rollType= 'opposed';
		check.side = 'initiator';
		check.action = 'attack';
		check.actor = this.actorKey;
		check.item = this.itemId;
		check.skill = skillId;
		check.difficulty = CoC7Check.difficultyLevel.regular;
		check.diceModifier = 0;

		if( this.outnumbered) check.diceModifier += 1;
		if( this.surprised) check.diceModifier += 1;
		if( this.disadvantage) check.diceModifier -= 1;
		if( this.advantage) check.diceModifier += 1;

		check.roll();
		this.check = check;
		this.rolled = true;
		this.resolved = true;
		if( publish) check.toMessage();

		// if( this.target){
		// 	const target = new CoC7MeleeTarget( this.target.actor.tokenKey, this.messageId, this.fastForward);
		// 	const message = await target.createChatCard();
		// 	this.targetCard = message.id;
		// }
		return check;
	}

	async publishCheckResult( check = null){
		if( !check && !this.check) return null;

		if( check) this.check = check;
		this.roll = CoC7Roll.getFromCheck( this.check);
		this.rolled = true;

		this.roll.rollIcons = [];
		if( this.roll.critical){
			this.roll.rollColor = 'goldenrod';
			this.roll.rollTitle = game.i18n.localize('CoC7.CriticalSuccess');
			for( let index = 0; index < 4; index++){
				this.roll.rollIcons.push( 'medal');
			}
		} else if(  this.roll.fumble) {
			this.roll.rollColor = 'darkred';
			this.roll.rollTitle = game.i18n.localize('CoC7.Fumble');
			for( let index = 0; index < 4; index++){
				this.roll.rollIcons.push( 'spider');
			}
		}else if(  this.roll.success){
			this.roll.rollColor = 'goldenrod';
			if( CoC7Check.successLevel.regular ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.RegularSuccess');
			if( CoC7Check.successLevel.hard ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.HardSuccess');
			if( CoC7Check.successLevel.extreme ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize('CoC7.ExtremeSuccess');
			for (let index = 0; index <  this.roll.successLevel; index++) {
				this.roll.rollIcons.push( 'star');
			} 
		} else {
			this.roll.rollColor = 'black';
			this.roll.rollTitle = game.i18n.localize('CoC7.Failure');
			this.roll.rollIcons.push( 'skull');
		}

		if( !this.targetCard){
			const resolutionCard = new CoC7RangeResoltion( this.parentMessageId, this.messageId);
			const resolutionMessage = await resolutionCard.preCreateMessage();
	
			this.resolutionCard = resolutionMessage.id;
		}
		await this.updateChatCard();
	}

	static getFromCard( card, messageId = null){
		const initiator = new CoC7RangeInitiator();
		chatHelper.getObjectFromElement( initiator, card);
		initiator.roll = CoC7Roll.getFromCard( card);
		
		if( card.closest('.message'))
			initiator.messageId = card.closest('.message').dataset.messageId;
		else initiator.messageId = messageId;
		return initiator;
	}

	static getFromMessageId( messageId){
		const message = game.messages.get( messageId);
		if( ! message) return null;
		const card = $(message.data.content)[0];

		const initiator = CoC7RangeInitiator.getFromCard( card, messageId);
		initiator.messageId = messageId;

		return initiator;
	}
	
	static updateCardSwitch( event, publishUpdate = true){
		const card = event.currentTarget.closest('.range.initiator');
		const flag = event.currentTarget.dataset.flag;
		const camelFlag = chatHelper.hyphenToCamelCase(flag);

		//update only for local player
		if( !publishUpdate){
			card.dataset[camelFlag] = 'true' == card.dataset[camelFlag] ? false : true;
			event.currentTarget.classList.toggle('switched-on');
			event.currentTarget.dataset.selected = card.dataset[camelFlag];
		} else { //update card for all player
			const initiator = CoC7RangeInitiator.getFromCard( card);
			initiator.toggleFlag(flag);
			initiator.updateChatCard();
		}
	}

	upgradeRoll( luckAmount, newSuccessLevel, oldCard){
		if( !this.actor.spendLuck( luckAmount)) ui.notifications.error(`${actor.name} didn't have enough luck to pass the check`);
		this.roll.value = null;
		this.roll.successLevel = newSuccessLevel;
		this.roll.luckSpent = true;
		oldCard.dataset.processed = false;
		
		const diceRolls = oldCard.querySelector('.dice-roll');
		diceRolls.dataset.value = null;
		diceRolls.dataset.successLevel = newSuccessLevel;
		diceRolls.dataset.luckSpent = true;

		const resulDetails = oldCard.querySelector('.result-details');
		const diceTotal = oldCard.querySelector('.dice-total');
		switch (newSuccessLevel) {
		case CoC7Check.successLevel.regular:
			diceTotal.innerText = game.i18n.localize('CoC7.RegularSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.RegularDifficulty')});
			break;
		
		case CoC7Check.successLevel.hard:
			diceTotal.innerText = game.i18n.localize('CoC7.HardSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.HardDifficulty')});
			break;
		
		case CoC7Check.successLevel.extreme:
			diceTotal.innerText = game.i18n.localize('CoC7.ExtremeSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.ExtremeDifficulty')});
			break;
		
		case CoC7Check.successLevel.critical:
			diceTotal.innerText = game.i18n.localize('CoC7.CriticalSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.CriticalDifficulty')});
			break;
		
		default:
			break;
		}

		diceTotal.classList.replace( 'failure', 'success');
		oldCard.querySelector('.card-buttons').remove();
		oldCard.querySelector('.dice-tooltip').style.display = 'none';
		CoC7Chat.updateChatCard( oldCard);
	}
}
