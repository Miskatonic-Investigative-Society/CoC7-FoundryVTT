import { CoC7Check } from '../../check.js';
import { chatHelper } from '../helper.js';
import { CoC7MeleeInitiator } from './melee-initiator.js';
import { CoC7MeleeTarget } from './melee-target.js';

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

		const chatData = {
			user: game.user._id,
			content: html
		};

		// Add image to card.
		// data.flags = {
		// 	img: this.actor.isToken ? this.actor.token.data.img: this.actor.img
		// };
		
		let rollMode = game.settings.get('core', 'rollMode');
		if ( ['gmroll', 'blindroll'].includes(rollMode) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
		// if ( rollMode === 'blindroll' ) chatData['blind'] = true;
		chatData.blind = false;

		const chatMessage = await ChatMessage.create(chatData);
		this.messageId = chatMessage.id;
		return chatMessage;
	}
	
	get displayActorOnCard(){
		return game.settings.get('CoC7', 'displayActorOnCard');
	}
    
	get target(){
		if(this.targetMessage) return CoC7MeleeTarget.getFromMessageId(this.targetMessage);
		return null;
	}

	get targetToken(){
		if( this.target) return chatHelper.getTokenFromKey( this.target.actorKey);
		return null;
	}

	get initiator(){
		if(this.initiatorMessage) return CoC7MeleeInitiator.getFromMessageId(this.initiatorMessage);
		return null;
	}

	get initiatorToken(){
		if( this.initiator) return chatHelper.getTokenFromKey( this.initiator.actorKey);
		return null;
	}

	async resolve(){
		if( this.target){
			switch (this.target.action) {
			case 'dodge':
				if( this.initiator.roll.successLevel <= 0 && this.target.roll.successLevel <= 0){
					this.resultString = game.i18n.localize('CoC7.NoWinner');
					this.winner = null;
					this.rollDamage = false;
				}
				else if( this.initiator.roll.successLevel > this.target.roll.successLevel){
					this.resultString = game.i18n.format('CoC7.WinnerRollDamage', {name : this.initiator.name});
					this.winner = this.initiator;
					this.winnerImg = this.initiator.weapon.img;
					this.winnerTitle = this.initiator.weapon.name;
					this.looser = this.target;
					this.action = 'roll-melee-damage';
					this.rollDamage = true;
				}
				else if( this.initiator.roll.successLevel <= this.target.roll.successLevel){
					this.resultString = game.i18n.format('CoC7.DodgeSuccess', {name : this.target.name});
					this.winner = this.target;
					this.looser = this.initiator;
					this.winnerImg = this.target.skill.data.img;
					this.winnerTitle = this.target.skill.name;
					this.action = 'dodge';
					this.rollDamage = false;
				}
					
				break;
			
			case 'fightBack':
				if( this.initiator.roll.successLevel <= 0 && this.target.roll.successLevel <= 0){
					this.resultString = game.i18n.localize('CoC7.NoWinner');
					this.winner = null;
					this.rollDamage = false;
				}
				else if( this.initiator.roll.successLevel >= this.target.roll.successLevel){
					this.resultString = game.i18n.format('CoC7.WinnerRollDamage', {name : this.initiator.name});
					this.winner = this.initiator;
					this.winnerImg = this.initiator.weapon.img;
					this.winnerTitle = this.initiator.weapon.name;
					this.looser = this.target;
					this.rollDamage = true;
				}
				else if( this.initiator.roll.successLevel <= this.target.roll.successLevel){ //TODO verifier la condition <= vs <
					this.resultString = game.i18n.format('CoC7.WinnerRollDamage', {name : this.target.name});
					this.winner = this.target;
					this.winnerImg = this.target.weapon.img;
					this.winnerTitle = this.target.weapon.name;
					this.looser = this.initiator;
					this.rollDamage = true;
				}
					
				break;
			
			case 'maneuver':
				if( this.initiator.roll.successLevel <= 0 && this.target.roll.successLevel <= 0){
					this.resultString = game.i18n.localize('CoC7.NoWinner');
					this.winner = null;
					this.rollDamage = false;
				}
				else if( this.initiator.roll.successLevel >= this.target.roll.successLevel){
					this.resultString = game.i18n.format('CoC7.WinnerRollDamage', {name : this.initiator.name});
					this.winner = this.initiator;
					this.winnerImg = this.initiator.weapon.img;
					this.winnerTitle = this.initiator.weapon.name;
					this.looser = this.target;
					this.rollDamage = true;
				}
				else if( this.initiator.roll.successLevel <= this.target.roll.successLevel){
					this.resultString = game.i18n.format('CoC7.ManeuverSuccess', {name : this.target.name});
					this.winner = this.target;
					this.winnerImg = this.target.skill.data.img;
					this.winnerTitle = this.target.skill.name;
					this.looser = this.initiator;
					this.rollDamage = false;
				}
					
				break;
			
			default:
				break;
			}
		} else {
			if( this.initiator.roll.successLevel > 0){
				this.resultString = `${this.initiator.name} won. Roll damage`;
				this.winner = this.initiator;
				this.rollDamage = true;
			} else {
				this.resultString = `${this.initiator.name} missed.`;
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
			const speakerData = {};
			if( this.winner){
				if( this.winner.token) speakerData.token = this.winner.token;
				if( this.winner.actor) speakerData.actor = this.winner.actor;
			}
			const speaker = this.winner ? ChatMessage.getSpeaker(speakerData) : null;
			const user = this.winner && this.winner.actor.user ? this.winner.actor.user : game.user;

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
