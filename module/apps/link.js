import { CoC7LinkCreationDialog } from './link-creation-dialog.js';

export class CoC7Link{
	constructor( data = {}){
		this._linkData = {};
		this.data = data;
	}


	static async create( option){
		return await CoC7LinkCreationDialog.create( option);
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

	get data(){
		const data = duplicate( this._linkData);
		data.isCheck = this.is.check;
		data.isSanloss = this.is.sanloss;
		data.isItem = this.is.item;
		return data;
	}

	set data(x){
		// this._linkData = x;
		this._linkData.forceModifiers = false;
		if( x.check ) this.type = x.check; else this.type = CoC7Link.LINK_TYPE.CHECK; //check, sanloss, item
		if( x.type) this.check = x.type;  //attrib, charac, skill
		else if( this.type) this.check = CoC7Link.CHECK_TYPE.CHARACTERISTIC;
		
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

		if( x.difficulty || !isNaN( Number(x.difficulty))) this._linkData.difficulty =  Number(x.difficulty);
		if( x.modifier || !isNaN( Number(x.modifier))) this._linkData.modifier =  Number(x.modifier);
		if( 'true' == x.displayName || true == x.displayName) this._linkData.displayName = true;
		if( x.label){
			this._linkData.hasLabel = true;
			this._linkData.label = x.label;
		}
		if( x.icon){
			this._linkData.hasIcon = true;
			this._linkData.icon = x.icon;
		}
		if( undefined != x.difficulty || undefined != x.modifier) this._linkData.forceModifiers = true;
		if( 'true' == x.blind || true == x.blind) this._linkData.blind = true;
		this._linkData.sanMin = x.sanMin;
		this._linkData.sanMax = x.sanMax;
		if( x.icon){
			this._linkData.hasIcon = true;
			this._linkData.icon = x.icon;
		}
	}

	get type(){
		return this._linkData.type;
	}

	get checkType(){
		switch (this.type) {
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

	// set name(x){
	// 	this._linkData.name = x;
	// }

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

	update( updateData){
		this._linkData = mergeObject( this._linkData, updateData);
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
			if( this._linkData.pack) options += `,pack:${data.pack}`;
			if( this._linkData.id) options += `,id:${this._linkData.id}`;

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
			if( !data.type || !data.name) return null;
			let options = `${data.blind?'blind,':''}type:${data.type},name:${data.name}`;
			if( data.icon) options += `,icon:${data.icon}`;

			//TODO: Check if needed
			if( data.pack) options += `,pack:${data.pack}`;
			if( data.id) options += `,id:${data.id}`;

			let link = `@coc7.item[${options}]`;
			if( data.displayName) link += `{${data.displayName}}`;
			return link;
		}

		default:
			return null;
		}
	}

}