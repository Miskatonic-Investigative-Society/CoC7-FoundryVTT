import { CoC7Check } from '../check.js';
import { chatHelper, CoC7Roll } from './helper.js';

export class CoC7ConCheck {
	constructor( actorId = null, difficulty = CoC7Check.difficultyLevel.regular){
		this.check = new CoC7Check( actorId);
		this.check.characteristic = 'con';
		this.check.difficulty = difficulty;
		this.check.denyPush = true;
		this.actorId = actorId;
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
		if( false === x) this._rollMode = game.settings.get('core', 'rollMode');
		this._rollMode = x;
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

	get isSuccess(){
		if( this.check) return this.check.isSuccess;
		else return false;
	}

	get isRolled(){
		if( this.check && this.check.dices && this.check.dices.total) return true;
		else return false;
	}
    
	static getFromCard( card){
		const conCheck = new CoC7ConCheck();
		chatHelper.getObjectFromElement( conCheck, card);
		const htmlCheck = card.querySelector( '.roll-result');
		CoC7Roll.getFromElement( htmlCheck, conCheck.check);
		conCheck.messageId = card.closest('.message').dataset.messageId;
		return conCheck;
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
		const template = 'systems/CoC7/templates/chat/con-check.html';

		if( fastForward){
			await this.rollCon();
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

	async rollCon(){
		this.check.hideDiceResult = true;
		await this.check._perform();
		if( !this.isSuccess && !this.isBlind) {
			if( this.stayAlive) await this.actor.fallDead();
			else await this.actor.fallUnconscious();
		} 
		this.applied = true;
	}

	async updateChatCard(){
		const template = 'systems/CoC7/templates/chat/con-check.html';

		let html = await renderTemplate(template, this);
		const htmlElement = $.parseHTML( html)[0];

		const check = htmlElement.querySelector('.roll-result');
		check.replaceWith( await this.getCheckElement());
        
		if( !this.isBlind && this.isRolled && !this.isSuccess) {
			if( this.stayAlive) await this.actor.fallDead();
			else await this.actor.fallUnconscious();
		} 

		if( !this.messageId) return;
		const chatMessage = game.messages.get( this.messageId);

		const msg = await chatMessage.update({ content: htmlElement.outerHTML });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}
}