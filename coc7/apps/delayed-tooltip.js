export default class CoC7DelayedTooltip {
  /**
   * If FoundryVTT tooltip is already shown wait before showing the next
   * @param {HTMLElement} element
   * @param {Function} func
   */
  static init (element, func) {
    let showExpanded
    element.addEventListener('pointerenter', async (event) => {
      if (typeof element.dataset.generatedTooltip === 'undefined') {
        func(element)
        element.dataset.generatedBasicTooltip = element.dataset.generatedBasicTooltip + ' <span class="coc7-tooltip-blink">.</span>'
      }
      if (typeof element.dataset.generatedTooltip === 'string' && element.dataset.generatedTooltip.length === 0) {
        return
      }
      const delay = parseInt(game.settings.get('CoC7', 'toolTipDelay'))
      if (delay > 0) {
        // A different tooltip is currently shown
        showExpanded = true
        setTimeout(() => {
          if (!showExpanded) {
            return
          }
          game.tooltip.deactivate()
          game.tooltip.activate(element, { html: element.dataset.generatedTooltip, cssClass: 'coc7-wider-tooltip' })
        }, delay)
        game.tooltip.activate(element, { html: element.dataset.generatedBasicTooltip, cssClass: 'coc7-wider-tooltip' })
        return
      }
      game.tooltip.activate(element, { html: element.dataset.generatedTooltip, cssClass: 'coc7-wider-tooltip' })
    })
    // If leaving the element give a short amount of time to stop game.tooltip.activate being called
    element.addEventListener('pointerleave', (event) => {
      showExpanded = false
    })
  }
}
