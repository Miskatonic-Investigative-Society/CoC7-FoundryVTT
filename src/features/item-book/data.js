/* global ChatMessage, foundry, game, renderTemplate, Roll, ui */
import { SanCheckCard } from '../sanity/chat/san-check.js'
import { CoC7Check } from '../../core/check.js'
import { CoC7Item } from '../../core/documents/item.js'
import { CoC7Spell } from '../item-spell/data.js'

export class CoC7Book extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      data.img = 'systems/CoC7/assets/icons/secret-book.svg'
    }
    super(data, context)
  }

  /** Convert the difficulty on the select element to a format accepted */
  static convertDifficulty (difficulty) {
    switch (difficulty) {
      case 'hard':
        return CoC7Check.difficultyLevel.hard
      case 'extreme':
        return CoC7Check.difficultyLevel.extreme
      case 'critical':
        return CoC7Check.difficultyLevel.critical
      case 'unreadable':
        return CoC7Check.difficultyLevel.impossible
      default:
        return CoC7Check.difficultyLevel.regular
    }
  }

  /**
   * For the future: add advanced rules for learning spells, pg. 176
   * @param [{Document}] spells
   * @returns {Promise<Document>} update to Item document
   */
  async addSpells (spells) {
    const collection = this.system.spells
      ? foundry.utils.duplicate(this.system.spells)
      : []
    for (const spell of spells) {
      collection.push(spell)
    }
    return await this.update({ 'system.spells': collection })
  }

  async spellDetail (index) {
    const isKeeper = game.user.isGM
    const data = this.system.spells[index]
    const parent = this.actor ? this.actor : null
    const spell = new CoC7Spell(data, { parent, bookId: this.id })
    if (isKeeper || spell.system.learned) {
      return await spell.sheet.render(true)
    }
  }

  /**
   * Handles all the logic involving the attempt of initial reading
   * @returns {Promise} @see listen @see grantInitialReading
   */
  async attemptInitialReading () {
    /** Converts the difficulty value to something accepted by CoC7Check */
    const difficulty = CoC7Book.convertDifficulty(
      this.system.difficultyLevel
    )
    const language = this.system.language
    const skill = this.actor?.getSkillsByName(language)
    if (!skill) {
      /** This is not owned by any Actor */
      return ui.notifications.error(game.i18n.localize('CoC7.NotOwned'))
    } else if (skill.length === 0) {
      /**
       * The Actor who owns this does not have the skill of
       * the language in which it was written
       */
      return ui.notifications.error(
        game.i18n.format('CoC7.UnknownLanguage', { actor: this.actor.name })
      )
    } else {
      const check = new CoC7Check()
      check.actor = this.actor
      check.skill = skill[0].id
      check.difficulty = difficulty
      check.parent = this.uuid
      check.context = 'INITIAL_READING'
      check.flavor = game.i18n.format('CoC7.ReadAttempt', {
        book: this.name,
        language,
        difficulty: this.system.difficultyLevel
      })
      await check.roll()
      return await check.toMessage()
    }
  }

  /**
   * Its is called every time the user interacts in some way with progress bar
   * @param {string} mode 'reset' || 'increase' || 'decrease'
   * @param {number} value just so that progress is not greater than necessary
   * @returns {Promise<Document>} update to Item document
   */
  async changeProgress (mode, value) {
    if (!this.isOwned && mode !== 'reset') {
      /** This is not owned by any Actor */
      return ui.notifications.error(game.i18n.localize('CoC7.NotOwned'))
    }
    if (!this.system.initialReading && mode !== 'reset') {
      /** Actor did not performed an initial reading first */
      return ui.notifications.error(
        game.i18n.format('CoC7.InitialReadingNeeded', {
          actor: this.actor.name,
          book: this.name
        })
      )
    }
    if (!this.system.type.mythos && mode !== 'reset') {
      return ui.notifications.error(game.i18n.localize('CoC7.NotMythosTome'))
    }
    const necessary = this.system.study.necessary
    let fullStudy = this.system.fullStudy
    let progress = this.system.study.progress
    if (isNaN(progress)) {
      /** It seems a little impossible, but you never know */
      return await this.update({
        'system.study.progress': 0
      })
    }
    if (value && progress > value) {
      /**
       * Progress value is greater than value entered by user as necessary,
       * reset progress to be equal necessary and complete full study
       */
      await this.update({
        'system.fullStudy': ++fullStudy,
        'system.study.progress': value
      })
      return await this.completeFullStudy()
    }
    if (mode === 'increase' && progress < necessary) {
      /** User clicked on plus icon to increase progress */
      if ((await this.checkExhaustion()) !== false) return
      await this.update({
        'system.study.progress': ++progress
      })
      if (progress === necessary) {
        /** Complete full study if progress is equal necessary */
        await this.update({ 'system.fullStudy': ++fullStudy })
        return await this.grantFullStudy()
      }
    } else if (mode === 'decrease' && progress > 0) {
      /** User clicked on minus icon to decrease progress */
      return await this.update({
        'system.study.progress': --progress
      })
    }
  }

  async checkExhaustion () {
    const actorMythosValue = this.actor?.cthulhuMythos
    const mythosRating = this.system.mythosRating
    if (this.system.initialReading) {
      if (actorMythosValue >= mythosRating) {
        await this.update({
          'system.study.progress': this.system.study.necessary
        })
        return ui.notifications.warn(
          game.i18n.format('CoC7.BookHasNothingMoreToTeach', {
            actor: this.actor.name,
            book: this.name
          })
        )
      } else return false
    }
  }

  async grantFullStudy () {
    if (!this.system.type.mythos) return
    if ((await this.checkExhaustion()) !== false) return
    const actorMythosValue = this.actor.cthulhuMythos
    const developments = []
    const mythosRating = this.system.mythosRating
    let mythosFinal = this.system.gains.cthulhuMythos.final
    if (actorMythosValue + mythosFinal > mythosRating) {
      for (let index = 1; index <= mythosFinal; index++) {
        if (actorMythosValue + mythosFinal - index <= mythosRating) {
          mythosFinal -= index
        }
      }
    }
    /**
     * The reader automatically gains a skill tick for the
     * language in which the book is written
     */
    developments.push(
      {
        name: game.i18n.localize('CoC7.CoCIDFlag.keys.i.skill.cthulhu-mythos'),
        gain: parseInt(mythosFinal)
      },
      {
        name: this.system.language,
        gain: 'development'
      }
    )
    await this.grantSkillDevelopment(developments)
    await this.rollSanityLoss()
    return await this.update({
      'system.fullStudies': ++this.system.fullStudies
    })
  }

  /**
   *
   * @returns {Promise<Document>} update to Item document
   */
  async grantInitialReading () {
    /** If initial reading has already been done there is nothing to do here */
    if (this.system.initialReading) return
    const developments = []
    const mythos = {
      gains: this.system.gains.cthulhuMythos.initial,
      type: this.system.type.mythos
    }
    const occult = {
      gains: this.system.gains.occult,
      type: this.system.type.occult
    }
    const other = {
      gains: this.system.gains.others,
      type: this.system.type.other
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
        const pattern = skill.name.match(/^(.+) \((.+)\)$/)
        /** Sanitization to deal with specializations */
        if (pattern) {
          skill.specialization = pattern[1]
          skill.name = pattern[2]
        }
        if (skill.value !== 'development') {
          skill.value = (
            await new Roll(skill.value).roll({ async: true })
          ).total
        }
        if (skill.value) {
          developments.push({
            name: skill.name,
            gain: skill.value,
            specialization: skill.specialization
          })
        }
      }
    }
    await this.grantSkillDevelopment(developments)
    if ((mythos.type || occult.type) && this.system.sanityLoss) {
      await this.rollSanityLoss()
    }
    /** Mark initial reading as complete */
    return await this.update({ 'system.initialReading': true })
  }

  /**
   *
   * @param {Item} spelllearned The spell that was learned successfully from book
   * @returns
   */
  async grantSpellLearning (spelllearned) {
    for (const spell of this.system.spells) {
      if (spell._id === spelllearned._id) {
        spell.system.learned = true
        // Does the actor already has a spell of that name? Then do not add the spell
        const existingSpell = await this.actor.items.find(
          item =>
            item.type === 'spell' && item.name === spelllearned.name
        )
        if (!existingSpell) {
          spelllearned.system.learned = true
        } else {
          ui.notifications.warn(
            game.i18n.format('CoC7.SpellAlreadyLearned', {
              spell: spelllearned.name,
              book: this.name
            })
          )
        }
        break
      }
    }
    // Save spell list of book
    await this.update({ 'system.spells': this.system.spells })
    // Add learned spell to actor
    if (spelllearned.system.learned) {
      ui.notifications.info(
        game.i18n.format('CoC7.SpellSuccessfullyLearned', {
          spell: spelllearned.name,
          book: this.name
        })
      )
      await this.actor.createEmbeddedDocuments('Item', [
        foundry.utils.duplicate(spelllearned)
      ])
    }
  }

  /**
   * Receives an Array of skills and handles all the logic to develop them
   * @param {Array} developments @see grantInitialReading
   * @returns {Promise<Document>} update to Item document
   */
  async grantSkillDevelopment (developments) {
    if (developments.length === 0) return
    for (const development of developments) {
      /** Test if the value is greater than zero */
      if (!development.gain) continue
      let skill = await this.actor.getSkillsByName(development.name)
      /** The Actor does not own this skill, create a new one
       * First, check if there is any skill in the game with the same name
       * In the last alternative just create a new generic skill
       */
      if (skill.length === 0) {
        const existingSkill = await game.items.find(
          item =>
            item.type === 'skill' && item.name === development.name
        )
        if (existingSkill) {
          skill = await this.actor.createEmbeddedDocuments('Item', [
            foundry.utils.duplicate(existingSkill)
          ])
        } else {
          skill = await this.actor.createSkill(development.name, 0)
          if (development.specialization) {
            await skill[0].update({
              'system.properties.special': true,
              'system.specialization': development.specialization
            })
          }
        }
      }
      skill = skill[0]
      if (development.gain === 'development') {
        /** Simply mark the skill for development */
        await skill.flagForDevelopement()
      } else {
        /**
         * If the received value gained is numeric, ensure that the amount
         * will not exceed the maximum value of 99
         */
        if (skill.value + development.gain > 99) {
          for (let index = 1; index <= development.gain; index++) {
            if (skill.value + development.gain - index <= 99) {
              development.gain -= index
              await skill.increaseExperience(development.gain)
              continue
            }
          }
        }
        await skill.increaseExperience(development.gain)
      }
    }
    return this.showDevelopmentsTable(developments)
  }

  /**
   * Subsequent periods of full study may be undertaken, the difference being
   * that each study will take twice as long as the previous one
   * @returns {Promise.<Document>} update to Item document
   */
  async redoFullStudy () {
    await this.update({ 'system.study.progress': 0 })
    return await this.update({
      'system.study.necessary': this.system.study.necessary * 2
    })
  }

  /** Bypass the Sanity check and just roll the damage */
  async rollSanityLoss () {
    const value = this.system.sanityLoss
    if (!value || value === '') return
    const template = SanCheckCard.template
    let html = await renderTemplate(template, {})
    const message = await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: game.i18n.format('CoC7.ReadingMythosTome', {
        book: this.name
      }),
      content: html
    })
    const card = await message.getHTML()
    if (typeof card.length !== 'undefined' && card.length === 1) {
      const sanityLoss = (await new Roll(value).roll({ async: true })).total
      html = card.find('.chat-card')[0]
      html.dataset.object = escape(
        JSON.stringify({
          actorKey: this.actor.id,
          fastForward: false,
          sanData: {
            sanMin: sanityLoss,
            sanMax: sanityLoss
          }
        })
      )
      const sanityCheck = SanCheckCard.getFromCard(html)
      await sanityCheck.bypassRollSan()
      await sanityCheck.rollSanLoss()
      sanityCheck.updateChatCard()
    }
  }

  /**
   * Show a table in the chat with all skill developments obtained
   * @param {Array<Object>} developments
   * @returns {Promise<Document>} create ChatMessage
   */
  async showDevelopmentsTable (developments) {
    /** Prepare the Array data to be shown to the end user in chat */
    for (const development of developments) {
      if (development.specialization) {
        development.name = `${development.specialization} (${development.name})`
      }
      if (development.gain === 'development') {
        development.gain = game.i18n.localize('CoC7.MarkedForDevelopment')
      } else {
        development.gain = `+${development.gain} ${game.i18n.localize(
          'CoC7.Points'
        )}`
      }
    }
    const template = 'systems/CoC7/templates/items/book/development.html'
    const html = await renderTemplate(template, { developments })
    return await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: game.i18n.format('CoC7.GainsForReading', { book: this.name }),
      content: html
    })
  }

  async attemptSpellLearning (id) {
    if (!this.isOwned) {
      /** This is not owned by any Actor */
      return ui.notifications.error(game.i18n.localize('CoC7.NotOwned'))
    }
    if (!this.system.initialReading) {
      /** Actor did not performed an initial reading first */
      return ui.notifications.error(
        game.i18n.format('CoC7.InitialReadingNeeded', {
          actor: this.actor.name,
          book: this.name
        })
      )
    }
    const spell = this.system.spells.find(spell => {
      return spell._id === id
    })
    if (spell) {
      const check = new CoC7Check()
      check.actor = this.actor
      check.difficulty = CoC7Check.difficultyLevel.hard
      check.parent = this.uuid
      check.flavor = game.i18n.format('CoC7.LearnSpellAttempt', {
        book: this.name,
        spell: spell.name
      })
      check.context = 'SPELL_LEARNING'
      check.spell = spell
      await check.rollCharacteristic('int')
      await check.toMessage()
    }
  }

  /** Listen to changes on the check card */
  async updateRoll (roll) {
    const check = CoC7Check.fromRollString(roll)

    /** Will know if user push the roll or spend Luck */
    if (check.passed) {
      if (check.context === 'INITIAL_READING') {
        return await this.grantInitialReading()
      } else if (check.context === 'SPELL_LEARNING') {
        return await this.grantSpellLearning(check.spell)
      }
    }
  }
}
