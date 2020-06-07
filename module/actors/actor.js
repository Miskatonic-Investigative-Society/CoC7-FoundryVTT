
import { COC7 } from '../config.js'

/**
 * Extend the base Actor class to implement additional logic specialized for D&D5e.
 */
export class CoCActor extends Actor {

  constructor(...args) {
    super(...args);
  }

  createTokenActor( baseActor, token){
    return super.createTokenActor( baseActor, token);
  }

  static preCreateToken( scene, actor, options, id){
    let foo = "azerazer";
  }

  
  /** @override */
  async createOwnedItem(itemData, options){
    return super.createOwnedItem(itemData, options);
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
        if( data.data.base != data.data.value) {
          data.data.value = data.data.base;
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

        if( !this.getSkillByName(data.name))
        {
          return super.createEmbeddedEntity(embeddedName, data, options);
        } 
        return null;
        
      default:
        return super.createEmbeddedEntity(embeddedName, data, options);
    }
  }

  getSkillByName( skillName){
    let id = null;
     this.items.forEach( (value, key, map) => {
      if( value.name == skillName) id = value.id;
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

}