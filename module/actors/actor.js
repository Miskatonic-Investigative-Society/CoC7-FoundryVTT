
import { COC7 } from '../config.js'

/**
 * Extend the base Actor class to implement additional logic specialized for CoC 7th.
 */
export class CoCActor extends Actor {

  constructor(...args) {
    super(...args);
  }


  initialize() {
    super.initialize();
    this.creatureInit();
  }


  /**
   * Early version on templates did not include possibility of auto calc
   * Just check if auto is indefined, in which case it will be set to true
   */
  checkUndefinedAuto(){
    let returnData = {};
    if( this.data.data.attribs.hp.auto === undefined) returnData["attribs.hp.auto"] = true;
    if( this.data.data.attribs.mp.auto === undefined) returnData["attribs.mp.auto"] = true;
    if( this.data.data.attribs.san.auto === undefined) returnData["attribs.san.auto"] = true;
    if( this.data.data.attribs.mov.auto === undefined) returnData["attribs.mov.auto"] = true;
    if( this.data.data.attribs.db.auto === undefined) returnData["attribs.db.auto"] = true;
    if( this.data.data.attribs.build.auto === undefined) returnData["attribs.build.auto"] = true;
    
    return returnData;

  }

  /** @override */
  async createSkill( skillName, value, showSheet = false){
    const data = {  
      name: skillName,
      type: "skill",
      data: { 
        "value": value,
        properties: {
          special: false,
          rarity: false,
          push: true,
          combat: false,
          shortlist: false //TODO: necessary ?
        }
      }
    };
    const created = await this.createEmbeddedEntity("OwnedItem", data, { renderSheet: showSheet});
    return created;
  }

  /**
   * Initialize a creature with minimums skills
   */
  async creatureInit( ){
    if( this.data.type != "creature") return;
    if( this.getActorFlag("initialized")) return; //Change to return skill ?

    //Check if fighting skills exists, if not create it and the associated attack.
    const skills = await this.getSkillsByName( COC7.baseCreatureSkill);
    if( skills.length == 0){
      //Creating natural attack skill
      try{
        const skill = await this.createEmbeddedEntity(
          "OwnedItem",
          {
            name: COC7.baseCreatureSkill,
            type: "skill",
            data:{
              base: 0,
              value: null,
              properties: {
                combat: true,
              },
              flags: {}
            }
          }, { renderSheet: false});
          
        const attack = await this.createEmbeddedEntity(
          "OwnedItem",
          {
            name: "Innate attack",
            type: "weapon",
            data: {
              description: {
                value: "Creature's natural attack",
                chat: "Creature's natural attack",
              },
              wpnType: "innate",
              properties: {
                "addb": true,
                "slnt": true
              }
            }
          }, { renderSheet: false});


        const createdAttack = this.getOwnedItem( attack._id);
        await createdAttack.update( 
          { "data.skill.main.id": skill._id,
            "data.skill.main.name": skill.name });

        // const fightingSkill = await this.getSkillsByName( COC7.baseCreatureSkill);
        // const innateAttack = await this.getItemsByName("Innate attack");
        

        // console.log("*****************************************************************");
        // console.log("*********************Skill created*******************************");
        // console.log("********************* fightingSkill " + fightingSkill[0].name + "**********************************");
        // console.log("********************* fightingSkill " + fightingSkill[0].id + "**********************************");
        // if( skills != null && skills.length != 0){
        //   console.log("********************* skills " + skills[0].name + "**********************************");
        //   console.log("********************* skills " + skills[0]._id + "**********************************");
        // }
        // else
        // console.log("********************* skills is null **********************************");


        // if( skill != null){
        //   console.log("********************* skill " + skill.name + "**********************************");
        //   console.log("********************* skill " + skill._id + "**********************************");
        // }
        // else
        // console.log("********************* skill is null **********************************");

        // console.log("*****************************************************************");
        



      }
      catch(err){
        console.log("error");
      }

      console.log( "Skill created");

      //Creating corresponding weapon.
    }
  }

  async createItem( itemName, quantity = 1, showSheet = false){
    const data = {  
      name: itemName,
      type: "item",
      data: { 
        "quantity": quantity
      }
    };
    const created = await this.createEmbeddedEntity("OwnedItem", data, { renderSheet: showSheet});
    return created;
  }

