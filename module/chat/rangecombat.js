import { CoC7Check } from '../check.js';
import { chatHelper, CoC7Roll, CoC7Damage } from './helper.js';
// import { CoC7Chat } from '../chat.js';

export class CoC7RangeInitiator{
	constructor(actorKey = null, itemId = null, fastForward = false) {
		this.actorKey = actorKey;
		this.itemId = itemId;
		this.fastForward = fastForward;
		this.resolved = false;
		this.cover = false;
		this.surprised = false;
		this.autoSuccess = false;
		this.advantage = false;
		this.disadvantage = false;
		this.messageId = null;
		this.targetCard = null;
		this.rolled = false;
		this.singleShot = false;
		this.multipleShots = false;
		this.burst = false;
		this.fullAuto = false;
		this.tokenKey = null;
		this.aimed = false;
		this.totalBulletsFired= 0;
		this._targets = [];
		[...game.user.targets].forEach( t =>
		{
			const target = new CoC7RangeTarget(`${t.scene.id}.${t.id}`);
			target.token = t;
			this._targets.push(target);
		});
		if( this._targets.length ) this._targets[0].active = true;
		else{
			const target = new CoC7RangeTarget();
			target.active=true;
			this._targets.push(target);
		}
		if( actorKey) {
			const actor = chatHelper.getActorFromKey( actorKey);
			this.token = chatHelper.getTokenFromKey( actorKey);
			if( this.token) this.tokenKey = `${game.scenes.active.id}.${this.token._id?this.token._id:this.token.data._id}`;
			if( itemId) {
				const weapon = actor.getOwnedItem( itemId);
				if( weapon){
					if( this.weapon.singleShot) this.singleShot = true;
					else if( this.weapon.data.data.properties.auto) this.fullAuto = true;
				}
			}
		}
		if( this.tokenKey){
			this._targets.forEach( t =>{
				if( t.token && this.token){
					t.distance = chatHelper.getDistance( t.token, this.token);
					t.roundedDistance = Math.round(t.distance.value * 100)/100;
					t.distanceUnit = t.distance.unit;
					const distInYd = Math.round(chatHelper.toYards( t.distance)* 100)/100;
					// if( distInYd){
					if( this.actor){
						t.pointBlankRange = false;
						const pbRangeInYd = this.actor.data.data.characteristics.dex.value/15;
						if( distInYd <= pbRangeInYd) t.pointBlankRange = true;
					}
					if( this.weapon){
						if( this.weapon.baseRange){
							t.baseRange = false;
							t.longRange = false;
							t.extremeRange = false;
							t.outOfRange = false;
							if( this.weapon.data.data.properties.shotgun){
								if( distInYd <= this.weapon.baseRange ) t.baseRange = true;
								if( distInYd > this.weapon.baseRange && distInYd <= this.weapon.longRange) t.longRange = true;
								if( distInYd > this.weapon.longRange && distInYd <= this.weapon.extremeRange) t.extremeRange = true;
								if( distInYd > this.weapon.extremeRange ) t.outOfRange = true;
							} else {
								if( distInYd <= this.weapon.baseRange) t.baseRange = true;
								if( distInYd > this.weapon.baseRange && distInYd <= (this.weapon.baseRange*2)) t.longRange = true;
								if( distInYd > (this.weapon.baseRange*2) && distInYd <= (this.weapon.baseRange*4)) t.extremeRange = true;
								if( distInYd > (this.weapon.baseRange*4)) t.outOfRange = true;
							}
							if( !(t.baseRange || t.longRange || t.extremeRange || t.outOfRange)) t.baseRange = true;
						}
					}
					// }
				} else t.baseRange = true;
			});
		}

	}

	get displayActorOnCard(){
		return game.settings.get('CoC7', 'displayActorOnCard');
	}

	get actorImg(){
		const img =  chatHelper.getActorImgFromKey( this.actorKey);
		if( img ) return img;
		return '../icons/svg/mystery-man-black.svg';
	}

	get actor(){
		return chatHelper.getActorFromKey( this.actorKey);
	}

