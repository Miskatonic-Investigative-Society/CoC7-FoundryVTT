import { CoC7Check } from '../../check.js';
import { chatHelper, CoC7Roll } from '../helper.js';
import { CoC7Chat } from '../../chat.js';
import { ChatCardActor } from '../card-actor.js';
import { CoC7MeleeResoltion } from './melee-resolution.js';
import { CoC7MeleeInitiator } from './melee-initiator.js';

export class CoC7MeleeTarget extends ChatCardActor{
	constructor(actorKey, parentMessageId = null, fastForward = false) {
		super( actorKey, fastForward);
		this.actorKey = actorKey;
		this.initiatorKey = null;
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
	
	get actionSelected(){
		return this.dodging || this.fightingBack || this.maneuvering;
	}
    
	get action(){
		if( this.dodging) return 'dodge';
		if( this.fightingBack) return 'fightBack';
		if( this.maneuvering) return 'maneuver';
		return null;
	}
    
	get weapon(){
		return this.actor.getOwnedItem( this.itemId);
	}
    
	get skill(){
		return this.actor.getOwnedItem( this.skillId);
	}
    
	set initiatorKey(x){
		this._initiatorKey = x;
		this.targetKey = x;
	}

	get initiatorKey(){
		if( !this._initiatorKey){
			if( !this._initiator && this.parentMessageId) this._initiator = CoC7MeleeInitiator.getFromMessageId( this.parentMessageId);
			if( this._initiator) this._initiatorKey = this._initiator.actorKey;
		}
		if( !this._initiatorKey){ 
			ui.notifications.error(`No initiator found for target : ${this.actor.name}`);
			return null;
		}
		return this._initiatorKey;
	}

	get initiator(){
		if( !this.initiatorKey){
			if( this.parentMessageId){
				this._initiator = CoC7MeleeInitiator.getFromMessageId( this.parentMessageId);
				this.initiatorKey = this._initiator.actorKey;
			} else return null;
		}
		return chatHelper.getActorFromKey( this.initiatorKey);
	}

	get meleeInitiator(){
		if( !this._initiator) this._initiator = CoC7MeleeInitiator.getFromMessageId( this.parentMessageId);
		return this._initiator;
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

		const speakerData = {};
		const token = chatHelper.getTokenFromKey( this.actorKey);
		if( token) speakerData.token = token;
		else speakerData.actor = this.actor;
		
		const speaker = ChatMessage.getSpeaker(speakerData);
		if( this.actor.isToken) speaker.alias = this.actor.token.name;
		
		const user = this.actor.user ? this.actor.user : game.user;

		const chatData = {
			user: user._id,
			speaker,
			content: html
		};

		if ( ['gmroll', 'blindroll'].includes(this.rollMode) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
		// if ( this.isBlind ) chatData['blind'] = true;
		chatData.blind = false;

		const message = await ChatMessage.create(chatData);
		
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
		// Combat roll cannot be blind or unknown
		check.isBlind = false;
		check.isUnkonwn = false;
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

	upgradeRoll( luckAmount, newSuccessLevel, oldCard){  //TODO : Check if this needs to be async
		if( !this.actor.spendLuck( luckAmount)) ui.notifications.error(`${token.name} didn't have enough luck to pass the check`);
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
		CoC7Chat.updateChatCard( oldCard);  //TODO : Check if this needs to be async
	}
}

