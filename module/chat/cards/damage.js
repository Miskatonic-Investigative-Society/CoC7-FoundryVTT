/* global canvas, ChatMessage, Dialog, foundry, game, Roll, ui */
import { CoC7Dice } from '../../dice.js'
import { InteractiveChatCard } from '../interactive-chat-card.js'
import { createInlineRoll } from '../helper.js'
import { CoC7Utilities } from '../../utilities.js'

export class DamageCard extends InteractiveChatCard {
  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      exclude: [
        '_targetToken',
        '_targetActor',
        '_htmlRoll',
        '_htmlInlineRoll'
      ].concat(super.defaultOptions.exclude),
      template: 'systems/CoC7/templates/chat/cards/damage.html'
    })
  }

  // activateListeners (html) {
  //   super.activateListeners(html)
  // }

  async assignObject () {
    if (this.damageRoll && this.damageRoll.constructor.name === 'Object') {
      this.damageRoll = Roll.fromData(this.damageRoll)
    }
  }

  _onButton (event) {
    super._onButton(event)
  }

  get critical () {
    return this.options.critical
  }

  set critical (x) {
    this._options.critical = x
  }

  get impale () {
    if (typeof this._impale === 'undefined') return this.weapon.impale
    return this._impale
  }

  set impale (x) {
    this._impale = x
  }

  async cancelDamage (options = { update: true }) {
    if (!this.targetActor || !this.damageInflicted) return false;
    
    // Restore HP to the original value before any damage was dealt
    // The original HP should be stored when damage is first dealt
    if (typeof this.originalHp === 'undefined') {
      // If we don't have the original HP stored, calculate it
      this.originalHp = Math.min(this.targetActor.hp + Number(this.totalDamageString), this.targetActor.hpMax);
    }
    
    // Restore to original HP, ensuring it doesn't exceed max HP
    const restoredHp = Math.min(this.originalHp, this.targetActor.hpMax);
    await this.targetActor.setHp(restoredHp);
    
    this.damageInflicted = false;
    
    // Send a chat message indicating who canceled the damage
    ChatMessage.create({
      content: game.i18n.format('CoC7.DamageCanceled', {
        user: game.user.name,
        target: this.targetActor.name,
        damage: Number(this.totalDamageString)
      })
    });
    
    options.update = typeof options.update === 'undefined' ? true : options.update;
    if (options.update) this.updateChatCard();
    return true;
  }
  
  async increaseDamage (options = { update: true }) {
    if (!this.targetActor) return false;
    
    // Apply one additional point of damage
    const currentHp = this.targetActor.hp;
    const newHp = Math.max(0, currentHp - 1);
    await this.targetActor.setHp(newHp);
    
    // Send a chat message indicating who increased the damage
    ChatMessage.create({
      content: game.i18n.format('CoC7.DamageIncreased', {
        user: game.user.name,
        target: this.targetActor.name
      })
    });
    
    options.update = typeof options.update === 'undefined' ? true : options.update;
    if (options.update) this.updateChatCard();
    return true;
  }
  
  async decreaseDamage (options = { update: true }) {
    if (!this.targetActor) return false;
    
    // Reduce damage by one point (heal one point)
    const currentHp = this.targetActor.hp;
    const newHp = Math.min(currentHp + 1, this.targetActor.hpMax);
    await this.targetActor.setHp(newHp);
    
    // Send a chat message indicating who decreased the damage
    ChatMessage.create({
      content: game.i18n.format('CoC7.DamageDecreased', {
        user: game.user.name,
        target: this.targetActor.name
      })
    });
    
    options.update = typeof options.update === 'undefined' ? true : options.update;
    if (options.update) this.updateChatCard();
    return true;
  }

  get isDamageFormula () {
    if (typeof this.damageFormula !== 'string') return false
    if (!isNaN(Number(this.damageFormula))) return false
    return Roll.validate(this.damageFormula)
  }

  get isDamageNumber () {
    return !isNaN(Number(this.damageFormula))
  }

  get isArmorForula () {
    if (typeof this.armor !== 'string') return false
    if (!isNaN(Number(this.armor))) return false
    return Roll.validate(this.armor)
  }

  get totalDamageString () {
    let damage = Number(
      this.isDamageNumber ? this.damageFormula : this.roll.total
    )
    if (!this.ignoreArmor) {
      if (isNaN(Number(this.armor)) || Number(this.armor) > 0) {
        damage = damage - Number(this.armor)
      }
      if (!isNaN(Number(this.armor))) {
        if (damage <= 0) {
          return game.i18n.localize('CoC7.ArmorAbsorbsDamage')
        }
      }
    }
    return damage
  }

  get noDamage () {
    if (this.rolled) {
      const damage = this.isDamageNumber ? this.damageFormula : this.roll.total
      if (!this.ignoreArmor) {
        if (!isNaN(Number(this.armor))) {
          return !!(damage - Number(this.armor) <= 0)
        }
        return false
      } else {
        return !!(damage <= 0)
      }
    } else return false
  }

  async updateChatCard () {
    if (this.options.fastForward && !this.roll && !this.isDamageNumber) {
      await this.rollDamage({ update: false })
    }
    if (
      this.isDamageNumber ||
      (this.roll && this.roll.total != null) ||
      this.hardrolled
    ) {
      this.rolled = true
    } else {
      this.rolled = false
    }
    if (this.options.fastForward && !this.damageInflicted && !this.noDamage) {
      await this.dealDamage({ update: false })
    }

    if (this.rolled && this.roll) {
      if (this.roll.constructor.name === 'Object') {
        this.roll = Roll.fromData(this.roll)
      }
      const a = createInlineRoll(this.roll)
      this._htmlInlineRoll = a.outerHTML
      this._htmlRoll = await this.roll.render()
    }
    await super.updateChatCard()
  }

  async rollDamage (options = { update: true }) {
    this.roll = await new Roll(this.damageFormula || '0').evaluate({
      async: true
    })
    await CoC7Dice.showRollDice3d(this.roll)
    this.hardrolled = true
    options.update =
      typeof options.update === 'undefined' ? true : options.update
    if (options.update) this.updateChatCard()
  }

  async rollArmor (options = { update: true }) {
    const roll = await new Roll(this.armor).evaluate({ async: true })
    this.armor = roll.total
    options.update =
      typeof options.update === 'undefined' ? true : options.update
    if (options.update) this.updateChatCard()
  }

  async dealDamageToSelectedTarget (options = { update: true }) {
    if (this.isArmorForula) await this.rollArmor()
    if (isNaN(Number(this.totalDamageString))) {
      ui.notifications.error(game.i18n.localize('CoC7.ErrorEvaluatingDamage'))
      return
    }
    const targets = []
    const targetName = []
    const selectedPlayers = canvas.tokens.controlled.map(token => {
      return token.actor
    })
    for (let index = 0; index < selectedPlayers.length; index++) {
      if (this.actor.id === selectedPlayers[index].id) {
        continue
      }
      targetName.push(selectedPlayers[index].name)
      targets.push(selectedPlayers[index])
    }
    const data = {
      title: ' ',
      content: game.i18n.format('CoC7.DealDamage', {
        damage: this.totalDamageString,
        target: targetName
      }),
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('CoC7.Proceed'),
          callback: () => {
            this.confirmDamage(targets)
          }
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('CoC7.Cancel'),
          callback: () => {}
        }
      },
      default: 'two'
    }
    if (targetName.length > 0) {
      new Dialog(data).render(true)
    }
  }

  async confirmDamage (targets) {
    for (let index = 0; index < targets.length; index++) {
      await targets[index].dealDamage(Number(this.totalDamageString), {
        ignoreArmor: false
      })
      ChatMessage.create({
        content: game.i18n.format('CoC7.DamageDealTo', {
          name: targets[index].name,
          damage: this.totalDamageString
        })
      })
    }
  }

  async dealDamage (options = { update: true }) {
    if (this.isArmorForula) await this.rollArmor()
    let damage = this.totalDamageString
    if (isNaN(Number(damage))) {
      if (game.i18n.localize('CoC7.ArmorAbsorbsDamage') === damage) {
        damage = 0
      } else {
        ui.notifications.error('Error evaluating damage')
        return
      }
    }
    if (this.targetActor) {
      // Store the original HP before dealing damage
      this.originalHp = this.targetActor.hp;
      
      await this.targetActor.dealDamage(Number(damage), {
        ignoreArmor: true
      })
    }
    this.damageInflicted = true
    options.update =
      typeof options.update === 'undefined' ? true : options.update
    if (options.update) this.updateChatCard()
  }

  get range () {
    return this.options.range || 'normal'
  }

  set range (x) {
    const ranges = ['normal', 'long', 'extreme']
    if (!ranges.inclues(x.toLowerCase())) return
    this._options.range = x
  }

  get damageFormula () {
    const range = this.range
    let formula = this.weapon?.system?.range[range]?.damage
    let db = this.actor.db
    db = ((db ?? '').toString().trim() === '' ? 0 : db).toString().trim()

    if (!db.startsWith('-')) db = '+' + db
    if (this.weapon.system.properties.addb) formula = formula + db
    if (this.weapon.system.properties.ahdb) formula = formula + CoC7Utilities.halfDB(this.actor.db)

    if (formula) {
      const maxDamage = new Roll(formula)[(!foundry.utils.isNewerVersion(game.version, '12') ? 'evaluate' : 'evaluateSync')/* // FoundryVTT v11 */]({ maximize: true }).total
      let rollString
      if (this.critical) {
        if (this.impale) {
          rollString = this.weapon?.system?.range[range]?.damage + '+' + maxDamage
          return rollString
        } else {
          return maxDamage
        }
      } else {
        return formula
      }
    } else return undefined
  }

  get armor () {
    if (undefined !== this._armor && this._armor !== '') return this._armor
    if (this.target) {
      return this.targetActor.system.attribs.armor.value
    }
    return 0
  }

  set armor (x) {
    this._armor = x
  }
}
