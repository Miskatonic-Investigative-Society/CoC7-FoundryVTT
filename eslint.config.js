import globals from 'globals'
import js from '@eslint/js'
import jsdoc from 'eslint-plugin-jsdoc'
import pluginImport from 'eslint-plugin-import'
import stylistic from '@stylistic/eslint-plugin'

const config = [
  jsdoc.configs['flat/recommended'],
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      import: pluginImport,
      jsdoc,
      '@stylistic': stylistic
    },
    rules: {
      'no-empty': ['error', { 'allowEmptyCatch': true }], // Allow empty catch blocks
      'no-unused-vars': ['warn', { 'args': 'none', 'caughtErrors': 'none' }], // Allow unused function arguments
      'no-undef': 'error', // Disallow the use of undeclared variables unless mentioned in /*global */ comments

      // --- eslint-plugin-jsdoc ---
      'jsdoc/reject-function-type': 0, // Reports use of Function type within JSDoc tag types.
      'jsdoc/reject-any-type': 0, // Reports use of any (or *) type within JSDoc tag types.
      'jsdoc/require-description': 'warn', // Requires that all functions (and potentially other contexts) have a description.
      'jsdoc/no-undefined-types': 0, // Besides some expected built-in types, prohibits any types not specified as globals or within @typedef.
      'jsdoc/require-param-description': 0, // Requires that each @param tag has a description value.
      'jsdoc/require-returns-description': 0, // Requires that the @returns tag has a description value (not including void/undefined type returns).
      'jsdoc/require-jsdoc': [ // Checks for presence of JSDoc comments, on functions and potentially other contexts (optionally limited to exports).
        'warn',
        {
          require: {
            FunctionDeclaration: false,
            MethodDefinition: true
          }
        }
      ],

      // --- @stylistic/eslint-plugin ---
      '@stylistic/indent': ['error', 2], // Force 2-space indentation
      '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true }], // Use single quotes
      '@stylistic/semi': ['error', 'never'], // No semicolons at end of lines
      '@stylistic/comma-dangle': ['error', 'never'], // No trailing commas in objects/arrays
      '@stylistic/object-curly-spacing': ['error', 'always'], // Spaces inside braces: { key: value }
      '@stylistic/arrow-spacing': ['error', { 'before': true, 'after': true }], // Spaces in arrow functions: () => {}
      '@stylistic/comma-spacing': ['error', { 'before': false, 'after': true }], // Spaces in x, x
      '@stylistic/space-before-function-paren': ['error', 'always'],

      // --- eslint-plugin-import Rules ---
      'import/no-unresolved': 'error', // Ensure all imports resolve to valid files
      'import/named': 'error', // Verify named imports exist in the target module
      'import/default': 'error', // Ensure default imports are valid
      'import/namespace': 'error', // Verify namespace imports are correct
      'import/export': 'error', // Report any invalid exports
      'import/no-absolute-path': 'error' // Forbid absolute paths in imports
    }
  }
]

export default config
