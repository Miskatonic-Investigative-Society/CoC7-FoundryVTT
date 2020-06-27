import { CoC7Check } from '../check.js'

export class CoC7MeleeInitiator{
	constructor(actorKey = null, itemId = null, fastForward = false) {
        this.actorKey = actorKey;
        this.itemId = itemId;
        this.fastForward = fastForward;
        this.resolved = false;
        this.outnumbered = false;
        this.surprised = false;
        this.autoSuccess = false;
        this.advantage = false;
        this.disadvantage = false;
        this.messageId = null;
        this.targetCard = null;
        this.rolled = false;
    }

    get actor(){
        return chatHelper.getActorFromKey( this.actorKey);
    }

    get item(){
        return this.actor.getOwnedItem( this.itemId);
    }

    get targets(){
        return [...game.user.targets];
    }

    get target(){
        return this.targets.pop();
    }

    get skills(){
        return this.actor.getWeaponSkills( this.itemId);
    }

    template = "systems/CoC7/templates/chat/combat/melee-initiator.html";

    async createChatCard(){
		const html = await renderTemplate(this.template, this);
		
		const speaker = ChatMessage.getSpeaker({actor: this.actor});
        if( this.actor.isToken) speaker.alias = this.actor.token.name;
        
        const user = this.actor.user ? this.actor.user : game.user;

		const chatMessage = await ChatMessage.create({
			user: user._id,
			speaker,
			content: html
        });
        
        return chatMessage;
    }

    async updateChatCard(){
        let html = await renderTemplate(this.template, this);

        const message = game.messages.get( this.messageId);

		message.update({ content: html }).then(msg => {
			ui.chat.updateMessage( msg, false);
			return msg;
		});
    }

    toggleFlag( flagName){
        const flag = flagName.includes('-') ? chatHelper.hyphenToCamelCase( flagName) : flagName;
        this[flag] = !this[flag];
    }


    async performSkillCheck( skillId = null, publish = false){
        const check = new CoC7Check();
        check.referenceMessageId = this.messageId;
        check.rollType= "opposed";
        check.side = "initiator";
        check.action = "attack";
        check.actor = this.actorKey;
        check.item = this.itemId;
        check.skillId = skillId;
        check.difficulty = CoC7Check.difficultyLevel.regular;
        check.diceModifier = 0;

        if( this.outnumbered) check.diceModifier += 1;
        if( this.surprised) check.diceModifier += 1;
        if( this.disadvantage) check.diceModifier -= 1;
        if( this.advantage) check.diceModifier += 1;

        check.roll();
        this.check = check;
        this.rolled = true;
        this.resolved = true;
        if( publish) check.toMessage();

        if( this.target){
            const target = new CoC7MeleeTarget( this.target.actor.tokenKey, this.messageId, this.fastForward);
            const message = await target.createChatCard();
            this.targetCard = message.id;
        }

        return check;
    }

