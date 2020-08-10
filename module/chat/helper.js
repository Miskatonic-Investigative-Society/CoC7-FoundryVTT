import {CoC7Check} from '../check.js';
export class chatHelper{
	static hyphenToCamelCase(string) {
		return string.replace(/-([a-z])/g, function(string) {
			return string[1].toUpperCase();
		});
	}
    

	static camelCaseToHyphen(string) {
		return string.replace(/([A-Z])/g, function(string) {
			return '-' + string.toLowerCase();
		});
	}

	static getActorFromKey(key) {

		// Case 1 - a synthetic actor from a Token
		if (key.includes('.')) {
			const [sceneId, tokenId] = key.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			return token.actor;
		}

		// Case 2 - use Actor ID directory
		return game.actors.get(key) || null;
	}

	static attachObjectToElement( object, element){
		Object.keys(object).forEach( prop => {
			if( !prop.startsWith('_'))
				element.dataset[prop]= object[prop];
		});    
	}

	static getObjectFromElement( object, element){
		Object.keys(element.dataset).forEach( prop => {
			if( 'true' == element.dataset[prop]) object[prop] = true;
			else if ( 'false' == element.dataset[prop]) object[prop] = false;
			else if( 'template' != prop) object[prop] = element.dataset[prop]; //ignore template
		});    
	}

	static getTokenFromKey( key){
		if (key.includes('.')) {
			const [sceneId, tokenId] = key.split('.');
			const scene = game.scenes.get(sceneId);
			if (!scene) return null;
			const tokenData = scene.getEmbeddedEntity('Token', tokenId);
			if (!tokenData) return null;
			const token = new Token(tokenData);
			return token;
		} else {
			const scene = game.scenes.active;
			if (!scene) return null;
			const tokens = scene.data.tokens.filter( t => key === t.actorId);
			if( !tokens.length) return null;
			const token = new Token(tokens[0]);
			return token;
		}
	}

	static getDistance( startToken, endToken){
		const ray = new Ray( startToken.center, endToken.center);
		const distance = {
			gridUnit: ray.distance/game.scenes.active.data.grid,
			value: (ray.distance/game.scenes.active.data.grid)*game.scenes.active.data.gridDistance,
			unit: game.scenes.active.data.gridUnits
		};
		return distance;
	}

	static toYards( distance){
		switch (distance.unit) {
		case 'ft':
			return distance.value/3;
		
		case 'yd':
			return distance.value;
		
		case 'm':
			return distance.value;
		
		default:
			return distance.value;
		}
	}
}

export class CoC7Roll{
	static getFromCard( card){

		const rollDiv = card.querySelector( 'div.dice-roll');
		if( !rollDiv) return null;

		const roll = new CoC7Roll();
		chatHelper.getObjectFromElement( roll, rollDiv);

		return roll;
	}

	get resultType(){
		this.successLevel = parseInt( this.successLevel);
		switch (this.successLevel) {
		case CoC7Check.successLevel.regular:
			return game.i18n.format('CoC7.RegularSuccess');
		case CoC7Check.successLevel.hard:
			return game.i18n.format('CoC7.HardSuccess');
		case CoC7Check.successLevel.extreme:
			return game.i18n.format('CoC7.ExtremeSuccess');
		case CoC7Check.successLevel.critical:
			return game.i18n.format('CoC7.CriticalSuccess');
		case CoC7Check.successLevel.fumble:
			return game.i18n.format('CoC7.Fumble');
		case CoC7Check.successLevel.failure:
			return game.i18n.format('CoC7.Failure');
		
		default:
			return null;
		}
	}

	get actor(){
		if( this.actorKey) return chatHelper.getActorFromKey( this.actorKey);
		return null;
	}

	get item(){
		if( this.itemId && this.actor) return this.actor.getOwnedItem( this.itemId);
		return null;
	}

	get skill(){
		if( this.skillId && this.actor) return this.actor.getOwnedItem( this.skillId);
		return null;
	}

	static getFromElement( element){
		const roll = new CoC7Roll();
		chatHelper.getObjectFromElement( roll, element);
		roll.dices = {
			tens: [],
			unit : {}
		};
		chatHelper.getObjectFromElement( roll.dices, element.querySelector('.dice-result'));
		roll.dices.hasBonus = roll.diceModifier == 0 ? false : true;
		roll.dices.bonus =  Math.abs(roll.diceModifier);
		roll.dices.bonusType = roll.diceModifier < 0 ? game.i18n.format('CoC7.DiceModifierPenalty') : game.i18n.format('CoC7.DiceModifierBonus');
		const tenDice = element.querySelector('.ten-dice');
		tenDice.querySelectorAll('li').forEach( d => {
			const die = {
				selected: false,
				isMax: false,
				isMin: false,
				value: -1
			};
			chatHelper.getObjectFromElement( die, d);
			roll.dices.tens.push( die);
		});
		const unitDie = element.querySelector('.unit-die')? element.querySelector('.unit-die').querySelector('li'): null;
		roll.dices.unit.value = unitDie ? parseInt(unitDie.dataset.value): null;

		roll.increaseSuccess = [];
		const increaseSuccess = element.querySelector('.increase-success');
		if( increaseSuccess && increaseSuccess.querySelectorAll('button')) {
			increaseSuccess.querySelectorAll('button').forEach( isl =>{
				const newSuccesLevel = {};
				chatHelper.getObjectFromElement( newSuccesLevel, isl);
				roll.increaseSuccess.push( newSuccesLevel);
			});
		}

		roll.luckNeededTxt = game.i18n.format('CoC7.SpendLuck', {luckNeededValue : roll.luckNeeded});
		return roll;
	}

	static getFromCheck( check){
		const roll = new CoC7Roll();

		roll.rollType = check.rollType;
		roll.side = check.side;
		roll.action = check.action;
		roll.refMessageId = check.refMessageId;
		roll.referenceMessageId = check.referenceMessageId;

		roll.successLevel = check.successLevel;
		roll.difficulty = check.difficulty;
		roll.skillId = check.skill ? check.skill.id : null;
		roll.itemId = check.item ? check.item.id: null;
		roll.diceMod = check.diceModifier;
		roll.value = parseInt( check.rawValue);
		roll.fumble = check.isFumble;
		roll.critical = check.isCritical;
		roll.characteristic = check.characteristic ? check.characteristic: null;
		roll.result = check.dice.total;


		roll.actorKey = check.actor.tokenKey;

		if( check.actor.isToken){
			roll.tokenId = check.actor.tokenKey;
			roll.actorId = null;
		} else {
			roll.tokenKey = null;
			roll.actorId = check.actor.tokenKey;
		}

		return roll;
	}

	static attachCheckToElement( card, check){
		roll = CoC7Roll.getFromCheck( check);
		roll.attachToElement( card);

		return roll;
	}

	attachToElement( card){
		chatHelper.attachObjectToElement(this, card);
	}

}

export class CoC7Damage{
	static getMainDie( damageString){
		if( damageString.toLowerCase().includes('d20')) return 'd20';
		if( damageString.toLowerCase().includes('d12')) return 'd12';
		if( damageString.toLowerCase().includes('d10')) return 'd10';
		if( damageString.toLowerCase().includes('d8')) return 'd8';
		if( damageString.toLowerCase().includes('d4')) return 'd4';
		return 'd6';
	}

}