	get item(){
		return this.actor.getOwnedItem( this.itemId);
	}

	get weapon(){
		return this.item;
	}

	get targets(){
		if( !this._targets) this._targets = [];
		return this._targets;
	}

	get target(){
		if( this.targets && this.targets.length) return this.targets.pop();
		return null;
	}

	get skills(){
		return this.actor.getWeaponSkills( this.itemId);
	}

	get mainWeaponSkill(){
		return this.actor.getOwnedItem( this.weapon.data.data.skill.main.id);
	}

	get autoWeaponSkill(){
		if( this.weapon.data.data.skill.alternativ.id) return this.actor.getOwnedItem( this.weapon.data.data.skill.alternativ.id);
		return this.mainWeaponSkill;
	}

	get autoFire(){
		return this.burst || this.fullAuto;
	}

	get multiTarget(){
		return this.fullAuto || this.multipleShots;
	}

	get aiming(){
		if( undefined === this._aiming) this._aiming = this.actor.getActorFlag('aiming');
		return this._aiming;
	}

	get activeTarget(){
		if( !this._targets.length) return null;
		return this._targets.find( t => t.active);
	}

	get shots(){
		if( undefined === this._shots) this._shots = [];
		return this._shots;
	}

	get currentShotRank(){
		return this.shots.length + 1;
	}

	get activeTargetShotDifficulty(){
		return this.shotDifficulty();
	}

	set aiming(b){
		this._aiming = b; 
	}

	get didAnyShotHit(){
		let anyHit = false;
		this.rolls.forEach( r => {anyHit = anyHit || r.isSuccess;});
		return anyHit;
	}

	get successfulHits(){
		const hits = [];
		for (let index = 0; index < this.rolls.length; index++) {
			if( this.rolls[index].isSuccess){
				const hit = {
					roll: this.rolls[index],
					shot: this.shots[index]
				};
				hits.push(hit);
			}
		}
		if( hits.length != 0) return hits; else return null;
	}

	get shotFired(){
		return this.shots? this.shots.length : 0;
	}

	get totalAmmo(){
		return this.weapon.getBulletLeft();
	}

	get maxShots(){
		if(this.fullAuto) return '∞';
		// return this.weapon.data.data.usesPerRound.max;

		return this.weapon.data.data.usesPerRound.max? parseInt( this.weapon.data.data.usesPerRound.max) : 1;
	}

	get ignoreAmmo(){
		return game.settings.get('CoC7', 'disregardAmmo');
	}

	get ignoreUsesPerRound(){
		return game.settings.get('CoC7', 'disregardUsePerRound');
	}

	get outOfAmmo(){
		if( this.ignoreAmmo) return false;
		if( this.totalBulletsFired >= this.weapon.getBulletLeft()) return true;
		return false;
	}

	get outOfShots(){
		if( this.ignoreUsesPerRound) return false;
		if( this.shots) return this.shots.length >= this.maxShots;
		return false;
	}

	get volleySize(){
		if( ! this.weapon.data.data.properties.auto) return 1;
		if( this._volleySize) return this._volleySize;
		const size = Math.floor(this.autoWeaponSkill.value/10);
		return (size < 3) ? 3:size;
	}

	set volleySize(x){
		if( x >= Math.floor(this.autoWeaponSkill.value/10)) this._volleySize = Math.floor(this.autoWeaponSkill.value/10);
		else if ( x <= 3) this._volleySize = 3;
		this._volleySize = parseInt(x);
	}

	get isVolleyMinSize(){
		if( 3 == this.volleySize ) return true;
		return false;
	}

	get isVolleyMaxSize(){
		const maxSize = Math.floor(this.autoWeaponSkill.value/10) < 3 ? 3 : Math.floor(this.autoWeaponSkill.value/10);
		if( maxSize == this.volleySize ) return true;
		return false;
	}

	getTargetFromKey( key){
		return this._targets.find( t => key === t.actorKey);
	}

	calcTargetsDifficulty(){
		this.targets.forEach( t => {
			t.shotDifficulty = this.shotDifficulty( t);
		});
	}

