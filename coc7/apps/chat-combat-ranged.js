/* global canvas ChatMessage CONFIG CONST foundry fromUuid game Hooks renderTemplate Roll TextEditor ui */
import { FOLDER_ID, DICE_POOL_REASONS, TARGET_ALLOWED } from '../constants.js'
import CoC7DicePool from './dice-pool.js'
import CoC7SystemSocket from './system-socket.js'
import CoC7Utilities from './utilities.js'

export default class CoC7ChatCombatRanged {
  #aiming
  #asyncAttacker
  #asyncItem
  #burst
  #damage
  #damageDealt
  #damageRolled
  #fullAuto
  #multipleShots
  #weaponRolled
  #sceneUuid
  #singleShot
  #shots
  #targets
  #totalBulletsFired
  #volleyMax
  #volleySize

  /**
   * Constructor
   */
  constructor () {
    // this.#asyncActor = undefined
    // this.#asyncItem = undefined
    this.#weaponRolled = false
    this.#singleShot = false
    this.#multipleShots = false
    this.#burst = false
    this.#fullAuto = false
    this.#totalBulletsFired = 0
    this.#targets = []
    this.#volleyMax = 0
    this.#volleySize = 0
    this.#shots = []
    this.#aiming = false
    this.#sceneUuid = ''
    this.#damage = []
    this.#damageDealt = false
    this.#damageRolled = false
  }

  /**
   * Target Sizes
   * @returns {object}
   */
  static get TARGET_SIZE () {
    return {
      normal: 'normal',
      small: 'small',
      big: 'big'
    }
  }

  /**
   * Create melee initiator message
   * @param {object} options
   * @param {string} options.attackerUuid
   * @param {string} options.itemUuid
   * @param {Array} options.targetUuids
   */
  static async createMessage ({ attackerUuid, itemUuid, targetUuids } = {}) {
    if (attackerUuid) {
      const check = new CoC7ChatCombatRanged()
      check.attacker = attackerUuid
      check.item = itemUuid
      check.#sceneUuid = canvas.scene.uuid
      const attacker = (await check.attacker)
      const item = (await check.item)
      if (attacker && item) {
        check.#volleySize = check.#volleyMax = Math.max(CoC7DicePool.minVolleySize, Math.floor((item.system.skillAlternative?.system.value ?? 0) / 10))
        if (item.system.singleShot) {
          check.#singleShot = true
        } else if (item.system.properties.auto) {
          check.#fullAuto = true
        }
        let poolModifier = 0
        if (item.type === 'weapon') {
          poolModifier += item.system.bonusDice ?? 0
          const skill = attacker.items.get(item.system.skill.main.id)
          if (skill?.type === 'skill') {
            poolModifier += item.system?.bonusDice ?? 0
          }
        }
        const baseRange = await item.system.baseRange()
        const longRange = await item.system.longRange()
        const extremeRange = await item.system.extremeRange()
        const attackerToken = attacker.getDependentTokens({ scene: canvas.scene }).find(doc => doc.object)
        let active = true
        let distanceError = false
        const targetSource = {
          active: true,
          roundedDistance: 0,
          img: '',
          name: '',
          uuid: '',
          unit: canvas.grid.units,
          poolKeys: [],
          poolModifier,
          baseRange: true,
          longRange: false,
          extremeRange: false,
          outOfRange: false,
          mov: 8,
          size: CoC7ChatCombatRanged.TARGET_SIZE.normal
        }
        for (const targetUuid of targetUuids) {
          const target = await fromUuid(targetUuid)
          if (target && TARGET_ALLOWED.includes(target.type)) {
            const targetData = foundry.utils.mergeObject(foundry.utils.duplicate(targetSource), {
              active,
              img: (target.isToken ? target.token.texture.src : target.img),
              name: (target.isToken ? target.token.name : target.name),
              uuid: targetUuid,
              mov: target.system.attribs.mov.value
            })
            if (target.system.attribs.build <= -2) {
              targetData.size = CoC7ChatCombatRanged.TARGET_SIZE.small
            } else if (target.system.attribs.build >= 4) {
              targetData.size = CoC7ChatCombatRanged.TARGET_SIZE.big
            }
            active = false
            const targetToken = target.getDependentTokens({ scene: canvas.scene }).find(doc => doc.object)
            if (targetToken && attackerToken) {
              const distanceBetweenTokens = CoC7Utilities.distanceBetweenTokens(attackerToken, targetToken)
              targetData.roundedDistance = distanceBetweenTokens.roundedDistance
              const pbRangeInYd = attacker.system.characteristics.dex.value / 15
              if (distanceBetweenTokens.yards <= pbRangeInYd) {
                targetData.baseRange = false
                targetData.poolKeys.push('pointBlankRange')
              } else if (distanceBetweenTokens.yards <= baseRange) {
                // NOP
              } else if (distanceBetweenTokens.yards <= longRange) {
                targetData.baseRange = false
                targetData.longRange = true
              } else if (distanceBetweenTokens.yards <= extremeRange) {
                targetData.baseRange = false
                targetData.extremeRange = true
              } else {
                targetData.baseRange = false
                targetData.outOfRange = true
              }
            } else {
              distanceError = true
            }
            check.#targets.push(targetData)
          }
        }
        if (check.#targets.length === 0) {
          check.#targets.push(targetSource)
        }
        if (distanceError && !game.settings.get(FOLDER_ID, 'distanceTheatreOfTheMind')) {
          ui.notifications.warn('CoC7.MessageDistanceCalculationFailure', { localize: true })
        }
        const chatData = await check.getChatData()
        await ChatMessage.create(chatData)
        return
      }
    }
    ui.notifications.warn('CoC7.Errors.UnparsableRoll', { localize: true })
  }

