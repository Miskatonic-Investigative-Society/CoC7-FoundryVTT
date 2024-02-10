/* global Hooks */
export function listen () {
  Hooks.once('diceSoNiceReady', dice3d => {
    for (const system in dice3d.DiceFactory.systems) {
      const d100 = dice3d.DiceFactory.systems[system].dice.find(d => d.type === 'd100')
      if (typeof d100 !== 'undefined') {
        if (typeof dice3d.DiceFactory.systems[system].dice.find(d => d.type === 'dt') === 'undefined') {
          const diceDecader = Object.assign(Object.create(Object.getPrototypeOf(d100)), d100)
          diceDecader.type = 'dt'
          dice3d.DiceFactory.systems[system].dice.push(diceDecader)
        }
        if (typeof dice3d.DiceFactory.systems[system].dice.find(d => d.type === 'do') === 'undefined') {
          const diceDecader = Object.assign(Object.create(Object.getPrototypeOf(d100)), d100)
          diceDecader.type = 'do'
          dice3d.DiceFactory.systems[system].dice.push(diceDecader)
        }
      }
    }
  })
}
