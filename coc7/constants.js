export const FOLDER_ID = 'CoC7'

export const ERAS = {
  standard: {
    name: 'CoC7.Era1920',
    icon: 'game-icon game-icon-mustache'
  },
  modern: {
    name: 'CoC7.EraModern',
    icon: 'game-icon game-icon-billed-cap'
  },
  modernPulp: {
    name: 'CoC7.EraModernPulp',
    icon: 'game-icon game-icon-captain-hat-profile'
  },
  pulp: {
    name: 'CoC7.EraPulp',
    icon: 'game-icon game-icon-fedora'
  },
  downDarkerTrails: {
    name: 'CoC7.EraDownDarkerTrails',
    icon: 'game-icon game-icon-western-hat'
  },
  downDarkerTrailsPulp: {
    name: 'CoC7.EraDownDarkerTrailsPulp',
    icon: 'game-icon game-icon-bandit'
  },
  darkAges: {
    name: 'CoC7.EraDarkAges',
    icon: 'game-icon game-icon-barbute'
  },
  darkAgesPulp: {
    name: 'CoC7.EraDarkAgesPulp',
    icon: 'game-icon game-icon-heavy-helm'
  },
  regency: {
    name: 'CoC7.EraRegency',
    icon: 'game-icon game-icon-top-hat'
  },
  regencyPulp: {
    name: 'CoC7.EraRegencyPulp',
    icon: 'game-icon game-icon-carnival-mask'
  },
  reignOfTerror: {
    name: 'CoC7.EraReignOfTerror',
    icon: 'game-icon game-icon-guillotine'
  },
  gasLight: {
    name: 'CoC7.EraGasLight',
    icon: 'game-icon game-icon-old-lantern'
  },
  gasLightPulp: {
    name: 'CoC7.EraGasLightPulp',
    icon: 'game-icon game-icon-wall-light'
  },
  invictus: {
    name: 'CoC7.EraInvictus',
    icon: 'game-icon game-icon-centurion-helmet'
  }
}

export const MONETARY_FORMAT_KEYS = {
  decimalLeft: 'decimalLeft',
  decimalRight: 'decimalRight',
  integerLeft: 'integerLeft',
  integerRight: 'integerRight',
  lsd: 'lsd',
  roman: 'roman'
}

export const MONETARY_FORMATS = {
  decimalLeft: 'CoC7.MonetaryFormatDecimalLeft',
  decimalRight: 'CoC7.MonetaryFormatDecimalRight',
  integerLeft: 'CoC7.MonetaryFormatIntegerLeft',
  integerRight: 'CoC7.MonetaryFormatIntegerRight',
  lsd: 'CoC7.MonetaryFormatLsd',
  roman: 'CoC7.MonetaryFormatRoman'
}

export const MONETARY_TYPE_KEYS = {
  none: 'none',
  asses: 'asses',
  sestertii: 'sestertii',
  quinarii: 'quinarii',
  denarii: 'denarii',
  d: 'd',
  s: 's',
  value: 'value',
  multiplier: 'multiplier'
}

export const MONETARY_TYPES = {
  none: {
    name: 'CoC7.MonetaryTypeNone',
    filter: []
  },
  asses: {
    name: 'CoC7.MonetaryTypeAsses',
    filter: ['roman']
  },
  sestertii: {
    name: 'CoC7.MonetaryTypeSestertii',
    filter: ['roman']
  },
  quinarii: {
    name: 'CoC7.MonetaryTypeQuinarii',
    filter: ['roman']
  },
  denarii: {
    name: 'CoC7.MonetaryTypeDenarii',
    filter: ['roman']
  },
  d: {
    name: 'CoC7.MonetaryTypeDeniers',
    filter: ['lsd']
  },
  s: {
    name: 'CoC7.MonetaryTypeSous',
    filter: ['lsd']
  },
  value: {
    name: 'CoC7.MonetaryTypeOne',
    filter: []
  },
  multiplier: {
    name: 'CoC7.MonetaryTypeCreditRating',
    filter: []
  }
}

export const STATUS_EFFECTS = {
  tempoInsane: 'tempoInsane',
  indefInsane: 'indefInsane',
  unconscious: 'unconscious',
  criticalWounds: 'criticalWounds',
  dying: 'dying',
  prone: 'prone',
  dead: 'dead'
}

export const FIGHTING_NAMES = {
  fighting: 'CoC7.FightingSpecializationName',
  firearm: 'CoC7.FirearmSpecializationName',
  ranged: 'CoC7.RangedSpecializationName'
}

export const DICE_POOL_REASONS = {
  outnumbered: {
    forBonus: true,
    forPenalty: false,
    forMelee: true,
    forRanged: false,
    name: 'CoC7.OutNumbered',
    tooltip: 'CoC7.TitleOutNumbered'
  },
  surprised: {
    forBonus: true,
    forPenalty: false,
    forMelee: true,
    forRanged: false,
    name: 'CoC7.combatCard.surprised',
    tooltip: 'CoC7.TitleSurprised'
  },
  cover: {
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    name: 'CoC7.rangeCombatCard.Cover',
    tooltip: 'CoC7.rangeCombatCard.CoverTitle'
  },
  surprisedRanged: {
    forBonus: true,
    forPenalty: false,
    forMelee: false,
    forRanged: true,
    name: 'CoC7.combatCard.surprised',
    tooltip: 'CoC7.rangeCombatCard.SurprisedTargetTitle'
  },
  pointBlankRange: {
    forBonus: true,
    forPenalty: false,
    forMelee: false,
    forRanged: true,
    name: 'CoC7.rangeCombatCard.PointBlankRange',
    tooltip: 'CoC7.rangeCombatCard.PointBlankRangeTitle'
  },
  inMelee: {
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    name: 'CoC7.rangeCombatCard.InMelee',
    tooltip: 'CoC7.rangeCombatCard.InMeleeTitle'
  },
  fast: {
    forBonus: false,
    forPenalty: true,
    forMelee: false,
    forRanged: true,
    name: 'CoC7.rangeCombatCard.FastMovingTarget',
    tooltip: 'CoC7.rangeCombatCard.FastMovingTargetTitle'
  }
}

export const TARGET_ALLOWED = [
  'character',
  'creature',
  'npc',
  'vehicle'
]

export const TRADE_ALLOWED = [
  'character',
  'creature',
  'npc',
  'container'
]
