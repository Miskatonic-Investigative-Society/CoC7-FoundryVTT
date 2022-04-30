/* global game */
export class CoC7DecaderDSNFaces {
  construtor () {
    this.selected = ''
  }

  setFaces () {
    let selected = game.user.getFlag('dice-so-nice', 'appearance')?.global.system
    if (selected !== this.selected) {
      let data
      let destination
      let sourceDie = game.dice3d.DiceFactory.systems[selected]?.dice.find(d => d.type === 'd100')
      if (typeof sourceDie === 'undefined') {
        sourceDie = game.dice3d.DiceFactory.systems.standard.dice.find(d => d.type === 'd100')
        selected = 'standard'
      }
      if (typeof sourceDie !== 'undefined') {
        destination = game.dice3d.DiceFactory.systems.standard.dice.findIndex(d => d.type === 'dt')
        data = Object.assign({}, sourceDie)
        data.type = 'dt'
        game.dice3d.DiceFactory.systems.standard.dice[destination] = Object.assign(sourceDie.constructor.prototype, data)
      }
      this.selected = selected
    }
  }
}
