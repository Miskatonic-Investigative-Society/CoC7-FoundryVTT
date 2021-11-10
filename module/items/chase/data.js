import { CoC7Item } from '../item.js'
import { _participant } from './participant.js'

export class CoC7Chase extends CoC7Item {
	constructor (data, context) {
		if (typeof data.img === 'undefined') {
			data.img = 'systems/CoC7/assets/icons/running-solid.svg'
		  }
		  super(data, context)
		  this.context = context
	}


	//Handle participants
	get participants () {
		const pList = []
		this.data.data.participants.forEach(p => {
		  pList.push(new _participant(p))
		  p.index = pList.length - 1
		})
		return pList
	}

	get participantsByAdjustedMov () {
		return this.participants.sort((a, b) => a.adjustedMov - b.adjustedMov)
	}
	
	get participantsByInitiative () {
		return this.participants.sort((a, b) => b.initiative - a.initiative)
  }

	get preys () {
    return (
      this.participants
        .filter(p => !p.isChaser && p.isValid) || []
    )
  }

  get chasers () {
    return (
      this.participants
        .filter(p => p.isChaser && p.isValid) || []
    )
  }
	//handle locations
}