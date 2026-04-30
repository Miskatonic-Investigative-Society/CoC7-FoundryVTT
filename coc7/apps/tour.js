/* global foundry game Tour ui */
/* // FoundryVTT V12 */
export default class CoC7Tour extends (foundry.nue?.Tour ?? Tour) {
  /**
   * Wait for Html element to appear on body
   * @param {string} selector
   * @param {int} timeout
   * @returns {Promise<boolean>}
   */
  waitForElement (selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      // Is already on on the document
      const element = document.querySelector(selector)
      if (element) {
        resolve(true)
        return
      }

      let timeOut = false

      const observer = new MutationObserver((records, observer) => {
        const element = document.querySelector(selector)
        if (element) {
          observer.disconnect()
          if (timeOut !== false) {
            clearTimeout(timeOut)
          }
          resolve(true)
        }
      })

      observer.observe(document, {
        subtree: true,
        childList: true
      })

      timeOut = setTimeout(() => {
        // Avoid race condition
        const element = document.querySelector(selector)
        if (element) {
          observer.disconnect()
          resolve(true)
          return
        }
        if (timeout > 0) {
          timeOut = setTimeout(() => {
            observer.disconnect()
            resolve(false)
          }, timeout)
        }
      }, 50)
    })
  }

  /**
   * Pre Tour Step
   */
  async _preStep () {
    await super._preStep()

    // Close currently open applications
    if (this.stepIndex === 0) {
      for (const app of Object.values(ui.windows)) {
        app.close()
      }
      for (const app of foundry.applications.instances) {
        if (app[1].element.classList.contains('application')) {
          app[1].close()
        }
      }
    }

    await this.waitForElement(this.currentStep.selector)
    await new Promise(resolve => setTimeout(resolve, 50))

    if (typeof this.currentStep.sidebarTab !== 'undefined') {
      /* // FoundryVTT V12 */
      if (game.release.generation === 12) {
        ui.sidebar.activateTab(this.currentStep.sidebarTab)
      } else {
        ui.sidebar.changeTab(this.currentStep.sidebarTab, 'primary')
      }
    }
  }

  /**
   * Post Tour Step
   */
  async _postStep () {
    await super._postStep()

    if (this.isResetting) {
      this.isResetting = false
      return
    }

    if (this.stepIndex < 0 || !this.hasNext) {
      return
    }

    if (!this.currentStep.action) {
      return
    }

    switch (this.currentStep.action) {
      case 'click':
        document.querySelector(this.currentStep.selector).click()
        break
    }
  }

  /**
   * Tour Reset, flag as resetting so post steps don't complete
   */
  async reset () {
    if (this.status !== 'completed') {
      this.isResetting = true
    }
    await super.reset()
  }
}
