/* global $, ChatMessage, foundry, game, renderTemplate, Roll, ui */
import { CoC7Check } from '../../core/check.js'
import { CoC7Dice } from '../../shared/dice/dice.js'
import { chatHelper, CoC7Damage, CoC7Roll } from '../../shared/dice/helper.js'
import { CoC7Utilities } from '../../shared/utilities.js'

export class CoC7RangeInitiator {
  constructor (actorKey = null, itemId = null, fastForward = false) {
    this.actorKey = actorKey
    this.itemId = itemId
    this.fastForward = fastForward
    this.resolved = false
    this.cover = false
    this.surprised = false
    this.autoSuccess = false
    this.messageId = null
    this.targetCard = null
    this.rolled = false
    this.singleShot = false
    this.multipleShots = false
    this.burst = false
    this.fullAuto = false
    this.tokenKey = null
    this.aimed = false
    this.bonusDieA = false
    this.bonusDieB = false
    this.penaltyDieA = false
    this.penaltyDieB = false
    this.totalBulletsFired = 0
    this._targets = []
    for (const t of [...game.user.targets]) {
      const target = new CoC7RangeTarget(`${t.scene.id}.${t.id}`) //
      target.token = t
      this._targets.push(target)
    }
    if (this._targets.length) {
      this._targets = [this._targets[0]]
      // temporarily only allow one target
      this._targets[0].active = true
    } else {
      const target = new CoC7RangeTarget()
      target.active = true
      this._targets.push(target)
    }
    if (actorKey) {
      const actor = chatHelper.getActorFromKey(actorKey) // REFACTORING (2)
      this.token = chatHelper.getTokenFromKey(actorKey) // REFACTORING (2)
      if (this.token) this.tokenKey = actor.tokenKey
      if (itemId) {
        const weapon = actor.items.get(itemId)
        if (weapon) {
          if (this.weapon.singleShot) {
            this.singleShot = true
          } else if (this.weapon.system.properties.auto) {
            this.fullAuto = true
          }
        }
      }
    }
    if (this.tokenKey) {
      for (const t of this._targets) {
        if (t.token && this.token) {
          t.distance = chatHelper.getDistance(t.token, this.token)
          t.roundedDistance = Math.round(t.distance.value * 100) / 100
          t.distanceUnit = t.distance.unit
          const distInYd =
            Math.round(chatHelper.toYards(t.distance) * 100) / 100
          // if( distInYd){
          if (this.actor) {
            t.pointBlankRange = false
            const pbRangeInYd =
              this.actor.system.characteristics.dex.value / 15
            if (distInYd <= pbRangeInYd) t.toggleFlag('pointBlankRange')
          }
          if (t.pointBlankRange !== true && this.weapon) {
            if (this.weapon.baseRange) {
              t.baseRange = false
              t.longRange = false
              t.extremeRange = false
              t.outOfRange = false
              if (this.weapon.system.properties.shotgun) {
                if (distInYd <= this.weapon.baseRange) {
                  t.baseRange = true
                } else if (distInYd <= this.weapon.longRange) {
                  t.longRange = true
                } else if (distInYd <= this.weapon.extremeRange) {
                  t.extremeRange = true
                } else {
                  t.outOfRange = true
                }
              } else {
                if (distInYd <= this.weapon.baseRange) t.baseRange = true
                if (
                  distInYd > this.weapon.baseRange &&
                  distInYd <= this.weapon.baseRange * 2
                ) {
                  t.longRange = true
                }
                if (
                  distInYd > this.weapon.baseRange * 2 &&
                  distInYd <= this.weapon.baseRange * 4
                ) {
                  t.extremeRange = true
                }
                if (distInYd > this.weapon.baseRange * 4) t.outOfRange = true
              }
              if (
                !(t.baseRange || t.longRange || t.extremeRange || t.outOfRange)
              ) {
                t.baseRange = true
              }
            }
          }
          // }
        } else t.baseRange = true
      }
    }
  }

  get displayActorOnCard () {
    return game.settings.get('CoC7', 'displayActorOnCard')
  }

