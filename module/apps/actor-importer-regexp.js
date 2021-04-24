'use strict'

const accentedCharacters = 'áéíóàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ'
// Regular expressions to parse actors from an english source
const englishRegExp = {
    nameRegExp: new RegExp('^[\\s\\n\\r]*(?<name>[\\w\\s\\.\\/\\(\\)\\-' + accentedCharacters + ']+),'),
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
    dbRegExp: /(?:Damage Bonus|DB):?\s+([\+-]?\d+(?:d\d+|D\d+)?)/i,
    //  attacksRegExp : /(?:Attacks|Combat):?\s+(.*)Spells/sim,
    attacksRegExp: /(?:Attacks|Fighting|Combat):?\s+(.*)\.[\n|\r]?$/sim,
    buildRegExp: /(?:Build):?\s+([\+-]?\d+)/i,
    armorRegExp: /(?:Armor):?\s+(none|\d+)/i,
    moveRegExp: /(?:Move):?\s+(\d+)/i,
    luckRegExp: /(?:Luck):?\s+(\d+)/i,
    //  spellsRegExp : /Spells:?\s+(.*)Skills/sim,
    spellsRegExp: /(?:Spells):?\s+(.*)\.[\n|\r]?$/sim,
    //  skillsRegExp : /Skills:?\s+(.*)Languages/sim,
    skillsRegExp: /(?:Skills):?\s+(.*)\.[\n|\r]?$/sim,
    dodgeRegExp: /(?<name>Dodge):?\s+\(?(?<percentage>\d+)\)?\s*%/i,
    //  languagesRegExp : /Languages:?\s+(.*)\./sim,
    languagesRegExp: /(?:Languages):?\s+(.*)\.[\n|\r]?$/sim,
    skillRegExp: new RegExp('(?<skill>[\\w\\s\\(\\).\\/' + accentedCharacters + ']+) (?<percentage>\\d+)%'),
    attacksPerRoundRegExp: /(?:Attacks per round|# Attacks):?\s+(none|\d+)/i,
    sanLossRegExp: /(?:Sanity loss|SAN loss):?\s+(none|\d[dD]?[\d\+]*\/\d[dD][\d\+]+)/i,
    weaponRegExp: new RegExp('^(?<weapon>[\\w\\s\\n\\(\\).\\/' + accentedCharacters + ']+):?[\\n\\r\\s]+(?<percentage>\\d+)%,?\\s*(?:\\(\\d+\\/\\d+\\))?\\s*,?\\s*(?:damage)\\s+(?<damage>[\\d+\\+dD\\- ]+\\s*(DB|db|damage bonus)?)', 'img'),
    stopWords: '(Spells|Skills|Sanity loss|Languages|Armor|Attacks|Combat|)',
    // Weapons regular expressions,
    handgunRegExp: /( Gun|Revolver|Pistol|Handgun|Derringer|Beretta|Luger|Desert Eagle| .38)/i,
    rifleRegExp: /(Rifle|Shotgun|Carbine|Gauge |Lee-Enfield|Elephant)/i,
    smbRegExp: /(Submachine Gun|Thompson)/i,
    machineGunRegExp: /(Browning|Vickers)/i,
    launchedWeapons: /(Molotov|Grenade|Dynamite)/i
}

// Regular expressions to parse actors from a french source
const frenchRegExp = {
    nameRegExp: new RegExp('^[\\s\\n\\r]*(?<name>[\\w\\s\\.\\/\\(\\)\\-' + accentedCharacters + ']+),'),
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
    dbRegExp: /(?:BD|Bonus aux dommages|Impact|Imp):?\s+([\+-]?\d+(?:d\d+|D\d+)?)/i,
    attacksRegExp: /(?:Attaques|Armes|Combat):?\s+(.*)\.[\n|\r]?$/sim,
    buildRegExp: /(?:Carrure):?\s+([\+-]?\d+)/i,
    armorRegExp: /(?:Armure):?\s+(Acune|\d+)/i,
    moveRegExp: /(?:Mvt|Mouvement|Déplacement):?\s+(\d+)/i,
    luckRegExp: /(?:Chance):?\s+(\d+)/i,
    spellsRegExp: /(?:Sortilèges|Sorts):?\s+(.*)\.[\n|\r]?$/sim,
    skillsRegExp: /(?:Compétences):?\s+(.*)\.[\n|\r]?$/sim,
    dodgeRegExp: /(?<name>Esquiver):?\s+\(?(?<percentage>\d+)\)?\s*%/i,
    languagesRegExp: /(?:Langue):?\s+(.*)\.[\n|\r]?$/sim,
    skillRegExp: new RegExp('(?<skill>[\\w\\s\\(\\).\\/' + accentedCharacters + ']+) (?<percentage>\\d+)%'),
    attacksPerRoundRegExp: /(?:Attaques par round):?\s+(Acune|\d+)/i,
    sanLossRegExp: /(?:Perte de [Santé mentale|SAN]):?\s+(no|\d[dD]?[\d\+]*\/\d[dD][\d\+]+)/i,
    weaponRegExp: new RegExp('^(?<weapon>[\\w\\s\\n\\(\\).\\/' + accentedCharacters + ']+):?[\\n\\r\\s]+(?<percentage>\\d+)%,?\\s*(?:\\(\\d+\\/\\d+\\))?\\s*,?\\s*(?:dommage|dégâts)\\s+(?<damage>[\\d+\\+dD\\- ]+\\s*(Impact|Imp)?)', 'img'),
    stopWords: '(Langue|Armure|Carrure|Perte de Santé mentale|Compétences|Combat|Armes|Attaques)',
    // Weapons regular expressions,
    handgunRegExp: /(Revolver|Pistolet|Derringer|Beretta|Luger|Desert Eagle| .38)/i,
    rifleRegExp: /(Carabine|Lee-Enfield|Fusil)/i,
    smbRegExp: /(SMG|Thompson)/i,
    machineGunRegExp: /(Browning|Vickers|Mitrailleuse)/i,
    launchedWeapons: /(Molotov|Grenade|Dynamite)/i,
}


// Regular expressions to parse actors from a spanish source
const spanishRegExp = {
    nameRegExp: new RegExp('^[\\s\\n\\r]*(?<name>[\\w\\s\\.\\/\\(\\)\\-' + accentedCharacters + ']+),'),
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
    dbRegExp: /(?:BD):?\s+([\+-]?\d+(?:d\d+|D\d+)?)/i,
    attacksRegExp: /(?:Combate|Armas):?\s+(.*)\.[\n|\r]?$/sim,
    buildRegExp: /(?:Corpulencia):?\s+([\+-]?\d+)/i,
    armorRegExp: /(?:Armadura):?\s+(ninguna|\d+)/i,
    moveRegExp: /(?:Movimiento):?\s+(\d+)/i,
    luckRegExp: /(?:Suerte):?\s+(\d+)/i,
    spellsRegExp: /(?:Conjuros|Hechizos):?\s+(.*)\.[\n|\r]?$/sim,
    skillsRegExp: /(?:Habilidades):?\s+(.*)\.[\n|\r]?$/sim,
    dodgeRegExp: /(?<name>Esquivar):?\s+\(?(?<percentage>\d+)\)?\s*%/i,
    languagesRegExp: /(?:Idiomas|Lenguajes|Lenguas):?\s+(.*)\.[\n|\r]?$/sim,
    skillRegExp: new RegExp('(?<skill>[\\w\\s\\(\\).\\/' + accentedCharacters + ']+) (?<percentage>\\d+)%'),
    attacksPerRoundRegExp: /(?:Número de Ataques):?\s+(ninguno|\d+)/i,
    sanLossRegExp: /(?:Pérdida de cordura|Pérdida de COR):?\s+(no|\d[dD]?[\d\+]*\/\d[dD][\d\+]+)/i,
    weaponRegExp: new RegExp('^(?<weapon>[\\w\\s\\n\\(\\).\\/' + accentedCharacters + ']+):?[\\n\\r\\s]+(?<percentage>\\d+)%,?\\s*(?:\\(\\d+\\/\\d+\\))?\\s*,?\\s*(?:daño)\\s+(?<damage>[\\d+\\+dD\\- ]+\\s*(BD|bd|bonificación de daño)?)', 'img'),
    stopWords: '(Conjuros|Habilidades|Pérdida de cordura|Idiomas|Lenguajes|Lenguas|Armadura|Combate|Armas)',
    // Weapons regular expressions,
    handgunRegExp: /(Revolver|Pistola|Derringer|Beretta|Luger|Desert Eagle| .38)/i,
    rifleRegExp: /(Rifle|Carabina|Lee-Enfield|Caza Elefantes|Fusil|Escopeta|Galga|Recortada)/i,
    smbRegExp: /(Subfusil|Thompson)/i,
    machineGunRegExp: /(Browning|Vickers|Ametralladora)/i,
    launchedWeapons: /(Molotov||Granada|Dinamita)/i,
}


/**
 * CoC7ActorImporterRegExp is a class to get the set of regular expressions corresponding on a language 
 */
export class CoC7ActorImporterRegExp {

    static optionLangRegExp = /coc-(?<langcode>\w\w)/

    constructor() {
        this.RE = CoC7ActorImporterRegExp.getRegularExpressions(game.i18n.lang);
    }
    /**
     * getRegularExpressions returns the object with the regular expressions corresponding to the given language
     * @param {string} lang language code for the regular expressions ("en", "es", "fr",...)
     * @returns an object with the set of regular expressions 
     */    
    static getRegularExpressions(lang) {
        console.debug("Set RegExp Lang: ", lang);
        switch (lang) {
            case "es":
                return spanishRegExp;
            case "fr":
                return frenchRegExp;
            // By default use english regular expressions.
            default:
                return englishRegExp;
        }
        return englishRegExp;
    }
}