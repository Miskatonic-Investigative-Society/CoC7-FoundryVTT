/* global $, Actor, ChatMessage, CONST, duplicate, FormApplication, game, Hooks, mergeObject, randomID, renderTemplate, Roll, ui */
import { COC7 } from '../config.js'
import { CoC7OccupationSheet } from '../items/sheets/occupation.js'
import { CoC7Parser } from './coc7-parser.js'
import { CoC7Utilities } from '../utilities.js'
import { SkillSpecializationSelectDialog } from '../apps/skill-specialization-select-dialog.js'

export class CoC7InvestigatorWizard extends FormApplication {
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['coc7', 'dialog', 'investigator-wizard'],
      title: game.i18n.localize('CoC7.InvestigatorWizard.Title'),
      template: 'systems/CoC7/templates/apps/investigator-wizard.hbs',
      width: 520,
      height: 600,
      closeOnSubmit: false,
      dragDrop: [{ dropSelector: null }]
    })
  }

  get pageList () {
    return {
      PAGE_NONE: -1,
      PAGE_INTRODUCTION: 0,
      PAGE_CONFIGURATION: 1,
      PAGE_SETUPS: 2,
      PAGE_ARCHETYPES: 3,
      PAGE_OCCUPATIONS: 4,
      PAGE_CHARACTISTICS: 5,
      PAGE_INVESTIGATOR: 6,
      PAGE_OCCUPATION_SKILLS: 7,
      PAGE_ARCHETYPE_SKILLS: 8,
      PAGE_POINTS_SKILLS: 9,
      PAGE_BACKSTORY: 10,
      PAGE_CREATE: 11
    }
  }

  get pageOrder () {
    const pages = this.pageList
    let pageOrder = [
      pages.PAGE_INTRODUCTION
    ]
    if (game.user.isGM) {
      pageOrder.push(pages.PAGE_CONFIGURATION)
    }
    if (this.object.defaultSetup === '') {
      pageOrder.push(pages.PAGE_SETUPS)
    }
    if (game.settings.get('CoC7', 'pulpRuleArchetype')) {
      pageOrder.push(pages.PAGE_ARCHETYPES)
    }
    pageOrder = pageOrder.concat([
      pages.PAGE_OCCUPATIONS,
      pages.PAGE_CHARACTISTICS,
      pages.PAGE_INVESTIGATOR,
      pages.PAGE_OCCUPATION_SKILLS
    ])
    if (game.settings.get('CoC7', 'pulpRuleArchetype')) {
      pageOrder.push(pages.PAGE_ARCHETYPE_SKILLS)
    }
    pageOrder = pageOrder.concat([
      pages.PAGE_POINTS_SKILLS,
      pages.PAGE_BACKSTORY,
      pages.PAGE_CREATE
    ])
    return pageOrder
  }

  async getData () {
    const sheetData = await super.getData()

    sheetData.isKeeper = game.user.isGM

    sheetData.pages = this.pageList

    sheetData.canNext = false
    sheetData.createButton = false

    // Trigger checking setups and occupations so they are loaded before the contents are required
    const setups = game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\.setup\./, type: 'i', era: sheetData.object.defaultEra })
    const occupations = game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\.occupation\./, type: 'i' })
    const archetypes = game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\.archetype\./, type: 'i' })
    const backstories = game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: /^rt\.\.backstory-/, type: 'rt' })
    let setup
    let archetype
    let occupation

    switch (sheetData.object.step) {
      case sheetData.pages.PAGE_INTRODUCTION:
        sheetData.era = game.i18n.format(COC7.eras[sheetData.object.defaultEra] ?? 'CoC7.CoCIDFlag.error.unknown-era', { era: sheetData.object.defaultEra })
        sheetData.canNext = true
        break

      case sheetData.pages.PAGE_CONFIGURATION:
        if (game.user.isGM) {
          sheetData.setups = await setups
          sheetData.occupations = await occupations
          sheetData.archetypes = await archetypes
          setup = sheetData.setups.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.defaultSetup)
          if (typeof setup === 'undefined') {
            sheetData.object.defaultSetup = ''
            sheetData.object.setup = ''
          } else {
            sheetData.description = CoC7Parser.enrichHTML(setup.system.description.value)
          }
          sheetData.ownership = {
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE]: 'OWNERSHIP.NONE',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED]: 'OWNERSHIP.LIMITED',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER]: 'OWNERSHIP.OBSERVER',
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER]: 'OWNERSHIP.OWNER'
          }
          sheetData._eras = []
          for (const [key, value] of Object.entries(COC7.eras)) {
            sheetData._eras.push({
              id: key,
              name: game.i18n.localize(value)
            })
          }
          sheetData._eras.sort(CoC7Utilities.sortByNameKey)
          sheetData.hasArchetypes = game.settings.get('CoC7', 'pulpRuleArchetype')
          sheetData.canNext = true
        }
        break

      case sheetData.pages.PAGE_SETUPS:
        if (sheetData.object.defaultSetup === '') {
          sheetData.setups = await setups
          sheetData.setups.sort(CoC7Utilities.sortByNameKey)
          if (sheetData.object.setup !== '') {
            setup = sheetData.setups.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.setup)
            if (typeof setup !== 'undefined') {
              sheetData.description = CoC7Parser.enrichHTML(setup.system.description.value)
              sheetData.canNext = true
            }
          }
        }
        break

      case sheetData.pages.PAGE_ARCHETYPES:
        sheetData.archetypes = await archetypes
        if (sheetData.archetypes.length === 0) {
          sheetData.canNext = true
        } else {
          sheetData.archetypes.sort(CoC7Utilities.sortByNameKey)
          if (sheetData.object.archetype !== '') {
            archetype = sheetData.archetypes.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.archetype)
            if (typeof archetype !== 'undefined') {
              sheetData.description = CoC7Parser.enrichHTML(archetype.system.description.value)
              sheetData.bonusPoints = archetype.system.bonusPoints
              const coreCharacteristics = []
              for (const coreCharacteristic in archetype.system.coreCharacteristics) {
                if (archetype.system.coreCharacteristics[coreCharacteristic]) {
                  coreCharacteristics.push(coreCharacteristic)
                }
              }
              if (coreCharacteristics.length === 0) {
                this.object.coreCharacteristic = ''
              } else if (coreCharacteristics.length === 1) {
                this.object.coreCharacteristic = coreCharacteristics[0]
              }
              sheetData.coreCharacteristic = coreCharacteristics.map(c => c.toLocaleUpperCase()).join(' or ')
              const skills = []
              archetype.system.skills = await game.system.api.cocid.expandItemArray({ itemList: archetype.system.skills })
              for (const skill of archetype.system.skills) {
                skills.push(skill.name)
              }
              sheetData.skills = skills.join(', ')
              sheetData.suggestedOccupations = CoC7Parser.enrichHTML(archetype.system.suggestedOccupations)
              sheetData.suggestedTraits = CoC7Parser.enrichHTML(archetype.system.suggestedTraits)
              sheetData.canNext = true
            }
          }
        }
        break

      case sheetData.pages.PAGE_OCCUPATIONS:
        sheetData.occupations = await occupations
        sheetData.occupations.sort(CoC7Utilities.sortByNameKey)
        if (sheetData.object.occupation !== '') {
          occupation = sheetData.occupations.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.occupation)
          if (typeof occupation !== 'undefined') {
            sheetData.description = CoC7Parser.enrichHTML(occupation.system.description.value)
            sheetData.occupationPointsString = CoC7OccupationSheet.occupationPointsString(occupation.system.occupationSkillPoints)
            sheetData.creditRating = occupation.system.creditRating
            sheetData.personal = occupation.system.personal
            sheetData.skills = await game.system.api.cocid.expandItemArray({ itemList: occupation.system.skills })
            sheetData.groups = {}
            for (let index = 0; index < occupation.system.groups.length; index++) {
              sheetData.groups[index] = {
                options: occupation.system.groups[index].options,
                skills: []
              }
              sheetData.groups[index].skills = await game.system.api.cocid.expandItemArray({ itemList: occupation.system.groups[index].skills })
            }
            sheetData.canNext = true
          }
        }
        break

      case sheetData.pages.PAGE_CHARACTISTICS:
        sheetData.setups = await setups
        if (sheetData.object.setup !== '') {
          setup = sheetData.setups.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.setup)
          if (typeof setup !== 'undefined') {
            sheetData.setup = {
              roll: setup.system.characteristics.rolls.enabled,
              total: 0,
              points: setup.system.characteristics.points.value,
              characteristics: [
                {
                  key: 'str',
                  roll: setup.system.characteristics.rolls.str,
                  label: 'CHARAC.Strength'
                },
                {
                  key: 'con',
                  roll: setup.system.characteristics.rolls.con,
                  label: 'CHARAC.Constitution'
                },
                {
                  key: 'siz',
                  roll: setup.system.characteristics.rolls.siz,
                  label: 'CHARAC.Size'
                },
                {
                  key: 'dex',
                  roll: setup.system.characteristics.rolls.dex,
                  label: 'CHARAC.Dexterity'
                },
                {
                  key: 'app',
                  roll: setup.system.characteristics.rolls.app,
                  label: 'CHARAC.Appearance'
                },
                {
                  key: 'int',
                  roll: setup.system.characteristics.rolls.int,
                  label: 'CHARAC.Intelligence'
                },
                {
                  key: 'pow',
                  roll: setup.system.characteristics.rolls.pow,
                  label: 'CHARAC.Power'
                },
                {
                  key: 'edu',
                  roll: setup.system.characteristics.rolls.edu,
                  label: 'CHARAC.Education'
                }
              ],
              luck: {
                roll: setup.system.characteristics.rolls.luck,
                label: 'CoC7.Luck'
              }
            }
            sheetData.coreCharacteristics = []
            if (sheetData.object.archetype !== '') {
              sheetData.archetypes = await archetypes
              archetype = sheetData.archetypes.find(s => s.flags.CoC7.cocidFlag.id === sheetData.object.archetype)
              if (typeof archetype !== 'undefined') {
                for (const coreCharacteristic in archetype.system.coreCharacteristics) {
                  if (archetype.system.coreCharacteristics[coreCharacteristic]) {
                    sheetData.coreCharacteristics.push({
                      key: coreCharacteristic,
                      name: game.i18n.format(sheetData.setup.characteristics.find(c => c.key === coreCharacteristic)?.label ?? 'Unknown')
                    })
                  }
                }
                sheetData.coreCharacteristics.sort(CoC7Utilities.sortByNameKey)
                if (this.object.coreCharacteristic !== '') {
                  if (archetype.system.coreCharacteristicsFormula.enabled) {
                    sheetData.setup.characteristics.find(c => c.key === this.object.coreCharacteristic).roll = archetype.system.coreCharacteristicsFormula.value
                  }
                }
              }
            }
            let empties = false
            for (const key in sheetData.object.setupPoints) {
              if (sheetData.object.setupPoints[key] !== '') {
                if (key !== 'luck') {
                  sheetData.setup.total += parseInt(sheetData.object.setupPoints[key], 10)
                }
              } else {
                empties = true
              }
            }
            if (!empties) {
              if (sheetData.setup.roll) {
                sheetData.canNext = true
              } else if (sheetData.setup.total.toString() === sheetData.setup.points) {
                sheetData.canNext = true
              }
            }
          }
        }
        break

      case sheetData.pages.PAGE_INVESTIGATOR:
        sheetData.language = (typeof this.object.skillItems['i.skill.language-own'] !== 'undefined')
        if (sheetData.language) {
          sheetData.languageName = this.object.skillItems['i.skill.language-own'].item.name
        } else {
          sheetData.languageName = ''
        }
        sheetData.canNext = true
        break

      case sheetData.pages.PAGE_OCCUPATION_SKILLS:
        sheetData.default = 0
        sheetData.selected = 0
        sheetData.skillItems = []
        for (const key in this.object.skillItems) {
          let group = 'other'
          const rows = sheetData.object.skillItems[key].rows.length
          const isMultiple = sheetData.object.skillItems[key].flags.isMultiple
          if (isMultiple) {
            sheetData.skillItems.push({
              key,
              index: -1,
              name: sheetData.object.skillItems[key].item.name,
              group,
              toggle: false,
              isCreditRating: false,
              isMultiple: true,
              isPickable: false
            })
          }
          for (let index = 0; index < rows; index++) {
            let isPickable = false
            if (sheetData.object.skillItems[key].rows[index].isOccupationDefault) {
              group = 'default'
              if (isMultiple) {
                isPickable = true
              }
              sheetData.default++
            } else if (sheetData.object.skillItems[key].rows[index].inOccupationGroup !== false) {
              group = sheetData.object.skillItems[key].rows[index].inOccupationGroup
              if (isMultiple) {
                isPickable = true
              }
            } else {
              group = 'other'
            }
            let toggle = sheetData.object.skillItems[key].rows[index].occupationToggle
            if (isPickable) {
              toggle = false
            }
            let specialization = sheetData.object.skillItems[key].item.system.specialization
            let skillName = sheetData.object.skillItems[key].item.system.skillName
            let picked = false
            let deleteable = false
            if (typeof sheetData.object.skillItems[key].rows[index].selected === 'string') {
              picked = true
              skillName = sheetData.object.skillItems[key].rows[index].selected
            } else if (sheetData.object.skillItems[key].rows[index].selected !== false) {
              picked = true
              specialization = sheetData.object.skillItems[key].rows[index].selected.system.specialization
              skillName = sheetData.object.skillItems[key].rows[index].selected.system.skillName
            }
            if (toggle || (isPickable && picked)) {
              sheetData.selected++
            }
            let name = sheetData.object.skillItems[key].item.name
            if (key === 'i.skill.language-own') {
              name = specialization + ' (' + skillName + ' - ' + sheetData.object.language + ')'
            } else if (!isPickable && picked) {
              name = specialization + ' (' + skillName + ')'
            }
            if (!isPickable && picked) {
              deleteable = !sheetData.object.skillItems[key].rows[index].archetypeToggle
            }
            sheetData.skillItems.push({
              key,
              index,
              name,
              group: group.toString(),
              toggle,
              isCreditRating: sheetData.object.skillItems[key].rows[index].isCreditRating,
              isMultiple: false,
              isPickable,
              picked,
              deleteable,
              specialization,
              skillName
            })
          }
        }
        sheetData.max = sheetData.default + sheetData.object.personal + Object.values(sheetData.object.occupationGroups).reduce((s, v) => s + v, 0)
        sheetData.skillItems.sort(CoC7Utilities.sortByNameKey)
        if (sheetData.selected === sheetData.max) {
          sheetData.canNext = true
        }
        break

      case sheetData.pages.PAGE_ARCHETYPE_SKILLS:
        sheetData.max = 0
        sheetData.selected = 0
        sheetData.skillItems = []
        for (const key in this.object.skillItems) {
          let group = 'other'
          const rows = sheetData.object.skillItems[key].rows.length
          const isMultiple = sheetData.object.skillItems[key].flags.isMultiple
          if (isMultiple) {
            sheetData.skillItems.push({
              key,
              index: -1,
              name: sheetData.object.skillItems[key].item.name,
              group,
              toggle: false,
              isCreditRating: false,
              isMultiple: true,
              isPickable: false
            })
          }
          for (let index = 0; index < rows; index++) {
            let isPickable = false
            if (sheetData.object.skillItems[key].rows[index].isArchetypeDefault) {
              group = 'default'
              if (isMultiple) {
                isPickable = true
              }
              sheetData.max++
            } else {
              group = 'other'
            }
            let toggle = sheetData.object.skillItems[key].rows[index].archetypeToggle
            if (isPickable) {
              toggle = false
            }
            let specialization = sheetData.object.skillItems[key].item.system.specialization
            let skillName = sheetData.object.skillItems[key].item.system.skillName
            let picked = false
            let deleteable = false
            if (typeof sheetData.object.skillItems[key].rows[index].selected === 'string') {
              picked = true
              skillName = sheetData.object.skillItems[key].rows[index].selected
            } else if (sheetData.object.skillItems[key].rows[index].selected !== false) {
              picked = true
              specialization = sheetData.object.skillItems[key].rows[index].selected.system.specialization
              skillName = sheetData.object.skillItems[key].rows[index].selected.system.skillName
            }
            if (toggle || (isPickable && picked)) {
              sheetData.selected++
            }
            let name = sheetData.object.skillItems[key].item.name
            if (key === 'i.skill.language-own') {
              name = specialization + ' (' + skillName + ' - ' + sheetData.object.language + ')'
            } else if (!isPickable && picked) {
              name = specialization + ' (' + skillName + ')'
            }
            if (!isPickable && picked) {
              deleteable = !sheetData.object.skillItems[key].rows[index].occupationToggle
            }
            sheetData.skillItems.push({
              key,
              index,
              name,
              group: group.toString(),
              toggle,
              isCreditRating: false,
              isMultiple: false,
              isPickable,
              picked,
              deleteable,
              specialization,
              skillName
            })
          }
        }
        sheetData.skillItems.sort(CoC7Utilities.sortByNameKey)
        if (sheetData.selected === sheetData.max) {
          sheetData.canNext = true
        }
        break

      case sheetData.pages.PAGE_POINTS_SKILLS:
        sheetData.skills = []
        sheetData.creditRatingOkay = !(this.object.creditRating.max > 0)
        sheetData.personal = {
          count: 0,
          total: 2 * this.object.setupPoints.int,
          remaining: 0
        }
        sheetData.occupation = {
          count: 0,
          total: 0,
          remaining: 0
        }
        sheetData.archetype = {
          count: 0,
          total: 0,
          remaining: 0
        }
        if (sheetData.object.occupation !== '') {
          const occupation = await game.system.api.cocid.fromCoCID(this.object.occupation)
          if (occupation.length === 1) {
            const options = []
            for (const [key, carac] of Object.entries(occupation[0].system.occupationSkillPoints)) {
              if (carac.selected) {
                if (carac.optional) {
                  options.push(carac.multiplier * this.object.setupPoints[key])
                } else {
                  sheetData.occupation.total += carac.multiplier * this.object.setupPoints[key]
                }
              }
            }
            if (options.length > 0) {
              sheetData.occupation.total += Math.max(...options)
            }
          }
        }
        if (this.object.archetype !== '') {
          const archetype = await game.system.api.cocid.fromCoCID(this.object.archetype)
          if (archetype.length === 1) {
            sheetData.archetype.total = archetype[0].system.bonusPoints
          }
        }
        if (Object.keys(this.object.skillItems).length > 0) {
          for (const key in this.object.skillItems) {
            const skill = this.object.skillItems[key]
            for (let index = 0, im = skill.rows.length; index < im; index++) {
              const row = skill.rows[index]
              if (!skill.flags.isMultiple || row.selected !== false) {
                let item = duplicate(skill.item)
                if (row.selected !== false && typeof row.selected !== 'string') {
                  item = duplicate(row.selected)
                }
                let base = item.system.base
                if (!Number.isNumeric(base)) {
                  for (const key in this.object.setupPoints) {
                    const regEx = new RegExp('@' + key, 'i')
                    base = base.replace(regEx, this.object.setupPoints[key])
                  }
                }
                if (!Number.isNumeric(base)) {
                  base = Math.floor(new Roll(base).evaluate({ async: false }).total)
                }
                let totalPoints = parseInt(base, 10)
                if (Number(row.personalPoints) > 0) {
                  const num = Number(row.personalPoints)
                  sheetData.personal.count += num
                  totalPoints = totalPoints + num
                }
                if (Number(row.occupationPoints) > 0) {
                  const num = Number(row.occupationPoints)
                  sheetData.occupation.count += num
                  totalPoints = totalPoints + num
                }
                if (Number(row.archetypePoints) > 0) {
                  const num = Number(row.archetypePoints)
                  sheetData.archetype.count += num
                  totalPoints = totalPoints + num
                }
                if (Number(row.experiencePoints) > 0) {
                  const num = Number(row.experiencePoints)
                  totalPoints = totalPoints + num
                }
                let name = item.name
                if (key === 'i.skill.language-own') {
                  name = item.system.specialization + ' (' + sheetData.object.language + ')'
                } else if (skill.flags.isCreditRating) {
                  name = name + ' [' + this.object.creditRating.min + ' - ' + this.object.creditRating.max + ']'
                  if (totalPoints >= this.object.creditRating.min && totalPoints <= this.object.creditRating.max) {
                    sheetData.creditRatingOkay = true
                  }
                } else if (typeof row.selected === 'string') {
                  name = item.system.specialization + ' (' + row.selected + ')'
                }
                sheetData.skills.push({
                  key,
                  index,
                  name,
                  isOccupation: row.occupationToggle,
                  isArchetype: row.archetypeToggle,
                  base,
                  personalPoints: row.personalPoints,
                  occupationPoints: row.occupationPoints,
                  archetypePoints: row.archetypePoints,
                  experiencePoints: row.experiencePoints,
                  totalPoints
                })
              }
            }
          }
          sheetData.skills.sort(CoC7Utilities.sortByNameKey)
          if (sheetData.creditRatingOkay) {
            sheetData.canNext = true
          }
        }

        sheetData.personal.remaining = sheetData.personal.total - sheetData.personal.count
        sheetData.occupation.remaining = sheetData.occupation.total - sheetData.occupation.count
        sheetData.archetype.remaining = sheetData.archetype.total - sheetData.archetype.count
        break

      case sheetData.pages.PAGE_BACKSTORY:
        {
          const allBackstories = await backstories
          sheetData.backstories = {}
          for (let index = 0; index < this.object.bioSections.length; index++) {
            sheetData.backstories[index] = {
              index,
              name: this.object.bioSections[index].name,
              rolls: (game.system.api.cocid.findCocIdInList(this.object.bioSections[index].key, allBackstories).length ? this.object.bioSections[index].key : ''),
              value: this.object.bioSections[index].value
            }
          }
        }
        sheetData.canNext = true
        sheetData.createButton = game.user.role >= CONST.USER_PERMISSIONS.ACTOR_CREATE.defaultRole
        break

      case sheetData.pages.PAGE_CREATE:
        sheetData.canNext = true
        sheetData.createButton = true
        break
    }

    return sheetData
  }

  activateListeners (html) {
    super.activateListeners(html)

    html.find('.submit_on_change').change(this._onChangeSubmit.bind(this))
    html.find('.roll-characteristic').click(this._onRollCharacteristic.bind(this))
    html.find('.increase-characteristic').click(this._onIncreaseCharacteristic.bind(this))
    html.find('.decrease-characteristic').click(this._onDecreaseCharacteristic.bind(this))
    html.find('button.roll_all').click(this._onRollAll.bind(this))
    html.find('.item input.submit_on_blur').blur(this._onChangeSubmit.bind(this))
    html.find('.item.toggleable').click(this._onToggleSkill.bind(this))
    html.find('.item.clickable').click(this._onClickPickSkill.bind(this))
    html.find('.skills-list input').click(this._onClickSkillSpecial.bind(this))
    html.find('.skills-list .remove-skill').click(this._onClickRemoveSkill.bind(this))
    html.find('.item input.skill-adjustment').blur(this._onChangeSkillPoints.bind(this))
    html.find('textarea.backstory-text').keyup(this._onChangeBackstoryText.bind(this))
    html.find('button.backstory-roll').click(this._onRollBackstory.bind(this))
    html.find('button.backstory-reset').click(this._onResetBackstory.bind(this))
  }

  async rollMessage (rolls) {
    if (rolls.length) {
      const html = []
      for (const roll of rolls) {
        html.push(await renderTemplate(Roll.CHAT_TEMPLATE, {
          formula: (CoC7Utilities.getCharacteristicNames(roll[0])?.label ?? roll[0]) + ': ' + roll[1],
          tooltip: await roll[2].getTooltip(),
          total: roll[2].total
        }))
      }
      ChatMessage.create({
        user: game.user.id,
        speaker: {
          alias: game.user.name
        },
        content: html.join('<div>&nbsp;</div>'),
        whisper: ChatMessage.getWhisperRecipients('GM')
      })
    }
  }

  addItemToList (item, { isOccupationDefault = false, inOccupationGroup = false, occupationToggle = false, isArchetypeDefault = false, archetypeToggle = false, isCreditRating = false } = {}) {
    const key = (item.flags.CoC7?.cocidFlag?.id ?? item.name)
    if (item.type !== 'skill') {
      this.object.investigatorItems.push(item)
      return
    }
    const isMultiple = !!(item.system.properties.special && ((item.system.properties.requiresname && !(item.system.properties.onlyone ?? false)) || item.system.properties.picknameonly || item.name === game.i18n.format('CoC7.AnySpecName')))
    const flags = {
      isOccupationDefault,
      inOccupationGroup,
      isArchetypeDefault,
      isCreditRating,
      occupationToggle,
      archetypeToggle
    }
    const rows = {
      occupationPoints: '',
      archetypePoints: '',
      experiencePoints: '',
      personalPoints: '',
      selected: false
    }
    if (typeof this.object.skillItems[key] === 'undefined') {
      this.object.skillItems[key] = {
        item,
        flags: mergeObject(flags, { isMultiple }, { inplace: false }),
        rows: []
      }
      if (!isMultiple || !(isOccupationDefault === false && inOccupationGroup === false && isArchetypeDefault === false)) {
        this.object.skillItems[key].rows.push(mergeObject(flags, rows, { inplace: false }))
      }
    } else {
      if (!isMultiple) {
        for (const flag in flags) {
          this.object.skillItems[key].rows[0][flag] = this.object.skillItems[key].rows[0][flag] || flags[flag]
        }
      } else {
        this.object.skillItems[key].rows.push(mergeObject(flags, rows, { inplace: false }))
      }
      for (const flag in flags) {
        this.object.skillItems[key].flags[flag] = this.object.skillItems[key].flags[flag] || flags[flag]
      }
    }
    if (!isMultiple && flags.isCreditRating) {
      this.object.skillItems[key].rows[0].occupationPoints = this.object.creditRating.min
    }
  }

  async setSkillLists () {
    this.object.skillItems = {}
    this.object.occupationGroups = {}
    this.object.investigatorItems = []
    for (const key in this.object.setupPoints) {
      this.object.setupPoints[key] = ''
    }
    const setup = await game.system.api.cocid.fromCoCID(this.object.setup)
    const occupation = await game.system.api.cocid.fromCoCID(this.object.occupation)
    let archetype = []
    if (this.object.archetype !== '') {
      archetype = await game.system.api.cocid.fromCoCID(this.object.archetype)
    }
    if (setup.length === 1 && occupation.length === 1 && (!game.settings.get('CoC7', 'pulpRuleArchetype') || archetype.length === 1)) {
      this.object.bioSections = []
      for (let index = 0; index < setup[0].system.bioSections.length; index++) {
        this.object.bioSections.push({
          name: setup[0].system.bioSections[index],
          value: '',
          key: 'rt..backstory-' + CoC7Utilities.toKebabCase(setup[0].system.bioSections[index])
        })
      }
      this.object.personal = occupation[0].system.personal
      this.object.creditRating = occupation[0].system.creditRating
      let items = []
      items = await game.system.api.cocid.expandItemArray({ itemList: setup[0].system.items })
      for (let index = 0, im = items.length; index < im; index++) {
        this.addItemToList(items[index])
      }
      items = await game.system.api.cocid.expandItemArray({ itemList: occupation[0].system.skills })
      for (let index = 0, im = items.length; index < im; index++) {
        this.addItemToList(items[index], { isOccupationDefault: true, occupationToggle: true })
      }
      for (let group = 0, gm = occupation[0].system.groups.length; group < gm; group++) {
        this.object.occupationGroups[group] = occupation[0].system.groups[group].options
        items = await game.system.api.cocid.expandItemArray({ itemList: occupation[0].system.groups[group].skills })
        for (let index = 0, im = items.length; index < im; index++) {
          this.addItemToList(items[index], { inOccupationGroup: group })
        }
        if (archetype.length === 1) {
          items = await game.system.api.cocid.expandItemArray({ itemList: archetype[0].system.skills })
          for (let index = 0, im = items.length; index < im; index++) {
            this.addItemToList(items[index], { isArchetypeDefault: true, archetypeToggle: true })
          }
        }
      }
      if (Number(this.object.creditRating.max) > 0) {
        const keyCreditRating = 'i.skill.credit-rating'
        const nameCreditRating = game.i18n.format('CoC7.CoCIDFlag.keys.' + keyCreditRating)
        const flags = { isOccupationDefault: true, occupationToggle: true, isCreditRating: true }
        if (typeof this.object.skillItems[keyCreditRating] !== 'undefined') {
          this.addItemToList(this.object.skillItems[keyCreditRating].item, flags)
        } else if (typeof this.object.skillItems[nameCreditRating] !== 'undefined') {
          this.addItemToList(this.object.skillItems[nameCreditRating].item, flags)
        } else {
          const skill = await game.system.api.cocid.fromCoCID(keyCreditRating)
          if (skill.length) {
            this.addItemToList(skill[0], flags)
          }
        }
      }
    }
  }

  async _onDrop (event) {
    const dataList = await CoC7Utilities.getDataFromDropEvent(event, 'Item')
    if ([this.pageList.PAGE_ARCHETYPE_SKILLS, this.pageList.PAGE_OCCUPATION_SKILLS].includes(this.object.step)) {
      for (const item of dataList) {
        if (item.type === 'skill') {
          this.addItemToList(item)
          this.render(true)
        }
      }
    }
  }

  _onClickSkillSpecial (event) {
    event.stopPropagation()
  }

  _onClickRemoveSkill (event) {
    event.stopPropagation()
    const key = event.currentTarget?.parentNode?.dataset?.key
    const index = event.currentTarget?.parentNode?.dataset?.index
    if (typeof this.object.skillItems[key]?.rows[index] !== 'undefined') {
      this.object.skillItems[key].rows.splice(index, index)
      this.render(true)
    }
  }

  async _onToggleSkill (event) {
    const key = event.currentTarget?.dataset?.key
    const index = event.currentTarget?.dataset?.index
    const toggleKey = event.currentTarget?.dataset?.toggleKey
    if (typeof this.object.skillItems[key]?.rows[index] !== 'undefined') {
      this.object.skillItems[key].rows[index][toggleKey] = !this.object.skillItems[key].rows[index][toggleKey]
      this.render(true)
    }
  }

  async _onClickPickSkill (event) {
    const key = event.currentTarget?.dataset?.key
    const index = event.currentTarget?.dataset?.index
    const toggleKey = event.currentTarget?.dataset?.toggleKey
    if (typeof this.object.skillItems[key] !== 'undefined') {
      if (index > -1) {
        this.object.skillItems[key].rows[index][toggleKey] = false
        this.object.skillItems[key].rows[index].selected = false
        this.render(true)
      }
      let skillList = []
      const group = game.system.api.cocid.guessGroupFromKey(key)
      if (group) {
        skillList = (await game.system.api.cocid.fromCoCIDRegexBest({ cocidRegExp: new RegExp('^' + CoC7Utilities.quoteRegExp(group) + '.+$'), type: 'i' })).filter(item => {
          return !(item.system.properties?.special && !!(item.system.properties?.requiresname || item.system.properties?.picknameonly))
        })
        if (skillList.length > 1) {
          skillList.sort(CoC7Utilities.sortByNameKey)
        }
      }
      const skillData = await SkillSpecializationSelectDialog.create({
        skills: skillList,
        allowCustom: (this.object.skillItems[key].item.system.properties?.requiresname ?? false),
        fixedBaseValue: true,
        specializationName: this.object.skillItems[key].item.system.specialization,
        label: this.object.skillItems[key].item.name
      })
      if (index > -1) {
        if (skillData.selected !== '') {
          this.object.skillItems[key].rows[index].selected = skillList.find(i => i.id === skillData.selected)
          this.object.skillItems[key].rows[index][toggleKey] = true
        } else if (skillData.name !== '') {
          this.object.skillItems[key].rows[index].selected = skillData.name
          this.object.skillItems[key].rows[index][toggleKey] = true
        }
      } else {
        let selected = false
        if (skillData.selected !== '') {
          selected = skillList.find(i => i.id === skillData.selected)
        } else if (skillData.name !== '') {
          selected = skillData.name
        }
        this.object.skillItems[key].rows.push({
          isOccupationDefault: false,
          inOccupationGroup: false,
          isArchetypeDefault: false,
          isCreditRating: false,
          occupationToggle: (toggleKey === 'occupationToggle'),
          archetypeToggle: (toggleKey === 'archetypeToggle'),
          occupationPoints: '',
          archetypePoints: '',
          experiencePoints: '',
          personalPoints: '',
          selected
        })
      }
      this.render(true)
    }
  }

  async _onChangeSkillPoints (event) {
    const input = $(event.currentTarget)
    const adjustment = input.data('adjustment')
    const li = input.closest('li')
    const key = li.data('key')
    const index = li.data('index')
    if (typeof this.object.skillItems[key]?.rows[index][adjustment] !== 'undefined') {
      this.object.skillItems[key].rows[index][adjustment] = input.val()
    }
    this.render(true)
  }

  async _onChangeBackstoryText (event) {
    const textarea = $(event.currentTarget)
    const index = textarea.data('index')
    if (typeof this.object.bioSections[index] !== 'undefined') {
      this.object.bioSections[index].value = textarea.val()
    }
  }

  async _onRollBackstory (event) {
    const button = $(event.currentTarget)
    const index = button.data('index')
    const key = button.data('key')
    if (typeof this.object.bioSections[index] !== 'undefined') {
      const rolltable = await game.system.api.cocid.fromCoCID(key)
      if (rolltable.length === 1) {
        const tableResult = await rolltable[0].roll()
        if (tableResult.results[0].type === CONST.TABLE_RESULT_TYPES.TEXT) {
          this.object.bioSections[index].value = (this.object.bioSections[index].value + '\n' + tableResult.results[0].text.trim()).trim()
        }
      }
    }
    this.render(true)
  }

  async _onResetBackstory (event) {
    const button = $(event.currentTarget)
    const index = button.data('index')
    if (typeof this.object.bioSections[index] !== 'undefined') {
      this.object.bioSections[index].value = ''
    }
    this.render(true)
  }

  async _onRollAll (event) {
    event.preventDefault()
    const rolls = []
    for (const key of ['str', 'con', 'siz', 'dex', 'app', 'int', 'pow', 'edu', 'luck']) {
      const result = await this.rollCharacteristic(key)
      if (result !== false) {
        rolls.push(result)
      }
    }
    this.rollMessage(rolls)
    this.render(true)
  }

  async _onIncreaseCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    this.increaseCharacteristic(characKey)
    this.render(true)
  }

  async _onDecreaseCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    this.decreaseCharacteristic(characKey)
    this.render(true)
  }

  async increaseCharacteristic (key) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    if (input) {
      input.value = Number(input.value) + 1
      this.object.setupPoints[key] = Number(input.value)
    }
  }

  async decreaseCharacteristic (key) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    if (input && Number(input.value) > 0) {
      input.value = Number(input.value) - 1
      this.object.setupPoints[key] = Number(input.value)
    }
  }

  async _onRollCharacteristic (event) {
    event.preventDefault()
    const li = event.currentTarget.closest('.item')
    const characKey = li.dataset.key
    const result = await this.rollCharacteristic(characKey)
    if (result !== false) {
      this.rollMessage([result])
    }
    this.render(true)
  }

  async rollCharacteristic (key) {
    const li = this._element[0].querySelector(`li.item[data-key=${key}]`)
    const input = li?.querySelector('input')
    const formula = li.dataset.roll
    if (input && formula) {
      if (this.object.rerollsEnabled || this.object.setupPoints[key] === '') {
        const roll = new Roll(formula.toString())
        await roll.evaluate({ async: true })
        input.value = roll.total
        this.object.setupPoints[key] = Number(input.value)
        return [key, formula.toString(), roll]
      }
    }
    return false
  }

  /** @override
   * A subclass of the FormApplication must implement the _onChangeSubmit method.
   */
  _onChangeSubmit (event) {
    this._onSubmit(event)
  }

  getPageNumber (direction) {
    const pageOrder = this.pageOrder
    const key = parseInt(Object.keys(pageOrder).find(key => pageOrder[key] === this.object.step), 10) + direction
    return pageOrder[key]
  }

  /** @override
   * A subclass of the FormApplication must implement the _updateObject method.
   */
  async _updateObject (event, formData) {
    if (typeof formData['default-setup'] !== 'undefined' && typeof formData['world-era'] !== 'undefined' && typeof formData['default-ownership'] !== 'undefined') {
      if (this.object.defaultSetup !== formData['default-setup']) {
        this.object.defaultSetup = formData['default-setup']
        game.settings.set('CoC7', 'InvestigatorWizardSetup', this.object.defaultSetup)
        this.object.setup = this.object.defaultSetup
        await this.setSkillLists()
      }
      if (this.object.defaultOwnership !== formData['default-ownership']) {
        this.object.defaultOwnership = formData['default-ownership']
        game.settings.set('CoC7', 'InvestigatorWizardOwnership', this.object.defaultOwnership)
      }
      if (this.object.defaultEra !== formData['world-era']) {
        this.object.defaultEra = formData['world-era']
        game.settings.set('CoC7', 'worldEra', this.object.defaultEra)
      }
      this.object.rerollsEnabled = (typeof formData['rerolls-enabled'] === 'string')
      game.settings.set('CoC7', 'InvestigatorWizardRerolls', this.object.rerollsEnabled)
      if (typeof formData['default-enabled'] === 'string') {
        if (this.object.defaultQuantity.toString() === '0') {
          this.object.defaultQuantity = 1
          game.settings.set('CoC7', 'InvestigatorWizardQuantity', this.object.defaultQuantity)
        } else {
          this.object.defaultQuantity = formData['default-quantity']
          game.settings.set('CoC7', 'InvestigatorWizardQuantity', this.object.defaultQuantity)
        }
      } else if (this.object.defaultQuantity.toString() !== '0') {
        this.object.defaultQuantity = 0
        game.settings.set('CoC7', 'InvestigatorWizardQuantity', this.object.defaultQuantity)
      }
    } else if (typeof formData['coc-setup'] !== 'undefined') {
      if (this.object.setup !== formData['coc-setup']) {
        this.object.setup = formData['coc-setup']
        await this.setSkillLists()
      }
    } else if (typeof formData['coc-archetype'] !== 'undefined') {
      if (this.object.archetype !== formData['coc-archetype']) {
        this.object.archetype = formData['coc-archetype']
        this.object.coreCharacteristic = ''
        await this.setSkillLists()
      }
    } else if (typeof formData['coc-occupation'] !== 'undefined') {
      if (this.object.occupation !== formData['coc-occupation']) {
        this.object.occupation = formData['coc-occupation']
        await this.setSkillLists()
      }
    } else {
      for (const key in this.object.setupPoints) {
        if (typeof formData[key] !== 'undefined' && this.object.setupPoints[key] !== formData[key]) {
          this.object.setupPoints[key] = formData[key]
        }
      }
      if (typeof formData['coc-core-characteristic'] !== 'undefined' && this.object.coreCharacteristic !== formData['coc-core-characteristic']) {
        this.object.coreCharacteristic = formData['coc-core-characteristic']
        for (const key in this.object.setupPoints) {
          this.object.setupPoints[key] = ''
        }
      }
    }
    const flatKeys = ['name', 'age', 'residence', 'birthplace', 'language', 'avatar', 'token']
    for (const key of flatKeys) {
      if (typeof formData[key] !== 'undefined' && this.object[key] !== formData[key]) {
        this.object[key] = formData[key]
      }
    }
    if (event.submitter?.dataset.button === 'back') {
      const pageNumber = this.getPageNumber(-1)
      if (typeof pageNumber !== 'undefined') {
        this.object.step = pageNumber
      }
    } else if (event.submitter?.dataset.button === 'next') {
      if (this.object.step === this.pageList.PAGE_CREATE || (this.object.step === this.pageList.PAGE_BACKSTORY && game.user.role >= CONST.USER_PERMISSIONS.ACTOR_CREATE.defaultRole)) {
        this.attemptToCreate()
        return
      } else {
        const pageNumber = this.getPageNumber(1)
        if (typeof pageNumber !== 'undefined') {
          this.object.step = pageNumber
        }
      }
    }
    this.render(true)
  }

  async attemptToCreate () {
    const actorData = await this.normalizeCharacterData(this.object)
    if (game.user.isGM || game.user.role >= CONST.USER_PERMISSIONS.ACTOR_CREATE.defaultRole) {
      const actor = await CoC7InvestigatorWizard.createCharacter(actorData)
      actor.sheet.render(true)
      this.close()
    } else {
      const keepers = game.users.filter(u => u.active && u.isGM)
      if (keepers.length) {
        actorData.ownership[game.user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        const data = {
          type: 'character-wizard',
          listener: keepers[0].id,
          payload: actorData
        }
        game.socket.emit('system.CoC7', data)
        ui.notifications.info(
          game.i18n.localize('CoC7.InvestigatorWizard.CreatingInvestigator')
        )
        this.close()
      } else {
        ui.notifications.error(
          game.i18n.localize('CoC7.ErrorMissingKeeperUser')
        )
      }
    }
  }

  async normalizeCharacterData (data) {
    const weaponSkills = {
      melee: {},
      rngd: {}
    }
    const items = []
    for (const key in data.skillItems) {
      const skill = data.skillItems[key]
      for (let index = 0, im = skill.rows.length; index < im; index++) {
        const row = skill.rows[index]
        if (!skill.flags.isMultiple || row.selected !== false) {
          let item = duplicate(skill.item)
          if (row.selected !== false && typeof row.selected !== 'string') {
            item = duplicate(row.selected)
            row.selected = false
          }
          if (row.occupationToggle) {
            item.system.flags.occupation = true
          }
          if (row.archetypeToggle) {
            item.system.flags.archetype = true
          }
          let base = item.system.base
          if (!Number.isNumeric(base)) {
            for (const key in data.setupPoints) {
              const regEx = new RegExp('@' + key, 'i')
              base = base.replace(regEx, data.setupPoints[key])
            }
          }
          if (!Number.isNumeric(base)) {
            base = Math.floor(new Roll(base).evaluate({ async: false }).total)
          }
          item.system.base = base
          if (Number(row.personalPoints) > 0) {
            item.system.adjustments.personal = parseInt(row.personalPoints, 10)
          }
          if (Number(row.occupationPoints) > 0) {
            item.system.adjustments.occupation = parseInt(row.occupationPoints, 10)
          }
          if (Number(row.archetypePoints) > 0) {
            item.system.adjustments.archetype = parseInt(row.archetypePoints, 10)
          }
          if (Number(row.experiencePoints) > 0) {
            item.system.adjustments.experience = parseInt(row.experiencePoints, 10)
          }
          if (key === 'i.skill.language-own') {
            item.system.skillName = data.language
            item.name = item.system.specialization + ' (' + item.system.skillName + ')'
          } else if (typeof row.selected === 'string') {
            item.system.skillName = row.selected
            item._id = randomID()
            item.name = item.system.specialization + ' (' + item.system.skillName + ')'
            if (typeof item.flags.CoC7?.cocidFlag?.id !== 'undefined') {
              item.flags.CoC7.cocidFlag.id = game.system.api.cocid.guessId(item)
            }
          }
          if (item.system.properties?.fighting) {
            weaponSkills.melee[item.name] = item._id
            weaponSkills.melee[item.system.skillName] = item._id
          } else if (item.system.properties?.firearm) {
            weaponSkills.rngd[item.name] = item._id
            weaponSkills.rngd[item.system.skillName] = item._id
          }
          items.push(item)
        }
      }
    }
    for (const sourceItem of data.investigatorItems) {
      const item = duplicate(sourceItem)
      if (item.system.properties.melee) {
        if (typeof weaponSkills.melee[item.system.skill.main.name] !== 'undefined') {
          item.system.skill.main.id = weaponSkills.melee[item.system.skill.main.name]
        }
        if (typeof weaponSkills.melee[item.system.skill.alternativ.name] !== 'undefined') {
          item.system.skill.alternativ.id = weaponSkills.melee[item.system.skill.alternativ.name]
        }
      } else if (item.system.properties.rngd) {
        if (typeof weaponSkills.rngd[item.system.skill.main.name] !== 'undefined') {
          item.system.skill.main.id = weaponSkills.rngd[item.system.skill.main.name]
        }
        if (typeof weaponSkills.rngd[item.system.skill.alternativ.name] !== 'undefined') {
          item.system.skill.alternativ.id = weaponSkills.rngd[item.system.skill.alternativ.name]
        }
      }
      items.push(item)
    }
    const development = {
      personal: 2 * parseInt(data.setupPoints.int, 10),
      occupation: 0,
      archetype: 0
    }
    if (data.archetype !== '') {
      const archetype = await game.system.api.cocid.fromCoCID(data.archetype)
      if (archetype.length === 1) {
        items.push(archetype[0].toObject())
        development.archetype = archetype[0].system.bonusPoints
      }
    }
    if (data.occupation !== '') {
      const occupation = await game.system.api.cocid.fromCoCID(data.occupation)
      if (occupation.length === 1) {
        items.push(occupation[0].toObject())
        const options = []
        for (const [key, carac] of Object.entries(occupation[0].system.occupationSkillPoints)) {
          if (carac.selected) {
            if (carac.optional) {
              options.push(carac.multiplier * data.setupPoints[key])
            } else {
              development.occupation += carac.multiplier * data.setupPoints[key]
            }
          }
        }
        if (options.length > 0) {
          development.occupation += Math.max(...options)
        }
      }
    }
    const biography = []
    for (let index = 0, im = data.bioSections.length; index < im; index++) {
      biography.push({
        title: data.bioSections[index].name,
        value: data.bioSections[index].value
      })
    }
    const actorData = {
      type: 'character',
      name: data.name,
      img: data.avatar,
      system: {
        characteristics: {
          str: {
            value: parseInt(data.setupPoints.str, 10)
          },
          con: {
            value: parseInt(data.setupPoints.con, 10)
          },
          siz: {
            value: parseInt(data.setupPoints.siz, 10)
          },
          dex: {
            value: parseInt(data.setupPoints.dex, 10)
          },
          app: {
            value: parseInt(data.setupPoints.app, 10)
          },
          int: {
            value: parseInt(data.setupPoints.int, 10)
          },
          pow: {
            value: parseInt(data.setupPoints.pow, 10)
          },
          edu: {
            value: parseInt(data.setupPoints.edu, 10)
          }
        },
        attribs: {
          lck: {
            value: parseInt(data.setupPoints.luck, 10)
          },
          san: {
            value: parseInt(data.setupPoints.pow, 10)
          }
        },
        infos: {
          age: data.age,
          residence: data.residence,
          birthplace: data.birthplace
        },
        development,
        biography
      },
      prototypeToken: {
        name: data.name,
        actorLink: true,
        texture: {
          src: data.token
        },
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true
        },
        detectionModes: [{
          id: 'basicSight',
          range: 30,
          enabled: true
        }]
      },
      items,
      ownership: {
        default: parseInt(data.defaultOwnership, 10)
      }
    }
    return actorData
  }

  static async createCharacterFromData (actorData) {
    const actor = await CoC7InvestigatorWizard.createCharacter(actorData)
    const functionId = Hooks.on('renderActorSheet', (app, html, data) => {
      if (app.object.id === actor.id) {
        game.socket.emit('system.CoC7', {
          type: 'open-character',
          listener: Object.keys(actorData.ownership).find(k => k !== 'default'),
          payload: actor.id
        })
        Hooks.off('renderActorSheet', functionId)
      }
    })
    actor.sheet.render(true)
  }

  static async createCharacter (actorData) {
    const actor = await Actor.create(actorData)
    await actor.update({
      'system.attribs.hp.value': actor.rawHpMax,
      'system.attribs.mp.value': actor.rawMpMax,
      'system.attribs.san.max': actor.rawMpMax
    })
    await actor.resetDailySanity()
    return actor
  }

  /**
   * create it's the default way to create the CoC7CharacterWizard
   */
  static async create (options = {}) {
    options = mergeObject({
      step: 0,
      defaultSetup: game.settings.get('CoC7', 'InvestigatorWizardSetup'),
      defaultQuantity: game.settings.get('CoC7', 'InvestigatorWizardQuantity'),
      defaultOwnership: game.settings.get('CoC7', 'InvestigatorWizardOwnership'),
      defaultEra: game.settings.get('CoC7', 'worldEra'),
      rerollsEnabled: game.settings.get('CoC7', 'InvestigatorWizardRerolls'),
      setup: game.settings.get('CoC7', 'InvestigatorWizardSetup'),
      skillItems: {},
      occupationGroups: {},
      investigatorItems: [],
      setupPoints: {
        str: '',
        con: '',
        siz: '',
        dex: '',
        app: '',
        int: '',
        pow: '',
        edu: '',
        luck: ''
      },
      archetype: '',
      coreCharacteristic: '',
      occupation: '',
      bioSections: [],
      personal: 0,
      creditRating: {
        min: 0,
        max: 0
      },
      name: '',
      age: '',
      residence: '',
      birthplace: '',
      language: '',
      avatar: 'icons/svg/mystery-man.svg',
      token: 'icons/svg/mystery-man.svg'
    }, options)
    new CoC7InvestigatorWizard(options).render(true)
  }
}
