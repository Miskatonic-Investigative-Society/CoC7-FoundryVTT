/* global game */
import { FOLDER_ID } from '../constants.js'

export default class CoCIDSkillCache {
  #cache
  #list

  /**
   * Get cached list (cache it first if required)
   * @returns {Array}
   */
  async getList () {
    if (typeof this.#cache === 'undefined') {
      return this.refreshList()
    }
    await this.#cache
    return this.#list
  }

  /**
   * Reset list and then returned
   * @returns {Array}
   */
  async refreshList () {
    this.#cache = new Promise((resolve, reject) => {
      game.CoC7.cocid.fromCoCIDRegexBest({ cocidRegExp: /^i\.skill\./, type: 'i', showLoading: true }).then((items) => {
        this.#list = {}
        for (const item of items) {
          this.#list[item.flags[FOLDER_ID].cocidFlag.id] = item
        }
        resolve()
      })
    })
    return this.getList()
  }

  /**
   * Add/replace best version cocid to cache
   * @param {string} cocid
   * @returns {Promise<void>}
   */
  async addItem (cocid) {
    if (cocid === '') {
      return
    }
    return new Promise((resolve, reject) => {
      game.CoC7.cocid.fromCoCIDBest({ cocid, type: 'i' }).then((items) => {
        if (typeof this.#list === 'undefined') {
          // Cache not yet populated (cold or in-flight). Wait for the full
          // refresh — it will include this item — rather than writing into
          // an undefined this.#list.
          this.getList().then((items) => {
            resolve()
          })
        } else {
          for (const item of items) {
            this.#list[item.flags[FOLDER_ID].cocidFlag.id] = item
          }
          resolve()
        }
      })
    })
  }

  /**
   * Remove cocid from cache if applicable
   * @param {string} cocid
   */
  removeItem (cocid) {
    if (typeof this.#list?.[cocid] !== 'undefined') {
      // No need to delete if not already included
      delete this.#list[cocid]
    }
  }
}