  async createEmptySkill( event = null){
    let showSheet = event ?  !event.shiftKey: true;
    if( !this.getItemIdByName(COC7.newSkillName)) return this.createSkill( COC7.newSkillName, null, showSheet);
    let index=0;
    let skillName = COC7.newSkillName + " " + index;
    while( this.getItemIdByName(skillName)){
      index++;
      skillName = COC7.newSkillName  + " " + index;
    }

    return this.createSkill( skillName, null, showSheet);
  }

  async createEmptyItem( event = null){
    let showSheet = event ?  !event.shiftKey: true;
    if( !this.getItemIdByName(COC7.newItemName)) return this.createItem( COC7.newItemName, 1, showSheet);
    let index=0;
    let itemName = COC7.newItemName + " " + index;
    while( this.getItemIdByName(itemName)){
      index++;
      itemName = COC7.newItemName  + " " + index;
    }

    return this.createItem( itemName, 1, showSheet);
  }

  async createEmptyWeapon( event = null){
    let showSheet = event ?  !event.shiftKey: true;
    let weaponName = COC7.newWeaponName;
    if( this.getItemIdByName(COC7.newWeaponName)) {
      let index=0;
      weaponName = COC7.newWeaponName + " " + index;
      while( this.getItemIdByName(weaponName)){
        index++;
        weaponName = COC7.newWeaponName  + " " + index;
      }
    }

    const data = {  
      name: weaponName,
      type: "weapon",
      data : {
        properties: {}
      }
    }

    for( let [key, value] of Object.entries(COC7["weaponProperties"]))
    {
      data.data.properties[key] = false;
    }



    await this.createEmbeddedEntity("OwnedItem", data, { renderSheet: showSheet});
  }

  

  /**
   * Create an item for that actor.
   * If it's a skill first check if the skill is already owned. If it is don't create a second time.
   * Fill the value of the skill with base or try to evaluate the formula.
   * @param {*} embeddedName 
   * @param {*} data 
   * @param {*} options 
   */
  async createEmbeddedEntity(embeddedName, data, options){
    switch( data.type){
      case( "skill"):
        if( data.data.base){
          if( data.data.base != data.data.value) {
            data.data.value = data.data.base;
          }
        }

        if( isNaN(Number(data.data.value)) ) {
          let value;
          try{
            value = eval(this.parseFormula( data.data.value));
          }
          catch(err){
            value = null;
          }
          if( value) data.data.value = Math.floor(value);
        }

        if( !this.getItemIdByName(data.name))
        {
          return super.createEmbeddedEntity(embeddedName, data, options);
        } 
        return null;
        
      default:
        return super.createEmbeddedEntity(embeddedName, data, options);
    }
  }

  // getSkillIdByName( skillName){
  //   let id = null;
  //    this.items.forEach( (value, key, map) => {
  //     if( value.name == skillName) id = value.id;
  //   });

  //   return id;
  // }

  getItemIdByName( itemName){
    let id = null;
     this.items.forEach( (value, key, map) => {
      if( value.name == itemName) id = value.id;
    });

    return id;
  }

  getItemsByName( itemName){
    let itemList = [];
    this.items.forEach( (value, key, map) => {
     if( value.name == itemName) itemList.push( value);
   });

   return itemList;
  }

  /**
   * 
   * 
   */
  getSkillsByName( skillName){
    let skillList = [];
    this.items.forEach( (value, key, map) => {
      if( value.name == skillName && value.type == "skill") skillList.push( value);
    });

    return skillList;
  }


  parseFormula( formula){
    let parsedFormula = formula;
    for( let [key, value] of Object.entries(COC7.formula.actor)){
      parsedFormula = parsedFormula.replace( key, value)
    }
    return parsedFormula;
  }

  get luck(){
    return parseInt(this.data.data.attribs.lck.value);
  }

  async setLuck( value){
    // this.data.data.attribs.lck.value = value;
    // let test = await this.update( { "data.attribs.lck.value": value});
    return this.update( { "data.attribs.lck.value": value});
  }

  async spendLuck( amount){
    amount = parseInt( amount);
    if( !(this.luck >= amount)) return false;
    return this.setLuck( this.luck - amount);
  }

