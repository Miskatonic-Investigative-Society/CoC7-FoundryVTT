/* global FilePicker, foundry, game, ui */
/* // FoundryVTT V12 */
export class CoC7DirectoryPicker extends (foundry.applications.apps?.FilePicker ?? FilePicker) {
  constructor (options = {}) {
    options.type = 'folder'
    super(options)
  }

  get title () {
    return game.i18n.localize('CoC7.PickDirectory')
  }

  _onSubmit (event) {
    event.preventDefault()
    const path = event.target.target.value
    const activeSource = this.activeSource
    const bucket = event.target.bucket ? event.target.bucket.value : null
    this.field.value = CoC7DirectoryPicker.format({
      activeSource,
      bucket,
      path
    })
    this.close()
  }

  static format (value) {
    return value.bucket !== null
      ? `[${value.activeSource}:${value.bucket}] ${value.path}`
      : `[${value.activeSource}] ${value.path}`
  }

  static parse (raw) {
    const str = raw ?? ''
    const matches = str.match(/^\[([^:]+)(:(.+))?\]\s*(.+)?$/u)

    if (matches) {
      return {
        activeSource: matches[1],
        bucket: matches[3] ?? '',
        current: matches[4]
      }
    }
    return {
      activeSource: 'data',
      bucket: null,
      current: str
    }
  }

  static processHtml (html) {
    let inputs
    try {
      inputs = html.querySelectorAll('input[name=CoC7\\.dholeUploadDirectory]')
    } catch (e) {
      /* // FoundryVTT v12 */
      inputs = html[0].querySelectorAll('input[name=CoC7\\.dholeUploadDirectory]')
    }
    for (const input of inputs) {
      /* // FoundryVTT v11 */
      if (foundry.utils.isNewerVersion(game.version, '12')) {
        input.setAttribute('readonly', true)
      }
      if (!input.nextElementSibling) {
        const picker = new CoC7DirectoryPicker({
          field: input,
          ...CoC7DirectoryPicker.parse(input.value)
        })
        const pickerButton = document.createElement('button')
        pickerButton.classList.add('file-picker')
        pickerButton.setAttribute('title', game.i18n.localize('CoC7.PickDirectory'))
        /* // FoundryVTT v12 */
        if (foundry.utils.isNewerVersion(game.version, '13')) {
          pickerButton.setAttribute('style', 'flex: 0 0 auto;')
        }
        const pickerIcon = document.createElement('i')
        pickerIcon.classList.add('fas', 'fa-file-import', 'fa-fw')
        pickerButton.append(pickerIcon)
        CoC7DirectoryPicker.createDefaultDirectory()
        pickerButton.onclick = (event) => {
          event.preventDefault()
          picker.render(true)
        }
        input.after(pickerButton)
      }
    }
  }

  static async createDefaultDirectory () {
    const parsed = CoC7DirectoryPicker.parse(
      game.settings.get('CoC7', 'dholeUploadDirectory')
    )
    try {
      await CoC7DirectoryPicker.createDirectory(
        parsed.activeSource,
        parsed.current,
        { bucket: parsed.bucket }
      )
      return true
    } catch (e) {
      if (!e.message.startsWith('EEXIST')) {
        ui.notifications.error(
          game.i18n.localize('CoC7.ActorImporterUploadError')
        )
        return false
      }
    }
  }

  static async uploadToDefaultDirectory (file, filename) {
    const parsed = CoC7DirectoryPicker.parse(
      game.settings.get('CoC7', 'dholeUploadDirectory')
    )
    const response = await FilePicker.upload(
      parsed.activeSource,
      parsed.current,
      new File([file], filename, {
        type: 'image/png'
      }),
      { bucket: parsed.bucket }
    )
    if (!response.path) {
      ui.notifications.error(game.i18n.localize('CoC7.FileUploadError'))
      return false
    }
    return parsed.current + '/' + filename
  }

  get canUpload () {
    if (this.options.allowUpload === false) return false
    if (!['data', 's3'].includes(this.activeSource)) return false
    return !game.user || game.user.can('FILES_UPLOAD')
  }
}
