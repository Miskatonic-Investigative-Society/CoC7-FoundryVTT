import { CoC7Check } from '../../check.js';

export class OpposedCheckCard{
	constructor( data){
		this.rolls = [];
		if( data) this.addRollData( data);
	}

	static async dispatch( data){
		if( game.user.isGM){
			ui.notifications.info(`Dipatched ! ${data.tokenKey||data.actorId}`);
			const messages = ui.chat.collection.filter( message => {
				if( 'opposedCard' == message.getFlag( 'CoC7', 'type') && 'resolved' != message.getFlag('CoC7', 'state')) return true;
				return false;
			});

			if( !messages.length) await OpposedCheckCard.create( data);
			else{
				const card = await OpposedCheckCard.fromMessage( messages[0]);
				card.process( data);
				await card.updateChatCard();
			}
			
		} else game.socket.emit( 'system.CoC7',data);
	}

	static async bindListerners( html){
		// html.find('.opposed-roll-card a').click(async (event) => OpposedCheckCard._onClick( event));
		html.on( 'click', '.opposed-roll-card a', OpposedCheckCard._onClick.bind(this) );
		html.on( 'click', '.opposed-roll-card button', OpposedCheckCard._onClick.bind(this));
	}

	static async _onClick( event){
		event.preventDefault();

		const a = event.currentTarget;
		const action = a.dataset.action;
		const li = a.closest('li.actor-roll');
		const message = a.closest('.chat-message');
		const cardElement = a.closest('div.opposed-roll-card');
		const card = await OpposedCheckCard.fromHTMLCardElement( cardElement);
		card.messageId = message.dataset.messageId;
		const rank = Number(li?.dataset?.rank);

		switch (action) {
		case 'remove-roll':{
			card.removeRoll( rank);
			await card.updateChatCard();
			break;
		}

		case 'roll-check':{
			await card.roll( rank);
			await card.updateChatCard();
			break;
		}
		
		default:
			break;
		}
	}

	static async create( data){
		const card = new OpposedCheckCard( data);
		await card.toMessage();
	}

	static async fromMessageId( messageId){
		const message = game.messages.get( messageId);
		if( ! message) return undefined;
		const card = await OpposedCheckCard.fromMessage( message);
		card.messageId = messageId;
		return card;
	}
	
	static async fromMessage( message){
		const cardElement = $(message.data.content)[0];
		if( ! cardElement) return undefined;
		const card = await OpposedCheckCard.fromHTMLCardElement( cardElement);
		card.message = message;
		return card;
	}

	static async fromHTMLCardElement( card){
		const cardData = JSON.parse(unescape( card.dataset.object));
		return await OpposedCheckCard.fromData( cardData);
	}

	static async fromData(data){
		const card = new OpposedCheckCard();
		Object.assign( card, data);
		for (let index = 0; index < card.rolls.length; index++) {
			if( 'Object' == card.rolls[index]?.constructor?.name){
				card.rolls[index] = Object.assign( new CoC7Check(), card.rolls[index]);
				if( card.rolls[index].rolled) card.rolls[index]._htmlRoll = await card.rolls[index].getHtmlRoll();
			}
		}
		return card;
	}

	static get template(){
		return 'systems/CoC7/templates/chat/cards/opposed-roll.html';
	}

	async toMessage(){
		const html = await renderTemplate( OpposedCheckCard.template, this);
		const htmlCardElement = $(html);
		htmlCardElement[0].dataset.object = escape(this.dataString);


		let chatData = {
			user: game.user._id,
			flavor: game.i18n.localize( 'CoC7.OpposedRollCard'),
			content: htmlCardElement[0].outerHTML,
			flags:{
				CoC7:{
					type: 'opposedCard',
					state: 'initiated'
				}
			}
		};

		if ( ['gmroll', 'blindroll'].includes(this.rollMode) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
		if ( this.rollMode === 'blindroll' ) chatData['blind'] = true;

		// const chatMessage = await ChatMessage.create(chatData);
		// chatMessage.setFlag( 'CoC7', 'type', 'opposedCard');
		// chatMessage.setFlag('CoC7', 'state', 'initiated');
		// await ui.chat.updateMessage( chatMessage, false);
		ChatMessage.create(chatData).then( msg => {return msg;});
	}

	async updateChatCard(){
		const html = await renderTemplate(OpposedCheckCard.template, this);
		const htmlCardElement = $.parseHTML( html)[0];

		//Attach the sanCheckCard object to the message.
		htmlCardElement.dataset.object = escape(this.dataString);

		//Update the message.
		const chatMessage = game.messages.get( this.messageId);

		const msg = await chatMessage.update({ content: htmlCardElement.outerHTML });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	async roll(rank){
		this.rolls[rank]._perform();
		this.rolls[rank]._htmlRoll = await this.rolls[rank].getHtmlRoll();
	}

	addRollData( data){
		const check = new CoC7Check();
		check.actor = data.tokenKey || data.actorId;
		check.diceModifier = Number(data.modifier);
		check.difficulty = Number(data.difficulty);
		if( CoC7Check.difficultyLevel.unknown == check.difficulty) check.difficulty = CoC7Check.difficultyLevel.regular;
		check.flatDiceModifier = Number( data.flatDiceModifier);
		check.flatThresholdModifier = Number( data.flatThresholdModifier);
		if( data.characteristic) check.characteristic = data.characteristic;
		if( data.attribute) check.attribute = data.attribute;
		if( data.skillId) check.skill = data.skillId;
		this.rolls.push(check);
	}

	process( data){
		this.addRollData( data);
	}

	removeRoll( rank){
		this.rolls.splice( rank, 1);
	}

	get message(){
		if( this._message) return this._message;
		if( this._messageId) return game.message.get( this._messageId);
		return undefined;
	}

	set message(x){
		this._message = x;
	}

	get messageId(){
		if(this._messageId) return this._messageId;
		if( this._message) return this._message.id;
		return undefined;
	}

	set messageId(x){
		this._messageId = x;
	}

	////////////////////////////

	get _options(){
		return {
			exclude : ['_actor', '_skill', '_item', '_message', '_htmlRoll'],
			excludeStartWith: '__'
		};
	}

	///////////////////////////

	get isGM(){
		return game.user.isGM;
	}

	get rollMode(){
		if( !this._rollMode) this._rollMode = game.settings.get('core', 'rollMode');
		return this._rollMode;
	}

	set rollMode(x){
		if( false === x) this._rollMode = game.settings.get('core', 'rollMode');
		this._rollMode = x;
	}

	get data(){
		return JSON.parse(this.JSONRollString);
	}

	get dataString(){
		return JSON.stringify(this, (key,value)=>{
			if( null === value) return undefined;
			if( this._options.exclude?.includes(key)) return undefined;
			if( key.startsWith(this._options.excludeStartWith)) return undefined;
			return value;
		});
	}
}