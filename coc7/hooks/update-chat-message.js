import { CoC7Chat } from '../chat.js'

export default function (chatMessage, chatData, diff, speaker) {
  CoC7Chat.onUpdateChatMessage(chatMessage, chatData, diff, speaker)
}