	shotDifficulty( t = null){
		const target = t? t: this.activeTarget;
		let damage = this.weapon.data.data.range.normal.damage;
		if( this.weapon.data.data.properties.shotgun){
			if( t.longRange) damage = this.weapon.data.data.range.long.damage;
			if( t.extremeRange) damage = this.weapon.data.data.range.extreme.damage;
		}
		let modifier = target.modifier;
		let difficulty = target.difficulty;
		let difficultyName = '';
		if( this.aiming && 1 == this.currentShotRank) modifier++;
		if( this.advantage) modifier++;
		if( this.disadvantage) modifier--;
		if( this.reload) modifier--;
		if( this.multipleShots && !this.fullAuto) modifier--;
		if( this.fullAuto) modifier -= (this.currentShotRank - 1);
		if( modifier < -2){
			const excess = Math.abs(modifier + 2);
			difficulty += excess;
			if( difficulty > CoC7Check.difficultyLevel.critical) difficulty = CoC7Check.difficultyLevel.impossible;
			modifier = -2;
		}

		if( CoC7Check.difficultyLevel.regular == difficulty ) difficultyName= 'Regular';
		if( CoC7Check.difficultyLevel.hard == difficulty ) difficultyName= 'Hard';
		if( CoC7Check.difficultyLevel.extreme == difficulty ) difficultyName= 'Extreme';
		if( CoC7Check.difficultyLevel.critical == difficulty ) difficultyName= 'Critical';
		if( CoC7Check.difficultyLevel.impossible == difficulty ) difficultyName= 'Impossible';
		
		return {
			level: difficulty,
			name: difficultyName,
			modifier: modifier,
			damage: damage,
			impossible: difficulty === CoC7Check.difficultyLevel.impossible
		};

	}


	/**
	 * Shoot at the active target. Add it to the list of shots.
	 * TODO : recalculer la difficulté de tous les shots !.
	 */
	addShotAtCurrentTarget(){
		this.calcTargetsDifficulty();
		const shot = {
			target: this.activeTarget,
			extremeRange: this.activeTarget.extremeRange,
			actorKey: this.activeTarget.actorKey,
			actorName: this.activeTarget.name,
			difficulty: this.activeTarget.shotDifficulty.level,
			modifier: this.activeTarget.shotDifficulty.modifier,
			damage: this.activeTarget.shotDifficulty.damage,
			bulletsShot: 1,
			transitBullets: 0,
			transit: false		
		};

		let bulletLeft = this.totalAmmo - this.totalBulletsFired;

		if( this.fullAuto){
			if( this.currentShotRank > 1){
				const previousShot = this.shots[this.currentShotRank - 2];
				if( previousShot.actorKey != this.activeTarget.actorKey){
					const distance = chatHelper.getDistance( chatHelper.getTokenFromKey(previousShot.actorKey), chatHelper.getTokenFromKey(this.activeTarget.actorKey));
					shot.transitBullets = Math.floor( chatHelper.toYards(distance));
					if( shot.transitBullets >= bulletLeft && !this.ignoreAmmo) {
						shot.transitBullets = bulletLeft;
						bulletLeft = 0;
					}
					this.totalBulletsFired = parseInt(this.totalBulletsFired) + shot.transitBullets;
					shot.transit = true;
				}
			}
			shot.bulletsShot = this.volleySize;
			if( shot.bulletsShot <= 3) shot.bulletsShot = 3;
			if( shot.bulletsShot >= bulletLeft && !this.ignoreAmmo){
				shot.bulletsShot = bulletLeft;
				bulletLeft = 0;
			}
		}
		if( this.burst){
			shot.bulletsShot = parseInt( this.weapon.data.data.usesPerRound.burst)? parseInt( this.weapon.data.data.usesPerRound.burst):1;
			if( shot.bulletsShot >= bulletLeft  && !this.ignoreAmmo){
				shot.bulletsShot = bulletLeft;
				bulletLeft = 0;
			}
		}

		this.totalBulletsFired = parseInt(this.totalBulletsFired) + shot.bulletsShot;

		if( this.aiming) {
			this.aiming = false;
			this.aimed = true;
		}
		
		this.shots.push( shot);
	}