  get actorImg () {
    const img = chatHelper.getActorImgFromKey(this.actorKey)
    if (img) return img
    return '../icons/svg/mystery-man-black.svg'
  }

  get actor () {
    return chatHelper.getActorFromKey(this.actorKey) // REFACTORING (2)
  }

  get item () {
    return this.actor.items.get(this.itemId)
  }

  get weapon () {
    return this.item
  }

  get targets () {
    if (!this._targets) this._targets = []
    return this._targets
  }

  get target () {
    if (this.targets && this.targets.length) return this.targets.pop()
    return null
  }

  get skills () {
    return this.actor.getWeaponSkills(this.itemId)
  }

  get mainWeaponSkill () {
    return this.actor.items.get(this.weapon.system.skill.main.id)
  }

  get autoWeaponSkill () {
    if (this.weapon.system.skill.alternativ.id) {
      return this.actor.items.get(this.weapon.system.skill.alternativ.id)
    }
    return this.mainWeaponSkill
  }

  get autoFire () {
    return this.burst || this.fullAuto
  }

  get multiTarget () {
    return this.fullAuto || this.multipleShots
  }

  get aiming () {
    if (undefined === this._aiming) {
      this._aiming = this.actor.getActorFlag('aiming')
    }
    return this._aiming
  }

  get activeTarget () {
    if (!this._targets.length) return null
    return this._targets.find(t => t.active)
  }

  get shots () {
    if (undefined === this._shots) this._shots = []
    return this._shots
  }

  get currentShotRank () {
    return this.shots.length + 1
  }

  get activeTargetShotDifficulty () {
    return this.shotDifficulty()
  }

  set aiming (b) {
    this._aiming = b
  }

  get didAnyShotHit () {
    let anyHit = false
    for (const r of this.rolls) {
      anyHit = anyHit || r.isSuccess
    }
    return anyHit
  }

  get successfulHits () {
    const hits = []
    for (let index = 0; index < this.rolls.length; index++) {
      if (this.rolls[index].isSuccess) {
        const hit = {
          roll: this.rolls[index],
          shot: this.shots[index]
        }
        hits.push(hit)
      }
    }
    if (hits.length !== 0) return hits
    else return null
  }

  get shotFired () {
    return this.shots ? this.shots.length : 0
  }

  get totalAmmo () {
    return this.weapon.getBulletLeft()
  }

  get maxShots () {
    if (this.fullAuto) return '∞'
    // return this.weapon.data.data.usesPerRound.max;

    return this.weapon.system.usesPerRound.max
      ? parseInt(this.weapon.system.usesPerRound.max)
      : 1
  }

  get ignoreAmmo () {
    return game.settings.get('CoC7', 'disregardAmmo')
  }

  get ignoreUsesPerRound () {
    return game.settings.get('CoC7', 'disregardUsePerRound')
  }

  get outOfAmmo () {
    if (this.ignoreAmmo) return false
    if (this.totalBulletsFired >= this.weapon.getBulletLeft()) return true
    return false
  }

  get outOfShots () {
    if (this.ignoreUsesPerRound) return false
    if (this.shots) return this.shots.length >= this.maxShots
    return false
  }

  get volleySize () {
    if (!this.weapon.system.properties.auto) return 1
    if (this._volleySize) return this._volleySize
    const size = Math.floor(this.autoWeaponSkill.value / 10)
    return size < 3 ? 3 : size
  }

  set volleySize (x) {
    if (x >= Math.floor(this.autoWeaponSkill.value / 10)) {
      this._volleySize = Math.floor(this.autoWeaponSkill.value / 10)
    } else if (x <= 3) {
      this._volleySize = 3
    }
    this._volleySize = parseInt(x)
  }

  get isVolleyMinSize () {
    if (this.volleySize === 3) return true
    return false
  }

  get isVolleyMaxSize () {
    const maxSize =
      Math.floor(this.autoWeaponSkill.value / 10) < 3
        ? 3
        : Math.floor(this.autoWeaponSkill.value / 10)
    if (maxSize === this.volleySize) return true
    return false
  }

  getTargetFromKey (key) {
    return this._targets.find(t => key === t.actorKey)
  }

