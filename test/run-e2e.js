import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { readdirSync, statSync, existsSync } from 'node:fs';

function findTestFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findTestFiles(filePath));
    } else if (file.endsWith('.test.jsx') || file.endsWith('.test.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const e2eDir = join(process.cwd(), 'test/e2e');
const testFiles = findTestFiles(e2eDir);

if (testFiles.length === 0) {
  console.log('No test files found in test/e2e/');
  process.exit(0);
}

const args = [
  '--import', './test/register-loader.js',
  '--import', './test/setup-env.js',
  '--test',
  ...testFiles
];

console.log(`Running tests: node ${args.join(' ')}`);

const child = spawn('node', args, { stdio: 'inherit' });
child.on('close', (code) => {
  process.exit(code);
});
