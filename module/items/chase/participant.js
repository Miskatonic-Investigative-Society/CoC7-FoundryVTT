
import { chatHelper } from '../../chat/helper.js'
import { CoC7Check } from '../../check.js'

export class _participant {
    constructor (data = {}) {
      this.data = data
    }
  
    get actor () {
      if (!this._actor) {
        this._actor = chatHelper.getActorFromKey(this.data.actorKey)
      }
      return this._actor
    }
  
    get isActor () {
      return this.hasActor || this.hasVehicle
    }
  
    get isActive () {
      return this.data.active || false
    }
  
    get key () {
      if (this.hasVehicle) return this.vehicle.actorKey
      if (this.hasActor) return this.actor.actorKey
      return undefined
    }
  
    get icon () {
      if (!this.isActor) {
        return 'systems/CoC7/assets/icons/question-circle-regular.svg'
      }
      if (this.hasVehicle) return this.vehicle.img
      if (this.hasActor) return this.actor.img
      return undefined
    }
  
    get driver () {
      if (!this._driver) {
        this._driver = chatHelper.getActorFromKey(this.data.actorKey)
      }
      return this._driver
    }
  
    get vehicle () {
      if (this.data.vehicleKey) {
        this._vehicle = chatHelper.getActorFromKey(this.data.vehicleKey)
      }
      return this._vehicle
    }
  
    get hasActor () {
      return !!this.actor
    }
  
    get hasVehicle () {
      return !!this.vehicle
    }
  
    get name () {
      if (this.hasVehicle) return this.vehicle.name
      if (this.hasActor) return this.actor.name
      return this.data.name || undefined
    }
  
    get mov () {
      if (!this.data.mov) {
        if (this.hasVehicle) this.data.mov = this.vehicle.mov
        else if (this.hasActor) this.data.mov = this.actor.mov
      }
  
      if (this.data.mov) {
        if (!isNaN(Number(this.data.mov))) this.data.hasValidMov = true
        else {
          this.data.hasValidMov = false
          this.data.mov = undefined
        }
      }
  
      return this.data.mov
    }
  
    get uuid () {
      return this.data.uuid
    }
  
    get dex () {
      if (!this.data.dex) {
        if (this.hasVehicle && this.hasDriver) {
          this.data.dex = this.driver.characteristics.dex.value
        } else if (this.hasActor) {
          this.data.dex = this.actor.characteristics.dex.value
        }
      }
  
      if (this.data.dex) {
        if (!isNaN(Number(this.data.dex))) this.data.hasValidDex = true
        else {
          this.data.hasValidDex = false
          this.data.dex = 0
        }
      }
  
      return this.data.dex
    }
  
    get hasAGunReady () {
      return this.data.hasAGunReady || false
    }
  
    get initiative () {
      let init = this.dex
      if (this.hasAGunReady) {
        init += 50
      }
      // if( this.speedCheck){
      //   if(this.speedCheck.score) init += this.speedCheck.score/100
      // }
  
      return init
    }
  
    get isChaser () {
      return !!this.data.chaser
    }
  
    get isValid () {
      return this.hasValidDex && this.hasValidMov
    }
  
    get hasValidDex () {
      return !isNaN(Number(this.data.dex))
    }
  
    get hasValidMov () {
      return !isNaN(Number(this.data.mov))
    }
  
    get hasDriver () {
      return this.hasVehicle && this.hasActor
    }
  
    get movAdjustment () {
      if (this.data.speedCheck?.rollDataString) {
        const roll = CoC7Check.fromRollString(this.data.speedCheck.rollDataString)
        if (roll) {
          if (!roll.standby) {
            if (roll.successLevel >= CoC7Check.successLevel.extreme) return 1
            else if (roll.failed) return -1
          }
        }
      }
      return 0
    }
  
    get adjustedMov () {
      if (typeof this.mov === 'undefined') return undefined
      if (isNaN(Number(this.mov))) return undefined
      return Number(this.mov) + this.movAdjustment
    }
  
    get hasMovAdjustment () {
      return this.hasBonusMov || this.hasMalusMov
    }
  
    get hasBonusMov () {
      if (this.data.movAdjustment > 0) return true
      return false
    }
  
    get hasMalusMov () {
      if (this.data.movAdjustment < 0) return true
      return false
    }
  
    // get options(){
    //  return {
    //    exclude: [],
    //    excludeStartWith: '_'
    //  };
    // }
  
    // get dataString(){
    //  return JSON.stringify(this, (key,value)=>{
    //    if( null === value) return undefined;
    //    if( this.options.exclude?.includes(key)) return undefined;
    //    if( key.startsWith(this.options.excludeStartWith)) return undefined;
    //    return value;
    //  });
    // }
  
    tooSlow () {
      this.data.excluded = true
    }
  
    includeInChase () {
      this.data.excluded = false
      this.data.escaped = false
    }
  
    escaped () {
      this.data.escaped = true
    }
  
    set slowest (x) {
      this.data.slowest = x
    }
  
    set fastest (x) {
      this.data.fastest = x
    }
  
    set movementAction (x) {
      this.data.movementAction = x
    }
  
    get movementAction () {
      return 2
      // return this.data.movementAction
    }
  
    set currentMovementActions (x) {
      this.data.currentMovementActions = x
    }
  
    get currentMovementActions () {
      return this.data.currentMovementActions || 0
    }
  
