/* global CONFIG CONST foundry game ui */
import { FOLDER_ID, ERAS } from '../constants.js'
import CoC7SettingsGameRules from '../apps/settings-game-rules.js'
import CoC7Utilities from '../apps/utilities.js'
import deprecated from '../deprecated.js'

export default function () {
  game.settings.registerMenu(FOLDER_ID, 'gameRules', {
    name: 'CoC7.Settings.Rules.Name',
    label: 'CoC7.Settings.Rules.Label',
    hint: 'CoC7.Settings.Rules.Hint',
    icon: 'fa-solid fa-book',
    type: CoC7SettingsGameRules,
    restricted: true
  })
  CoC7SettingsGameRules.registerSettings()

  game.settings.register(FOLDER_ID, 'dholeUploadDirectory', {
    name: 'CoC7.Settings.DholeUpload.Directory.Name',
    hint: 'CoC7.Settings.DholeUpload.Directory.Hint',
    scope: 'world',
    config: true,
    type: String,
    default: 'worlds/' + game.world.id + '/dhole-images'
  })

  game.settings.register(FOLDER_ID, 'worldEra', {
    name: 'CoC7.Settings.WorldEra.Name',
    hint: 'CoC7.Settings.WorldEra.Hint',
    scope: 'world',
    config: true,
    default: 'standard',
    type: String,
    /* // FoundryVTT V12 */
    choices: foundry.utils.isNewerVersion(game.version, 13)
      ? () => Object.entries(ERAS).reduce((c, e) => {
          c.push({
            value: e[0],
            label: game.i18n.localize(e[1].name)
          })
          return c
        }, []).sort(CoC7Utilities.sortByLabelKey).reduce((c, e) => {
          c[e.value] = e.label
          return c
        }, {})
      : Object.entries(ERAS).reduce((c, e) => {
        c[e[0]] = e[1].name
        return c
      }, {}),
    onChange: () => {
      ui.players.render(deprecated.renderForce)
      game.CoC7.skillNames.refreshList()
    }
  })

  game.settings.register(FOLDER_ID, 'showWorldEra', {
    name: 'CoC7.Settings.ShowWorldEra.Name',
    hint: 'CoC7.Settings.ShowWorldEra.Hint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
    onChange: () => {
      /* // FoundryVTT V12 */
      ui.players.render(true)
    }
  })

  game.settings.register(FOLDER_ID, 'dropCoCID', {
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
  game.settings.register(FOLDER_ID, 'displayInitDices', {
    name: 'SETTINGS.displayInitDices',
    hint: 'SETTINGS.displayInitDicesHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  /** Set displaying dices for init roll */
  game.settings.register(FOLDER_ID, 'displayInitAsText', {
    name: 'SETTINGS.displayInitAsText',
    hint: 'SETTINGS.displayInitAsTextHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })

  /**
   * Roll customizations
   */
  /** Standby rolls made by GM from player sheet */
  game.settings.register(FOLDER_ID, 'stanbyGMRolls', {
    name: 'SETTINGS.StanbyGMRolls',
    hint: 'SETTINGS.StanbyGMRollsHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  /** Allow usage of a flat dice modifier */
  game.settings.register(FOLDER_ID, 'allowFlatDiceModifier', {
    name: 'SETTINGS.AllowFlatDiceModifier',
    hint: 'SETTINGS.AllowFlatDiceModifierHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Allow usage of a flat threshold modifier */
  game.settings.register(FOLDER_ID, 'allowFlatThresholdModifier', {
    name: 'SETTINGS.AllowFlatThresholdModifier',
    hint: 'SETTINGS.AllowFlatThresholdModifierHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'defaultCheckDifficulty', {
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
  game.settings.register(FOLDER_ID, 'selfRollWhisperTarget', {
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
  game.settings.register(FOLDER_ID, 'trustedCanModfyChatCard', {
    name: 'SETTINGS.TrustedCanModfyChatCard',
    hint: 'SETTINGS.TrustedCanModfyChatCardHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Trusted players will be allowed to see chat cards private sections */
  game.settings.register(FOLDER_ID, 'trustedCanSeeChatCard', {
    name: 'SETTINGS.TrustedCanSeeChatCard',
    hint: 'SETTINGS.TrustedCanSeeChatCardHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Set the need to display actor image on chat cards */
  game.settings.register(FOLDER_ID, 'displayActorOnCard', {
    name: 'SETTINGS.DisplayActorOnCard',
    hint: 'SETTINGS.DisplayActorOnCardHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'displayCheckSuccessLevel', {
    name: 'SETTINGS.DisplayCheckSuccessLevel',
    scope: 'client',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'displayResultType', {
    name: 'SETTINGS.DisplayResultType',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean
  })
  /** Set the use of token instead of portraits */
  game.settings.register(FOLDER_ID, 'useToken', {
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
  game.settings.register(FOLDER_ID, 'enableStatusIcons', {
    name: 'SETTINGS.EnableStatusIcons',
    hint: 'SETTINGS.EnableStatusIconsHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  })
  game.settings.register(FOLDER_ID, 'gridSpaces', {
    name: 'SETTINGS.RestrictGridSpaces',
    hint: 'SETTINGS.RestrictGridSpacesHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'distanceElevation', {
    name: 'SETTINGS.CheckElevation',
    hint: 'SETTINGS.CheckElevationHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'distanceTheatreOfTheMind', {
    name: 'SETTINGS.SceneDistanceNotCalcualtedNoError',
    hint: 'SETTINGS.SceneDistanceNotCalcualtedNoErrorHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Default behavior when NPC is created on a scene */
  game.settings.register(FOLDER_ID, 'tokenDropMode', {
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
  game.settings.register(FOLDER_ID, 'overrideGameArtwork', {
    name: 'SETTINGS.OverrideGameArtwork',
    hint: 'SETTINGS.OverrideGameArtworkHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  if (game.settings.get(FOLDER_ID, 'overrideGameArtwork')) {
    game.settings.register(FOLDER_ID, 'artPauseImage', {
      name: 'SETTINGS.ArtPauseImage',
      hint: 'SETTINGS.ArtPauseImageHint',
      scope: 'world',
      config: true,
      default: 'systems/' + FOLDER_ID + '/assets/icons/time-trap.svg',
      type: String
    })
    game.settings.register(FOLDER_ID, 'artPauseText', {
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
  game.settings.register(FOLDER_ID, 'displayPlayerNameOnSheet', {
    name: 'SETTINGS.displayPlayerNameOnSheet',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'toolTipDelay', {
    name: 'CoC7.toolTipDelay',
    scope: 'world',
    config: true,
    default: 1500,
    type: Number
  })
  game.settings.register(FOLDER_ID, 'hidePartValues', {
    name: 'SETTINGS.hidePartValues',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'showIconsOnly', {
    name: 'SETTINGS.showIconsOnly',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /** Allow player to unlock the sheet outside of creation mode */
  game.settings.register(FOLDER_ID, 'playerUnlockSheetMode', {
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
  game.settings.register(FOLDER_ID, 'statusPlayerEditable', {
    name: 'SETTINGS.StatusPlayerEditable',
    hint: 'SETTINGS.StatusPlayerEditableHint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'oneBlockBackstory', {
    name: 'SETTINGS.OneBlockBackStory',
    hint: 'SETTINGS.OneBlockBackStoryHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'sheetEraIcons', {
    name: 'SETTINGS.UseIconForEras',
    hint: 'SETTINGS.UseIconForErasHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  /*
  The following settings are obsolete a CSS module will give move specific controls and allow disabling when debugging errors
  */
  game.settings.register(FOLDER_ID, 'overrideSheetArtwork', {
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'artWorkSheetBackground', {
    scope: 'world',
    config: false,
    default: "url('./assets/images/background.webp') 4 repeat",
    type: String
  })
  game.settings.register(FOLDER_ID, 'artWorkSheetBackgroundType', {
    scope: 'world',
    config: false,
    default: 'slice',
    type: String,
    choices: {
      slice: 'SETTINGS.BackgroundSlice',
      auto: 'SETTINGS.BackgroundAuto',
      contain: 'SETTINGS.BackgroundContain',
      cover: 'SETTINGS.BackgroundCover'
    }
  })
  game.settings.register(FOLDER_ID, 'artWorkOtherSheetBackground', {
    scope: 'world',
    config: false,
    default: "url( './assets/images/background.webp')",
    type: String
  })
  game.settings.register(FOLDER_ID, 'artworkSheetImage', {
    scope: 'world',
    config: false,
    default: "url('./assets/images/tentacles.webp')",
    type: String
  })
  game.settings.register(FOLDER_ID, 'artworkFrontColor', {
    scope: 'world',
    config: false,
    default: 'rgba(43,55,83,1)',
    type: String
  })
  game.settings.register(FOLDER_ID, 'artworkBackgroundColor', {
    scope: 'world',
    config: false,
    default: 'rgba(103,11,11,1)',
    type: String
  })
  game.settings.register(FOLDER_ID, 'artworkInteractiveColor', {
    scope: 'world',
    config: false,
    default: 'rgba(103,11,11,1)',
    type: String
  })
  game.settings.register(FOLDER_ID, 'artworkFixedSkillLength', {
    scope: 'world',
    config: false,
    default: true,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'artworkMainFont', {
    scope: 'world',
    config: false,
    default: '',
    type: String
  })
  game.settings.register(FOLDER_ID, 'artworkMainFontBold', {
    scope: 'world',
    config: false,
    default: '',
    type: String
  })
  /*
  The previous settings are obsolete a CSS module will give move specific controls and allow disabling when debugging errors
  */
  /**
   * Weapons
   */
  game.settings.register(FOLDER_ID, 'disregardUsePerRound', {
    name: 'SETTINGS.DisregardUsePerRound',
    hint: 'SETTINGS.DisregardUsePerRoundHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'disregardAmmo', {
    name: 'SETTINGS.DisregardAmmo',
    hint: 'SETTINGS.DisregardAmmoHint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })
  game.settings.register(FOLDER_ID, 'disregardNoTargets', {
    name: 'SETTINGS.DoNotPromptNoTargetSelected',
    hint: 'SETTINGS.DoNotPromptNoTargetSelectedHit',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  })

  /**
   * Dice So Nice
   */
  if (game.modules.get('dice-so-nice')?.active) {
    game.settings.register(FOLDER_ID, 'tenDieBonus', {
      name: 'SETTINGS.TenDieBonus',
      hint: 'SETTINGS.TenDieBonusHint',
      scope: 'client',
      config: true,
      default: 'bronze',
      type: String
    })
    game.settings.register(FOLDER_ID, 'tenDiePenalty', {
      name: 'SETTINGS.TenDiePenalty',
      hint: 'SETTINGS.TenDiePenaltyHint',
      scope: 'client',
      config: true,
      default: 'bloodmoon',
      type: String
    })
  }

  /**
   * Developer and debug settings
   */
  game.settings.register(FOLDER_ID, 'debugmode', {
    name: 'SETTINGS.DebugMode',
    hint: 'SETTINGS.DebugModeHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  })
  game.settings.register(FOLDER_ID, 'experimentalFeatures', {
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
  game.settings.register(FOLDER_ID, 'hiddendevmenu', {
    name: 'Hidden dev menu',
    hint: 'Use at your own risk',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register(FOLDER_ID, 'developmentEnabled', {
    name: 'Dev phased allowed',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register(FOLDER_ID, 'charCreationEnabled', {
    name: 'Char creation allowed',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register(FOLDER_ID, 'systemUpdateVersion', {
    name: 'System update version',
    scope: 'world',
    config: false,
    type: String,
    default: '0'
  })
  game.settings.register(FOLDER_ID, 'systemUpdatedModuleVersion', {
    scope: 'world',
    config: false,
    default: {}
  })
  game.settings.register(FOLDER_ID, 'xpEnabled', {
    name: 'Allow player users to toggle XP gain',
    scope: 'world',
    config: false,
    type: Boolean,
    default: true
  })
  game.settings.register(FOLDER_ID, 'showInstructions', {
    name: 'Show changelog/instructions',
    scope: 'world',
    config: false,
    type: String,
    default: '0'
  })
  game.settings.register(FOLDER_ID, 'InvestigatorWizardSetup', {
    name: 'Force specific setup CoC ID for Investigator Wizard',
    scope: 'world',
    config: false,
    type: String,
    default: ''
  })
  game.settings.register(FOLDER_ID, 'InvestigatorWizardQuantity', {
    name: 'Number of investigators a single user without create actor rights can own',
    scope: 'world',
    config: false,
    type: Number,
    default: 0
  })
  game.settings.register(FOLDER_ID, 'InvestigatorWizardOwnership', {
    name: 'Default permissions for non owner players',
    scope: 'world',
    config: false,
    type: Number,
    default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
  })
  game.settings.register(FOLDER_ID, 'InvestigatorWizardRerolls', {
    name: 'Allow players to reroll characteristics',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register(FOLDER_ID, 'InvestigatorWizardPointBuy', {
    name: 'Force point buy instead of setup choice',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })
  game.settings.register(FOLDER_ID, 'InvestigatorWizardQuickFire', {
    name: 'Quick fire setup values',
    scope: 'world',
    config: false,
    type: Array,
    default: []
  })
  game.settings.register(FOLDER_ID, 'InvestigatorWizardChooseValues', {
    name: 'Choose where to place rolled characteristics',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  })

  game.settings.register(FOLDER_ID, 'boutOfMadnessSummaryTable', {
    name: 'SETTINGS.BoutOfMadnessSummaryTable',
    scope: 'world',
    config: true,
    default: 'none',
    type: String,
    choices: {
      none: 'SETTINGS.LetKeeperDecide'
    }
  })

  game.settings.register(FOLDER_ID, 'boutOfMadnessRealTimeTable', {
    name: 'SETTINGS.BoutOfMadnessRealTimeTable',
    scope: 'world',
    config: true,
    default: 'none',
    type: String,
    choices: {
      none: 'SETTINGS.LetKeeperDecide'
    }
  })

  // Attempt to fix bad setting
  if (game.settings.get(FOLDER_ID, 'InvestigatorWizardChooseValues') !== true && game.settings.get(FOLDER_ID, 'InvestigatorWizardChooseValues') !== false) {
    game.settings.set(FOLDER_ID, 'InvestigatorWizardChooseValues', game.settings.get(FOLDER_ID, 'InvestigatorWizardChooseValues')[0] ?? false)
  }
  // Migrate Bout Of Madness Tables from ID to UUID
  if (game.settings.get(FOLDER_ID, 'boutOfMadnessSummaryTable') !== 'none' && game.settings.get(FOLDER_ID, 'boutOfMadnessSummaryTable').indexOf('.') === -1) {
    game.settings.set(FOLDER_ID, 'boutOfMadnessSummaryTable', 'RollTable.' + game.settings.get(FOLDER_ID, 'boutOfMadnessSummaryTable'))
  }
  if (game.settings.get(FOLDER_ID, 'boutOfMadnessRealTimeTable') !== 'none' && game.settings.get(FOLDER_ID, 'boutOfMadnessRealTimeTable').indexOf('.') === -1) {
    game.settings.set(FOLDER_ID, 'boutOfMadnessRealTimeTable', 'RollTable.' + game.settings.get(FOLDER_ID, 'boutOfMadnessRealTimeTable'))
  }
  CONFIG.debug.hooks = !!game.settings.get(FOLDER_ID, 'debugmode')
}
