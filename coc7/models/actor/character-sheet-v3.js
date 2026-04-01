/* global foundry game */
import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorCharacterSheetV2 from './character-sheet-v2.js'

export default class CoC7ModelsActorCharacterSheetV3 extends CoC7ModelsActorCharacterSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ['investigator'],
    position: {
      width: 980,
      height: 811
    },
    window: {
      resizable: true
    }
  }

  static PARTS = {
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    sheetExtras: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/parts/sheet-extras.hbs'
    },
    body: {
      template: 'systems/' + FOLDER_ID + '/templates/actors/investigator-v3/body.hbs',
      scrollable: [
        'aside.personal-details div.scroll-container',
        'section.tab.activeEffects',
        'section.tab.background',
        'section.tab.combat',
        'section.tab.development',
        'section.tab.keeper',
        'section.tab.portraitConfig',
        'section.tab.possessions',
        'section.tab.skills'
      ]
    }
  }

  /**
   * @inheritdoc
   * @param {RenderOptions} options
   * @returns {Promise<ApplicationRenderContext>}
   */
  async _prepareContext (options) {
    const context = await super._prepareContext(options)

    const hp = context.document.system.attribs.hp
    context.imgSaturation = (hp.max ? hp.value / hp.max : 0)

    const tabs = {
      background: {
        cssClass: 'tab background',
        icon: '',
        label: 'CoC7.Background'
      },
      possessions: {
        cssClass: 'tab possessions',
        icon: '',
        label: 'CoC7.Possessions'
      },
      combat: {
        cssClass: 'tab combat',
        icon: '',
        label: 'CoC7.Combat'
      },
      skills: {
        cssClass: 'tab skills',
        icon: '',
        label: 'CoC7.Skills'
      },
      activeEffects: {
        cssClass: 'tab effects small-ribbon',
        icon: 'game-icon game-icon-aura',
        label: '',
        tooltip: 'CoC7.Effects'
      }
    }
    if (context.showDevPanel) {
      tabs.development = {
        cssClass: 'tab development small-ribbon',
        icon: 'fa-solid fa-cogs',
        label: '',
        tooltip: 'CoC7.CharacterDevelopment'
      }
    }
    if (game.user.isGM) {
      tabs.keeper = {
        cssClass: 'tab keeper small-ribbon',
        icon: 'game-icon game-icon-tentacles-skull',
        label: '',
        tooltip: 'CoC7.GmNotes'
      }
    }
    if (!context.document.system.flags.locked) {
      tabs.portraitConfig = {
        cssClass: 'tab tab-hidden',
        icon: '',
        label: ''
      }
    }

    context.tabs = this.getTabs('primary', 'skills', tabs)

    context.portraitFrame = context.document.flags[FOLDER_ID]?.portraitFrame

    return context
  }

  /**
   * @inheritdoc
   * @param {ApplicationRenderContext} context
   * @param {RenderOptions} options
   * @returns {Promise<void>}
   */
  async _onRender (context, options) {
    await super._onRender(context, options)

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return

    this.element.querySelector('.portrait-frame')?.addEventListener('click', () => {
      this.changeTab('portraitConfig', 'primary')
    })
    this.element.querySelectorAll('.option-box .photo-frame').forEach((element) => element.addEventListener('click', (event) => {
      const objectFit = event.currentTarget.dataset.objectFit
      this.document.setFlag(FOLDER_ID, 'portraitFrame', objectFit)
    }))
  }

  /**
   * Make sure tabs are not hidden in detached window
   * @param {object} position
   * @returns {object}
   */
  _updatePosition (position) {
    const pos = super._updatePosition(position)
    if (foundry.utils.isNewerVersion(game.version, 14)) {
      pos.left = Math.max(pos.left, 87)
    }
    return pos
  }
}
