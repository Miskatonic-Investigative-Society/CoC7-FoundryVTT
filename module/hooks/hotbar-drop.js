import { CoC7Utilities } from '../utilities.js'

export default function (bar, data, slot) {
  // Check if this is a CoC7 item first
  if (data.type === 'Item') {
    // Handle the async operation but don't wait for it
    CoC7Utilities.createMacro(bar, data, slot)
    // Return false immediately to prevent default behavior
    return false
  }
  // Let default behavior handle other cases
  return true
}
