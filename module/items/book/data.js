/* global game, ui */

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
      /** Actor did not performed an Initial Reading first */
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
     * reset progress to be equal necessary and complete Full Study
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
        /** Complete Full Study if progress is equal necessary */
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
}
