import { CoC7Check } from '../../check.js';
import { chatHelper, CoC7Roll } from '../helper.js';
import { CoC7Chat } from '../../chat.js';
import { CoC7MeleeTarget } from './melee-target.js';
import { CoC7MeleeResoltion } from './melee-resolution.js';
import { ChatCardActor } from '../card-actor.js';

//TODO : récupérer le jet en tant qu'objet !!!
export class CoC7MeleeInitiator extends ChatCardActor{
	constructor(actorKey = null, itemId = null, fastForward = false) {
		super( actorKey, fastForward);
		this.itemId = itemId;
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

	template = 'systems/CoC7/templates/chat/combat/melee-initiator.html';

	async revealCheck(){
		//TODO : on utilise l'update du message au lieu de reconstruire l'objet. Changer ce comportement.
		const chatMessage = game.messages.get( this.messageId);

		await chatMessage.setFlag( 'CoC7', 'checkRevealed', true);
		await ui.chat.updateMessage( chatMessage, false);
	}

	async createChatCard(){
		chatHelper.getActorImgFromKey(this.actorKey);
		const html = await renderTemplate(this.template, this);
		
		const speakerData = {};
		if( this.token) speakerData.token = this;
		else speakerData.actor = this;
		const speaker = ChatMessage.getSpeaker(speakerData);
		
		const user = this.actor.user ? this.actor.user : game.user;

		const chatData = {
			user: user._id,
			speaker,
			content: html
		};

		if ( ['gmroll', 'blindroll'].includes(this.rollMode) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
		// if ( this.isBlind ) chatData['blind'] = true;
		chatData.blind = false;

		const chatMessage = await ChatMessage.create(chatData);
		
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
		// Combat roll cannot be blind or unknown
		check.isBlind = false;
		check.isUnkonwn = false;
		check.referenceMessageId = this.messageId;
		check.rollType= 'opposed';
		check.side = 'initiator';
		check.action = 'attack';
		check.actor = this.actorKey;
		check.item = this.itemId;
		check.skill = skillId;
		check.difficulty = CoC7Check.difficultyLevel.regular;
		check.diceModifier = 0;

		if( game.user.isGM) this.checkRevealed = false;
		else this.checkRevealed = true;

		if( this.outnumbered) check.diceModifier += 1;
		if( this.surprised) check.diceModifier += 1;
		if( this.disadvantage) check.diceModifier -= 1;
		if( this.advantage) check.diceModifier += 1;

		check.roll();
		this.check = check;
		this.rolled = true;
		this.resolved = true;
		if( publish) check.toMessage();

		this.criticalDamage = check.successLevel == CoC7Check.successLevel.extreme || check.successLevel == CoC7Check.successLevel.critical;
		if( this.hasTarget && !this.autoSuccess){
			const meleeTarget = new CoC7MeleeTarget( this.targetKey, this.messageId, this.fastForward);
			meleeTarget.initiatorKey = this.actorKey;
			const message = await meleeTarget.createChatCard();
			this.targetCard = message.id;
		}

		if( this.autoSuccess && !this.check.isFumble){
			this.check.forcePass();
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

		if( !this.targetCard && !this.autoSuccess && this.hasTarget){
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
		const rollDamageButton = oldCard.querySelector('button[data-action="roll-melee-damage"]');
		if( rollDamageButton) rollDamageButton.classList.remove('invisible');

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
			if( rollDamageButton) rollDamageButton.dataset.critical = true;
			diceTotal.innerText = game.i18n.localize('CoC7.ExtremeSuccess');
			resulDetails.innerText = game.i18n.format('CoC7.RollResult.LuckSpendText', {luckAmount: luckAmount, successLevel: game.i18n.localize('CoC7.ExtremeDifficulty')});
			break;
		
		case CoC7Check.successLevel.critical:
			if( rollDamageButton) rollDamageButton.dataset.critical = true;
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
