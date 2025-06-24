/* global ChatMessage, foundry, fromUuid, game, renderTemplate, TokenDocument, ui */
import { ActorPickerDialog } from '../../shared/ui-dialogs/actor-picker-dialog.js'
import { CoC7Check } from '../../core/check.js'
import { CoC7Dice } from '../../shared/dice/dice.js'
import { CoC7Utilities } from '../../shared/utilities.js'

export class CoC7GroupMessage {
  // Step 6c: GM / - = Remove a roll
  static async removeRoll ({ messageId, msg, which }) {
    if (typeof messageId !== 'undefined') {
      msg = game.messages.get(messageId)
    }
    if (typeof msg.flags?.CoC7?.['group-message']?.rollStatuses[which] !== 'undefined') {
      const updates = {
        ['flags.CoC7.group-message.rollStatuses.-=' + which]: null
      }
      await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
    }
  }

  // Step 6b: GM / Non GM = Push Roll
  static async pushMyRoll ({ messageId, msg, which }) {
    if (typeof messageId !== 'undefined') {
      msg = game.messages.get(messageId)
    }
    const updates = {}
    let gmId = false
    if (!msg.canUserModify(game.user, 'update')) {
      gmId = CoC7Utilities.getAnIdForGm()
    }
    switch (msg.flags.CoC7['group-message'].type) {
      case 'combined':
        updates['flags.CoC7.group-message.wasPushed'] = true
        CoC7GroupMessage.performCombinedRoll({ msg, gmId, updates, pushing: true })
        break
      case 'opposed':
        {
          const rolls = { [which]: msg.flags.CoC7['group-message'].rollStatuses[which].roll }
          CoC7GroupMessage.performNormalRoll({ msg, rolls, gmId, updates, pushing: true })
        }
        break
    }
  }

  // Step 6a: GM / Non GM = Spend luck
  static async spendMyLuck ({ messageId, msg, which, index, luckAmount }) {
    if (typeof messageId !== 'undefined') {
      msg = game.messages.get(messageId)
    }
    if (typeof msg.flags?.CoC7?.['group-message']?.rollStatuses[which].completed !== 'undefined') {
      switch (msg.flags.CoC7['group-message'].type) {
        case 'combined':
          if (!luckAmount) {
            const check = CoC7Check.fromData(msg.flags?.CoC7?.['group-message']?.rollStatuses[which].completed)
            luckAmount = check.increaseSuccess[index].luckToSpend ?? null
          }
          if (luckAmount) {
            const actor = await CoC7GroupMessage.getActor(msg.flags.CoC7['group-message'].actorUuid)
            if (!(actor instanceof TokenDocument ? actor.actor : actor).spendLuck(luckAmount)) {
              ui.notifications.error(
                game.i18n.format('CoC7.ErrorNotEnoughLuck', {
                  actor: actor.name
                })
              )
              return
            }
            const updates = {}
            for (const which in msg.flags.CoC7['group-message'].rollStatuses) {
              const check = CoC7Check.fromData(msg.flags.CoC7['group-message'].rollStatuses[which].completed)
              check.increaseLuckSpend(luckAmount)
              updates['flags.CoC7.group-message.rollStatuses.' + which + '.completed'] = check.JSONRollData
            }
            if (Object.keys(updates).length) {
              if (msg.canUserModify(game.user, 'update')) {
                await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
              } else {
                const gmId = CoC7Utilities.getAnIdForGm()
                if (gmId !== false) {
                  game.socket.emit('system.CoC7', {
                    listener: gmId,
                    type: 'group-message-update',
                    messageId: msg.id,
                    updates
                  })
                }
              }
            }
          }
          break
        case 'opposed':
          {
            const check = CoC7Check.fromData(msg.flags?.CoC7?.['group-message']?.rollStatuses[which].completed)
            if (typeof index !== 'undefined') {
              check.upgradeCheck(index, false)
            } else if (typeof luckAmount !== 'undefined') {
              check.forcePass(luckAmount, false)
            }
            const updates = {
              ['flags.CoC7.group-message.rollStatuses.' + which + '.completed']: check.JSONRollData
            }
            if (Object.keys(updates).length) {
              if (msg.canUserModify(game.user, 'update')) {
                await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
              } else {
                const gmId = CoC7Utilities.getAnIdForGm()
                if (gmId !== false) {
                  game.socket.emit('system.CoC7', {
                    listener: gmId,
                    type: 'group-message-update',
                    messageId: msg.id,
                    updates
                  })
                }
              }
            }
          }
          break
      }
    } else {
      ui.notifications.error('CoC7.ErrorRollAlreadyCompleted', { localize: true })
    }
  }

