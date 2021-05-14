import { RollDialog } from '../../apps/roll-dialog.js';
import { CoC7Check } from '../../check.js';
import { CoC7Dice } from '../../dice.js';
import { RollCard } from './roll-card.js';

export class CombinedCheckCard extends RollCard{

	static async bindListerners( html){
		html.on( 'click', '.roll-card.combined .toggle-switch', this._onToggle.bind(this));
		// html.find('.roll-card a').click(async (event) => CombinedCheckCard._onClick( event));
		html.on( 'click', '.roll-card.combined a', CombinedCheckCard._onClick.bind(this) );
		html.on( 'click', '.roll-card.combined button', CombinedCheckCard._onClick.bind(this));
	}

	static get defaultConfig(){
		return mergeObject(super.defaultConfig, {
			template: 'systems/CoC7/templates/chat/cards/combined-roll.html',
			type: 'combinedCard',
			title: 'CoC7.CombinedRollCard'
		});
	}

	get config(){
		return CombinedCheckCard.defaultConfig;
	}

	get successCount(){
		if( this.rolled){
			let count = 0;
			this.rolls.forEach( r => {if( r.passed) count += 1;});
			return count;}
		return undefined;
	}

	get mainActorKey(){
		return this.rolls[0]?.actor?.actorKey || undefined;
	}

	get success(){
		if( undefined == this.successCount) return undefined;
		if( this.any){
			if( this.successCount > 0) return true;
			return false;
		}
		if( this.all){
			if( this.successCount == this.rolls.length) return true;
			return false;
		}
		return undefined;
	}

	get failure(){
		if( undefined == this.success) return undefined;
		return !this.success;
	}

	async getHtmlRoll(){
		if( !this.rolled) return undefined;
		const check = new CoC7Check();
		check._perform( {roll: this._roll, silent: true});
		return await check.getHtmlRoll( { hideSuccess: true});
	}

	process( data){
		switch (data.action) {
		case 'new':
			this.addRollData( data);
			break;
		
		case 'roll':
			this.addRollData( data);
			break;

		case 'updateRoll':{
			this.updateRoll( data);
			break;
		}

		case 'assignRoll':{
			this.assignRoll( data);
			break;
		}
		}

		if( game.user.isGM) this.updateChatCard();
		else game.socket.emit('system.CoC7', data);
	}

	async assignRoll( data){
		if( game.user.isGM){
			if( !this.rolled){
				this.rolled = true;
				this._roll = data.roll;
				this.options = data.options;
			}
		}
	}

	static async _onClick( event){
		event.preventDefault();

		const a = event.currentTarget;
		const action = a.dataset.action;
		const li = a.closest('li.actor-roll');
		const message = a.closest('.chat-message');
		const cardElement = a.closest('div.roll-card');
		const card = await CombinedCheckCard.fromHTMLCardElement( cardElement);
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

		case 'roll-card':{
			const roll = {};
			
			if( !event.shiftKey) {
				const usage = await RollDialog.create( {
					disableFlatThresholdModifier: (event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224),
					disableFlatDiceModifier: (event.metaKey || event.ctrlKey || event.keyCode == 91 || event.keyCode == 224)});
				if( usage) {
					roll.diceModifier = Number(usage.get('bonusDice'));
					roll.difficulty = Number(usage.get('difficulty'));
					roll.flatDiceModifier = Number( usage.get('flatDiceModifier'));
					roll.flatThresholdModifier = Number( usage.get('flatThresholdModifier'));
				}
			}

			const data = {
				type: this.defaultConfig.type,
				action: 'assignRoll',
				fromGM: game.user.isGM,
				options: roll
			};
			data.roll = CoC7Dice.roll( roll.modifier||0);
			AudioHelper.play({src: CONFIG.sounds.dice});
			card.process( data);
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

	async compute()
	{
		if( !this._roll) return;
		this.rolls.forEach( async r => {
			if( !r.rolled){
				r.modifier = this.options.modifier || 0;
				r.difficulty = this.options.difficulty || CoC7Check.difficultyLevel.regular;
				r.flatDiceModifier = this.options.flatDiceModifier || 0;
				r.flatThresholdModifier = this.options.flatThresholdModifier || 0;
				r._perform( {roll: this._roll, silent:true});
			}
		});

		for (let i = 0; i < this.rolls.length; i++) {
			if( this.rolls[i].rolled) this.rolls[i]._htmlRoll = await this.rolls[i].getHtmlRoll( {hideDiceResult: true});				
		}

		this.rolls = this.rolls.filter( roll => {
			return !!roll.actor;
		});

		this._htmlRoll = await this.getHtmlRoll();
	}

	closeCard(){
		this.closed = true;
	}
}