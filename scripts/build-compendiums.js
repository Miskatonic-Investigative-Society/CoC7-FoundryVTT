import { exit } from 'node:process'
import GenerateCompendiums from './generate-compendiums.js'

try {
  await GenerateCompendiums.process()
} catch (e) {
  console.log('\n', '\x1b[31m', 'ERROR: ', e.message, '\x1b[0m', 'line: ', e.stack, '\n\n')
  exit(1)
}
