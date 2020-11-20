// import { chatHelper } from './helper.js';
import { CoC7Dice } from '../dice.js';
import { ChatCardActor } from './card-actor.js';


export class CoC7DamageRoll extends ChatCardActor{
	constructor(itemId, actorKey, targetKey = null, critical = false, ignoreArmor = false, fastForward = false) {
		super( actorKey, fastForward);
		this.itemId = itemId;
		this.actorKey = actorKey;
		this.targetKey = targetKey;
		this.critical = critical;
		this.fastForward = fastForward;
		this.ignoreArmor = ignoreArmor;
	}

	/**
     * 
     * Roll the damage applying the formula provided.
     * If there's a target Card will propose to apply the damage to it
     * 
     * @param {String} range 
     */
	async rollDamage( range = 'normal'){
		this.rollString = this.weapon.data.data.range[range].damage;

		if( this.weapon.data.data.properties.addb) this.rollString = this.rollString + '+' + this.actor.db;
		if( this.weapon.data.data.properties.ahdb) this.rollString = this.rollString + '+' + this.actor.db + '/2';
		
		const is7 = Object.prototype.hasOwnProperty.call(Roll, 'cleanTerms');

		// 0.7.5 this.maxDamage.result -> this.maxDamage
		this.maxDamage = is7? Roll.maximize( this.rollString)._total: Roll.maximize( this.rollString);
		this.roll = null;
		if( this.critical){
			if( this.weapon.impale) {
				if( is7) this.rollString = this.rollString + '+' + this.maxDamage;
				else this.rollString = this.rollString + '+' + this.maxDamage.result;
				this.roll = new Roll( this.rollString);
				this.roll.roll();
				this.result = Math.floor( this.roll.total);
			}
			else{ 
				if( is7){
					this.roll = new Roll( `${this.maxDamage}`);
					this.roll.roll();
					this.result = this.maxDamage;
				} else {
					this.roll = new Roll( this.maxDamage.result);
					this.roll.roll();
					this.result = this.maxDamage.result;
				}
				this.resultString = `Max(${this.rollString})`;
			}

		} else {
			this.roll = new Roll( this.rollString);
			this.roll.roll();
			CoC7Dice.showRollDice3d(this.roll);
			this.result = Math.floor( this.roll.total);
		}

		if( is7) this.roll._dice = this.roll.dice;
		else{
			this.roll._dice.forEach( d => d.rolls.forEach( r => {r.result = r.roll;}));
		}

		const html = await renderTemplate('systems/CoC7/templates/chat/combat/damage-result.html', this);

		//TODO : replace the card if possible (can the player mod the message ???)
		if( this.messageId){
			const message = game.messages.get( this.messageId);
			message.update({ content: html }).then(msg => {
				ui.chat.updateMessage( msg, false);
			});
		} else {

			let speakerData = {};
			if( this.token) speakerData.token = this.token;
			else speakerData.actor = this.actor;
			const speaker = ChatMessage.getSpeaker(speakerData);
			if( this.actor.isToken) speaker.alias = this.actor.token.name;
        
			const user = this.actor.user ? this.actor.user : game.user;

			const chatData = {
				user: user._id,
				speaker,
				content: html
			};

			let rollMode = game.settings.get('core', 'rollMode');
			if ( ['gmroll', 'blindroll'].includes(rollMode) ) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
			// if ( rollMode === 'blindroll' ) chatData['blind'] = true;
			chatData.blind = false;

			await ChatMessage.create(chatData);
		}
	}
}
