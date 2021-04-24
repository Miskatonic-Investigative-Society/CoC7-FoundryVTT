import { chatHelper } from '../chat/helper.js';

export class CoC7Link{
	constructor(){
		this._linkData = {
			type: CoC7Link.LINK_TYPE.CHECK,
			check: CoC7Link.CHECK_TYPE.SKILL
		};
	}

	static async fromData( linkData){
		const link = new CoC7Link();
		await link.setData( linkData);
		return link;
	}

	static TYPE_KEYWORD = ['check', 'sanloss', 'item'];
	static CHARAC_KEYWORD = ['charac', 'char', 'characteristic', 'characteristics'];
	static ATTRIB_KEYWORD = ['attributes', 'attribute', 'attrib', 'attribs'];
	static SKILL_KEYWORD = ['skill'];

	static LINK_TYPE = {
		CHECK: 1,
		SANLOSS: 2,
		ITEM: 3
	}

	static CHECK_TYPE = {
		CHARACTERISTIC: 1,
		ATTRIBUTE: 2,
		SKILL: 3
	}

	get actor(){
		if( this.actorKey){
			return chatHelper.getActorFromKey( this.actorKey);//REFACTORING (2)
		}
		return null;
	}

	get data(){
		const data = duplicate( this._linkData);
		data.isCheck = this.is.check;
		data.isSanloss = this.is.sanloss;
		data.isItem = this.is.item;
		return data;
	}

	async fetchItem(){
		this._linkData.validItem = false;
		if( !this._linkData.fromCompendium && !this._linkData.fromDirectory){
			this._item = undefined;
			return false;
		}

		if (this._linkData.fromCompendium) {
			const pack = game.packs.get(this._linkData.pack);
			if( !pack) return false;
			if (pack.metadata.entity !== 'Item') return undefined;
			this._item = await pack.getEntity(this._linkData.id);
		}

		if( this._linkData.fromDirectory){
			this._item = game.items.get(this._linkData.id);
		}

		this._linkData.skillName = null;
		this._linkData.itemName = null;

		if( this._item){
			if( 'weapon' == this._item.data.type ) {
				this.type = CoC7Link.LINK_TYPE.ITEM;
				this._linkData.itemName = this._item.data.name;
				this._linkData.validItem = true;
				return true;
			}
	
			if( 'skill' == this._item.data.type){
				this.type = CoC7Link.LINK_TYPE.CHECK;
				this.check = CoC7Link.CHECK_TYPE.SKILL;
				this._linkData.skillName = this._item.data.name;
				this._linkData.validItem = true;
				return true;
			}
		}
		return false;
	}