  calcTargetsDifficulty () {
    for (const t of this.targets) {
      t.shotDifficulty = this.shotDifficulty(t)
    }
  }

  get calculatedBonusDice () {
    return (this._calculatedModifier > 2 ? this._calculatedModifier : 0)
  }

  get calculatedPenaltyDice () {
    return (this._calculatedModifier < -2 ? -this._calculatedModifier : 0)
  }

  shotDifficulty (t = null) {
    const target = t || this.activeTarget
    let damage = this.weapon.system.range.normal.damage
    if (this.weapon.system.properties.shotgun) {
      if (t.longRange) damage = this.weapon.system.range.long.damage
      if (t.extremeRange) damage = this.weapon.system.range.extreme.damage
    }
    let modifier = parseInt(target.modifier, 10)
    let difficulty
    this.weapon.system.properties.shotgun
      ? (difficulty = 1)
      : (difficulty = target.difficulty)
    let difficultyName = ''
    if (this.aiming && this.currentShotRank === 1) modifier++
    if (this.reload) modifier--
    if (this.multipleShots && !this.fullAuto) modifier--
    if (this.fullAuto) modifier -= this.currentShotRank - 1
    if (this.bonusDieA) modifier++
    if (this.bonusDieB) modifier++
    if (this.penaltyDieA) modifier--
    if (this.penaltyDieB) modifier--
    this._calculatedModifier = modifier
    if (modifier < -2) {
      const excess = Math.abs(modifier + 2)
      difficulty += excess
      if (difficulty > CoC7Check.difficultyLevel.critical) {
        difficulty = CoC7Check.difficultyLevel.impossible
      }
      modifier = -2
    } else if (modifier > 2) {
      modifier = 2
    }

    if (CoC7Check.difficultyLevel.regular === difficulty) {
      difficultyName = `${game.i18n.localize('CoC7.RollDifficultyRegular')}`
    }
    if (CoC7Check.difficultyLevel.hard === difficulty) {
      difficultyName = `${game.i18n.localize('CoC7.RollDifficultyHard')}`
    }
    if (CoC7Check.difficultyLevel.extreme === difficulty) {
      difficultyName = `${game.i18n.localize('CoC7.RollDifficultyExtreme')}`
    }
    if (CoC7Check.difficultyLevel.critical === difficulty) {
      difficultyName = `${game.i18n.localize('CoC7.RollDifficultyCritical')}`
    }
    if (CoC7Check.difficultyLevel.impossible === difficulty) {
      difficultyName = `${game.i18n.localize('CoC7.RollDifficultyImpossible')}`
    }

    return {
      level: difficulty,
      name: difficultyName,
      modifier,
      damage,
      impossible: difficulty === CoC7Check.difficultyLevel.impossible
    }
  }

