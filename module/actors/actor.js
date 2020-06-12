
import { COC7 } from '../config.js'

/**
 * Extend the base Actor class to implement additional logic specialized for CoC 7th.
 */
export class CoCActor extends Actor {

  constructor(...args) {
    super(...args);
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
          shortlist: false
        }
      }
    };
    const created = await this.createEmbeddedEntity("OwnedItem", data, { renderSheet: showSheet});
    return created;
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

  async setHp( value){
    // this.data.data.attribs.lck.value = value;
    // let test = await this.update( { "data.attribs.lck.value": value});
    if( value < 0) value = 0;
    if( value > parseInt( this.data.data.attribs.hp.max)) value = parseInt( this.data.data.attribs.hp.value);
    return this.update( { "data.attribs.hp.value": value});
  }

  get mp(){
    return parseInt(this.data.data.attribs.mp.value);
  }

  async setMp( value){
    // this.data.data.attribs.lck.value = value;
    // let test = await this.update( { "data.attribs.lck.value": value});
    if( value < 0) value = 0;
    if( value > parseInt( this.data.data.attribs.mp.max)) value = parseInt( this.data.data.attribs.mp.value);
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

  async setAttrib( value, attrib)
  {
    if( value < 0) value = 0;
    if( value > parseInt( this.data.data.attribs[attrib].max)) value = parseInt( this.data.data.attribs[attrib].value);
    // const update = { `data.attribs[${attrib}].value`: value};
    // return this.update( { data.attribs[attrib].value: value});
  }


  get tokenId()
  {
    return this.token ? `${this.token.scene._id}.${this.token.id}` : null;
  }

  get locked(){
    if( !this.data.data.flags){
      this.data.data.flags = {};
      this.data.data.flags.locked = false;
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

  getFlag( flagName){
    if( !this.data.data.flags){
      this.data.data.flags = {};
      this.data.data.flags.locked = false;
      this.update( { "data.flags": {}});
      return false;
    }

    const flagValue =  this.data.data.flags[flagName];
    return typeof flagValue === "undefined" ? false: flagValue;
  }

  /**
   * Use the formula if available to roll some characteritics.
   */
  async rollCharacteristicsValue(){
    for (let [key, value] of Object.entries(this.data.data.characteristics)) {
      let r = new Roll( value.formula);
      r.roll();
      if( r.total){
        let charKey = `data.characteristics.${key}.value`;
        this.update( {[charKey]: r.total});
      }
    }

  }

}