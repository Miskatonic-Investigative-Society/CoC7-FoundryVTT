/**
 * Render Hook
 * @param {ProseMirrorMenu} menu
 * @param {object} config
 */
export default function (menu, config) {
  /* // FoundryVTT V13 */
  if (game.release.generation === 13) {
    return
  }
  if (typeof menu.view.dom.closest('prose-mirror').dataset.backstory !== 'undefined') {
    const index = config.findIndex(row => row.action === 'clear-formatting')
    if (index > -1) {
      config.splice(index, 0, {
        action: 'key-backstory',
        title: 'CoC7.KeyBackstory',
        icon: '<i class="fa-solid fa-key fa-fw"></i>',
        scope: '',
        cmd: (state, dispatch, view) => {
          const { from, to } = state.selection
          const mark = ProseMirror.defaultSchema.marks.em.create({ classes: 'key-backstory' })
          const hasMark = state.doc.rangeHasMark(from, to, mark)
          let tr = state.tr.removeMark(from, to, ProseMirror.defaultSchema.marks.em)
          if ( !hasMark ) tr = tr.addMark(from, to, mark)
          dispatch(tr)
        }
      })
    }
  }
}
