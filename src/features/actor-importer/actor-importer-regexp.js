/* global game */
import { CoC7Utilities } from '../../shared/utilities.js'
/**
 * nameCharacters list of characters that can be part of a [] for character, skill, or weapon names used in bracket expression.
 *
 * "keys.<language>.description" lang key to show in the language selection dialog box.
 * "keys.<language>.dbNone" Regular expression to indicate no Damage Bonus e.g. DB: "dbNone".
 * "keys.<language>.armorNone" Regular expression to indicate no Armour Bonus e.g. Armor: "armorNone".
 * "keys.<language>.attacksPerRoundNone" Regular expression to indicate no attacks e.g. Attacks Per Round: "attacksPerRoundNone".
 * "keys.<language>.sanLossNone" Regular expression to indicate no sanity loss e.g. SAN loss: "sanLossNone".
 * "keys.<language>.fulldb" Regular expression to indicate damage bonus in attributes and weapon damage e.g. DB: "fulldb" / Weapon 50% (25/10), damage 1D6 + "fulldb".
 * "keys.<language>.halfdb" Regular expression to indicate half damage bonus in weapon damage e.g. Weapon 50% (25/10), damage 1D6 + "halfdb".
 * "keys.<language>.sectionCombats" Regular expression to indicate the start of the combat / weapon section of text.
 * "keys.<language>.newCombatHeader" If there is no combat / weapon section, add this section were it probably is, this needs to matched by "keys.<language>.sectionCombats".
 * "keys.<language>.sectionSkills" Regular expression to indicate the start of the skills section of text.
 * "keys.<language>.sectionLangauges" Regular expression to indicate the start of the languages section of text.
 * "keys.<language>.sectionSpells" Regular expression to indicate the start of the spells section of text.
 * "keys.<language>.handgun" Regular expression to match NPC combat section weapon name is a handgun type.
 * "keys.<language>.rifle" Regular expression to match NPC combat section weapon name is a rifle type.
 * "keys.<language>.smb" Regular expression to match NPC combat section weapon name is a submachine gun type.
 * "keys.<language>.machineGun" Regular expression to match NPC combat section weapon name is a machine gun type.
 * "keys.<language>.launched" Regular expression to match NPC combat section weapon name is a launched type.
 * "keys.<language>.example" String that should show as a placeholder example.
 *
 * "translations.<language>.age" Regular expression to match NPC age, named capturing group <age>.
 * "translations.<language>.occupation" Regular expression to match NPC occupation, named capturing group <occupation>.
 * "translations.<language>.str" Regular expression to match NPC strength characteristic, named capturing group <str>.
 * "translations.<language>.con" Regular expression to match NPC constitution characteristic, named capturing group <con>.
 * "translations.<language>.siz" Regular expression to match NPC size characteristic, named capturing group <siz>.
 * "translations.<language>.int" Regular expression to match NPC intelligence characteristic, named capturing group <int>.
 * "translations.<language>.pow" Regular expression to match NPC power characteristic, named capturing group <pow>.
 * "translations.<language>.dex" Regular expression to match NPC dexterity characteristic, named capturing group <dex>.
 * "translations.<language>.app" Regular expression to match NPC appearance characteristic, named capturing group <app>.
 * "translations.<language>.edu" Regular expression to match NPC education characteristic, named capturing group <edu>.
 * "translations.<language>.san" Regular expression to match NPC sanity points attribute, named capturing group <san>.
 * "translations.<language>.hp" Regular expression to match NPC hit points attribute, named capturing group <hp>.
 * "translations.<language>.mp" Regular expression to match NPC magic points attribute, named capturing group <mp>.
 * "translations.<language>.db" Regular expression to match NPC damage bonus attribute, named capturing group <db> if matching "keys.<language>.dbNone" then 0.
 * "translations.<language>.build" Regular expression to match NPC build attribute, named capturing group <build>.
 * "translations.<language>.armor" Regular expression to match NPC damage bonus attribute, named capturing group <db> if matching "keys.<language>.armorNone" then 0.
 * "translations.<language>.mov" Regular expression to match NPC movement rate attribute, named capturing group <mov>.
 * "translations.<language>.lck" Regular expression to match NPC luck attribute, named capturing group <lck>.
 * "translations.<language>.attacksPerRound" Regular expression to match NPC attacks per round, named capturing group <attacksPerRound> if matching "keys.<language>.attacksPerRoundNone" then 0.
 * "translations.<language>.sanLoss" Regular expression to match NPC san loss min/max, named capturing group <sanLoss> if matching "keys.<language>.sanLossNone" then none.
 * "translations.<language>.weapon" Regular expression to match NPC combat section, named capturing group weapon <name>, optional <percentage>, and <damage>. Damage can contain "keys.<language>.fulldb" and "keys.<language>.halfdb".
 * "translations.<language>.weaponDodge" Regular expression to match NPC combat section dodge skill, named capturing group <name> and <percentage>.
 * "translations.<language>.skill" Regular expression to match NPC skill section skill name, named capturing group <name> and <percentage>.
 * "translations.<language>.guessStartCombat" Regular expression if there is no combat section find these are likely to be the first weapon name, "keys.<language>.newCombatHeader" is then added before it to get the groups
 *
 * These should not be edited as they should work as is
 * "translations.<language>.name" Regular expression to match NPC name, named capturing group <name>.
 * "translations.<language>.sections" Regular expression to split text into combat, skill, language, and spells section
 *
 * If there is new functionality check for this string in the translations / keys for your language "NEW KEY BELOW - TRANSLATION REQUIRED"
 */
