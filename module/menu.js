/* global canvas, foundry, game, PlaceablesLayer */
import { CoC7Chat } from './chat.js'
import { CoC7Utilities } from './utilities.js'
import { CoC7ActorImporterDialog } from './apps/actor-importer-dialog.js'
import { CoC7LinkCreationDialog } from './apps/link-creation-dialog.js'

class CoC7MenuLayer extends PlaceablesLayer {
  constructor () {
    super()
    this.objects = {}
  }

  static get layerOptions () {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: 'coc7menu',
      zIndex: 60
    })
  }

  static get documentName () {
    return 'Token'
  }

  get placeables () {
    return []
  }
}

export class CoC7Menu {
  static getButtons (controls) {
    canvas.coc7gmtools = new CoC7MenuLayer()
    const isGM = game.user.isGM
    const showHiddenDevMenu = game.settings.get('CoC7', 'hiddendevmenu')
    controls.push({
      name: 'coc7menu',
      title: 'CoC7.GmTools',
      layer: 'coc7gmtools',
      icon: 'game-icon game-icon-tentacle-strike',
      visible: isGM,
      tools: [
        {
          toggle: true,
          icon: 'fas fa-angle-double-up',
          name: 'devphase',
          active: game.settings.get('CoC7', 'developmentEnabled'),
          title: 'CoC7.DevPhase',
          onClick: async toggle => await CoC7Utilities.toggleDevPhase(toggle)
        },
        {
          toggle: true,
          icon: 'fas fa-user-edit',
          name: 'charcreate',
          active: game.settings.get('CoC7', 'charCreationEnabled'),
          title: 'CoC7.CharCreationMode',
          onClick: async toggle =>
            await CoC7Utilities.toggleCharCreation(toggle)
        },
        {
          button: true,
          icon: 'fas fa-user-plus',
          name: 'actor-import',
          title: 'CoC7.ActorImporter',
          onClick: async () => await CoC7ActorImporterDialog.create()
        },
        {
          toggle: true,
          icon: 'fas fa-certificate',
          class: 'xp_toggle',
          name: 'xptoggle',
          active: game.settings.get('CoC7', 'xpEnabled'),
          title: 'CoC7.toggleXP',
          onClick: async toggle => await CoC7Utilities.toggleXPGain(toggle)
        },
        {
          button: true,
          icon: 'game-icon game-icon-card-joker',
          name: 'fakeroll',
          title: 'CoC7.FakeRoll',
          onClick: CoC7Chat.fakeRollMessage
        },
        {
          button: true,
          icon: 'fas fa-moon',
          name: 'startrest',
          title: 'CoC7.startRest',
          onClick: async () => await CoC7Utilities.getTarget()
        }
      ]
    })
    if (showHiddenDevMenu) {
      canvas.coc7DevTools = new CoC7MenuLayer()
      controls.push({
        name: 'coc7DevMenu',
        title:
          "Dev tools. If you don't know what it is, you don't need it and you shouldn't use it !!",
        layer: 'coc7DevTools',
        icon: 'game-icon game-icon-police-badge',
        visible: isGM,
        tools: [
          {
            toggle: true,
            icon: 'game-icon game-icon-dice-fire',
            name: 'alwaysCrit',
            active: game.CoC7.dev.dice.alwaysCrit,
            title: 'All rolls will crit',
            onClick: toggle => {
              game.CoC7.dev.dice.alwaysFumble = false
              game.CoC7.dev.dice.alwaysCrit = toggle
            }
          },
          {
            toggle: true,
            icon: 'game-icon game-icon-fire-extinguisher',
            name: 'alwaysFumble',
            active: game.CoC7.dev.dice.alwaysFumble,
            title: 'All rolls will fumble',
            onClick: toggle => {
              game.CoC7.dev.dice.alwaysFumble = toggle
              game.CoC7.dev.dice.alwaysCrit = false
            }
          }
        ]
      })
    }
  }

  static renderControls (app, html, data) {
    const isGM = game.user.isGM
    const keeperMenu = html.find('.game-icon-tentacle-strike').parent()
    keeperMenu.addClass('coc7-menu')
    if (isGM) {
      keeperMenu.after(
        '<li class="scene-control coc7-menu coc7-create-link" title="' +
          game.i18n.localize('CoC7.CreateLink') +
          '"><i class="fas fa-link"></i></li>'
      )
    }
    keeperMenu.after(
      '<li class="scene-control coc7-menu coc7-dice-roll" title="' +
        game.i18n.localize('CoC7.RollDice') +
        '"><i class="game-icon game-icon-d10"></i></li>'
    )
    html
      .find('.coc7-menu.coc7-dice-roll')
      .click(event => CoC7Utilities.rollDice(event))
    html
      .find('.coc7-menu.coc7-create-link')
      .click(event => CoC7LinkCreationDialog.create(event))
  }
}
