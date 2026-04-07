export default function (application, element, context, options) {
  if (['ChaosiumCanvasInterfaceTileToggle', 'ChaosiumCanvasInterfaceDrawingToggle'].includes(application.document?.type)) {
    element.querySelector('.window-content')?.classList.add('scrollable')
  }
}