  /**
   * Shoot at the active target. Add it to the list of shots.
   * TODO : recalculer la difficulté de tous les shots !.
   */
  addShotAtCurrentTarget () {
    this.calcTargetsDifficulty()
    const shot = {
      target: this.activeTarget,
      extremeRange: this.activeTarget.extremeRange,
      actorKey: this.activeTarget.actorKey,
      actorName: this.activeTarget.name,
      difficulty: this.activeTarget.shotDifficulty.level,
      modifier: this.activeTarget.shotDifficulty.modifier,
      damage: this.activeTarget.shotDifficulty.damage,
      bulletsShot: 1,
      transitBullets: 0,
      bulletsShotTransit: 1,
      transit: false
    }

    let bulletLeft = this.totalAmmo - this.totalBulletsFired

    if (this.fullAuto) {
      if (this.currentShotRank > 1) {
        const previousShot = this.shots[this.currentShotRank - 2]
        if (previousShot.actorKey !== this.activeTarget.actorKey) {
          const distance = chatHelper.getDistance(
            chatHelper.getTokenFromKey(previousShot.actorKey),
            chatHelper.getTokenFromKey(this.activeTarget.actorKey)
          )
          shot.transitBullets = Math.floor(chatHelper.toYards(distance))
          if (shot.transitBullets >= bulletLeft && !this.ignoreAmmo) {
            shot.transitBullets = bulletLeft
            bulletLeft = 0
          }
          this.totalBulletsFired =
            parseInt(this.totalBulletsFired) + shot.transitBullets
          shot.transit = true
        }
      }
      shot.bulletsShot = this.volleySize
      if (shot.bulletsShot <= 3) shot.bulletsShot = 3
      if (shot.bulletsShot >= bulletLeft && !this.ignoreAmmo) {
        shot.bulletsShot = bulletLeft
        bulletLeft = 0
      }
      // bulletsShotTransit is for localizing CoC7.ShotBullets using parameters, localize does not accept adding a parameter as a sum of shot.bulletsShot + shot.transitBullets, so I create a new value in advance to use instead
      shot.bulletsShotTransit = shot.bulletsShot + shot.transitBullets
    }
    if (this.burst) {
      shot.bulletsShot = parseInt(this.weapon.system.usesPerRound.burst)
        ? parseInt(this.weapon.system.usesPerRound.burst)
        : 1
      if (shot.bulletsShot >= bulletLeft && !this.ignoreAmmo) {
        shot.bulletsShot = bulletLeft
        bulletLeft = 0
      }
    }

    this.totalBulletsFired = parseInt(this.totalBulletsFired) + shot.bulletsShot

    if (this.aiming) {
      this.aiming = false
      this.aimed = true
    }

    this.shots.push(shot)
  }

  get template () {
    return 'systems/CoC7/templates/chat/combat/range-initiator.html'
  }