	template = 'systems/CoC7/templates/chat/combat/range-initiator.html';

	async createChatCard(){
		this.calcTargetsDifficulty();
		const html = await renderTemplate(this.template, this);

		// const element = $(html)[0];
		// const targetElement = element.querySelector('.targetTest');
		// this.target.attachToElement(targetElement);
		const speakerData = {};
		const token = chatHelper.getTokenFromKey( this.actorKey);
		if( token) speakerData.token = token;
		else speakerData.actor = this.actor;

		const speaker = ChatMessage.getSpeaker(speakerData);
		// if( this.actor.isToken) speaker.alias = this.actor.token.name;
		
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

		const chatMessage = await ChatMessage.create(chatData);
		
		return chatMessage;
	}

	async updateChatCard(){
		this.calcTargetsDifficulty();
		let html = await renderTemplate(this.template, this);

		const message = game.messages.get( this.messageId);

		const msg = await message.update({ content: html });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}

	toggleFlag( flagName){
		const flag = flagName.includes('-') ? chatHelper.hyphenToCamelCase( flagName) : flagName;
		if( 'singleShot' === flag || 'multipleShots' === flag || 'fullAuto' === flag){	
			this.singleShot = false;
			this.multipleShots = false;
			this.fullAuto = false;
			if( 'fullAuto' === flag) this.burst = false;
			this[flag] = true;
		} else if ('burst' === flag ) {
			this.fullAuto = false;
			if( !this.singleShot && !this.multipleShots) this.singleShot = true;
			this.burst = !this.burst;
		} else {
			this[flag] = !this[flag];
		}
	}

	async resolveCard(){
		this.rolls = [];
		if( this.multiTarget) {
			let weaponMalfunction = false;
			let index = 0;
			while( !weaponMalfunction && this.shots.length > index){
				const roll = this.shootAtTarget( this.shots[index]);
				await this.weapon.shootBullets( parseInt(this.shots[index].bulletsShot) + parseInt(this.shots[index].transitBullets));
				if( roll.hasMalfunction){
					roll.isSuccess = false;
					weaponMalfunction = true;
				}
				index++;
				this.rolls.push( roll);
			}			
		} else {
			const roll = this.shootAtTarget();
			let bulletFired = this.burst? parseInt(this.weapon.data.data.usesPerRound.burst) :1;
			if( bulletFired >= this.totalAmmo) bulletFired = this.totalAmmo;
			const shot = {
				target: this.activeTarget,
				extremeRange: this.activeTarget.extremeRange,
				actorKey: this.activeTarget.actorKey,
				actorName: this.activeTarget.name,
				difficulty: this.activeTarget.shotDifficulty.level,
				modifier: this.activeTarget.shotDifficulty.modifier,
				damage: this.activeTarget.shotDifficulty.damage,
				bulletsShot: bulletFired,
				transitBullets: 0,
				transit: false		
			};
			await this.weapon.shootBullets( bulletFired);

			if( roll.hasMalfunction){
				roll.isSuccess = false;
			}
			this.shots.push( shot);
			this.rolls.push( roll);
		}
		this.resolved = true;
		this.rolled = true;

		await this.updateChatCard();
	}

	shootAtTarget( shot = null){
		const target = shot?this.getTargetFromKey( shot.actorKey) :this.activeTarget;
		const check = new CoC7Check();
		check.actorKey = this.actorKey;
		check.actor = this.actorKey;
		check.item = this.itemId;
		// Combat roll cannot be blind or unknown
		check.isBlind = false;
		check.isUnkonwn = false;
		if( this.autoFire) check.skill = this.autoWeaponSkill;
		else check.skill = this.mainWeaponSkill;
		if( this.multiTarget){ 
			check.difficulty = shot.difficulty;
			check.diceModifier = shot.modifier;
		} else {
			this.calcTargetsDifficulty();
			this.totalBulletsFired = parseInt( this.totalBulletsFired) + 1;
			if( this.aiming){
				this.aiming = false;
				this.aimed = true;
			}
			check.difficulty = this.activeTarget.shotDifficulty.level,
			check.diceModifier = this.activeTarget.shotDifficulty.modifier;
		}

		check.details = `target : ${target.name}`;
		check.targetKey = target.actorKey;

		check.roll();
		// const result = await check.shortResult( details);
		return check;
	}

