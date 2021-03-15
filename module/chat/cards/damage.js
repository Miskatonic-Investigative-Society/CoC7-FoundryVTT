import { CoC7Dice } from '../../dice.js';
import { InteractiveChatCard } from '../interactive-chat-card.js';
import { createInlineRoll} from '../helper.js';

export class DamageCard extends InteractiveChatCard{
	/**
   	 * Extend and override the default options used by the 5e Actor Sheet
   	 * @returns {Object}
	*/
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			exclude: ['_targetToken', '_targetActor', '_htmlRoll', '_htmlInlineRoll'].concat(super.defaultOptions.exclude),
			template: 'systems/CoC7/templates/chat/cards/damage.html'
		});
	}

	activateListeners( html){
		super.activateListeners( html);
	}

	async assignObject(){
		if( this.damageRoll && 'Object' == this.damageRoll.constructor.name){
			this.damageRoll = Roll.fromData(this.damageRoll);
		}
	}

	_onButton( event){
		super._onButton(event);
	}

	get critical(){
		return this.options.critical;
	}

	set critical(x){
		this._options.critical = x;
	}

	get impale(){
		if( undefined == this._impale) return this.weapon.impale;
		return this._impale;
	}

	set impale(x){
		this._impale = x;
	}

	get isDamageFormula(){
		if( typeof( this.damageFormula) != 'string') return false;
		if( !isNaN(Number(this.damageFormula))) return false;
		return Roll.validate( this.damageFormula);
	}

	get isDamageNumber(){
		return( !isNaN(Number(this.damageFormula)));
	}

	get isArmorForula(){
		if( typeof( this.armor) != 'string') return false;
		if( !isNaN(Number(this.armor))) return false;
		return Roll.validate( this.armor);
	}

	get totalDamageString(){
		let damage =  this.isDamageNumber?this.damageFormula:this.roll.total;
		let stringTotal = `${damage}`;
		if( !this.ignoreArmor){
			if( isNaN(Number(this.armor)) || 0 < Number(this.armor)) stringTotal += ` - ${this.armor}`;
			if( !isNaN(Number(this.armor))){
				if( 0 >= damage - Number(this.armor)){
					stringTotal = game.i18n.localize('CoC7.ArmorAbsorbsDamage');
				}
			}
		}
		try {
			const total = eval( stringTotal);
			return total;			
		} catch (error) {
			return stringTotal;
		}
	}

	get noDamage(){
		if( this.rolled){
			let damage =  this.isDamageNumber?this.damageFormula:this.roll.total;
			if( !this.ignoreArmor){
				if( !isNaN(Number(this.armor))){
					return(0 >= (damage - Number(this.armor)));
				} return false;
			} else {
				return (damage <= 0);
			}
		} else return false;
	}

	async updateChatCard(){
		if( this.options.fastForward && !this.roll && !this.isDamageNumber) await this.rollDamage({ update: false});
		if( this.isDamageNumber || ( this.roll && null != this.roll.total) || this.hardrolled) this.rolled = true;
		else this.rolled = false;
		if( this.options.fastForward && !this.damageInflicted && !this.noDamage) await this.dealDamage({ update: false});

		if( this.rolled && this.roll){
			if( 'Object' == this.roll.constructor.name) this.roll = Roll.fromData( this.roll);
			const a = createInlineRoll(this.roll);
			this._htmlInlineRoll = a.outerHTML;
			this._htmlRoll = await this.roll.render();
		}
		await super.updateChatCard();
	}

	async rollDamage( options={ update: true}){
		this.roll = new Roll( this.damageFormula).roll();
		await CoC7Dice.showRollDice3d(this.roll);
		this.hardrolled = true;
		options.update = undefined == options.update?true:options.update;
		if( options.update) this.updateChatCard();
	}

	async rollArmor( options={ update: true}){
		const roll = new Roll(this.armor).roll();
		this.armor = roll.total;
		options.update = undefined == options.update?true:options.update;
		if( options.update) this.updateChatCard();
	}

	async dealDamage( options={ update: true}){
		if( this.isArmorForula) await this.rollArmor();
		if( isNaN(Number(this.totalDamageString))){
			ui.notifications.error( 'Error evaluating damage');
			return;
		}
		if( this.targetActor) await this.targetActor.dealDamage( Number(this.totalDamageString), {ignoreArmor: true});
		this.damageInflicted = true;
		options.update = undefined == options.update?true:options.update;
		if( options.update) this.updateChatCard();
	}

	get range(){
		return this.options.range || 'normal';
	}

	set range(x){
		const ranges = [ 'normal', 'long', 'extreme'];
		if( !ranges.inclues(x.toLowerCase())) return;
		this._options.range = x;
	}

	get damageFormula(){
		const range = this.range;
		let formula = this.weapon?.data?.data?.range[range]?.damage;
		let db = `${this.actor.db}`;

		if( db && !db.startsWith( '-')) db = '+' + db;
		if( this.weapon.data.data.properties.addb) formula = formula + db;
		if( this.weapon.data.data.properties.ahdb) formula = formula + db + '/2';

		if( formula){
			const maxDamage = Roll.maximize( formula)._total;
			let rollString;
			if( this.critical){
				if( this.impale) {
					rollString = formula + '+' + maxDamage;
					return rollString;
				}
				else{ 
					return maxDamage;
				}
			} else {
				return formula;
			}
		} else return undefined;
	}

	get armor(){
		if( undefined != this._armor && this._armor != '') return this._armor;
		if( this.target){
			return this.targetActor.data.data.attribs.armor.value;
		} return 0;
	}

	set armor(x){
		this._armor = x;
	}
}