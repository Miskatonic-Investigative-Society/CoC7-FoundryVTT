import { CoC7Check } from '../../check.js';
import { CoC7Dice } from '../../dice.js';
import { CoC7Utilities } from '../../utilities.js';
import { ChatCardActor } from '../card-actor.js';
import { createInlineRoll, chatHelper } from '../helper.js';

function replacer(key, value){
	if ( key.startsWith('__')) {
		return undefined; // remove from result
	}

	const exclude = ['_actor', '_creature'];
	if( exclude.includes(key)){
		return undefined;
	}

	const checks = ['sanCheck', 'intCheck'];
	if( checks.includes(key))
	{
		return value.JSONRollData;
	}

	return value; // return as is
}
export class SanCheckCard extends ChatCardActor{
	constructor( actorKey = null, sanData={}, options={}){
		super( actorKey, options.fastForward != undefined?Boolean(options.fastForward):false);
		this.sanData = sanData;
		this.options = options;
		if( sanData.modifier && !isNaN( Number(sanData.modifier))){
			this.options.sanModifier = Number(sanData.modifier);
		}
		if( sanData.difficulty && !isNaN( Number(sanData.difficulty))){
			this.options.sanDifficulty = Number(sanData.difficulty);
		}
		// this.options.obj={test:1,test2:2};
		this.state={};
	}
    
	get isBlind(){
		return ( this.options.isBlind != undefined) ? Boolean(this.options.isBlind):super.isBlind;
	}
    
	get difficulty(){
		return ( this.options.difficulty != undefined) ? this.options.difficulty:CoC7Check.difficultyLevel.regular;
	}
    
	get modifier(){
		return ( this.options.modifier != undefined) ? this.options.modifier:0;
	}

	get creature(){ //TODO : check constructor
		if( this.sanData.creatureKey && (!this.__creature || this.__creature.constructor.name == 'Object')){
			this.__creature = chatHelper.getActorFromKey( this.sanData.creatureKey);
		}
		return this.__creature;
	}

	get involuntaryAction(){
		if( this.state.sanRolled && (this.sanCheck.isFailure || this.sanCheck.isFumble)) return true;
		return false;
	}

	get sanLossFormula(){
		if( this.state.sanRolled){
			if( this.sanData.sanMax && this.sanCheck.failed) return !isNaN(Number(this.sanData.sanMax))?Number(this.sanData.sanMax):this.sanData.sanMax;
			if( this.sanData.sanMin && this.sanCheck.passed) return !isNaN(Number(this.sanData.sanMin))?Number(this.sanData.sanMin):this.sanData.sanMin;

			const formula = this.creature.sanLoss( this.sanCheck.passed);
			if( formula){
				if( !isNaN(Number(formula))) return Number(formula);
				return formula;
			}
			return 0;
		}
		return null;
	}

	get sanLostToThisCreature(){
		if( this.creature) return this.actor.sanLostToCreature(this.creature);
		return undefined;
	}

	get maxSanLossToThisCreature(){
		if( this.creature) return this.actor.maxPossibleSanLossToCreature(this.creature);
		return undefined;
	}

	get maxSanLoss(){
		if( this.creature) return this.maxSanLossToThisCreature;
		if( this.sanData.sanMax){
			if( !isNaN( Number(this.sanData.sanMax)) ) return Number(this.sanData.sanMax);
			return new Roll(this.sanData.sanMax).evaluate({maximize: true}).total;
		}
		return null;
	}

	get creatureEncountered(){
		if( this.creature) return this.actor.creatureEncountered( this.creature);
		return undefined;
	}

	get creatureSpecieEncountered(){
		if( this.creature) return this.actor.creatureSpecieEncountered( this.creature);
		return undefined;
	}

	get firstEncounter(){
		return !this.actor.mythosInsanityExperienced;
	}

	get creatureHasSpecie(){
		const creatureSanData = CoC7Utilities.getCreatureSanData( this.creature);
		if( creatureSanData.specie) return true;
		return false;
	}

