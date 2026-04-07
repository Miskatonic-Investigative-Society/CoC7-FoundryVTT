import TemplateHelpers from './scripts/src/template-helpers.js'
import WebpackConfig from './scripts/webpack-config.js'

const config = new WebpackConfig()

try {
  await config.validate()
} catch (e) {
  TemplateHelpers.showErrorAndExit(e)
}

const exports = config.generate()

export default exports
