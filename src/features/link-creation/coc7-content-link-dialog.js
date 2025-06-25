/* global canvas, CONST, FormApplication, foundry, game, ui */
import { CoC7Link } from './coc7-link.js'
import { CoC7Check } from '../../core/check.js'
import { CoCActor } from '../../core/documents/actor.js'
import { CoC7Utilities } from '../../shared/utilities.js'

export class CoC7ContentLinkDialog extends FormApplication {
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'link-creation',
      classes: ['coc7', 'active-effect-sheet'],
      title: game.i18n.localize('CoC7.CreateLink'),
      dragDrop: [{ dragSelector: null, dropSelector: '.container' }],
      template: 'systems/CoC7/templates/apps/link-creation.html',
      closeOnSubmit: false,
      width: 560,
      height: 'auto',
      tabs: [
        {
          navSelector: '.tabs',
          contentSelector: '.effect-options',
          initial: 'details'
        }
      ]
    })
  }

  async getData () {
    const sheetData = await super.getData()

    // Prepare check type
    sheetData.checkType = [
      {
        key: CoC7Link.CHECK_TYPE.CHECK,
        label: game.i18n.localize('CoC7.Check')
      },
      {
        key: CoC7Link.CHECK_TYPE.SANLOSS,
        label: game.i18n.localize('CoC7.SanityCheck')
      },
      {
        key: CoC7Link.CHECK_TYPE.ITEM,
        label: game.i18n.localize('CoC7.ItemWeapon')
      },
      {
        key: CoC7Link.CHECK_TYPE.EFFECT,
        label: game.i18n.localize('EFFECT.TabEffects')
      }
    ]

    // Prepare 'check' link type
    sheetData.linkType = [
      {
        key: CoC7Link.LINK_TYPE.CHARACTERISTIC,
        label: game.i18n.localize('CoC7.Characteristic')
      },
      {
        key: CoC7Link.LINK_TYPE.ATTRIBUTE,
        label: game.i18n.localize('CoC7.Attribute')
      },
      {
        key: CoC7Link.LINK_TYPE.SKILL,
        label: game.i18n.localize('CoC7.Skill')
      }
    ]

    // Prepare 'check' 'attribute' types
    sheetData.attributeType = [
      {
        key: 'lck',
        label: game.i18n.localize('CoC7.Luck')
      },
      {
        key: 'san',
        label: game.i18n.localize('CoC7.Sanity')
      }
    ]

    // Prepare effect mode types
    sheetData.effectModes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce(
      (obj, e) => {
        obj[e[1]] = game.i18n.localize('EFFECT.MODE_' + e[0])
        return obj
      },
      {}
    )

    // Prepare 'check' 'characteristic' types
    sheetData.characteristicType = CoCActor.getCharacteristicDefinition()

    sheetData.link = sheetData.object.link

    sheetData.fromGame = sheetData.link.isItemCheck || sheetData.link.isSkillCheck

    sheetData.fromDirectory = (sheetData.object.hasID === 'fromDirectory')
    sheetData.fromCompendium = (sheetData.object.hasID === 'fromCompendium')

    sheetData.isSetFromGame = (sheetData.link.id && (sheetData.fromDirectory || sheetData.fromCompendium))

    sheetData.difficultyLevels = [
      {
        key: CoC7Check.difficultyLevel.unknown,
        label: 'CoC7.RollDifficultyUnknown'
      },
      {
        key: CoC7Check.difficultyLevel.regular,
        label: 'CoC7.RollDifficultyRegular'
      },
      {
        key: CoC7Check.difficultyLevel.hard,
        label: 'CoC7.RollDifficultyHard'
      },
      {
        key: CoC7Check.difficultyLevel.extreme,
        label: 'CoC7.RollDifficultyExtreme'
      },
      {
        key: CoC7Check.difficultyLevel.critical,
        label: 'CoC7.RollDifficultyCritical'
      }
    ]

    sheetData.actorNames = sheetData.object.actors.map(a => a.name).join(', ')

    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    html
      .find('select[name=type],select[name=check],select[name=attributeKey],select[name=characteristicKey],input[type=checkbox]')
      .change(this._onChangeSubmit.bind(this))

    // Handling effects
    html.find('.effect-control').click(this._onEffectControl.bind(this))
  }

  _onChangeSubmit (event) {
    switch (event.currentTarget.name) {
      case 'fromCompendium':
      case 'fromDirectory':
        this.object.hasID = (event.currentTarget.name === this.object.hasID ? '' : event.currentTarget.name)
        break
    }
    this._onSubmit(event)
  }

  _onEffectControl (event) {
    event.preventDefault()
    const button = event.currentTarget
    switch (button.dataset.action) {
      case 'add':
        return this._addEffectChange()
      case 'delete':
        button.closest('.effect-change').remove()
        this._onSubmit(event)
    }
  }

  async _addEffectChange () {
    const idx = this.object.link.effect.changes.length
    return this.submit({
      preventClose: true,
      updateData: {
        [`effect.changes.${idx}`]: {
          key: '',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: ''
        }
      }
    })
  }

  async _updateObject (event, formData) {
    let hasEffect = false
    const effect = {
      duration: {},
      changes: []
    }
    for (const key in formData) {
      switch (key) {
        case 'checkName':
          this.object.link.setValue('name', formData.checkName)
          break
        case 'blind':
        case 'pushing':
        case 'difficulty':
        case 'displayName':
        case 'icon':
        case 'id':
        case 'modifier':
        case 'pack':
        case 'sanMin':
        case 'sanMax':
        case 'sanReason':
          this.object.link.setValue(key, formData[key])
          break
        case 'hasModifiers':
        case 'hasLabel':
        case 'hasIcon':
          this.object[key] = formData[key]
          break
        case 'effect.label':
          effect.label = formData[key]
          hasEffect = true
          break
        case 'effect.icon':
          effect.icon = formData[key]
          hasEffect = true
          break
        case 'effect.tint':
          effect.tint = formData[key]
          hasEffect = true
          break
        case 'effect.disabled':
          effect.disabled = formData[key]
          hasEffect = true
          break
        case 'effect.duration.seconds':
          effect.duration.seconds = formData[key]
          hasEffect = true
          break
        case 'effect.duration.rounds':
          effect.duration.rounds = formData[key]
          hasEffect = true
          break
        case 'effect.duration.turns':
          effect.duration.turns = formData[key]
          hasEffect = true
          break
        default: {
          const match = key.match(/^effect\.changes\.(\d+)\.key$/)
          if (match) {
            effect.changes.push({
              key: formData[key],
              mode: formData['effect.changes.' + match[1] + '.mode'],
              value: formData['effect.changes.' + match[1] + '.value']
            })
            hasEffect = true
          }
        }
      }
    }
    if (hasEffect) {
      this.object.link.setValue('object', effect)
    }
    const target = event.currentTarget
    if (target) {
      switch (target.name) {
        case 'type':
          this.object.link.setValue('check', target.value)
          if (target.value === CoC7Link.CHECK_TYPE.CHECK) {
            this.object.link.setValue('linkType', CoC7Link.LINK_TYPE.SKILL)
            this.object.link.setValue('name', '')
          }
          break
        case 'check':
          this.object.link.setValue('linkType', target.value)
          if (target.value === CoC7Link.LINK_TYPE.CHARACTERISTIC) {
            this.object.link.setValue('name', CoCActor.getCharacteristicDefinition()[0].key)
          } else if (target.value === CoC7Link.LINK_TYPE.ATTRIBUTE) {
            this.object.link.setValue('name', 'lck')
          } else {
            this.object.link.setValue('name', '')
          }
          break
        case 'attributeKey':
        case 'characteristicKey':
          this.object.link.setValue('name', target.value)
          break
      }
      if (event.type === 'submit') {
        switch (event.submitter.dataset.action) {
          case 'clipboard':
            CoC7Utilities.copyToClipboard(this.object.link.link)
            break
          case 'chat':
            CoC7Link.toChatMessage(this.object.link.object)
            break
          case 'whisper-owner':
            CoC7Link.toWhisperMessage(this.object.link.object, this.object.actors)
            break
          case 'whisper-selected':
            if (!canvas.tokens.controlled.length) {
              ui.notifications.warn(
                game.i18n.localize('CoC7.ErrorNoTokensSelected')
              )
              return
            }
            CoC7Link.toWhisperMessage(this.object.link.object, canvas.tokens.controlled.filter(t => t.actor.owners.length).map(t => t.actor))
            break
        }
        return
      }
    }
    this.render(true)
  }

  async _onDrop (event) {
    const dataString = event.dataTransfer.getData('text/plain')
    const data = JSON.parse(dataString)
    if (data.type === 'CoC7Link') {
      this.setLink(await CoC7Link.fromDropData(data))
      this.render(true)
    } else {
      if ((data.type === 'Folder' && data.documentName === 'Actor') || ['Item', 'Actor'].includes(data.type)) {
        const dataList = await CoC7Utilities.getDataFromDropEvent(event, data.documentName ?? data.type)
        if (data.documentName ?? data.type === 'Actor') {
          this.object.actors = dataList.filter(a => a.owners.length)
          this.render(true)
        } else if (dataList.length === 1) {
          if (['skill', 'weapon'].includes(dataList[0].type)) {
            if (dataList[0].pack) {
              this.object.hasID = 'fromCompendium'
              this.object.link.setValue('pack', dataList[0].pack)
            } else {
              this.object.hasID = 'fromDirectory'
            }
            this.object.link.setValue('id', dataList[0].id)
            this.object.link.setValue('name', dataList[0].name)
            this.render(true)
          }
        }
      }
    }
  }

  setLink (link) {
    this.object.link = link
    if (link.pack !== '') {
      this.object.hasID = 'fromCompendium'
    } else if (link.id !== '') {
      this.object.hasID = 'fromDirectory'
    }
    if (link.difficulty !== CoC7Check.difficultyLevel.regular || parseInt(link.modifier, 10) !== 0 || link.isPushing) {
      this.object.hasModifiers = true
    } else {
      this.object.hasModifiers = false
    }
    if (link.displayName !== '') {
      this.object.hasLabel = true
    }
    if (link.icon !== '') {
      this.object.hasIcon = true
    }
    return ''
  }

  static async create (linkData = {}, option = {}) {
    const object = foundry.utils.mergeObject({
      link: null,
      hasID: '',
      hasModifiers: false,
      hasLabel: false,
      hasIcon: false,
      actors: []
    }, option)
    const dialog = new CoC7ContentLinkDialog(object, {})
    dialog.setLink(await CoC7Link.fromDropData(linkData))
    dialog.render(true)
  }
}