  // Step 5: GM / - = Update the message
  static async updateTheGroupMessage ({ msg, updates, rollData } = {}) {
    if (msg?.flags?.CoC7?.['group-message']) {
      if (typeof rollData === 'undefined') {
        rollData = {}
        for (const which in msg?.flags?.CoC7?.['group-message'].rollStatuses) {
          const roll = await CoC7GroupMessage.parseRolls({ roll: msg?.flags?.CoC7?.['group-message'].rollStatuses[which].roll, quick: true })
          rollData[which] = roll
        }
      }
      const options = Object.assign({ rollData }, foundry.utils.mergeObject(msg.flags.CoC7['group-message'], foundry.utils.expandObject(updates)?.flags?.CoC7?.['group-message'] ?? {}, { performDeletions: true }))
      for (const which in options.rollStatuses) {
        if (options.rollStatuses[which].completed) {
          options.rollStatuses[which].completed = CoC7Check.fromData(options.rollStatuses[which].completed)
        }
      }
      options.allRollsCompleted = true
      for (const which in options.rollStatuses) {
        if (typeof options.rollStatuses[which].completed === 'undefined') {
          options.allRollsCompleted = false
        }
      }
      updates['flags.CoC7.group-message.allRollsCompleted'] = options.allRollsCompleted
      switch (options.type) {
        case 'combined':
          options.isSuccess = false
          options.isFailure = false
          if (options.allRollsCompleted) {
            let successes = 0
            let failures = 0
            for (const which in options.rollStatuses) {
              if (options.rollStatuses[which].completed.isSuccess) {
                successes++
              } else if (options.rollStatuses[which].completed.isFailure) {
                failures++
              }
            }
            if (successes > 0 && (options.combined === 'any' || (failures === 0 && options.combined === 'all'))) {
              options.isSuccess = true
            } else {
              options.isFailure = true
            }
          }
          updates['flags.CoC7.group-message.isSuccess'] = options.isSuccess
          updates['flags.CoC7.group-message.isFailure'] = options.isFailure
          break
        case 'opposed':
          if (options.allRollsCompleted) {
            options.isTie = false
            if (options.isCombat) {
              // Sort combat rolls by index. attackers first
              options.rollOrder = Array.from((new Int8Array(options.rollOrder.map(v => parseInt(v.substr(1), 10)))).sort()).map(v => 'r' + v)
              const successLevels = {}
              options.defenderIsDodging = false
              for (const which in options.rollStatuses) {
                if (options.rollStatuses[which].completed.passed) {
                  successLevels[options.rollStatuses[which].completed.successLevel] = parseInt(successLevels[options.rollStatuses[which].completed.successLevel] ?? 0, 10) + 1
                }
                if (options.rollStatuses[which].isDodging && !options.rollStatuses[which].isAttacker) {
                  options.defenderIsDodging = true
                }
              }
              updates['flags.CoC7.group-message.defenderIsDodging'] = options.defenderIsDodging
              if (options.advantageAttacker === false && options.advantageDefender === false) {
                if (options.defenderIsDodging) {
                  options.advantageDefender = true
                  updates['flags.CoC7.group-message.advantageDefender'] = options.advantageDefender
                } else {
                  options.advantageAttacker = true
                  updates['flags.CoC7.group-message.advantageAttacker'] = options.advantageAttacker
                }
              }
              const best = Math.max(...Object.keys(successLevels))
              options.needsTieBreaker = false
              options.resultText = game.i18n.localize('CoC7.NoWinner')
              if (best > 0) {
                for (const which in options.rollStatuses) {
                  let rollIsWinner = false
                  let rollIsTie = false
                  if (options.rollStatuses[which].completed.successLevel === best && successLevels[best] === 1) {
                    rollIsWinner = true
                  } else if (options.rollStatuses[which].completed.successLevel === best) {
                    if (options.advantageAttacker && options.rollStatuses[which].isAttacker) {
                      rollIsWinner = true
                    } else if (options.advantageDefender && !options.rollStatuses[which].isAttacker) {
                      rollIsWinner = true
                    } else {
                      // rollIsWinner = true
                      rollIsTie = true
                      options.needsTieBreaker = true
                      options.isTie = true
                    }
                  }
                  options.rollStatuses[which].isWinner = rollIsWinner
                  options.rollStatuses[which].isTie = rollIsTie
                  updates['flags.CoC7.group-message.rollStatuses.' + which + '.isWinner'] = rollIsWinner
                  updates['flags.CoC7.group-message.rollStatuses.' + which + '.isTie'] = rollIsTie
                  if (rollIsWinner && !rollIsTie) {
                    if (options.rollStatuses[which].isAttacker) {
                      if (options.rollStatuses[which].isManeuver) {
                        options.resultText = game.i18n.format('CoC7.ManeuverSuccess', {
                          name: rollData[which].actor.name
                        })
                      } else {
                        options.resultText = game.i18n.format('CoC7.AttackSuccess', {
                          name: rollData[which].actor.name
                        })
                      }
                    } else if (options.rollStatuses[which].isManeuver) {
                      if (options.rollStatuses[which].isDodging) {
                        options.resultText = game.i18n.format('CoC7.DodgeSuccess', {
                          name: rollData[which].actor.name
                        })
                      } else {
                        options.resultText = game.i18n.format('CoC7.ManeuverSuccess', {
                          name: rollData[which].actor.name
                        })
                      }
                    } else {
                      options.resultText = game.i18n.format('CoC7.AttackSuccess', {
                        name: rollData[which].actor.name
                      })
                    }
                  }
                }
              }
              updates['flags.CoC7.group-message.needsTieBreaker'] = options.needsTieBreaker
            } else {
              // Sort by successes
              const opposedRollTieBreaker = game.settings.get('CoC7', 'opposedRollTieBreaker')
              options.rollOrder.sort((a, b) => {
                if (options.rollStatuses[a].completed.successLevel > options.rollStatuses[b].completed.successLevel) {
                  return -1
                } else if (options.rollStatuses[a].completed.successLevel < options.rollStatuses[b].completed.successLevel) {
                  return 1
                } else if (opposedRollTieBreaker) {
                  if (options.rollStatuses[a].completed.modifiedResult > options.rollStatuses[b].completed.modifiedResult) {
                    return -1
                  } else if (options.rollStatuses[a].completed.modifiedResult < options.rollStatuses[b].completed.modifiedResult) {
                    return 1
                  }
                } else if (options.rollStatuses[a].completed.rawValue > options.rollStatuses[b].completed.rawValue) {
                  return -1
                } else if (options.rollStatuses[a].completed.rawValue < options.rollStatuses[b].completed.rawValue) {
                  return 1
                }
                return 0
              })
              const offsetMax = options.rollOrder.length
              let offset = 0
              const a = options.rollStatuses[options.rollOrder[0]]
              if (!a.failed) {
                for (; offset < offsetMax; offset++) {
                  const b = options.rollStatuses[options.rollOrder[offset]]
                  if (a.completed.successLevel !== b.completed.successLevel || (opposedRollTieBreaker ? a.completed.modifiedResult !== b.completed.modifiedResult : a.completed.rawValue !== b.completed.rawValue)) {
                    offset--
                    break
                  }
                }
              } else {
                offset = -1
              }
              options.isTie = offset > 0
              for (let i = 0; i < offsetMax; i++) {
                let isWinner = false
                let isTie = false
                if (i <= offset) {
                  isWinner = true
                  isTie = options.isTie
                }
                const which = options.rollOrder[i]
                options.rollStatuses[which].isWinner = isWinner
                options.rollStatuses[which].isTie = isTie
                updates['flags.CoC7.group-message.rollStatuses.' + which + '.isWinner'] = isWinner
                updates['flags.CoC7.group-message.rollStatuses.' + which + '.isTie'] = isTie
              }
              options.needsTieBreaker = false
              updates['flags.CoC7.group-message.needsTieBreaker'] = false
            }
            updates['flags.CoC7.group-message.isTie'] = options.isTie
          }
          break
      }
      const html = await renderTemplate(CoC7GroupMessage.getTemplatePath(msg.flags.CoC7['group-message'].type), options)
      updates.content = html
      await msg.update(updates)
    }
  }

