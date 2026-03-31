/* global FilePicker foundry game ui */
import { FOLDER_ID } from '../constants.js'

/* // FoundryVTT V12 */
export default class CoC7DirectoryPicker extends (foundry.applications.apps?.FilePicker ?? FilePicker) {
  /**
   * @inheritdoc
   */
  constructor (options = {}) {
    options.type = 'folder'
    super(options)
    if (typeof this.sources.public !== 'undefined') {
      delete this.sources.public
      if (this.activeSource === 'public') {
        this.activeSource = 'data'
      }
    }
  }

  static DEFAULT_OPTIONS = {
    form: {
      handler: CoC7DirectoryPicker.#onSubmit
    }
  }

  /**
   * Submit the form.
   * @deprecated FoundryVTT v12
   * @param {Event} event
   */
  static async #onSubmit (event) {
    if (this.options.tileSize) return
    if (!this.canCreateFolder) {
      ui.notifications.error('CoC7.FileUploadError', { localize: true })
      return
    }
    const path = event.target.file?.value
    if (!path) {
      ui.notifications.error('You must select a file to proceed.')
      return
    }
    // Update the target field
    if (this.field) {
      this.field.value = path
      this.field.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
    }
    // Trigger a callback and close
    if (this.callback) this.callback(path, this)
    await this.close()
  }

  /**
   * Submit the form.
   * @deprecated FoundryVTT v12
   * @param {Event} event
   */
  _onSubmit (event) {
    /* // FoundryVTT v12 */
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

  /**
   * Create string from path object
   * @param {object} value
   * @param {string} value.activeSource
   * @param {string|null} value.bucket
   * @param {string} value.current
   * @returns {string}
   */
  static format (value) {
    return value.bucket !== null
      ? `[${value.activeSource}:${value.bucket}] ${value.path}`
      : `[${value.activeSource}] ${value.path}`
  }

  /**
   * Get path object from string
   * @param {string} raw
   * @returns {object}
   */
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

  /**
   * Add button to config form
   * @param {HTMLElement|jQuery} html
   */
  static processHtml (html) {
    let inputs
    try {
      inputs = html.querySelectorAll('input[name=' + FOLDER_ID + '\\.dholeUploadDirectory]')
    } catch (e) {
      /* // FoundryVTT v12 */
      inputs = html[0].querySelectorAll('input[name=' + FOLDER_ID + '\\.dholeUploadDirectory]')
    }
    for (const input of inputs) {
      input.setAttribute('readonly', true)
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
        pickerIcon.classList.add('fa-solid', 'fa-file-import', 'fa-fw')
        pickerButton.append(pickerIcon)
        CoC7DirectoryPicker.createDefaultDirectory()
        pickerButton.onclick = (event) => {
          event.preventDefault()
          /* // FoundryVTT V12 */
          picker.render(true)
        }
        input.after(pickerButton)
      }
    }
  }

  /**
   * Attempt to create directory defined in settings
   * @returns {boolean}
   */
  static async createDefaultDirectory () {
    const parsed = CoC7DirectoryPicker.parse(game.settings.get(FOLDER_ID, 'dholeUploadDirectory'))
    try {
      await CoC7DirectoryPicker.createDirectory(
        parsed.activeSource,
        parsed.current,
        { bucket: parsed.bucket }
      )
      return true
    } catch (e) {
      if (!e.message.startsWith('EEXIST')) {
        ui.notifications.error('CoC7.ActorImporterUploadError', { localize: true })
        return false
      }
    }
  }

  /**
   * Save file to directory
   * @param {Blob} file
   * @param {string} filename
   * @returns {string|false}
   */
  static async uploadToDefaultDirectory (file, filename) {
    const parsed = CoC7DirectoryPicker.parse(game.settings.get(FOLDER_ID, 'dholeUploadDirectory'))
    /* // FoundryVTT V12 */
    const response = await (foundry.applications.apps?.FilePicker ?? FilePicker).upload(
      parsed.activeSource,
      parsed.current,
      new File([file], filename, {
        type: 'image/png'
      }),
      { bucket: parsed.bucket }
    )
    if (!response.path) {
      ui.notifications.error('CoC7.FileUploadError', { localize: true })
      return false
    }
    return parsed.current + '/' + filename
  }

  /**
   * Can upload
   * @returns {boolean}
   */
  get canUpload () {
    if (this.options.allowUpload === false) return false
    if (!['data', 's3'].includes(this.activeSource)) return false
    return !game.user || game.user.can('FILES_UPLOAD')
  }
}
