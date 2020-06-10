import { CoC7Item } from "./items/item.js";
import { CoCActor } from "./actors/actor.js"
import { COC7 } from './config.js'
import { CoC7Dice } from "./dice.js";

export class CoC7Check {

    constructor( actor = null, skill = null, item = null, diceMod = 0, difficulty = CoC7Check.difficulty.regular) {
        this.actor = actor;
        this.skill = skill;
        this.item = item;
        this.difficulty = difficulty;
        this.diceModifier = diceMod;
        this.succesThreshold = 0; //value needed for the check to succeed after difficulty is applied
        this.rawValue = 0; //value needed before difficulty
        this.passed = false; //did the check pass
    }

    static difficulty = {
        "regular": "regular",
        "hard": "hard",
        "extreme": "extreme"
    }

    static success = {
        failure: 0,
        regular: 1,
        hard: 2,
        extreme: 3
    }

    static push( card){
        const actorId = card.dataset.tokenId ? card.dataset.tokenId : card.dataset.actorId;
        const skillId = card.dataset.skillId;
        const itemId = card.dataset.itemId;
        const diceMod = card.dataset.diceMod;
        const diffculty = card.dataset.difficulty;

        const pushedRoll = new CoC7Check( actorId, skillId, itemId, diceMod, diffculty);
        pushedRoll.roll(); //Pushing only skill/item roll, not charac nor rawVal roll;
        pushedRoll.toMessage( true, card);
        // pushedRoll.
        
    }

    set actor(x)
    {
        if( x == null) {
            this._actor = x;
            return;
        }

        if( x instanceof Actor) {
            this._actor = x;
            this._actor.alias = this.actor.name;
            return;
        }

        if (x.includes(".")) {
			const [sceneId, tokenId] = x.split(".");
			const scene = game.scenes.get(sceneId);
			if (!scene) return;
			const tokenData = scene.getEmbeddedEntity("Token", tokenId);
            if (!tokenData) return;
            const token = new Token(tokenData);
            this._actor = token.actor;
            this._actor.alias = token.name;
            return;
        }
        
        this._actor = game.actors.get( x);
        this.actor.alias = this.actor.name;
    }

    set skill(x) { this._skill = this._getItemFromId( x); }
    set item(x) { this._item = this._getItemFromId( x); }

    _getItemFromId( x)
    {
        if( x == null) return null;
        if( x instanceof Item) return x;
        if( this._actor) return this._actor.getOwnedItem( x);
        return game.items.get( x);
    }

    get actor() { return this._actor; }
    get skill() { 
        if( !this._skill && this.item )
        {
            if( this.item.data.data.skill)
            {
                if( this.item.data.data.skill.main.id)
                {
                    this._skill = this._actor.getOwnedItem( this.item.data.data.skill.main.id);
                }
            }
        }
        return this._skill; 
    }

    get item() { return this._item; }


    roll( diceMod = null, difficulty = null) {
        if( diceMod ) this.diceModifier = diceMod;
        if( difficulty ) this.difficulty = difficulty;

        if( !this.skill) return null;

        this._perform();
        
    }


    rollCharacteristic( char, diceMod = null, difficulty = null)
    {
        if( diceMod ) this.diceModifier = diceMod;
        if( difficulty ) this.difficulty = difficulty;

        this.characteristic = char;
        this._perform();

    }

    rollAttribute( attrib, diceMod = null, difficulty = null){
        if( diceMod ) this.diceModifier = diceMod;
        if( difficulty ) this.difficulty = difficulty;

        this.attribute = attrib;
        this._perform();
    }

    rollValue( val, diceMod = null, difficulty = null){
        if( diceMod ) this.diceModifier = diceMod;
        if( difficulty ) this.difficulty = difficulty;

        this.rawValue = val;

        this._perform();
    }

    _perform()
    {
        this.dice = CoC7Dice.roll( this.diceModifier);
    }



