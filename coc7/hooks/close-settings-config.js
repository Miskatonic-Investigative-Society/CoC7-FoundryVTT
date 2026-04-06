/**
 * Get config header buttons hook
 * @deprecated FoundryVTT v12
 * @param {Application} application
 * @param {jQuery} html
 */
export default function (application, html) {
  const fontSize = html.find('[name=core\\.fontSize]').val()
  if (typeof fontSize !== 'undefined') {
    document.body.style.setProperty('--font-size', String(fontSize))
  }
}