  get hp(){
    return parseInt(this.data.data.attribs.hp.value);
  }

  get hpMax(){
    if( this.data.data.attribs.hp.auto){
      if(this.data.data.characteristics.siz.value != null &&  this.data.data.characteristics.con.value !=null)
        return Math.floor( (this.data.data.characteristics.siz.value + this.data.data.characteristics.con.value)/10);
      else return null;
    } 
    return parseInt( this.data.data.attribs.hp.max);
  }

  async setHp( value){
    // this.data.data.attribs.lck.value = value;
    // let test = await this.update( { "data.attribs.lck.value": value});
    if( value < 0) value = 0;
    if( value > this.hpMax) value = parseInt( this.data.data.attribs.hp.value);
    return this.update( { "data.attribs.hp.value": value});
  }

  get mp(){
    return parseInt(this.data.data.attribs.mp.value);
  }

  get mpMax(){
    if( this.data.data.attribs.mp.auto){
      if(this.data.data.characteristics.pow.value != null)
        return Math.floor( this.data.data.characteristics.pow.value / 5);
      else return null;
    } 
    return parseInt( this.data.data.attribs.mp.max);
  }

  async setMp( value){
    // this.data.data.attribs.lck.value = value;
    // let test = await this.update( { "data.attribs.lck.value": value});
    if( value < 0) value = 0;
    if( value > parseInt( this.mpMax)) value = parseInt( this.data.data.attribs.mp.value);
    return this.update( { "data.attribs.mp.value": value});
  }


  get san(){
    return parseInt(this.data.data.attribs.san.value);
  }

  async setSan( value){
    // this.data.data.attribs.lck.value = value;
    // let test = await this.update( { "data.attribs.lck.value": value});
    if( value < 0) value = 0;
    if( value > parseInt( this.data.data.attribs.san.max)) value = parseInt( this.data.data.attribs.san.value);
    return this.update( { "data.attribs.san.value": value});
  }

  async setAttrib( value, attrib){
    if( value < 0) value = 0;
    if( value > parseInt( this.data.data.attribs[attrib].max)) value = parseInt( this.data.data.attribs[attrib].value);
    // const update = { `data.attribs[${attrib}].value`: value};
    // return this.update( { data.attribs[attrib].value: value});
  }

  async setAttribAuto( value, attrib){
    const updatedKey = `data.attribs.${attrib}.auto`
    return await this.update( {[updatedKey]: value});
  }

  async toggleAttribAuto( attrib){
    this.setAttribAuto( !this.data.data.attribs[attrib].auto, attrib);
  }

  get build() {
    if( this.data.data.attribs.build.auto)
		{
      const sum = this.data.data.characteristics.str.value + this.data.data.characteristics.siz.value;
			if( sum > 164) return Math.floor( (sum - 45) / 80) + 1;
			if( sum < 65) return -2;
			if( sum < 85) return -1;
			if( sum < 125) return 0;
      if( sum < 165) return 1;
    }

    return this.data.data.attribs.build.value;
  }

  get db() {
		if( this.data.data.attribs.db.auto)
		{
      const sum = this.data.data.characteristics.str.value + this.data.data.characteristics.siz.value;
			if( sum > 164) return `${Math.floor( (sum - 45) / 80)}D6`;
      if( sum  < 65) return -2;
      if( sum < 85) return -1;
			if( sum < 125) return 0;
			if( sum < 165) return "1D4";
		}
    return this.data.data.attribs.db.value;
  }

  get mov() {
    if( this.data.data.attribs.mov.auto)
		{
      let MOV;
			if( this.data.data.characteristics.dex.value < this.data.data.characteristics.siz.value && this.data.data.characteristics.str.value < this.data.data.characteristics.siz.value) MOV = 	7;
			if( this.data.data.characteristics.dex.value >= this.data.data.characteristics.siz.value || this.data.data.characteristics.str.value >= this.data.data.characteristics.siz.value) MOV = 8;
			if( this.data.data.characteristics.dex.value >= this.data.data.characteristics.siz.value && this.data.data.characteristics.str.value >= this.data.data.characteristics.siz.value) MOV = 9;
			if( this.data.data.type != "creature"){
				if( !isNaN(parseInt(this.data.data.infos.age))) MOV = parseInt(this.data.data.infos.age) >= 40? MOV - Math.floor( parseInt(this.data.data.infos.age) / 10) + 3: MOV;
			}
			return MOV;
    }
    return this.data.data.attribs.mov.value;
  }