    publishCheckResult( check = null){
        if( !check && !this.check) return null;

        if( check) this.check = check;
        this.roll = CoC7Roll.getFromCheck( this.check);
        this.rolled = true;

        this.roll.rollIcons = [];
        if( this.roll.critical){
            this.roll.rollColor = "goldenrod";
            this.roll.rollTitle = game.i18n.localize("CoC7.CriticalSuccess")
            for( let index = 0; index < 4; index++){
                this.roll.rollIcons.push( "medal");
            }
        } else if(  this.roll.fumble) {
            this.roll.rollColor = "darkred";
            this.roll.rollTitle = game.i18n.localize("CoC7.Fumble")
            for( let index = 0; index < 4; index++){
                this.roll.rollIcons.push( "spider");
            }
        }else if(  this.roll.success){
            this.roll.rollColor = "goldenrod";
            if( CoC7Check.successLevel.regular ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize("CoC7.RegularSuccess");
            if( CoC7Check.successLevel.hard ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize("CoC7.HardSuccess");
            if( CoC7Check.successLevel.extreme ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize("CoC7.ExtremeSuccess");
            for (let index = 0; index <  this.roll.successLevel; index++) {
                this.roll.rollIcons.push( "star");
            } 
        } else {
            this.roll.rollColor = "black"
            this.roll.rollTitle = game.i18n.localize("CoC7.Failure")
            this.roll.rollIcons.push( "skull");
        }

        this.updateChatCard();
    }

    static getFromCard( card){
        const initiator = new CoC7MeleeInitiator();
        chatHelper.getObjectFromElement( initiator, card);
        initiator.roll = CoC7Roll.getFromCard( card);
        
        if( card.closest('.message'))
            initiator.messageId = card.closest('.message').dataset.messageId;
        else initiator.messageId = null;
        return initiator;
    }

    static getFromMessageId( messageId){
        const message = game.messages.get( messageId);
        if( ! message) return null;
        const card = $(message.data.content)[0];

        const initiator = CoC7MeleeInitiator.getFromCard( card);
        initiator.messageId = messageId;

        return initiator;
    }
    
    static updateCardSwitch( event, publishUpdate = true){
        const card = event.currentTarget.closest(".melee.initiator");
        const flag = event.currentTarget.dataset.flag;
        const camelFlag = chatHelper.hyphenToCamelCase(flag);

        //update only for local player
        if( !publishUpdate){
            card.dataset[camelFlag] = "true" == card.dataset[camelFlag] ? false : true;
            event.currentTarget.classList.toggle('switched-on');
            event.currentTarget.dataset.selected = card.dataset[camelFlag];
        } else { //update card for all player
            const initiator = CoC7MeleeInitiator.getFromCard( card);
            initiator.toggleFlag(flag);
            initiator.updateChatCard();
        }
    }
}

export class CoC7MeleeTarget{
    constructor(actorKey, parentMessageId = null, fastForward = false) {
        this.actorKey = actorKey;
        this.parentMessageId = parentMessageId;
        this.fastForward = fastForward;
        this.resolved = false;

        this.outnumbered = false;
        this.surprised = false;
        this.autoSuccess = false;
        this.advantage = false;
        this.disadvantage = false;

        this.messageId = null;
        this.skillId = null;
        this.itemId = null;
        this.dodging = false;
        this.fightingBack = false;
        this.maneuvering = false;
    }

    get actor(){
        return chatHelper.getActorFromKey( this.actorKey);
    }

    get weapon(){
        return this.actor.getOwnedItem( this.itemId);
    }

    get skill(){
        return this.actor.getOwnedItem( this.skillId);
    }

    get actionSelected(){
        return this.dodging || this.fightingBack || this.maneuvering;
    }

    get action(){
        if( this.dodging) return "dodge";
        if( this.fightingBack) return "fightBack";
        if( this.maneuvering) return "maneuver";
        return null;
    }

    template = "systems/CoC7/templates/chat/combat/melee-target.html";

    static updateCardSwitch( event, publishUpdate = true){
        const card = event.currentTarget.closest(".melee.target");
        const flag = event.currentTarget.dataset.flag;
        const camelFlag = chatHelper.hyphenToCamelCase(flag);

        //update only for local player
        if( !publishUpdate){
            card.dataset[camelFlag] = "true" == card.dataset[camelFlag] ? false : true;
            event.currentTarget.classList.toggle('switched-on');
            event.currentTarget.dataset.selected = card.dataset[camelFlag];
        } else { //update card for all player
            const target = CoC7MeleeTarget.getFromCard( card);
            target.toggleFlag(flag);
            target.updateChatCard();
        }
    }

    toggleFlag( flagName){
        const flag = flagName.includes('-') ? chatHelper.hyphenToCamelCase( flagName) : flagName;
        this[flag] = !this[flag];
    }

    async createChatCard(){
		const html = await renderTemplate(this.template, this);
		
		const speaker = ChatMessage.getSpeaker({actor: this.actor});
        if( this.actor.isToken) speaker.alias = this.actor.token.name;
        
        const user = this.actor.user ? this.actor.user : game.user;

        const message = await ChatMessage.create({
			user: user._id,
			speaker,
			content: html
        });
        
        this.messageId = message.id;
        return message;
    }

    async updateChatCard(){
        let html = await renderTemplate(this.template, this);


        // const card = $(html)[0];
        // const testDiv = card.querySelector('div.test');
        // chatHelper.attachObjectToElement( this, testDiv);


        const message = game.messages.get( this.messageId);

		message.update({ content: html }).then(msg => {
			ui.chat.updateMessage( msg, false);
			return msg;
		});
    }

    async getUpdatedChatCard(){
        renderTemplate(this.template, this).then( html => {return html;});
    }

    static async updateSelected( card, event){
        const target = CoC7MeleeTarget.getFromCard( card);

        switch (event.currentTarget.dataset.action) {
            case "dodge":
                target.dodging = true;
                target.fightingBack = false;
                target.maneuvering = false;
                target.skillId = event.currentTarget.dataset.skillId;
                target.itemId = null;
                break;
        
            case "fightBack":
                target.dodging = false;
                target.fightingBack = true;
                target.maneuvering = false;
                target.skillId = event.currentTarget.dataset.skillId;
                target.itemId = event.currentTarget.dataset.weaponId;
                break;

            case "maneuver":
                target.dodging = false;
                target.fightingBack = false;
                target.maneuvering = true;
                target.skillId = event.currentTarget.dataset.skillId;
                target.itemId = null;
                break;

            default:
                break;
        }

        target.updateChatCard();

        return target;
    }

    async performSkillCheck( skillId = null, publish = false){
        const check = new CoC7Check();
        check.referenceMessageId = this.messageId;
        check.rollType= "opposed";
        check.side = "target";
        check.action = this.action;
        check.actor = this.actorKey;
        check.item = this.itemId;
        check.skillId = skillId;
        check.difficulty = CoC7Check.difficultyLevel.regular;
        check.diceModifier = 0;

        if( this.disadvantage) check.diceModifier -= 1;
        if( this.advantage) check.diceModifier += 1;

        check.roll();
        this.check = check;
        this.rolled = true;
        this.resolved = true;
        if( publish) check.toMessage();

        const initiator = CoC7MeleeInitiator.getFromMessageId( this.parentMessageId);

        return check;
    }

    publishCheckResult( check = null){
        if( !check && !this.check) return null;

        if( check) this.check = check;
        this.roll = CoC7Roll.getFromCheck( this.check);
        this.rolled = true;

        this.roll.rollIcons = [];
        if( this.roll.critical){
            this.roll.rollColor = "goldenrod";
            this.roll.rollTitle = game.i18n.localize("CoC7.CriticalSuccess")
            for( let index = 0; index < 4; index++){
                this.roll.rollIcons.push( "medal");
            }
        } else if(  this.roll.fumble) {
            this.roll.rollColor = "darkred";
            this.roll.rollTitle = game.i18n.localize("CoC7.Fumble")
            for( let index = 0; index < 4; index++){
                this.roll.rollIcons.push( "spider");
            }
        }else if(  this.roll.success){
            this.roll.rollColor = "goldenrod";
            if( CoC7Check.successLevel.regular ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize("CoC7.RegularSuccess");
            if( CoC7Check.successLevel.hard ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize("CoC7.HardSuccess");
            if( CoC7Check.successLevel.extreme ==  this.roll.successLevel )  this.roll.rollTitle = game.i18n.localize("CoC7.ExtremeSuccess");
            for (let index = 0; index <  this.roll.successLevel; index++) {
                this.roll.rollIcons.push( "star");
            } 
        } else {
            this.roll.rollColor = "black"
            this.roll.rollTitle = game.i18n.localize("CoC7.Failure")
            this.roll.rollIcons.push( "skull");
        }

        this.updateChatCard();
    }

    static getFromCard( card){
        const actorKey = card.dataset.actorKey;
        const parentMessageId = card.dataset.parentMessageId;
        const fastForward = "true" == card.dataset.fastForward;
        const target = new CoC7MeleeTarget( actorKey, parentMessageId, fastForward);
        
        target.roll = CoC7Roll.getFromCard( card);
        chatHelper.getObjectFromElement( target, card);

        target.messageId = card.closest(".message").dataset.messageId;
        return target;
    }
}

export class CoC7Roll{
    static getFromCard( card){

        const rollDiv = card.querySelector( 'div.dice-roll');
        if( !rollDiv) return null;

        const roll = new CoC7Roll();
        chatHelper.getObjectFromElement( roll, rollDiv);

        // roll.rollType = card.dataset.rollType;
        // roll.side = card.dataset.side;
        // roll.action = card.dataset.action;
        // roll.refMessageId = card.dataset.refMessageId;
        // roll.referenceMessageId = card.dataset.refMessageId;
        // roll.successLevel = parseInt( card.dataset.successLevel);
        // roll.difficulty = parseInt( card.dataset.difficulty);
        // roll.skillId = card.dataset.skillId;
        // roll.itemId = card.dataset.itemId;
        // roll.diceMod = card.dataset.diceMod;
        // roll.value = card.dataset.value;
        // roll.fumble = "true" == card.dataset.fumble;
        // roll.critical = "true" == card.dataset.critical;
        // roll.characteristic = card.dataset.characteristic;
        // roll.actorId = card.dataset.actorId;
        // roll.tokenId = card.dataset.tokenId;
        // roll.result = parseInt( card.dataset.result);

        // roll.actorKey = roll.tokenId ? roll.tokenId : roll.actorId;
    
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
		if (key.includes(".")) {
		const [sceneId, tokenId] = key.split(".");
		const scene = game.scenes.get(sceneId);
		if (!scene) return null;
		const tokenData = scene.getEmbeddedEntity("Token", tokenId);
		if (!tokenData) return null;
		const token = new Token(tokenData);
		return token.actor;
		}

		// Case 2 - use Actor ID directory
		return game.actors.get(key) || null;
    }

    static attachObjectToElement( object, element){
        Object.keys(object).forEach( prop => {
            element.dataset[prop]= object[prop];
        })    
    }

    static getObjectFromElement( object, element){
        Object.keys(element.dataset).forEach( prop => {
            if( "true" == element.dataset[prop]) object[prop] = true;
            else if ( "false" == element.dataset[prop]) object[prop] = false;
            else if( "template" != prop) object[prop] = element.dataset[prop]; //ignore template
        })    
    }
}