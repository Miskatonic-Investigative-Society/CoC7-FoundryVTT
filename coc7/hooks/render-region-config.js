/* global DragDrop foundry fromUuid RegionBehavior */
export default function (application, element, context, options) {
  new (foundry.applications.ux?.DragDrop ?? DragDrop)({
    permissions: {
      drop: true
    },
    callbacks: {
      drop: async (event) => {
        const dataList = JSON.parse(event.dataTransfer.getData('text/plain'))
        if (typeof dataList.uuid === 'string') {
          let behaviors = []
          switch (dataList.type) {
            case 'RegionBehavior':
              behaviors = [(await fromUuid(dataList.uuid)).toObject()]
              break
            case 'Region':
              behaviors = (await fromUuid(dataList.uuid)).toObject().behaviors
              break
          }
          if (behaviors.length) {
            RegionBehavior.create(behaviors, { parent: application.document })
          }
        }
      }
    }
  }).bind(element.querySelector('.tab.region-behaviors'))
}