  get tokenId()
  {
    return this.token ? `${this.token.scene._id}.${this.token.id}` : null;
  }

  get locked(){
    if( !this.data.data.flags){
      this.data.data.flags = {};
      this.data.data.flags.locked = true; //Locked by default
      this.update( { "data.flags": {}});
      this.update( { "data.flags.locked": false});
    }

    return this.data.data.flags.locked;
  }

  set locked( value){
    this.update( { "data.flags.locked": value});
  }

  async toggleFlag( flagName){
    const flagValue =  this.data.data.flags[flagName] ? false: true;
    const name = `data.flags.${flagName}`
    let foo = await this.update( { [name]: flagValue});
  }

  getActorFlag( flagName){
    if( !this.data.data.flags){
      this.data.data.flags = {};
      this.data.data.flags.locked = true;
      this.update( { "data.flags": {}});
      return false;
    }

    return this.data.data.flags[flagName];
  }

  /**
   * Use the formula if available to roll some characteritics.
   */
  async rollCharacteristicsValue(){
    let characteristics={};
    for (let [key, value] of Object.entries(this.data.data.characteristics)) {
      let r = new Roll( value.formula);
      r.roll();
      if( r.total){
        characteristics[`data.characteristics.${key}.value`] = r.total;
      }
    }

    await this.update( characteristics);
  }

  async toggleStatus(statusName){
    let statusValue = this.data.data.status[statusName].value;
    if(!(typeof statusValue === "boolean")) statusValue = statusValue === "false" ? true : false; //Necessary, incorrect template initialization
    await this.update( {[`data.status.${statusName}.value`]: !statusValue})
  }

  getFightingSkills(){
    let skillList = [];
    this.items.forEach( (value) => {
      if( value.type == "skill" && value.data.data.properties.fighting ) skillList.push( value);
    });

    skillList.sort( (a, b) => {
      if ( a.name.toLowerCase() < b.name.toLowerCase() ){
        return -1;
      }
      if ( a.name.toLowerCase() > b.name.toLowerCase() ){
        return 1;
      }
      return 0;
    });

    return skillList;
  }

  getCloseCombatWeapons(){
    let weaponList = [];
    this.items.forEach( (value) => {
      if( value.type == "weapon" && !value.data.data.properties.rngd ){
        const skill = this.getOwnedItem( value.data.data.skill.main.id);
        value.data.data.skill.main.value = skill? skill.data.data.value : 0;
        weaponList.push( value);
      }
    });

    weaponList.sort( (a, b) => {
      if ( a.name.toLowerCase() < b.name.toLowerCase() ){
        return -1;
      }
      if ( a.name.toLowerCase() > b.name.toLowerCase() ){
        return 1;
      }
      return 0;
    });

    return weaponList;
  }

  getFirearmSkills(){
    let skillList = [];
    this.items.forEach( (value) => {
      if( value.type == "skill" && value.data.data.properties.firearms ) skillList.push( value);
    });

    skillList.sort( (a, b) => {
      if ( a.name.toLowerCase() < b.name.toLowerCase() ){
        return -1;
      }
      if ( a.name.toLowerCase() > b.name.toLowerCase() ){
        return 1;
      }
      return 0;
    });

    return skillList;
  }

  getDodgeSkill(){
    let skillList = this.getSkillsByName( COC7.dodgeSkillName);
    if( skillList.legnth != 0) return skillList[0];
    return null;
  }

  getAllSkills(){
    let skillList = [];
    this.items.forEach( (value, key, map) => {
      if( value.type == "skill" ) skillList.push( value);
    });

    skillList.sort( (a, b) => {
      if ( a.name.toLowerCase() < b.name.toLowerCase() ){
        return -1;
      }
      if ( a.name.toLowerCase() > b.name.toLowerCase() ){
        return 1;
      }
      return 0;
    });

    return skillList;
  }
}