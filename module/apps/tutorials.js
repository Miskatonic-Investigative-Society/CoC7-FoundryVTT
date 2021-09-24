/* global Dialog, duplicate, game, Hooks, ui */
import { createInvestigator } from './tutorials/create-investigator.js'
import { importNPC } from './tutorials/import-npc.js'

export class CoC7Tutorial {
  constructor () {
    this.hooked = false
    this.step = 0
    this.tutorial = ''
    this.tutorials = {
      createInvestigator: createInvestigator,
      importNPC: importNPC
    }
    this.storage = {}
  }

  choose () {
    if (typeof game.CoC7Tutorial !== 'undefined') {
      let options = ''
      for (const key of Object.keys(this.tutorials)) {
        if (typeof this.tutorials[key].showIf === 'undefined' || this.tutorials[key].showIf()) {
          options = options + '<option value="' + key + '">' + game.i18n.localize(this.tutorials[key].name) + '</option>'
        }
      }
      if (options !== '') {
        Dialog.prompt({
          title: game.i18n.localize('CoC7.Tutorial.SelectTitle'),
          content: '<p>' + game.i18n.localize('CoC7.Tutorial.SelectDescription') + '</p><p><select class="tutorial"><option value="">' + game.i18n.localize('CoC7.Tutorial.None') + '</option>' + options + '</select></p>',
          callback: (html) => {
            const tutorial = html.find('.tutorial').val()
            if (tutorial !== '') {
              game.CoC7Tutorial.startTutorial(tutorial)
            }
          },
          rejectClose: null,
          defaultYes: false
        })
      }
    }
  }

  async startTutorial (tutorial) {
    if (this.tutorial !== '') {
      this.endTutorial()
    }
    if (tutorial !== '' && typeof this.tutorials[tutorial] !== 'undefined') {
      if (typeof this.tutorials[tutorial]?.requirements !== 'undefined') {
        if (await !this.tutorials[tutorial]?.requirements()) {
          return false
        }
      }
      this.tutorial = tutorial
      this.step = 0
      this.storage = {}
      if ($('#tutorial-message').length === 0) {
        $('body').append('<ol id="tutorial-message"><li class="notification info"><div>&nbsp;</div><i class="close fas fa-times-circle"></i></li></ol>')
        $('#tutorial-message i.close').click(function () {
          game.CoC7Tutorial.endTutorial()
        })
      }
      if ($('tutorial-pointer').length === 0) {
        $('body').append('<i id="tutorial-pointer" class="fas fa-arrow-up"></i>')
      }
      if (!this.hooked) {
        this.hooked = true
        Hooks.on('actorLockClickedCoC7', this.actorLockClickedCoC7)
        Hooks.on('archetypeFinishedCoC7', this.archetypeFinishedCoC7)
        Hooks.on('changeSidebarTab', this.changeSidebarTab)
        Hooks.on('occupationFinishedCoC7', this.occupationFinishedCoC7)
        Hooks.on('renderApplication', this.renderApplication)
        Hooks.on('renderActorSheet', this.renderActorSheet)
        Hooks.on('renderSceneMenuCoC7', this.renderSceneMenuCoC7)
        Hooks.on('setupFinishedCoC7', this.setupFinishedCoC7)
        Hooks.on('toggleCharCreation', this.toggleCharCreation)
      }
      if (typeof this.tutorials[tutorial]?.setup !== 'undefined') {
        await this.tutorials[tutorial]?.setup()
      }
      this.performStep()
    } else {
      ui.notifications.error(game.i18n.localize('CoC7.Tutorial.Error.NotFound'))
      this.endTutorial()
    }
  }

  endTutorial (lastStep = false) {
    this.step = 0
    this.tutorial = ''
    this.storage = {}
    $('#tutorial-pointer').remove()
    if (lastStep) {
      setTimeout(() => { if (game.CoC7Tutorial.tutorial === '') { $('#tutorial-message').remove() } }, 6000)
    } else {
      $('#tutorial-message').remove()
    }
  }