  // Step 4: GM / - = Prepare message data
  static async updateTheMessage ({ messageId, updates }) {
    const msg = game.messages.get(messageId)
    if (msg?.flags?.CoC7?.['group-message'] ?? false) {
      await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
    }
  }

  static async getCheck ({ msg, theRoll }) {
    const checkData = {
      difficulty: theRoll.difficulty,
      diceModifier: theRoll.bonus,
      actorKey: (theRoll.actor.actorKey ?? theRoll.actor.actor.actorKey),
      denyPush: false,
      combat: (msg.flags?.CoC7?.['group-message'].isCombat ?? false)
    }
    switch (theRoll.type) {
      case 'characteristic':
        checkData.characteristic = theRoll.key
        checkData.denyPush = (msg.flags?.CoC7?.['group-message'].denyPush ?? false)
        break
      case 'attribute':
        checkData.attribute = theRoll.key
        checkData.denyPush = (msg.flags?.CoC7?.['group-message'].denyPush ?? false)
        break
      case 'skill':
        checkData.skill = theRoll.skill
        checkData.denyPush = ((msg.flags?.CoC7?.['group-message'].denyPush ?? false) || !theRoll.pushable)
        break
      case 'item':
        checkData.item = theRoll.item
        checkData.denyPush = ((msg.flags?.CoC7?.['group-message'].denyPush ?? false) || !theRoll.pushable)
        break
    }
    return CoC7Check.create(checkData)
  }

