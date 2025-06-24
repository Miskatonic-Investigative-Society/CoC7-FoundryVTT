/* global $, CONFIG, CONST, foundry, game, ui */
import { CoC7GameRuleSettings } from './game-rules.js'
import { COC7 } from '../config.js'
import { CoC7DecaderDie } from '../../shared/dice/decader-die.js'
import { CoC7DecaderDieOther } from '../../shared/dice/decader-die-other.js'

export function registerSettings () {
  /**
   * Rules
   */
  game.settings.registerMenu('CoC7', 'gameRules', {
    name: 'CoC7.Settings.Rules.Name',
    label: 'CoC7.Settings.Rules.Label',
    hint: 'CoC7.Settings.Rules.Hint',
    icon: 'fas fa-book',
    type: CoC7GameRuleSettings,
    restricted: true
  })
  CoC7GameRuleSettings.registerSettings()

  game.settings.register('CoC7', 'useContextMenus', {
    name: 'SETTINGS.UseContextMenus',
    hint: 'SETTINGS.UseContextMenusHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  })

  game.settings.register('CoC7', 'dholeUploadDirectory', {
    name: 'CoC7.Settings.DholeUpload.Directory.Name',
    hint: 'CoC7.Settings.DholeUpload.Directory.Hint',
    scope: 'world',
    config: true,
    type: String,
    // filePicker: 'folder',
    /* // FoundryVTT V11 */
    default: (foundry.utils.isNewerVersion(game.version, '12') ? '' : '[data] ') + 'worlds/' + game.world.id + '/dhole-images'
  })

  game.settings.register('CoC7', 'worldEra', {
    name: 'CoC7.Settings.WorldEra.Name',
    hint: 'CoC7.Settings.WorldEra.Hint',
    scope: 'world',
    config: true,
    default: 'standard',
    type: String,
    choices: COC7.eras,
    onChange: () => {
      ui.players.render(true)
    }
  })

  game.settings.register('CoC7', 'showWorldEra', {
    name: 'CoC7.Settings.ShowWorldEra.Name',
    hint: 'CoC7.Settings.ShowWorldEra.Hint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
    onChange: () => {
      ui.players.render(true)
    }
  })

  game.settings.register('CoC7', 'dropCoCID', {
    name: 'CoC7.Settings.DropCoCID.Name',
    hint: 'CoC7.Settings.DropCoCID.Hint',
    scope: 'world',
    config: true,
    default: '',
    type: String,
    choices: {
      '': 'CoC7.Settings.DropCoCID.Prompt',
      Y: 'CoC7.Settings.DropCoCID.UseCoCID',
      N: 'CoC7.Settings.DropCoCID.IgnoreCoCID'
    }
  })

  /**
   * Initiative
   */
  /** Set displaying dices for init roll */
  game.settings.register('CoC7', 'displayInitDices', {
    name: 'SETTINGS.displayInitDices',
    hint: 'SETTINGS.displayInitDicesHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  /** Set displaying dices for init roll */
  game.settings.register('CoC7', 'displayInitAsText', {
    name: 'SETTINGS.displayInitAsText',
    hint: 'SETTINGS.displayInitAsTextHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })

  /**
   * Roll customisaions
   */
  /** Standby rolls made by GM from player sheet */
  game.settings.register('CoC7', 'stanbyGMRolls', {
    name: 'SETTINGS.StanbyGMRolls',
    hint: 'SETTINGS.StanbyGMRollsHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  /** Allow usage of a flat dice modifier */
  game.settings.register('CoC7', 'allowFlatDiceModifier', {
    name: 'SETTINGS.AllowFlatDiceModifier',
    hint: 'SETTINGS.AllowFlatDiceModifierHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Allow usage of a flat threshold modifier */
  game.settings.register('CoC7', 'allowFlatThresholdModifier', {
    name: 'SETTINGS.AllowFlatThresholdModifier',
    hint: 'SETTINGS.AllowFlatThresholdModifierHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'defaultCheckDifficulty', {
    name: 'SETTINGS.DefaultDifficulty',
    hint: 'SETTINGS.DefaultDifficultyHint',
    scope: 'world',
    config: true,
    default: 'regular',
    type: String,
    choices: {
      regular: 'SETTINGS.CheckDifficultyRegular',
      unknown: 'SETTINGS.CheckDifficultyUnknown'
    }
  })
  game.settings.register('CoC7', 'selfRollWhisperTarget', {
    name: 'SETTINGS.SelfRollWhisperTarget',
    hint: 'SETTINGS.SelfRollWhisperTargetHint',
    scope: 'world',
    config: true,
    default: 'everyone',
    type: String,
    choices: {
      nobody: 'SETTINGS.DoNotAdvise',
      owners: 'SETTINGS.AdviseOwnersOnly',
      everyone: 'SETTINGS.AdviseAllPlayer'
    }
  })

  /**
   * Chat Cards
   */
  /** Trusted players will be allowed to modify chat cards */
  game.settings.register('CoC7', 'trustedCanModfyChatCard', {
    name: 'SETTINGS.TrustedCanModfyChatCard',
    hint: 'SETTINGS.TrustedCanModfyChatCardHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Trusted players will be allowed to see chat cards private sections */
  game.settings.register('CoC7', 'trustedCanSeeChatCard', {
    name: 'SETTINGS.TrustedCanSeeChatCard',
    hint: 'SETTINGS.TrustedCanSeeChatCardHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Set the need to display actor image on chat cards */
  game.settings.register('CoC7', 'displayActorOnCard', {
    name: 'SETTINGS.DisplayActorOnCard',
    hint: 'SETTINGS.DisplayActorOnCardHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'displayCheckSuccessLevel', {
    name: 'SETTINGS.DisplayCheckSuccessLevel',
    scope: 'client',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register('CoC7', 'displayResultType', {
    name: 'SETTINGS.DisplayResultType',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean
  })
  /** Set the use of token instead of portraits */
  game.settings.register('CoC7', 'useToken', {
    name: 'SETTINGS.UseToken',
    hint: 'SETTINGS.UseTokenHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })

  /**
   * Scene Settings
   */
  game.settings.register('CoC7', 'enableStatusIcons', {
    name: 'SETTINGS.EnableStatusIcons',
    hint: 'SETTINGS.EnableStatusIconsHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  })
  game.settings.register('CoC7', 'gridSpaces', {
    name: 'SETTINGS.RestrictGridSpaces',
    hint: 'SETTINGS.RestrictGridSpacesHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'distanceElevation', {
    name: 'SETTINGS.CheckElevation',
    hint: 'SETTINGS.CheckElevationHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register('CoC7', 'distanceTheatreOfTheMind', {
    name: 'SETTINGS.SceneDistanceNotCalcualtedNoError',
    hint: 'SETTINGS.SceneDistanceNotCalcualtedNoErrorHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Default behavior when NPC is created on a scene */
  game.settings.register('CoC7', 'tokenDropMode', {
    name: 'SETTINGS.TokenDropMode',
    hint: 'SETTINGS.TokenDropModeHint',
    scope: 'world',
    config: true,
    default: 'ask',
    type: String,
    choices: {
      ask: 'SETTINGS.TokenDropModeAsk',
      roll: 'SETTINGS.TokenDropModeRoll',
      average: 'SETTINGS.TokenDropModeAverage',
      ignore: 'SETTINGS.TokenDropModeIgnore'
    }
  })
  /**
   * Game Artwork Settings
   */
  game.settings.register('CoC7', 'overrideGameArtwork', {
    name: 'SETTINGS.OverrideGameArtwork',
    hint: 'SETTINGS.OverrideGameArtworkHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  if (game.settings.get('CoC7', 'overrideGameArtwork')) {
    game.settings.register('CoC7', 'artPauseImage', {
      name: 'SETTINGS.ArtPauseImage',
      hint: 'SETTINGS.ArtPauseImageHint',
      scope: 'world',
      config: true,
      default: 'systems/CoC7/assets/icons/time-trap.svg',
      type: String
    })
    game.settings.register('CoC7', 'artPauseText', {
      name: 'SETTINGS.ArtPauseText',
      hint: 'SETTINGS.ArtPauseTextHint',
      scope: 'world',
      config: true,
      default: 'The Blind Idiot God is dreaming...',
      type: String
    })
  }

  /**
   * Sheet settings
   */
  game.settings.register('CoC7', 'displayPlayerNameOnSheet', {
    name: 'SETTINGS.displayPlayerNameOnSheet',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'toolTipDelay', {
    name: 'CoC7.toolTipDelay',
    scope: 'world',
    config: true,
    default: 1500,
    type: Number
  })
  game.settings.register('CoC7', 'hidePartValues', {
    name: 'SETTINGS.hidePartValues',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'showIconsOnly', {
    name: 'SETTINGS.showIconsOnly',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Allow player to unlock the sheet outside of creation mode */
  game.settings.register('CoC7', 'playerUnlockSheetMode', {
    name: 'SETTINGS.PlayerUnlockSheetMode',
    scope: 'world',
    config: true,
    default: 'always',
    type: String,
    choices: {
      always: 'SETTINGS.AlwaysEditable',
      creation: 'SETTINGS.CreationModeOnly',
      never: 'SETTINGS.NeverEditable'
    }
  })
  /** Allow player to modify status */
  game.settings.register('CoC7', 'statusPlayerEditable', {
    name: 'SETTINGS.StatusPlayerEditable',
    hint: 'SETTINGS.StatusPlayerEditableHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register('CoC7', 'oneBlockBackstory', {
    name: 'SETTINGS.OneBlockBackStory',
    hint: 'SETTINGS.OneBlockBackStoryHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'overrideSheetArtwork', {
    name: 'SETTINGS.OverrideSheetArtwork',
    hint: 'SETTINGS.OverrideSheetArtworkHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  if (game.settings.get('CoC7', 'overrideSheetArtwork')) {
    game.settings.register('CoC7', 'artWorkSheetBackground', {
      name: 'SETTINGS.ArtWorkSheetBackground',
      hint: 'SETTINGS.ArtWorkSheetBackgroundHint',
      scope: 'world',
      config: true,
      default: "url('./assets/images/background.webp') 4 repeat",
      type: String
    })
    game.settings.register('CoC7', 'artWorkSheetBackgroundType', {
      name: 'SETTINGS.ArtWorkSheetBackgroundType',
      scope: 'world',
      config: true,
      default: 'slice',
      type: String,
      choices: {
        slice: 'SETTINGS.BackgroundSlice',
        auto: 'SETTINGS.BackgroundAuto',
        contain: 'SETTINGS.BackgroundContain',
        cover: 'SETTINGS.BackgroundCover'
      }
    })
    game.settings.register('CoC7', 'artWorkOtherSheetBackground', {
      name: 'SETTINGS.ArtWorkOtherSheetBackground',
      hint: 'SETTINGS.ArtWorkOtherSheetBackgroundHint',
      scope: 'world',
      config: true,
      default: "url( './assets/images/background.webp')",
      type: String
    })
    game.settings.register('CoC7', 'artworkSheetImage', {
      name: 'SETTINGS.ArtworkSheetImage',
      hint: 'SETTINGS.ArtworkSheetImageHint',
      scope: 'world',
      config: true,
      default: "url('./assets/images/tentacles.webp')",
      type: String
    })
    game.settings.register('CoC7', 'artworkFrontColor', {
      name: 'SETTINGS.ArtworkFrontColor',
      hint: 'SETTINGS.ArtworkFrontColorHint',
      scope: 'world',
      config: true,
      default: 'rgba(43,55,83,1)',
      type: String
    })
    game.settings.register('CoC7', 'artworkBackgroundColor', {
      name: 'SETTINGS.ArtworkBackgroundColor',
      hint: 'SETTINGS.ArtworkBackgroundColorHint',
      scope: 'world',
      config: true,
      default: 'rgba(103,11,11,1)',
      type: String
    })
    game.settings.register('CoC7', 'artworkInteractiveColor', {
      name: 'SETTINGS.ArtworkInteractiveColor',
      hint: 'SETTINGS.ArtworkInteractiveColorHint',
      scope: 'world',
      config: true,
      default: 'rgba(103,11,11,1)',
      type: String
    })
    game.settings.register('CoC7', 'artworkFixedSkillLength', {
      name: 'SETTINGS.ArtworkFixedSkillLength',
      hint: 'SETTINGS.ArtworkFixedSkillLengthHint',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean
    })
    game.settings.register('CoC7', 'artworkMainFont', {
      name: 'SETTINGS.ArtworkMainFont',
      scope: 'world',
      config: true,
      default: '',
      type: String
    })
    game.settings.register('CoC7', 'artworkMainFontBold', {
      name: 'SETTINGS.ArtworkMainFontBold',
      scope: 'world',
      config: true,
      default: '',
      type: String
    })
    game.settings.register('CoC7', 'artworkMainFontSize', {
      name: 'SETTINGS.ArtworkMainFontSize',
      scope: 'world',
      config: true,
      default: 16,
      type: Number,
      onChange: size => _setRootFontSize(size)
    })

    function _setRootFontSize (size) {
      $(':root').css('font-size', size)
      ui.sidebar.render(true)
      for (const [, w] of Object.entries(ui.windows)) {
        w.render(true)
      }
    }
  }

  /**
   * Weapons
   */
  game.settings.register('CoC7', 'disregardUsePerRound', {
    name: 'SETTINGS.DisregardUsePerRound',
    hint: 'SETTINGS.DisregardUsePerRoundHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'disregardAmmo', {
    name: 'SETTINGS.DisregardAmmo',
    hint: 'SETTINGS.DisregardAmmoHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register('CoC7', 'disregardNoTargets', {
    name: 'SETTINGS.DoNotPromptNoTargetSelected',
    hint: 'SETTINGS.DoNotPromptNoTargetSelectedHit',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })

  /**
   * Chases
   */
  // MOVED TO CHASSE INDIVIDUAL SETTING
  // game.settings.register('CoC7', 'chaseShowTokenMovement', {
  //   name: 'SETTINGS.ChaseShowTokenMovement',
  //   hint: 'SETTINGS.ChaseShowTokenMovementHint',
  //   scope: 'world',
  //   config: true,
  //   default: true,
  //   type: Boolean
  // })

  /**
   * Dice So Nice
   */
  if (game.modules.get('dice-so-nice')?.active) {
    game.settings.register('CoC7', 'syncDice3d', {
      name: 'SETTINGS.SyncDice3D',
      hint: 'SETTINGS.SyncDice3DHint',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean
    })
    const [version] = game.modules.get('dice-so-nice')?.version.split('.')
    if (!isNaN(Number(version)) && Number(version) >= 3) {
      game.settings.register('CoC7', 'tenDieBonus', {
        name: 'SETTINGS.TenDieBonus',
        hint: 'SETTINGS.TenDieBonusHint',
        scope: 'client',
        config: true,
        default: 'bronze',
        type: String
      })
      game.settings.register('CoC7', 'tenDiePenalty', {
        name: 'SETTINGS.TenDiePenalty',
        hint: 'SETTINGS.TenDiePenaltyHint',
        scope: 'client',
        config: true,
        default: 'bloodmoon',
        type: String
      })
    }
  }

  /**
   * Developer and debug settings
   */
  game.settings.register('CoC7', 'debugmode', {
    name: 'SETTINGS.DebugMode',
    hint: 'SETTINGS.DebugModeHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'experimentalFeatures', {
    name: 'SETTINGS.ShowExperimentalFeatures',
    hint: 'SETTINGS.ShowExperimentalFeaturesHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  })
  /**
   * Other settings
   */
  game.settings.register('CoC7', 'hiddendevmenu', {
    name: 'Hidden dev menu',
    hint: 'Use at your own risk',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'developmentEnabled', {
    name: 'Dev phased allowed',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  /** Feat: welcome message */
  game.settings.register('CoC7', 'showWelcomeMessage', {
    name: 'SETTINGS.showWelcomeMessage',
    hint: 'SETTINGS.showWelcomeMessage',
    scope: 'world',
    config: false,
    default: true,
    type: Boolean
  })
  game.settings.register('CoC7', 'charCreationEnabled', {
    name: 'Char creation allowed',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'systemUpdateVersion', {
    name: 'System update version',
    scope: 'world',
    config: false,
    type: String,
    default: '0'
  })
  game.settings.register('CoC7', 'systemUpdatedModuleVersion', {
    scope: 'world',
    config: false,
    default: {}
  })
  game.settings.register('CoC7', 'xpEnabled', {
    name: 'Enable XP gain',
    scope: 'world',
    config: false,
    type: Boolean,
    default: true
  })
  game.settings.register('CoC7', 'showInstructions', {
    name: 'Show changelog/instructions',
    scope: 'world',
    config: false,
    type: String,
    default: '0'
  })
  game.settings.register('CoC7', 'InvestigatorWizardSetup', {
    name: 'Force specific setup CoC ID for Investigator Wizard',
    scope: 'world',
    config: false,
    type: String,
    default: ''
  })
  game.settings.register('CoC7', 'InvestigatorWizardQuantity', {
    name: 'Number of investigators a single user without create actor rights can own',
    scope: 'world',
    config: false,
    type: Number,
    default: 0
  })
  game.settings.register('CoC7', 'InvestigatorWizardOwnership', {
    name: 'Default permissions for non owner players',
    scope: 'world',
    config: false,
    type: Number,
    default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  })
  game.settings.register('CoC7', 'InvestigatorWizardRerolls', {
    name: 'Allow players to reroll characteristics',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'InvestigatorWizardPointBuy', {
    name: 'Force point buy instead of setup choice',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register('CoC7', 'InvestigatorWizardQuickFire', {
    name: 'Quick fire setup values',
    scope: 'world',
    config: false,
    type: Array,
    default: []
  })
  game.settings.register('CoC7', 'InvestigatorWizardChooseValues', {
    name: 'Choose where to place rolled characteristics',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  /** Set an initiative formula for the system */
  CONFIG.Combat.initiative = {
    formula: '@characteristics.dex.value',
    decimals: 4
  }
  CONFIG.debug.hooks = !!game.settings.get('CoC7', 'debugmode')
  CONFIG.Dice.terms.t = CoC7DecaderDie
  CONFIG.Dice.terms.o = CoC7DecaderDieOther
}