  nextStep (options) {
    $('.tutorial-outline').removeClass('tutorial-outline')
    if (typeof this.tutorials[this.tutorial] === 'undefined') {
      ui.notifications.error(game.i18n.localize('CoC7.Tutorial.Error.MissingTutorial'))
      this.endTutorial()
      return
    }
    let showIf = false
    do {
      this.step++
      showIf = (typeof this.tutorials[this.tutorial].steps[this.step] === 'undefined' || typeof this.tutorials[this.tutorial].steps[this.step].showIf === 'undefined' || this.tutorials[this.tutorial].steps[this.step].showIf())
    } while (!showIf)
    if (typeof this.tutorials[this.tutorial].steps[this.step] === 'undefined') {
      ui.notifications.error('CoC7.Tutorial.Error.MissingStep')
      this.endTutorial()
      return
    }
    this.performStep(options)
  }

  setPointer ({ drag = false, prefixId = '', prefix = '' } = {}) {
    try {
      if (drag) {
        this.tutorials[this.tutorial].steps[this.step]._pointer = duplicate(this.tutorials[this.tutorial].steps[this.step].dragAt)
      } else {
        this.tutorials[this.tutorial].steps[this.step]._pointer = duplicate(this.tutorials[this.tutorial].steps[this.step].pointAt)
      }
    } catch (e) {
      ui.notifications.error(e + ' / ' + (this.tutorial || '-') + ':' + (this.step || '-'))
      this.endTutorial()
      return
    }
    if (prefixId !== '') {
      this.tutorials[this.tutorial].steps[this.step]._pointer[1] = (prefixId !== '' ? '#' + prefixId : '') + ' ' + this.tutorials[this.tutorial].steps[this.step]._pointer[1]
    }
    if (prefix !== '') {
      this.tutorials[this.tutorial].steps[this.step]._pointer[1] = prefix + ' ' + this.tutorials[this.tutorial].steps[this.step]._pointer[1]
    }
    this.tutorials[this.tutorial].steps[this.step]._pointer[2] = drag
    return this.tutorials[this.tutorial].steps[this.step]._pointer[1]
  }

  setOutline ({ prefixId = '', prefix = '' } = {}) {
    this.tutorials[this.tutorial].steps[this.step]._outline = duplicate(this.tutorials[this.tutorial].steps[this.step].outline)
    if (prefixId !== '') {
      this.tutorials[this.tutorial].steps[this.step]._outline = (prefixId !== '' ? '#' + prefixId : '') + ' ' + this.tutorials[this.tutorial].steps[this.step]._outline
    }
    if (prefix !== '') {
      this.tutorials[this.tutorial].steps[this.step]._outline = prefix + ' ' + this.tutorials[this.tutorial].steps[this.step]._outline
    }
    return this.tutorials[this.tutorial].steps[this.step]._outline
  }

  setVariable (key, value) {
    this.storage[key] = value
  }

  getVariable (key) {
    return this.storage[key] || ''
  }

  performStep (options) {
    if (this.tutorials[this.tutorial]?.steps[this.step]) {
      const pointer = $('#tutorial-pointer')
      pointer.hide()
      let step = this.tutorials[this.tutorial]?.steps[this.step]
      if (pointer.length === 1 && step) {
        $('#tutorial-message div').html(game.i18n.localize(step.prompt))
        if (this.step === Object.keys(this.tutorials[this.tutorial].steps).length - 1) {
          this.endTutorial(true)
          return
        }
        if (typeof step.setup !== 'undefined') {
          step.setup(options)
        } else {
          if (typeof step.pointAt !== 'undefined') {
            this.setPointer({ drag: false })
          } else if (typeof step.dragAt !== 'undefined') {
            this.setPointer({ drag: true })
          }
          if (typeof step.outline !== 'undefined') {
            this.setOutline()
          }
        }
        step = this.tutorials[this.tutorial].steps[this.step]
        if (typeof step._pointer !== 'undefined') {
          this.attemptSelect = 8
          this.selectPointer(step, pointer)
        }
        if (typeof step._outline !== 'undefined') {
          this.attemptSelect = 8
          this.selectOutline(step)
        }
      } else {
        ui.notifications.error(game.i18n.localize('CoC7.Tutorial.Error.NotReady'))
        this.endTutorial()
      }
    } else {
      ui.notifications.error(game.i18n.localize('CoC7.Tutorial.Error.Gone'))
      this.endTutorial()
    }
  }