	get isActorLoosingSan(){
		// No san loss during bout of mad.
		if( this.actor.isInABoutOfMadness){
			return false;
		}

		// The san loss is a 0
		if( this.sanLossFormula === 0) return false;
				
		if( this.creature){
		// Creature has no san loss (what are we doing here ???)
			if( !this.creature.sanLossMax) return false;

			// Actor already encountered that creature and lost already more or equal than max creature SAN loss.
			if( this.actor.sanLostToCreature(this.creature) >= this.creature.sanLossMax){
				this.state.immuneToCreature = true;
				return false;
			}

			// Max possible actor loos to this creature is 0
			if( this.actor.maxPossibleSanLossToCreature( this.creature) == 0){
				this.state.immuneToCreature = true;
				return false;
			}
		}

		return true;
	}

	get boutDurationText(){
		if( this.boutDuration)
		{
			if( this.boutRealTime) return `${this.boutDuration} rounds`;
			if( this.boutSummary) return `${this.boutDuration} hours`;
		}
		return null;
	}

	get alreadyInsaneText(){
		if( this.actor.sanity.underlying.indefintie){
			return game.i18n.localize( 'CoC7.AlreadyUnderlyingInsanity');
		} else {
			return game.i18n.localize( 'CoC7.AlreadyUnderlyingInsanity') + ` (${this.actor.sanity.underlying.durationText})`;
		}
	}

	get youGainCthulhuMythosString(){
		if( this.mythosGain) return game.i18n.format( 'CoC7.YouGainedCthulhuMythos', {value: this.mythosGain});
		return null;
	}

	async advanceState( state){
		switch (state) {
		case 'keepCreatureSanData':{
			this.state['keepCreatureSanData'] = true;
			break;
		}
		case 'involuntaryActionPerformed':{
			this.state[state] = true;
			if( !this.isActorLoosingSan) this.state.finish = true;
			break;
		}
		case 'sanLossApplied':{
			await this.applySanLoss();
			break;
		}
		case 'enterBoutOfMadnessRealTime':{
			this.boutDuration = new Roll('1D10').roll().total;
			this.boutRealTime = true;
			this.boutSummary = false;
			this.boutResult = await this.actor.enterBoutOfMadness(true, this.boutDuration);
			this.state.boutOfMadnessResolved = true;
			this.state.boutOfMadnessOver = false;
			break;
		}
		case 'enterBoutOfMadnessSummary':{
			this.boutDuration = new Roll('1D10').roll().total;
			this.boutRealTime = false;
			this.boutSummary = true;
			this.boutResult = await this.actor.enterBoutOfMadness(false, this.boutDuration);
			this.state.boutOfMadnessResolved = true;
			await this.triggerInsanity();
			// if( this.state.indefinitelyInsane) this.actor.
			break;
		}
		case 'boutOfMadnessOver':{
			await this.actor.exitBoutOfMadness();
			await this.triggerInsanity();
			break;
		}

		case 'noMythosGained':{
			this.state.cthulhuMythosAwarded = true;
			this.mythosGain = 0;
			break;
		}

		case 'cthulhuMythosAwarded':{
			let amountGained = 1;
			if( !this.actor.mythosInsanityExperienced){
				amountGained = 5;
				await this.actor.experienceFirstMythosInsanity();
			}
			this.state.cthulhuMythosAwarded = true;
			const cthulhuMythosSkill = this.actor.cthulhuMythosSkill;
			const oldValue = cthulhuMythosSkill.data.data.adjustments.experience || 0;
			if( cthulhuMythosSkill ) await cthulhuMythosSkill.update( {['data.adjustments.experience']: oldValue + amountGained});
			this.mythosGain = amountGained;
			break;
		}

		}
	}

	async rollSan(){
		this.sanCheck = new CoC7Check();
		this.sanCheck.actor = this.actorKey;
		this.sanCheck.attribute = 'san';
		this.sanCheck.difficulty = this.options.sanDifficulty || CoC7Check.difficultyLevel.regular;
		this.sanCheck.diceModifier = this.options.sanModifier || 0;
		await this.sanCheck._perform();
		this.state.sanRolled = true;
		this.state.involuntaryActionPerformed = this.sanCheck.passed;
		if( !this.isActorLoosingSan){
			this.state.finish = true;
			if( this.actor.isInABoutOfMadness) {
				this.state.immuneAlreadyInBout = true;
				if( !this.sanCheck.passed) this.state.finish = false;
			}
			this.state.sanLossRolled = true;
			this.state.sanLossApplied = true;
			this.state.intRolled = true;
			this.state.insanity = false;
			this.sanLoss = 0;
		} else if( 'number' == typeof this.sanLossFormula){
			this.state.sanLossRolled = true;
			if( this.creature) {
				this.sanLoss = Math.min( this.sanLossFormula, this.maxSanLossToThisCreature);
				if( this.sanLossFormula > this.maxSanLossToThisCreature) this.state.limitedLossToCreature = true;
			}
			else this.sanLoss = this.sanLossFormula;
		} else if( this.sanCheck.isFumble){
			this.state.sanLossRolled = true;
			this.sanLoss = this.maxSanLoss;
		} else if( this.creature){
			const min = new Roll(this.sanLossFormula).evaluate({minimize: true}).total;
			if( min >= this.maxSanLossToThisCreature) {
				this.state.sanLossRolled = true;
				this.sanLoss = this.maxSanLossToThisCreature;
				this.state.limitedLossToCreature = true;
			}
		}
	}

