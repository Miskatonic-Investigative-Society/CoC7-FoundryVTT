import { CoCActor } from '../../core/documents/actor.js'

export class CoC7Vehicle extends CoCActor {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      data.img = 'systems/CoC7/assets/icons/jeep.svg'
    }
    super(data, context)
  }

  get rawBuild () {
    return this.build
  }

  get build () {
    const build = parseInt(this.system.attribs.build.value)
    return isNaN(build) ? null : build
  }

  get hp () {
    if (
      this.system.attribs.build.current === null ||
      undefined === this.system.attribs.build.current ||
      this.system.attribs.build.current === ''
    ) {
      return this.build
    }
    if (
      this.system.attribs.build.current > this.system.attribs.build.value
    ) {
      return this.build
    }
    const hp = parseInt(this.system.attribs.build.current)
    return isNaN(hp) ? null : hp
  }

  get hpMax () {
    return this.build
  }

  get rawHpMax () {
    return this.build
  }

  async setHp (value) {
    if (value > this.build) value = this.build
    return await this.update({ 'system.attribs.build.current': value })
  }

  get rawDb () {
    return this.db
  }

  get db () {
    const db = parseInt(this.system.attribs.db?.value)
    return isNaN(db) ? null : db
  }

  get rawMov () {
    return this.mov
  }

  get mov () {
    const mov = parseInt(this.system.attribs.mov?.value)
    return isNaN(mov) ? null : mov
  }

  get mpMax () {
    return parseInt(this.system.attribs?.mp?.max) || 0
  }

  get rawMpMax () {
    return this.mpMax
  }

  get sanMax () {
    return null
  }

  get rawSanMax () {
    return null
  }
}