    get hasMaxMvtActions () {
      return this.currentMovementActions >= this.movementAction
    }
  
    get isActive () {
      return this.data.active || false
    }
  
    addMovementActions (x = 1) {
      this.currentMovementActions += x
      if (this.currentMovementActions > this.movementAction)
        this.currentMovementActions = this.movementAction
    }
  
    addMovementActions (x = 1) {
      this.currentMovementActions -= x
    }
  
    alterMovementActions (x) {
      this.currentMovementActions += x
      if (this.currentMovementActions > this.movementAction)
        this.currentMovementActions = this.movementAction
    }
  
    get movementActionArray () {
      const baseArray = Array(this.movementAction).fill('base')
      if (this.currentMovementActions >= 0) {
        for (let i = 0; i < this.currentMovementActions; i++) {
          baseArray[i] = 'base available'
        }
        return baseArray
      }
  
      if (this.currentMovementActions < 0) {
        const deficitArray = Array(Math.abs(this.currentMovementActions)).fill(
          'deficit'
        )
        return deficitArray.concat(baseArray)
      }
    }
  
    get cssClass () {
      const cssClasses = []
      if (this.isChaser) cssClasses.push('chaser')
      else cssClasses.push('prey')
      if (this.data.excluded) cssClasses.push('excluded', 'too_slow')
      if (this.data.escaped) cssClasses.push('escaped')
      if (this.data.fastest) cssClasses.push('fastest')
      if (this.data.slowest) cssClasses.push('slowest')
      if (this.data.active) cssClasses.push('active')
      return cssClasses.join(' ')
    }
  
    get speedCheck () {
      const check = {}
      if (this.data.speedCheck?.name) check.name = this.data.speedCheck.name
      if (this.data.speedCheck?.score) check.score = this.data.speedCheck.score
      check.cssClasses = ''
      if (this.data.speedCheck?.rollDataString) {
        check.roll = CoC7Check.fromRollString(this.data.speedCheck.rollDataString)
        if (check.roll) {
          if (!check.roll.standby || check.roll.hasCard) {
            check.rolled = true
            check.inlineRoll = check.roll.inlineCheck.outerHTML
            check.cssClasses += 'rolled'
            if (!check.roll.standby) {
              if (check.roll.successLevel >= CoC7Check.successLevel.extreme) {
                check.modifierCss = 'upgrade'
              } else if (check.roll.failed) check.modifierCss = 'downgrade'
              if (
                check.roll.successLevel >= CoC7Check.successLevel.extreme ||
                check.roll.failed
              ) {
                check.hasModifier = true
              }
            }
          }
        }
      }
      if (this.hasActor) {
        check.options = []
        for (const c of ['con']) {
          const characterisitc = this.actor.getCharacteristic(c)
          if (characterisitc?.value) check.options.push(characterisitc.label)
        }
  
        for (const s of this.actor.driveSkills) {
          check.options.push(s.name)
        }
  
        for (const s of this.actor.pilotSkills) {
          check.options.push(s.name)
        }
        check.hasOptions = !!check.options.length
  
        if (this.data.speedCheck?.id) {
          let item = this.actor.find(this.data.speedCheck.id)
          if (!item) {
            const gameItem = game.items.get(this.data.speedCheck.id)
            if (gameItem) item = this.actor.find(gameItem.name)
          }
  
          if (item) {
            if (item.type === 'item' && item.value.data?.type === 'skill') {
              check.ref = item.value
              check.name = item.value.name
              check.type = 'skill'
              check.isSkill = true
              check.refSet = true
              check.score = item.value.value
            }
            if (item.type === 'characteristic') {
              check.ref = item.value
              check.name = item.value.label
              check.type = 'characteristic'
              check.isCharacteristic = true
              check.refSet = true
              check.score = item.value.value
            }
            if (item.type === 'attribute') {
              check.ref = item.value
              check.name = item.value.label
              check.type = 'attribute'
              check.isAttribute = true
              check.refSet = true
              check.score = item.value.value
            }
          }
        } else if (this.data.speedCheck?.name) {
          const item = this.actor.find(this.data.speedCheck.name)
          if (item) {
            if (item.type === 'item' && item.value.data?.type === 'skill') {
              check.ref = item.value
              check.name = item.value.name
              check.type = 'skill'
              check.isSkill = true
              check.refSet = true
              check.score = item.value.value
            }
            if (item.type === 'characteristic') {
              check.ref = item.value
              check.name = item.value.label
              check.type = 'characteristic'
              check.isCharacteristic = true
              check.refSet = true
              check.score = item.value.value
            }
            if (item.type === 'attribute') {
              check.ref = item.value
              check.name = item.value.label
              check.type = 'attribute'
              check.isAttribute = true
              check.refSet = true
              check.score = item.value.value
            }
          }
        }
      } else if (this.data.speedCheck?.id) {
        const item = game.items.get(this.data.speedCheck.id)
        if (item) {
          if (item.data?.type === 'skill') {
            check.ref = item
            check.name = item.name
            check.type = 'skill'
            check.isSkill = true
            check.refSet = false
            check.score = item.base
          }
        }
      }
  
      if (!check.rolled && !check.score) check.cssClasses += ' invalid'
      check.isValid = check.rolled && !isNaN(check.score)
  
      return check
    }
  }
  