#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { analyzeFile } from './analyzer';
import { generateTest } from './generator';
import { initCommand, scanCommand, watchCommand } from './commands';
import { loadConfig, mergeConfigWithOptions } from './utils';
import type { GeneratorOptions } from './types';

// Read version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = fs.readJsonSync(packageJsonPath);
const version: string = packageJson.version;

const program = new Command();

program
  .name('test-gen-js')
  .description('Auto-generate test boilerplate code for JavaScript/TypeScript projects')
  .version(version);

// Generate command
program
  .command('generate <file>')
  .alias('g')
  .description('Generate test file for a component or function')
  .option('-o, --output <path>', 'Output path for test file')
  .option('-t, --template <type>', 'Template type: component | function | hook', 'auto')
  .option('--snapshot', 'Include snapshot tests', false)
  .option('--mock', 'Auto-generate mocks for dependencies', true)
  .option('--overwrite', 'Overwrite existing test file', false)
  .option('--vitest', 'Use Vitest instead of Jest', false)
  .option('--templates-dir <path>', 'Custom templates directory')
  .action(
    async (
      file: string,
      options: GeneratorOptions & { template: string; vitest: boolean; templatesDir?: string }
    ) => {
      const spinner = ora('Analyzing file...').start();

      try {
        // Load config file
        const config = await loadConfig();

        // Merge config with CLI options (CLI takes precedence)
        const mergedOptions = mergeConfigWithOptions(config, {
          output: options.output,
          snapshot: options.snapshot,
          mock: options.mock,
          overwrite: options.overwrite,
          testRunner: options.vitest ? 'vitest' : 'jest',
          templatesDir: options.templatesDir,
        });

        // Analyze the source file
        const analysis = await analyzeFile(file);
        spinner.text = 'Generating tests...';

        // Generate test code
        const result = await generateTest(analysis, mergedOptions);

        spinner.succeed(chalk.green('Test file generated!'));

        console.log('');
        console.log(chalk.cyan('📄 Source:'), file);
        console.log(chalk.cyan('📝 Output:'), result.outputPath);
        console.log(chalk.cyan('📊 Action:'), result.action);
        console.log('');

        if (analysis.components.length > 0) {
          console.log(chalk.yellow('Components found:'));
          analysis.components.forEach((c) => {
            console.log(`  - ${c.name} (${c.props.length} props, ${c.hooks.length} hooks)`);
          });
        }

        if (analysis.functions.length > 0) {
          console.log(chalk.yellow('Functions found:'));
          analysis.functions.forEach((f) => {
            console.log(`  - ${f.name}(${f.params.map((p) => p.name).join(', ')})`);
          });
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to generate tests'));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    }
  );

// Scan command
program
  .command('scan <directory>')
  .alias('s')
  .description('Scan directory and generate tests for all files')
  .option('--dry-run', 'Preview without creating files', false)
  .option('--pattern <glob>', 'File pattern to match', '**/*.{ts,tsx,js,jsx}')
  .option('--exclude <patterns...>', 'Patterns to exclude')
  .option('--snapshot', 'Include snapshot tests', false)
  .option('--overwrite', 'Overwrite existing test files', false)
  .option('--vitest', 'Use Vitest instead of Jest', false)
  .action(async (directory: string, options) => {
    try {
      // Load config file
      const config = await loadConfig();

      // Merge config with CLI options
      const mergedOptions = mergeConfigWithOptions(config, {
        snapshot: options.snapshot,
        overwrite: options.overwrite,
        testRunner: options.vitest ? 'vitest' : 'jest',
      });

      await scanCommand(directory, {
        pattern: options.pattern || config?.include?.[0] || '**/*.{ts,tsx,js,jsx}',
        exclude: options.exclude || config?.exclude,
        dryRun: options.dryRun,
        snapshot: mergedOptions.snapshot ?? false,
        overwrite: mergedOptions.overwrite ?? false,
        testRunner: mergedOptions.testRunner || 'jest',
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('Error: ' + error.message));
      }
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize test-gen-js configuration and Git hooks')
  .option('--no-hooks', 'Skip Git hooks setup')
  .option('--force', 'Overwrite existing configuration', false)
  .action(async (options: { hooks: boolean; force: boolean }) => {
    try {
      await initCommand({
        hooks: options.hooks,
        force: options.force,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('Error: ' + error.message));
      }
      process.exit(1);
    }
  });

// Watch command
program
  .command('watch <directory>')
  .alias('w')
  .description('Watch directory and auto-generate tests on file changes')
  .option('--pattern <glob>', 'File pattern to match', '**/*.{ts,tsx,js,jsx}')
  .option('--exclude <patterns...>', 'Patterns to exclude')
  .option('--snapshot', 'Include snapshot tests', false)
  .option('--overwrite', 'Overwrite existing test files', false)
  .option('--vitest', 'Use Vitest instead of Jest', false)
  .action(async (directory: string, options) => {
    try {
      // Load config file
      const config = await loadConfig();

      // Merge config with CLI options
      const mergedOptions = mergeConfigWithOptions(config, {
        snapshot: options.snapshot,
        overwrite: options.overwrite,
        testRunner: options.vitest ? 'vitest' : 'jest',
      });

      await watchCommand(directory, {
        pattern: options.pattern || config?.include?.[0] || '**/*.{ts,tsx,js,jsx}',
        exclude: options.exclude || config?.exclude,
        snapshot: mergedOptions.snapshot ?? false,
        overwrite: mergedOptions.overwrite ?? false,
        testRunner: mergedOptions.testRunner || 'jest',
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('Error: ' + error.message));
      }
      process.exit(1);
    }
  });

program.parse();
