import * as fs from 'fs'
import * as path from 'path'
import decompress from 'decompress'
import fetch from 'node-fetch'
import webfontsGenerator from '@vusion/webfonts-generator'
import { formatErrorText, getRootFolder, processArguments, requireNodeVersion } from './index.js'

// npm run game-icons-build -- --help

requireNodeVersion()

/* When new icons are added with the same name set the order here so the font file doesn't swap class names */
const knownDuplicates = {
  bat: [
    'skoll',
    'delapouite'
  ],
  'bone-knife': [
    'delapouite',
    'lorc'
  ],
  'book-cover': [
    'delapouite',
    'lorc'
  ],
  'bowie-knife': [
    'lorc',
    'skoll'
  ],
  'butterfly-knife': [
    'delapouite',
    'skoll'
  ],
  castle: [
    'delapouite',
    'lorc'
  ],
  cauldron: [
    'darkzaitzev',
    'lorc'
  ],
  clover: [
    'lorc',
    'sbed'
  ],
  cobra: [
    'delapouite',
    'skoll'
  ],
  'crescent-blade': [
    'lorc',
    'skoll'
  ],
  cultist: [
    'lorc',
    'skoll'
  ],
  distraction: [
    'darkzaitzev',
    'lorc'
  ],
  'dragon-head': [
    'lorc',
    'faithtoken'
  ],
  drill: [
    'delapouite',
    'lorc'
  ],
  fairy: [
    'delapouite',
    'lorc'
  ],
  fist: [
    'lorc',
    'skoll'
  ],
  'gas-mask': [
    'lorc',
    'skoll'
  ],
  grenade: [
    'lorc',
    'sbed'
  ],
  hand: [
    'lorc',
    'sbed'
  ],
  'hang-glider': [
    'delapouite',
    'skoll'
  ],
  headshot: [
    'lorc',
    'skoll'
  ],
  'horse-head': [
    'delapouite',
    'lorc'
  ],
  jeep: [
    'delapouite',
    'skoll'
  ],
  key: [
    'lorc',
    'sbed'
  ],
  molecule: [
    'lorc',
    'skoll'
  ],
  mouse: [
    'lorc',
    'delapouite'
  ],
  mp5: [
    'delapouite',
    'skoll'
  ],
  ram: [
    'darkzaitzev',
    'lorc'
  ],
  revolt: [
    'darkzaitzev',
    'sbed'
  ],
  revolver: [
    'delapouite',
    'skoll'
  ],
  rock: [
    'john-redman',
    'lorc'
  ],
  rss: [
    'delapouite',
    'lorc'
  ],
  scissors: [
    'john-redman',
    'lorc'
  ],
  screw: [
    'delapouite',
    'lorc'
  ],
  shuriken: [
    'darkzaitzev',
    'lorc'
  ],
  smartphone: [
    'skoll',
    'delapouite'
  ],
  splash: [
    'lorc',
    'sbed'
  ],
  'steel-claws': [
    'lorc',
    'skoll'
  ],
  stiletto: [
    'lorc',
    'skoll'
  ],
  stopwatch: [
    'lorc',
    'skoll'
  ],
  sunrise: [
    'lorc',
    'delapouite'
  ],
  swallow: [
    'lorc',
    'delapouite'
  ],
  syringe: [
    'lorc',
    'sbed'
  ],
  'tesla-coil': [
    'lorc',
    'caro-asercion'
  ],
  tombstone: [
    'lorc',
    'sbed'
  ],
  trousers: [
    'lucasms',
    'lorc'
  ],
  'wolverine-claws': [
    'lorc',
    'delapouite'
  ]
}

