/* global foundry */
/**
 *
 * @param {EditorState} state
 * @param {function} dispatch
 * @param {EditorView} view
 * @param {NodeType} allowedNode
 * @param {string} className
 * @param {boolean} isDataset Should this be saved as data-preserve-class
 */
function toggleClass (state, dispatch, view, allowedNode, className, isDataset) {
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
    positions.push({ pos: blockStart + pos, attrs: node.attrs })
  })
  const tr = state.tr
  positions.forEach(({ pos, attrs }) => {
    const classes = attrs.classes.split(/\s+/).filter(t => t)
    const index = classes.findIndex(t => t === className)
    if (isDataset) {
      if (typeof attrs._preserve['data-preserve-class'] === 'string') {
        delete attrs._preserve['data-preserve-class']
        if (index > -1) {
          classes.splice(index, 1)
        }
      } else {
        attrs._preserve['data-preserve-class'] = className
        if (index === -1) {
          classes.push(className)
        }
      }
    } else if (index === -1) {
      classes.push(className)
    } else {
      classes.splice(index, 1)
    }
    tr.setNodeMarkup(pos, null, {
      ...attrs, classes: classes.join(' ')
    })
  })
  dispatch(tr)
}

/**
 * Get prose mirror menu drop downs
 * @param {Application} menu
 * @param {object} config
 */
export default function (menu, config) {
  const existingBlockquote = config.format.entries.find(e => e.action === 'block')?.children.find(c => c.action === 'blockquote')
  config.format.entries.push({
    action: 'coc7',
    title: 'CoC7.EDITOR.Title',
    children: [{
      action: 'coc-text',
      title: 'CoC7.EDITOR.Paragraph.Title',
      children: [
        {
          action: 'coc7-drop-cap',
          title: 'CoC7.EDITOR.Paragraph.DropCap',
          priority: 5,
          node: menu.schema.nodes.paragraph,
          attrs: { _preserve: { class: 'coc7-drop-cap' } },
          cmd: (state, dispatch, view) => {
            toggleClass(state, dispatch, view, menu.schema.nodes.paragraph, 'coc7-drop-cap', false)
            return true
          }
        },
        existingBlockquote,
        {
          action: 'coc7-indent',
          title: 'CoC7.EDITOR.Paragraph.Indent',
          priority: 5,
          node: menu.schema.nodes.paragraph,
          attrs: { _preserve: { class: 'hasindent' } },
          cmd: (state, dispatch, view) => {
            toggleClass(state, dispatch, view, menu.schema.nodes.paragraph, 'hasindent', false)
            return true
          }
        }
      ]
    }, {
      action: 'coc-text',
      title: 'CoC7.EDITOR.Template.Title',
      children: [{
        action: 'coc7-template-two-columns',
        title: 'CoC7.EDITOR.Template.TwoColumns',
        node: menu.schema.nodes.div,
        attrs: { _preserve: { class: 'two-column flexrow' } },
        priority: 1,
        cmd: () => {
          menu._toggleBlock(menu.schema.nodes.div, foundry.prosemirror.commands.wrapIn, {
            attrs: { _preserve: { class: 'two-column flexrow' } }
          })
          return true
        }
      }, {
        action: 'coc7-template-keeper-information-full',
        title: 'CoC7.EDITOR.Template.KeeperInformationFull',
        node: menu.schema.nodes.div,
        attrs: { _preserve: { class: 'keeper-information' } },
        priority: 1,
        cmd: () => {
          menu._toggleBlock(menu.schema.nodes.div, foundry.prosemirror.commands.wrapIn, {
            attrs: { _preserve: { class: 'keeper-information' } }
          })
          return true
        }
      }, {
        action: 'coc7-template-keeper-information-right',
        title: 'CoC7.EDITOR.Template.KeeperInformationRight',
        node: menu.schema.nodes.div,
        attrs: { _preserve: { class: 'keeper-information sidebar' } },
        priority: 1,
        cmd: () => {
          menu._toggleBlock(menu.schema.nodes.div, foundry.prosemirror.commands.wrapIn, {
            attrs: { _preserve: { class: 'keeper-information sidebar' } }
          })
          return true
        }
      }, {
        action: 'coc7-template-keeper-notes',
        title: 'CoC7.EDITOR.Template.KeeperNotes',
        cmd: (state, dispatch, view) => {
          menu._placeInsert(state, dispatch, view, '<div class="keeper-notes"><div class="keeper-title default"><p></p></div><div class="keeper-body"><p class="hasindent">Keeper note...</p></div></div>', { inline: false })
          return true
        }
      }]
    }, {
      action: 'coc-image',
      title: 'CoC7.EDITOR.Image.Title',
      children: [{
        action: 'coc7-right-half-image',
        title: 'CoC7.EDITOR.Image.RightHalfImage',
        attrs: { _preserve: { 'data-preserve-class': 'coc7-right-half-image' } },
        cmd: (state, dispatch, view) => {
          toggleClass(state, dispatch, view, menu.schema.nodes.image, 'coc7-right-half-image', true)
          return true
        }
      }]
    }]
  })
}

// Insert Header
