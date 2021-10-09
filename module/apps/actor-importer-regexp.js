/* global game */
import { CoC7Utilities } from '../utilities.js'

const nameCharacters =
  '\\u3000\\u3400-\\u4DBF\\u4E00-\\u9FFF\\w\\(\\)\\-\\/&"\'' +
  CoC7Utilities.quoteRegExp(
    'áéíóàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃĀÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ“”'
  )

const keys = {
  en: {
    // Language Key for this language
    description: 'CoC7.English',
    // Language dependant word for 0 damage bonus
    dbNone: 'none',
    // Language dependant word for 0 armour
    armorNone: 'none',
    // Language dependant word for 0 attacks per round
    attacksPerRoundNone: 'none',
    // Language dependant word for 0 sanity loss
    sanLossNone: 'none',
    // Language dependant damage bonus words
    fulldb: '(' + 'Damage Bonus|DB' + ')',
    // Language dependant half damage bonus words
    halfdb: '(' + '½|half' + ')',
    // Language dependant combat section starts with
    sectionCombats: '\n(?:' + 'combat|fighting attacks' + ')[:\n]',
    // If we have to add a combat header what will trigger sectionCombats
    newCombatHeader: '\n' + 'Combat' + '\n',
    // Language dependant skills section starts with
    sectionSkills: '\n(?:' + 'skills' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    // Language dependant languages section starts with
    sectionLangauges: '\n(?:' + 'languages' + ')[:\n]',
    // Language dependant spells section starts with
    sectionSpells: '\n(?:' + 'spells' + ')[:\n]',
    // Language dependant example character
    example:
      'Example Character, age 27\nSTR 75 CON 60 SIZ 80 DEX 70 APP 60 INT 80\nPOW 50 EDU 85 SAN 55 HP 14 DB: 1D4\nBuild: 1 Move: 7 MP: 10 Luck: 40 Armor: 1\nAttacks per round: 3 SAN loss: 1d4/1d8\nCombat\nBite 50% (25/10), damage 1D6\nBrawl 30% (15/6), damage 1D3\nDerringer 40% (20/8), damage 1D8+1\nDodge 50% (25/10)\nSkills\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nLanguages: English 80%, Eklo 5%.\nSpells: Summon NPC, Dispel NPC.'
  },
  fr: {
    description: 'CoC7.French',
    dbNone: 'Acune',
    armorNone: 'Acune',
    attacksPerRoundNone: 'Acune',
    sanLossNone: 'Acune',
    fulldb: '(' + 'BD|Bonus aux dommages|Impact|Imp' + ')',
    halfdb: '(' + '½|half' + ')',
    sectionCombats: '\n(?:' + 'Combat|Armes|Attaques' + ')[:\n]',
    newCombatHeader: '\n' + 'Combat' + '\n',
    sectionSkills: '\n(?:' + 'Compétences' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'Langue' + ')[:\n]',
    sectionSpells: '\n(?:' + 'Sortilèges|Sorts' + ')[:\n]',
    example:
      'Example Character, 27 ans\nFOR 75 CON 60 TAI 80 DEX 70 APP 60 INT 80\nPOU 50 ÉDU 85 SAN 55 PV 14 BD: 1D4\nCarrure: 1 Mvt: 7 PM: 10 Chance: 40 Armure: 1\nAttaques par round 3 Perte de SAN: 1d4/1d8\nAttaques\nBite 50% (25/10), dommage 1D6\nBrawl 30% (15/6), dommage 1D3\nDerringer 40% (20/8), dommage 1D8+1\nEsquiver 50% (25/10)\nCompétences\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nLangue: English 80%, Eklo 5%.\nSortilèges: Summon NPC, Dispel NPC.'
  },
  es: {
    description: 'CoC7.Spanish',
    dbNone: 'ninguna',
    armorNone: 'ninguna',
    attacksPerRoundNone: 'ninguno',
    sanLossNone: 'no',
    fulldb: '(' + 'BD|bd|bonificación de daño' + ')',
    halfdb: '(' + '½|half' + ')',
    sectionCombats: '\n(?:' + 'Combate|Armas' + ')[:\n]',
    newCombatHeader: '\n' + 'Combate' + '\n',
    sectionSkills: '\n(?:' + 'Habilidades' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'Idiomas|Lenguajes|Lenguas' + ')[:\n]',
    sectionSpells: '\n(?:' + 'Conjuros' + ')[:\n]',
    example:
      'Example Character, 27 años\nFUE 75 CON 60 TAM 80 DES 70 APA 60 INT 80\nPOD 50 EDU 85 COR 55 PV 14 BD: 1D4\nCorpulencia: 1 Movimiento: 7 PM: 10 Suerte: 40 Armadura: 1\nNúmero de Ataques 3 Pérdida de cordura: 1d4/1d8\nCombate\nBite 50% (25/10), daño 1D6\nBrawl 30% (15/6), daño 1D3\nDerringer 40% (20/8), daño 1D8+1\nEsquivar 50% (25/10)\nHabilidades\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nIdiomas: English 80%, Eklo 5%.\nConjuros: Summon NPC, Dispel NPC.'
  },
  'zh-TW': {
    description: 'CoC7.TraditionalChinese',
    dbNone: 'none',
    // Language dependant word for 0 armour
    armorNone: 'none',
    // Language dependant word for 0 attacks per round
    attacksPerRoundNone: 'none',
    // Language dependant word for 0 sanity loss
    sanLossNone: 'none',
    // Language dependant damage bonus words
    fulldb: '(' + 'Damage Bonus|DB|傷害加值' + ')',
    halfdb: '(' + '½|half' + ')',
    // Language dependant combat section starts with
    sectionCombats:
      '\n(?:' + 'combat|fighting attacks|戰鬥技能|戰鬥列表|武器' + ')[:\n]',
    // If we have to add a combat header what will trigger sectionCombats
    newCombatHeader: '\n' + 'Combat' + '\n',
    // Language dependant skills section starts with
    sectionSkills:
      '\n(?:' + '(?:Skills|技能列表)' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    // Language dependant languages section starts with
    sectionLangauges: '\n(?:' + 'Languages|語言' + ')[:\n]',
    // Language dependant spells section starts with
    sectionSpells: '\n(?:' + 'spells|咒文列表|咒文' + ')[:\n]',
    // Language dependant example character
    example:
      '示範角色, 年齡 27\n力量 75 體質 60 體型 80 敏捷 70 外貎 60 智力 80\n意志 50 教育 85 SAN 55 HP 14 DB: 1D4\n體格: 1 Move: 7 MP: 10 幸運: 40 護甲: 1\n攻擊次數: 3 理智喪失: 1d4/1d8\n戰鬥列表\n咬 50% (25/10), 傷害 1D6\n空手 30% (15/6), 傷害 1D3\n手槍 40% (20/8), 傷害 1D8+1\n閃避 50% (25/10)\n技能列表\n動物馴養 55%, 取悅 30%, 急救 25%, 潛行 20%,\n聆聽 50%, 藥學 45%, 精神分析 25%, 心理學 75%,\n科學 (司法科學) 90%, 科學 (密碼學) 35%, \n偵查 35%, 喬裝 10%\n語言: 粵語 80%, 讀唇 5%.\n咒文: 召喚 NPC, 指揮 NPC.'
  }
}