  // Step 3: GM / Non GM = Perform a roll
  static async performRoll ({ msg, which, roll, pushing } = {}) {
    const theRoll = await CoC7GroupMessage.parseRolls({ roll, quick: false })
    if (!theRoll) {
      return {}
    }
    const check = await CoC7GroupMessage.getCheck({ msg, theRoll })
    if (pushing) {
      check.pushing = pushing
    }
    await check._perform({
      forceDSN: true
    })
    const updates = {}
    updates['flags.CoC7.group-message.rollStatuses.' + which + '.completed'] = check.JSONRollData
    return updates
  }

  // Step 2b: GM / Non GM = perform roll data
  static async performCombinedRoll ({ messageId, msg, gmId, updates, pushing = false }) {
    if (typeof messageId !== 'undefined') {
      msg = game.messages.get(messageId)
    }

    const rollData = {}
    for (const which in msg?.flags?.CoC7?.['group-message'].rollStatuses) {
      const roll = await CoC7GroupMessage.parseRolls({ roll: msg?.flags?.CoC7?.['group-message'].rollStatuses[which].roll, quick: false })
      if (roll) {
        rollData[which] = roll
      }
    }

    const pool = {}
    for (const which in rollData) {
      pool[parseInt(rollData[which].bonus ?? 0, 10)] = false
    }

    const roll = await CoC7Dice.combinedRoll({ pool })

    let first = true
    for (const which in rollData) {
      const bonus = parseInt(rollData[which].bonus ?? 0, 10)
      const check = await CoC7GroupMessage.getCheck({ msg, theRoll: rollData[which] })
      if (pushing) {
        check.pushing = pushing
      }
      await check._perform({
        roll: roll[bonus],
        silent: (first === false ? true : undefined),
        forceDSN: first
      })
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.completed'] = check.JSONRollData
      first = false
    }

    if (msg.canUserModify(game.user, 'update')) {
      await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
    } else {
      const gmId = CoC7Utilities.getAnIdForGm()
      if (gmId !== false) {
        game.socket.emit('system.CoC7', {
          listener: gmId,
          type: 'group-message-update',
          messageId: msg.id,
          updates
        })
      }
    }
  }

  // Step 2a: GM / Non GM = perform roll data
  static async performNormalRoll ({ messageId, msg, rolls, gmId, updates, pushing = false }) {
    if (typeof messageId !== 'undefined') {
      msg = game.messages.get(messageId)
    }

    for (const which in rolls) {
      if (typeof msg.flags?.CoC7?.['group-message']?.rollStatuses[which].completed === 'undefined' || pushing) {
        Object.assign(updates, await CoC7GroupMessage.performRoll({ msg, which, roll: rolls[which], pushing }))
      } else {
        ui.notifications.error('CoC7.ErrorRollAlreadyCompleted', { localize: true })
      }
    }
    if (msg.canUserModify(game.user, 'update')) {
      await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
    } else if (gmId !== false) {
      game.socket.emit('system.CoC7', {
        listener: gmId,
        type: 'group-message-update',
        messageId: msg.id,
        updates
      })
    }
  }