	async rollSanLoss(){
		if( this.creature){
			// this.sanLossRoll = new Roll(`{${this.sanLossFormula},${this.maxSanLossToThisCreature}}kl`);
			this.sanLossRoll = new Roll(`${this.sanLossFormula}`);
		} else {
			this.sanLossRoll = new Roll(`${this.sanLossFormula}`);
		}

		this.sanLossRoll.roll();

		await CoC7Dice.showRollDice3d( this.sanLossRoll);

		if( this.creature){//Will never happen
			if( this.sanLossRoll.total > this.maxSanLossToThisCreature) this.state.limitedLossToCreature = true;
		}
		
		this.sanLoss = this.creature?Math.min( this.sanLossRoll.total, this.maxSanLossToThisCreature):this.sanLossRoll.total;
		this.state.sanLossRolled = true;
	}

	async applySanLoss(){
		if( this.creature){
			await this.actor.looseSanToCreature( this.sanLoss, this.creature);
		} else {
			await this.actor.looseSan( this.sanLoss);
		}

		if( this.sanLoss > 0) this.state.actorLostSan = true;
		this.state.sanLossApplied = true;
		if( this.actor.san <= 0){
			this.state.intRolled = true;
			this.state.boutOfMadnessOver = true;

			this.state.insanity = true;
			this.state.permanentlyInsane = true;

			this.state.finish = true;
			return;
		}

		if( this.sanLoss < 5) {
			this.state.intRolled = true;
			if( this.actor.isInsane){
				this.state.insanity = true;
				this.state.shaken = true;
				this.state.insanityTableRolled = false;
				this.state.finish = false;
				this.state.intRolled = true;
			} else {
				this.state.insanity = false;
				this.state.shaken = true;
				this.state.insanityTableRolled = true;
				this.state.finish = true;
			}
		} else {
			this.state.intRolled = false;
		} 

		if( this.actor.dailySanLoss >= this.actor.san/5 )
		{
			this.state.insanity = true;
			this.state.intRolled = true;
			this.state.temporaryInsane = false;
			this.state.indefinitelyInsane = true;
			this.state.insanityTableRolled = false;
			this.state.memoryRepressed = false;
			this.state.finish = false;
		}
	}

	async rollInt(){
		this.intCheck = new CoC7Check();
		this.intCheck.actor = this.actorKey;
		this.intCheck.characteristic = 'int';
		this.intCheck.difficulty = this.options.intDifficulty || CoC7Check.difficultyLevel.regular;
		this.intCheck.diceModifier = this.options.intModifier || 0;
		await this.intCheck._perform();
		this.state.intRolled = true;
		if( this.intCheck.passed || this.state.alreadyInsane){
			this.state.insanity = true;
			this.state.temporaryInsane = true;
			this.state.indefinitelyInsane = false;
			this.state.memoryRepressed=false;
		} else {
			this.state.insanity = false;
			this.state.temporaryInsane = false;
			this.state.indefinitelyInsane = false;
			this.state.memoryRepressed = true;
			this.state.finish = true;
		}
	}

	async triggerInsanity(){
		this.state.boutOfMadnessOver = true;
		if( this.state.indefinitelyInsane) await this.actor.enterInsanity( true);
		if( this.state.temporaryInsane){
			if( this.actor.sanity.underlying.active && this.actor.sanity.underlying.indefintie){
				//Already indefinite insanity
				this.state.finish = true;
				return;
			}
			this.insanityDurationRoll = new Roll( '1D10').roll();
			this.insanityDuration = this.insanityDurationRoll.total;
			if( this.actor.sanity.underlying.duration) this.insanityDuration += this.actor.sanity.underlying.duration;
			await this.actor.enterInsanity( false, this.insanityDuration);
		}
		this.state.finish = true;
	}