try {
  const sourceLink = 'https://game-icons.net/archives/svg/zip/000000/transparent/game-icons.net.svg.zip'

  const rootFolder = getRootFolder()

  const args = processArguments('Create CSS and font file for Game Icons.', {
    fresh: 'Download the zip file again even if it already exists.',
    'keep-old': 'Do not extract the zip file if it already exists. Fresh download will preprevent this.'
  })

  const tempFolder = rootFolder + '/temp/'

  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder)
  }

  const extractToFolder = tempFolder + path.basename(sourceLink, '.zip')

  const downloadedFile = tempFolder + path.basename(sourceLink)

  const freshDownload = args.fresh ?? false

  let keepOld = args['keep-old'] ?? false

  async function downloadZip () {
    return new Promise((resolve) => {
      console.log('Download: ' + sourceLink)
      fetch(sourceLink).then((zip) => {
        const stream = fs.createWriteStream(downloadedFile)
        zip.body.pipe(stream)
        zip.body.on('finish', () => {
          console.log('Downloaded: Zip File')
          resolve(true)
        })
      }).catch((error) => {
        throw error
      })
    })
  }

  async function extractZip () {
    return new Promise((resolve) => {
      console.log('Extract: Zip File')
      if (!fs.existsSync(extractToFolder)) {
        fs.mkdirSync(extractToFolder)
        console.log('Extract: Removed previous files')
      }
      decompress(downloadedFile, extractToFolder, {
        filter: (file) => {
          if (/\/(license\.txt|[^/]+\/[^/]+\.svg)$/.test(file.path)) {
            return true
          }
          return false
        },
        map: (file) => {
          const nameFolder = file.path.match(/\/(license\.txt|[^/]+\/[^/]+\.svg)$/)
          if (nameFolder) {
            file.path = nameFolder[1]
          }
          return file
        }
      }).then((files) => {
        console.log('Extracted: Zip File')
        resolve(true)
      }).catch((error) => {
        throw error
      })
    })
  }

  function preparingList () {
    console.log('Preparing: SVG List')

    const mapFilename = fs.readdirSync(extractToFolder, {
      recursive: true
    }).reduce((c, file) => {
      const parts = file.match(/^([^/]+)\/([^/]+)\.svg$/)
      if (parts) {
        if (Object.prototype.hasOwnProperty.call(knownDuplicates, parts[2])) {
          if (!Object.prototype.hasOwnProperty.call(c, parts[2])) {
            c[parts[2]] = knownDuplicates[parts[2]]
          }
          if (c[parts[2]].filter(v => v === parts[1]).length === 0) {
            throw new Error('The file "' + file + '" could not be added to existing')
          }
        } else if (!Object.prototype.hasOwnProperty.call(c, parts[2])) {
          c[parts[2]] = [parts[1]]
        } else {
          throw new Error('The file "' + file + '" could not be added')
        }
      }
      return c
    }, {})

    console.log('Preparing: Files List')

    return Object.keys(mapFilename).reduce((c, g) => {
      const first = mapFilename[g].shift()
      c[extractToFolder + '/' + first + '/' + g + '.svg'] = { name: g, by: first }
      let count = 2
      for (const from of mapFilename[g]) {
        c[extractToFolder + '/' + from + '/' + g + '.svg'] = { name: g + '-' + count, by: from }
        count++
      }
      return c
    }, {})
  }

  function checkIconsBy () {
    console.log('Reading: license.txt')

    const iconsBy = {}
    const sourceBy = fs.readFileSync(extractToFolder + '/license.txt').toString().match(/- (.+)/g)
    for (const row of sourceBy) {
      const parts = row.match(/^- (.+?)((,| - ).*|)$/)
      let name
      if (parts[1] === 'Lucas' && fs.existsSync(extractToFolder + '/' + (name = 'lucasms'))) {
        iconsBy[name] = '/* Icons made by ' + parts[1] + parts[2] + ' */'
      } else if (fs.existsSync(extractToFolder + '/' + (name = parts[1].toLowerCase()))) {
        iconsBy[name] = '/* Icons made by ' + parts[1] + parts[2] + ' */'
      } else if (fs.existsSync(extractToFolder + '/' + (name = parts[1].toLowerCase().replace(/ /g, '-')))) {
        iconsBy[name] = '/* Icons made by ' + parts[1] + parts[2] + ' */'
      } else if (fs.existsSync(extractToFolder + '/' + (name = parts[1].replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()))) {
        iconsBy[name] = '/* Icons made by ' + parts[1] + parts[2] + ' */'
      } else if (fs.existsSync(extractToFolder + '/' + (name = parts[1].toLowerCase().replace(/ /g, '')))) {
        iconsBy[name] = '/* Icons made by ' + parts[1] + parts[2] + ' */'
      } else {
        throw new Error('Unexpected creator ' + row)
      }
    }
    return iconsBy
  }

  if (freshDownload || !fs.existsSync(downloadedFile)) {
    await downloadZip()
    keepOld = false
  }

  // Extract Zip
  if (keepOld && !fs.existsSync(extractToFolder)) {
    keepOld = false
  }

  if (keepOld) {
    // NOP
  } else if (fs.existsSync(downloadedFile)) {
    if (fs.existsSync(extractToFolder)) {
      fs.rmSync(extractToFolder, { recursive: true, force: true })
    }
    await extractZip()
  } else {
    throw new Error('Zip file is missing')
  }

  if (!fs.existsSync(extractToFolder + '/license.txt')) {
    throw new Error('The license.txt file is missing')
  }

  const files = preparingList()

  const iconsBy = checkIconsBy()

  const sortedFiles = Object.keys(files).sort()

  const webfontsConfig = {
    files: sortedFiles,
    rename: (string) => {
      return files[string].name
    },
    dest: tempFolder,
    fontName: 'game-icons',
    css: true,
    templateOptions: {
      classPrefix: 'game-icon-',
      baseSelector: '.game-icon'
    },
    types: ['woff'],
    startCodepoint: 0xF000,
    normalize: true
  }

  console.log('Generate Fonts')

  await new Promise((resolve) => {
    webfontsGenerator(webfontsConfig, (error, result) => {
      if (error) {
        throw error
      } else {
        console.log('Generated')
        resolve(true)
      }
    })
  })

  console.log('Update CSS files')

  const cssFilename = webfontsConfig.dest + '/' + webfontsConfig.fontName + '.css'

  // Add Licence header to CSS file
  let cssFile = '/* Game Icons (https://game-icons.net/) - Licence */\n/* https://github.com/game-icons/icons/blob/master/license.txt */\n\n' + fs.readFileSync(cssFilename).toString()

  // Backwards compatible CSS
  const first = webfontsConfig.templateOptions.baseSelector + ':before {'
  cssFile = cssFile.replace(first, webfontsConfig.templateOptions.baseSelector + ' {\n\tline-height: 1;\n}\n\n' + first + '\n\t' + 'unicode-bidi: plaintext;\n\t-webkit-font-smoothing: antialiased;\n\t-moz-osx-font-smoothing: grayscale;\n\tfont-variant: normal;\n\ttext-decoration: none;\n\ttext-transform: none;')

  // Add author to top of each block
  let last = ''
  for (const file of sortedFiles) {
    const by = files[file].by
    if (by !== last) {
      const first = webfontsConfig.templateOptions.baseSelector + '-' + files[file].name + ':before'
      cssFile = cssFile.replace(first, (Object.prototype.hasOwnProperty.call(iconsBy, files[file].by) ? iconsBy[files[file].by] : '/* Icons made by ' + files[file].by + ' */') + '\n' + first)
      last = by
    }
  }

  // Remove line-height
  cssFile = cssFile.replace('.game-icon {\n\tline-height: 1;\n}\n\n', '')
  // Remove line-height
  cssFile = cssFile.replace('\n\tvertical-align: top;', '')

  console.log('Move files')

  if (!fs.existsSync(rootFolder + '/lib')) {
    fs.mkdirSync(rootFolder + '/lib')
  }
  if (!fs.existsSync(rootFolder + '/lib/game-icons')) {
    fs.mkdirSync(rootFolder + '/lib/game-icons')
  }

  fs.writeFileSync(rootFolder + '/lib/game-icons/' + webfontsConfig.fontName + '.css', cssFile, { flag: 'w+' })
  fs.renameSync(webfontsConfig.dest + '/' + webfontsConfig.fontName + '.woff', rootFolder + '/lib/game-icons/' + webfontsConfig.fontName + '.woff')

  console.log('Completed')
} catch (e) {
  console.log('\n' + formatErrorText('ERROR: ' + e.message) + '\n\n')
  process.exit(1)
}
