# Translation Checker

This directory contains automatically generated reports and files to help manage translations for the project.

## Files

For each language (e.g., `zh`, `ja`), you will find:

- `{lang}-report.md`: Detailed translation status report
- `{lang}-missing.json`: Missing translations with English source text
- `{lang}-status.json`: Translation statistics and progress

Additionally:
- `summary.md`: Overall translation status across all languages

## How to Use

1. Check `summary.md` for an overview of translation progress
2. For each language:
   - Review `{lang}-report.md` for detailed status
   - Use `{lang}-missing.json` as a template for missing translations
   - Check `{lang}-status.json` for statistics

## Automatic Updates

These files are automatically updated when:
- New translations are added
- Existing translations are modified
- The English base file (`en.json`) is updated

## Contributing

When adding new translations:
1. Copy missing keys from `{lang}-missing.json`
2. Add your translations
3. Submit a pull request
4. The checker will automatically verify your changes 