/**
 * Configuration Loader Tests
 */

import { loadConfig, mergeConfigWithOptions, findConfigFile } from './configLoader';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `test-gen-config-${Date.now()}-${Math.random()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    if (tempDir && (await fs.pathExists(tempDir))) {
      await fs.remove(tempDir);
    }
  });

  it('should return null if config file does not exist', async () => {
    const config = await loadConfig(tempDir);
    expect(config).toBeNull();
  });

  it('should load valid config file', async () => {
    const configPath = path.join(tempDir, '.testgenrc.js');
    const configContent = `module.exports = {
      include: ['src/**/*.ts'],
      exclude: ['node_modules'],
      generator: {
        snapshot: true,
        mock: false,
        testSuffix: '.spec',
        overwrite: true,
        testRunner: 'vitest',
      },
      templates: {
        dir: './custom-templates',
      },
    };`;

    await fs.writeFile(configPath, configContent);

    // Clear require cache before loading
    if (require.cache[require.resolve(configPath)]) {
      delete require.cache[require.resolve(configPath)];
    }

    const config = await loadConfig(tempDir);

    expect(config).not.toBeNull();
    expect(config?.include).toEqual(['src/**/*.ts']);
    expect(config?.exclude).toEqual(['node_modules']);
    expect(config?.generator?.snapshot).toBe(true);
    expect(config?.generator?.mock).toBe(false);
    expect(config?.generator?.testSuffix).toBe('.spec');
    expect(config?.generator?.overwrite).toBe(true);
    expect(config?.generator?.testRunner).toBe('vitest');
    expect(config?.templatesDir).toBe('./custom-templates');
  });

  it('should handle partial config', async () => {
    const configContent = `module.exports = {
      generator: {
        snapshot: true,
      },
    };`;

    const configPath = path.join(tempDir, '.testgenrc.js');
    await fs.writeFile(configPath, configContent);

    // Clear require cache
    if (require.cache[require.resolve(configPath)]) {
      delete require.cache[require.resolve(configPath)];
    }

    const config = await loadConfig(tempDir);

    expect(config).not.toBeNull();
    expect(config?.generator?.snapshot).toBe(true);
    expect(config?.include).toBeUndefined();
  });

  it('should filter invalid values', async () => {
    const configContent = `module.exports = {
      include: ['valid', 123, null, 'also-valid'],
      exclude: ['valid-exclude', false],
      generator: {
        snapshot: 'not-boolean',
        mock: true,
      },
    };`;

    const configPath = path.join(tempDir, '.testgenrc.js');
    await fs.writeFile(configPath, configContent);

    // Clear require cache
    if (require.cache[require.resolve(configPath)]) {
      delete require.cache[require.resolve(configPath)];
    }

    const config = await loadConfig(tempDir);

    expect(config?.include).toEqual(['valid', 'also-valid']);
    expect(config?.exclude).toEqual(['valid-exclude']);
    expect(config?.generator?.snapshot).toBeUndefined();
    expect(config?.generator?.mock).toBe(true);
  });

  it('should throw error for invalid config file', async () => {
    const configPath = path.join(tempDir, '.testgenrc.js');
    await fs.writeFile(configPath, 'module.exports = { invalid: syntax {');

    // Clear require cache
    if (require.cache[require.resolve(configPath)]) {
      delete require.cache[require.resolve(configPath)];
    }

    await expect(loadConfig(tempDir)).rejects.toThrow();
  });
});

describe('mergeConfigWithOptions', () => {
  it('should merge config with options', () => {
    const config = {
      generator: {
        snapshot: true,
        mock: false,
        testSuffix: '.spec',
        overwrite: false,
        testRunner: 'vitest' as const,
      },
      templatesDir: './templates', // This is set by normalizeConfig from templates.dir
    };

    const options = {
      snapshot: false,
      mock: true,
    };

    const merged = mergeConfigWithOptions(config, options);

    expect(merged.snapshot).toBe(false); // CLI option takes precedence
    expect(merged.mock).toBe(true); // CLI option takes precedence
    expect(merged.testSuffix).toBe('.spec'); // From config
    expect(merged.overwrite).toBe(false); // From config
    expect(merged.testRunner).toBe('vitest'); // From config
    expect(merged.templatesDir).toBe('./templates'); // From config
  });

  it('should use config when no options provided', () => {
    const config = {
      generator: {
        snapshot: true,
        mock: false,
        testRunner: 'vitest' as const,
      },
    };

    const merged = mergeConfigWithOptions(config, {});

    expect(merged.snapshot).toBe(true);
    expect(merged.mock).toBe(false);
    expect(merged.testRunner).toBe('vitest');
  });

  it('should use defaults when no config provided', () => {
    const merged = mergeConfigWithOptions(null, {
      snapshot: true,
      mock: false,
    });

    expect(merged.snapshot).toBe(true);
    expect(merged.mock).toBe(false);
  });

  it('should handle all option types', () => {
    const config = {
      generator: {
        snapshot: false,
        mock: true,
        testSuffix: '.test',
        overwrite: false,
        testRunner: 'jest' as const,
      },
      templatesDir: './config-templates',
    };

    const options = {
      snapshot: true,
      mock: false,
      testSuffix: '.spec',
      overwrite: true,
      testRunner: 'vitest' as const,
      templatesDir: './cli-templates',
      output: './output.test.ts',
    };

    const merged = mergeConfigWithOptions(config, options);

    expect(merged.snapshot).toBe(true);
    expect(merged.mock).toBe(false);
    expect(merged.testSuffix).toBe('.spec');
    expect(merged.overwrite).toBe(true);
    expect(merged.testRunner).toBe('vitest');
    expect(merged.templatesDir).toBe('./cli-templates');
    expect(merged.output).toBe('./output.test.ts');
  });
});

describe('findConfigFile', () => {
  const tempDir = path.join(os.tmpdir(), 'test-gen-find-config');
  const subDir = path.join(tempDir, 'sub', 'nested');

  beforeEach(async () => {
    await fs.ensureDir(subDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should find config file in current directory', async () => {
    await fs.writeFile(path.join(tempDir, '.testgenrc.js'), 'module.exports = {};');

    const configPath = await findConfigFile(tempDir);

    expect(configPath).toBe(path.join(tempDir, '.testgenrc.js'));
  });

  it('should find config file in parent directory', async () => {
    await fs.writeFile(path.join(tempDir, '.testgenrc.js'), 'module.exports = {};');

    const configPath = await findConfigFile(subDir);

    expect(configPath).toBe(path.join(tempDir, '.testgenrc.js'));
  });

  it('should return null if no config file found', async () => {
    const configPath = await findConfigFile(subDir);

    expect(configPath).toBeNull();
  });

  it('should find nearest config file', async () => {
    // Create config in parent
    await fs.writeFile(path.join(tempDir, '.testgenrc.js'), 'module.exports = { parent: true };');

    // Create config in subdirectory
    const subConfigPath = path.join(tempDir, 'sub', '.testgenrc.js');
    await fs.writeFile(subConfigPath, 'module.exports = { sub: true };');

    // Should find the one in sub directory (closer)
    const configPath = await findConfigFile(path.join(tempDir, 'sub', 'nested'));

    expect(configPath).toBe(subConfigPath);
  });
});