const nameCharacters =
  '\\u3000\\u3400-\\u4DBF\\u3040-\\u30FF\\u4E00-\\u9FFF\\w\\(\\)\\-\\/&"\'･（）／' +
  CoC7Utilities.quoteRegExp(
    'áéíóàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃĀÑÕäëïöüÿÄËÏÖÜŸàèçÇßØøÅåÆæœ“”«»ąćęłńóśźżĄĆĘŁŃÓŚŹŻ'
  )

const keys = {
  en: {
    description: 'CoC7.English',
    dbNone: 'none',
    armorNone: 'none',
    attacksPerRoundNone: 'none',
    sanLossNone: 'none',
    fulldb: '(' + 'Damage Bonus|DB' + ')',
    halfdb: '(' + '½|half' + ')',
    sectionCombats: '\n(?:' + 'combat|fighting attacks' + ')[:\n]',
    newCombatHeader: '\n' + 'Combat' + '\n',
    sectionSkills: '\n(?:' + 'skills' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'languages' + ')[:\n]',
    sectionSpells: '\n(?:' + 'spells' + ')[:\n]',
    handgun:
      '(?<type>' +
      ' Gun|Revolver|Pistol|Handgun|Derringer|Beretta|Luger|Desert Eagle|(^| )\\.38' +
      ')',
    rifle:
      '(?<type>' + 'Rifle|Shotgun|Carbine|Gauge |Lee-Enfield|Elephant' + ')',
    smb: '(?<type>' + 'Submachine Gun|Thompson' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers' + ')',
    launched: '(?<type>' + 'Molotov|Grenade|Dynamite' + ')',
    example:
      'Example Character, age 27\nSTR 75 CON 60 SIZ 80 DEX 70 APP 60 INT 80\nPOW 50 EDU 85 SAN 55 HP 14 DB: 1D4\nBuild: 1 Move: 7 MP: 10 Luck: 40 Armor: 1\nAttacks per round: 3 SAN loss: 1d4/1d8\nCombat\nBite 50% (25/10), damage 1D6\nBrawl 30% (15/6), damage 1D3\nDerringer 40% (20/8), damage 1D8+1\nDodge 50% (25/10)\nSkills\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nLanguages: English 80%, Eklo 5%.\nSpells: Summon NPC, Dispel NPC.'
  },
  de: {
    description: 'CoC7.German',
    dbNone: 'none',
    armorNone: 'none',
    attacksPerRoundNone: 'none',
    sanLossNone: 'none',
    diceShort: 'w|d',
    fulldb: '(' + 'Schadensbonus|Sb' + ')',
    halfdb: '(' + '½|1/2 Schadensbonus|Sb/2' + ')',
    sectionCombats: '\n(?:' + 'Kampf|Angriff:|ANGRIFFE' + ')[:\n]',
    newCombatHeader: '\n' + 'Kampf' + '\n',
    sectionSkills: '\n(?:' + 'Fertigkeiten' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'Sprachen' + ')[:\n]',
    sectionSpells: '\n(?:' + 'Zauber' + ')[:\n]',
    handgun:
      '(?<type>' +
      ' Gun|Revolver|Pistole|Handgun|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle:
      '(?<type>' +
      'Gewehr|Schrotflinte|Carabiner|Karabiner|Gauge |Lee-Enfield|Elefanten' +
      ')',
    smb: '(?<type>' + 'Submachine Gun|Thompson' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers' + ')',
    launched: '(?<type>' + 'Molotov|Granate|Dynamit' + ')',
    example:
      'Vorname Nachname\nAlter: 29\nBeruf: Ein Beruf\nST 50\nMA 60\nKO 60\nGE 60\nGR 55\nER 65\nIN 80\nBI 85\nTrefferpunkte: 11\nGeistige Stabilität: 60\nSchadensbonus: 0\nStatur: 0\nMagiepunkte: 12\nBewegungsweite: 8\n\nKampf\nAngriffe: 1\nHandgemenge 30% (15/6), Schaden 1D3\nMesser 30% (15/6), Schaden 1D4\nAusweichen 30% (15/6)\n\nFertigkeiten: Anthropologie 70% (35/14), Archäologie 30% (15/6), Bibliotheksnutzung 50% (25/10), Erste Hilfe 50% (25/10), Finanzkraft 40% (20/8), Geschichte 60% (30/12), Klettern 50% (25/10)\n\nSprachen: Englisch 85% (42/17); Deutsch 45% (22/9), Latein 45% (22/9)'
  },
  pl: {
    description: 'CoC7.Polish',
    dbNone: 'brak',
    armorNone: 'brak',
    attacksPerRoundNone: 'brak',
    sanLossNone: 'brak',
    diceShort: 'k|d',
    fulldb: '(' + 'Modyfikator Obrażeń|MO' + ')',
    halfdb: '(' + '½|1/2 MO|MO/2' + ')',
    sectionCombats: '\n(?:' + 'Walka|Ataki' + ')[:\n]',
    newCombatHeader: '\n' + 'Walka' + '\n',
    sectionSkills: '\n(?:' + 'Umiejętności' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'Języki' + ')[:\n]',
    sectionSpells: '\n(?:' + 'Zaklęcia' + ')[:\n]',
    handgun:
      '(?<type>' +
      ' Pistolet|Rewolwer|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle:
      '(?<type>' +
      'Karabin|Strzelba|Wiatrówka|Garand|Gauge |Lee-Enfield|Strzelba na słonie' +
      ')',
    smb: '(?<type>' + 'Pistolet maszynowy|Thompson' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers' + ')',
    launched: '(?<type>' + 'Mołotowa|Granat|Laska dynamitu|Dynamit' + ')',
    example:
      'Przykładowa postać, 27 lat\nBibliotekarz\nS 75 KON 60 BC 80 ZR 70 WYG 60 INT 80\nMOC 50 WYK 85 P 55 PW 14 MO: 1D4\nKrzepa: 1 Ruch: 7 PM: 10 Szczęście: 40 Pancerz: 1\nAtaki w rundzie: 3 Utrata Poczytalności: 1K4/1K8\nWalka\nUgryzienie 50% (25/10), obrażenia 1K6\nWalka 30% (15/6), obrażenia 1K3\nDerringer 40% (20/8), obrażenia 1K8+1\nUnik 50% (25/10)\nUmiejętności\nTresura Zwierząt 55%, Urok Osobisty 30%, Pierwsza Pomoc 25%, Ukrywanie 20%,\nNasłuchiwanie 50%, Medycyna 45%, Przekonywanie 25%, Psychologia 75%,\nNauka (Astronomia) 90%, Nauka (Botanika) 35%, Nauka (Zoologia) 10%,\nSpostrzegawczość 35%, Ukrywanie 10%\nJęzyki: Angielski 80%, Eklo 5%.\nZaklęcia: Przyzwanie NPC, Odesłanie NPC.'
  },
  fr: {
    description: 'CoC7.French',
    dbNone: 'Acune',
    armorNone: '(?:Acune|aucune)',
    attacksPerRoundNone: 'Acune',
    sanLossNone: 'Acune',
    fulldb: '(' + 'BD|Bonus aux dommages|Impact|Imp' + ')',
    halfdb: '(' + '½|1/2 Imp|Imp/2' + ')',
    sectionCombats: '\n(?:' + 'Combat|Armes|Attaques' + ')[:\n]',
    newCombatHeader: '\n' + 'Combat' + '\n',
    sectionSkills: '\n(?:' + 'Compétences' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'Langues?' + ')\\s*[:\n]',
    sectionSpells: '\n(?:' + 'Sortilèges\\s*|Sorts' + ')[:\n]',
    handgun:
      '(?<type>' +
      'Revolver|Pistolet|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle: '(?<type>' + 'Carabine|Lee-Enfield|Fusil' + ')',
    smb: '(?<type>' + 'SMG|Thompson' + ')',
    machineGun: '(?<type>' + 'Browning|Vickers|Mitrailleuse' + ')',
    launched:
      '(?<type>' +
      'Boomerang de guerre|Javeline|Pierre|Shuriken|Bâton de dynamite|Cocktail Molotov|Grenade à main|Molotov|Grenade|Dynamite' +
      ')',
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
    halfdb: '(' + '½|medio daño|mitad|daño a la mitad' + ')',
    sectionCombats: '\n(?:' + 'Combate|Armas' + ')[:\n]',
    newCombatHeader: '\n' + 'Combate' + '\n',
    sectionSkills: '\n(?:' + 'Habilidades' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'Idiomas|Lenguajes|Lenguas' + ')[:\n]',
    sectionSpells: '\n(?:' + 'Conjuros|Hechizos' + ')[:\n]',
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
    example:
      'Example Character, 27 años\nFUE 75 CON 60 TAM 80 DES 70 APA 60 INT 80\nPOD 50 EDU 85 COR 55 PV 14 BD: 1D4\nCorpulencia: 1 Movimiento: 7 PM: 10 Suerte: 40 Armadura: 1\nNúmero de Ataques 3 Pérdida de cordura: 1d4/1d8\nCombate\nBite 50% (25/10), daño 1D6\nBrawl 30% (15/6), daño 1D3\nDerringer 40% (20/8), daño 1D8+1\nEsquivar 50% (25/10)\nHabilidades\nAnimal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,\nListen 50%, Medicine 45%, Persuade 25%, Psychology 75%,\nScience (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,\nSpot Hidden 35%, Stealth 10%\nIdiomas: English 80%, Eklo 5%.\nConjuros: Summon NPC, Dispel NPC.'
  },
  'zh-TW': {
    description: 'CoC7.TraditionalChinese',
    dbNone: 'none',
    armorNone: 'none',
    attacksPerRoundNone: 'none',
    sanLossNone: 'none',
    fulldb: '(' + 'Damage Bonus|DB|傷害加值' + ')',
    /* NEW KEY BELOW - TRANSLATION REQUIRED */
    halfdb: '(' + '½|half' + ')',
    sectionCombats:
      '\n(?:' + 'combat|fighting attacks|戰鬥技能|戰鬥列表|武器' + ')[:\n]',
    newCombatHeader: '\n' + 'Combat' + '\n',
    sectionSkills:
      '\n(?:' + '(?:Skills|技能列表)' + '(?:\\s*\\([^\\)]+\\))?)[:\n]',
    sectionLangauges: '\n(?:' + 'Languages|語言' + ')[:\n]',
    sectionSpells: '\n(?:' + 'spells|咒文列表|咒文' + ')[:\n]',
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
    example:
      '示範角色, 年齡 27\n力量 75 體質 60 體型 80 敏捷 70 外貎 60 智力 80\n意志 50 教育 85 SAN 55 HP 14 DB: 1D4\n體格: 1 Move: 7 MP: 10 幸運: 40 護甲: 1\n攻擊次數: 3 理智喪失: 1d4/1d8\n戰鬥列表\n咬 50% (25/10), 傷害 1D6\n空手 30% (15/6), 傷害 1D3\n手槍 40% (20/8), 傷害 1D8+1\n閃避 50% (25/10)\n技能列表\n動物馴養 55%, 取悅 30%, 急救 25%, 潛行 20%,\n聆聽 50%, 藥學 45%, 精神分析 25%, 心理學 75%,\n科學 (司法科學) 90%, 科學 (密碼學) 35%, \n偵查 35%, 喬裝 10%\n語言: 粵語 80%, 讀唇 5%.\n咒文: 召喚 NPC, 指揮 NPC.'
  },
  ja: {
    description: 'CoC7.Japanese',
    dbNone: 'なし',
    armorNone: 'なし',
    attacksPerRoundNone: 'なし',
    sanLossNone: 'なし',
    fulldb: '(' + 'Damage Bonus|DB|db|ダメージ(・|･)?ボーナス' + ')',
    /* NEW KEY BELOW - TRANSLATION REQUIRED */
    halfdb: '(' + '½|half' + ')',
    sectionCombats:
      '\n(?:' + 'combat|fighting attacks|戦闘|武器' + ')[:：\n]',
    newCombatHeader: '\n' + '戦闘' + '\n',
    sectionSkills:
      '\n(?:' + '(?:Skills|技能)' + '\\s*(?:\\s*\\([^\\)]+\\))?)[:：\n]',
    sectionLangauges: '\n(?:' + 'Languages|言語' + ')\\s*[:：\n]',
    sectionSpells: '\n(?:' + 'spells|呪文' + ')\\s*[:：\n]',
    handgun:
      '(?<type>' +
      '拳銃|オートマチック|リボルバー|デリンジャー|ベレッタ|ルガー|デザート(・|･)?イーグル|Gun|Revolver|Pistol|Handgun|Derringer|Beretta|Luger|Desert Eagle| \\.38' +
      ')',
    rifle:
      '(?<type>' +
      'ライフル|ショットガン|カービン|ゲージ|リー＝エンフィールド|エレファント(・|･)?ガン|Rifle|Shotgun|Carbine|Gauge |Lee-Enfield|Elephant' +
      ')',
    smb: '(?<type>' + 'サブマシンガン|トンプソン|Submachine Gun|Thompson' + ')',
    machineGun: '(?<type>' + 'ブローニング|ヴッカース|マシンガン|Browning|Vickers' + ')',
    launched: '(?<type>' + 'モロトフ|グレネード|ダイナマイト|Molotov|Grenade|Dynamite' + ')',
    example:
      'サンプル 太郎、27歳、記者\nSTR 75 CON 60 SIZ 80 DEX 70 APP 60 INT 80\nPOW 50 EDU 85 正気度 55 耐久力 14 ダメージ・ボーナス：1D4\nビルド：1 移動：7 マジック・ポイント：10 幸運：40 装甲：1\n1ラウンドの攻撃回数：3 正気度喪失：1D4/1D8\n戦闘\n噛みつき 50% (25/10)、ダメージ 1D6\n格闘 30% (15/6)、ダメージ 1D3+DB\nデリンジャー 40% (20/8)、ダメージ 1D8+1\n回避 50% (25/10)\n技能\n言いくるめ 25%、医学 45%、隠密 10%、\n聞き耳 50%、説得 25%、心理学 75%、\n科学 (天文学) 90%、科学 (植物学) 35%、科学 (動物学) 10%、\n動物使い 55%、変装 20%、目星 35%、魅惑 30%。\n言語：英語 80%、アクロ語 5%。\n呪文：NPCの召喚、NPCの退散。'
  }
}

