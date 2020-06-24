// Namespace COC7 Configuration Values
export const COC7 = {};


/**
 * The set of Eras used within the system
 * @type {Object}
 */
COC7.eras = {
	"nvct": "CoC7.EraNvct",
	"drka": "CoC7.EraDrka",
	"ddts": "CoC7.EraDdts",
	"glit": "CoC7.EraGlit",
	"1920": "CoC7.Era1920",
	"pulp": "CoC7.EraPulp",
	"mdrn": "CoC7.EraMdrn"
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
	special: "CoC7.SkillSpecial",
	rarity: "CoC7.SkillRarity",
	push: "CoC7.SkillPush",
	combat:	"CoC7.SkillCombat",
	fighting: "CoC7.SkillFighting",
	firearm: "CoC7.SkillFirearm"
}

COC7.weaponProperties = {
	rngd: "CoC7.WeaponRngd",
	impl: "CoC7.WeaponImpl",
	rare: "CoC7.WeaponRare",
	ahdb: "CoC7.WeaponAhdb",
	addb: "CoC7.WeaponAddb",
	slnt: "CoC7.WeaponSlnt",
	xplv: "CoC7.WeaponXplv",
	brst: "CoC7.WeaponBrst",
	auto: "CoC7.WeaponAuto",
	spcl: "CoC7.WeaponSpcl",
	mont: "CoC7.WeaponMont",
	dbrl: "CoC7.WeaponDbrl",
	blst: "CoC7.WeaponBlst",
	stun: "CoC7.WeaponStun"
}


COC7.difficulty = {
	regular: "Regular",
	hard: "Hard",
	extreme: "Extreme"
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
COC7.baseCreatureSkill = "Fighting";

COC7.dodgeSkillName = "Dodge";
COC7.fightingSpecializationName = "Fighting";
COC7.firearmSpecializationName = "Firearms";

COC7.combatCards = {
	fightBack:	"CoC7.FightBack",
	dodge:		"CoC7.Dodge",
	maneuver:	"CoC7.Maneuver",

}