/**
 * Watch Command
 * Watches for file changes and auto-generates tests
 */

import path from 'path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { analyzeFile } from '../analyzer';
import { generateTest } from '../generator';
import type { TestRunner } from '../types';

interface WatchOptions {
  pattern?: string;
  exclude?: string[];
  snapshot?: boolean;
  overwrite?: boolean;
  testRunner?: TestRunner;
}

/**
 * Watch a directory and auto-generate tests on file changes
 */
export async function watchCommand(
  directory: string,
  options: WatchOptions = {}
): Promise<void> {
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
    snapshot = false,
    overwrite = false,
    testRunner = 'jest',
  } = options;

  const cwd = process.cwd();
  const targetDir = path.resolve(cwd, directory);

  console.log('');
  console.log(chalk.cyan('👀 Watch mode started'));
  console.log(chalk.cyan('📁 Directory:'), targetDir);
  console.log(chalk.cyan('📝 Pattern:'), pattern);
  console.log(chalk.cyan('🧪 Test Runner:'), testRunner);
  console.log(chalk.gray('Press Ctrl+C to stop'));
  console.log('');

  // Create watcher
  const watcher = chokidar.watch(pattern, {
    cwd: targetDir,
    ignored: exclude,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  // Debounce map to prevent multiple triggers
  const pendingFiles = new Map<string, NodeJS.Timeout>();

  const processFile = async (filePath: string) => {
    const absolutePath = path.resolve(targetDir, filePath);
    const relativePath = path.relative(cwd, absolutePath);

    try {
      // Analyze the file
      const analysis = await analyzeFile(absolutePath);

      // Skip files with no components or functions
      if (analysis.components.length === 0 && analysis.functions.length === 0) {
        console.log(chalk.gray(`⏭️  ${relativePath} (no components/functions)`));
        return;
      }

      // Generate test
      const result = await generateTest(analysis, {
        snapshot,
        overwrite,
        mock: true,
        testRunner,
      });

      const icon =
        result.action === 'created' ? '✅' : result.action === 'updated' ? '🔄' : '⏭️';
      const color =
        result.action === 'created'
          ? chalk.green
          : result.action === 'updated'
            ? chalk.blue
            : chalk.gray;

      const testRelativePath = path.relative(cwd, result.outputPath);
      console.log(color(`${icon} ${relativePath} → ${testRelativePath}`));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(chalk.red(`❌ ${relativePath}: ${errorMessage}`));
    }
  };

  const debouncedProcess = (filePath: string) => {
    // Clear existing timeout
    const existing = pendingFiles.get(filePath);
    if (existing) {
      clearTimeout(existing);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      pendingFiles.delete(filePath);
      processFile(filePath);
    }, 500);

    pendingFiles.set(filePath, timeout);
  };

  // Watch events
  watcher.on('add', (filePath) => {
    console.log(chalk.cyan(`📄 New file: ${filePath}`));
    debouncedProcess(filePath);
  });

  watcher.on('change', (filePath) => {
    console.log(chalk.yellow(`📝 Changed: ${filePath}`));
    debouncedProcess(filePath);
  });

  watcher.on('ready', () => {
    console.log(chalk.green('✔ Watching for changes...'));
    console.log('');
  });

  watcher.on('error', (error) => {
    console.error(chalk.red('Watch error:'), error);
  });

  // Keep process running
  process.on('SIGINT', () => {
    console.log('');
    console.log(chalk.cyan('👋 Watch mode stopped'));
    watcher.close();
    process.exit(0);
  });
}

export default watchCommand;
