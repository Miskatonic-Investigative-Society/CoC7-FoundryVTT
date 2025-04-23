const fs = require('fs');
const path = require('path');

// Ensure checker directory exists
const checkerDir = path.join(__dirname, '../lang/checker');
if (!fs.existsSync(checkerDir)) {
    fs.mkdirSync(checkerDir, { recursive: true });
}

// Read English base file
const enTranslations = require('../lang/en.json');

// Read other language files
const langDir = path.join(__dirname, '../lang');
const langFiles = fs.readdirSync(langDir)
    .filter(file => file !== 'en.json' && file.endsWith('.json'));

// Process each language file
langFiles.forEach(langFile => {
    const lang = path.basename(langFile, '.json');
    const translations = require(`../lang/${langFile}`);
    
    const report = {
        language: lang,
        totalKeys: Object.keys(enTranslations).length,
        translatedKeys: 0,
        missingKeys: [],
        extraKeys: [],
        translationProgress: 0
    };

    // Check for missing translations
    Object.keys(enTranslations).forEach(key => {
        if (!translations[key]) {
            report.missingKeys.push(key);
        } else {
            report.translatedKeys++;
        }
    });

    // Check for extra translations
    Object.keys(translations).forEach(key => {
        if (!enTranslations[key]) {
            report.extraKeys.push(key);
        }
    });

    // Calculate translation progress
    report.translationProgress = ((report.translatedKeys / report.totalKeys) * 100).toFixed(2);

    // Generate missing translations JSON
    const missingTranslations = {};
    report.missingKeys.forEach(key => {
        missingTranslations[key] = enTranslations[key];
    });

    // Generate Markdown report
    let markdown = `# Translation Status Report for ${lang}\n\n`;
    markdown += `Generated at: ${new Date().toISOString()}\n\n`;
    markdown += `## Statistics\n`;
    markdown += `- Total keys: ${report.totalKeys}\n`;
    markdown += `- Translated keys: ${report.translatedKeys}\n`;
    markdown += `- Missing keys: ${report.missingKeys.length}\n`;
    markdown += `- Extra keys: ${report.extraKeys.length}\n`;
    markdown += `- Translation progress: ${report.translationProgress}%\n\n`;

    if (report.missingKeys.length > 0) {
        markdown += `## Missing Translations\n\n`;
        markdown += `The following ${report.missingKeys.length} keys are missing:\n\n`;
        report.missingKeys.forEach(key => {
            markdown += `- \`${key}\`: "${enTranslations[key]}"\n`;
        });
        markdown += '\n';
    }

    if (report.extraKeys.length > 0) {
        markdown += `## Extra Translations\n\n`;
        markdown += `The following ${report.extraKeys.length} keys are extra:\n\n`;
        report.extraKeys.forEach(key => {
            markdown += `- \`${key}\`\n`;
        });
    }

    // Save report and missing translations JSON
    fs.writeFileSync(
        path.join(checkerDir, `${lang}-report.md`),
        markdown
    );

    fs.writeFileSync(
        path.join(checkerDir, `${lang}-missing.json`),
        JSON.stringify(missingTranslations, null, 2)
    );

    // Save status JSON
    fs.writeFileSync(
        path.join(checkerDir, `${lang}-status.json`),
        JSON.stringify(report, null, 2)
    );
});

// Generate overall summary report
let summaryMarkdown = `# Overall Translation Status\n\n`;
summaryMarkdown += `Generated at: ${new Date().toISOString()}\n\n`;
summaryMarkdown += `## Status by Language\n\n`;
summaryMarkdown += `| Language | Progress | Missing Keys | Extra Keys |\n`;
summaryMarkdown += `|----------|----------|--------------|------------|\n`;

langFiles.forEach(langFile => {
    const lang = path.basename(langFile, '.json');
    const status = require(path.join(checkerDir, `${lang}-status.json`));
    summaryMarkdown += `| ${lang} | ${status.translationProgress}% | ${status.missingKeys.length} | ${status.extraKeys.length} |\n`;
});

fs.writeFileSync(
    path.join(checkerDir, 'summary.md'),
    summaryMarkdown
); 