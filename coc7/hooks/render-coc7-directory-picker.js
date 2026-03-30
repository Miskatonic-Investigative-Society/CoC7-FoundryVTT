export default function (app, html, options) {
  let row = false
  try {
    row = html.querySelector('div.upload-file')
  } catch (e) {
    /* // FoundryVTT v12 */
    row = html[0].querySelector('div.upload-file')
  }
  if (row) {
    row.remove()
  }
}
