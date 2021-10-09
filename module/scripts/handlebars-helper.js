/* global Handlebars */
import { chatHelper } from '../chat/helper.js'

export const handlebarsHelper = function () {
  Handlebars.registerHelper('rollActorImg', function (actorKey) {
    const img = chatHelper.getActorImgFromKey(actorKey)
    if (img) return img
    return '../icons/svg/mystery-man-black.svg'
  })
}
