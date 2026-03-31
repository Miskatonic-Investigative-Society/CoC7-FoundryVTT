/* global foundry */
export default class ChaosiumCanvasInterface extends foundry.data.regionBehaviors.RegionBehaviorType {
  /**
   * Action Options Key Name Pairs
   * @returns {object}
   */
  static get actionToggles () {
    return {
      [ChaosiumCanvasInterface.actionToggle.On]: 'CoC7.ChaosiumCanvasInterface.Actions.Show',
      [ChaosiumCanvasInterface.actionToggle.Off]: 'CoC7.ChaosiumCanvasInterface.Actions.Hide',
      [ChaosiumCanvasInterface.actionToggle.Toggle]: 'CoC7.ChaosiumCanvasInterface.Actions.Toggle'
    }
  }

  /**
   * Action Options Name Key Pairs
   * @returns {object}
   */
  static get actionToggle () {
    return {
      Off: 0,
      On: 1,
      Toggle: 2
    }
  }

  /**
   * Trigger Button Key Name Pairs
   * @returns {object}
   */
  static get triggerButtons () {
    return {
      [ChaosiumCanvasInterface.triggerButton.Left]: 'CoC7.ChaosiumCanvasInterface.Buttons.Left',
      [ChaosiumCanvasInterface.triggerButton.Right]: 'CoC7.ChaosiumCanvasInterface.Buttons.Right'
    }
  }

  /**
   * Trigger Button Name Key Pairs
   * @returns {object}
   */
  static get triggerButton () {
    return {
      Left: 0,
      Right: 2
    }
  }

  // static get icon (): string
  // static defineSchema (): object
  // async _handleMouseOverEvent (): boolean
  // [optional] async _handleLeftClickEvent (): void
  // [optional] async _handleRightClickEvent (): void
}
