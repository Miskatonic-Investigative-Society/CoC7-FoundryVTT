/* global ChatMessage CONST foundry game renderTemplate Roll ui */
import { FOLDER_ID } from '../../constants.js'
import CoC7DicePool from '../../apps/dice-pool.js'
import CoC7ModelsItemGlobalSystem from './global-system.js'
import CoC7ModelsItemSkillSystem from './skill-system.js'
import CoC7RollNormalize from '../../apps/roll-normalize.js'
import CoC7SanCheckCard from '../../apps/san-check-card.js'
import CoC7SystemSocket from '../../apps/system-socket.js'
import CoC7Utilities from '../../apps/utilities.js'

export default class CoC7ModelsItemBookSystem extends CoC7ModelsItemGlobalSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/secret-book.svg'
  }

  /**
   * Create Schema
   * @returns {DataSchema}
   */
  static defineSchema () {
    const fields = foundry.data.fields
    return {
      author: new fields.StringField({ initial: '' }),
      content: new fields.HTMLField({ initial: '' }),
      date: new fields.StringField({ initial: '' }),
      description: new fields.SchemaField({
        /* // FoundryVTT V13 - not required
        chat: '',
        */
        value: new fields.HTMLField({ initial: '' }),
        keeper: new fields.HTMLField({ initial: '' })
      }),
      difficultyLevel: new fields.StringField({ initial: 'regular' }),
      gains: new fields.SchemaField({
        cthulhuMythos: new fields.SchemaField({
          final: new fields.NumberField({ initial: 0 }),
          initial: new fields.NumberField({ initial: 0 })
        }),
        occult: new fields.NumberField({ initial: 0 }),
        others: new fields.ArrayField(
          new fields.SchemaField({
            name: new fields.StringField({ initial: game.i18n.localize('CoC7.NewSkillName') }),
            value: new fields.StringField({ initial: 'development' })
          })
        )
      }),
      language: new fields.StringField({ initial: '' }),
      mythosRating: new fields.NumberField({ initial: 0 }),
      sanityLoss: new fields.StringField({ initial: '0' }),
      itemDocuments: new fields.ArrayField(
        new fields.JSONField({ })
      ),
      itemKeys: new fields.ArrayField(
        new fields.StringField({ initial: '' })
      ),
      study: new fields.SchemaField({
        necessary: new fields.NumberField({ initial: 0 }),
        /* // FoundryVTT V13 - Moved to Actor
        progress: 0,
        */
        units: new fields.StringField({ initial: 'CoC7.weeks' })
      }),
      /* // FoundryVTT V13 - not required
      alternativeNames: [],
      /* // FoundryVTT V13 - Moved to Actor
      fullStudies: 0,
      initialReading: false,
      */
      type: new fields.SchemaField({
        mythos: new fields.BooleanField({ label: 'CoC7.Mythos', initial: false }),
        occult: new fields.BooleanField({ label: 'CoC7.Occult', initial: false }),
        other: new fields.BooleanField({ label: 'CoC7.Other', initial: false })
      })
    }
  }

  /**
   * Convert the difficulty on the select element to a format accepted
   * @param {string} difficulty
   * @returns {integer}
   */
  static convertDifficulty (difficulty) {
    switch (difficulty) {
      case 'hard':
        return CoC7DicePool.difficultyLevel.hard
      case 'extreme':
        return CoC7DicePool.difficultyLevel.extreme
      case 'critical':
        return CoC7DicePool.difficultyLevel.critical
      case 'unreadable':
        return CoC7DicePool.difficultyLevel.impossible
      default:
        return CoC7DicePool.difficultyLevel.regular
    }
  }

  /**
   * Handles all the logic involving the attempt of initial reading
   * Check callback to grantInitialReading
   */
  async attemptInitialReading () {
    const difficulty = CoC7ModelsItemBookSystem.convertDifficulty(this.difficultyLevel)
    const language = this.language
    const skill = this.parent.actor?.getSkillByName(language)
    if (!skill) {
      /**
       * The Actor who owns this does not have the skill of
       * the language in which it was written
       */
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.UnknownLanguage', { actor: this.parent.actor?.name ?? '?' }))
      return
    }
    const config = {
      rollType: CoC7RollNormalize.ROLL_TYPE.SKILL,
      cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
      cardTypeFixed: true,
      difficulty,
      actor: this.parent.actor,
      chatMessage: false,
      itemUuid: skill.uuid
    }
    const check = await CoC7RollNormalize.trigger(config)
    check.flavor = game.i18n.format('CoC7.ReadAttempt', {
      book: this.parent.name,
      language,
      difficulty: this.difficultyLevel
    })
    check.setCallback(this.parent.uuid, 'attemptInitialReading')
    check.toMessage()
  }

  /**
   * Use tome as a Mythos Reference
   */
  async attemptReference () {
    const roll = await new Roll('1D4').roll()
    const config = {
      cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
      cardTypeFixed: true,
      chatMessage: false,
      threshold: this.mythosRating
    }
    const check = await CoC7RollNormalize.trigger(config)
    if (check) {
      check.flavor = game.i18n.format('CoC7.ReferenceTomeFlavor', {
        book: this.parent.name,
        hours: roll.total,
        flavor: check.flavor
      })
      check.message = { rolls: [roll] }
      check.toMessage()
    }
  }

  /**
   * Modify study progress
   * @param {integer} modify
   */
  async alterProgress (modify) {
    if (!this.parent.isEmbedded) {
      /** This is not owned by any Actor */
      ui.notifications.error('CoC7.NotOwned', { localize: true })
      return
    }
    const knownBook = this.parent.actor?.system.getBook(this.parent)
    if (knownBook?.initialReading !== true) {
      /** Actor did not performed an initial reading first */
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.InitialReadingNeeded', { actor: this.parent.actor.name, book: this.parent.name }))
      return
    }
    if (modify < 0) {
      await this.parent.actor?.system.updateBook(this.parent, { progress: Math.max(0, parseInt(knownBook.progress, 10) + parseInt(modify, 10)) })
    } else if (modify > 0) {
      const necessary = parseInt(knownBook.necessary, 10)
      const currentProgress = parseInt(knownBook.progress, 10)
      if (currentProgress < necessary) {
        const progress = Math.min(necessary, currentProgress + parseInt(modify, 10))
        await this.parent.actor?.system.updateBook(this.parent, { progress })
        if (await this.checkExhaustion() && progress === necessary) {
          /* // FoundryVTT V12 */
          ui.notifications.warn(game.i18n.format('CoC7.BookHasNothingMoreToTeach', { actor: this.parent.actor.name, book: this.parent.name }))
        }
      }
    }
  }

  /**
   * Check if book can still reward Cthulhu Mythos improvements
   * @returns {boolean}
   */
  async checkExhaustion () {
    const knownBook = this.parent.actor?.system.getBook(this.parent)
    if (knownBook?.initialReading === true) {
      const mythosRating = this.mythosRating
      if (mythosRating > 0) {
        const cthulhuMythosSkill = this.parent.actor.cthulhuMythosSkill
        if (cthulhuMythosSkill && cthulhuMythosSkill.system.value >= mythosRating) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Perform initial reading
   */
  async grantInitialReading () {
    /** If initial reading has already been done there is nothing to do here */
    const knownBook = this.parent.actor.system.getBook(this.parent)
    if (knownBook?.initialReading === true) {
      return
    }
    const developments = []
    const mythos = {
      gains: this.gains.cthulhuMythos.initial,
      type: this.type.mythos
    }
    const occult = {
      gains: this.gains.occult,
      type: this.type.occult
    }
    const other = {
      gains: this.gains.others,
      type: this.type.other
    }
    if (mythos.type && mythos.gains) {
      developments.push({
        name: game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.cthulhu-mythos'),
        gain: parseInt(mythos.gains)
      })
    }
    if (occult.type && occult.gains) {
      developments.push({
        name: game.i18n.localize('CoC7.Occult'),
        gain: parseInt(occult.gains)
      })
    }
    if (other.type) {
      for (const skill of other.gains) {
        if (skill.value !== 'development') {
          skill.value = (await new Roll(skill.value, this.parent.actor.parsedValues()).roll()).total
        }
        if (skill.value) {
          developments.push({
            name: skill.name,
            gain: skill.value
          })
        }
      }
    }
    await this.grantSkillDevelopment(developments)
    if ((mythos.type || occult.type) && this.sanityLoss) {
      await this.rollSanityLoss()
    }

    await this.parent.actor.system.updateBook(this.parent, { initialReading: true })

    this.parent.sheet.render()
  }

  /**
   * Add the spell to the Actor
   * @param {string} spellId
   */
  async grantSpellLearning (spellId) {
    if (!this.parent.isEmbedded) {
      /** This is not owned by any Actor */
      ui.notifications.error('CoC7.NotOwned', { localize: true })
      return
    }
    const knownBook = this.parent.actor?.system.getBook(this.parent)
    if (knownBook?.initialReading !== true) {
      /** Actor did not performed an initial reading first */
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.InitialReadingNeeded', { actor: this.parent.actor.name, book: this.parent.name }))
      return
    }
    const spell = (await this.items()).find(spell => spell._id === spellId)
    if (spell) {
      if (knownBook.spellsLearned.includes(spellId)) {
        /* // FoundryVTT V12 */
        ui.notifications.warn(game.i18n.format('CoC7.SpellAlreadyLearned', { spell: spell.name, book: this.parent.name }))
        return
      }
      /* // FoundryVTT V12 */
      ui.notifications.info(game.i18n.format('CoC7.SpellSuccessfullyLearned', { spell: spell.name, book: this.parent.name }))
      await this.parent.actor.createEmbeddedDocuments('Item', [
        foundry.utils.duplicate(spell)
      ])
    }
  }

  /**
   * Receives an Array of skills and handles all the logic to develop them
   * @param {Array} developments @see grantInitialReading
   * @returns {Promise<Document|void>} create ChatMessage
   */
  async grantSkillDevelopment (developments) {
    if (developments.length === 0) {
      return
    }
    const createEmbeddedDocuments = []
    const updateEmbeddedDocuments = []
    for (const development of developments) {
      /** Test if the value is greater than zero */
      if (!development.gain) continue
      const skill = await this.parent.actor.getItemOrAdd(development.name, 'skill')
      if (!skill) {
        const offset = createEmbeddedDocuments.findIndex(row => row.name === development.name)
        if (offset > -1) {
          // Skill is going to be added to alter existing
          if (development.gain === 'development') {
            createEmbeddedDocuments[offset].system.flags.developement = true
          } else {
            createEmbeddedDocuments[offset].system.adjustments.experience = createEmbeddedDocuments[offset].system.adjustments.experience + parseInt(development.gain, 10)
          }
        } else {
          // Can't be added by cocid or name create empty
          const newSkill = CoC7ModelsItemSkillSystem.emptyObject({ name: development.name })
          if (development.gain === 'development') {
            newSkill.system.flags.developement = true
          } else {
            newSkill.system.adjustments.experience = parseInt(development.gain, 10)
          }
          createEmbeddedDocuments.push(newSkill)
        }
      } else {
        const offset = updateEmbeddedDocuments.findIndex(row => row._id === skill.id)
        if (offset > -1) {
          if (development.gain === 'development') {
            foundry.utils.setProperty(updateEmbeddedDocuments[offset], 'system.flags.developement', true)
          } else {
            foundry.utils.setProperty(updateEmbeddedDocuments[offset], 'system.adjustments.experience', (updateEmbeddedDocuments[offset].system?.adjustments?.experience ?? skill.system.adjustments.experience) + parseInt(development.gain, 10))
          }
        } else {
          const updates = {
            _id: skill.id
          }
          if (development.gain === 'development') {
            foundry.utils.setProperty(updates, 'system.flags.developement', true)
          } else {
            foundry.utils.setProperty(updates, 'system.adjustments.experience', skill.system.adjustments.experience + parseInt(development.gain, 10))
          }
          updateEmbeddedDocuments.push(updates)
        }
      }
    }
    if (createEmbeddedDocuments.length) {
      this.parent.actor.createEmbeddedDocuments('Item', createEmbeddedDocuments)
    }
    if (updateEmbeddedDocuments.length) {
      this.parent.actor.updateEmbeddedDocuments('Item', updateEmbeddedDocuments)
    }
    return this.showDevelopmentsTable(developments)
  }

  /**
   * Subsequent periods of full study may be undertaken, the difference being
   * that each study will take twice as long as the previous one
   */
  async redoFullStudy () {
    const knownBook = this.parent.actor?.system.getBook(this.parent)
    if (knownBook?.initialReading === true) {
      await this.parent.actor?.system.updateBook(this.parent, { progress: 0, necessary: knownBook.necessary * 2 })
    }
  }

  /**
   * Create Sanity Check Message bypassing the sanity check
   */
  async rollSanityLoss () {
    const value = this.sanityLoss
    if (!value || value === '') {
      return
    }
    CoC7SanCheckCard.create(CoC7Utilities.getActorUuid(this.parent.actor), {
      skipSanRoll: true,
      sanMax: value,
      sanMin: value,
      flavor: game.i18n.format('CoC7.ReadingMythosTome', {
        book: this.parent.name
      })
    })
  }

  /**
   * Show a table in the chat with all skill developments obtained
   * @param {Array<object>} developments
   * @returns {Promise<Document>} create ChatMessage
   */
  async showDevelopmentsTable (developments) {
    /** Prepare the Array data to be shown to the end user in chat */
    const templateData = {
      developments: []
    }
    for (const development of developments) {
      if (development.gain === 'development') {
        templateData.developments.push({
          name: development.name,
          gain: game.i18n.localize('CoC7.MarkedForDevelopment')
        })
      } else {
        templateData.developments.push({
          name: development.name,
          gain: '+' + development.gain + ' ' + game.i18n.localize('CoC7.Points')
        })
      }
    }
    /* // FoundryVTT V12 */
    const html = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/book-development.hbs', templateData)
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.parent.actor }),
      flavor: game.i18n.format('CoC7.GainsForReading', { book: this.parent.name }),
      content: html
    }
    return await ChatMessage.create(chatData)
  }

  /**
   * Attempt to learn the spell in the book
   * @param {string} id
   */
  async attemptSpellLearning (id) {
    if (!this.parent.isEmbedded) {
      /** This is not owned by any Actor */
      ui.notifications.error('CoC7.NotOwned', { localize: true })
      return
    }
    const knownBook = this.parent.actor?.system.getBook(this.parent)
    if (knownBook?.initialReading !== true) {
      /** Actor did not performed an initial reading first */
      /* // FoundryVTT V12 */
      ui.notifications.error(game.i18n.format('CoC7.InitialReadingNeeded', { actor: this.parent.actor.name, book: this.parent.name }))
      return
    }
    const spell = (await this.items()).find(spell => spell._id === id)
    if (spell) {
      const config = {
        rollType: CoC7RollNormalize.ROLL_TYPE.CHARACTERISTIC,
        cardType: CoC7RollNormalize.CARD_TYPE.NORMAL,
        cardTypeFixed: true,
        difficulty: CoC7DicePool.difficultyLevel.hard,
        actor: this.parent.actor,
        chatMessage: false,
        characteristic: 'int'
      }
      const check = await CoC7RollNormalize.trigger(config)
      check.flavor = game.i18n.format('CoC7.LearnSpellAttempt', {
        book: this.parent.name,
        spell: spell.name
      })
      check.setCallback(this.parent.uuid, 'attemptSpellLearning:' + id)
      check.toMessage()
    }
  }

  /**
   * Process callback
   * @param {CoC7Check} check
   */
  async updateRoll (check) {
    if (check.isSuccess) {
      if (this.parent.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
        switch (check.callbackContext) {
          case 'attemptInitialReading':
            await this.grantInitialReading()
            return
        }
        const attemptSpellLearning = check.callbackContext.match(/^attemptSpellLearning:(.+)$/)
        if (attemptSpellLearning) {
          await this.grantSpellLearning(attemptSpellLearning[1])
          return
        }
        throw new Error('Unexpected Book System call back')
      } else {
        CoC7SystemSocket.requestKeeperAction({
          type: 'callbackConCheck',
          messageId: check.message.id
        })
      }
    }
  }

  /**
   * Create empty object for this item type
   * @param {object} options
   * @returns {object}
   */
  static emptyObject (options) {
    const object = foundry.utils.mergeObject({
      name: game.i18n.localize('CoC7.NewBookName'),
      type: 'book',
      system: new CoC7ModelsItemBookSystem().toObject()
    }, options)
    return object
  }

  /**
   * Migrate old style data to new
   * @param {object} source
   * @returns {object}
   */
  static migrateData (source) {
    // Old system.spells array could contain mix of CoC IDs and Documents split into StringField and JSONField arrays
    if (typeof source.spells !== 'undefined' && typeof source.itemKeys === 'undefined' && typeof source.itemDocuments === 'undefined') {
      source.itemDocuments = source.spells.filter(x => typeof x !== 'string')
      source.itemKeys = source.spells.filter(x => typeof x === 'string')
    }
    // Moved description.unidentified to content
    if (typeof source.description?.unidentified !== 'undefined' && typeof source.content === 'undefined') {
      foundry.utils.setProperty(source, 'content', source.description.unidentified)
    }
    // Moved description.notes to description.keeper
    if (typeof source.description?.notes !== 'undefined' && typeof source.description?.keeper === 'undefined') {
      foundry.utils.setProperty(source, 'description.keeper', source.description.notes)
    }
    // Moved gain.cthulhuMythos.CMI to description.gains.cthulhuMythos.initial
    if (typeof source.gain?.cthulhuMythos?.CMI !== 'undefined' && typeof source.gains?.cthulhuMythos?.initial === 'undefined') {
      foundry.utils.setProperty(source, 'gains.cthulhuMythos.initial', source.gain.cthulhuMythos.CMI)
    }
    // Moved gain.cthulhuMythos.CMF to description.gains.cthulhuMythos.final
    if (typeof source.gain?.cthulhuMythos?.CMF !== 'undefined' && typeof source.gains?.cthulhuMythos?.final === 'undefined') {
      foundry.utils.setProperty(source, 'gains.cthulhuMythos.final', source.gain.cthulhuMythos.CMF)
    }
    // Moved gain.occult to description.gains.occult
    if (typeof source.gain?.occult !== 'undefined' && typeof source.gains?.occult === 'undefined') {
      foundry.utils.setProperty(source, 'gains.occult', source.gain.occult)
    }
    // Moved weeksStudyTime to study.necessary
    if (typeof source.weeksStudyTime !== 'undefined' && typeof source.study?.necessary === 'undefined') {
      foundry.utils.setProperty(source, 'study.necessary', source.weeksStudyTime)
    }
    return super.migrateData(source)
  }

  /**
   * Get JSON version of all spells
   * @returns {Array}
   */
  async items () {
    return CoC7Utilities.getEmbeddedItems(this.parent, 'system')
  }
}
