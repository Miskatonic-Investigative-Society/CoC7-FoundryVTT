import { CoCActor } from '../actor.js'

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
    const build = parseInt(this.data.data.attribs.build.value)
    return isNaN(build) ? null : build
  }

  get hp () {
    if (
      this.data.data.attribs.build.current === null ||
      undefined === this.data.data.attribs.build.current ||
      this.data.data.attribs.build.current === ''
    ) {
      return this.build
    }
    if (
      this.data.data.attribs.build.current > this.data.data.attribs.build.value
    ) {
      return this.build
    }
    const hp = parseInt(this.data.data.attribs.build.current)
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
    return await this.update({ 'data.attribs.build.current': value })
  }

  get rawDb () {
    return this.db
  }
  
  get db () {
    const db = parseInt(this.data.data.attribs.db?.value)
    return isNaN(db) ? null : db
  }

  get rawMov () {
    return this.mov
  }
  
  get mov () {
    const mov = parseInt(this.data.data.attribs.mov?.value)
    return isNaN(mov) ? null : mov
  }

  get mpMax () {
    return parseInt(this.data.data.attribs?.mp?.max) || 0
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
