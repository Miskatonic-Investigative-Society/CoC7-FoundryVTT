import globals from "globals";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import pluginImport from "eslint-plugin-import";

export default [
  {
    ignores: [
      "**/node_modules/",
      "lib/socketlib/"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.jquery,
        "foundry": "readonly",
        "game": "readonly",
        "canvas": "readonly",
        "ui": "readonly",
        "CONFIG": "writable",
        "CONST": "readonly",
        "Hooks": "readonly",
        "socketlib": "readonly",
        "Actor": "readonly",
        "Item": "readonly",
        "JournalEntry": "readonly",
        "ChatMessage": "readonly",
        "Dialog": "readonly",
        "FilePicker": "readonly",
        "TextEditor": "readonly",
        "Roll": "readonly"
      }
    },
    plugins: {
      "@stylistic": stylistic,
      "import": pluginImport,
    },
    rules: {
      "no-unused-vars": ["warn", { "args": "none" }],
      "no-undef": "error",
      
      // --- @stylistic Style Rules ---
      "@stylistic/indent": ["error", 2], // Force 2-space indentation
      "@stylistic/quotes": ["error", "single"], // Use single quotes
      "@stylistic/semi": ["error", "never"], // No semicolons at end of lines
      "@stylistic/comma-dangle": ["error", "never"], // No trailing commas in objects/arrays
      "@stylistic/object-curly-spacing": ["error", "always"], // Spaces inside braces: { key: value }
      "@stylistic/arrow-spacing": ["error", { "before": true, "after": true }], // Spaces in arrow functions: () => {}
      
      // --- eslint-plugin-import Rules ---
      "import/no-unresolved": "error", // Ensure all imports resolve to valid files
      "import/named": "error", // Verify named imports exist in the target module
      "import/default": "error", // Ensure default imports are valid
      "import/namespace": "error", // Verify namespace imports are correct
      "import/export": "error", // Report any invalid exports
      "import/no-absolute-path": "error" // Forbid absolute paths in imports
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".mjs"]
        }
      }
    }
  },
  {
    files: ["scripts/**/*.js", "*.config.js", "generate-*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      }
    },
    rules: {
      "no-console": "off", // Allow `console.log` in build scripts
    }
  }
];