	static getFromMessageId( messageId){
		const message = game.messages.get( messageId);
		if( ! message) return null;
		const card = $(message.data.content)[0];

		const initiator = CoC7RangeInitiator.getFromCard( card, messageId);
		initiator.messageId = messageId;

		return initiator;
	}

	
	changeVolleySize( x){
		this.volleySize = this.volleySize + x;
		this.updateChatCard();
	}
	
	static updateCardSwitch( event, publishUpdate = true){
		const card = event.currentTarget.closest('.range.initiator');
		const flag = event.currentTarget.dataset.flag;
		const camelFlag = chatHelper.hyphenToCamelCase(flag);

		//update only for local player
		if( !publishUpdate){
			card.dataset[camelFlag] = 'true' == card.dataset[camelFlag] ? false : true;
			event.currentTarget.classList.toggle('switched-on');
			event.currentTarget.dataset.selected = card.dataset[camelFlag];
		} else { //update card for all player
			const initiator = CoC7RangeInitiator.getFromCard( card);
			if( event.currentTarget.classList.contains('target-flag')){
				const target = event.currentTarget.closest('.target');
				const key = parseInt(target.dataset.targetKey);
				initiator.targets[key].toggleFlag( camelFlag);
			} else initiator.toggleFlag(camelFlag);
			initiator.updateChatCard();
		}
	}

	passRoll( rollIndex){
		const roll = this.rolls[rollIndex];
		const luckAmount = parseInt(roll.luckNeeded);
		if( !this.actor.spendLuck( luckAmount)){ ui.notifications.error(`${actor.name} does not have enough luck to pass the check`); return;}
		roll.successLevel = roll.difficulty;
		roll.isSuccess = true;
		roll.luckSpent = true;
		this.updateChatCard();
	}

	upgradeRoll( rollIndex, upgradeindex){  //TODO : Check if this needs to be async
		const roll = this.rolls[rollIndex];
		const increasedSuccess = roll.increaseSuccess[upgradeindex];
		const luckAmount = parseInt(increasedSuccess.luckAmount);
		if( !this.actor.spendLuck( luckAmount)){ ui.notifications.error(`${actor.name} does not have enough luck to pass the check`); return;}
		const newSuccessLevel = parseInt( increasedSuccess.newSuccessLevel);
		roll.successLevel = newSuccessLevel;
		if( roll.difficulty <= newSuccessLevel) roll.isSuccess = true;
		roll.luckSpent = true;
		this.updateChatCard();  //TODO : Check if this needs to be async
	}

	static getFromCard( card, messageId = null){
		const rangeInitiator = new CoC7RangeInitiator();
		rangeInitiator._targets = [];
		if( messageId) rangeInitiator.messageId = messageId;
		else if( card.closest('.message')) 
			rangeInitiator.messageId = card.closest('.message').dataset.messageId;

		chatHelper.getObjectFromElement( rangeInitiator, card);
		const cardTargets = card.querySelectorAll('.target');
		cardTargets.forEach( t => {
			const target = CoC7RangeTarget.getFromElement( t);
			rangeInitiator.targets.push( target);						
		});

		const cardShots = card.querySelectorAll('.shot');
		if( cardShots){
			cardShots.forEach( s => {
				const shot = {};
				chatHelper.getObjectFromElement( shot, s);
				rangeInitiator.shots.push( shot);
			});
		}
		// else {
		// 	const shot = {
		// 		shotOrder: 0,
		// 		actorKey: null,
		// 		actorName: 'dummy'
		// 	}
		// }

		rangeInitiator.rolls = [];
		const rolls = card.querySelectorAll('.roll-result');
		rolls.forEach( r =>{
			const roll = CoC7Roll.getFromElement( r);
			rangeInitiator.rolls.push(roll);
		});

		rangeInitiator.damage = [];
		const damageRolls = card.querySelectorAll('.damage-results');
		damageRolls.forEach( dr => {
			const damageRoll = CoC7Damage.getFromElement( dr);
			rangeInitiator.damage.push( damageRoll);
		});

		return rangeInitiator;
	}

