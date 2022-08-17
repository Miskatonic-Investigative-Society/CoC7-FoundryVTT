/* global $, File, FilePicker, game, ui */
export class CoC7DirectoryPicker extends FilePicker {
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

  static DefaultDirectory (val) {
    return val === null ? '' : String(val)
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
    $(html)
      .find('input[data-dtype="DefaultDirectory"]')
      .each((i, el) => {
        const input = $(el)
        input.prop('readonly', true)
        if (!input.next().length) {
          const picker = new CoC7DirectoryPicker({
            field: input[0],
            ...CoC7DirectoryPicker.parse(input.val())
          })
          const pickerButton = $(
            '<button type="button" class="file-picker" title="' +
              game.i18n.localize('CoC7.PickDirectory') +
              '"><i class="fas fa-file-import fa-fw"></i></button>'
          )
          pickerButton.on('click', () => {
            picker.render(true)
          })
          input.parent().append(pickerButton)
        }
      })
  }

  activateListeners (html) {
    super.activateListeners(html)

    $(html).find('ol.files-list').remove()
    $(html).find('footer div').remove()
    $(html).find('footer button').text(game.i18n.localize('CoC7.PickDirectory'))
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
      if (!e.startsWith('EEXIST')) {
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
}
