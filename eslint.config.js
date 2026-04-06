import jsdoc from 'eslint-plugin-jsdoc'

const config = [
  jsdoc.configs['flat/recommended'],
  {
    files: ['**/*.js'],
    plugins: {
      jsdoc
    },
    rules: {
      'jsdoc/require-description': 'warn',
      'jsdoc/no-undefined-types': 0,
      'jsdoc/require-param-description': 0,
      'jsdoc/require-returns-description': 0,
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: false,
            MethodDefinition: true
          }
        }
      ]
    }
  }
]

export default config