	rollDamage(){
		this.damage = [];
		const hits=this.successfulHits;
		
		// let volleySize = 1;
		// if( this.fullAuto) {
		// 	volleySize = this.volleySize;
		// 	if(volleySize < 3) volleySize = 3;
		// }
		// if( this.burst) volleySize = parseInt(this.weapon.data.data.usesPerRound.burst);
		hits.forEach( h => {
			const volleySize = parseInt(h.shot.bulletsShot);
			const damageRolls = [];
			
			const damageFormula = h.shot.damage;
			const damageDie = CoC7Damage.getMainDie( damageFormula);
			const maxDamage = Roll.maximize( damageFormula).total;
			const criticalDamageFormula = this.weapon.impale ? `${damageFormula} + ${maxDamage}` : `${maxDamage}`;
			const criticalDamageDie = CoC7Damage.getMainDie( criticalDamageFormula);

			let impalingShots = 0;
			let successfulShots = 0;
			let critical = false;
			if( this.fullAuto || this.burst) successfulShots = Math.floor(volleySize/2);
			if( 0 == successfulShots) successfulShots = 1;
			if( h.roll.successLevel >= CoC7Check.difficultyLevel.extreme){
				impalingShots = successfulShots;
				successfulShots = volleySize - impalingShots;
				critical = true;
				if( CoC7Check.difficultyLevel.critical != h.roll.successLevel && ((CoC7Check.difficultyLevel.extreme <= h.roll.difficulty) || h.shot.extremeRange)){
					successfulShots = volleySize;
					impalingShots = 0;
					critical = false;
				}
			}

			let total = 0;
			for (let index = 0; index < successfulShots; index++) {
				const roll = new Roll(damageFormula);
				roll.roll();
				damageRolls.push( {
					formula: damageFormula,
					total: roll.total,
					die: damageDie,
					critical: false
				});
				total += roll.total;
			}
			for (let index = 0; index < impalingShots; index++) {
				const roll = new Roll(criticalDamageFormula);
				roll.roll();
				damageRolls.push( {
					formula: criticalDamageFormula,
					total: roll.total,
					die: criticalDamageDie,
					critical: true
				});
				total += roll.total;
			}

			let targetName = 'dummy';
			let target = chatHelper.getTokenFromKey( h.roll.targetKey);
			if( !target) target = chatHelper.getActorFromKey( h.roll.targetKey);
			if( target) targetName = target.name;


			this.damage.push( {
				targetKey: h.roll.targetKey,
				targetName: targetName,
				rolls: damageRolls,
				total: total,
				critical: critical,
				dealt:false,
				resultString: game.i18n.format('CoC7.rangeCombatDamage', {name : targetName, total: total})
			});
		});

		this.damageRolled = 0 != this.damage.length;
		this.updateChatCard();
	}

	async dealDamage(){
		for (let dIndex = 0; dIndex < this.damage.length; dIndex++) {
			const actor = chatHelper.getActorFromKey( this.damage[dIndex].targetKey);
			for( let rIndex = 0; rIndex < this.damage[dIndex].rolls.length; rIndex++){
				await actor.dealDamage( this.damage[dIndex].rolls[rIndex].total);
			}
			this.damage[dIndex].dealt = true;
		}
		this.damageDealt = true;
		this.updateChatCard();
	}

}

export class CoC7RangeTarget{
	constructor( actorKey = null){
		this.actorKey = actorKey;
		this.cover = false;
		this.pointBlankRange = false;
		this.baseRange = true;
		this.longRange = false;
		this.extremeRange = false;
		this.inMelee=false;
	}

