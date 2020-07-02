import { CoC7Check } from '../check.js'
import { chatHelper } from './helper.js'
import { RollDialog } from '../apps/roll-dialog.js';

export class CoC7DamageRoll{
    constructor(itemId, actorKey, target = null, critical = false, ignoreArmor = false, fastForward = false) {
        this.itemId = itemId;
        this.actorKey = actorKey;
        this.critical = critical;
        this.fastForward = fastForward;
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
    async rollDamage( range = "normal"){
        this.rollString = this.weapon.data.data.range[range].damage;

        if( this.weapon.data.data.properties.addb) this.rollString = this.rollString + "+" + this.actor.db;
        if( this.weapon.data.data.properties.ahdb) this.rollString = this.rollString + "+" + this.actor.db + "/2";
        // const max =
        this.maxDamage = Roll.maximize( this.rollString);
        this.roll = null;
        if( this.critical){
            if( this.weapon.impale) {
                this.rollString = this.rollString + "+" + this.maxDamage.total;
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

        if( game.dice3d && this.roll){
            game.dice3d.showForRoll(this.roll);
        }

        const html = await renderTemplate("systems/CoC7/templates/chat/combat/damage-result.html", this);

        const speaker = ChatMessage.getSpeaker({actor: this.actor});
        if( this.actor.isToken) speaker.alias = this.actor.token.name;
        
        const user = this.actor.user ? this.actor.user : game.user;

        const target = this.target;
		
		const chatMessage = await ChatMessage.create({
            user: user._id,
            speaker,
			content: html
        });
    }
}