const translations = {
  en: {
    age: '(?<![a-z])' + 'age' + '(\\s*:)?\\s+(?<age>\\d+)[,\\s]*',
    occupation:
      '[,\\s]*' + 'Occupation' + '(\\s*:)?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'STR' + '(\\s*:)?\\s*(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON' + '(\\s*:)?\\s*(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'SIZ' + '(\\s*:)?\\s*(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT' + '(\\s*:)?\\s*(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POW' + '(\\s*:)?\\s*(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DEX' + '(\\s*:)?\\s*(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APP' + '(\\s*:)?\\s*(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'EDU' + '(\\s*:)?\\s*(?<edu>\\d+|-)[,\\s\n]*',
    san:
      '(?<![a-z])(?:' + 'SAN|Sanity' + ')(\\s*:)?\\s*(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' + 'HP|Hit points' + ')(\\s*:)?\\s*(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      'MP|Magic points' +
      ')(\\s*:)?\\s*(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.en.fulldb +
      ')(\\s*:)?\\s+(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys.en.dbNone +
      ')[,\\s\n]*',
    build: '(?<![a-z])' + 'Build' + '(\\s*:)?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Armor' +
      '(\\s*:)?\\s+(?<armor>' +
      keys.en.armorNone +
      '|\\d+)[,\\s\n]*',
    mov: '(?<![a-z])' + 'Move' + '(\\s*:)?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Luck' + '(\\s*:)?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Attacks per round|# Attacks' +
      ')(\\s*:)?\\s+(?<attacksPerRound>' +
      keys.en.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Sanity loss|SAN loss' +
      ')(\\s*:)?\\s+(?<sanLoss>' +
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
      ')(\\s*:)?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    // Skill should not be named "The player has" / "but they regenerate" required for "A Cold Fire Within"
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    guessStartCombat: '(^|(?<!,)\n)(' + 'Fighting|Firearms|Brawl|Bite' + ')',
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
  de: {
    age: '(?<![a-z])' + 'Alter' + '(\\s*:)?\\s+(?<age>\\d+)[,\\s]*',
    occupation: '[,\\s]*' + 'Beruf' + '(\\s*:)?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'ST' + '(\\s*:)?\\s*(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'KO' + '(\\s*:)?\\s*(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'GR' + '(\\s*:)?\\s*(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'IN' + '(\\s*:)?\\s*(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'MA' + '(\\s*:)?\\s*(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'GE' + '(\\s*:)?\\s*(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'ER' + '(\\s*:)?\\s*(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'BI' + '(\\s*:)?\\s*(?<edu>\\d+|-)[,\\s\n]*',
    san:
      '(?<![a-z])(?:' +
      'gS|STA|Geistige Stabilität' +
      ')(\\s*:)?\\s*(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' +
      'TP|Trefferpunkte' +
      ')(\\s*:)?\\s*(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      'MP|Magiepunkte' +
      ')(\\s*:)?\\s*(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.de.fulldb +
      ')(\\s*:)?\\s+(?<db>[+-]?\\d+(?:d\\d+|D|W\\d+)?|' +
      keys.de.dbNone +
      ')[,\\s\n]*',
    build:
      '(?<![a-z])(?:' +
      'Statur|Stat.' +
      ')(\\s*:)?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Panzerung' +
      '(\\s*:)?\\s+(?<armor>' +
      keys.de.armorNone +
      '|\\d+)[,\\s\n]*',
    mov:
      '(?<![a-z])(?:' +
      'BW|Bewegungsweite' +
      ')(\\s*:)?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Glück' + '(\\s*:)?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Angriffe pro Runde|Angriffe|Pro Runde' +
      ')(\\s*:)?\\s+(?<attacksPerRound>' +
      keys.de.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Stabilitätsverlust' +
      ')(\\s*:)?\\s+(?<sanLoss>' +
      keys.de.sanLossNone +
      '|\\d[DW]?[+\\d]*\\/\\d[DW]?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*' +
      'Schaden' +
      ')?\\s+(?<damage>(:?(:?\\d+w|d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.de.fulldb +
      '|' +
      keys.de.halfdb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d|w)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Ausweichen' +
      ')(\\s*:)?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    // Skill should not be named "The player has" / "but they regenerate" required for "A Cold Fire Within"
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,;]?\\s*',
    guessStartCombat:
      '(^|(?<!,)\n)(' +
      'Angriffe|Handgemenge|Nahkampf|Faustfeuerwaffe|Beißen' +
      ')',
    name: '^(?<name>[\\.\\s' + nameCharacters + ']+)[,\\s\n]+',
    sections:
      '(' +
      keys.de.sectionCombats +
      '|' +
      keys.de.sectionSkills +
      '|' +
      keys.de.sectionLangauges +
      '|' +
      keys.de.sectionSpells +
      ')'
  },
  pl: {
    age: '(?<age>\\d+)' + '\\s+(?:' + 'lata|lat|rok' + ')[,\\s]*',
    occupation: '[,\\s]*' + 'Zawód' + '(\\s*:)?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'S' + '(\\s*:)?\\s*(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'KON' + '(\\s*:)?\\s*(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'BC' + '(\\s*:)?\\s*(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT' + '(\\s*:)?\\s*(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'MOC' + '(\\s*:)?\\s*(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'ZR' + '(\\s*:)?\\s*(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'WYG' + '(\\s*:)?\\s*(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'WYK' + '(\\s*:)?\\s*(?<edu>\\d+|-)[,\\s\n]*',
    san:
      '(?<![a-z])(?:' +
      'P|Poczytalność' +
      ')(\\s*:)?\\s*(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' +
      'PW|Punkty Wytrzymałości' +
      ')(\\s*:)?\\s*(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      'PM|Punkty Magii' +
      ')(\\s*:)?\\s*(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.pl.fulldb +
      ')(\\s*:)?\\s+(?<db>[+-]?\\d+(?:d\\d+|D|K\\d+)?|' +
      keys.pl.dbNone +
      ')[,\\s\n]*',
    build: '(?<![a-z])' + 'Krzepa' + '(\\s*:)?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Pancerz' +
      '(\\s*:)?\\s+(?<armor>' +
      keys.pl.armorNone +
      '|\\d+)[,\\s\n]*',
    mov: '(?<![a-z])' + 'Ruch' + '(\\s*:)?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Szczęście' + '(\\s*:)?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Ataki w rundzie|# Ataki' +
      ')(\\s*:)?\\s+(?<attacksPerRound>' +
      keys.pl.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Utrata Poczytalności|utrata P' +
      ')(\\s*:)?\\s+(?<sanLoss>' +
      keys.pl.sanLossNone +
      '|\\d[DK]?[+\\d]*\\/\\d[DK]?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*' +
      'obrażenia' +
      ')?\\s+(?<damage>(:?(:?\\d+k|d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.pl.fulldb +
      '|' +
      keys.pl.halfdb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Unik' +
      ')(\\s*:)?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    // Skill should not be named "The player has" / "but they regenerate" required for "A Cold Fire Within"
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    guessStartCombat:
      '(^|(?<!,)\n)(' + 'Walka|Broń Palna|Bijatyka|Ugryzienie' + ')',
    name: '^(?<name>[\\.\\s' + nameCharacters + ']+)[,\\s\n]+',
    sections:
      '(' +
      keys.pl.sectionCombats +
      '|' +
      keys.pl.sectionSkills +
      '|' +
      keys.pl.sectionLangauges +
      '|' +
      keys.pl.sectionSpells +
      ')'
  },
  fr: {
    age: '(?<age>\\d+)\\s*' + 'ans' + '(?![a-z])[,\\s]*',
    occupation:
      '[,\\s]*' + 'Occupation' + '(\\s*:)?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'FOR' + '(\\s*:)?\\s*(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON' + '(\\s*:)?\\s*(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'TAI' + '(\\s*:)?\\s*(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT' + '(\\s*:)?\\s*(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POU' + '(\\s*:)?\\s*(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DEX' + '(\\s*:)?\\s*(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APP' + '(\\s*:)?\\s*(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'ÉDU' + '(\\s*:)?\\s*(?<edu>\\d+|-)[,\\s\n]*',
    san:
      '(?<!([a-z]|de\\s))(?:' +
      'SAN|Santé Mentale' +
      ')(\\s*:)?\\s*(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' +
      'PV|Points de vie' +
      ')(\\s*:)?\\s*(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      'PM|Points de magie' +
      ')(\\s*:)?\\s*(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.fr.fulldb +
      ')(\\s*:)?\\s+(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys.fr.dbNone +
      ')[,\\s\n]*',
    build:
      '(?<![a-z])' + 'Carrure' + '(\\s*:)?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])(?:' +
      'Armure|Protection' +
      ')(\\s*:)?\\s+(?<armor>' +
      keys.fr.armorNone +
      '|\\d+)[,\\s\n]*',
    mov:
      '(?<![a-z])(?:' +
      'Mvt|Mouvement|Déplacement' +
      ')(\\s*:)?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Chance' + '(\\s*:)?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Attaques par round' +
      ')(\\s*:)?\\s+(?<attacksPerRound>' +
      keys.fr.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Perte de Santé mentale|Perte de SAN' +
      ')(\\s*:)?\\s+(?<sanLoss>' +
      keys.fr.sanLossNone +
      '|\\dD?[+\\d]*\\/\\dD?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*(?:' +
      'dommage|dégâts' +
      '))?\\s+(?<damage>(:?(:?\\d+d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.fr.fulldb +
      '|' +
      keys.fr.halfdb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Esquiver?' +
      ')(\\s*:)?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    guessStartCombat:
      '(^|(?<!,)\n)(' + 'Au contact|À distance|Combat rapproché|Bite' + ')',
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
    occupation:
      '[,\\s]*' + 'Ocupación' + '(\\s*:)?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'FUE' + '(\\s*:)?\\s*(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON' + '(\\s*:)?\\s*(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'TAM' + '(\\s*:)?\\s*(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT' + '(\\s*:)?\\s*(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POD' + '(\\s*:)?\\s*(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DES' + '(\\s*:)?\\s*(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APA' + '(\\s*:)?\\s*(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'EDU' + '(\\s*:)?\\s*(?<edu>\\d+|-)[,\\s\n]*',
    san:
      '(?<![a-z])(?:' + 'COR|Cordura' + ')(\\s*:)?\\s*(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' +
      'PV|Puntos de vida|P\\. ?V\\.' +
      ')(\\s*:)?\\s+(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      'PM|Puntos Mágicos|Puntos de Magia' +
      ')(\\s*:)?\\s+(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.es.fulldb +
      ')(\\s*:)?\\s+(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys.es.dbNone +
      ')[,\\s\n]*',
    build:
      '(?<![a-z])' + 'Corpulencia' + '(\\s*:)?\\s+(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Armadura' +
      '(\\s*:)?\\s+(?<armor>' +
      keys.es.armorNone +
      '|\\d+)[,\\s\n]*',
    mov: '(?<![a-z])' + 'Movimiento' + '(\\s*:)?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Suerte' + '(\\s*:)?\\s+(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Número de Ataques' +
      ')(\\s*:)?\\s+(?<attacksPerRound>' +
      keys.es.attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Pérdida de cordura|Pérdida de COR' +
      ')(\\s*:)?\\s+(?<sanLoss>' +
      keys.es.sanLossNone +
      '|\\dD?[+\\d]*\\/\\dD?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*' +
      'daño' +
      ')?\\s+(?<damage>(:?(:?\\d+d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.es.fulldb +
      '|' +
      keys.es.halfdb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Esquivar' +
      ')(\\s*:)?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%(?:\\s*\\(\\d+\\/\\d+\\))?',
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    guessStartCombat:
      '(^|(?<!,)\n)(' + 'Combatir|Armas de fuego|Pelea|Mordisco' + ')',
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
    age: '(?<![a-z])' + 'age|年齡' + '(\\s*:)?\\s*(?<age>\\d+)[,\\s]*',
    /* NEW KEY BELOW - TRANSLATION REQUIRED */
    occupation:
      '[,\\s]*' + 'Occupation' + '(\\s*:)?\\s+(?<occupation>.+)[,\\s\n]*',
    str: '(?<![a-z])' + 'STR|力量' + '(\\s*:)?\\s*(?<str>\\d+|-)[,\\s\n]*',
    con: '(?<![a-z])' + 'CON|體質' + '(\\s*:)?\\s*(?<con>\\d+|-)[,\\s\n]*',
    siz: '(?<![a-z])' + 'SIZ|體型' + '(\\s*:)?\\s*(?<siz>\\d+|-)[,\\s\n]*',
    int: '(?<![a-z])' + 'INT|智力' + '(\\s*:)?\\s*(?<int>\\d+|-)[,\\s\n]*',
    pow: '(?<![a-z])' + 'POW|意志' + '(\\s*:)?\\s*(?<pow>\\d+|-)[,\\s\n]*',
    dex: '(?<![a-z])' + 'DEX|敏捷' + '(\\s*:)?\\s*(?<dex>\\d+|-)[,\\s\n]*',
    app: '(?<![a-z])' + 'APP|外貎' + '(\\s*:)?\\s*(?<app>\\d+|-)[,\\s\n]*',
    edu: '(?<![a-z])' + 'EDU|教育' + '(\\s*:)?\\s*(?<edu>\\d+|-)[,\\s\n]*',
    san:
      '(?<![a-z])(?:' +
      'SAN|Sanity|理智' +
      ')(\\s*:)?\\s*(?<san>\\d+|-)[,\\s\n]*',
    hp:
      '(?<![a-z])(?:' +
      'HP|Hit points|生命' +
      ')(\\s*:)?\\s*(?<hp>\\d+|-)[,\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      'MP|Magic points' +
      ')(\\s*:)?\\s*(?<mp>\\d+|-)[,\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys['zh-TW'].fulldb +
      ')(\\s*:)?\\s*(?<db>[+-]?\\d+(?:d\\d+|D\\d+)?|' +
      keys['zh-TW'].dbNone +
      ')[,\\s\n]*',
    build:
      '(?<![a-z])' + 'Build|體格' + '(\\s*:)?\\s*(?<build>[+-]?\\d+)[,\\s\n]*',
    armor:
      '(?<![a-z])' +
      'Armor|護甲' +
      '(\\s*:)?\\s*(?<armor>' +
      keys['zh-TW'].armorNone +
      '|\\d+)[,\\s\n]*',
    mov: '(?<![a-z])' + 'Move' + '(\\s*:)?\\s*(?<mov>\\d+)[,\\s\n]*',
    lck: '(?<![a-z])' + 'Luck|幸運' + '(\\s*:)?\\s*(?<lck>\\d+|-)[,\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      'Attacks per round|# Attacks|攻擊次數|# 攻擊' +
      ')(\\s*:)?\\s*(?<attacksPerRound>' +
      keys['zh-TW'].attacksPerRoundNone +
      '|\\d+(?!d))[,\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      'Sanity loss|SAN loss|理智喪失|SAN值損失|SAN值喪失|扣SAN' +
      ')(\\s*:)?\\s*(?<sanLoss>' +
      keys['zh-TW'].sanLossNone +
      '|\\dD?[+\\d]*\\/\\dD?[+\\d]*)[,\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t ' +
      nameCharacters +
      ']+)(\\**,?\\s+|\\*)(?:\\(|(?<percentage>\\d+)%,?(?:\\s*\\(\\d+\\/\\d+\\)\\s*,?)?)?(\\s*(?:' +
      'damage|傷害' +
      '))?\\s+(?<damage>(:?(:?\\d+d)?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys['zh-TW'].fulldb +
      '|' +
      keys['zh-TW'].halfdb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+d)?\\d+)*)+)\\)?',
    weaponDodge:
      '(?<name>' +
      'Dodge|閃避|閃躲' +
      ')(\\s*:)?\\s+\\(?(?<percentage>\\d+)\\)?\\s*%?(?:\\s*\\(\\d+\\/\\d+\\))?',
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate' +
      '))\\s+\\(?(?<percentage>\\d+)[^d]%?\\)?(\\s*\\(\\d+/\\d+\\))?[\\.,]?\\s*',
    guessStartCombat: '(^|(?<!,)\n)(' + '近戰技能|射擊技能|Brawl|Bite' + ')',
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
  },
  ja: {
    age: '[(（]?(?<age>\\d+)' + '(\\s+)*(?:' + '歳|才' + ')[)）]?[,、\\s]*',
    /* NEW KEY BELOW - TRANSLATION REQUIRED */
    occupation:
      '[,、\\s]*' + '(職業)?' + '(\\s*[:：])?\\s+(?<occupation>.+)[,、\\s\n]*',
    str: '(?<![a-z])' + 'STR' + '(\\s*[:：])?\\s*(?<str>\\d+|-)[,、\\s\n]*',
    con: '(?<![a-z])' + 'CON' + '(\\s*[:：])?\\s*(?<con>\\d+|-)[,、\\s\n]*',
    siz: '(?<![a-z])' + 'SIZ' + '(\\s*[:：])?\\s*(?<siz>\\d+|-)[,、\\s\n]*',
    int: '(?<![a-z])' + 'INT' + '(\\s*[:：])?\\s*(?<int>\\d+|-)[,、\\s\n]*',
    pow: '(?<![a-z])' + 'POW' + '(\\s*[:：])?\\s*(?<pow>\\d+|-)[,、\\s\n]*',
    dex: '(?<![a-z])' + 'DEX' + '(\\s*[:：])?\\s*(?<dex>\\d+|-)[,、\\s\n]*',
    app: '(?<![a-z])' + 'APP' + '(\\s*[:：])?\\s*(?<app>\\d+|-)[,、\\s\n]*',
    edu: '(?<![a-z])' + 'EDU' + '(\\s*[:：])?\\s*(?<edu>\\d+|-)[,、\\s\n]*',
    san:
      '(?<![a-z])(?:' +
      '(SAN|Sanity|正気度)' +
      ')(\\s*[:：])?\\s*(?<san>\\d+|-)[,、\\s\n]*',
    hp:
      '(?<![a-z])(?:' +
      '(HP|Hit points|耐久力|ヒット(・|･)?ポイント)' +
      ')(\\s*[:：])?\\s*(?<hp>\\d+|-)[,、\\s\n]*',
    mp:
      '(?<![a-z])(?:' +
      '(MP|Magic points|マジック(・|･)?ポイント)' +
      ')(\\s*[:：])?\\s*(?<mp>\\d+|-)[,、\\s\n]*',
    db:
      '(?<![a-z])(?:' +
      keys.ja.fulldb +
      ')(\\s*[:：])?\\s*(?<db>[+-]?\\s*\\d+(?:d\\d+|D\\d+)?|' +
      keys.ja.dbNone +
      ')[,、\\s\n]*',
    build:
      '(?<![a-z])' + '(Build|ビルド)' + '(\\s*[:：])?\\s*(?<build>[+-]?\\d+)[,、\\s\n]*',
    armor:
      '(?<![a-z])' +
      '(Armor|装甲)' +
      '(\\s*[:：])?\\s*(?<armor>' +
      keys.ja.armorNone +
      '|\\d+)[,、\\s\n]*',
    mov: '(?<![a-z])' + '(Move|MOV|移動率?)' + '(\\s*[:：])?\\s*(?<mov>\\d+)[,、\\s\n]*',
    lck: '(?<![a-z])' + '(Luck|幸運)' + '(\\s*[:：])?\\s*(?<lck>\\d+|-)[,、\\s\n]*',
    attacksPerRound:
      '(?<![a-z])(?:' +
      '(Attacks per round|# Attacks|((1|1 |１)ラウンドの)?攻撃回数)' +
      ')(\\s*[:：])?\\s*(?<attacksPerRound>' +
      keys.ja.attacksPerRoundNone +
      '|\\d+(?!d))[,、\\s\n]*',
    sanLoss:
      '(?<![a-z])(?:' +
      '(Sanity loss|SAN loss|正気度喪失)' +
      ')(\\s*[:：]\\D*)?\\s*(?<sanLoss>' +
      keys.ja.sanLossNone +
      '|\\dD?[+\\d]*[\\/／]\\dD?[+\\d]*)[,、\\s\n]*',
    weapon:
      '(^|\\n)(?<name>[.\\t\\w ' +
      nameCharacters +
      ']+)(\\**[,、]?\\s+|\\*)(?:\\(|(?<percentage>\\d+)[%％][,、]?(?:\\s*[\\(（]\\d+[\\/／]\\d+[\\)）]\\s*[,、]?)?)?(\\s*(?:' +
      'damage|ダメージ' +
      '))?\\s*(?<damage>(:?\\d+[dD])?\\d+(\\s*/\\s*|\\s*[+-]\\s*(?:' +
      keys.ja.fulldb +
      '|' +
      keys.ja.halfdb +
      ')\\s*|\\s*[+-]\\s*(:?\\d+[dD])?\\d+)*)\\)?',
    weaponDodge:
      '(?<name>' +
      '(Dodge|回避)' +
      ')(\\s*[:：])?\\s*\\(?(?<percentage>\\d+)\\)?\\s*[%％]?(?:\\s*[\\(（]\\d+[\\/／]\\d+[\\)）])?',
    skill:
      '^(?<name>[:\\*.\\s' +
      nameCharacters +
      ']+(?<!' +
      'The player has|but they regenerate|\\d' +
      '))[\\s:：]*\\(?(?<percentage>\\d+)[^d][%％]?\\)?(\\s*[\\(（]\\d+[\\/／]\\d+[\\)）])?\\s?[\\.,、]?\\s*',
    guessStartCombat: '(^|(?<!,)\n)(' + '近接(戦闘|格闘)|格闘|攻撃|素手|噛みつき|射撃|Brawl|Bite' + ')',
    name: '^(?<name>[\\.\\s' + nameCharacters + ']+)[,、\\s\n]+',
    sections:
      '(' +
      keys.ja.sectionCombats +
      '|' +
      keys.ja.sectionSkills +
      '|' +
      keys.ja.sectionLangauges +
      '|' +
      keys.ja.sectionSpells +
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
