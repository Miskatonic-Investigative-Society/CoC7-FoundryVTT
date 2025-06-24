/* global game, ui */
import { chatHelper } from '../../shared/dice/helper.js'
import { CoC7Check } from '../../core/check.js'
import { CoC7Utilities } from '../../shared/utilities.js'

export class _participant {
  constructor (data = {}) {
    this.data = data
  }

  _fetch () {
    if (!this._doc && this.data.docUuid) {
      this._doc = CoC7Utilities.getDocumentFromKey(this.data.docUuid)
    }

    if (!this._actor) {
      if (this._doc) {
        switch (this._doc.constructor?.name) {
          case 'TokenDocument':
            this._actor = this._doc.actor
            break

          case 'CoCActor':
            this._actor = this._doc
            break
          default:
            break
        }
      } else this._actor = CoC7Utilities.getActorFromKey(this.data.docUuid)
    }
  }

  get actor () {
    this._fetch()
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
      this._driver = CoC7Utilities.getActorFromKey(this.data.docUuid)
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

  get hasMaxBonusDice () {
    return this.bonusDice >= 2
  }

  get bonusDice () {
    if (
      isNaN(this.data.bonusDice) ||
      this.data.bonusDice < 0 ||
      this.data.bonusDice > 2
    ) {
      return 0
    }
    return this.data.bonusDice
  }

  set bonusDice (x) {
    if (isNaN(x)) {
      ui.notifications.error('Bonus dice can Only be a number')
      return
    }
    if (x > 2) {
      ui.notifications.error('Max 2 bonus dice')
      return
    }
    if (x < 0) {
      ui.notifications.error('No negativ bonus dice')
      return
    }
    this.data.bonusDice = x
  }

  get hp () {
    if (!this.data.hp) {
      this.data.hp = 0
    }
    if (this.actor) {
      this.data.hp = this.actor.hp
    }

    return this.data.hp
  }

  set hp (x) {
    this.data.hp = x
    if (this.actor) {
      this.actor.setHp(x)
    }
  }

  addBonusDice () {
    if (this.data.bonusDice >= 2) {
      ui.notifications.error('Already have max bonus dice')
      return
    }
    this.data.bonusDice += 1
  }

  removeBonusDice () {
    if (this.data.bonusDice <= 0) {
      ui.notifications.error('Already have 0 bonus dice')
      return
    }
    this.data.bonusDice -= 1
  }

  resetBonusDice () {
    this.data.bonusDice = 0
  }

  get hasBonusDice () {
    return this.hasOneBonusDice || this.hasTwoBonusDice
  }

  get hasOneBonusDice () {
    return this.bonusDice >= 1
  }

  get hasTwoBonusDice () {
    return this.bonusDice >= 2
  }

  get canAssist () {
    return this.assist?.length > 0
  }

  get canBeCautious () {
    return !this.hasMaxBonusDice
  }

  get assist () {
    return this.data.assist || []
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

  get isPrey () {
    return !this.isChaser
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

  get slowest () {
    return this.data.slowest
  }

  set fastest (x) {
    this.data.fastest = x
  }

  get fastest () {
    return this.data.fastest
  }

  calculateMovementActions (minMov) {
    if (
      typeof this.movementAction === 'undefined' ||
      typeof this.adjustedMov === 'undefined' ||
      isNaN(minMov)
    ) {
      this.movementAction = 0
    } else {
      this.movementAction = 1 + (this.adjustedMov - minMov)
    }
    // if( this.movementAction < 0) this.movementAction = 0
  }

  set movementAction (x) {
    this.data.movementAction = x
  }

  get movementAction () {
    return this.data.movementAction
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

  get hasNoMvtActions () {
    return this.currentMovementActions <= 0
  }

  addMovementActions (x = 1) {
    this.currentMovementActions += x
    if (this.currentMovementActions > this.movementAction) {
      this.currentMovementActions = this.movementAction
    }
  }

  alterMovementActions (x) {
    this.currentMovementActions += x
    if (this.currentMovementActions > this.movementAction) {
      this.currentMovementActions = this.movementAction
    }
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
    if (this.data.currentMovementActions <= 0) cssClasses.push('no-actions')
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
        const characteristic = this.actor.getCharacteristic(c)
        if (characteristic?.value) check.options.push(characteristic.label)
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
    } else if (this.data.speedCheck?.name && this.data.speedCheck?.score) {
      check.name = this.data.speedCheck.name
      check.score = this.data.speedCheck.score
      check.refSet = false
    }

    check.canBeRolled = true

    if (!check.rolled && !check.score) {
      check.cssClasses += ' invalid'
      check.canBeRolled = false
    }
    check.isValid = check.rolled && !isNaN(check.score)

    return check
  }
}

export function sortByRoleAndDex (a, b) {
  if (!a && b) return 1
  if (!b && a) return -1
  if (!a && !b) return 0
  // Put chasers first
  if (b.chaser && !a.chaser) return 1
  if (a.chaser && !b.chaser) return -1
  // If sametype sort by dex
  return a.dex - b.dex
}
