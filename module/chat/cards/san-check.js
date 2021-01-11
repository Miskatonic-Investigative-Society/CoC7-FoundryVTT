import { CoC7Check } from '../../check.js';
import { CoC7Dice } from '../../dice.js';
import { ChatCardActor } from '../card-actor.js';
import { exclude_, chatHelper } from '../helper.js';

export class SanCheckCard extends ChatCardActor{
	constructor( actorKey = null, sanData={}, options={}){
		super( actorKey, options.fastForward != undefined?Boolean(options.fastForward):false);
		this.sanData = sanData;
		this.options = options;
		this.options.obj={test:1,test2:2};
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
		if( this.sanData.creatureKey && (!this._creature || this._creature.constructor.name == 'Object')){
			this._creature = chatHelper.getActorFromKey( this.sanData.creatureKey);
		}
		return this._creature;
	}

	get involuntaryAction(){
		if( this.state.sanRolled && (this.sanCheck.isFailure || this.sanCheck.isFumble)) return true;
		return false;
	}

	get sanLossFormula(){
		if( this.state.sanRolled){
			if( this.sanData.sanMax && this.sanCheck.failed) return this.sanData.sanMax;
			if( this.sanData.sanMin && this.sanCheck.passed) return this.sanData.sanMin;

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
		return this.actor.sanLostToCreature(this.creature);
	}

	get maxSanLossToThisCreature(){
		return this.actor.maxPossibleSanLossToCreature(this.creature);
	}

	get creatureEncountered(){
		return this.actor.creatureEncountered( this.creature);
	}

	get creatureSpecieEncountered(){
		return this.actor.creatureSpecieEncountered( this.creature);
	}

	get isActorLoosingSan(){
		// Creature has no san loss (what are we doing here ???)
		if( !this.creature.sanLossMax) return false;

		// The san loss is a 0
		if( this.sanLossFormula === 0) return false;

		// Actor already encountered that creature and lost already more or equal than max creature SAN loss.
		if( this.actor.sanLostToCreature(this.creature) >= this.creature.sanLossMax) return false;

		// Max possible actor loos to this creature is 0
		if( this.actor.maxPossibleSanLossToCreature( this.creature) == 0) return false;
		return true;
	}

	async advanceState( state){
		switch (state) {
		case 'involuntaryActionPerformed':{
			this.state[state] = true;
			break;
		}
		case 'sanLossApplied':{
			await this.applySanLoss();
			break;
		}
		default:
			break;
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
			this.state.sanLossRolled = true;
			this.state.sanLossApplied = true;
			this.state.finish = true;
			this.sanLoss = 0;
		}

		if( 'number' == typeof this.sanLossFormula){
			this.state.sanLossRolled = true;
			this.sanLoss = Math.min( this.sanLossFormula, this.maxSanLossToThisCreature);
		} else {
			const min = new Roll(this.sanLossFormula).evaluate({minimize: true}).total;
			if( min >= this.maxSanLossToThisCreature) {
				this.state.sanLossRolled = true;
				this.sanLoss = this.maxSanLossToThisCreature;
			}
		}
		// const data = CoC7Utilities.getCreatureSanData('Byakhee T');
		// token key 	"dARanq8Eb5f13aVb.xUkMEwxuTSYYAZiq"
		// token name	"Byakhee T"
		// actor id  	"SOzhC4mT3mVFqX5n"
		// acotr name	"Byakhee"
	}

	async rollSanLoss(){
		this.sanLossRoll = new Roll(`{${this.sanLossFormula},${this.maxSanLossToThisCreature}}kl`);
		this.sanLossRoll.roll();

		await CoC7Dice.showRollDice3d( this.sanLossRoll);
		
		this.sanLoss = this.sanLossRoll.total;
		this.sanLoss = Math.min( this.sanLoss, this.maxSanLossToThisCreature);
		this.state.sanLossRolled = true;
	}

	async applySanLoss(){
		await this.actor.looseSanToCreature( this.sanLoss, this.creature);
		this.state.sanLossApplied = true;
		if( this.actor.san <= 0){
			this.state.definitelyInsane = true;
			this.state.finish = true;
			return;
		}

		if( this.sanLoss < 5) {
			this.state.intRolled = true;
			this.state.insanity = false;
			this.state.shaken = true;
			this.state.insanityTableRolled = true;
			this.state.finish = true;
		}

		if( this.sanLoss >= 5)
		{
			this.state.intRolled = false;
		} 

		if( this.actor.dailySanLoss >= this.actor.san/5 )
		{
			this.state.inSanity = true;
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
		if( this.intCheck.passed){
			this.state.insanity = true;
			this.state.temporaryInsane = true;
			this.state.indefinitelyInsane = false;
		}
	}

	async updateChatCard(){
		const html = await renderTemplate(SanCheckCard.template, this);
		const htmlCardElement = $.parseHTML( html)[0];

		//Attach the sanCheckCard object to the message.
		htmlCardElement.dataset.object = JSON.stringify(this, exclude_);

		//Attache the sanCheck result to the message.
		if( this.state.sanRolled){
			const htmlSanCheckEment = await this.sanCheck.getHtmlRollElement();
			if( htmlSanCheckEment) htmlCardElement.querySelector('.san-check').appendChild(htmlSanCheckEment);
		}

		if( this.sanLossRoll)
		{
			this.sanLossRoll.tooltip = await renderTemplate(Roll.TOOLTIP_TEMPLATE, this.sanLossRoll);
			const htmlRoll =  await renderTemplate(Roll.CHAT_TEMPLATE, this.sanLossRoll);
			const htmlSanLossRollEment = $.parseHTML( htmlRoll)[0];
			if( htmlSanLossRollEment) htmlCardElement.querySelector('.san-loss-roll').appendChild(htmlSanLossRollEment);

		}

		if( this.state.intRolled && this.intCheck ){
			const htmlIntCheckEment = await this.intCheck.getHtmlRollElement();
			if( htmlIntCheckEment) htmlCardElement.querySelector('.int-check').appendChild(htmlIntCheckEment);
		}


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

		const html = await renderTemplate(SanCheckCard.template, chatCard);
		const htmlCardElement = $.parseHTML( html)[0];
		
		htmlCardElement.dataset.object = JSON.stringify(chatCard, exclude_);
		await chatCard.say( htmlCardElement.outerHTML);
	}

	static getFromMessageId( messageId){
		const message = game.messages.get( messageId);
		const htmlMessage = $.parseHTML( message.data.content)[0];

		const htmlCard = htmlMessage.querySelector( '.chat-card');

		return SanCheckCard.getFromCard( htmlCard);
	}

	static getFromCard( card){
		const sanCheckCardData = JSON.parse(card.dataset.object);

		const sanCheckCard = new SanCheckCard();
		Object.assign( sanCheckCard, sanCheckCardData);
		if( !sanCheckCard.messageId) sanCheckCard.messageId = card.closest('.message').dataset.messageId;

		if( 'Object' == sanCheckCard.sanCheck?.constructor?.name){
			sanCheckCard.sanCheck = Object.assign( new CoC7Check(), sanCheckCard.sanCheck);
		}

		if( 'Object' == sanCheckCard.intCheck?.constructor?.name){
			sanCheckCard.sanCheck = Object.assign( new CoC7Check(), sanCheckCard.intCheck);
		}

		if( 'Object' == sanCheckCard.sanLossRoll?.constructor?.name){
			// const toll = new Roll(`3D10kh`);
			// toll.roll();
			// const roll = Roll.create( sanCheckCard.sanLossRoll.formula, sanCheckCard.sanLossRoll);
			sanCheckCard.sanLossRoll = Roll.fromData(sanCheckCard.sanLossRoll);
			// sanCheckCard.sanLossRoll = Roll.fromJSON(JSON.stringify(sanCheckCard.sanLossRoll));
			// sanCheckCard.sanLossRoll = Object.assign( new Roll(), sanCheckCard.sanLossRoll);
		}

		// sanCheckCard.sanCheck?.toMessage();

		return sanCheckCard;


	}
    
}