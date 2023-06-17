import { execSync } from 'child_process';
import fs from 'fs';

// Define the command to run
const fontsDir = './public/fonts';
const command = (fontName, selector) => `glyphhanger ./dist/index.html --string --jsdom --cssSelector="${selector}" --subset=${fontsDir}/${fontName}.woff2 --output=${fontsDir}`;
// Run the command
console.log('Running command...');

execSync(command('vt323-v17-latin-regular', '*'), { stdio: 'inherit' });

console.log('Done.');
