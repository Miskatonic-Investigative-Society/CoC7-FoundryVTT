export default function DrawNote (note) {
  if (note.document.getFlag('CoC7', 'hide-background') ?? false) {
    note.controlIcon.bg.clear()
  }
}
