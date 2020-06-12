// Namespace COC7 Configuration Values
export const COC7 = {};


/**
 * The set of Eras used within the system
 * @type {Object}
 */
COC7.eras = {
	"nvct": "Invictus",
	"drka": "Dark Ages",
	"ddts": "Down Darker Trails",
	"glit": "Cthulhu by Gaslight",
	"1920": "1920s",
	"pulp": "Pulp Cthulhu",
	"mdrn": "Modern"
};


COC7.characteristics = {
	"str" : "CoC7.CharacStr",
	"con" : "CoC7.CharacCon",
	"siz" : "CoC7.CharacSiz",
	"dex" : "CoC7.CharacDex",
	"app" : "CoC7.CharacApp",
	"int" : "CoC7.CharacInt",
	"pow" : "CoC7.CharacPow",
	"edu" : "CoC7.CharacEdu"
}

/**
 * The set of Skills attributes used within the system
 * @type {Object}
 */
COC7.skillProperties = {
	"special" : "Specialization",
	"rarity" : "Uncommon",
	"push" : "Pushed",
	"combat" : "Combat"
}

COC7.weaponProperties = {
	"rngd": "Range",
	"impl": "Impale",
	"rare": "Rare",
	"ahdb": "+Half DB",
	"addb": "+DB",
	"slnt": "Silent",
	"xplv": "Area of Effect",
	"brst": "Burst",
	"auto": "Full-auto",
	"spcl": "Special",
	"mont": "Mounted",
	"dbrl": "Dual barrel",
	"blst": "Blast",
	"stun": "Stun"
}


COC7.difficulty = {
	"regular": "Regular",
	"hard": "Hard",
	"extreme": "Extreme"
}

COC7.formula = {}

COC7.formula.actor = {
	"@STR": "this.data.data.characteristics.str.value",
	"@CON": "this.data.data.characteristics.con.value",
	"@SIZ": "this.data.data.characteristics.siz.value",
	"@DEX": "this.data.data.characteristics.dex.value",
	"@APP": "this.data.data.characteristics.app.value",
	"@INT": "this.data.data.characteristics.int.value",
	"@POW": "this.data.data.characteristics.pow.value",
	"@EDU": "this.data.data.characteristics.edu.value"
}

COC7.formula.actorsheet = {
	"@STR": "this.actor.data.data.characteristics.str.value",
	"@CON": "this.actor.data.data.characteristics.con.value",
	"@SIZ": "this.actor.data.data.characteristics.siz.value",
	"@DEX": "this.actor.data.data.characteristics.dex.value",
	"@APP": "this.actor.data.data.characteristics.app.value",
	"@INT": "this.actor.data.data.characteristics.int.value",
	"@POW": "this.actor.data.data.characteristics.pow.value",
	"@EDU": "this.actor.data.data.characteristics.edu.value"
}

COC7.newSkillName = "new skill";
COC7.newItemName = "new item";
COC7.newWeaponName = "new weapon";