/* global CONFIG, game */
import { CoC7Utilities } from '../utilities.js'

const accentedCharacters = CoC7Utilities.quoteRegExp(
  'áéíóàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ'
)

// Regular expressions to parse actors from an english source
const englishRegExp = {
  nameRegExp: new RegExp(
    '^[\\s\\n\\r]*(?<name>[\\w\\s\\.\\/\\(\\)\\-' + accentedCharacters + ']+),'
  ),
  ageRegExp: /[, ]?\s*age:?\s+(\d+)/i,
  strRegExp: /(?:STR):?\s+(\d+)/,
  conRegExp: /CON:?\s+(\d+)/,
  sizRegExp: /(?:SIZ):?\s+(\d+)/,
  intRegExp: /INT:?\s+(\d+)/,
  powRegExp: /(?:POW):?\s+(\d+)/,
  dexRegExp: /(?:DEX):?\s+(\d+)/,
  appRegExp: /(?:APP):?\s+(\d+)/,
  eduRegExp: /EDU:?\s+(\d+)/,
  sanRegExp: /(?:SAN|Sanity):?\s+(\d+)/,
  hpRegExp: /(?:HP|Hit points):?\s+(\d+)/,
  mpRegExp: /(?:MP|Magic points):?\s+(\d+)/,
  dbRegExp: /(?:Damage Bonus|DB):?\s+([+-]?\d+(?:d\d+|D\d+)?)/i,
  //  attacksRegExp : /(?:Attacks|Combat):?\s+(.*)Spells/sim,
  attacksRegExp: /(?:Attacks|Fighting|Combat):?\s+(.*)\.[\n|\r]?$/ims,
  buildRegExp: /(?:Build):?\s+([+-]?\d+)/i,
  armorRegExp: /(?:Armor):?\s+(none|\d+)/i,
  moveRegExp: /(?:Move):?\s+(\d+)/i,
  luckRegExp: /(?:Luck):?\s+(\d+)/i,
  //  spellsRegExp : /Spells:?\s+(.*)Skills/sim,
  spellsRegExp: /(?:Spells):?\s+(.*)\.[\n|\r]?$/ims,
  //  skillsRegExp : /Skills:?\s+(.*)Languages/sim,
  skillsRegExp: /(?:Skills):?\s+(.*)\.[\n|\r]?$/ims,
  dodgeRegExp: /(?<name>Dodge):?\s+\(?(?<percentage>\d+)\)?\s*%/i,
  //  languagesRegExp : /Languages:?\s+(.*)\./sim,
  languagesRegExp: /(?:Languages):?\s+(.*)\.[\n|\r]?$/ims,
  skillRegExp: new RegExp(
    '(?<skill>[\\w\\s\\(\\).\\/' +
      accentedCharacters +
      ']+) (?<percentage>\\d+)%'
  ),
  attacksPerRoundRegExp: /(?:Attacks per round|# Attacks):?\s+(none|\d+)/i,
  sanLossRegExp: /(?:Sanity loss|SAN loss):?\s+(none|\d[dD]?[+\d]*\/\d[dD][+\d]+)/i,
  weaponRegExp: new RegExp(
    '^(?<weapon>[\\w\\s\\n\\(\\).\\/' +
      accentedCharacters +
      ']+):?[\\n\\r\\s]+(?<percentage>\\d+)%,?\\s*(?:\\(\\d+\\/\\d+\\))?\\s*,?\\s*(?:damage)\\s+(?<damage>[\\d+\\+dD\\- ]+\\s*(DB|db|damage bonus)?)',
    'img'
  ),
  stopWords: '(Spells|Skills|Sanity loss|Languages|Armor|Attacks|Combat|)',
  // Weapons regular expressions,
  handgunRegExp: /( Gun|Revolver|Pistol|Handgun|Derringer|Beretta|Luger|Desert Eagle| .38)/i,
  rifleRegExp: /(Rifle|Shotgun|Carbine|Gauge |Lee-Enfield|Elephant)/i,
  smbRegExp: /(Submachine Gun|Thompson)/i,
  machineGunRegExp: /(Browning|Vickers)/i,
  launchedWeapons: /(Molotov|Grenade|Dynamite)/i,
  example:
    'Example Character, age 27\nSTR 75 CON 60 SIZ 80 DEX 70 APP 60 INT 80\nPOW 50 EDU 85 SAN 55 HP 14 DB: 1D4\nBuild: 1 Move: 7 MP: 10 Luck: 40 Armor: 1\nAttacks per round: 3 SAN loss: 1d4/1d8\nCombat\nBite 50% (25/10), damage 1D6\nBrawl 30% (15/6), damage 1D3\nDerringer 40% (20/8), damage 1D8+1\nDodge 50% (25/10)\nSkills\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nLanguages: English 80%, Eklo 5%.\nSpells: Summon NPC, Dispel NPC.'
}

// Regular expressions to parse actors from a french source
const frenchRegExp = {
  nameRegExp: new RegExp(
    '^[\\s\\n\\r]*(?<name>[\\w\\s\\.\\/\\(\\)\\-' + accentedCharacters + ']+),'
  ),
  ageRegExp: /(\d+) ans/i,
  strRegExp: /(?:FOR):?\s+(\d+)/,
  conRegExp: /CON:?\s+(\d+)/,
  sizRegExp: /(?:TAI):?\s+(\d+)/,
  intRegExp: /INT:?\s+(\d+)/,
  powRegExp: /(?:POU):?\s+(\d+)/,
  dexRegExp: /(?:DEX):?\s+(\d+)/,
  appRegExp: /(?:APP):?\s+(\d+)/,
  eduRegExp: /ÉDU:?\s+(\d+)/,
  sanRegExp: /(?:SAN|Santé Mentale):?\s+(\d+)/,
  hpRegExp: /(?:PV|Points de vie):?\s+(\d+)/,
  mpRegExp: /(?:PM|Points de magie):?\s+(\d+)/,
  dbRegExp: /(?:BD|Bonus aux dommages|Impact|Imp):?\s+([+-]?\d+(?:d\d+|D\d+)?)/i,
  attacksRegExp: /(?:Attaques|Armes|Combat):?\s+(.*)\.[\n|\r]?$/ims,
  buildRegExp: /(?:Carrure):?\s+([+-]?\d+)/i,
  armorRegExp: /(?:Armure):?\s+(Acune|\d+)/i,
  moveRegExp: /(?:Mvt|Mouvement|Déplacement):?\s+(\d+)/i,
  luckRegExp: /(?:Chance):?\s+(\d+)/i,
  spellsRegExp: /(?:Sortilèges|Sorts):?\s+(.*)\.[\n|\r]?$/ims,
  skillsRegExp: /(?:Compétences):?\s+(.*)\.[\n|\r]?$/ims,
  dodgeRegExp: /(?<name>Esquiver):?\s+\(?(?<percentage>\d+)\)?\s*%/i,
  languagesRegExp: /(?:Langue):?\s+(.*)\.[\n|\r]?$/ims,
  skillRegExp: new RegExp(
    '(?<skill>[\\w\\s\\(\\).\\/' +
      accentedCharacters +
      ']+) (?<percentage>\\d+)%'
  ),
  attacksPerRoundRegExp: /(?:Attaques par round):?\s+(Acune|\d+)/i,
  sanLossRegExp: /(?:Perte de Santé mentale|Perte de SAN):?\s+(no|\d[dD]?[+\d]*\/\d[dD][+\d]+)/i,
  weaponRegExp: new RegExp(
    '^(?<weapon>[\\w\\s\\n\\(\\).\\/' +
      accentedCharacters +
      ']+):?[\\n\\r\\s]+(?<percentage>\\d+)%,?\\s*(?:\\(\\d+\\/\\d+\\))?\\s*,?\\s*(?:dommage|dégâts)\\s+(?<damage>[\\d+\\+dD\\- ]+\\s*(Impact|Imp)?)',
    'img'
  ),
  stopWords:
    '(Langue|Armure|Carrure|Perte de Santé mentale|Compétences|Combat|Armes|Attaques)',
  // Weapons regular expressions,
  handgunRegExp: /(Revolver|Pistolet|Derringer|Beretta|Luger|Desert Eagle| .38)/i,
  rifleRegExp: /(Carabine|Lee-Enfield|Fusil)/i,
  smbRegExp: /(SMG|Thompson)/i,
  machineGunRegExp: /(Browning|Vickers|Mitrailleuse)/i,
  launchedWeapons: /(Molotov|Grenade|Dynamite)/i,
  example:
    'Example Character, 27 ans\nFOR 75 CON 60 TAI 80 DEX 70 APP 60 INT 80\nPOU 50 ÉDU 85 SAN 55 PV 14 BD: 1D4\nCarrure: 1 Mvt: 7 PM: 10 Chance: 40 Armure: 1\nAttaques par round 3 Perte de SAN: 1d4/1d8\nAttaques\nBite 50% (25/10), dommage 1D6\nBrawl 30% (15/6), dommage 1D3\nDerringer 40% (20/8), dommage 1D8+1\nEsquiver 50% (25/10)\nCompétences\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nLangue: English 80%, Eklo 5%.\nSortilèges: Summon NPC, Dispel NPC.'
}

// Regular expressions to parse actors from a spanish source
const spanishRegExp = {
  nameRegExp: new RegExp(
    '^[\\s\\n\\r]*(?<name>[\\w\\s\\.\\/\\(\\)\\-' + accentedCharacters + ']+),'
  ),
  ageRegExp: /(\d+) a[ñÑ]os/i,
  strRegExp: /(?:FUE):?\s+(\d+)/,
  conRegExp: /CON:?\s+(\d+)/,
  sizRegExp: /(?:TAM):?\s+(\d+)/,
  intRegExp: /INT:?\s+(\d+)/,
  powRegExp: /(?:POD):?\s+(\d+)/,
  dexRegExp: /(?:DES):?\s+(\d+)/,
  appRegExp: /(?:APA):?\s+(\d+)/,
  eduRegExp: /EDU:?\s+(\d+)/,
  sanRegExp: /(?:COR|Cordura):?\s+(\d+)/,
  hpRegExp: /(?:PV|Puntos de vida|P\. ?V\.):?\s+(\d+)/,
  mpRegExp: /(?:PM|Puntos Mágicos|Puntos de Magia):?\s+(\d+)/,
  dbRegExp: /(?:BD):?\s+([+-]?\d+(?:d\d+|D\d+)?)/i,
  attacksRegExp: /(?:Combate|Armas):?\s+(.*)\.[\n|\r]?$/ims,
  buildRegExp: /(?:Corpulencia):?\s+([+-]?\d+)/i,
  armorRegExp: /(?:Armadura):?\s+(ninguna|\d+)/i,
  moveRegExp: /(?:Movimiento):?\s+(\d+)/i,
  luckRegExp: /(?:Suerte):?\s+(\d+)/i,
  spellsRegExp: /(?:Conjuros|Hechizos):?\s+(.*)\.[\n|\r]?$/ims,
  skillsRegExp: /(?:Habilidades):?\s+(.*)\.[\n|\r]?$/ims,
  dodgeRegExp: /(?<name>Esquivar):?\s+\(?(?<percentage>\d+)\)?\s*%/i,
  languagesRegExp: /(?:Idiomas|Lenguajes|Lenguas):?\s+(.*)\.[\n|\r]?$/ims,
  skillRegExp: new RegExp(
    '(?<skill>[\\w\\s\\(\\).\\/' +
      accentedCharacters +
      ']+) (?<percentage>\\d+)%'
  ),
  attacksPerRoundRegExp: /(?:Número de Ataques):?\s+(ninguno|\d+)/i,
  sanLossRegExp: /(?:Pérdida de cordura|Pérdida de COR):?\s+(no|\d[dD]?[+\d]*\/\d[dD][+\d]+)/i,
  weaponRegExp: new RegExp(
    '^(?<weapon>[\\w\\s\\n\\(\\).\\/' +
      accentedCharacters +
      ']+):?[\\n\\r\\s]+(?<percentage>\\d+)%,?\\s*(?:\\(\\d+\\/\\d+\\))?\\s*,?\\s*(?:daño)\\s+(?<damage>[\\d+\\+dD\\- ]+\\s*(BD|bd|bonificación de daño)?)',
    'img'
  ),
  stopWords:
    '(Conjuros|Habilidades|Pérdida de cordura|Idiomas|Lenguajes|Lenguas|Armadura|Combate|Armas)',
  // Weapons regular expressions,
  handgunRegExp: /(Revolver|Pistola|Derringer|Beretta|Luger|Desert Eagle| .38)/i,
  rifleRegExp: /(Rifle|Carabina|Lee-Enfield|Caza Elefantes|Fusil|Escopeta|Galga|Recortada)/i,
  smbRegExp: /(Subfusil|Thompson)/i,
  machineGunRegExp: /(Browning|Vickers|Ametralladora)/i,
  launchedWeapons: /(Molotov||Granada|Dinamita)/i,
  example:
    'Example Character, 27 años\nFUE 75 CON 60 TAM 80 DES 70 APA 60 INT 80\nPOD 50 EDU 85 COR 55 PV 14 BD: 1D4\nCorpulencia: 1 Movimiento: 7 PM: 10 Suerte: 40 Armadura: 1\nNúmero de Ataques 3 Pérdida de cordura: 1d4/1d8\nCombate\nBite 50% (25/10), daño 1D6\nBrawl 30% (15/6), daño 1D3\nDerringer 40% (20/8), daño 1D8+1\nEsquivar 50% (25/10)\nHabilidades\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nIdiomas: English 80%, Eklo 5%.\nConjuros: Summon NPC, Dispel NPC.'
}

// Regular expressions to parse actors from an Traditional Chinese source
const traditionalChineseRegExp = {
  nameRegExp: new RegExp(
    '^[\\s\\n\\r]*(?<name>[\\u3000\\u3400-\\u4DBF\\u4E00-\\u9FFF\\w\\s\\.\\/\\(\\)\\-' +
      accentedCharacters +
      ']+),'
  ),
  ageRegExp: /(?:age|年齡):?：?\s*(\d+)/i,
  strRegExp: /(?:STR|力量):?：?\s*(\d+)/i,
  conRegExp: /(?:CON|體質):?：?\s*(\d+)/i,
  sizRegExp: /(?:SIZ|體型):?：?\s*(\d+)/i,
  intRegExp: /(?:INT|智力):?：?\s*(\d+)/i,
  powRegExp: /(?:POW|意志):?：?\s*(\d+)/i,
  dexRegExp: /(?:DEX|敏捷):?：?\s*(\d+)/i,
  appRegExp: /(?:APP|外貎):?：?\s*(\d+)/i,
  eduRegExp: /(?:EDU|教育):?：?\s*(\d+)/i,
  sanRegExp: /(?:SAN|Sanity|理智):?：?\s*(\d+)/i,
  hpRegExp: /(?:HP|Hit points|生命):?：?\s*(\d+)/i,
  mpRegExp: /(?:MP|Magic points):?：?\s*(\d+)/i,
  dbRegExp: /(?:Damage Bonus|DB|傷害加值):?：?\s*([+-]?\d+(?:d\d+|D\d+)?)/i,
  //  attacksRegExp : /(?:Attacks|Combat):?：?\s*(.*)Spells/sim,
  attacksRegExp: /(?:Attacks|Fighting|Combat|戰鬥技能|戰鬥列表|武器):?：?\s*(.*)\.[\n|\r]?$/ims,
  buildRegExp: /(?:Build|體格):?：?\s*([+-]?\d+)/i,
  armorRegExp: /(?:Armor|護甲):?：?\s*(none|\d+)/i,
  moveRegExp: /(?:Move|MOV):?：?\s*(\d+)/i,
  luckRegExp: /(?:Luck|幸運):?：?\s*(\d+)/i,
  //  spellsRegExp : /Spells:?：?\s*(.*)Skills/sim,
  spellsRegExp: /(?:Spells|咒文|法術|咒語):?：?\s*(.*)\.[\n|\r]?$/ims,
  //  skillsRegExp : /Skills:?：?\s*(.*)Languages/sim,
  skillsRegExp: /(?:Skills|技能列表):?：?\s*(.*)\.[\n|\r]?$/ims,
  dodgeRegExp: /(?<name>Dodge|閃避|閃躲):?：?\s+\(?(?<percentage>\d+)\)?\s*%?/i,
  //  languagesRegExp : /Languages:?：?\s*(.*)\./sim,
  languagesRegExp: /(?:Languages|語言：|語言):?：?\s*(.*)\.[\n|\r]?$/ims,
  skillRegExp: new RegExp(
    '(?<skill>[\\u3000\\u3400-\\u4DBF\\u4E00-\\u9FFF\\w\\s\\(\\).\\/' +
      accentedCharacters +
      ']+) (?<percentage>\\d+)%?'
  ),
  attacksPerRoundRegExp: /(?:Attacks per round|# Attacks|次數|# 攻擊):?：?\s*(none|\d+)/i,
  sanLossRegExp: /(?:Sanity loss|SAN loss|理智喪失|SAN值損失|SAN值喪失|扣SAN):?：?\s*(none|\d[dD]?[+\d]*\/\d[dD][+\d]+)/i,
  weaponRegExp: new RegExp(
    '^(?<weapon>[\\u3000\\u3400-\\u4DBF\\u4E00-\\u9FFF\\w\\s\\n\\(\\).\\/' +
      accentedCharacters +
      ']+):?：?[\\n\\r\\s]+(?<percentage>\\d+)%?,?\\s*(?:\\(\\d+\\/\\d+\\))?\\s*,?\\s*(?:damage|傷害)\\s*(?<damage>[\\d+\\+dD\\- ]+\\s*(DB|db|damage bonus)?)',
    'img'
  ),
  stopWords:
    '(Spells|Skills|Sanity loss|Languages|Armor|Attacks|Combat|咒文列表|技能列表|SAN值損失|SAN值喪失|語言|護甲|戰鬥技能|戰鬥列表|武器)',
  // Weapons regular expressions,
  handgunRegExp: /( 遂發槍|.22短口自動手槍|.25短口手槍(單管)|.32或7.65mm左輪手槍|.32或7.65mm自動手槍|.357 Magnum左輪手槍|.38或9mm左輪手槍|.38自動手槍|貝雷塔M9|格洛克17|9mm自動手槍|魯格P08|.41左輪手槍|.44馬格南左輪手槍|.45左輪手槍|.45自動手槍|沙漠之鷹|Gun|Revolver|Pistol|Handgun|Derringer|Beretta|Luger|Desert Eagle| .38)/i,
  rifleRegExp: /(步槍|卡賓槍|半自動步槍|獵象槍|Rifle|Shotgun|Carbine|Gauge |Lee-Enfield|Elephant)/i,
  smbRegExp: /(Submachine Gun|Thompson|衝鋒槍)/i,
  machineGunRegExp: /(Browning|Vickers|機槍)/i,
  launchedWeapons: /(Molotov|Grenade|Dynamite爆炸物|手榴彈|重武器)/i,
  example:
    '示範角色, 年齡 27\n力量 75 體質 60 體型 80 敏捷 70 外貎 60 智力 80\n意志 50 教育 85 SAN 55 HP 14 DB: 1D4\n體格: 1 Move: 7 MP: 10 幸運: 40 護甲: 1\n攻擊次數: 3 理智喪失: 1d4/1d8\n戰鬥列表\n咬 50% (25/10), 傷害 1D6\n空手 30% (15/6), 傷害 1D3\n手槍 40% (20/8), 傷害 1D8+1\n閃避 50% (25/10)\n技能列表\n動物馴養 55%, 取悅 30%, 急救 25%, 潛行 20%,\n聆聽 50%, 藥學 45%, 精神分析 25%, 心理學 75%,\n科學 (司法科學) 90%, 科學 (密碼學) 35%, \n偵查 35%, 喬裝 10%\n語言: 粵語 80%, 讀唇 5%.\n咒文: 召喚 NPC, 指揮 NPC.'
}

/**
 * CoC7ActorImporterRegExp is a class to get the set of regular expressions corresponding on a language
 */
export class CoC7ActorImporterRegExp {
  static get optionLangRegExp () {
    return /coc-(?<langcode>\w\w)/
  }

  constructor () {
    this.RE = CoC7ActorImporterRegExp.getRegularExpressions(game.i18n.lang)
  }

  /**
   * getRegularExpressions returns the object with the regular expressions corresponding to the given language
   * @param {string} lang language code for the regular expressions ("en", "es", "fr",...)
   * @returns an object with the set of regular expressions
   */
  static getRegularExpressions (lang) {
    if (CONFIG.debug.CoC7Importer) {
      console.debug('Set RegExp Lang: ', lang)
    }
    switch (lang) {
      case 'es':
        return spanishRegExp
      case 'fr':
        return frenchRegExp
      case 'ch':
        return traditionalChineseRegExp
    }
    // By default use english regular expressions.
    return englishRegExp
  }

  static getExampleText (lang) {
    switch (lang) {
      case 'coc-es':
        return spanishRegExp.example
      case 'coc-fr':
        return frenchRegExp.example
      case 'coc-cht':
        return traditionalChineseRegExp.example
    }
    return englishRegExp.example
  }
}
