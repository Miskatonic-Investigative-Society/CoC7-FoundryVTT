import { CoC7Check } from '../../check.js';
import { RollCard } from './roll-card.js';

export class OpposedCheckCard extends RollCard{

	static async bindListerners( html){
		// html.find('.opposed-roll-card a').click(async (event) => OpposedCheckCard._onClick( event));
		// super.bindListerners( html);
		html.on( 'click', '.roll-card.opposed a', OpposedCheckCard._onClick.bind(this) );
		html.on( 'click', '.roll-card.opposed button', OpposedCheckCard._onClick.bind(this));
	}

	static get defaultConfig(){
		return mergeObject(super.defaultConfig, {
			template: 'systems/CoC7/templates/chat/cards/opposed-roll.html',
			type: 'opposedCard',
			title: 'CoC7.OpposedRollCard'
		});
	}

	get config(){
		return OpposedCheckCard.defaultConfig;
	}

	process( data){
		switch (data.action) {
		case 'new':
			this.addRollData( data);
			break;
		
		case 'roll':
			this.addRollData( data);
			break;

		case 'updateRoll':
			this.updateRoll( data);
			break;
		}

		if( game.user.isGM) this.updateChatCard();
		else game.socket.emit('system.CoC7', data);
	}

	async roll(rank){
		this.rolls[rank]._perform();
		const data = {
			type: this.config.type,
			action: 'updateRoll',
			rank: rank,
			fromGM: game.user.isGM
		};
		if( !game.user.isGM) data.roll = this.rolls[rank].JSONRollData;
		return data;
	}



	static async _onClick( event){
		event.preventDefault();

		const a = event.currentTarget;
		const action = a.dataset.action;
		const li = a.closest('li.actor-roll');
		const message = a.closest('.chat-message');
		const cardElement = a.closest('div.roll-card');
		const card = await OpposedCheckCard.fromHTMLCardElement( cardElement);
		card.messageId = message.dataset.messageId;
		const rank = Number(li?.dataset?.rank);

		switch (action) {
		case 'remove-roll':{
			card.removeRoll( rank);
			await card.updateChatCard();
			break;
		}

		case 'close-card':{
			card.closeCard();			
			await card.updateChatCard();
			break;
		}

		case 'roll-check':{
			const data = await card.roll( rank);
			await card.process( data);
			break;
		}

		default:{
			const options={
				update: false,
				data: a.dataset,
				classes: a.classList,
				target: a
			};
			await CoC7Check.alter( card.rolls[ rank], action, options);
			const data = {
				type: this.defaultConfig.type,
				action: 'updateRoll',
				rank: rank,
				fromGM: game.user.isGM};
			if( !game.user.isGM) data.roll = card.rolls[rank].JSONRollData;
			card.process( data);
			break;
		}
		}
	}

	async compute( rank = undefined)
	{
		if( !rank){
			for (let i = 0; i < this.rolls.length; i++) {
				if( this.rolls[i].rolled) this.rolls[i]._htmlRoll = await this.rolls[i].getHtmlRoll();				
			}
		}else {
			if( this.rolls[rank].rolled) this.rolls[rank]._htmlRoll = await this.rolls[rank].getHtmlRoll();
		}
		
		this.rolls.sort( (a, b)=>{
			if( a.rolled && !b.rolled) return -1;
			if( !a.rolled && b.rolled) return 1;
			if( !a.rolled && !b.rolled) return 0;
			if( a.successLevel > b.successLevel) {this.resolved = true; return -1;}
			if( a.successLevel < b.successLevel) {this.resolved = true; return 1;}
			if( game.settings.get('CoC7', 'opposedRollTieBreaker')){
				if( a.modifiedResult > b.modifiedResult) {this.resolved = true; return -1;}
				if( a.modifiedResult < b.modifiedResult) {this.resolved = true; return 1;}
			} else {
				if( a.rawValue > b.rawValue) {this.resolved = true; return -1;}
				if( a.rawValue < b.rawValue) {this.resolved = true; return 1;}
			}
			return 0;
		});

		this.winCount = 0;
		if( this.rolls[0] && this.rolls[0].rolled && !this.rolls[0].failed){
			this.winCount = 1;
			for (let i = 1; i < this.rolls.length; i++) {
				if(
					this.rolls[i] && this.rolls[i].rolled &&
					this.rolls[0].successLevel == this.rolls[i].successLevel &&
					(game.settings.get('CoC7', 'opposedRollTieBreaker')?this.rolls[0].modifiedResult == this.rolls[i].modifiedResult:this.rolls[0].rawValue == this.rolls[i].rawValue)
				) this.winCount = this.winCount + 1;
			}
		}

		for (let i = 0; i < this.rolls.length; i++) {
			this.rolls[i].winner = (i < this.winCount);
			this.rolls[i].tie = this.rolls[i].winner && this.winCount > 1;
		}
	}

	closeCard(){
		this.closed = true;
	}
}