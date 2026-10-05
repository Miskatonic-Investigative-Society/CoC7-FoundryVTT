// cSpell:words devphase charcreate xptoggle fakeroll startrest gmtools
import { FOLDER_ID } from '../constants.js'
import CoC7ActorImporterDialog from '../apps/actor-importer-dialog.js'
import CoC7InvestigatorWizard from '../apps/investigator-wizard.js'
import CoC7Utilities from '../apps/utilities.js'
import CoCIDActorUpdateItems from '../apps/coc-id-actor-update-items.js'
import CoCIDCompendiumPopulate from '../apps/coc-id-compendium-populate.js'

/**
 * Get Scene Control Buttons
 * @param {SceneControl} controls
 */
export default function (controls) {
  controls.coc7menu = {
    name: 'coc7menu',
    title: 'CoC7.GmTools',
    order: Object.keys(controls).length,
    icon: 'game-icon game-icon-tentacle-strike',
    activeTool: null,
    visible: game.user.isGM,
    tools: {
      devphase: {
        toggle: true,
        icon: 'fa-solid fa-angle-double-up',
        name: 'devphase',
        active: game.settings.get(FOLDER_ID, 'developmentEnabled'),
        title: 'CoC7.DevPhase',
        onChange: (event, toggled) => CoC7Utilities.toggleDevPhase(toggled)
      },
      charcreate: {
        toggle: true,
        icon: 'fa-solid fa-user-edit',
        name: 'charcreate',
        active: game.settings.get(FOLDER_ID, 'charCreationEnabled'),
        title: 'CoC7.CharCreationMode',
        onChange: (event, toggled) => CoC7Utilities.toggleCharCreation(toggled)
      },
      'actor-coc-id-best': {
        button: true,
        icon: 'fa-solid fa-fingerprint',
        name: 'actor-coc-id-best',
        title: 'CoC7.ActorCoCIDItemsBest',
        onChange: () => CoCIDActorUpdateItems.create()
      },
      'cocid-compendium-import': {
        button: true,
        icon: 'fa-solid fa-book-user',
        name: 'cocid-compendium-import',
        title: 'CoC7.CoCIDCompendiumPopulate',
        onChange: () => CoCIDCompendiumPopulate.create()
      },
      'actor-import': {
        button: true,
        icon: 'fa-solid fa-user-plus',
        name: 'actor-import',
        title: 'CoC7.ActorImporter',
        onChange: () => CoC7ActorImporterDialog.create()
      },
      'investigator-wizard': {
        button: true,
        icon: 'fa-solid fa-user-check',
        name: 'investigator-wizard',
        title: 'CoC7.InvestigatorWizard.Title',
        onChange: () => CoC7InvestigatorWizard.create()
      },
      xptoggle: {
        toggle: true,
        icon: 'fa-solid fa-certificate',
        name: 'xptoggle',
        active: game.settings.get(FOLDER_ID, 'xpEnabled'),
        title: 'CoC7.toggleXP',
        onChange: (event, toggled) => CoC7Utilities.toggleXPGain(toggled)
      },
      fakeroll: {
        button: true,
        icon: 'game-icon game-icon-card-joker',
        name: 'fakeroll',
        title: 'CoC7.FakeRoll',
        onChange: () => CoC7Utilities.fakeRollMessage()
      },
      startrest: {
        button: true,
        icon: 'fa-solid fa-moon',
        name: 'startrest',
        title: 'CoC7.startRest',
        onChange: () => CoC7Utilities.restTargets()
      }
    }
  }
  if (game.settings.get(FOLDER_ID, 'hiddendevmenu')) {
    controls.coc7devMenu = {
      name: 'coc7devMenu',
      title: 'Dev tools. If you don\'t know what it is, you don\'t need it and you shouldn\'t use it !!',
      order: Object.keys(controls).length,
      icon: 'game-icon game-icon-police-badge',
      activeTool: null,
      visible: game.user.isGM,
      tools: {
        alwaysCrit: {
          toggle: true,
          icon: 'game-icon game-icon-dice-fire',
          name: 'alwaysCrit',
          active: game[FOLDER_ID].dev.dice.alwaysCrit,
          title: 'All rolls will crit',
          onChange: (event, toggled) => {
            game[FOLDER_ID].dev.dice.alwaysCrit = toggled
            if (toggled && game[FOLDER_ID].dev.dice.alwaysFumble) {
              document.querySelector('button[data-action="tool"][data-tool="alwaysFumble"]')?.click()
            }
          }
        },
        alwaysFumble: {
          toggle: true,
          icon: 'game-icon game-icon-fire-extinguisher',
          name: 'alwaysFumble',
          active: game[FOLDER_ID].dev.dice.alwaysFumble,
          title: 'All rolls will fumble',
          onChange: (event, toggled) => {
            game[FOLDER_ID].dev.dice.alwaysFumble = toggled
            if (toggled && game[FOLDER_ID].dev.dice.alwaysCrit) {
              document.querySelector('button[data-action="tool"][data-tool="alwaysCrit"]')?.click()
            }
          }
        }
      }
    }
  }
  /* // FoundryVTT V13 */
  if (game.release.generation === 13) {
    for (const key of ['coc7menu', 'coc7devMenu']) {
      if (typeof controls[key] !== 'undefined') {
        controls[key].tools.coc7dummy = {
          icon: '',
          name: 'coc7dummy',
          active: false,
          title: '',
          onChange: () => {
          }
        }
        controls[key].activeTool = 'coc7dummy'
        controls[key].order++
      }
    }
  }
}
