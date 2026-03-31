/**
 * After all dice sets are (hopefully) loaded add a dt and do to each to look like the d100 (decider) die
 * @param {DsN} dice3d
 */
export default function (dice3d) {
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
}
