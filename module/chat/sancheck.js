import { CoC7Check } from '../check.js';
// import { CoC7Dice } from '../dice.js';
// import { CoC7Item } from '../items/item.js';
import { chatHelper, CoC7Roll } from './helper.js';

export class CoC7SanCheck {
	constructor( actorId = null, sanLoss = null, sanLossFail = null, difficulty = CoC7Check.difficultyLevel.regular){
		this.check = new CoC7Check( actorId);
		this.check.attribute = 'san';
		this.check.difficulty = difficulty;
		this.sanLoss = sanLoss;
		this.sanLossFail = sanLossFail;
		this.actorId = actorId;
	}

	get actor(){
		if( this.actorId) return chatHelper.getActorFromKey( this.actorId);
		return null;
	}

	set actorId(x){
		this._actorId = x;
		this.check.actor = x;
	}

	get actorId(){
		if( this._actorId) return this._actorId;
		return null;
	}

	get tokenKey(){
		if( this.actor.isToken) return this.actor.tokenKey;
		return null;
	}

	get sanLossFormula(){
		if( this.isRolled){
			if( this.isSuccess) return this.sanLoss?this.sanLoss:'0';
			else return this.sanLossFail?this.sanLossFail:'0';
		}
		else return null;
	}

	get isSuccess(){
		if( this.check) return this.check.isSuccess;
		else return false;
	}

	get isRolled(){
		if( this.check && this.check.dices && this.check.dices.total) return true;
		else return false;
	}

	get isSanLossRolled(){
		if( this.totalSanLoss) return true;
		else return false;
	}

	get isSanLossFormula(){
		if( this.sanLossFormula){
			if( this.sanLossFormula.match(Roll.diceRgx)) return true;
			// const rgx = RegExp( Die.rgx.dice);
			// return rgx.test(this.sanLossFormula);
		}
		return false;
	}

	get sanLost(){
		if( this.totalSanLoss > 0) return true;
		return false;
	}

	static checkTargets( sanLoss, sanLossFail, fastForward=false){
		const targets = [...game.user.targets];
		if( targets.length){
			targets.forEach( t => {
				let check;
				if( t.actor.isToken) check = new CoC7SanCheck( t.actor.tokenKey, sanLoss, sanLossFail);
				else check  = new CoC7SanCheck( t.actor.id, sanLoss, sanLossFail);
				check.toMessage( fastForward);
			});
		} else ui.notifications.error('No target selected');
	}

	static getFromCard( card){
		const sanCheck = new CoC7SanCheck();
		chatHelper.getObjectFromElement( sanCheck, card);
		const htmlCheck = card.querySelector( '.roll-result');
		CoC7Roll.getFromElement( htmlCheck, sanCheck.check);
		sanCheck.messageId = card.closest('.message').dataset.messageId;
		return sanCheck;
	}

	async getCheckElement(){
		const template = 'systems/CoC7/templates/chat/roll-result.html';
		const html = await renderTemplate(template, this.check);
		const htmlElement = $.parseHTML( html)[0];
		if( htmlElement){
			htmlElement.classList.remove('chat-card', 'item-card', 'roll-card');
			return htmlElement;
		}
		return null;
	}

	async toMessage( fastForward=false){
		const template = 'systems/CoC7/templates/chat/san-check.html';

		if( fastForward){
			await this.rollSan();
		}

		const html = await renderTemplate(template, this);
		const htmlElement = $.parseHTML( html)[0];

		if( fastForward){
			const check = htmlElement.querySelector('.roll-result');
			check.replaceWith( await this.getCheckElement());
		}

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
			content: htmlElement.outerHTML
		};

		if ( ['gmroll', 'blindroll'].includes(game.settings.get('core', 'rollMode')) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');//Change for user
		if ( this.rollMode === 'blindroll' ) chatData['blind'] = true;

		ChatMessage.create(chatData).then( msg => {return msg;});
	}

	async rollSan(){
		this.check.hideDiceResult = true;
		await this.check._perform();
		if( !this.isSanLossFormula){
			this.totalSanLoss = this.sanLossFormula;
		}
	}

	async rollSanLoss(){
		if( this.isSanLossFormula){
			const r = new Roll(this.sanLossFormula);
			r.roll();
			this.totalSanLoss = r.total;
		}
	}

	async updateChatCard(){
		const template = 'systems/CoC7/templates/chat/san-check.html';

		let html = await renderTemplate(template, this);
		const htmlElement = $.parseHTML( html)[0];

		const check = htmlElement.querySelector('.roll-result');
		check.replaceWith( await this.getCheckElement());

		if( !this.messageId) return;
		const chatMessage = game.messages.get( this.messageId);

		const msg = await chatMessage.update({ content: htmlElement.outerHTML });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	async applySanLoss(){
		const san = this.actor.san - this.totalSanLoss;
		await this.actor.setSan( san);
		// TODO : find a way to refresh token data
		this.applied = true;
	}
}

