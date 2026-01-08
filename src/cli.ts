#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { analyzeFile } from './analyzer';
import { generateTest } from './generator';
import { initCommand } from './commands';
import type { GeneratorOptions } from './types';

const program = new Command();

program
  .name('test-gen-js')
  .description('Auto-generate test boilerplate code for JavaScript/TypeScript projects')
  .version('0.1.0');

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
  .action(async (file: string, options: GeneratorOptions & { template: string }) => {
    const spinner = ora('Analyzing file...').start();

    try {
      // Analyze the source file
      const analysis = await analyzeFile(file);
      spinner.text = 'Generating tests...';

      // Generate test code
      const result = await generateTest(analysis, {
        output: options.output,
        snapshot: options.snapshot,
        mock: options.mock,
        overwrite: options.overwrite,
      });

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
  });

// Scan command
program
  .command('scan <directory>')
  .alias('s')
  .description('Scan directory and generate tests for all files')
  .option('--dry-run', 'Preview without creating files', false)
  .option('--pattern <glob>', 'File pattern to match', '**/*.{ts,tsx,js,jsx}')
  .option('--exclude <patterns...>', 'Patterns to exclude', ['node_modules', 'dist', '*.test.*', '*.spec.*'])
  .action(async (directory: string, options) => {
    const spinner = ora('Scanning directory...').start();

    try {
      // TODO: Implement directory scanning
      spinner.info(chalk.yellow('Directory scanning is coming in v0.2.0'));
      console.log('');
      console.log(chalk.cyan('Directory:'), directory);
      console.log(chalk.cyan('Pattern:'), options.pattern);
      console.log(chalk.cyan('Exclude:'), options.exclude.join(', '));
      console.log(chalk.cyan('Dry run:'), options.dryRun);
    } catch (error) {
      spinner.fail(chalk.red('Failed to scan directory'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
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

program.parse();

