/**
 * Configuration Loader
 * Loads and validates .testgenrc.js configuration file
 */

import fs from 'fs-extra';
import path from 'path';
import type { Config, GeneratorOptions } from '../types';

/**
 * Load configuration from .testgenrc.js file
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<Config | null> {
  const configPath = path.join(cwd, '.testgenrc.js');

  // Check if config file exists
  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  try {
    // Delete require cache to allow hot reloading during development
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    delete require.cache[require.resolve(configPath)];

    // Load config file (CommonJS module)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(configPath);

    // Validate and normalize config
    return normalizeConfig(config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load configuration from .testgenrc.js: ${errorMessage}`);
  }
}

/**
 * Normalize and validate configuration object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeConfig(config: any): Config {
  const normalized: Config = {};

  // Include patterns
  if (config.include && Array.isArray(config.include)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    normalized.include = config.include.filter((p: any) => typeof p === 'string');
  }

  // Exclude patterns
  if (config.exclude && Array.isArray(config.exclude)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    normalized.exclude = config.exclude.filter((p: any) => typeof p === 'string');
  }

  // Generator options
  if (config.generator && typeof config.generator === 'object') {
    normalized.generator = {} as GeneratorOptions;

    if (typeof config.generator.snapshot === 'boolean') {
      normalized.generator.snapshot = config.generator.snapshot;
    }

    if (typeof config.generator.mock === 'boolean') {
      normalized.generator.mock = config.generator.mock;
    }

    if (typeof config.generator.testSuffix === 'string') {
      normalized.generator.testSuffix = config.generator.testSuffix;
    }

    if (typeof config.generator.overwrite === 'boolean') {
      normalized.generator.overwrite = config.generator.overwrite;
    }

    if (config.generator.testRunner === 'jest' || config.generator.testRunner === 'vitest') {
      normalized.generator.testRunner = config.generator.testRunner;
    }
  }

  // Template options
  if (config.templates && typeof config.templates === 'object' && config.templates.dir) {
    normalized.templatesDir = config.templates.dir;
  }

  return normalized;
}

/**
 * Merge configuration with command-line options
 * CLI options take precedence over config file
 */
export function mergeConfigWithOptions(
  config: Config | null,
  options: Partial<GeneratorOptions>
): GeneratorOptions {
  const merged: GeneratorOptions = {};

  // Start with config defaults
  if (config?.generator) {
    Object.assign(merged, config.generator);
  }

  // Add templatesDir from config if present
  if (config?.templatesDir) {
    merged.templatesDir = config.templatesDir;
  }

  // Override with CLI options (CLI takes precedence)
  if (options.snapshot !== undefined) {
    merged.snapshot = options.snapshot;
  }
  if (options.mock !== undefined) {
    merged.mock = options.mock;
  }
  if (options.testSuffix !== undefined) {
    merged.testSuffix = options.testSuffix;
  }
  if (options.overwrite !== undefined) {
    merged.overwrite = options.overwrite;
  }
  if (options.testRunner !== undefined) {
    merged.testRunner = options.testRunner;
  }
  if (options.templatesDir !== undefined) {
    merged.templatesDir = options.templatesDir;
  }
  if (options.output !== undefined) {
    merged.output = options.output;
  }

  return merged;
}

/**
 * Find config file by walking up the directory tree
 */
export async function findConfigFile(startDir: string = process.cwd()): Promise<string | null> {
  let currentDir = path.resolve(startDir);

  while (currentDir !== path.dirname(currentDir)) {
    const configPath = path.join(currentDir, '.testgenrc.js');
    if (await fs.pathExists(configPath)) {
      return configPath;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}