  async createChatCard () {
    this.calcTargetsDifficulty()
    const html = await renderTemplate(this.template, this)

    // const element = $(html)[0];
    // const targetElement = element.querySelector('.targetTest');
    // this.target.attachToElement(targetElement);
    const speakerData = {}
    const token = chatHelper.getTokenFromKey(this.actorKey)
    if (token) speakerData.token = token.document
    else speakerData.actor = this.actor

    const speaker = ChatMessage.getSpeaker(speakerData)
    // if( this.actor.isToken) speaker.alias = this.actor.token.name;

    const user = this.actor.user ? this.actor.user : game.user
    const chatData = {
      user: user.id,
      speaker,
      content: html
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    // if ( rollMode === 'blindroll' ) chatData['blind'] = true;
    chatData.blind = false

    const chatMessage = await ChatMessage.create(chatData)

    return chatMessage
  }

  async updateChatCard () {
    this.calcTargetsDifficulty()
    const html = await renderTemplate(this.template, this)

    const message = game.messages.get(this.messageId)

    const msg = await message.update({ content: html })
    await ui.chat.updateMessage(msg, false)
    return msg
  }

  toggleFlag (flagName) {
    const flag = flagName.includes('-')
      ? chatHelper.hyphenToCamelCase(flagName)
      : flagName
    if (
      flag === 'singleShot' ||
      flag === 'multipleShots' ||
      flag === 'fullAuto'
    ) {
      this.singleShot = false
      this.multipleShots = false
      this.fullAuto = false
      if (flag === 'fullAuto') this.burst = false
      this[flag] = true
    } else if (flag === 'burst') {
      this.fullAuto = false
      if (!this.singleShot && !this.multipleShots) this.singleShot = true
      this.burst = !this.burst
    } else {
      this[flag] = !this[flag]
      console.log(flag, this[flag])
    }
  }

  async resolveCard () {
    this.rolls = []
    if (this.multiTarget) {
      let weaponMalfunction = false
      let index = 0
      while (!weaponMalfunction && this.shots.length > index) {
        const roll = await this.shootAtTarget(this.shots[index])
        if (roll.dice?.roll) {
          await CoC7Dice.showRollDice3d(roll.dice.roll)
        }
        await this.weapon.shootBullets(
          parseInt(this.shots[index].bulletsShot) +
            parseInt(this.shots[index].transitBullets)
        )
        if (roll.hasMalfunction) {
          roll.isSuccess = false
          weaponMalfunction = true
        }
        index++
        this.rolls.push(roll)
      }
    } else {
      const roll = await this.shootAtTarget()
      if (roll.dice?.roll) {
        await CoC7Dice.showRollDice3d(roll.dice.roll)
      }
      let bulletFired = this.burst
        ? parseInt(this.weapon.system.usesPerRound.burst)
        : 1
      if (bulletFired >= this.totalAmmo) bulletFired = this.totalAmmo
      const shot = {
        target: this.activeTarget,
        extremeRange: this.activeTarget.extremeRange,
        actorKey: this.activeTarget.actorKey,
        actorName: this.activeTarget.name,
        difficulty: this.activeTarget.shotDifficulty.level,
        modifier: this.activeTarget.shotDifficulty.modifier,
        damage: this.activeTarget.shotDifficulty.damage,
        bulletsShot: bulletFired,
        transitBullets: 0,
        transit: false
      }
      await this.weapon.shootBullets(bulletFired)

      if (roll.hasMalfunction) {
        roll.isSuccess = false
      }
      this.shots.push(shot)
      this.rolls.push(roll)
    }
    this.resolved = true
    this.rolled = true

    await this.updateChatCard()
  }

  async shootAtTarget (shot = null) {
    const target = shot
      ? this.getTargetFromKey(shot.actorKey)
      : this.activeTarget
    const check = new CoC7Check()
    check.actorKey = this.actorKey
    check.actor = this.actorKey
    check.item = this.itemId
    check.canBePushed = false
    // Combat roll cannot be blind or unknown
    check.isBlind = false
    check.isUnkonwn = false
    if (this.autoFire) check.skill = this.autoWeaponSkill
    else check.skill = this.mainWeaponSkill
    if (this.multiTarget) {
      check.difficulty = shot.difficulty
      check.diceModifier = shot.modifier
    } else {
      this.calcTargetsDifficulty()
      this.totalBulletsFired = parseInt(this.totalBulletsFired) + 1
      if (this.aiming) {
        this.aiming = false
        this.aimed = true
      }
      check.difficulty = this.activeTarget.shotDifficulty.level
      check.diceModifier = this.activeTarget.shotDifficulty.modifier
    }

    check.details = `${game.i18n.localize('CoC7.Target')}: ${target.name}`
    check.targetKey = target.actorKey

    await check.roll()
    return check
  }

  static getFromMessageId (messageId) {
    const message = game.messages.get(messageId)
    if (!message) return null
    const card = $(message.content)[0]

    const initiator = CoC7RangeInitiator.getFromCard(card, messageId)
    initiator.messageId = messageId

    return initiator
  }

  changeVolleySize (x) {
    this.volleySize = this.volleySize + x
    this.updateChatCard()
  }

  static updateCardSwitch (event, publishUpdate = true) {
    const card = event.currentTarget.closest('.range.initiator')
    const flag = event.currentTarget.dataset.flag
    const camelFlag = chatHelper.hyphenToCamelCase(flag)

    // update only for local player
    if (!publishUpdate) {
      card.dataset[camelFlag] = card.dataset[camelFlag] !== 'true'
      event.currentTarget.classList.toggle('switched-on')
      event.currentTarget.dataset.selected = card.dataset[camelFlag]
    } else {
      // update card for all player
      const initiator = CoC7RangeInitiator.getFromCard(card)
      if (event.currentTarget.classList.contains('target-flag')) {
        const target = event.currentTarget.closest('.target')
        const key = parseInt(target.dataset.targetKey)
        initiator.targets[key].toggleFlag(camelFlag)
      } else initiator.toggleFlag(camelFlag)
      initiator.updateChatCard()
    }
  }

  passRoll (rollIndex) {
    const roll = this.rolls[rollIndex]
    const luckAmount = parseInt(roll.luckNeeded)
    if (!this.actor.spendLuck(luckAmount)) {
      ui.notifications.error(
        `${this.actor.name} does not have enough luck to pass the check`
      )
      return
    }
    roll.successLevel = roll.difficulty
    roll.isSuccess = true
    roll.luckSpent = true
    this.updateChatCard()
  }

  upgradeRoll (rollIndex, upgradeindex) {
    // TODO : Check if this needs to be async
    const roll = this.rolls[rollIndex]
    const increasedSuccess = roll.increaseSuccess[upgradeindex]
    const luckAmount = parseInt(increasedSuccess.luckAmount)
    if (!this.actor.spendLuck(luckAmount)) {
      ui.notifications.error(
        `${this.actor.name} does not have enough luck to pass the check`
      )
      return
    }
    const newSuccessLevel = parseInt(increasedSuccess.newSuccessLevel)
    roll.successLevel = newSuccessLevel
    if (roll.difficulty <= newSuccessLevel) roll.isSuccess = true
    roll.luckSpent = true
    this.updateChatCard() // TODO : Check if this needs to be async
  }

  static getFromCard (card, messageId = null) {
    const rangeInitiator = new CoC7RangeInitiator()
    rangeInitiator._targets = []
    if (messageId) rangeInitiator.messageId = messageId
    else if (card.closest('.message')) {
      rangeInitiator.messageId = card.closest('.message').dataset.messageId
    }

    chatHelper.getObjectFromElement(rangeInitiator, card)
    const cardTargets = card.querySelectorAll('.target')
    for (const t of cardTargets) {
      const target = CoC7RangeTarget.getFromElement(t)
      rangeInitiator.targets.push(target)
    }

    const cardShots = card.querySelectorAll('.shot')
    if (cardShots) {
      for (const s of cardShots) {
        const shot = {}
        chatHelper.getObjectFromElement(shot, s)
        rangeInitiator.shots.push(shot)
      }
    }
    // else {
    //  const shot = {
    //      shotOrder: 0,
    //      actorKey: null,
    //      actorName: 'dummy'
    //  }
    // }

    rangeInitiator.rolls = []
    const rolls = card.querySelectorAll('.roll-result')
    for (const r of rolls) {
      const roll = CoC7Roll.getFromElement(r)
      rangeInitiator.rolls.push(roll)
    }

    rangeInitiator.damage = []
    const damageRolls = card.querySelectorAll('.damage-results')
    for (const dr of damageRolls) {
      const damageRoll = CoC7Damage.getFromElement(dr)
      rangeInitiator.damage.push(damageRoll)
    }

    return rangeInitiator
  }

  async rollDamage () {
    this.damage = []
    const hits = this.successfulHits

    // let volleySize = 1;
    // if( this.fullAuto) {
    //  volleySize = this.volleySize;
    //  if(volleySize < 3) volleySize = 3;
    // }
    // if( this.burst) volleySize = parseInt(this.weapon.data.data.usesPerRound.burst);
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i]
      const volleySize = parseInt(h.shot.bulletsShot)
      const damageRolls = []

      if (volleySize > 0) {
        let damageFormula = String(h.shot.damage)
        if (!damageFormula || damageFormula === '') damageFormula = '0'
        const damageWithoutDB = damageFormula
        if (this.item.system.properties.addb) {
          damageFormula = damageFormula + '+' + this.actor.db
        }
        if (this.item.system.properties.ahdb) {
          damageFormula = damageFormula + CoC7Utilities.halfDB(this.actor.db)
        }
        const damageDie = CoC7Damage.getMainDie(damageFormula)
        const maxDamage = new Roll(damageFormula)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
        const criticalDamageFormula = this.weapon.impale
          ? `${damageWithoutDB} + ${maxDamage}`
          : `${maxDamage}`
        const criticalDamageDie = CoC7Damage.getMainDie(criticalDamageFormula)

        let impalingShots = 0
        let successfulShots = 0
        let critical = false
        if (this.fullAuto || this.burst) {
          successfulShots = Math.floor(volleySize / 2)
        }
        if (successfulShots === 0) successfulShots = 1
        if (h.roll.successLevel >= CoC7Check.difficultyLevel.extreme) {
          impalingShots = successfulShots
          successfulShots = volleySize - impalingShots
          critical = true
          if (
            CoC7Check.difficultyLevel.critical !== h.roll.successLevel &&
            (CoC7Check.difficultyLevel.extreme <= h.roll.difficulty ||
              h.shot.extremeRange)
          ) {
            successfulShots = volleySize
            impalingShots = 0
            critical = false
          }
        }

        let total = 0
        for (let index = 0; index < successfulShots; index++) {
          const roll = new Roll(damageFormula)
          /** MODIF 0.8.x **/
          await roll.evaluate({ async: true })
          await CoC7Dice.showRollDice3d(roll)
          /*****************/
          const dice = []
          for (const die of roll.dice) {
            for (const result of die.results) {
              dice.push({
                faces: die.faces,
                result: result.result
              })
            }
          }
          damageRolls.push({
            formula: damageFormula,
            total: roll.total,
            die: damageDie,
            dice,
            critical: false
          })
          total += roll.total
        }
        for (let index = 0; index < impalingShots; index++) {
          const roll = new Roll(criticalDamageFormula)
          await roll.evaluate()
          await CoC7Dice.showRollDice3d(roll)
          const dice = []
          for (const die of roll.dice) {
            for (const result of die.results) {
              dice.push({
                faces: die.faces,
                result: result.result
              })
            }
          }
          damageRolls.push({
            formula: criticalDamageFormula,
            total: roll.total,
            die: criticalDamageDie,
            dice,
            critical: true
          })
          total += roll.total
        }

        let targetName = 'dummy'
        let target = chatHelper.getTokenFromKey(h.roll.targetKey)
        if (!target) target = chatHelper.getActorFromKey(h.roll.targetKey) // REFACTORING (2)
        if (target) targetName = target.name

        const blastRangeDamage = []
        if (this.weapon.system?.properties?.blst ?? false) {
          const blastRadius = parseInt(this.weapon.system.blastRadius)
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

        this.damage.push({
          targetKey: h.roll.targetKey,
          targetName,
          rolls: damageRolls,
          total,
          critical,
          dealt: false,
          resultString: game.i18n.format('CoC7.rangeCombatDamage', {
            name: targetName,
            total
          }),
          blastRangeDamage
        })
      }
    }

    this.damageRolled = this.damage.length !== 0
    this.updateChatCard()
  }

