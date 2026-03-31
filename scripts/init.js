import * as fs from 'fs'
import TemplateHelpers from './src/template-helpers.js'

TemplateHelpers.requireNodeVersion()

const rootFolder = TemplateHelpers.systemRoot

const outputPaths = {}
let existingPath = ''
let multiple = false

if (fs.existsSync(rootFolder + '/fvtt.config.json')) {
  const jsonConfig = JSON.parse(fs.readFileSync(rootFolder + '/fvtt.config.json', 'utf8'))
  for (const key in jsonConfig) {
    if (key === 'currentSelection') {
      if (['string', 'undefined'].includes(typeof jsonConfig[jsonConfig[key]])) {
        multiple = false
      } else {
        multiple = true
      }
    } else if (typeof jsonConfig[key] === 'string') {
      outputPaths[key] = jsonConfig[key]
    } else {
      for (const key2 in jsonConfig[key]) {
        outputPaths[key2] = jsonConfig[key][key2]
      }
    }
  }
} else if (fs.existsSync(rootFolder + '/fvtt.config.js')) {
  await import(rootFolder.replace(/^([a-z]:)/i, 'file://$1') + '/fvtt.config.js').then((oldConfig) => {
    if (!fs.existsSync(rootFolder + '/fvtt.config.json')) {
      if (typeof oldConfig.default.userDataPath === 'string') {
        if (fs.existsSync(oldConfig.default.userDataPath + '/Data/modules') || fs.existsSync(oldConfig.default.userDataPath + '/Data/systems') || fs.existsSync(oldConfig.default.userDataPath + '/Data/worlds')) {
          existingPath = oldConfig.default.userDataPath
        }
      }
    }
  }).catch(() => {
  })
}
if (existingPath !== '') {
  let name = await TemplateHelpers.inputText({ prompt: 'Set name for ' + existingPath, defaultText: 'default' })
  if (name === 'currentSelection') {
    name = 'currentSelectionPath'
  }
  outputPaths[name] = existingPath
}

let action
do {
  console.log('')
  console.log('')
  const lengths = {
    number: Object.keys(outputPaths).length.toString().length,
    name: 0,
    path: 0
  }
  for (const name in outputPaths) {
    lengths.name = Math.max(lengths.name, name.length)
    lengths.path = Math.max(lengths.path, outputPaths[name].length)
  }
  const allowed = ['A', 'Q', '']
  let offset = 0
  for (const name in outputPaths) {
    console.log(offset.toString().padStart(lengths.number, ' ') + ' - Remove   | ' + name.padEnd(lengths.name, ' ') + ' | ' + outputPaths[name].padEnd(lengths.path, ' '))
    allowed.push(offset.toString())
    offset++
  }
  console.log('A'.padStart(lengths.number, ' ') + ' - Add Path | ' + ''.padEnd(lengths.name, ' ') + ' | ' + ''.padEnd(lengths.path, ' '))
  if (offset > 0) {
    console.log('S'.padStart(lengths.number, ' ') + ' - Save     | ' + ''.padEnd(lengths.name, ' ') + ' | ' + ''.padEnd(lengths.path, ' '))
    allowed.push('S')
    if (offset > 1) {
      console.log('T'.padStart(lengths.number, ' ') + ' - Toggle   | ' + ''.padEnd(lengths.name, ' ') + ' | ' + (multiple ? 'Simultaneous Builds' : 'Single Build').padEnd(lengths.path, ' '))
      allowed.push('T')
    }
  }
  console.log('Q'.padStart(lengths.number, ' ') + ' - Quit     | ' + ''.padEnd(lengths.name, ' ') + ' | ' + ''.padEnd(lengths.path, ' '))
  do {
    action = (await TemplateHelpers.inputText({ prompt: 'Option (empty to end)' })).toUpperCase()
  } while (!allowed.includes(action))
  switch (action) {
    case 'A':
      {
        const foundryVTTPath = await TemplateHelpers.inputFoundryVTTPath()
        if (foundryVTTPath !== '') {
          let name = await TemplateHelpers.inputText({ prompt: 'Set name for ' + foundryVTTPath })
          if (name === 'currentSelection') {
            name = 'currentSelectionPath'
          }
          outputPaths[name] = foundryVTTPath
        }
      }
      break
    case 'Q':
    case '':
      action = ''
      break
    case 'T':
      multiple = !multiple
      break
    case 'S':
      break
    default:
      delete outputPaths[Object.keys(outputPaths)[Number(action)]]
      break
  }
} while (!['S', ''].includes(action))

if (action === 'S') {
  const newConfig = {
    currentSelection: ''
  }
  if (multiple) {
    newConfig.currentSelection = 'multiple'
    newConfig.multiple = outputPaths
  } else {
    for (const name in outputPaths) {
      if (newConfig.currentSelection === '') {
        newConfig.currentSelection = name
      }
      newConfig[name] = outputPaths[name]
    }
  }
  try {
    fs.writeFileSync(rootFolder + '/fvtt.config.json', JSON.stringify(newConfig, null, 2), { flag: 'w+' })
    if (existingPath !== '') {
      TemplateHelpers.ansiFormat('Config file migrated.\n' + 'You can delete your "fvtt.config.js" file and "packs" folder.\n', { color: 'green', output: true })
    } else {
      TemplateHelpers.ansiFormat('Config file created\n', { color: 'green', output: true })
    }
  } catch (err) {
    TemplateHelpers.ansiFormat('Unable to create "fvtt.config.json"\n', { color: 'red', output: true })
  }
}