	async setData(x){
		// this._linkData = x;
		// this._linkData.forceModifiers = false;
		this._linkData.fromCompendium = false;
		this._linkData.fromDirectory = false;
		this.hasPlayerOwner = false;

		if( x.hasPlayerOwner){
			this.hasPlayerOwner = true;
			this.actorKey = x.actorKey;
		}

		//Retrieve item
		if( x.pack && x.id){
			this._linkData.fromCompendium = true;
			this._linkData.pack = x.pack;
			this._linkData.id = x.id;
		}

		if( x.id && !x.pack){
			this._linkData.fromDirectory = true;
			this._linkData.id = x.id;
		}

		const linkSet = await this.fetchItem();

		if( !linkSet) {
		//Link definition
			if( x.check ) this.type = x.check; else this.type = CoC7Link.LINK_TYPE.CHECK; //check, sanloss, item
			if( x.type) this.check = x.type;  //attrib, charac, skill
			else if( this.type) this.check = CoC7Link.CHECK_TYPE.CHARACTERISTIC;
		
			//Link name
			if( x.name){
				this._linkData.itemName = null;
				this._linkData.skillName = null;
				this._linkData.characteristicKey = null;
				this._linkData.attributeKey = null;
				if( this.is.check){
					switch (this.check) {
					case CoC7Link.CHECK_TYPE.SKILL:
						this._linkData.skillName = x.name;						
						break;
					case CoC7Link.CHECK_TYPE.CHARACTERISTIC:
						this._linkData.characteristicKey = x.name;						
						break;
					case CoC7Link.CHECK_TYPE.ATTRIBUTE:
						this._linkData.attributeKey = x.name;						
						break;					
					default:
						break;
					}
				} else if( this.is.item) this._linkData.itemName = x.name;
			}
		}

		//Modifiers
		if( x.difficulty || !isNaN( Number(x.difficulty))) this._linkData.difficulty =  Number(x.difficulty);
		if( x.modifier || !isNaN( Number(x.modifier))) this._linkData.modifier =  Number(x.modifier);
		if( undefined != x.difficulty || undefined != x.modifier) this._linkData.forceModifiers = true;
		if( x.forceModifiers) this._linkData.forceModifiers = true;

		//Force displayed name
		if( 'true' == x.displayName || true == x.displayName) this._linkData.displayName = true;
		if( x.label){
			this._linkData.hasLabel = true;
			this._linkData.label = x.label;
		}

		//Icon
		if( x.icon){
			this._linkData.hasIcon = true;
			this._linkData.icon = x.icon;
		}

		//Blind
		if( 'true' == x.blind || true == x.blind) this._linkData.blind = true;

		//San Data
		this._linkData.sanMin = x.sanMin;
		this._linkData.sanMax = x.sanMax;
	}

	get type(){
		return this._linkData.type;
	}

	get checkType(){
		switch (this.check) {
		case CoC7Link.CHECK_TYPE.CHARACTERISTIC:
			return 'characteristic';
		case CoC7Link.CHECK_TYPE.ATTRIBUTE:
			return 'attribute';
		case CoC7Link.CHECK_TYPE.SKILL:
			return 'skill';
		default:
			return undefined;
		}
	}

	set type(x){
		if( !isNaN(Number(x))) this._linkData.type = x;
		else{
			switch (x.toLowerCase()) {
			case 'check':
				this._linkData.type = CoC7Link.LINK_TYPE.CHECK;
				break;
			case 'sanloss':
				this._linkData.type = CoC7Link.LINK_TYPE.SANLOSS;
				break;
			case 'item':
				this._linkData.type = CoC7Link.LINK_TYPE.ITEM;
				break;
			default:
				this._linkData.type = undefined;
				break;
			}
		}
	}

	get check(){
		return !isNaN(Number(this._linkData.check))? Number(this._linkData.check): undefined;
	}

	set check(x){
		if( !isNaN(Number(x))) this._linkData.check = Number(x);
		else{
			this._linkData.check = undefined;
			if( CoC7Link.CHARAC_KEYWORD.includes(x)) { this.type = CoC7Link.LINK_TYPE.CHECK; this._linkData.check = CoC7Link.CHECK_TYPE.CHARACTERISTIC;}
			if( CoC7Link.ATTRIB_KEYWORD.includes(x)) { this.type = CoC7Link.LINK_TYPE.CHECK; this._linkData.check = CoC7Link.CHECK_TYPE.ATTRIBUTE;}
			if( CoC7Link.SKILL_KEYWORD.includes(x)) { this.type = CoC7Link.LINK_TYPE.CHECK; this._linkData.check = CoC7Link.CHECK_TYPE.SKILL;}
		}
	}

	get name(){
		if( this.is.check){
			switch (this.check) {
			case CoC7Link.CHECK_TYPE.CHARACTERISTIC:
				return this._linkData.characteristicKey;
			case CoC7Link.CHECK_TYPE.ATTRIBUTE:
				return this._linkData.attributeKey;
			case CoC7Link.CHECK_TYPE.SKILL:
				return this._linkData.skillName;
						
			default:
				return undefined;
			}

		} else if( this.is.item) return this._linkData.itemName;
		return undefined;
	}

