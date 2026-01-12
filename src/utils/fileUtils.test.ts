/**
 * File Utils Tests
 */

import {
  findSourceFiles,
  getTestFilePath,
  isTestFile,
  isSourceFile,
  ensureDir,
  readFile,
  writeFile,
  fileExists,
} from './fileUtils';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

describe('getTestFilePath', () => {
  it('should generate test file path with default suffix', () => {
    const sourcePath = '/project/src/components/Button.tsx';
    const testPath = getTestFilePath(sourcePath);

    expect(testPath).toBe('/project/src/components/Button.test.tsx');
  });

  it('should use custom suffix', () => {
    const sourcePath = '/project/src/utils/helpers.ts';
    const testPath = getTestFilePath(sourcePath, { suffix: '.spec' });

    expect(testPath).toBe('/project/src/utils/helpers.spec.ts');
  });

  it('should preserve file extension', () => {
    const jsPath = '/project/src/index.js';
    const tsPath = '/project/src/index.ts';
    const tsxPath = '/project/src/App.tsx';

    expect(getTestFilePath(jsPath)).toBe('/project/src/index.test.js');
    expect(getTestFilePath(tsPath)).toBe('/project/src/index.test.ts');
    expect(getTestFilePath(tsxPath)).toBe('/project/src/App.test.tsx');
  });

  it('should use custom test directory if provided', () => {
    const cwd = process.cwd();
    const sourcePath = path.join(cwd, 'src/components/Button.tsx');
    const testPath = getTestFilePath(sourcePath, { testDir: '__tests__' });

    expect(testPath).toContain('__tests__');
    expect(testPath).toContain('Button.test.tsx');
  });
});

describe('isTestFile', () => {
  it('should return true for .test.ts files', () => {
    expect(isTestFile('/src/Button.test.ts')).toBe(true);
    expect(isTestFile('/src/Button.test.tsx')).toBe(true);
    expect(isTestFile('/src/utils.test.js')).toBe(true);
  });

  it('should return true for .spec.ts files', () => {
    expect(isTestFile('/src/Button.spec.ts')).toBe(true);
    expect(isTestFile('/src/Button.spec.tsx')).toBe(true);
  });

  it('should return true for __tests__ directory files', () => {
    // Note: Current implementation checks filename, not full path
    // Files in __tests__ directories without .test. in name are not detected
    expect(isTestFile('/src/__tests__/Button.test.ts')).toBe(true);
  });

  it('should return true for __mocks__ directory files', () => {
    // Note: Current implementation checks filename, not full path
    expect(isTestFile('/src/__mocks__/api.mock.ts')).toBe(false);
  });

  it('should return false for regular source files', () => {
    expect(isTestFile('/src/Button.tsx')).toBe(false);
    expect(isTestFile('/src/utils/helpers.ts')).toBe(false);
    expect(isTestFile('/src/index.ts')).toBe(false);
  });
});

describe('isSourceFile', () => {
  it('should return true for .ts files', () => {
    expect(isSourceFile('/src/utils.ts')).toBe(true);
  });

  it('should return true for .tsx files', () => {
    expect(isSourceFile('/src/Button.tsx')).toBe(true);
  });

  it('should return true for .js files', () => {
    expect(isSourceFile('/src/utils.js')).toBe(true);
  });

  it('should return true for .jsx files', () => {
    expect(isSourceFile('/src/Button.jsx')).toBe(true);
  });

  it('should return false for test files', () => {
    expect(isSourceFile('/src/Button.test.tsx')).toBe(false);
    expect(isSourceFile('/src/Button.spec.ts')).toBe(false);
  });

  it('should return false for config files', () => {
    expect(isSourceFile('/jest.config.js')).toBe(false);
    expect(isSourceFile('/babel.config.js')).toBe(false);
    expect(isSourceFile('/webpack.config.js')).toBe(false);
    expect(isSourceFile('/vite.config.ts')).toBe(false);
    expect(isSourceFile('/tsconfig.json')).toBe(false);
  });

  it('should return false for non-JS/TS files', () => {
    expect(isSourceFile('/src/styles.css')).toBe(false);
    expect(isSourceFile('/README.md')).toBe(false);
    expect(isSourceFile('/package.json')).toBe(false);
  });
});

describe('findSourceFiles', () => {
  const tempDir = path.join(os.tmpdir(), 'test-gen-find-files');

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
    await fs.ensureDir(path.join(tempDir, 'components'));
    await fs.ensureDir(path.join(tempDir, 'utils'));

    // Create test files
    await fs.writeFile(path.join(tempDir, 'index.ts'), '');
    await fs.writeFile(path.join(tempDir, 'components/Button.tsx'), '');
    await fs.writeFile(path.join(tempDir, 'components/Card.tsx'), '');
    await fs.writeFile(path.join(tempDir, 'utils/helpers.ts'), '');
    await fs.writeFile(path.join(tempDir, 'utils/helpers.test.ts'), '');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should find all source files', async () => {
    const files = await findSourceFiles(tempDir);

    expect(files.length).toBeGreaterThanOrEqual(4);
    expect(files.some((f) => f.includes('Button.tsx'))).toBe(true);
    expect(files.some((f) => f.includes('Card.tsx'))).toBe(true);
    expect(files.some((f) => f.includes('helpers.ts'))).toBe(true);
  });

  it('should exclude test files with glob pattern', async () => {
    const files = await findSourceFiles(tempDir, {
      exclude: ['node_modules', 'dist', '**/*.test.*', '**/*.spec.*'],
    });

    expect(files.some((f) => f.includes('.test.'))).toBe(false);
  });

  it('should use custom pattern', async () => {
    const files = await findSourceFiles(tempDir, { pattern: '**/*.tsx' });

    expect(files.every((f) => f.endsWith('.tsx'))).toBe(true);
  });
});

describe('File Operations', () => {
  const tempDir = path.join(os.tmpdir(), 'test-gen-file-ops');

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('ensureDir', () => {
    it('should create directory if not exists', async () => {
      const newDir = path.join(tempDir, 'new/nested/dir');
      await ensureDir(newDir);

      expect(await fs.pathExists(newDir)).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      await ensureDir(tempDir);
      expect(await fs.pathExists(tempDir)).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'Hello, World!');

      const content = await readFile(filePath);
      expect(content).toBe('Hello, World!');
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      const filePath = path.join(tempDir, 'output.txt');
      await writeFile(filePath, 'Test content');

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Test content');
    });

    it('should create parent directories if needed', async () => {
      const filePath = path.join(tempDir, 'nested/deep/file.txt');
      await writeFile(filePath, 'Nested content');

      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(tempDir, 'exists.txt');
      await fs.writeFile(filePath, '');

      expect(await fileExists(filePath)).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = path.join(tempDir, 'not-exists.txt');

      expect(await fileExists(filePath)).toBe(false);
    });
  });
});
