import { FOLDER_ID } from '../../constants.js'
import CoC7ModelsActorNPCSystem from './npc-system.js'

export default class CoC7ModelsActorCreatureSystem extends CoC7ModelsActorNPCSystem {
  /**
   * Default img
   * @returns {string}
   */
  static get defaultImg () {
    return 'systems/' + FOLDER_ID + '/assets/icons/floating-tentacles.svg'
  }
}
