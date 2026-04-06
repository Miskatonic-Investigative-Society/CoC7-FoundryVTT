import GenerateCompendiums from './src/generate-compendiums.js'
import TemplateHelpers from './src/template-helpers.js'

try {
  await GenerateCompendiums.process()
} catch (e) {
  TemplateHelpers.showErrorAndExit(e)
}