	async resetCreatureSanData(){
		await this.actor.resetCreature( this.creature);
		if( !this.creatureEncountered && !this.creatureSpecieEncountered) this.state.keepCreatureSanData = true;
	}

	async resetSpecieSanData(){
		await this.actor.resetSpecie( this.creature);
		if( !this.creatureEncountered && !this.creatureSpecieEncountered) this.state.keepCreatureSanData = true;
	}


	async updateChatCard(){

		//Attache the sanCheck result to the message.
		if( this.state.sanRolled){
			this.__inlineSanCheck = this.sanCheck.inlineCheck.outerHTML;
		}

		if( this.sanLossRoll)
		{
			const a = createInlineRoll(this.sanLossRoll);
			this.__inlineSanLossRoll = a.outerHTML;
		}

		
		if( this.state.intRolled && this.intCheck ){
			this.__inlineIntCheck = this.intCheck.inlineCheck.outerHTML;
		}
				
		const html = await renderTemplate(SanCheckCard.template, this);
		const htmlCardElement = $.parseHTML( html)[0];

		//Attach the sanCheckCard object to the message.
		htmlCardElement.dataset.object = escape(JSON.stringify(this, replacer));

		//Update the message.
		const chatMessage = game.messages.get( this.messageId);

		const msg = await chatMessage.update({ content: htmlCardElement.outerHTML });
		await ui.chat.updateMessage( msg, false);
		return msg;
	}
    
	static get template(){
		return 'systems/CoC7/templates/chat/cards/san-check.html';
	}

	static checkTargets( creatureKey, fastForward = false){
		const targets = [...game.user.targets];
		if( targets.length){
			targets.forEach( t => { //TODO : ? Make async call to create ?
				if( t.actor.isToken) SanCheckCard.create( t.actor.tokenKey, {creatureKey:creatureKey}, {fastForward:fastForward});
				else SanCheckCard.create( t.actor.id, {creatureKey:creatureKey}, {fastForward:fastForward});
			});
		} 
	}

	static async create(...args){
		const chatCard = new SanCheckCard( ...args);

		if( chatCard.actor.isInsane){
			chatCard.state.alreadyInsane = true;
		}

		if( chatCard.actor.san <= 0){
			chatCard.state.intRolled = true;
			chatCard.state.boutOfMadnessOver = true;

			chatCard.state.insanity = true;
			chatCard.state.permanentlyInsane = true;

			chatCard.state.finish = true;
		}

		if( !chatCard.creatureEncountered && !chatCard.creatureSpecieEncountered) chatCard.state.keepCreatureSanData = true;


		const html = await renderTemplate(SanCheckCard.template, chatCard);
		const htmlCardElement = $.parseHTML( html)[0];
		
		htmlCardElement.dataset.object = escape(JSON.stringify(chatCard, replacer));
		await chatCard.say( htmlCardElement.outerHTML);
	}

	static getFromMessageId( messageId){
		const message = game.messages.get( messageId);
		const htmlMessage = $.parseHTML( message.data.content)[0];

		const htmlCard = htmlMessage.querySelector( '.chat-card');

		return SanCheckCard.getFromCard( htmlCard);
	}

	static getFromCard( card){
		const sanCheckCardData = JSON.parse(unescape(card.dataset.object));

		const sanCheckCard = new SanCheckCard();
		Object.assign( sanCheckCard, sanCheckCardData);
		if( !sanCheckCard.messageId) sanCheckCard.messageId = card.closest('.message').dataset.messageId;

		if( 'Object' == sanCheckCard.sanCheck?.constructor?.name){
			sanCheckCard.sanCheck = Object.assign( new CoC7Check(), sanCheckCard.sanCheck);
		}

		if( 'Object' == sanCheckCard.intCheck?.constructor?.name){
			sanCheckCard.intCheck = Object.assign( new CoC7Check(), sanCheckCard.intCheck);
		}

		if( 'Object' == sanCheckCard.sanLossRoll?.constructor?.name){
			sanCheckCard.sanLossRoll = Roll.fromData(sanCheckCard.sanLossRoll);
		}

		// sanCheckCard.sanCheck?.toMessage();

		return sanCheckCard;


	}
    
}