  async dealDamage () {
    for (let dIndex = 0; dIndex < this.damage.length; dIndex++) {
      const actor = chatHelper.getActorFromKey(this.damage[dIndex].targetKey) // REFACTORING (2)
      if (actor === null) {
        ui.notifications.error(game.i18n.localize('CoC7.NoTargetToDamage'))
      } else {
        this.damage[dIndex].totalTaken = 0
        this.damage[dIndex].totalAbsorbed = 0
        for (
          let rIndex = 0;
          rIndex < this.damage[dIndex].rolls.length;
          rIndex++
        ) {
          const dealtAmount = await actor.dealDamage(
            this.damage[dIndex].rolls[rIndex].total
          )
          this.damage[dIndex].totalTaken += dealtAmount
          this.damage[dIndex].rolls[rIndex].taken = dealtAmount
          this.damage[dIndex].rolls[rIndex].absorbed =
            this.damage[dIndex].rolls[rIndex].total - dealtAmount
          this.damage[dIndex].totalAbsorbed +=
            this.damage[dIndex].rolls[rIndex].total - dealtAmount
        }
        this.damage[dIndex].dealt = true
        this.damage[dIndex].resultString = game.i18n.format(
          'CoC7.rangeCombatDamageArmor',
          {
            name: this.damage[dIndex].targetName,
            total: this.damage[dIndex].totalTaken,
            armor: this.damage[dIndex].totalAbsorbed
          }
        )
      }
    }
    this.damageDealt = true
    this.updateChatCard()
  }
}

