/**
 *
 * @param {EditorState} state
 * @param {function} dispatch
 * @param {EditorView} view
 * @param {NodeType} allowedNode
 * @param {string} className
 */
function toggleClass (state, dispatch, view, allowedNode, className) {
  const { $from, $to } = state.selection
  const range = $from.blockRange($to)
  if (!range) {
    return
  }
  const positions = []
  // The range positions are absolute, so we need to convert them to be relative to the parent node.
  const blockStart = range.parent.eq(state.doc) ? 0 : range.start
  // Calculate the positions of all the paragraph nodes that are direct descendants of the blockRange parent node.
  range.parent.nodesBetween(range.start - blockStart, range.end - blockStart, (node, pos) => {
    if (node.type !== allowedNode) {
      return false
    }
    console.log(node)
    positions.push({ pos: blockStart + pos, attrs: node.attrs })
  })
  const tr = state.tr
  positions.forEach(({ pos, attrs }) => {
    const classes = attrs.classes.split(/\s+/).filter(t => t)
    const index = classes.findIndex(t => t === className)
    if (index === -1) {
      classes.push(className)
    } else {
      classes.splice(index, 1)
    }
    tr.setNodeMarkup(pos, null, {
      ...attrs, classes: classes.join(' ')
    })
  })
  view.dispatch(tr)
}

/**
 * Get prose mirror menu drop downs
 * @param {Application} menu
 * @param {object} config
 */
export default function (menu, config) {
  config.format.entries.push({
    action: 'coc7',
    title: 'CoC7',
    children: [{
      action: 'coc7-drop-cap',
      title: 'CoC7.EDITOR.DropCap',
      priority: 4,
      node: menu.schema.nodes.paragraph,
      attrs: { _preserve: { class: 'coc7-drop-cap' } },
      cmd: (state, dispatch, view) => {
        toggleClass(state, dispatch, view, menu.schema.nodes.paragraph, 'coc7-drop-cap')
        return true
      }
    }]
  })
}
