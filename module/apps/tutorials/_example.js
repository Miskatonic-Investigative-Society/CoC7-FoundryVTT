export const _example = {
  name: 'Example',
  requirements: async () => { // Optional
    // return true/false
    return true
  },
  setup: async () => { // Optional
    // Init actors, settings, etc
  },
  showIf: () => { // Optional
    // return true/false
    return true
  },
  steps: {
    0: {
      showIf: () => { // Optional
        // return true/false
        return true
      },
      prompt: 'Message to show.',
      setup: ({ id = '' } = {}) => {}, // Optional
      pointAt: ['up', 'selector'], // Optional
      dragAt: ['right', 'selector'], // Optional
      outline: 'selector', // Optional
      next: { // Optional
        hook: 'hook',
        option: 'option', // Optional
        check: ({ id = '' } = {}) => { // Optional
          // return true/false
          return true
        }
      }
    },
    1: {
      prompt: 'Final step.'
    }
  }
}
