import { CoC7Check } from '../../check.js'
import { CoC7Item } from '../item.js'

export class CoC7Book extends CoC7Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') data.img = 'icons/svg/book.svg'
    super(data, context)
  }
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
  async _changeProgress (mode, value) {
    if (!this.isOwned) {
      return ui.notifications.error(
        'This item must be owned by an Actor for the Full Study progress count to be done.'
      )
    }
    if (!this.data.data.initialReading) {
      return ui.notifications.error(
        `${this.actor.name} need to perform an Initial Reading on <i>${this.name}</i> to be able to advance through Full Study progress.`
      )
    }
    let fullStudy = this.data.data.fullStudy
    let progress = this.data.data.study.progress
    let necessary = this.data.data.study.necessary
    if (isNaN(progress)) {
      return await this.update({
        'data.study.progress': 0
      })
    }
    if (value && progress > value) {
      await this.update({
        'data.fullStudy': ++fullStudy,
        'data.study.progress': value
      })
      return await this.completeFullStudy()
    }
    if (mode === 'increase' && progress < necessary) {
      await this.update({
        'data.study.progress': ++progress
      })
      if (progress === necessary) {
        await this.update({ 'data.fullStudy': ++fullStudy })
        return await this.completeFullStudy()
      }
    } else if (mode === 'decrease' && progress > 0) {
      return await this.update({
        'data.study.progress': --progress
      })
    }
  }

  async completeFullStudy () {
    console.log(this)
  }

  // async _increaseProgress () {
  //   isNaN(this.data.data.progress)
  //     ? await this.item.update({ 'data.progress': 0 })
  //     : false
  //   this.item.data.data.progress < this.item.data.data.weeksStudyTime
  //     ? await this.item.update({
  //         'data.progress': this.item.data.data.progress + 1
  //       })
  //     : false
  //   if (this.item.data.data.progress == this.item.data.data.weeksStudyTime) {
  //     const book = this.item
  //     await this.item.update({ 'data.fullStudy': true })
  //     this.item.data.data.redoingFullStudy
  //       ? delete this.item.data.data.redoingFullStudy
  //       : false
  //     this.actor.didFullStudy(book)
  //   }
  //   return this.item.render(true)
  // }
  async _redoFullStudy () {
    await this.item.update({ 'data.progress': 0 })
    await this.item.update({
      'data.weeksStudyTime': this.item.data.data.weeksStudyTime * 2
    })
    await this.item.update({ 'data.redoingFullStudy': true })
    return this.item.render(true)
  }

  async listen (check) {
    Hooks.on('renderChatMessage', (data, html) => {
      if (data.id === check.referenceMessageId) {
        const rollResult = html.find('.roll-result')
        console.log(rollResult)
        if (rollResult.data('isSuccess')) console.log(rollResult)
        if (rollResult.data('pushedRoll')) {
          this.listen('pushed')
        }
      }
      if (check === 'pushed') {
        const pushedResult = html.find('.roll-result')
      }
    })
  }

  async _attemptInitialReading () {
    const difficulty = CoC7Book.convertDifficulty(
      this.data.data.difficultyLevel
    )
    const language = this.data.data.language
    if (!language || language === '') {
      await this.update({ 'data.language': 'English' })
    }
    let skill = this.actor.getSkillsByName(language)
    if (skill.length === 0) {
      return ui.notifications.error(
        `${this.actor.name} does not know the ${language} language.`
      )
    } else {
      const check = new CoC7Check()
      check.actor = this.actor
      check.skill = skill[0].id
      check.difficulty = difficulty
      check.flavor = `Attempt to read <i>${this.name}</i> (${language}), ${this.data.data.difficultyLevel} difficulty.`
      check.roll()
      await check.toMessage()
      if (check.passed) {
        console.log('!!!')
      } else {
        await this.listen(check)
      }
    }

    // const book = this.item
    // if (await this.actor.attemptInitialReading(book)) {
    //   await this.item.update({ 'data.initialReading': true })
    //   await this.item.update({ 'data.progress': 0 })
    //   await this.actor.didInitialReading(book)
    // }
    // async attemptInitialReading(book) {
    // let language = book.data.data.language;
    // let difficulty = book.data.data.difficultyLevel;
    // language == '' || language == null ? language = 'English' : false;
    // difficulty = CoC7Utilities.convertDifficulty(difficulty);
    // let skill = this.getSkillsByName(language);
    // if (skill.length != 0) {
    //   skill = skill[0];
    //   let check = new CoC7Check();
    //   CoC7Dice.showRollDice3d(check);
    //   check.actor = this.tokenKey;
    //   check.skill = skill;
    //   check.difficulty = difficulty;
    //   check.roll();
    //   let attemptToChat = new BookProgress();
    //   attemptToChat.actor = this.tokenKey;
    //   attemptToChat.actorKey = this.actorKey;
    //   attemptToChat.fullStudy = false;
    //   attemptToChat.book = book;
    //   attemptToChat.sanLoss = book.data.data.sanLoss;
    //   attemptToChat.check = check;
    //   //check.toMessage();
    //   attemptToChat.toMessage();
    //   return check.passed;
    // } else {
    //   ui.notifications.warn(game.i18n.format('CoC7.notKnowLanguage', {actor: this.name, language: language}));
    // }
    // }
  }
  async _onSpellDelete (event) {
    if (game.user.isGM) {
      let spellIndex = $(event.currentTarget)
        .parents('.spell')
        .data('spell-id')
      if (spellIndex) await this.removeSpell(spellIndex)
    }
  }

  async removeSpell (spellId) {
    const spellIndex = this.item.data.data.spells.findIndex(s => {
      return s._id === spellId
    })
    if (-1 < spellIndex) {
      const spells = this.item.data.data.spells
        ? duplicate(this.item.data.data.spells)
        : []
      spells.splice(spellIndex, 1)
      await this.item.update({ 'data.spells': spells })
    }
  }
}
