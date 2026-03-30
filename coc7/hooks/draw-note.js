export default function (note) {
  if (note.document.getFlag('CoC7', 'hide-background') ?? false) {
    note.controlIcon.bg.clear()
  }
}