const translations = {
  en: {
    // Language dependant RegExs
    age: '(?<![a-z])' + 'age' + ':?\\s+(?<age>\\d+)[,\\s]*',
    occupation: '[,\\s]*' + 'Occupation' + ':?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'STR' + ':?\\s+(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON' + ':?\\s+(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'SIZ' + ':?\\s+(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT' + ':?\\s+(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POW' + ':?\\s+(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DEX' + ':?\\s+(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APP' + ':?\\s+(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'EDU' + ':?\\s+(?<edu>\\d+|-)[,\\s\n]*',
    san: '(?<![a-z])(?:' + 'SAN|Sanity' + '):?\\s+(?<san>\\d+|-)[,\\s\n]*',
    hp: '(?<![a-z])(?:' + 'HP|Hit points' + '):?\\s+(?<hp>\\d+|-)[,\\s\n]*',
    mp: '(?<![a-z])(?:' + 'MP|Magic points' + '):?\\s+(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.en.fulldb +
      '):?\\s+(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys.en.dbNone +
      ')[,\\s\n]*',
    build: '(?<![a-z])' + 'Build' + ':?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Armor' +
      ':?\\s+(?<armor>' +
      keys.en.armorNone +
      '|\\d+)[,\\s\n]*',
    mov: '(?<![a-z])' + 'Move' + ':?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Luck' + ':?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Attacks per round|# Attacks' +
      '):?\\s+(?<attacksPerRound>' +
      keys.en.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Sanity loss|SAN loss' +
      '):?\\s+(?<sanLoss>' +
      keys.en.sanLossNone +
      '|\\dD?[+\\d]*\\/\\dD?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*' +
      'damage' +
      ')?\\s+(?<damage>(:?(:?\\d+d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.en.fulldb +
      '|' +
      keys.en.halfdb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Dodge' +
      '):?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    handgun:
      '(?<type>' +
      ' Gun|Revolver|Pistol|Handgun|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle:
      '(?<type>' + 'Rifle|Shotgun|Carbine|Gauge |Lee-Enfield|Elephant' + ')',
    smb: '(?<type>' + 'Submachine Gun|Thompson' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers' + ')',
    launched: '(?<type>' + 'Molotov|Grenade|Dynamite' + ')',
    // Language dependant a skill should not be "The player has" / "but they regenerate" required for "A Cold Fire Within"
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    // Language dependant likely first words for a combat section if there is no heading
    guessStartCombat: '(^|(?<!,)\n)(' + 'Fighting|Firearms|Brawl|Bite' + ')',
    // These shouldn't need edited
    name: '^(?<name>[\\.\\s' + nameCharacters + ']+)[,\\s\n]+',
    sections:
      '(' +
      keys.en.sectionCombats +
      '|' +
      keys.en.sectionSkills +
      '|' +
      keys.en.sectionLangauges +
      '|' +
      keys.en.sectionSpells +
      ')'
  },
  fr: {
    age: '(?<age>\\d+)\\s*' + 'ans' + '(?![a-z])[,\\s]*',
    occupation: '[,\\s]*' + 'Occupation' + ':?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'FOR' + ':?\\s+(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON' + ':?\\s+(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'TAI' + ':?\\s+(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT' + ':?\\s+(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POU' + ':?\\s+(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DEX' + ':?\\s+(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APP' + ':?\\s+(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'ÉDU' + ':?\\s+(?<edu>\\d+|-)[,\\s\n]*',
    san:
      '(?<![a-z])(?:' + 'SAN|Santé Mentale' + '):?\\s+(?<san>\\d+|-)[,\\s\n]*',
    hp: '(?<![a-z])(?:' + 'PV|Points de vie' + '):?\\s+(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' + 'PM|Points de magie' + '):?\\s+(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.fr.fulldb +
      '):?\\s+(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys.fr.dbNone +
      ')[,\\s\n]*',
    build: '(?<![a-z])' + 'Carrure' + ':?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Armure' +
      ':?\\s+(?<armor>' +
      keys.fr.armorNone +
      '|\\d+)[,\\s\n]*',
    mov:
      '(?<![a-z])(?:' +
      'Mvt|Mouvement|Déplacement' +
      '):?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Chance' + ':?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Attaques par round' +
      '):?\\s+(?<attacksPerRound>' +
      keys.fr.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Perte de Santé mentale|Perte de SAN' +
      '):?\\s+(?<sanLoss>' +
      keys.fr.sanLossNone +
      '|\\dD?[+\\d]*\\/\\dD?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*(?:' +
      'dommage|dégâts' +
      '))?\\s+(?<damage>(:?(:?\\d+d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.fr.fulldb +
      '|half' +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Esquiver' +
      '):?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    handgun:
      '(?<type>' +
      'Revolver|Pistolet|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle: '(?<type>' + 'Carabine|Lee-Enfield|Fusil' + ')',
    smb: '(?<type>' + 'SMG|Thompson' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers|Mitrailleuse' + ')',
    launched: '(?<type>' + 'Molotov|Grenade|Dynamite' + ')',
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    guessStartCombat:
      '(^|(?<!,)\n)(' + 'Au contact|À distance|Brawl|Bite' + ')',
    name: '^(?<name>[\\.\\s' + nameCharacters + ']+)[,\\s\n]+',
    sections:
      '(' +
      keys.fr.sectionCombats +
      '|' +
      keys.fr.sectionSkills +
      '|' +
      keys.fr.sectionLangauges +
      '|' +
      keys.fr.sectionSpells +
      ')'
  },
  es: {
    age: '(?<age>\\d+)\\s*' + 'a[ñÑ]os' + '(?![a-z])[,\\s]*',
    occupation: '[,\\s]*' + 'Occupation' + ':?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'FUE' + ':?\\s+(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON' + ':?\\s+(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'TAM' + ':?\\s+(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT' + ':?\\s+(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POD' + ':?\\s+(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DES' + ':?\\s+(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APA' + ':?\\s+(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'EDU' + ':?\\s+(?<edu>\\d+|-)[,\\s\n]*',
    san: '(?<![a-z])(?:' + 'COR|Cordura' + '):?\\s+(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' +
      'PV|Puntos de vida|P\\. ?V\\.' +
      '):?\\s+(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      'PM|Puntos Mágicos|Puntos de Magia' +
      '):?\\s+(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.es.fulldb +
      '):?\\s+(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys.es.dbNone +
      ')[,\\s\n]*',
    build: '(?<![a-z])' + 'Corpulencia' + ':?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Armadura' +
      ':?\\s+(?<armor>' +
      keys.es.armorNone +
      '|\\d+)[,\\s\n]*',
    mov: '(?<![a-z])' + 'Movimiento' + ':?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Suerte' + ':?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Número de Ataques' +
      '):?\\s+(?<attacksPerRound>' +
      keys.es.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Pérdida de cordura|Pérdida de COR' +
      '):?\\s+(?<sanLoss>' +
      keys.es.sanLossNone +
      '|\\dD?[+\\d]*\\/\\dD?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*' +
      'daño' +
      ')?\\s+(?<damage>(:?(:?\\d+d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.es.fulldb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Esquivar' +
      '):?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    handgun:
      '(?<type>' +
      'Revolver|Pistola|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle:
      '(?<type>' +
      'Rifle|Carabina|Lee-Enfield|Caza Elefantes|Fusil|Escopeta|Galga|Recortada' +
      ')',
    smb: '(?<type>' + 'Subfusil|Thompson' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers|Ametralladora' + ')',
    launched: '(?<type>' + 'Molotov|Granada|Dinamita' + ')',
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    guessStartCombat:
      '(^|(?<!,)\n)(' + 'Combatir|Armas de fuego|Brawl|Bite' + ')',
    name: '^(?<name>[\\.\\s' + nameCharacters + ']+)[,\\s\n]+',
    sections:
      '(' +
      keys.es.sectionCombats +
      '|' +
      keys.es.sectionSkills +
      '|' +
      keys.es.sectionLangauges +
      '|' +
      keys.es.sectionSpells +
      ')'
  },
  'zh-TW': {
    // Language dependant RegExs
    age: '(?<![a-z])' + 'age|年齡' + ':?\\s*(?<age>\\d+)[,\\s]*',
    occupation: '[,\\s]*' + 'Occupation' + ':?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'STR|力量' + ':?\\s*(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON|體質' + ':?\\s*(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'SIZ|體型' + ':?\\s*(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT|智力' + ':?\\s*(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POW|意志' + ':?\\s*(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DEX|敏捷' + ':?\\s*(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APP|外貎' + ':?\\s*(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'EDU|教育' + ':?\\s*(?<edu>\\d+|-)[,\\s\n]*',
    san: '(?<![a-z])(?:' + 'SAN|Sanity|理智' + '):?\\s*(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' + 'HP|Hit points|生命' + '):?\\s*(?<hp>\\d+|-)[,\\s\n]*',
    mp: '(?<![a-z])(?:' + 'MP|Magic points' + '):?\\s*(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys['zh-TW'].fulldb +
      '):?\\s*(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys['zh-TW'].dbNone +
      ')[,\\s\n]*',
    build: '(?<![a-z])' + 'Build|體格' + ':?\\s*(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Armor|護甲' +
      ':?\\s*(?<armor>' +
      keys['zh-TW'].armorNone +
      '|\\d+)[,\\s\n]*',
    mov: '(?<![a-z])' + 'Move' + ':?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Luck|幸運' + ':?\\s*(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Attacks per round|# Attacks|攻擊次數|# 攻擊' +
      '):?\\s*(?<attacksPerRound>' +
      keys['zh-TW'].attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Sanity loss|SAN loss|理智喪失|SAN值損失|SAN值喪失|扣SAN' +
      '):?\\s*(?<sanLoss>' +
      keys['zh-TW'].sanLossNone +
      '|\\dD?[+\\d]*\\/\\dD?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*(?:' +
      'damage|傷害' +
      '))?\\s+(?<damage>(:?(:?\\d+d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys['zh-TW'].fulldb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Dodge|閃避|閃躲' +
      '):?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%?(?:\\s*\\(\\d+\\/\\d+\\))?',
    handgun:
      '(?<type>' +
      ' 遂發槍|\\.22短口自動手槍|\\.25短口手槍(單管)|\\.32或7\\.65mm左輪手槍|\\.32或7\\.65mm自動手槍|\\.357 Magnum左輪手槍|\\.38或9mm左輪手槍|\\.38自動手槍|貝雷塔M9|格洛克17|9mm自動手槍|魯格P08|\\.41左輪手槍|\\.44馬格南左輪手槍|\\.45左輪手槍|\\.45自動手槍|沙漠之鷹|Gun|Revolver|Pistol|Handgun|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle:
      '(?<type>' +
      '步槍|卡賓槍|半自動步槍|獵象槍|Rifle|Shotgun|Carbine|Gauge |Lee-Enfield|Elephant' +
      ')',
    smb: '(?<type>' + 'Submachine Gun|Thompson|衝鋒槍' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers|機槍' + ')',
    launched: '(?<type>' + 'Molotov|Grenade|Dynamite爆炸物|手榴彈|重武器' + ')',
    // Language dependant a skill should not be "The player has" / "but they regenerate" required for "A Cold Fire Within"
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    // Language dependant likely first words for a combat section if there is no heading
    guessStartCombat: '(^|(?<!,)\n)(' + '近戰技能|射擊技能|Brawl|Bite' + ')',
    // These shouldn't need edited
    name: '^(?<name>[\\.\\s' + nameCharacters + ']+)[,\\s\n]+',
    sections:
      '(' +
      keys['zh-TW'].sectionCombats +
      '|' +
      keys['zh-TW'].sectionSkills +
      '|' +
      keys['zh-TW'].sectionLangauges +
      '|' +
      keys['zh-TW'].sectionSpells +
      ')'
  }
}

export class CoC7ActorImporterRegExp {
  static checkLanguage (lang = null) {
    if (!lang) {
      lang = game.i18n.lang
    }
    if (typeof translations[lang] === 'undefined') {
      lang = 'en'
    }
    return lang
  }

  static getExampleText (lang) {
    let example = keys.en.example
    if (typeof keys[lang] !== 'undefined') {
      example = keys[lang].example
    }
    return example
  }

  static getTranslations () {
    const output = {}
    for (const key in keys) {
      output[key] = keys[key].description
    }
    return output
  }

  static getKeys (lang) {
    return keys[lang] || keys.en
  }

  static getRegularExpressions (lang) {
    return translations[lang] || translations.en
  }
}
