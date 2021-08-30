/* global duplicate, game, Roll, ui */

import { CoC7Check } from '../../check.js'
import { CoC7Item } from '../item.js'

export class CoC7Book extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') data.img = 'icons/svg/book.svg'
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
   * Handles all the logic involving the attempt of initial reading
   * @returns {Promise} @see listen @see grantInitialReading
   */
  async attemptInitialReading () {
    /** Converts the difficulty value to something accepted by CoC7Check */
    const difficulty = CoC7Book.convertDifficulty(
      this.data.data.difficultyLevel
    )
    const language = this.data.data.language
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
        game.i18n.format('CoC7.UnknownLanguage', {
          actor: this.actor.name,
          language
        })
      )
    } else {
      const check = new CoC7Check()
      check.actor = this.actor
      check.skill = skill[0].id
      check.difficulty = difficulty
      check.flavor = game.i18n.format('CoC7.ReadAttempt', {
        book: this.name,
        language,
        difficulty: this.data.data.difficultyLevel
      })
      check.roll()
      await check.toMessage()
      if (check.passed) return await this.grantInitialReading()
      /** Listen for a Luck spent or a pushed roll to see if there will be a later success */
      else { await this.listen(check) }
    }
  }

  /**
   * Its is called every time the user interacts in some way with progress bar
   * @param {string} mode 'reset' || 'increase' || 'decrease'
   * @param {number} value just so that progress is not greater than necessary
   * @returns {Promise.<Document>} update to Item document
   */
  async changeProgress (mode, value) {
    if (!this.isOwned && mode !== 'reset') {
      /** This is not owned by any Actor */
      return ui.notifications.error(game.i18n.localize('CoC7.NotOwned'))
    }
    if (!this.data.data.initialReading && mode !== 'reset') {
      /** Actor did not performed an initial reading first */
      return ui.notifications.error(
        game.i18n.format('CoC7.InitialReadingNeeded', {
          actor: this.actor.name,
          book: this.name
        })
      )
    }
    let fullStudy = this.data.data.fullStudy
    let progress = this.data.data.study.progress
    const necessary = this.data.data.study.necessary
    if (isNaN(progress)) {
      /** It seems a little impossible, but you never know */
      return await this.update({
        'data.study.progress': 0
      })
    }
    if (value && progress > value) {
    /**
     * Progress value is greater than value entered by user as necessary,
     * reset progress to be equal necessary and complete full study
     */
      await this.update({
        'data.fullStudy': ++fullStudy,
        'data.study.progress': value
      })
      return await this.completeFullStudy()
    }
    if (mode === 'increase' && progress < necessary) {
      /** User clicked on plus icon to increase progress */
      await this.update({
        'data.study.progress': ++progress
      })
      if (progress === necessary) {
        /** Complete full study if progress is equal necessary */
        await this.update({ 'data.fullStudy': ++fullStudy })
        return await this.completeFullStudy()
      }
    } else if (mode === 'decrease' && progress > 0) {
      /** User clicked on minus icon to decrease progress */
      return await this.update({
        'data.study.progress': --progress
      })
    }
  }

  async completeFullStudy () {}

  async listen (check) {}

  async grantFullStudy () {
    const language = this.data.data.language
    /**
     * The reader automatically gains a skill tick for the
     * language in which the book is written
     */
    await this.grantSkillDevelopment('development', language)
  }

  /**
   *
   * @returns {Promise<Document>} update to Item document
   */
  async grantInitialReading () {
    /** If initial reading has already been done there is nothing to do here */
    if (this.data.data.initialReading) return
    const developments = []
    if (this.data.data.type.cthulhuMythos) {
      developments.push({
        name: game.i18n.localize('CoC7.CthulhuMythosNames'),
        gain: parseInt(this.data.data.gains.cthulhuMythos.initial)
      })
    }
    if (this.data.data.type.occult) {
      developments.push({
        name: game.i18n.localize('CoC7.Occult'),
        gain: parseInt(this.data.data.gains.occult)
      })
    }
    if (this.data.data.type.other) {
      this.data.data.gains.other.forEach(async skill => {
        /** TODO: sanitize name to handle with specializations */
        if (skill.value !== 'development') {
          skill.value = new Roll(skill.value).roll({ async: false }).total
        }
        developments.push({
          name: skill.name,
          gain: skill.value
        })
      })
    }
    await this.grantSkillDevelopment(developments)
    /** Mark initial reading as complete */
    return await this.update({ 'data.initialReading': true })
  }

  /**
   *
   * @param {Array} developments @see grantInitialReading
   * @returns {Promise<Document>} update to Item document
   */
  async grantSkillDevelopment (developments) {
    for (const development of developments) {
      /** Test if the value is greater than zero */
      if (!development.gain) continue
      let skill = await this.actor.getSkillsByName(development.name)
      /** If the Actor does not own this skill, create a new one */
      if (skill.length === 0) {
        /** Check if there is any skill in the game with the same name */
        const existingSkill = await game.items.find(async item => {
          if (item.data.type === 'skill' && item.data.name === item.name) {
            /** If so, create a new skill based on this one */
            await this.actor.createEmbeddedDocuments('Item', [duplicate(item)])
          }
        })
        /** In the last alternative just create a new generic skill */
        if (!existingSkill) await this.actor.createSkill(skill.name, 0)
      }
      skill = await this.actor.getSkillsByName(development.name)[0]
      if (development.gain === 'development') {
        /** Simply mark the skill for development */
        await skill.flagForDevelopment()
        continue
      } else {
        if (skill.value + development.gain > 99) {
          /**
           * If the received value gained is numeric, ensure that the amount
           * will not exceed the maximum value of 99
           */
          for (let i = 1; i <= development.gain; i++) {
            if (skill.value + development.gain <= 99) {
              await skill.increaseExperience(development.gain - i)
              continue
            }
          }
        }
        await skill.increaseExperience(development.gain)
      }
    }
  }

  /**
   * Subsequent periods of full study may be undertaken, the difference being
   * that each study will take twice as long as the previous one
   * @returns {Promise.<Document>} update to Item document
   */
  async redoFullStudy () {
    await this.update({ 'data.study.progress': 0 })
    return await this.update({
      'data.study.necessary': this.item.data.data.study.necessary * 2
    })
  }
}
