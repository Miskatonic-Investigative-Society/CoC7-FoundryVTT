'use strict';

function exists(fs, path) {
    try {
        fs.accessSync(path, fs.constants.F_OK);
        return true;
    } catch (error) {
        console.error(`Unable to find ${path}. Did you forget to run this script from your root system directory?`);
        return false;
    }
}

function backup(fs, path) {
    fs.copyFileSync(path, `${path}.bak`);
    console.log(`Backed up ${path} to ${path}.bak`);
}

async function main() {
    const fs = require('fs');
    const readline = require('readline');

    if (!exists(fs, 'template.json')) return;
    if (!exists(fs, 'system.json')) return;

    let backups = await new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        function prompt() {
            rl.question('Would you like to backup modified files? Y/N >> ', (answer) => {
                answer = answer.toUpperCase();
                if (answer === 'Y' || answer === 'N') {
                    resolve(answer === 'Y');
                } else {
                    prompt();
                }
            });
        }
        prompt();
    });
    if (backups) {
        backup(fs, 'template.json');
        backup(fs, 'system.json');
    }

    const template = JSON.parse(fs.readFileSync('template.json').toString());

    if (!template.hasOwnProperty('Item')) {
        template['Item'] = {};
    }

    if (!template.Item.hasOwnProperty('types')) {
        template.Item['types'] = [];
    }
    if (!template.Item.types.includes('PDFoundry_PDF')) {
        template.Item.types.push('PDFoundry_PDF');
    }

    if (!template.Item.hasOwnProperty('PDFoundry_PDF')) {
        template.Item['PDFoundry_PDF'] = {};
    }

    const properties = [
        ['url', ''],
        ['code', ''],
        ['offset', 0],
        ['cache', false],
    ];

    for (const [key, value] of properties) {
        if (!template.Item.PDFoundry_PDF.hasOwnProperty(key)) {
            template.Item.PDFoundry_PDF[key] = value;
            continue;
        }

        if (!template.Item.PDFoundry_PDF[key] !== value) {
            template.Item.PDFoundry_PDF[key] = value;
        }
    }

    const templateContents = JSON.stringify(template, null, 4);
    fs.writeFileSync('template.json', templateContents);

    const system = JSON.parse(fs.readFileSync('system.json').toString());
    if (!system.hasOwnProperty('esmodules')) {
        system['esmodules'] = [];
    }

    if (!system.esmodules.includes('pdfoundry-dist/bundle.js')) {
        system.esmodules.push('pdfoundry-dist/bundle.js');
    }

    if (!systemData.socket) {
        systemData.socket = true;
    }

    const systemContents = JSON.stringify(system, null, 4);
    fs.writeFileSync('system.json', systemContents);

    console.log('Install complete.');
    process.exit(1);
}

main();
