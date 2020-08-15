import { chatHelper } from './helper.js';

export class CoC7DamageRoll{
	constructor(itemId, actorKey, target = null, critical = false, ignoreArmor = false, fastForward = false) {
		this.itemId = itemId;
		this.actorKey = actorKey;
		this.critical = critical;
		this.fastForward = fastForward;
		this.ignoreArmor = ignoreArmor;
		if( target) this._target = target;
	}

	get weapon(){
		return this.actor.getOwnedItem( this.itemId);
	}

	get actor(){
		return chatHelper.getActorFromKey( this.actorKey);
	}

	get targets(){
		return [...game.user.targets];
	}

	get target(){
		if( !this._target) return this.targets.pop();
		return this._target;
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

		this.maxDamage = is7? Roll.maximize( this.rollString)._total: Roll.maximize( this.rollString);
		this.roll = null;
		if( this.critical){
			if( this.weapon.impale) {
				this.rollString = this.rollString + '+' + this.maxDamage.total;
				this.roll = new Roll( this.rollString);
				this.roll.roll();
				this.result = Math.floor( this.roll.total);
			}
			else{ 
				this.result = this.maxDamage.total;
				this.roll = this.maxDamage;
				this.resultString = `Max(${this.rollString})`;
			}

		} else {
			this.roll = new Roll( this.rollString);
			this.roll.roll();
			this.result = Math.floor( this.roll.total);
		}

		if( is7) this.roll._dice = this.roll.dice;
		else{
			this.roll._dice.forEach( d => d.rolls.forEach( r => {r.result = r.roll;}));
		}

		if( game.dice3d && this.roll){
			game.dice3d.showForRoll(this.roll);
		}

		const html = await renderTemplate('systems/CoC7/templates/chat/combat/damage-result.html', this);

		const speaker = ChatMessage.getSpeaker({actor: this.actor});
		if( this.actor.isToken) speaker.alias = this.actor.token.name;
        
		const user = this.actor.user ? this.actor.user : game.user;

		await ChatMessage.create({
			user: user._id,
			speaker,
			content: html
		});
	}
}