  selectPointer (step, pointer) {
    this.attemptSelect--
    if (this.attemptSelect === 0) {
      ui.notifications.error(game.i18n.localize('CoC7.Tutorial.Error.UnknownWhere'))
      this.endTutorial()
      return
    }
    const element = $(step._pointer[1])
    if (element.length === 1) {
      const bounds = element[0].getBoundingClientRect()
      if (!isNaN(bounds.left || '') && !isNaN(bounds.top || '')) {
        const midX = Math.floor(element.outerWidth() / 2) - Math.floor(pointer.outerWidth() / 2)
        const midY = Math.floor(element.outerHeight() / 2) - Math.floor(pointer.outerHeight() / 2)
        let left = bounds.left + (window.pageXOffset || document.documentElement.scrollLeft)
        let top = bounds.top + (window.pageYOffset || document.documentElement.scrollTop)
        pointer.removeClass('fa-arrows-alt')
        switch (step._pointer[0]) {
          case 'up':
            pointer.addClass('fa-arrow-up').removeClass('fa-arrow-right').removeClass('fa-arrow-down').removeClass('fa-arrow-left')
            top = top + element.outerHeight()
            left = left + midX
            break
          case 'right':
            pointer.removeClass('fa-arrow-up').addClass('fa-arrow-right').removeClass('fa-arrow-down').removeClass('fa-arrow-left')
            top = top + midY
            left = left - pointer.outerWidth()
            break
          case 'down':
            pointer.removeClass('fa-arrow-up').removeClass('fa-arrow-right').addClass('fa-arrow-down').removeClass('fa-arrow-left')
            top = top - pointer.outerHeight()
            left = left + midX
            break
          case 'left':
            pointer.removeClass('fa-arrow-up').removeClass('fa-arrow-right').removeClass('fa-arrow-down').addClass('fa-arrow-left')
            top = top + midY
            left = left + element.outerWidth()
            break
        }
        if (step._pointer[2]) {
          pointer.addClass('fa-arrows-alt')
        }
        pointer.css({
          top: top,
          left: left
        }).show()
        return
      } else {
        ui.notifications.error(game.i18n.localize('CoC7.Tutorial.Error.UnknownArea'))
        this.endTutorial()
        return
      }
    }
    setTimeout(() => { this.selectPointer(step, pointer) }, 500)
  }

  selectOutline (step) {
    this.attemptSelect--
    if (this.attemptSelect === 0) {
      ui.notifications.error(game.i18n.localize('CoC7.Tutorial.Error.UnknownWhere'))
      this.endTutorial()
      return
    }
    const element = $(step._outline)
    if (element.length === 1) {
      element.addClass('tutorial-outline')
      return
    }
    setTimeout(() => { this.selectOutline(step) }, 500)
  }

  actorLockClickedCoC7 (isLocked) {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'actorLockClickedCoC7') {
      const variables = { isLocked: isLocked }
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  archetypeFinishedCoC7 () {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'archetypeFinishedCoC7') {
      const variables = {}
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  changeSidebarTab (app) {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'changeSidebarTab' && next.tabName === app.tabName) {
      const variables = { id: app.id }
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  occupationFinishedCoC7 () {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'occupationFinishedCoC7') {
      const variables = {}
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  renderApplication (app, html, data) {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'renderApplication' && next.class === app.constructor.name) {
      const variables = { id: app.id }
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  renderActorSheet (app, html, data) {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'renderActorSheet' && next.class === app.constructor.name) {
      const variables = { id: app.id }
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  renderSceneMenuCoC7 (gmTools = false) {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'renderSceneMenuCoC7' && next.gmtools === gmTools) {
      const variables = { gmTools: gmTools }
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  setupFinishedCoC7 () {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'setupFinishedCoC7') {
      const variables = {}
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }

  toggleCharCreation (isCharCreation = false) {
    const next = game.CoC7Tutorial.tutorials[game.CoC7Tutorial.tutorial]?.steps[game.CoC7Tutorial.step]?.next
    if (typeof next?.hook !== 'undefined' && next.hook === 'toggleCharCreation' && next.isCharCreation === isCharCreation) {
      const variables = { isCharCreation: isCharCreation }
      if (typeof next?.check === 'undefined' || next.check(variables)) {
        game.CoC7Tutorial.nextStep(variables)
      }
    }
  }
}