export class CoC7RangeTarget {
  constructor (actorKey = null) {
    this.actorKey = actorKey
    this.cover = false
    this.pointBlankRange = false
    this.baseRange = true
    this.longRange = false
    this.extremeRange = false
    this.inMelee = false
  }

  get big () {
    if (undefined === this._big) {
      if (this.actor && this.actor.build) this._big = this.actor.build >= 4
      else this._big = false
    }
    return this._big
  }

  set big (b) {
    this._big = b
  }

  get small () {
    if (undefined === this._small) {
      if (this.actor && this.actor.build) this._small = this.actor.build <= -2
      else this._small = false
    }
    return this._small
  }

  set small (b) {
    this._small = b
  }

  get normal () {
    return !this.big && !this.small
  }

  set normal (b) {
    this._big = false
    this._small = false
  }

  get isFast () {
    if (this.actor && this.actor.mov) return this.actor.mov >= 8
    return false
  }

  get fast () {
    if (undefined === this._fast) {
      // if( this.actor && this.actor.mov) this._fast = this.actor.mov >= 8;
      // else this._fast = false;
      this._fast = false
    }
    return this._fast
  }

  set fast (b) {
    this._fast = b
  }

  get actor () {
    if (this.actorKey && !this._actor) {
      this._actor = chatHelper.getActorFromKey(this.actorKey) // REFACTORING (2)
    }
    return this._actor
  }

