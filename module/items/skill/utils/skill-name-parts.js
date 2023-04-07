export class SkillNameParts {
  constructor (skillName, i18n) {
    this.skillName = skillName
    this.fightingTranslation = i18n.localize('CoC7.FightingSpecializationName')
    this.firearmsTranslation = i18n.localize('CoC7.FirearmSpecializationName')
  }

  guess () {
    const skillName = this.skillName

    const output = {
      fighting: false,
      firearm: false,
      skillName,
      special: false,
      specialization: ''
    }

    const match = skillName.match(/^(.+)\s*\(([^)]+)\)$/)
    if (match) {
      output.skillName = match[2].trim()

      const specialization = match[1].trim()
      output.specialization = specialization
      output.fighting = specialization === this.fightingTranslation
      output.firearm = specialization === this.firearmsTranslation
      output.special = true
    }

    return output
  }
}