  // Step 2: GM / Non GM = Prepare roll data
  static async performMyRolls ({ messageId, msg, rolls }) {
    if (typeof messageId !== 'undefined') {
      msg = game.messages.get(messageId)
    }
    const updates = {}
    for (const which in rolls) {
      await CoC7GroupMessage.nameRoll({ which, roll: rolls[which], updates })
    }

    const gmId = (msg.canUserModify(game.user, 'update') ? false : CoC7Utilities.getAnIdForGm())

    if (Object.keys(updates).length > 0) {
      if (msg.canUserModify(game.user, 'update')) {
        await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
      } else if (gmId !== false) {
        game.socket.emit('system.CoC7', {
          listener: gmId,
          type: 'group-message-update',
          messageId: msg.id,
          updates
        })
        // Wait for a bit to reduce race conditions
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    switch (msg.flags.CoC7['group-message'].type) {
      case 'combined':
        CoC7GroupMessage.performCombinedRoll({ msg, gmId, updates })
        break
      case 'opposed':
        CoC7GroupMessage.performNormalRoll({ msg, rolls, gmId, updates })
        break
    }
  }

  // Step 2: GM / Non GM = Name rolls
  static async nameRoll ({ which, roll, updates }) {
    const parsed = await CoC7GroupMessage.parseRolls({ roll, quick: false })
    if (parsed) {
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.shortName'] = parsed.shortName
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.fullName'] = parsed.fullName
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.tags'] = parsed.tags ?? []
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.percent'] = parsed.percent ?? 1
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.isManeuver'] = parsed.isManeuver ?? false
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.isDodging'] = parsed.isDodge ?? false
      updates['flags.CoC7.group-message.rollStatuses.' + which + '.isWeapon'] = parsed.isDodge ?? false
    }
  }

  // Step 1: GM / - = Create message
  static async newGroupMessage ({ rollData = undefined, options }) {
    if (typeof rollData === 'undefined') {
      rollData = {}
      for (const which in options.rollStatuses) {
        const roll = await CoC7GroupMessage.parseRolls({ roll: options.rollStatuses[which].roll, quick: true })
        rollData[which] = roll
      }
    }

    const rollsByUser = {}
    const rollRequiresName = {}
    for (const which in rollData) {
      let asUserId = ''
      switch (rollData[which].autoRoll.length) {
        case 1:
          if (rollData[which].autoRoll[0] !== game.user.id) {
            asUserId = rollData[which].autoRoll[0]
            break
          }
          // fallthrough
        case 0:
          asUserId = game.user.id
          break
        default:
          options.rollStatuses[which].rolling = false
          if (rollData[which].shortName === '-') {
            rollRequiresName[which] = rollData[which].roll
          }
          break
      }
      if (asUserId !== '') {
        if (!Object.prototype.hasOwnProperty.call(rollsByUser, asUserId)) {
          rollsByUser[asUserId] = {}
        }
        rollsByUser[asUserId][which] = options.rollStatuses[which].roll
        options.rollStatuses[which].rolling = asUserId
      }
    }

    const templateData = Object.assign({ rollData }, options)
    const html = await renderTemplate(CoC7GroupMessage.getTemplatePath(options.type), templateData)
    const chatData = {
      flags: {
        CoC7: {
          'group-message': options
        }
      },
      content: html
    }
    switch (chatData.flags?.CoC7?.['group-message']?.type) {
      case 'opposed':
        chatData.speaker = Object.assign(chatData.speaker ?? {}, { alias: game.i18n.localize('CoC7.OpposedRollCard') })
        break
      case 'combined':
        chatData.speaker = Object.assign(chatData.speaker ?? {}, { alias: Object.values(rollData)[0].actor.name })
        break
    }
    const msg = await ChatMessage.create(chatData)

    const updates = {}
    for (const which in rollRequiresName) {
      await CoC7GroupMessage.nameRoll({ which, roll: rollRequiresName[which], updates })
    }
    if (Object.keys(updates).length > 0) {
      await CoC7GroupMessage.updateTheGroupMessage({ msg, updates, rollData })
    }
    for (const userId in rollsByUser) {
      if (userId !== game.user.id) {
        game.socket.emit('system.CoC7', {
          type: 'group-message-roll',
          listener: userId,
          messageId: msg.id,
          rolls: rollsByUser[userId]
        })
      }
    }
    if (Object.prototype.hasOwnProperty.call(rollsByUser, game.user.id)) {
      await CoC7GroupMessage.performMyRolls({
        msg,
        rolls: rollsByUser[game.user.id]
      })
    }
    return msg
  }

  static async isUserActive ({ which, msg }) {
    if (msg.flags?.CoC7?.['group-message']?.rollStatuses[which].rolling ?? false) {
      const user = game.users.get(msg.flags.CoC7['group-message'].rollStatuses[which].rolling)
      if (game.user.isGM || !user || !user.active) {
        const updates = {
          ['flags.CoC7.group-message.rollStatuses.' + which + '.rolling']: false
        }
        if (msg.canUserModify(game.user, 'update')) {
          await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
        } else {
          const gmId = CoC7Utilities.getAnIdForGm()
          if (gmId !== false) {
            game.socket.emit('system.CoC7', {
              listener: gmId,
              type: 'group-message-update',
              messageId: msg.id,
              updates
            })
          }
        }
      }
    }
  }

  static async _onToggle (event) {
    event.preventDefault()
    const button = event.currentTarget
    const messageId = button.closest('li.chat-message')?.dataset.messageId
    const key = button.dataset.key
    let value = button.dataset.value
    if (messageId && key) {
      if (button.classList.contains('select-only-gm') && !game.user.isGM) {
        return
      }
      const msg = game.messages.get(messageId)
      if (typeof msg.flags?.CoC7?.['group-message']?.[key] !== 'undefined' && msg.canUserModify(game.user, 'update')) {
        if (typeof value === 'undefined') {
          value = !msg.flags.CoC7['group-message'][key]
        }
        const updates = {
          ['flags.CoC7.group-message.' + key]: value
        }
        switch (key) {
          case 'advantageDefender':
            updates['flags.CoC7.group-message.advantageAttacker'] = !value
            break
          case 'advantageAttacker':
            updates['flags.CoC7.group-message.advantageDefender'] = !value
            break
        }
        await CoC7GroupMessage.updateTheGroupMessage({ msg, updates })
      }
    }
  }

  static async _onClick (event) {
    event.preventDefault()
    const button = event.currentTarget
    const action = button.dataset.action
    const messageId = button.closest('li.chat-message')?.dataset.messageId
    const which = button.dataset.which
    if (messageId) {
      const msg = game.messages.get(messageId)
      if (typeof msg !== 'undefined') {
        if (typeof which !== 'undefined' && typeof msg.flags?.CoC7?.['group-message']?.rollStatuses[which] !== 'undefined') {
          const actor = await fromUuid(msg.flags.CoC7['group-message'].rollStatuses[which].roll.split('#')[0])
          if (!actor || !actor.canUserModify(game.user, 'update')) {
            ui.notifications.error('CoC7.ErrorNoActorPermission', { localize: true })
            return
          }
          switch (action) {
            case 'impatient-roll':
              CoC7GroupMessage.isUserActive({
                which,
                msg
              })
              break
            case 'normal-roll':
              CoC7GroupMessage.performMyRolls({
                msg,
                rolls: { [which]: msg.flags.CoC7?.['group-message'].rollStatuses[which].roll }
              })
              break
            case 'use-luck':
              CoC7GroupMessage.spendMyLuck({
                which,
                index: button.dataset.index,
                luckAmount: button.dataset.luckAmount,
                msg
              })
              break
            case 'remove-roll':
              CoC7GroupMessage.removeRoll({
                which,
                msg
              })
              break
            case 'push':
              CoC7GroupMessage.pushMyRoll({
                which,
                msg
              })
              break
          }
        } else if (typeof msg.flags?.CoC7?.['group-message']?.rollStatuses !== 'undefined') {
          let okay = false
          for (const which in msg.flags.CoC7['group-message'].rollStatuses) {
            const actor = await fromUuid(msg.flags.CoC7['group-message'].rollStatuses[which].roll.split('#')[0])
            if (actor.canUserModify(game.user, 'update')) {
              okay = true
              break
            }
          }
          if (!okay) {
            ui.notifications.error('CoC7.ErrorNoActorPermission', { localize: true })
            return
          }
          switch (action) {
            case 'roll-once':
              if (msg.flags.CoC7['group-message'].type === 'combined') {
                const updates = {}
                CoC7GroupMessage.performCombinedRoll({ msg, updates })
              }
              break
            case 'toggle':
              CoC7GroupMessage._onToggle(event)
              break
          }
        }
      }
    }
  }

  static async renderChatMessage (app, html, data) {
    const canModify = {
      gm: game.user.isGM
    }
    for (const which in app.flags?.CoC7?.['group-message']?.rollStatuses) {
      const actor = await fromUuid(app.flags.CoC7['group-message'].rollStatuses[which].roll.split('#')[0])
      canModify[which] = actor?.canUserModify(game.user, 'update') ?? false
    }
    canModify.any = Object.values(canModify).filter(b => b).length > 0
    for (const key in canModify) {
      if (!canModify[key]) {
        html.find('.visible-only-' + key).remove()
      } else {
        html.find('.hidden-only-' + key).remove()
      }
    }
    html.on('click', '.roll-card-v2 button:not(.toggle-switch)', CoC7GroupMessage._onClick.bind(this))
    html.on('click', '.roll-card-v2 a:not(.toggle-link)', CoC7GroupMessage._onClick.bind(this))
    html.on('click', '.roll-card-v2 button.toggle-switch', CoC7GroupMessage._onToggle.bind(this))
    html.on('click', '.roll-card-v2 a.toggle-link', CoC7GroupMessage._onToggle.bind(this))
  }

  static async getActor (identifier) {
    if (identifier.match(/^a\./)) {
      return ((await game.system.api.cocid.fromCoCID(identifier))?.[0]) ?? null
    }
    if (identifier.indexOf('.') > -1) {
      return await fromUuid(identifier)
    }
    return game.actors.get(identifier) ?? null
  }

  static async parseRolls ({ roll, quick = true, defaultUuid = '' }) {
    const match = roll.match(/^(?<a>[^#]+#)?(?<t>attribute|characteristic|item|skill)#(?<k>[^#]+)(#(?<m>.*))?$/)
    if (match) {
      const modifiers = (match.groups.m ?? '').toLowerCase().split('#')
      const bonus = parseInt(modifiers.find(m => m.match(/^[+-]\d+$/)) ?? 0, 10)
      const difficulty = modifiers.find(m => m.match(/^\d+$/))
      const pushing = modifiers.filter(m => m === 'p').length > 0
      // const attacker = modifiers.filter(m => m === 'x').length > 0 // NYI
      // const defender = modifiers.filter(m => m === 'o').length > 0 // NYI
      const rollData = {
        type: match.groups.t,
        key: match.groups.k,
        bonus,
        difficulty: ((difficulty ?? '').toString() === '0' ? CoC7Check.difficultyLevel.unknown : (difficulty ? parseInt(difficulty, 10) : (game.settings.get('CoC7', 'defaultCheckDifficulty') === 'unknown' ? CoC7Check.difficultyLevel.unknown : CoC7Check.difficultyLevel.regular))),
        pushing
      }
      if (!match.groups.a && defaultUuid && defaultUuid !== '') {
        match.groups.a = defaultUuid + '#'
      }
      if (match.groups.a) {
        const actor = await CoC7GroupMessage.getActor(match.groups.a.substr(0, match.groups.a.length - 1))
        if (!actor) {
          return null
        }
        rollData.actor = actor
        rollData.autoRoll = game.users.filter(u => !u.isGM && rollData.actor.canUserModify(u, 'update')).map(u => { return { id: u.id, active: u.active } })
        if (rollData.autoRoll.length > 0) {
          rollData.autoRoll = rollData.autoRoll.filter(d => d.active).map(d => d.id)
          if (rollData.autoRoll.length === 0) {
            rollData.autoRoll = ['prevent', 'roll']
          }
        }
      } else {
        const actor = await ActorPickerDialog.create()
        if (!actor) {
          ui.notifications.warn('CoC7.WarnNoControlledActor', { localize: true })
          return null
        }
        rollData.actor = actor
        if (!game.user.isGM) {
          rollData.autoRoll = [game.user.id]
        } else {
          rollData.autoRoll = game.users.filter(u => !u.isGM && rollData.actor.canUserModify(u, 'update')).map(u => { return { id: u.id, active: u.active } })
          if (rollData.autoRoll.length > 0) {
            rollData.autoRoll = rollData.autoRoll.filter(d => d.active).map(d => d.id)
            if (rollData.autoRoll.length === 0) {
              rollData.autoRoll = ['prevent', 'roll']
            }
          }
        }
      }
      rollData.roll = rollData.actor.uuid + '#' + rollData.type + '#' + rollData.key + (rollData.bonus < 0 ? '#' + rollData.bonus : (rollData.bonus > 0 ? '#+' + rollData.bonus : '')) + (difficulty === 0 ? '#0' : (difficulty ? '#' + parseInt(difficulty, 10) : ''))
      rollData.portrait = (rollData.actor instanceof TokenDocument ? rollData.actor.texture.src : rollData.actor.portrait)
      rollData.shortName = '-'
      rollData.fullName = '-'
      switch (rollData.type) {
        case 'characteristic':
          rollData.shortName = CoC7Utilities.getCharacteristicNames(rollData.key)?.short ?? '-'
          rollData.fullName = CoC7Utilities.getCharacteristicNames(rollData.key)?.label ?? '-'
          rollData.percent = (rollData.actor instanceof TokenDocument ? rollData.actor.actor : rollData.actor).system?.characteristics[rollData.key]?.value ?? 1
          if (rollData.shortName === '-') {
            return null
          }
          break
        case 'attribute':
          switch (rollData.key) {
            case 'lck':
              rollData.shortName = game.i18n.localize('CoC7.Luck')
              rollData.fullName = game.i18n.localize('CoC7.Luck')
              break
            case 'san':
              rollData.shortName = game.i18n.localize('CoC7.SAN')
              rollData.fullName = game.i18n.localize('CoC7.Sanity')
              break
            default:
              return null
          }
          rollData.percent = (rollData.actor instanceof TokenDocument ? rollData.actor.actor : rollData.actor).system?.attribs[rollData.key]?.value ?? 1
          break
        case 'skill':
          if (!quick) {
            const skills = await (rollData.actor instanceof TokenDocument ? rollData.actor.actor : rollData.actor).getItemOrAdd(rollData.key, 'skill')
            if (skills.length) {
              rollData.skill = skills[0]
              rollData.shortName = skills[0].shortName
              rollData.fullName = skills[0].shortName
              rollData.pushable = (skills[0].system.properties?.push ?? false)
              rollData.percent = skills[0].value
              rollData.isManeuver = skills[0].isDodge
              rollData.isDodge = skills[0].isDodge
            }
          }
          break
        case 'item':
          if (!quick) {
            const items = await (rollData.actor instanceof TokenDocument ? rollData.actor.actor : rollData.actor).getItemOrAdd(rollData.key, 'weapon')
            if (items.length) {
              rollData.item = items[0]
              rollData.shortName = items[0].shortName
              rollData.fullName = items[0].shortName
              rollData.isManeuver = items[0].system.properties?.mnvr ?? false
              rollData.isWeapon = true
              const skillId = items[0].system.skill[items[0].usesAlternativeSkill ? 'alternativ' : 'main'].id
              if (skillId) {
                const skill = (rollData.actor instanceof TokenDocument ? rollData.actor.actor : rollData.actor).items.find(d => d.id === skillId)
                rollData.tags = [skill.name]
                rollData.percent = skill.value
                rollData.pushable = (skill.system.properties?.push ?? false)
              }
            }
          }
          break
      }
      return rollData
    }
    return null
  }

  static getTemplatePath (type) {
    switch (type) {
      case 'opposed':
        return 'systems/CoC7/templates/chat/messages/opposed.hbs'
      case 'combinedall':
      case 'combinedany':
      case 'combined':
        return 'systems/CoC7/templates/chat/messages/combined.hbs'
    }
    return null
  }

  static async createGroupMessage (options) {
    // TODO: Add additional rolls
    // TODO: Physical Human Limits
    if (!CoC7GroupMessage.getTemplatePath(options.type)) {
      return null
    }

    let config = Object.assign({
      type: '',
      denyPush: false,
      showCompletedRolls: true,
      allRollsCompleted: false,
      isCombat: false,
      isEditable: true,
      rollStatuses: {},
      rollOrder: []
    }, options)

    switch (config.type) {
      case 'opposed':
        config = Object.assign({
          denyPush: true,
          isTie: false,
          needsTieBreaker: false,
          advantageAttacker: false,
          advantageDefender: false,
          defenderIsDodging: false,
          winnerRollsDamage: false
        }, config)
        break
      case 'combinedall':
      case 'combinedany':
      case 'combined':
        config = Object.assign({
          combined: (config.type === 'combinedall' ? 'all' : (config.type === 'combinedany' ? 'any' : '')),
          actorUuid: '',
          isSuccess: false,
          isFailure: false,
          wasPushed: false
        }, config)
        config.type = 'combined'
        break
    }

    const rollData = {}
    let count = 0
    for (const offset in options.rollRequisites) {
      const which = 'r' + offset
      const roll = await CoC7GroupMessage.parseRolls({ roll: options.rollRequisites[offset], quick: true, defaultUuid: config.actorUuid ?? '' })
      if (!roll) {
        return null
      }
      if (config.type === 'combined') {
        if (config.actorUuid === '' || config.actorUuid === roll.actor.uuid) {
          config.actorUuid = roll.actor.uuid
        } else {
          ui.notifications.error('CoC7.ErrorCombinedRollsRequireSingleActor', { localize: true })
          return null
        }
      }
      rollData[which] = roll
      config.rollStatuses[which] = {
        roll: roll.roll,
        rollable: (config.type !== 'combined'),
        rolling: false,
        shortName: roll.shortName,
        fullName: roll.fullName,
        percent: roll.percent,
        tags: [],
        isManeuver: false,
        isDodging: false,
        isWeapon: false
      }
      switch (config.type) {
        case 'opposed':
          config.rollStatuses[which] = Object.assign({
            isAttacker: count === 0, // Currently only 1v1 attacker first
            isWinner: false,
            isTie: false
          }, config.rollStatuses[which])
          break
        case 'combined':
          break
      }
      config.rollOrder.push(which)
      count++
    }
    if (config.type === 'opposed' && Object.keys(rollData).length !== 2) {
      ui.notifications.error('CoC7.ErrorOpposedRollsLimitedToTwoActors', { localize: true })
      return null
    }
    delete config.rollRequisites
    if (game.user.isGM) {
      return CoC7GroupMessage.newGroupMessage({ rollData, options: config })
    } else {
      const gmId = CoC7Utilities.getAnIdForGm()
      if (gmId === false) {
        // Error message shown in CoC7Utilities.getAnIdForGm()
        return null
      }
      game.socket.emit('system.CoC7', { type: 'group-message-new', listener: gmId, options: config })
      return true
    }
  }
}