  /**
   * Shoot at the active target. Add it to the list of shots.
   */
  async addShotAtCurrentTarget () {
    const item = (await this.item)
    const data = await this.getTemplateData()
    const activeTarget = data.targets.find(t => t.active)
    const itemSkill = ((this.#burst || this.#fullAuto) ? item.system.skillAlternative : item.system.skillMain)
    const shot = {
      bulletsShot: 1,
      damage: activeTarget.damage,
      extremeRange: activeTarget.extremeRange,
      targetUuid: activeTarget.uuid,
      actorName: activeTarget.name,
      dicePool: CoC7DicePool.newPool({
        difficulty: activeTarget.difficulty,
        flatDiceModifier: 0,
        flatThresholdModifier: 0,
        poolModifiers: [activeTarget.finalPoolModifier],
        threshold: parseInt(itemSkill.system.value, 10),
        malfunctionThreshold: (item.system.malfunction || undefined)
      }),
      skillName: itemSkill.name,
      transitBullets: 0
    }
    let bulletLeft = (item.system.ammo ?? 0) - this.#totalBulletsFired
    if (this.#fullAuto) {
      if (this.#shots.length > 0) {
        const previousShot = this.#shots[this.#shots.length - 1]
        if (previousShot.targetUuid !== activeTarget.uuid) {
          const scene = await fromUuid(this.#sceneUuid)
          let tokenLast = await fromUuid(previousShot.targetUuid)
          if (tokenLast.token) {
            tokenLast = tokenLast.token
          } else {
            tokenLast = tokenLast.getDependentTokens({ scene }).find(doc => doc.object)
          }
          let tokenThis = await fromUuid(activeTarget.uuid)
          if (tokenThis.token) {
            tokenThis = tokenThis.token
          } else {
            tokenThis = tokenThis.getDependentTokens({ scene }).find(doc => doc.object)
          }
          const distanceBetweenTokens = CoC7Utilities.distanceBetweenTokens(tokenLast, tokenThis)
          shot.transitBullets = Math.floor(distanceBetweenTokens.yards)
          if (shot.transitBullets >= bulletLeft && !game.settings.get(FOLDER_ID, 'disregardAmmo')) {
            shot.transitBullets = bulletLeft
            bulletLeft = 0
          } else {
            bulletLeft -= shot.transitBullets
          }
        }
      }
      shot.bulletsShot = Math.min(Math.max(CoC7DicePool.minVolleySize, this.#volleySize), this.#volleyMax)
      if (shot.bulletsShot >= bulletLeft && !game.settings.get(FOLDER_ID, 'disregardAmmo')) {
        shot.bulletsShot = bulletLeft
        bulletLeft = 0
      }
    } else if (this.#burst) {
      shot.bulletsShot = (!isNaN(Number(item.system.usesPerRound.burst || 1)) ? Number(item.system.usesPerRound.burst || 1) : 1)
      if (shot.bulletsShot >= bulletLeft && !game.settings.get(FOLDER_ID, 'disregardAmmo')) {
        shot.bulletsShot = bulletLeft
        bulletLeft = 0
      }
    }
    this.#totalBulletsFired = parseInt(this.#totalBulletsFired, 10) + parseInt(shot.bulletsShot, 10) + parseInt(shot.transitBullets, 10)
    this.#shots.push(shot)
  }

  /**
   * Roll Damage
   */
  async rollCard () {
    const item = (await this.item)
    const data = await this.getTemplateData()
    if (this.#fullAuto || this.#multipleShots) {
      const itemSkill = ((this.#burst || this.#fullAuto) ? item.system.skillAlternative : item.system.skillMain)
      let anyRolledSuccess = false
      for (const offset in this.#shots) {
        await this.#shots[offset].dicePool.roll()
        if (this.#shots[offset].dicePool.isRolledSuccess) {
          anyRolledSuccess = true
        }
        await item.system.shootAmmunition(this.#shots[offset].bulletsShot + this.#shots[offset].transitBullets)
        if (this.#shots[offset].dicePool.isMalfunction) {
          this.#shots[offset].dicePool.setSuccess(false)
          break
        }
      }
      if (anyRolledSuccess) {
        await CoC7Utilities.messageRollFlagForDevelopment(this.message.id, itemSkill, true)
      }
    } else {
      const activeTarget = data.targets.find(t => t.active)
      if (activeTarget) {
        const itemSkill = ((this.#burst || this.#fullAuto) ? item.system.skillAlternative : item.system.skillMain)
        const shot = {
          bulletsShot: Math.min(item.system.ammo || 0, (this.#burst && !isNaN(Number(item.system.usesPerRound.burst || 1)) ? Number(item.system.usesPerRound.burst || 1) : 1)),
          damage: activeTarget.damage,
          extremeRange: activeTarget.extremeRange,
          targetUuid: activeTarget.uuid,
          actorName: activeTarget.name,
          dicePool: await CoC7DicePool.rollNewPool({
            difficulty: activeTarget.difficulty,
            flatDiceModifier: 0,
            flatThresholdModifier: 0,
            poolModifier: activeTarget.finalPoolModifier,
            threshold: parseInt(itemSkill.system.value, 10),
            malfunctionThreshold: (item.system.malfunction || undefined)
          }),
          skillName: itemSkill.name,
          transitBullets: 0
        }
        if (shot.dicePool.isRolledSuccess) {
          await CoC7Utilities.messageRollFlagForDevelopment(this.message.id, itemSkill, true)
        }
        if (shot.dicePool.isMalfunction) {
          shot.dicePool.setSuccess(false)
        }
        if (!this.#fullAuto && !this.#multipleShots) {
          this.#totalBulletsFired++
        }
        await item.system.shootAmmunition(shot.bulletsShot)
        this.#shots.push(shot)
      }
    }
    this.#weaponRolled = true
  }

  /**
   * Roll damage values
   */
  async rollDamage () {
    const attacker = (await this.attacker)
    const item = (await this.item)
    const hits = this.#shots.filter(s => s.dicePool.isSuccess && s.bulletsShot > 0)
    for (const shot of hits) {
      if (shot.bulletsShot > 0) {
        const damageWithoutDB = shot.damage
        let damageFormula = damageWithoutDB
        if (item.system.properties.addb) {
          damageFormula = damageFormula + '+' + (attacker.system.attribs.db.value || '0')
        }
        if (item.system.properties.ahdb) {
          damageFormula = damageFormula + CoC7Utilities.halfDB((attacker.system.attribs.db.value || '0'))
        }
        const maxDamage = new Roll(damageFormula).evaluateSync({ maximize: true }).total
        const criticalDamageFormula = (item.system.properties.impl ? damageWithoutDB + ' + ' : '') + maxDamage

        let impalingShots = 0
        let successfulShots = 1
        let critical = false
        if (this.#fullAuto || this.#burst) {
          successfulShots = Math.max(1, Math.floor(shot.bulletsShot / 2))
        }
        if (shot.dicePool.successLevel >= CoC7DicePool.difficultyLevel.extreme) {
          if (shot.dicePool.successLevel === CoC7DicePool.difficultyLevel.critical || !shot.extremeRange) {
            impalingShots = successfulShots
            critical = true
          }
          successfulShots = shot.bulletsShot - impalingShots
        }
        const shotCritical = []
        for (let index = 0; index < successfulShots; index++) {
          shotCritical.push(false)
        }
        for (let index = 0; index < impalingShots; index++) {
          shotCritical.push(true)
        }
        let total = 0
        const parts = []
        for (const isCritical of shotCritical) {
          const roll = await new Roll(isCritical ? criticalDamageFormula : damageFormula).roll()
          const dice = []
          let rollMethod
          for (const die of roll.dice) {
            rollMethod = rollMethod ?? CONFIG.Dice.fulfillment.methods[die.method]
            for (const result of die.results) {
              dice.push({
                faces: die.faces,
                result: result.result
              })
            }
          }
          parts.push({
            icon: (rollMethod?.interactive === true && !rollMethod.icon ? '<i class="fa-solid fa-bluetooth"></i>' : rollMethod?.icon),
            method: (rollMethod?.label ?? ''),
            formula: (isCritical ? criticalDamageFormula : damageFormula),
            total: roll.total,
            rolls: dice
          })
          this.message.rolls.push(roll)
          total += roll.total
        }
        const blastRangeDamage = []
        if (item.system?.properties?.blst ?? false) {
          const blastRadius = parseInt(item.system.blastRadius)
          if (!isNaN(blastRadius)) {
            blastRangeDamage.push(game.i18n.format('CoC7.rangeCombatBlastDamage', {
              min: 0,
              max: blastRadius,
              total
            }))
            blastRangeDamage.push(game.i18n.format('CoC7.rangeCombatBlastDamage', {
              min: blastRadius,
              max: 2 * blastRadius,
              total: Math.floor(total / 2)
            }))
            blastRangeDamage.push(game.i18n.format('CoC7.rangeCombatBlastDamage', {
              min: 2 * blastRadius,
              max: 3 * blastRadius,
              total: Math.floor(total / 4)
            }))
          }
        }
        this.#damage.push({
          isCritical: critical,
          dealt: false,
          actorName: shot.actorName,
          targetUuid: shot.targetUuid,
          resultString: game.i18n.format('CoC7.rangeCombatDamage', {
            name: shot.actorName,
            total
          }),
          blastRangeDamage,
          parts
        })
      }
    }
    this.#damageRolled = true
  }

  /**
   * Deal damage
   */
  async dealDamage () {
    for (const offset in this.#damage) {
      const actor = await fromUuid(this.#damage[offset].targetUuid)
      if (!actor) {
        ui.notifications.error('CoC7.NoTargetToDamage', { localize: true })
      } else {
        let totalTaken = 0
        let totalAbsorbed = 0
        for (const part of this.#damage[offset].parts) {
          const dealtAmount = await actor.dealDamage(part.total)
          totalTaken += dealtAmount
          totalAbsorbed += part.total - dealtAmount
        }
        this.#damage[offset].dealt = true
        this.#damage[offset].resultString = game.i18n.format('CoC7.rangeCombatDamageArmor', {
          name: this.#damage[offset].actorName,
          total: totalTaken,
          armor: totalAbsorbed
        })
      }
    }
    this.#damageDealt = true
  }

  /**
   * Create CoC7ChatCombatRanged from message
   * @param {Document} message
   * @returns {CoC7ChatCombatRanged}
   */
  static async loadFromMessage (message) {
    const keys = [
      'actorUuid',
      'aiming',
      'burst',
      'damage',
      'damageDealt',
      'damageRolled',
      'fullAuto',
      'itemUuid',
      'multipleShots',
      'sceneUuid',
      'shots',
      'singleShot',
      'targets',
      'totalBulletsFired',
      'volleyMax',
      'volleySize',
      'weaponRolled'
    ]
    if (message.id && message.flags[FOLDER_ID]?.load?.as === 'CoC7ChatCombatRanged' && keys.every(k => typeof message.flags[FOLDER_ID]?.load?.[k] !== 'undefined') && message.flags[FOLDER_ID].load.shots.every(s => CoC7DicePool.isValidPool(s.dicePool))) {
      const check = new CoC7ChatCombatRanged()
      check.message = message
      const load = foundry.utils.duplicate(message.flags[FOLDER_ID].load)
      check.attacker = load.actorUuid
      check.#aiming = load.aiming
      check.#burst = load.burst
      check.#damage = load.damage
      check.#damageDealt = load.damageDealt
      check.#damageRolled = load.damageRolled
      check.#fullAuto = load.fullAuto
      check.item = load.itemUuid
      check.#multipleShots = load.multipleShots
      check.#sceneUuid = load.sceneUuid
      check.#shots = load.shots.reduce((c, s) => {
        s.dicePool = CoC7DicePool.fromObject(s.dicePool)
        c.push(s)
        return c
      }, [])
      check.#singleShot = load.singleShot
      check.#targets = load.targets
      check.#totalBulletsFired = load.totalBulletsFired
      check.#volleyMax = load.volleyMax
      check.#volleySize = load.volleySize
      check.#weaponRolled = load.weaponRolled
      return check
    }
    ui.notifications.warn('CoC7.Errors.UnableToLoadMessage', { localize: true })
    throw new Error('CoC7.Errors.UnableToLoadMessage')
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onClickEvent (event, message) {
    switch (event.currentTarget?.dataset?.action) {
      case 'toggleValue':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          if (check && set) {
            switch (set) {
              case 'singleShot':
                if (check.#singleShot) {
                  return
                }
                check.#singleShot = true
                check.#fullAuto = check.#multipleShots = false
                break
              case 'multipleShots':
                if (check.#multipleShots) {
                  return
                }
                check.#multipleShots = true
                check.#fullAuto = check.#singleShot = false
                break
              case 'burst':
                check.#burst = !check.#burst
                check.#fullAuto = false
                if (!check.#multipleShots && !check.#singleShot) {
                  check.#singleShot = true
                }
                break
              case 'fullAuto':
                if (check.#fullAuto) {
                  return
                }
                check.#fullAuto = true
                check.#burst = check.#multipleShots = check.#singleShot = false
                break
              case 'aiming':
                if (check.#shots.length === 0) {
                  check.#aiming = !check.#aiming
                }
                break
              default:
                ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
                return
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'volley-size-decrease':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          if (check) {
            check.#volleySize = Math.max(CoC7DicePool.minVolleySize, check.#volleySize - 1)
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'volley-size-increase':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          if (check) {
            check.#volleySize = Math.min(check.#volleyMax, check.#volleySize + 1)
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'toggleTargetValue':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          const offset = event.currentTarget.closest('.ranged-targets-option').dataset.offset
          if (check && set && typeof offset !== 'undefined') {
            switch (set) {
              case 'size':
                {
                  const keys = Object.keys(CoC7ChatCombatRanged.TARGET_SIZE)
                  const current = keys.findIndex(k => k === check.#targets[offset].size)
                  if (current > -1) {
                    check.#targets[offset].size = keys[(current + 1) % keys.length]
                  }
                  check.updateMessage()
                }
                break
              case 'baseRange':
              case 'longRange':
              case 'extremeRange':
              case 'outOfRange':
                {
                  const keys = ['baseRange', 'longRange', 'extremeRange', 'outOfRange']
                  for (const key of keys) {
                    check.#targets[offset][key] = (set === key)
                  }
                  const index = check.#targets[offset].poolKeys.findIndex(k => k === 'pointBlankRange')
                  if (index > -1) {
                    check.#targets[offset].poolKeys.splice(index, 1)
                  }
                  const oldActive = check.#targets.findIndex(t => t.active)
                  if (oldActive > -1) {
                    check.#targets[oldActive].active = false
                  }
                  check.#targets[offset].active = true
                  check.updateMessage()
                }
                break
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
          }
        }
        break
      case 'toggleTargetKey':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          const set = event.currentTarget.dataset.set
          const offset = event.currentTarget.closest('.ranged-targets-option').dataset.offset
          if (check && set && typeof offset !== 'undefined') {
            if (DICE_POOL_REASONS[set]?.forRanged === true) {
              const oldActive = check.#targets.findIndex(t => t.active)
              if (oldActive > -1) {
                check.#targets[oldActive].active = false
              }
              check.#targets[offset].active = true
              const index = check.#targets[offset].poolKeys.findIndex(k => k === set)
              if (index === -1) {
                check.#targets[offset].poolKeys.push(set)
                check.#targets[offset].poolKeys.sort()
                if (set === 'pointBlankRange') {
                  const keys = ['baseRange', 'longRange', 'extremeRange', 'outOfRange']
                  for (const key of keys) {
                    check.#targets[offset][key] = false
                  }
                } else if (set === 'fast' && check.#targets[offset].mov < 8) {
                  ui.notifications.warn(game.i18n.format('CoC7.WarnFastTargetWithWrongMOV', { mov: check.#targets[offset].mov }))
                }
              } else {
                check.#targets[offset].poolKeys.splice(index, 1)
                if (set === 'pointBlankRange') {
                  check.#targets[offset].baseRange = true
                }
              }
              check.updateMessage()
            } else {
              ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
            }
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'range-initiator-roll':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          if (check) {
            await check.rollCard()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'luck':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          const luckSpend = event.currentTarget.dataset.luckSpend
          const shotOffset = event.currentTarget.dataset.shotOffset
          if (check && luckSpend && typeof shotOffset !== 'undefined' && typeof check.#shots[shotOffset] !== 'undefined') {
            const attacker = (await check.attacker)
            const newLuck = parseInt(attacker?.system.attribs.lck.value ?? 0, 10) - parseInt(luckSpend, 10)
            if (newLuck >= 0) {
              if (await attacker.spendLuck(luckSpend) !== false) {
                check.#shots[shotOffset].dicePool.luckSpent = check.#shots[shotOffset].dicePool.luckSpent + parseInt(luckSpend, 10)
              }
            }
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'range-initiator-shoot':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          const offset = event.currentTarget.closest('.ranged-targets-option').dataset.offset
          if (check && typeof offset !== 'undefined') {
            const oldActive = check.#targets.findIndex(t => t.active)
            if (oldActive > -1) {
              check.#targets[oldActive].active = false
            }
            check.#targets[offset].active = true
            await check.addShotAtCurrentTarget()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'roll-range-damage':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          if (check) {
            await check.rollDamage()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
      case 'deal-range-damage':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          if (check) {
            await check.dealDamage()
            check.updateMessage()
          } else {
            ui.notifications.warn('CoC7.Errors.UnparsableMessage', { localize: true })
          }
        }
        break
    }
  }

  /**
   * Switch target without reloading message
   * @param {ClickEvent} event
   */
  static async _onSwitchTargetEvent (event) {
    const offset = event.currentTarget?.dataset?.offset
    if (typeof offset !== 'undefined') {
      const messageHtml = event.currentTarget.closest('.message-content')
      messageHtml.querySelector('.ranged-targets-portraits .switch-target.active').classList.remove('active')
      messageHtml.querySelector('.ranged-targets-option.active').classList.remove('active')
      messageHtml.querySelector('.ranged-targets-portraits .switch-target[data-offset="' + offset + '"]').classList.add('active')
      messageHtml.querySelector('.ranged-targets-option[data-offset="' + offset + '"]').classList.add('active')
      return
    }
    ui.notifications.warn('CoC7.Errors.UnparsableModification', { localize: true })
  }

  /**
   * Click Event on dice roll
   * @param {ClickEvent} event
   * @param {Document} message
   */
  static async _onChangeEvent (event, message) {
    switch (event.target?.type) {
      case 'range':
        {
          const check = await CoC7ChatCombatRanged.loadFromMessage(message)
          const set = event.target.dataset.set
          const offset = event.target.closest('.ranged-targets-option').dataset.offset
          if (check && set && typeof offset !== 'undefined') {
            const oldActive = check.#targets.findIndex(t => t.active)
            if (oldActive > -1) {
              check.#targets[oldActive].active = false
            }
            check.#targets[offset].active = true
            check.#targets[offset].poolModifier = event.target.value
            CoC7Utilities.messageUpdatedThen(message.id, () => {
              setTimeout(() => {
                document.querySelector('[data-message-id="' + message.id + '"] .ranged-targets-option[data-offset="' + offset + '"] input[type=range][data-set="' + set + '"]').focus()
              }, 50)
            })
            check.updateMessage()
          }
        }
        break
    }
  }

  /**
   * Render Chat Message
   * @param {documents.ChatMessage} message
   * @param {HTMLElement} html
   * @param {ApplicationRenderContext} context
   * @param {false|Array} allowed
   */
  static async _onRenderMessage (message, html, context, allowed) {
    if (game.user.isGM || allowed) {
      html.querySelectorAll('[data-action]').forEach((element) => {
        if (game.user.isGM || allowed.includes(element.parentElement.dataset.actorUuid)) {
          element.addEventListener('click', event => CoC7ChatCombatRanged._onClickEvent(event, message))
        }
      })
      html.querySelectorAll('.switch-target').forEach((element) => {
        if (game.user.isGM || allowed.includes(element.dataset.actorUuid)) {
          element.addEventListener('click', async event => CoC7ChatCombatRanged._onSwitchTargetEvent(event))
        }
      })
    }
    if (game.user.isGM) {
      html.querySelectorAll('input[type=range]').forEach((element) => {
        element.addEventListener('change', event => CoC7ChatCombatRanged._onChangeEvent(event, message))
      })
    }
    html.querySelectorAll('.coc7-formatted-text').forEach((element) => {
      const div = document.createElement('div')
      div.id = 'temporary-measure-' + Math.floor(Math.random() * 100)
      div.style.width = 'var(--sidebar-width)'
      div.style.visibility = 'hidden'
      div.style.position = 'absolute'
      div.append(element.cloneNode(true))
      document.body.appendChild(div)
      if (div.offsetHeight > 50) {
        element.classList.add('overflowing')
        element.addEventListener('click', event => element.classList.remove('overflowing'))
      }
      document.getElementById(div.id)?.remove()
    })
  }

  /**
   * Get attacker actor promise
   * @returns {Promise<Document>} async Actor
   */
  get attacker () {
    return this.#asyncAttacker
  }

  /**
   * Set attacker actor from document/uuid
   * @param {string} value
   */
  set attacker (value) {
    this.#asyncAttacker = (typeof value === 'string' ? fromUuid(value) : undefined)
  }

  /**
   * Get item promise
   * @returns {Promise<Document>} async Actor
   */
  get item () {
    return this.#asyncItem
  }

  /**
   * Set item from document/uuid
   * @param {string} value
   */
  set item (value) {
    if (typeof value === 'string' && value !== '') {
      this.#asyncItem = fromUuid(value)
      return
    }
    throw new Error('Invalid item')
  }

  /**
   * Create Message Data object
   * @returns {object}
   */
  async getTemplateData () {
    const attacker = (await this.attacker)
    const item = (await this.item)
    const usesPerRoundMax = Number(item?.system.usesPerRound.max || 1)
    const data = {
      aiming: this.#aiming,
      attackerImg: (attacker?.isToken ? attacker.token.texture.src : attacker?.img),
      attackerName: (attacker?.isToken ? attacker.token.name : attacker?.name),
      attackerUuid: CoC7Utilities.getActorUuid(attacker),
      burst: this.#burst,
      damage: this.#damage,
      damageDealt: this.#damageDealt,
      damageRolled: this.#damageRolled,
      didAnyShotHit: !!this.#shots.find(s => s.dicePool.isSuccess),
      displayActorOnCard: game.settings.get(FOLDER_ID, 'displayActorOnCard'),
      enrichedWeaponDescriptionSpecial: '',
      /* // FoundryVTT V12 */
      enrichedItemDescriptionValue: await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
        item?.system.description?.value,
        {
          async: true,
          secrets: false
        }
      ),
      excessBonusDice: 0,
      excessPenaltyDice: 0,
      foundryGeneration: game.release.generation,
      fullAuto: this.#fullAuto,
      hasWeaponSpecial: item?.system.properties.spcl,
      item,
      itemImg: item?.img,
      itemName: item?.name,
      itemUuid: item?.uuid,
      malfunctionTxt: game.i18n.format('CoC7.Malfunction', {
        itemName: item?.name
      }),
      maxShots: (this.#fullAuto ? '∞' : (isNaN(usesPerRoundMax) ? '1' : usesPerRoundMax)),
      multipleShots: this.#multipleShots,
      outOfAmmo: (!game.settings.get(FOLDER_ID, 'disregardAmmo') && this.#totalBulletsFired >= item?.system.ammo),
      outOfShots: false,
      poolBonus: [],
      poolPenalty: [],
      shots: this.#shots.reduce((c, s) => {
        c.push(Object.keys(s).reduce((c, k) => {
          if (k === 'dicePool') {
            c[k] = s[k]
            c.buttons = s[k].availableButtons({ luckAvailable: attacker?.system.attribs.lck.value, key: 'skill', isPushable: false })
          } else {
            c[k] = s[k]
          }
          return c
        }, {}))
        return c
      }, []),
      shotFired: this.#shots.length,
      singleShot: this.#singleShot,
      sizeTooltip: {
        [CoC7ChatCombatRanged.TARGET_SIZE.big]: game.i18n.localize('CoC7.rangeCombatCard.BigTargetTitle'),
        [CoC7ChatCombatRanged.TARGET_SIZE.small]: game.i18n.localize('CoC7.rangeCombatCard.SmallTargetTitle'),
        [CoC7ChatCombatRanged.TARGET_SIZE.normal]: game.i18n.localize('CoC7.rangeCombatCard.NormalTargetTitle')
      },
      sizeLabel: {
        [CoC7ChatCombatRanged.TARGET_SIZE.big]: game.i18n.localize('CoC7.rangeCombatCard.BigTarget'),
        [CoC7ChatCombatRanged.TARGET_SIZE.small]: game.i18n.localize('CoC7.combatCard.SmallTarget'),
        [CoC7ChatCombatRanged.TARGET_SIZE.normal]: game.i18n.localize('CoC7.rangeCombatCard.NormalTarget')
      },
      targets: foundry.utils.duplicate(this.#targets),
      totalAmmo: item?.system.ammo ?? 0,
      totalBulletsFired: this.#totalBulletsFired,
      volleyMax: this.#volleyMax,
      volleyMin: CoC7DicePool.minVolleySize,
      volleySize: this.#volleySize,
      weaponRolled: this.#weaponRolled
    }
    if (!game.settings.get(FOLDER_ID, 'disregardUsePerRound') && data.maxShots !== '∞' && this.#shots.length >= data.maxShots) {
      data.outOfShots = true
    }
    for (const key in DICE_POOL_REASONS) {
      if (DICE_POOL_REASONS[key].forRanged) {
        const type = (DICE_POOL_REASONS[key].forBonus ? 'poolBonus' : (DICE_POOL_REASONS[key].forPenalty ? 'poolPenalty' : ''))
        if (type) {
          const row = {
            key,
            name: game.i18n.localize(DICE_POOL_REASONS[key].name),
            tooltip: game.i18n.localize(DICE_POOL_REASONS[key].tooltip)
          }
          data[type].push(row)
        }
      }
    }
    for (const offset in data.targets) {
      let difficulty = CoC7DicePool.difficultyLevel.regular
      let poolModifier = data.targets[offset].poolModifier
      let damage = item?.system.range.normal.damage
      if (!item?.system.properties.shotgun) {
        if (data.targets[offset].longRange) {
          difficulty = CoC7DicePool.difficultyLevel.hard
          damage = item?.system.range.long.damage
        } else if (data.targets[offset].extremeRange) {
          difficulty = CoC7DicePool.difficultyLevel.extreme
          damage = item?.system.range.extreme.damage
        }
      }
      if (this.#aiming && this.#shots.length === 0) {
        poolModifier++
      }
      // if (this.reload) modifier--
      if (this.#multipleShots && !this.#fullAuto) {
        poolModifier--
      }
      if (this.#fullAuto) {
        poolModifier -= this.#shots.length
      }
      if (data.targets[offset].size === CoC7ChatCombatRanged.TARGET_SIZE.small) {
        poolModifier--
      } else if (data.targets[offset].size === CoC7ChatCombatRanged.TARGET_SIZE.big) {
        poolModifier++
      }
      for (const poolRow of data.poolBonus) {
        if (data.targets[offset].poolKeys.includes(poolRow.key)) {
          poolModifier++
        }
      }
      for (const poolRow of data.poolPenalty) {
        if (data.targets[offset].poolKeys.includes(poolRow.key)) {
          poolModifier--
        }
      }
      if (poolModifier > CoC7DicePool.maxDiceBonus) {
        data.excessBonusDice = poolModifier
        poolModifier = CoC7DicePool.maxDiceBonus
      } else if (poolModifier < -CoC7DicePool.maxDicePenalty) {
        data.excessPenaltyDice = -poolModifier
        const excess = Math.abs(poolModifier + 2)
        difficulty += excess
        if (difficulty > CoC7DicePool.difficultyLevel.critical) {
          difficulty = CoC7DicePool.difficultyLevel.impossible
        }
        poolModifier = -CoC7DicePool.maxDicePenalty
      }
      if (data.targets[offset].outOfRange) {
        difficulty = CoC7DicePool.difficultyLevel.impossible
      }
      data.targets[offset].damage = String(damage || '0')
      data.targets[offset].difficulty = difficulty
      data.targets[offset].finalPoolModifier = poolModifier
      data.targets[offset].absolutePoolModifier = Math.abs(poolModifier)
      data.targets[offset].impossible = (difficulty === CoC7DicePool.difficultyLevel.impossible)
      switch (difficulty) {
        case CoC7DicePool.difficultyLevel.regular:
          data.targets[offset].difficultyName = game.i18n.localize('CoC7.RollDifficultyRegularTitle')
          break
        case CoC7DicePool.difficultyLevel.hard:
          data.targets[offset].difficultyName = game.i18n.localize('CoC7.RollDifficultyHardTitle')
          break
        case CoC7DicePool.difficultyLevel.extreme:
          data.targets[offset].difficultyName = game.i18n.localize('CoC7.RollDifficultyExtremeTitle')
          break
        case CoC7DicePool.difficultyLevel.critical:
          data.targets[offset].difficultyName = game.i18n.localize('CoC7.RollDifficultyCriticalTitle')
          break
        case CoC7DicePool.difficultyLevel.impossible:
          data.targets[offset].difficultyName = game.i18n.localize('CoC7.RollDifficultyImpossibleTitle')
          break
      }
    }
    if (data.hasWeaponSpecial) {
      data.enrichedWeaponDescriptionSpecial = await (foundry.applications.ux?.TextEditor.implementation ?? TextEditor).enrichHTML(
        item.system.description.special,
        {
          async: true,
          secrets: false
        }
      )
    }
    return data
  }

  /**
   * Create Chat Message object
   * @returns {object}
   */
  async getChatData () {
    const data = await this.getTemplateData()
    const chatData = {
      flags: {
        [FOLDER_ID]: {
          load: {
            as: 'CoC7ChatCombatRanged',
            actorUuid: data.attackerUuid,
            aiming: this.#aiming,
            burst: this.#burst,
            damage: this.#damage,
            damageDealt: this.#damageDealt,
            damageRolled: this.#damageRolled,
            cardOpen: true,
            fullAuto: this.#fullAuto,
            itemUuid: data.itemUuid,
            multipleShots: this.#multipleShots,
            sceneUuid: this.#sceneUuid,
            shots: this.#shots.reduce((c, s) => {
              c.push(Object.keys(s).reduce((c, k) => {
                if (k === 'dicePool') {
                  c[k] = s[k].toObject()
                } else {
                  c[k] = s[k]
                }
                return c
              }, {}))
              return c
            }, []),
            singleShot: this.#singleShot,
            targets: this.#targets,
            totalBulletsFired: this.#totalBulletsFired,
            volleyMax: this.#volleyMax,
            volleySize: this.#volleySize,
            weaponRolled: this.#weaponRolled
          }
        }
      },
      rolls: (this.message?.rolls ?? []).concat(this.#shots.reduce((c, s) => c.concat(s.dicePool.newRolls), [])),
      /* // FoundryVTT V12 */
      content: await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/range-initiator.hbs', data)
    }
    if (typeof this.message?.whisper === 'undefined') {
      if ([CONST.DICE_ROLL_MODES.PRIVATE].includes(game.settings.get('core', 'rollMode'))) {
        chatData.whisper = ChatMessage.getWhisperRecipients('GM')
      } else if (CONST.DICE_ROLL_MODES.BLIND === game.settings.get('core', 'rollMode')) {
        chatData.blind = true
      }
    }
    return chatData
  }

  /**
   * Save changes to existing Chat Message
   */
  async updateMessage () {
    if (this.message) {
      const diff = foundry.utils.diffObject(this.message.toObject(), await this.getChatData())
      if (!this.message.canUserModify(game.user, 'update')) {
        CoC7SystemSocket.requestKeeperAction({
          type: 'messagePermission',
          messageId: this.message.id,
          who: game.user.id,
          updates: diff
        })
      } else {
        await this.message.update(diff)
        Hooks.call('messageUpdatedCoC7', this.message.id)
      }
    }
  }

  /**
   * Return an array of results
   * XXXX WIP
   * @returns {Array}
   */
  async publicResults () {
    return []
  }

  /**
   * Migrate older html
   * @param {object} options
   * @param {integer} options.offset
   * @param {object} options.updates
   * @param {object} options.deleteIds
   */
  static async migrateOlderMessages ({ offset, updates, deleteIds } = {}) {
    const message = game.messages.contents[offset]
    const div = document.createElement('div')
    div.innerHTML = message.content
    const contents = div.children[0]
    if (contents) {
      const actorUuid = CoC7Utilities.oldStyleToUuid(contents.dataset.actorKey)
      const targetsHtml = contents.querySelectorAll('.targets')
      const targets = []
      for (const targetHtml of targetsHtml) {
        const header = targetHtml.querySelector('.target-selector')
        const img = header.querySelector('img.open-actor')
        const tab = targetHtml.querySelector('.target[data-key="' + header.dataset.key + '"]')
        const poolKeys = []
        if (tab.dataset.cover === 'true') {
          poolKeys.push('cover')
        }
        if (tab.dataset.surprised === 'true') {
          poolKeys.push('surprisedRanged')
        }
        if (tab.dataset.pointBlankRange === 'true') {
          poolKeys.push('pointBlankRange')
        }
        if (tab.dataset.inMelee === 'true') {
          poolKeys.push('inMelee')
        }
        if (tab.dataset.fast === 'true') {
          poolKeys.push('fast')
        }
        let poolModifier = 0
        if (tab.dataset.penaltyDieA === 'true') {
          poolModifier--
        }
        if (tab.dataset.penaltyDieB === 'true') {
          poolModifier--
        }
        if (tab.dataset.bonusDieA === 'true') {
          poolModifier++
        }
        if (tab.dataset.bonusDieB === 'true') {
          poolModifier++
        }
        targets.push({
          active: tab.dataset.active === 'true',
          roundedDistance: Number(tab.dataset.roundedDistance) || 0,
          img: img.src,
          name: img.alt,
          uuid: CoC7Utilities.oldStyleToUuid(tab.dataset.actorKey),
          unit: tab.dataset.distanceUnit,
          poolKeys,
          poolModifier,
          baseRange: tab.dataset.baseRange === 'true',
          longRange: tab.dataset.longRange === 'true',
          extremeRange: tab.dataset.extremeRange === 'true',
          outOfRange: tab.dataset.outOfRange === 'true',
          mov: 10, // Default
          size: (tab.dataset.small === 'true' ? CoC7ChatCombatRanged.TARGET_SIZE.small : (tab.dataset.big === 'true' ? CoC7ChatCombatRanged.TARGET_SIZE.big : CoC7ChatCombatRanged.TARGET_SIZE.normal))
        })
      }
      const shots = []
      const diceResults = contents.querySelectorAll('.results .dice-result')
      for (const diceResult of diceResults) {
        const diceValues = diceResult.dataset.total.match(/(\d)(\d)$/)
        const weaponData = diceResult.querySelector('.dice-formula').innerHTML.match(/^(.+?) \((\d+)\)/m)
        const shotsHtml = contents.querySelectorAll('.shots .shot')
        for (const shotHtml of shotsHtml) {
          const poolModifier = Number(shotHtml.dataset.modifier) || 0
          shots.push({
            bulletsShot: shotHtml.dataset.bulletsShot,
            damage: shotHtml.dataset.damage,
            extremeRange: false, // Default
            targetUuid: (shotHtml.dataset.actorKey === '' ? '' : CoC7Utilities.oldStyleToUuid(shotHtml.dataset.actorKey)),
            actorName: shotHtml.dataset.actorName,
            dicePool: {
              bonusCount: Math.max(0, poolModifier),
              currentPoolModifier: poolModifier,
              difficulty: shotHtml.dataset.difficulty,
              flatDiceModifier: 0,
              flatThresholdModifier: 0,
              luckSpent: 0,
              groups: [],
              malfunctionThreshold: 100, // Default
              penaltyCount: Math.min(0, poolModifier),
              rolledDice: [
                {
                  rolled: !!diceValues,
                  baseDie: (diceValues ? (diceValues[1] === '0' ? 10 : Number(diceValues[1])) : 0),
                  bonusDice: [],
                  penaltyDice: [],
                  unitDie: (diceValues ? (diceValues[2] === '0' ? 10 : Number(diceValues[2])) : 0)
                }
              ],
              suppressRollData: false,
              threshold: Number(((weaponData?.[2] ?? 1) || 1).toString().trim())
            },
            skillName: ((weaponData?.[1] ?? 1) || 1).toString().trim(),
            transitBullets: shotHtml.dataset.transitBullets
          })
        }
      }
      const damage = []
      const damageDiceResults = contents.querySelectorAll('.damage .damage-results')
      for (const diceResult of damageDiceResults) {
        const diceFormulas = diceResult.querySelectorAll('.dice-formula')
        const blastRangeDamage = []
        for (const diceFormula of diceFormulas) {
          blastRangeDamage.push(diceFormula.innerHTML.trim())
        }
        const parts = []
        const rollHtml = diceResult.querySelectorAll('.dice-rolls li.roll')
        const rolls = []
        const dice = {}
        let total = 0
        for (const roll of rollHtml) {
          const faces = Number(roll.dataset.faces) || 1
          const result = Number(roll.dataset.result) || 1
          rolls.push({
            faces,
            result
          })
          if (typeof dice[faces.toString()] === 'undefined') {
            dice[faces.toString()] = 0
          }
          total = total + result
          dice[faces.toString()]++
        }
        const diceTotal = Number(diceResult.querySelector('.part-total').innerHTML)
        parts.push({
          method: '',
          formula: Object.keys(dice).reduce((c, d) => { c.push(dice[d] + 'D' + d); return c }, []).join(' + ') + (total - diceTotal > 0 ? ' + ' + (total - diceTotal) : ''),
          total,
          rolls
        })
        damage.push({
          isCritical: diceResult.dataset.critical === 'true',
          dealt: diceResult.dataset.dealt === 'true',
          actorName: diceResult.dataset.targetName,
          targetUuid: CoC7Utilities.oldStyleToUuid(diceResult.dataset.targetKey),
          resultString: (blastRangeDamage.length > 1 ? '' : blastRangeDamage.pop()),
          blastRangeDamage,
          parts
        })
      }
      const update = {
        ['flags.' + FOLDER_ID + '.load.as']: 'CoC7ChatCombatRanged',
        ['flags.' + FOLDER_ID + '.load.actorUuid']: actorUuid,
        ['flags.' + FOLDER_ID + '.load.aiming']: contents.dataset.aiming === 'true',
        ['flags.' + FOLDER_ID + '.load.burst']: contents.dataset.burst === 'true',
        ['flags.' + FOLDER_ID + '.load.damage']: damage,
        ['flags.' + FOLDER_ID + '.load.damageDealt']: contents.dataset.damageDealt === 'true',
        ['flags.' + FOLDER_ID + '.load.damageRolled']: contents.dataset.damageRolled === 'true',
        ['flags.' + FOLDER_ID + '.load.cardOpen']: contents.dataset.resolved !== 'true',
        ['flags.' + FOLDER_ID + '.load.fullAuto']: contents.dataset.fullAuto === 'true',
        ['flags.' + FOLDER_ID + '.load.itemUuid']: actorUuid + '.Item.' + contents.dataset.fullAuto.itemId,
        ['flags.' + FOLDER_ID + '.load.multipleShots']: contents.dataset.multipleShots === 'true',
        ['flags.' + FOLDER_ID + '.load.sceneUuid']: contents.dataset.actorKey.replace(/^([^.]+)(\..+)?$/, 'Scene.$1'),
        ['flags.' + FOLDER_ID + '.load.shots']: shots,
        ['flags.' + FOLDER_ID + '.load.singleShot']: contents.dataset.singleShot === 'true',
        ['flags.' + FOLDER_ID + '.load.targets']: targets,
        ['flags.' + FOLDER_ID + '.load.totalBulletsFired']: Number(contents.dataset.totalBulletsFired) || 0,
        ['flags.' + FOLDER_ID + '.load.volleyMax']: Number(contents.dataset.volleySize) || 0, //
        ['flags.' + FOLDER_ID + '.load.volleySize']: Number(contents.dataset.volleySize) || 0,
        ['flags.' + FOLDER_ID + '.load.weaponRolled']: contents.dataset.rolled === 'true'
      }
      const merged = foundry.utils.mergeObject(message, update, { inplace: false })
      const check = await CoC7ChatCombatRanged.loadFromMessage(merged)
      const data = await check.getTemplateData()
      data.attackerUuid = update['flags.' + FOLDER_ID + '.load.actorUuid']
      {
        const html = contents.querySelector('.card-content').innerHTML.split('<span class="tag">Special</span>').map(h => h.trim())
        data.enrichedItemDescriptionValue = html[0] ?? ''
        data.enrichedWeaponDescriptionSpecial = html[1] ?? ''
        data.hasWeaponSpecial = data.enrichedWeaponDescriptionSpecial.length
      }
      {
        const html = contents.querySelector('.open-actor')
        data.itemImg = html.src
        data.itemName = html.title
        data.itemUuid = update['flags.' + FOLDER_ID + '.load.itemUuid']
        data.malfunctionTxt = game.i18n.format('CoC7.Malfunction', {
          itemName: data.itemName
        })
      }
      update.content = await (foundry.applications.handlebars?.renderTemplate ?? renderTemplate)('systems/' + FOLDER_ID + '/templates/chat/range-initiator.hbs', data)
      update._id = message.id
      updates.push(update)
    }
  }
}
