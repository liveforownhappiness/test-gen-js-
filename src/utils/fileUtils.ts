/**
 * File Utilities
 * Helper functions for file operations
 */

import path from 'path';
import fs from 'fs-extra';
import { glob } from 'glob';

/**
 * Find all source files in a directory
 */
export async function findSourceFiles(
  directory: string,
  options: {
    pattern?: string;
    exclude?: string[];
  } = {}
): Promise<string[]> {
  const { pattern = '**/*.{ts,tsx,js,jsx}', exclude = ['node_modules', 'dist', '*.test.*', '*.spec.*'] } = options;

  const files = await glob(pattern, {
    cwd: directory,
    ignore: exclude,
    absolute: true,
  });

  return files;
}

/**
 * Get test file path for a source file
 */
export function getTestFilePath(
  sourcePath: string,
  options: {
    suffix?: string;
    testDir?: string;
  } = {}
): string {
  const { suffix = '.test', testDir } = options;
  const ext = path.extname(sourcePath);
  const baseName = path.basename(sourcePath, ext);
  const dirName = path.dirname(sourcePath);

  const testFileName = `${baseName}${suffix}${ext}`;

  if (testDir) {
    // Use custom test directory
    const relativePath = path.relative(process.cwd(), dirName);
    return path.join(testDir, relativePath, testFileName);
  }

  // Place test file next to source file
  return path.join(dirName, testFileName);
}

/**
 * Check if a file is a test file
 */
export function isTestFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return (
    fileName.includes('.test.') ||
    fileName.includes('.spec.') ||
    fileName.includes('__tests__') ||
    fileName.includes('__mocks__')
  );
}

/**
 * Check if a file is a source file (not test, not config)
 */
export function isSourceFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];

  if (!validExtensions.includes(ext)) {
    return false;
  }

  if (isTestFile(filePath)) {
    return false;
  }

  const fileName = path.basename(filePath);
  const configPatterns = [
    'jest.config',
    'babel.config',
    'webpack.config',
    'vite.config',
    'tsconfig',
    '.eslintrc',
    '.prettierrc',
  ];

  return !configPatterns.some((pattern) => fileName.includes(pattern));
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Read file content
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Write file content
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

