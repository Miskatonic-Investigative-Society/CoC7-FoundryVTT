/* global canvas game */
// cSpell:words devphase charcreate xptoggle fakeroll startrest gmtools
import { FOLDER_ID } from '../constants.js'
import CoC7ActorImporterDialog from './actor-importer-dialog.js'
import CoC7ContentLinkDialog from './content-link-dialog.js'
import CoC7InvestigatorWizard from './investigator-wizard.js'
import CoC7MenuLayer from './menu-layer.js'
import CoC7Utilities from './utilities.js'
import CoCIDActorUpdateItems from './coc-id-actor-update-items.js'
import CoCIDCompendiumPopulate from './coc-id-compendium-populate.js'

export default class CoC7SceneControls {
  /**
   * Get Scene Control Buttons
   * @param {SceneControl} controls
   */
  static getButtons (controls) {
    const isKeeper = game.user.isGM
    const menu = {
      name: 'coc7menu',
      title: 'CoC7.GmTools',
      order: 11,
      icon: 'game-icon game-icon-tentacle-strike',
      activeTool: 'coc7dummy',
      visible: isKeeper,
      onChange: (event, active) => {
      },
      onToolChange: (event, tool) => {
      },
      tools: {
        coc7dummy: {
          icon: '',
          name: 'coc7dummy',
          active: false,
          title: '',
          onChange: () => {
          }
        },
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
    if (Array.isArray(controls)) {
      /* // FoundryVTT v12 */
      menu.tools = Object.keys(menu.tools).reduce((c, i) => {
        if (i === 'coc7dummy') {
          return c
        }
        if (menu.tools[i].toggle === true) {
          const onChange = menu.tools[i].onChange
          menu.tools[i].onClick = (toggled) => {
            onChange(null, toggled)
          }
        }
        c.push(menu.tools[i])
        return c
      }, [])
      canvas.coc7gmtools = new CoC7MenuLayer()
      menu.layer = 'coc7gmtools'
      controls.push(menu)
    } else {
      controls.coc7menu = menu
    }
    if (game.settings.get(FOLDER_ID, 'hiddendevmenu')) {
      const menu = {
        name: 'coc7devMenu',
        title: 'Dev tools. If you don\'t know what it is, you don\'t need it and you shouldn\'t use it !!',
        order: 12,
        icon: 'game-icon game-icon-police-badge',
        activeTool: 'coc7dummy',
        visible: isKeeper,
        onChange: (event, active) => {
        },
        onToolChange: (event, tool) => {
        },
        tools: {
          coc7dummy: {
            icon: '',
            name: 'coc7dummy',
            active: false,
            title: '',
            onChange: () => {
            }
          },
          alwaysCrit: {
            toggle: true,
            icon: 'game-icon game-icon-dice-fire',
            name: 'alwaysCrit',
            active: game.CoC7.dev.dice.alwaysCrit,
            title: 'All rolls will crit',
            onChange: (event, toggled) => {
              game.CoC7.dev.dice.alwaysCrit = toggled
              if (toggled && game.CoC7.dev.dice.alwaysFumble) {
                document.querySelector('button[data-action="tool"][data-tool="alwaysFumble"]')?.click()
                /* // FoundryVTT V12 */
                document.querySelector('li.control-tool.toggle[data-tool="alwaysFumble"]')?.click()
              }
            }
          },
          alwaysFumble: {
            toggle: true,
            icon: 'game-icon game-icon-fire-extinguisher',
            name: 'alwaysFumble',
            active: game.CoC7.dev.dice.alwaysFumble,
            title: 'All rolls will fumble',
            onChange: (event, toggled) => {
              game.CoC7.dev.dice.alwaysFumble = toggled
              if (toggled && game.CoC7.dev.dice.alwaysCrit) {
                document.querySelector('button[data-action="tool"][data-tool="alwaysCrit"]')?.click()
                /* // FoundryVTT V12 */
                document.querySelector('li.control-tool.toggle[data-tool="alwaysCrit"]')?.click()
              }
            }
          }
        }
      }
      if (Array.isArray(controls)) {
        /* // FoundryVTT v12 */
        menu.tools = Object.keys(menu.tools).reduce((c, i) => {
          if (i === 'coc7dummy') {
            return c
          }
          if (menu.tools[i].toggle === true) {
            const onChange = menu.tools[i].onChange
            menu.tools[i].onClick = (toggled) => {
              onChange(null, toggled)
            }
          }
          c.push(menu.tools[i])
          return c
        }, [])
        canvas.coc7devMenu = new CoC7MenuLayer()
        menu.layer = 'coc7devMenu'
        controls.push(menu)
      } else {
        controls.coc7devMenu = menu
      }
    }
  }

  /**
   * Render Controls
   * @param {ApplicationV2} application
   * @param {HTMLElement} element
   * @param {ApplicationRenderContext} context
   * @param {ApplicationRenderOptions} options
   */
  static renderControls (application, element, context, options) {
    const isKeeper = game.user.isGM
    /* // FoundryVTT V12 */
    if (typeof element.querySelector === 'function') {
      const keeperMenu = element.querySelector('.game-icon-tentacle-strike')?.parentNode
      if (keeperMenu && !keeperMenu.classList.contains('coc7-menu')) {
        keeperMenu.classList.add('coc7-menu')
        if (isKeeper) {
          const menuLi = document.createElement('li')
          const menuButton = document.createElement('button')
          menuButton.classList.add('control', 'ui-control', 'tool', 'icon', 'coc7-menu', 'coc7-create-link', 'fa-solid', 'fa-link')
          menuButton.type = 'button'
          menuButton.dataset.tooltip = 'CoC7.CreateLink'
          menuLi.appendChild(menuButton)
          keeperMenu.insertAdjacentHTML('afterend', menuLi.outerHTML)
          element.querySelector('button.coc7-create-link').addEventListener('click', event => CoC7ContentLinkDialog.create())
        }
        {
          const menuLi = document.createElement('li')
          const menuButton = document.createElement('button')
          menuButton.classList.add('control', 'ui-control', 'tool', 'icon', 'coc7-menu', 'coc7-dice-roll', 'game-icon', 'game-icon-d10')
          menuButton.type = 'button'
          menuButton.dataset.tooltip = 'CoC7.RollDice'
          menuLi.appendChild(menuButton)
          keeperMenu.insertAdjacentHTML('afterend', menuLi.outerHTML)
          element.querySelector('.coc7-menu.coc7-dice-roll').addEventListener('click', event => CoC7Utilities.rollDice(event))
        }
      }
    } else {
      const keeperMenu = element.find('.game-icon-tentacle-strike').parent()
      keeperMenu.addClass('coc7-menu')
      if (isKeeper) {
        keeperMenu.after('<li class="scene-control coc7-menu coc7-create-link" data-tooltip="CoC7.CreateLink"><i class="fa-solid fa-link"></i></li>')
      }
      keeperMenu.after('<li class="scene-control coc7-menu coc7-dice-roll" data-tooltip="CoC7.RollDice"><i class="game-icon game-icon-d10"></i></li>')
      element.find('.coc7-menu.coc7-dice-roll').click(event => CoC7Utilities.rollDice(event))
      element.find('.coc7-menu.coc7-create-link').click(event => CoC7ContentLinkDialog.create())
    }
  }
}