	get big(){
		if( undefined === this._big){
			if( this.actor && this.actor.build) this._big = this.actor.build >= 4;
			else this._big = false;
		} 
		return this._big;
	}

	set big( b){
		this._big = b;
	}

	get small(){
		if( undefined === this._small){
			if( this.actor && this.actor.build) this._small = this.actor.build <= -2;
			else this._small = false;
		} 
		return this._small;
	}

	set small( b){
		this._small = b;
	}

	get normal(){
		return !this.big && !this.small;
	}

	set normal(b){
		this._big = false;
		this._small = false;
	}

	get isFast(){
		if( this.actor && this.actor.mov) return this.actor.mov >= 8;
		return false;
	}
	
	get fast(){
		if( undefined === this._fast){
			// if( this.actor && this.actor.mov) this._fast = this.actor.mov >= 8;
			// else this._fast = false;
			this._fast = false;
		} 
		return this._fast;
	}

	set fast( b){
		this._fast = b;
	}
	

	get actor(){
		if( this.actorKey && !this._actor) this._actor = chatHelper.getActorFromKey(this.actorKey);
		return this._actor;
	}

	get name(){
		if( this.token) return this.token.name;
		if( this.actor) return this.actor.name;
		return 'Dummy';
	}

	get  img(){
		if( this.token) return this.token.data.img;
		if( this.actor) return this.actor.data.img;
		return '../icons/svg/mystery-man-black.svg';
	}

	get token(){
		if( !this._token && this.actorKey){
			this._token = chatHelper.getTokenFromKey( this.actorKey);
		}
		return this._token;
	}

	get sizeText(){
		if( this.big) return '1 bonus die for big target (Build > +4)';
		if( this.small) return '1 penalty die for a small target';
		return 'Target has a normal size, no bonus/penalty';
	}

	get sizeLabel(){
		if( this.big) return game.i18n.localize('CoC7.rangeCombatCard.BigTarget');
		if( this.small) return game.i18n.localize('CoC7.combatCard.SmallTarget');
		return 'Normal';

	}

	get difficulty(){
		if( this.baseRange) return CoC7Check.difficultyLevel.regular;
		if( this.longRange) return CoC7Check.difficultyLevel.hard;
		if( this.extremeRange) return CoC7Check.difficultyLevel.extreme;
		return CoC7Check.difficultyLevel.impossible;
	}

	get modifier(){
		let modifier = 0;
		if( this.cover) modifier--;
		if( this.pointBlankRange) modifier++;
		if( this.fast) modifier--;
		if( this.small) modifier--;
		if( this.big) modifier++;
		if( this.inMelee) modifier--;
		if( this.surprised) modifier++;
		return modifier;
	}

	set token(t){
		this._token = t;
	}

	static getFromElement( element){
		const target = new CoC7RangeTarget();
		chatHelper.getObjectFromElement( target, element);
		return target;
	}

	static changeDisplayedTarget( event){
		if( !event.currentTarget.classList.contains('target-selector')) return null;
		const targetSelector = event.currentTarget;
		const targets = targetSelector.closest('.targets');
		const targetList = targets.querySelectorAll('.target');
		return targetList;
	}

	attachToElement( element){
		chatHelper.attachObjectToElement( this, element);
	}

	toggleFlag( flag){
		if( 'baseRange' === flag || 'longRange' === flag || 'extremeRange' === flag	){
			this.baseRange = false;
			this.longRange = false;
			this.extremeRange = false;
			this.outOfRange = false;
			this[flag] = true;
		} else if('size' === flag) {
			if( this.small) {this.small = false; this.big=true;}
			else if ( this.big) { this.small = false; this.big = false;}
			else this.small = true;
		}
		else this[flag] = !this[flag];
		if( 'fast' === flag && this.fast && !this.isFast) ui.notifications.warn( game.i18n.format( 'CoC7.WarnFastTargetWithWrongMOV', {mov: this.actor.mov}));
	}
}