	set name(x){
		if( this.is.check){
			switch (this.check) {
			case CoC7Link.CHECK_TYPE.CHARACTERISTIC:
				this._linkData.characteristicKey = x;
				break;
			case CoC7Link.CHECK_TYPE.ATTRIBUTE:
				this._linkData.attributeKey = x;
				break;
			case CoC7Link.CHECK_TYPE.SKILL:
				this._linkData.skillName = x;
				break;
						
			default:
				break;
			}

		} else if( this.is.item) this._linkData.itemName = x;
	}

	get is(){
		const link = this;
		return {
			get check() { return link.type == CoC7Link.LINK_TYPE.CHECK;},
			set check(x) { if(true == x) link.type = CoC7Link.LINK_TYPE.CHECK;},
			get sanloss() { return link.type == CoC7Link.LINK_TYPE.SANLOSS;},
			set sanloss(x) { if(true == x) link.type = CoC7Link.LINK_TYPE.SANLOSS;},
			get item() { return link.type == CoC7Link.LINK_TYPE.ITEM;},
			set item(x) { if(true == x) link.type = CoC7Link.LINK_TYPE.ITEM;}
		};
	}

	async update( updateData){
		this._linkData = mergeObject( this._linkData, updateData);
		if( this._linkData.fromDirectory || this._linkData.fromCompendium) await this.fetchItem();
	}

	async updateFromLink(linkData){
		await this.setData( linkData);
		if( this._linkData.fromDirectory || this._linkData.fromCompendium) await this.fetchItem();
	}

	get link(){
		if( !this.type) return null;
		switch (this.type) {
		case CoC7Link.LINK_TYPE.CHECK:{
			// @coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
			if( !this.type || !this.name) return null;
			let options = `${this._linkData.blind?'blind,':''}type:${this.checkType},name:${this.name}`;
			if( undefined != this._linkData.difficulty) options += `,difficulty:${this._linkData.difficulty}`;
			if( undefined != this._linkData.modifier) options += `,modifier:${this._linkData.modifier}`;
			if( this._linkData.icon) options += `,icon:${this._linkData.icon}`;

			//TODO: Check if needed
			if( this._linkData.fromCompendium) options += `,pack:${data.pack}`;
			if( this._linkData.fromCompendium || this._linkData.fromDirectory) options += `,id:${this._linkData.id}`;

			let link = `@coc7.check[${options}]`;
			if( this._linkData.hasLabel) link += `{${this._linkData.label}}`;
			return link;
		}
			
		case CoC7Link.LINK_TYPE.SANLOSS:{
			//@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
			if( !this._linkData.sanMax || !this._linkData.sanMin) return null;

			//TODO : Blind SAN test ??
			//let options = `${this._linkData.blind?'blind,':''}sanMax:${this._linkData.sanMax},sanMin:${this._linkData.sanMin}`;
			let options = `sanMax:${this._linkData.sanMax},sanMin:${this._linkData.sanMin}`;

			if( this._linkData.difficulty) options += `,difficulty:${this._linkData.difficulty}`;
			if( this._linkData.modifier) options += `,modifier:${this._linkData.modifier}`;
			if( this._linkData.icon) options += `,icon:${this._linkData.icon}`;
			let link = `@coc7.sanloss[${options}]`;
			if( this._linkData.hasLabel) link += `{${this._linkData.label}}`;
			return link;
		}
				
		//Do we need that ???
		case CoC7Link.LINK_TYPE.ITEM:{
			// @coc7.item[type:optional,name:Shotgun,difficulty:+,modifier:-1]{Hard Shitgun check(-1)}
			if( !this.type || !this.name) return null;
			let options = `name:${this.name}`;
			if( this._linkData.icon) options += `,icon:${this._linkData.icon}`;

			//TODO: Check if needed
			if( this._linkData.fromCompendium) options += `,pack:${data.pack}`;
			if( this._linkData.fromCompendium || this._linkData.fromDirectory) options += `,id:${this._linkData.id}`;

			let link = `@coc7.item[${options}]`;
			if( this._linkData.hasLabel) link += `{${this._linkData.label}}`;
			return link;
		}

		default:
			return null;
		}
	}

}