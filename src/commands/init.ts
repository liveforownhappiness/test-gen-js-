/**
 * Init Command
 * Sets up test-gen-js configuration and Git hooks for pre-commit testing
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';

interface InitOptions {
  hooks?: boolean;
  force?: boolean;
}

/**
 * Initialize test-gen-js in a project
 */
export async function initCommand(options: InitOptions = {}): Promise<void> {
  const { hooks = true, force = false } = options;
  const cwd = process.cwd();

  console.log('');
  console.log(chalk.cyan('🧪 Initializing test-gen-js...'));
  console.log('');

  // Check if package.json exists
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error('package.json not found. Please run this command in a Node.js project.');
  }

  // Create configuration file
  await createConfigFile(cwd, force);

  // Setup Git hooks if requested
  if (hooks) {
    await setupGitHooks(cwd);
  }

  console.log('');
  console.log(chalk.green('✅ test-gen-js initialized successfully!'));
  console.log('');
  console.log(chalk.cyan('Next steps:'));
  console.log(
    '  1. Generate tests: ' + chalk.yellow('npx test-gen-js generate src/components/Button.tsx')
  );
  console.log('  2. Run tests: ' + chalk.yellow('npm test'));
  console.log('  3. Commit your code - tests will run automatically!');
  console.log('');
}

/**
 * Create .testgenrc.js configuration file
 */
async function createConfigFile(cwd: string, force: boolean): Promise<void> {
  const spinner = ora('Creating configuration file...').start();
  const configPath = path.join(cwd, '.testgenrc.js');

  if ((await fs.pathExists(configPath)) && !force) {
    spinner.info(chalk.yellow('.testgenrc.js already exists. Use --force to overwrite.'));
    return;
  }

  const configContent = `/**
 * test-gen-js configuration
 * @see https://github.com/liveforownhappiness/test-gen-js
 */
module.exports = {
  // File patterns to include
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  
  // File patterns to exclude
  exclude: [
    'node_modules',
    'dist',
    'build',
    '**/*.test.*',
    '**/*.spec.*',
    '**/__tests__/**',
    '**/__mocks__/**',
  ],
  
  // Generator options
  generator: {
    // Include snapshot tests
    snapshot: false,
    
    // Auto-generate mocks
    mock: true,
    
    // Test file suffix (.test or .spec)
    testSuffix: '.test',
    
    // Overwrite existing test files
    overwrite: false,
  },
  
  // Template options
  templates: {
    // Custom templates directory (optional)
    // dir: './templates',
  },
};
`;

  await fs.writeFile(configPath, configContent);
  spinner.succeed(chalk.green('Created .testgenrc.js'));
}

/**
 * Setup Git hooks with husky and lint-staged
 */
async function setupGitHooks(cwd: string): Promise<void> {
  const spinner = ora('Setting up Git hooks...').start();
  const packageJsonPath = path.join(cwd, 'package.json');

  try {
    // Read package.json
    const packageJson = await fs.readJson(packageJsonPath);

    // Check if husky is already installed
    const hasHusky = packageJson.devDependencies?.husky || packageJson.dependencies?.husky;
    const hasLintStaged =
      packageJson.devDependencies?.['lint-staged'] || packageJson.dependencies?.['lint-staged'];

    // Install husky and lint-staged if not present
    if (!hasHusky || !hasLintStaged) {
      spinner.text = 'Installing husky and lint-staged...';

      const packagesToInstall = [];
      if (!hasHusky) packagesToInstall.push('husky');
      if (!hasLintStaged) packagesToInstall.push('lint-staged');

      try {
        execSync(`npm install -D ${packagesToInstall.join(' ')}`, {
          cwd,
          stdio: 'pipe',
        });
      } catch {
        spinner.warn(chalk.yellow('Could not install packages automatically. Please run:'));
        console.log(chalk.cyan(`  npm install -D ${packagesToInstall.join(' ')}`));
      }
    }

    // Re-read package.json after potential install
    const updatedPackageJson = await fs.readJson(packageJsonPath);

    // Add lint-staged configuration
    if (!updatedPackageJson['lint-staged']) {
      updatedPackageJson['lint-staged'] = {
        '*.{ts,tsx,js,jsx}': ['npm test -- --bail --findRelatedTests --passWithNoTests'],
      };
    }

    // Add prepare script for husky
    if (!updatedPackageJson.scripts) {
      updatedPackageJson.scripts = {};
    }
    if (!updatedPackageJson.scripts.prepare) {
      updatedPackageJson.scripts.prepare = 'husky install';
    }

    // Write updated package.json
    await fs.writeJson(packageJsonPath, updatedPackageJson, { spaces: 2 });

    // Initialize husky
    spinner.text = 'Initializing husky...';
    const huskyDir = path.join(cwd, '.husky');

    if (!(await fs.pathExists(huskyDir))) {
      try {
        execSync('npx husky install', { cwd, stdio: 'pipe' });
      } catch {
        // husky install might fail if .git doesn't exist, that's ok
      }
    }

    // Create pre-commit hook
    spinner.text = 'Creating pre-commit hook...';
    await fs.ensureDir(huskyDir);

    const preCommitPath = path.join(huskyDir, 'pre-commit');
    const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🧪 Running tests before commit..."
npx lint-staged
`;

    await fs.writeFile(preCommitPath, preCommitContent);
    await fs.chmod(preCommitPath, '755');

    // Create husky.sh helper if it doesn't exist
    const huskyHelperDir = path.join(huskyDir, '_');
    await fs.ensureDir(huskyHelperDir);

    const huskyShPath = path.join(huskyHelperDir, 'husky.sh');
    if (!(await fs.pathExists(huskyShPath))) {
      const huskyShContent = `#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename -- "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi

  readonly husky_skip_init=1
  export husky_skip_init
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  if [ $exitCode = 127 ]; then
    echo "husky - command not found in PATH=$PATH"
  fi

  exit $exitCode
fi
`;
      await fs.writeFile(huskyShPath, huskyShContent);
      await fs.chmod(huskyShPath, '755');
    }

    spinner.succeed(chalk.green('Git hooks configured!'));
    console.log('');
    console.log(chalk.cyan('📋 What was set up:'));
    console.log('  • ' + chalk.yellow('husky') + ' - Git hooks manager');
    console.log('  • ' + chalk.yellow('lint-staged') + ' - Run tests on staged files');
    console.log('  • ' + chalk.yellow('pre-commit hook') + ' - Tests run before each commit');
    console.log('');
    console.log(chalk.cyan('💡 How it works:'));
    console.log(
      '  When you run ' +
        chalk.yellow('git commit') +
        ', tests for changed files will run automatically.'
    );
    console.log('  If tests fail, the commit will be blocked.');
  } catch (error) {
    spinner.fail(chalk.red('Failed to setup Git hooks'));
    throw error;
  }
}

export default initCommand;