    async toMessage( pushing = false)
    {
        const templateData = {
            actor: this.actor,
            skill: this.skill,
            item: this.item,
            value: this.rawValue,
            characteristic: this.characteristic,
            attribute: this.attribute,
            diceMod: this.diceModifier,
            difficulty: this.difficulty,
            tokenId: this.actor.tokenId,
            pushing: pushing
        };

        templateData.dices = {
            tens : [],
            unit : {
                value: this.dice.unit.total
            },
            total: this.dice.total,
            tenResult: this.dice.total - this.dice.unit.total,
            hasBonus: this.diceModifier == 0 ? false : true,
            // hasModifier: this.modifier == 0 ? false : true,
            bonus: Math.abs(this.diceModifier),
            bonusType: this.diceModifier < 0 ? "penalty" : "bonus",
            // modifier: this.modifer,
            difficulty: this.difficulty
        };


        let max = (this.dice.unit.total == 0)? 100 : 90;
        let min = (this.dice.unit.total == 0)? 10 : 0;
        let highest = this.dice.total - this.dice.unit.total;
    
        for( let i = 0; i < this.dice.tens.results.length; i++)
        {
            let die = {};
            die.value = this.dice.tens.results[i];
            if( die.value == max) die.isMax = true; else die.isMax = false;
            if( die.value == min) die.isMin = true; else die.isMin = false;
            if( die.value == highest){ highest = 101; die.selected = true;}
            // if( die.value == 100) die.value = "00";
            templateData.dices.tens.push( die);
        }

        templateData.tenOnlyOneDie = templateData.dices.tens.length == 1;

        //
        templateData.isValue = false;
        templateData.isCharactiristic = false;
        templateData.isSkill = false;
        templateData.isItem = false;
        templateData.isAttribute = false;
        if( this.actor == null){
            templateData.isValue = true;
        }
        else
        {
            if( this.characteristic){
                templateData.isCharactiristic = true;
                templateData.characteristic = this.characteristic;
                this.rawValue = this.actor.data.data.characteristics[this.characteristic].value;
            }

            if( this.skill){
                templateData.isSkill = true;
                this.rawValue = this.skill.data.data.value;
            }

            if( this.attribute){
                templateData.isAttribute = true;
                templateData.attribute = this.attribute;
                this.rowValue = this.actor.data.data.attribs[this.attribute].value;

            }

        }

        if( this.dice.total <= this.rawValue) templateData.resultType = "Regular success";
        if( this.dice.total <= Math.floor(this.rawValue / 2)) templateData.resultType = "Hard success";
        if( this.dice.total <= Math.floor(this.rawValue / 5)) templateData.resultType = "Extreme success";
        if( this.dice.total > this.rawValue) templateData.resultType = "Failure";
        const fumble = this.rawValue <= 50 ? 96 : 100;

        switch( this.difficulty)
        {
            case CoC7Check.difficulty.extreme:
                this.succesThreshold = Math.floor( this.rawValue / 5);
                break;
            case CoC7Check.difficulty.hard:
                this.succesThreshold = Math.floor( this.rawValue / 2);
                break;
            default:
                this.succesThreshold = this.rawValue;
        }



        this.passed = this.succesThreshold >= this.dice.total ? true : false;
        if (this.dice.total == 1) this.passed = true; // 1 is always a success
        templateData.isSuccess = this.passed;

        templateData.isFumble = this.dice.total >= fumble;
        templateData.isCritical = this.dice.total == 1;
        templateData.hasMalfunction = false;
        if( this.item)
        {
            templateData.isItem = true;
            if( this.item.data.data.malfunction) {
                if( this.dice.total >= this.item.data.data.malfunction) templateData.hasMalfunction = true;
                templateData.itemName = this.item.name;
            }
        }
        templateData.difficulty = this.difficulty;
        templateData.canBePushed = this.skill ? this.skill.canBePushed() : false;
        
        if( !this.passed) {
            if( this.skill){
                let luckNeeded = this.dice.total - this.succesThreshold;
                if( this.actor.luck > luckNeeded){
                    templateData.hasEnoughLuck = true;
                    templateData.luckNeeded = luckNeeded;
                }
            }
        }

        const template = 'systems/CoC7/templates/chat/roll-result.html';
        const html = await renderTemplate(template, templateData);
        let flavor;
        if( this.actor){
            if( this.skill ) flavor = `${this.skill.name} check (${this.skill.data.data.value}%) - ${this.difficulty} diffculty`; 
            if( this.item ) flavor = `${this.item.name} : ${this.skill.name} check (${this.skill.data.data.value}%) - ${this.difficulty} diffculty`;
            if( this.characteristic) flavor = `${this.actor.data.data.characteristics[this.characteristic].label} check (${this.actor.data.data.characteristics[this.characteristic].value}) - ${this.difficulty} diffculty`;
            if( this.attribute) flavor = `${this.actor.data.data.attribs[this.attribute].label} check (${this.actor.data.data.attribs[this.attribute].value}) - ${this.difficulty} diffculty`;
        }
        else {
            if( this.rawValue) flavor = `(${this.rawValue}%) - ${this.difficulty} diffculty`;
        }

        if( pushing) {
            flavor = 'Pushing : ' + flavor;
        }

        let speaker;
        if( this.actor){
            speaker = ChatMessage.getSpeaker({actor: this.actor});
            speaker.alias = this.actor.alias;
        }
        else speaker = ChatMessage.getSpeaker();

        const message = await ChatMessage.create({
			user: game.user._id,
            speaker: speaker,
            flavor: flavor,
			content: html
        });

        AudioHelper.play({src: CONFIG.sounds.dice});

    }

}