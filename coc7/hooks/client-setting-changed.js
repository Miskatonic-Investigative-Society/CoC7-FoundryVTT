/**
 * Settings value changed
 * @param {string} key
 * @param {any} value
 * @param {object} options
 */
export default async function (key, value, options) {
  if (key === 'core.uiConfig') {
    if (typeof value.fontScale !== 'undefined') {
      document.body.style.setProperty('--font-size', String(value.fontScale))
    }
  }
}
