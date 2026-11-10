/**
 * Helper
 * @param {EditorState} state
 * @param {dispatch} dispatch
 * @param {EditorView} view
 * @param {Array} nodes
 * @param {string} className
 */
function CoC7ProseMirrorParagraphToggleClass (state, dispatch, view, nodes, className) {
  const { $from, $to } = state.selection
  const tr = state.tr
  const range = $from.blockRange($to)
  if (!range) {
    return
  }
  for (let pos = range.start; pos < range.end; pos++) {
    const node = state.doc.nodeAt(pos)
    if (nodes.includes(node?.type)) {
      const classes = (node.attrs.classes ?? '').split(/ /)
      const already = classes.indexOf(className)
      if (already > -1) {
        classes.splice(already, 1)
      } else {
        classes.push(className)
      }
      tr.setNodeMarkup(pos, null, {
        ...node.attrs,
        classes: classes.join(' ').trim()
      })
    }
  }
  view.dispatch(tr)
}

/**
 * Helper
 * @param {EditorState} state
 * @param {dispatch} dispatch
 * @param {EditorView} view
 * @param {string} classes
 */
function CoC7ProseMirrorDivToggleContainer (state, dispatch, view, classes) {
  const { $from, $to } = state.selection
  const range = $from.blockRange($to)
  if (!range) {
    return
  }
  const inBlock = $from.hasAncestor(ProseMirror.defaultSchema.nodes.div)
  if (inBlock) {
    const target = ProseMirror.transform.liftTarget(range)
    if (target !== null) {
      view.dispatch(state.tr.lift(range, target))
    }
  } else {
    ProseMirror.commands.autoJoin(ProseMirror.commands.wrapIn(ProseMirror.defaultSchema.nodes.div, { classes }), [ProseMirror.defaultSchema.nodes.div.name])(state, view.dispatch)
  }
}

/**
 * Render Hook
 * @param {ProseMirrorMenu} menu
 * @param {object} config
 */
export default function (menu, config) {
  const indexHeadings = config.format.entries.findIndex(entry => entry.action === 'headings')
  if (indexHeadings > -1) {
    const indexChildren = config.format.entries[indexHeadings].children.findIndex(entry => entry.action === 'h4')
    if (indexChildren > -1) {
      config.format.entries[indexHeadings].children[indexChildren].title = config.format.entries[indexHeadings].children[indexChildren].title + ' <em>' + game.i18n.localize('EDITOR.Italic') + '</em>'
    }
  }
  /* // FoundryVTT V13 */
  if (game.release.generation === 13) {
    return
  }
  const indexAlignment = config.format.entries.findIndex(entry => entry.action === 'alignment')
  if (indexAlignment > -1) {
    config.format.entries.splice(indexAlignment, 0, {
      action: 'coc7',
      children: [
        {
          action: 'coc7-drop-cap',
          title: 'CoC7.ProseMirror.DropCap',
          cmd: (state, dispatch, view) => {
            CoC7ProseMirrorParagraphToggleClass(state, dispatch, view, [ProseMirror.defaultSchema.nodes.paragraph], 'has-drop-cap')
          }
        },
        {
          action: 'coc7-indent',
          title: 'CoC7.ProseMirror.Indent',
          cmd: (state, dispatch, view) => {
            CoC7ProseMirrorParagraphToggleClass(state, dispatch, view, [ProseMirror.defaultSchema.nodes.paragraph], 'has-indent')
          }
        },
        {
          action: 'coc7-example',
          title: 'CoC7.ProseMirror.Example',
          cmd: (state, dispatch, view) => {
            CoC7ProseMirrorParagraphToggleClass(state, dispatch, view, [ProseMirror.defaultSchema.nodes.paragraph], 'example')
          }
        },
        {
          action: 'coc7-keeper-information',
          title: 'CoC7.ProseMirror.KeeperInformation',
          cmd: (state, dispatch, view) => {
            CoC7ProseMirrorDivToggleContainer(state, dispatch, view, 'keeper-information')
          }
        }
      ],
      title: game.system.id
    })
  }
}
