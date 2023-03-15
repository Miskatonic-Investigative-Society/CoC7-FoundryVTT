import test from 'ava'
import sinon from 'sinon'
import { SkillNameParts } from '../module/items/skill/skill-name-parts.js'

test("#guessNameParts correctly guesses 'dodge'", t => {
  const result = new SkillNameParts('dodge', _createStub()).guess()
  t.like(result, {
    skillName: 'dodge',
    fighting: false,
    firearm: false,
    specialization: undefined
  })
})

test("#guessNameParts correctly guesses 'fighting(brawl)'", t => {
  const result = new SkillNameParts('fighting(brawl)', _createStub()).guess()
  t.like(result, {
    skillName: 'brawl',
    fighting: true,
    firearm: false,
    specialization: 'fighting'
  })
})

test("#guessNameParts correctly guesses 'firearms(handguns)'", t => {
  const result = new SkillNameParts('firearms(handguns)', _createStub()).guess()
  t.like(result, {
    skillName: 'handguns',
    fighting: false,
    firearm: true,
    specialization: 'firearms'
  })
})

// Helper methods
const _createStub = () => {
  const localize = sinon.stub()
  localize.withArgs('CoC7.FightingSpecializationName').returns('fighting')
  localize.withArgs('CoC7.FirearmSpecializationName').returns('firearms')

  return { localize }
}
