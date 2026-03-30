/* global $, game */
export class CoC7Tooltips {
  constructor () {
    this.ToolTipHover = null
    this.toolTipTimer = null
  }

  displayToolTip (toolTip) {
    if (typeof this.ToolTipHover !== 'undefined') {
      const bounds = this.ToolTipHover.getBoundingClientRect()
      if (!isNaN(bounds.left || '') && !isNaN(bounds.top || '')) {
        let left = bounds.left
        let top = bounds.top
        const heightText = $(this.ToolTipHover).outerHeight()
        $('body').append('<div id="help-tooltip" class="themed theme-light">' + toolTip + '</div>')
        const tip = $('#help-tooltip')
        const heightTip = tip.outerHeight()
        const widthTip = tip.outerWidth()
        if (window.innerHeight < heightText * 1.5 + heightTip + top) {
          top = top - heightTip
        } else {
          top = top + heightText * 1.5
        }
        if (window.innerWidth < widthTip + left) {
          left = window.innerWidth - widthTip
        }
        tip.css({
          left: left + 'px',
          top: top + 'px'
        })
      }
    }
  }

  toolTipLeave (event) {
    if (game.CoC7Tooltips.ToolTipHover === event.currentTarget) {
      clearTimeout(game.CoC7Tooltips.toolTipTimer)
      game.CoC7Tooltips.ToolTipHover = null
      $('#help-tooltip').remove()
    }
  }
}
