#!/usr/bin/env node

/**
 * Utility script to verify that the UI is using dynamic data from MCP
 * and not any hardcoded/static data
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const STATIC_DATA_PATTERNS = [
  /const\s+strategies\s*=\s*\[/g,
  /const\s+mockStrategies\s*=\s*\[/g,
  /const\s+STRATEGIES\s*=\s*\[/g,
  /strategies:\s*\[[\s\S]*?\]/g,
  /hardcoded/gi,
  /static.*strategies/gi,
  /mock.*data/gi,
  /dummy.*data/gi,
  /sample.*strategies/gi,
  /default.*strategies.*\[/gi
];

const ALLOWED_PATTERNS = [
  /test/i,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /node_modules/
];

const UI_SOURCE_DIR = path.join(__dirname, '../../src');

function searchForStaticData(dir, issues = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      searchForStaticData(filePath, issues);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
      // Skip test files
      if (ALLOWED_PATTERNS.some(pattern => pattern.test(filePath))) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      
      STATIC_DATA_PATTERNS.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Check if it's actually defining static strategy data
            if (match.includes('{') && (match.includes('id') || match.includes('name') || match.includes('description'))) {
              issues.push({
                file: path.relative(UI_SOURCE_DIR, filePath),
                pattern: pattern.toString(),
                match: match.substring(0, 100) + '...',
                line: content.substring(0, content.indexOf(match)).split('\n').length
              });
            }
          });
        }
      });
    }
  });

  return issues;
}

function main() {
  console.log(chalk.blue.bold('\nVerifying Dynamic Data Usage in UI\n'));

  if (!fs.existsSync(UI_SOURCE_DIR)) {
    console.log(chalk.red('✗ UI source directory not found:', UI_SOURCE_DIR));
    process.exit(1);
  }

  console.log(chalk.yellow('Scanning for static data patterns...\n'));

  const issues = searchForStaticData(UI_SOURCE_DIR);

  if (issues.length === 0) {
    console.log(chalk.green('✓ No static data patterns found!'));
    console.log(chalk.green('✓ UI appears to be loading all data dynamically from MCP\n'));
    
    console.log(chalk.blue('Verified patterns checked:'));
    STATIC_DATA_PATTERNS.forEach(pattern => {
      console.log(chalk.gray(`  - ${pattern.toString()}`));
    });
    
    process.exit(0);
  } else {
    console.log(chalk.red(`✗ Found ${issues.length} potential static data patterns:\n`));
    
    issues.forEach((issue, index) => {
      console.log(chalk.red(`${index + 1}. ${issue.file}:${issue.line}`));
      console.log(chalk.gray(`   Pattern: ${issue.pattern}`));
      console.log(chalk.gray(`   Match: ${issue.match}`));
      console.log();
    });

    console.log(chalk.yellow('\nPlease review these patterns to ensure they are not hardcoded strategy data.'));
    console.log(chalk.yellow('If they are test data or comments, they can be ignored.\n'));
    
    process.exit(1);
  }
}

main();