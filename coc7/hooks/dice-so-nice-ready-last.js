export default function (dice3d) {
  if (typeof dice3d.DiceFactory.systems.forEach === 'function') {
    dice3d.DiceFactory.systems.forEach((systemData, systemKey) => {
      const d100 = systemData.dice.get('d100')
      if (typeof d100 !== 'undefined') {
        if (typeof systemData.dice.get('dt') === 'undefined') {
          const diceDecader = Object.assign(Object.create(Object.getPrototypeOf(d100)), d100)
          diceDecader.type = 'dt'
          systemData.dice.set(diceDecader.type, diceDecader)
        }
        if (typeof systemData.dice.get('do') === 'undefined') {
          const diceDecader = Object.assign(Object.create(Object.getPrototypeOf(d100)), d100)
          diceDecader.type = 'do'
          systemData.dice.set(diceDecader.type, diceDecader)
        }
      }
    })
  } else {
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
  }
}