  get name () {
    if (this.token) return this.token.name
    if (this.actor) return this.actor.name
    return 'Dummy'
  }

  get img () {
    if (this.token) {
      if (this.token.document?.texture.src) {
        return this.token.document?.texture.src
      }
    }
    if (this.actor) return this.actor.data.img
    return '../icons/svg/mystery-man-black.svg'
  }

  get token () {
    if (!this._token && this.actorKey) {
      this._token = chatHelper.getTokenFromKey(this.actorKey)
    }
    return this._token
  }

  get sizeText () {
    if (this.big) {
      return game.i18n.localize('CoC7.rangeCombatCard.BigTargetTitle')
    }
    if (this.small) {
      return game.i18n.localize('CoC7.rangeCombatCard.SmallTargetTitle')
    }
    return game.i18n.localize('CoC7.rangeCombatCard.NormalTargetTitle')
  }

  get sizeLabel () {
    if (this.big) return game.i18n.localize('CoC7.rangeCombatCard.BigTarget')
    if (this.small) return game.i18n.localize('CoC7.combatCard.SmallTarget')
    return game.i18n.localize('CoC7.rangeCombatCard.NormalTarget')
  }

  get difficulty () {
    if (this.baseRange || this.pointBlankRange) {
      return CoC7Check.difficultyLevel.regular
    }
    if (this.longRange) return CoC7Check.difficultyLevel.hard
    if (this.extremeRange) return CoC7Check.difficultyLevel.extreme
    return CoC7Check.difficultyLevel.impossible
  }

  get modifier () {
    let modifier = 0
    if (this.cover) modifier--
    if (this.pointBlankRange) modifier++
    if (this.fast) modifier--
    if (this.small) modifier--
    if (this.big) modifier++
    if (this.inMelee) modifier--
    if (this.surprised) modifier++
    return modifier
  }

  set token (t) {
    this._token = t
  }

  static getFromElement (element) {
    const target = new CoC7RangeTarget()
    chatHelper.getObjectFromElement(target, element)
    return target
  }

  static changeDisplayedTarget (event) {
    if (!event.currentTarget.classList.contains('target-selector')) return null
    const targetSelector = event.currentTarget
    const targets = targetSelector.closest('.targets')
    const targetList = targets.querySelectorAll('.target')
    return targetList
  }

  attachToElement (element) {
    chatHelper.attachObjectToElement(this, element)
  }

  toggleFlag (flag) {
    if (
      flag === 'baseRange' ||
      flag === 'longRange' ||
      flag === 'extremeRange' ||
      flag === 'pointBlankRange'
    ) {
      this.pointBlankRange = false
      this.baseRange = false
      this.longRange = false
      this.extremeRange = false
      this.outOfRange = false
      this[flag] = true
    } else if (flag === 'size') {
      if (this.small) {
        this.small = false
        this.big = true
      } else if (this.big) {
        this.small = false
        this.big = false
      } else this.small = true
    } else this[flag] = !this[flag]
    if (this.actor && flag === 'fast' && this.fast && !this.isFast) {
      ui.notifications.warn(
        game.i18n.format('CoC7.WarnFastTargetWithWrongMOV', {
          mov: this.actor.mov
        })
      )
    }
  }
}
