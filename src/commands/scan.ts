/**
 * Scan Command
 * Scans a directory and generates tests for all components/functions
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { glob } from 'glob';
import { analyzeFile } from '../analyzer';
import { generateTest } from '../generator';
import type { GeneratorOptions, GeneratedTest } from '../types';

interface ScanOptions {
  pattern?: string;
  exclude?: string[];
  dryRun?: boolean;
  snapshot?: boolean;
  overwrite?: boolean;
}

interface ScanResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  files: GeneratedTest[];
  errors: Array<{ file: string; error: string }>;
}

/**
 * Scan a directory and generate tests for all files
 */
export async function scanCommand(
  directory: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const {
    pattern = '**/*.{ts,tsx,js,jsx}',
    exclude = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/coverage/**',
    ],
    dryRun = false,
    snapshot = false,
    overwrite = false,
  } = options;

  const cwd = process.cwd();
  const targetDir = path.resolve(cwd, directory);

  // Check if directory exists
  if (!(await fs.pathExists(targetDir))) {
    throw new Error(`Directory not found: ${targetDir}`);
  }

  console.log('');
  console.log(chalk.cyan('🔍 Scanning directory:'), targetDir);
  console.log(chalk.cyan('📝 Pattern:'), pattern);
  console.log(chalk.cyan('🚫 Exclude:'), exclude.join(', '));
  if (dryRun) {
    console.log(chalk.yellow('⚠️  Dry run mode - no files will be created'));
  }
  console.log('');

  // Find all matching files
  const spinner = ora('Finding files...').start();

  const files = await glob(pattern, {
    cwd: targetDir,
    ignore: exclude,
    absolute: true,
    nodir: true,
  });

  spinner.succeed(`Found ${files.length} files`);

  if (files.length === 0) {
    console.log(chalk.yellow('No files found matching the pattern.'));
    return {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      files: [],
      errors: [],
    };
  }

  // Process each file
  const result: ScanResult = {
    total: files.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    files: [],
    errors: [],
  };

  console.log('');
  console.log(chalk.cyan('📦 Processing files...'));
  console.log('');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = path.relative(cwd, file);
    const progress = `[${i + 1}/${files.length}]`;

    try {
      // Analyze the file
      const analysis = await analyzeFile(file);

      // Skip files with no components or functions
      if (analysis.components.length === 0 && analysis.functions.length === 0) {
        console.log(chalk.gray(`${progress} ⏭️  ${relativePath} (no components/functions)`));
        result.skipped++;
        continue;
      }

      // Generate test (or preview in dry-run mode)
      if (dryRun) {
        const testPath = getTestFilePath(file);
        const exists = await fs.pathExists(testPath);
        console.log(
          chalk.blue(`${progress} 👁️  ${relativePath}`) +
            chalk.gray(` → ${path.relative(cwd, testPath)}`) +
            (exists ? chalk.yellow(' (exists)') : chalk.green(' (new)'))
        );
        result.files.push({
          code: '',
          outputPath: testPath,
          sourcePath: file,
          action: exists ? 'skipped' : 'created',
        });
      } else {
        const generatorOptions: GeneratorOptions = {
          snapshot,
          overwrite,
          mock: true,
        };

        const testResult = await generateTest(analysis, generatorOptions);
        result.files.push(testResult);

        const icon = testResult.action === 'created' ? '✅' : testResult.action === 'updated' ? '🔄' : '⏭️';
        const color = testResult.action === 'created' ? chalk.green : testResult.action === 'updated' ? chalk.blue : chalk.gray;

        console.log(
          color(`${progress} ${icon} ${relativePath}`) +
            chalk.gray(` → ${path.relative(cwd, testResult.outputPath)}`)
        );

        if (testResult.action === 'created') result.created++;
        else if (testResult.action === 'updated') result.updated++;
        else result.skipped++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(chalk.red(`${progress} ❌ ${relativePath}: ${errorMessage}`));
      result.failed++;
      result.errors.push({ file: relativePath, error: errorMessage });
    }
  }

  // Summary
  console.log('');
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(chalk.cyan('📊 Summary'));
  console.log(chalk.cyan('═'.repeat(50)));
  console.log(`   Total files:    ${result.total}`);
  console.log(chalk.green(`   Created:        ${result.created}`));
  console.log(chalk.blue(`   Updated:        ${result.updated}`));
  console.log(chalk.gray(`   Skipped:        ${result.skipped}`));
  console.log(chalk.red(`   Failed:         ${result.failed}`));
  console.log('');

  if (dryRun) {
    console.log(chalk.yellow('💡 This was a dry run. Run without --dry-run to create files.'));
    console.log('');
  }

  return result;
}

/**
 * Get test file path for a source file
 */
function getTestFilePath(sourcePath: string): string {
  const ext = path.extname(sourcePath);
  const baseName = path.basename(sourcePath, ext);
  const dirName = path.dirname(sourcePath);
  return path.join(dirName, `${baseName}.test${ext}`);
}

export default scanCommand;

